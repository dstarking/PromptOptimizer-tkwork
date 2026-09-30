import { test, expect } from '../fixtures'
import { navigateToMode } from '../helpers/common'
import {
  fillOriginalPrompt,
  verifyAnalyzeButtonDisabledWhenEmpty,
} from '../helpers/analysis'

const MODE = 'image-image2image' as const

test.describe('Image Image2Image - 提示词分析入口', () => {
  test('图生图工作区提供输入区提示词分析按钮', async ({ page }) => {
    await navigateToMode(page, 'image', 'image2image')

    const workspace = page.locator(`[data-testid="workspace"][data-mode="${MODE}"]`).first()
    await expect(workspace).toBeVisible()
    await verifyAnalyzeButtonDisabledWhenEmpty(page, MODE)

    await fillOriginalPrompt(
      page,
      MODE,
      'Convert to watercolor painting style, soft colors, artistic brush strokes',
    )
    await expect(workspace.getByTestId(`${MODE}-analyze-button`)).toBeEnabled()
  })
})
