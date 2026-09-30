import { test, expect } from '../fixtures'
import { navigateToMode } from '../helpers/common'
import { clickEvaluateButtonWithin, getScoreBadgeValue } from '../helpers/evaluation'
import {
  fillOriginalPrompt,
  clickOptimizeButton,
  expectOptimizedResultNotEmpty,
  expectOutputByTestIdNotEmpty,
} from '../helpers/optimize'

const MODE = 'pro-variable' as const

const VARIABLE_FIXTURES = [
  { name: '任务描述', value: '整理本周 AI 产品迭代进展' },
  { name: '目标用户', value: '产品经理' },
  { name: '文档类型', value: '周报' },
  { name: '质量要求', value: '结构清晰、重点明确、语气专业' },
] as const

async function addTemporaryVariable(
  page: import('@playwright/test').Page,
  name: string,
  value: string,
): Promise<void> {
  await page.getByRole('button', { name: /Add Variable|添加变量/ }).click()

  const dialog = page.locator('.n-dialog:visible').last()
  await expect(dialog).toBeVisible({ timeout: 15000 })

  const textboxes = dialog.getByRole('textbox')
  await textboxes.nth(0).fill(name)
  await textboxes.nth(1).fill(value)
  await dialog.getByRole('button', { name: /Confirm|确定/ }).click()

  await expect(dialog).toBeHidden({ timeout: 15000 })
}

test.describe('Pro Variable - 测试与评估', () => {
  test('填写变量后可触发单结果评估与对比评估', async ({ page }) => {
    test.setTimeout(300000)

    await navigateToMode(page, 'pro', 'variable')

    await fillOriginalPrompt(
      page,
      MODE,
      '请根据{{任务描述}}，为{{目标用户}}编写一份{{文档类型}}，要求{{质量要求}}'
    )

    for (const entry of VARIABLE_FIXTURES) {
      await addTemporaryVariable(page, entry.name, entry.value)
    }

    await clickOptimizeButton(page, MODE)
    await expectOptimizedResultNotEmpty(page, MODE)

    await page.getByTestId('pro-variable-test-run-a').click()
    await expectOutputByTestIdNotEmpty(page, 'pro-variable-test-original-output')

    await page.getByTestId('pro-variable-test-run-b').click()
    await expectOutputByTestIdNotEmpty(page, 'pro-variable-test-optimized-output')

    const originalOutput = page.locator('[data-testid="pro-variable-test-original-output"]:visible').first()
    await clickEvaluateButtonWithin(originalOutput)
    await getScoreBadgeValue(originalOutput, 'result')

    const workspace = page.locator('[data-testid="workspace"][data-mode="pro-variable"]').first()
    const testToolbar = workspace.locator('.test-area-top').first()
    await clickEvaluateButtonWithin(testToolbar)
    await getScoreBadgeValue(testToolbar, 'compare')
  })
})
