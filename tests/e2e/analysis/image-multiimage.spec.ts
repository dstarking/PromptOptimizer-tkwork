import { test, expect } from '../fixtures'
import { navigateToMode } from '../helpers/common'
import {
  fillOriginalPrompt,
  verifyAnalyzeButtonDisabledWhenEmpty,
} from '../helpers/analysis'

const MODE = 'image-multiimage' as const

test.describe('Image MultiImage - 提示词分析入口', () => {
  test('多图生图工作区提供输入区提示词分析按钮', async ({ page }) => {
    await navigateToMode(page, 'image', 'multiimage')

    const workspace = page.locator(`[data-testid="workspace"][data-mode="${MODE}"]`).first()
    await expect(workspace).toBeVisible()
    await verifyAnalyzeButtonDisabledWhenEmpty(page, MODE)

    await fillOriginalPrompt(
      page,
      MODE,
      'Combine the reference images into one cohesive editorial poster with consistent lighting',
    )
    await expect(workspace.getByTestId(`${MODE}-analyze-button`)).toBeEnabled()
  })
})
