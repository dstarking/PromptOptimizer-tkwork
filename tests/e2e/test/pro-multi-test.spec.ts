import { test } from '../fixtures'
import { navigateToMode } from '../helpers/common'
import { clickEvaluateButtonWithin, getScoreBadgeValue } from '../helpers/evaluation'
import {
  addProMultiUserMessage,
  clickProMultiOptimizeButton,
  expectOptimizedResultNotEmpty,
  expectOutputByTestIdNotEmpty,
  selectProMultiMessageForOptimization,
} from '../helpers/optimize'

const MODE = 'pro-multi' as const

test.describe('Pro Multi - 测试与评估', () => {
  test('多消息工作区测试后可触发单结果评估与对比评估', async ({ page }) => {
    test.setTimeout(300000)

    await navigateToMode(page, 'pro', 'multi')

    await addProMultiUserMessage(
      page,
      '请把下面的产品周会信息整理成适合团队同步的更新摘要，要求按进展、风险、下一步三个部分输出。'
    )
    await selectProMultiMessageForOptimization(page, 0)

    await clickProMultiOptimizeButton(page)
    await expectOptimizedResultNotEmpty(page, MODE)

    await page.getByTestId('pro-multi-test-run-a').click()
    await expectOutputByTestIdNotEmpty(page, 'pro-multi-test-original-output')

    await page.getByTestId('pro-multi-test-run-b').click()
    await expectOutputByTestIdNotEmpty(page, 'pro-multi-test-optimized-output')

    const originalOutput = page.locator('[data-testid="pro-multi-test-original-output"]:visible').first()
    await clickEvaluateButtonWithin(originalOutput)
    await getScoreBadgeValue(originalOutput, 'result')

    const workspace = page.locator('[data-testid="workspace"][data-mode="pro-multi"]').first()
    const testToolbar = workspace.locator('.test-area-top').first()
    await clickEvaluateButtonWithin(testToolbar)
    await getScoreBadgeValue(testToolbar, 'compare')
  })
})
