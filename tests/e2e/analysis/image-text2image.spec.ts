import { test, expect } from '../fixtures'
import { navigateToMode } from '../helpers/common'
import {
  fillOriginalPrompt,
  verifyAnalyzeButtonDisabledWhenEmpty,
} from '../helpers/analysis'

const MODE = 'image-text2image' as const

test.describe('Image Text2Image - 提示词分析入口', () => {
  test('文生图工作区提供输入区提示词分析按钮', async ({ page }) => {
    await navigateToMode(page, 'image', 'text2image')

    const workspace = page.locator(`[data-testid="workspace"][data-mode="${MODE}"]`).first()
    await expect(workspace).toBeVisible()
    await verifyAnalyzeButtonDisabledWhenEmpty(page, MODE)

    await fillOriginalPrompt(
      page,
      MODE,
      'A beautiful sunset over the ocean with palm trees, golden hour lighting, photorealistic',
    )
    await expect(workspace.getByTestId(`${MODE}-analyze-button`)).toBeEnabled()
  })
})
