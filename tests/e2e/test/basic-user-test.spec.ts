import { test, expect } from '../fixtures'
import { navigateToMode } from '../helpers/common'
import {
  clickEvaluateButtonWithin,
  getScoreBadgeValue,
  openEvaluationDrawerFromHoverCard,
} from '../helpers/evaluation'
import {
  fillOriginalPrompt,
  clickOptimizeButton,
  expectOptimizedResultNotEmpty,
  expectOutputByTestIdNotEmpty,
} from '../helpers/optimize'

const MODE = 'basic-user' as const
const STALE_COMPARE_MESSAGE =
  /测试或工作区已变更，建议重新对比。|The test setup or workspace has changed\. Re-run the comparison if needed\./i

async function clearWorkspacePrompt(page: import('@playwright/test').Page) {
  const workspaceOutput = page.locator('[data-testid="workspace"][data-mode="basic-user"]').first()
    .locator('[data-testid="basic-user-output"]')
    .first()

  const leftGroupButtons = workspaceOutput.locator('.n-button-group').first().locator('.n-button')
  if ((await leftGroupButtons.count()) >= 2) {
    const sourceButton = leftGroupButtons.nth(1)
    if (!(await sourceButton.isDisabled().catch(() => false))) {
      await sourceButton.click({ timeout: 20000 })
    }
  }

  const textarea = workspaceOutput.locator('textarea')
  if ((await textarea.count()) > 0) {
    await textarea.first().fill('')
    return
  }

  const cmContent = workspaceOutput.locator('.cm-content').first()
  await cmContent.click()
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await page.keyboard.press('Backspace')
}

test.describe('Basic User - 测试（无需填写测试内容）', () => {
  test('优化后直接测试，原始/优化结果都非空', async ({ page }) => {
    test.setTimeout(240000)

    await navigateToMode(page, 'basic', 'user')

    // 1) 左侧优化
    await fillOriginalPrompt(page, MODE, '你是一个诗人')
    await clickOptimizeButton(page, MODE)
    await expectOptimizedResultNotEmpty(page, MODE)

    // 2) 确保列数为 2（避免默认列数变化导致额外请求，影响 VCR fixture 匹配）
    const workspace = page.locator('[data-testid="workspace"][data-mode="basic-user"]').first()
    // Naive UI 的 radio button 真实可点元素是 label；若 value=2 已默认选中，click 会因拦截重试而超时。
    await workspace.getByRole('radio', { name: '2' }).check()

    // 3) 直接点击 Run All（不填写测试内容）
    await page.getByTestId('basic-user-test-run-all').click()

    // 4) 断言两份输出均非空
    await expectOutputByTestIdNotEmpty(page, 'basic-user-test-original-output')
    await expectOutputByTestIdNotEmpty(page, 'basic-user-test-optimized-output')
  })

  test('三列测试后可触发多变体对比评估', async ({ page }) => {
    test.setTimeout(360000)

    await navigateToMode(page, 'basic', 'user')

    await fillOriginalPrompt(page, MODE, '你是一个诗人')
    await clickOptimizeButton(page, MODE)
    await expectOptimizedResultNotEmpty(page, MODE)

    const workspace = page.locator('[data-testid="workspace"][data-mode="basic-user"]').first()
    await workspace.locator('.n-radio-group .n-radio-button').filter({ hasText: '3' }).click()

    await page.getByTestId('basic-user-test-run-all').click()

    await expectOutputByTestIdNotEmpty(page, 'basic-user-test-original-output')
    await expectOutputByTestIdNotEmpty(page, 'basic-user-test-optimized-output')
    await expectOutputByTestIdNotEmpty(page, 'basic-user-test-variant-c-output')

    const testToolbar = workspace.locator('.test-area-top').first()
    await clickEvaluateButtonWithin(testToolbar)
    await getScoreBadgeValue(testToolbar, 'compare')
  })

  test('测试后可触发单结果评估与对比评估', async ({ page }) => {
    test.setTimeout(240000)

    await navigateToMode(page, 'basic', 'user')

    await fillOriginalPrompt(page, MODE, '你是一个诗人')
    await clickOptimizeButton(page, MODE)
    await expectOptimizedResultNotEmpty(page, MODE)

    const workspace = page.locator('[data-testid="workspace"][data-mode="basic-user"]').first()
    await workspace.getByRole('radio', { name: '2' }).check()

    await page.getByTestId('basic-user-test-run-all').click()

    await expectOutputByTestIdNotEmpty(page, 'basic-user-test-original-output')
    await expectOutputByTestIdNotEmpty(page, 'basic-user-test-optimized-output')

    const originalOutput = page.locator('[data-testid="basic-user-test-original-output"]:visible').first()
    await clickEvaluateButtonWithin(originalOutput)
    await getScoreBadgeValue(originalOutput, 'result')

    const testToolbar = workspace.locator('.test-area-top').first()
    await clickEvaluateButtonWithin(testToolbar)
    await getScoreBadgeValue(testToolbar, 'compare')
  })

  test('工作区清空后旧对比评估仍可查看但不能重跑', async ({ page }) => {
    test.setTimeout(300000)

    await navigateToMode(page, 'basic', 'user')

    await fillOriginalPrompt(page, MODE, '你是一个中文文案助手。请将用户输入改写成更正式、更清晰的一句话。')
    await clickOptimizeButton(page, MODE)
    await expectOptimizedResultNotEmpty(page, MODE)

    const workspace = page.locator('[data-testid="workspace"][data-mode="basic-user"]').first()
    await workspace.getByRole('radio', { name: '2' }).check()

    await page.getByTestId('basic-user-test-run-all').click()
    await expectOutputByTestIdNotEmpty(page, 'basic-user-test-original-output')
    await expectOutputByTestIdNotEmpty(page, 'basic-user-test-optimized-output')

    const testToolbar = workspace.locator('.test-area-top').first()
    await clickEvaluateButtonWithin(testToolbar)
    await getScoreBadgeValue(testToolbar, 'compare')

    await clearWorkspacePrompt(page)

    const compareBadge = workspace.locator('[data-testid="score-badge-compare"]')
    await expect(compareBadge).toBeVisible()
    await expect(compareBadge).toHaveClass(/evaluation-score-badge-btn--stale/)

    await compareBadge.click()
    await expect(page.getByTestId('evaluation-hover-re-evaluate')).toBeDisabled()
    await expect(page.locator('.evaluation-hover-card:visible').getByText(STALE_COMPARE_MESSAGE)).toBeVisible()

    const drawer = await openEvaluationDrawerFromHoverCard(page)

    await expect(drawer.getByTestId('evaluation-panel-re-evaluate')).toBeDisabled()

    await expect(compareBadge).toBeVisible()
    await expect(compareBadge).not.toHaveClass(/loading/)
  })
})
