import { test, expect } from '../fixtures'
import { navigateToMode } from '../helpers/common'
import { type Page } from '@playwright/test'
import { clickEvaluateButtonWithin } from '../helpers/evaluation'
import {
  addProMultiUserMessage,
  clickProMultiOptimizeButton,
  expectOptimizedResultNotEmpty,
  selectProMultiMessageForOptimization,
} from '../helpers/optimize'

/**
 * Pro Multi-Message 模式 - 提示词分析测试
 *
 * 功能：分析多消息对话的优化结果
 */

const MODE = 'pro-multi' as const

async function getPromptPanelEvaluationScore(page: Page): Promise<number> {
  const workspace = page.locator('[data-testid="workspace"][data-mode="pro-multi"]').first()
  const badge = workspace
    .locator('[data-testid="score-badge-prompt-only"], [data-testid="score-badge-prompt-iterate"]')
    .first()

  await expect(badge).toBeVisible({ timeout: 90000 })
  await expect(badge).not.toHaveClass(/loading/, { timeout: 60000 })

  const scoreValue = badge.getByTestId('score-value')
  await expect(scoreValue).toBeVisible({ timeout: 10000 })

  const text = (await scoreValue.textContent())?.trim() || '0'
  const score = Number.parseInt(text, 10)

  expect(score).toBeGreaterThan(0)
  expect(score).toBeLessThanOrEqual(100)

  return score
}

async function triggerPromptPanelAnalyze(page: Page): Promise<void> {
  const workspace = page.locator('[data-testid="workspace"][data-mode="pro-multi"]').first()
  const evaluationEntry = workspace.locator('.evaluation-entry').first()
  await expect(evaluationEntry).toBeVisible({ timeout: 15000 })
  await clickEvaluateButtonWithin(evaluationEntry)
}

async function expectPromptAnalysisStarted(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: '提示词质量分析' })
  const badge = page.locator('[data-testid="score-badge-prompt-only"], [data-testid="score-badge-prompt-iterate"]').first()

  try {
    await expect
      .poll(async () => {
        const dialogVisible = await dialog.isVisible().catch(() => false)
        const badgeCount = await badge.count().catch(() => 0)
        return dialogVisible || badgeCount > 0
      }, { timeout: 30000 })
      .toBe(true)
  } catch (error) {
    const messages = await page.locator('.n-message').allInnerTexts().catch(() => [])
    const alerts = await page.locator('.n-alert').allInnerTexts().catch(() => [])
    throw new Error(
      `Prompt analysis did not start.\nMessages: ${JSON.stringify(messages)}\nAlerts: ${JSON.stringify(alerts)}\nOriginal error: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

test.describe('Pro Multi-Message - 提示词分析', () => {
  test('分析对话优化结果并显示评估分数', async ({ page }) => {
    test.setTimeout(180000)

    await navigateToMode(page, 'pro', 'multi')

    await addProMultiUserMessage(
      page,
      '请把下面的产品周会信息整理成适合团队同步的更新摘要，要求按进展、风险、下一步三个部分输出。'
    )
    await selectProMultiMessageForOptimization(page, 0)

    await clickProMultiOptimizeButton(page)
    await expectOptimizedResultNotEmpty(page, MODE)

    await triggerPromptPanelAnalyze(page)
    await expectPromptAnalysisStarted(page)
    await getPromptPanelEvaluationScore(page)
  })
})
