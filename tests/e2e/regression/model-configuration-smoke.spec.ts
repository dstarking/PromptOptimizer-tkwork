import { test, expect } from '../fixtures'

test.describe('Model configuration smoke', () => {
  test('first-use model selector opens a manager with switchable text, image, and function tabs', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="workspace"][data-mode="basic-system"]')).toBeVisible({
      timeout: 45000,
    })

    const modelSelect = page.getByTestId('basic-system-model-select')
    await expect(modelSelect).toBeVisible()
    await modelSelect.click()

    const emptyConfigAction = page.getByTestId('select-empty-config-action')
    await expect(emptyConfigAction).toBeVisible()
    await expect(page.getByText(/暂无可用模型|No available models/)).toBeVisible()
    await emptyConfigAction.click()

    const dialog = page.getByTestId('model-manager-dialog')
    await expect(dialog).toBeVisible()

    const tabs = page.getByTestId('model-manager-tabs')
    const tabItems = tabs.locator('.n-tabs-tab')
    await expect(tabs).toContainText(/文本模型|Text Models/)
    await expect(tabs).toContainText(/图像模型|Image Models/)
    await expect(tabs).toContainText(/功能模型|Function Models/)

    for (const tabLabel of [/图像模型|Image Models/, /功能模型|Function Models/, /文本模型|Text Models/]) {
      const tab = tabItems.filter({ hasText: tabLabel }).first()
      await tab.click()
      await expect(tab).toHaveClass(/n-tabs-tab--active/)
    }
  })
})
