import { resolve } from 'node:path'

import type { Locator } from '@playwright/test'

import { test, expect } from '../fixtures'
import { navigateToMode } from '../helpers/common'

async function fillMultiImagePrompt(workspace: Locator, value: string) {
  const input = workspace.getByTestId('image-multiimage-input')
  await expect(input).toBeVisible({ timeout: 30000 })

  const cmContent = input.locator('.cm-content').first()
  if ((await cmContent.count()) > 0) {
    await cmContent.click()
    await workspace.page().keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
    await workspace.page().keyboard.type(value)
    return
  }

  await input.locator('textarea').first().fill(value)
}

async function expectMultiImagePromptValue(
  workspace: Locator,
  value: string,
) {
  const input = workspace.getByTestId('image-multiimage-input')

  await expect.poll(async () => {
    const textarea = input.locator('textarea').first()
    if ((await textarea.count()) > 0) {
      return textarea.inputValue()
    }

    const cmContent = input.locator('.cm-content').first()
    if ((await cmContent.count()) > 0) {
      if ((await cmContent.locator('.cm-placeholder').count()) > 0) {
        return ''
      }
      return (await cmContent.innerText()).trim()
    }

    return ''
  }, { timeout: 30000 }).toBe(value)
}

test.describe('Image MultiImage - Session Persistence', () => {
  test('refresh keeps prompt, uploaded image count and test column selection', async ({ page }) => {
    test.setTimeout(120000)

    await navigateToMode(page, 'image', 'multiimage')

    const workspace = page.locator('[data-mode="image-multiimage"]').first()
    await expect(workspace).toBeVisible({ timeout: 20000 })

    await fillMultiImagePrompt(workspace, '请把图1的人物放到图2的城市背景里，保持电影感')

    const fileInput = workspace.locator('input[type="file"]').first()
    await fileInput.setInputFiles([
      resolve(process.cwd(), 'tests/e2e/fixtures/images/text2image-output.png'),
      resolve(process.cwd(), 'packages/desktop/icons/app-icon.png'),
    ])

    await expect(workspace.getByTestId('image-multiimage-card-1')).toBeVisible({ timeout: 20000 })
    await expect(workspace.getByTestId('image-multiimage-card-2')).toBeVisible({ timeout: 20000 })

    await workspace.getByTestId('image-multiimage-columns-3').click()
    await expect(workspace.getByRole('radio', { name: '3' })).toBeChecked()

    await page.reload()
    await page.waitForLoadState('networkidle')

    const workspaceAfter = page.locator('[data-mode="image-multiimage"]').first()
    await expect(workspaceAfter).toBeVisible({ timeout: 20000 })

    await expectMultiImagePromptValue(workspaceAfter, '请把图1的人物放到图2的城市背景里，保持电影感')
    await expect(workspaceAfter.getByTestId('image-multiimage-card-1')).toBeVisible({ timeout: 20000 })
    await expect(workspaceAfter.getByTestId('image-multiimage-card-2')).toBeVisible({ timeout: 20000 })
    await expect(workspaceAfter.getByRole('radio', { name: '3' })).toBeChecked()
  })
})
