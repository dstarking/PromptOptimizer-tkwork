import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { test, expect } from './fixtures'
import { waitForAppReady } from './helpers/common'

const GARDEN_BASE_URL = 'https://garden.always200.com'
const IMPORT_CODE = 'ZH-T2I-006'
const FAVORITE_TITLE = '纸偶微距童话实景'

async function readStorageValue(page: import('@playwright/test').Page, key: string): Promise<string | null> {
  return page.evaluate(async (storageKey) => {
    const dbName = (window as unknown as { __TEST_DB_NAME__?: string }).__TEST_DB_NAME__ || 'PromptOptimizerDB'
    return new Promise<string | null>((resolve, reject) => {
      const request = indexedDB.open(dbName)
      request.onerror = () => reject(request.error || new Error('Failed to open test database'))
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction('storage', 'readonly')
        const store = transaction.objectStore('storage')
        const getRequest = store.get(storageKey)
        getRequest.onerror = () => {
          db.close()
          reject(getRequest.error || new Error(`Failed to read ${storageKey}`))
        }
        getRequest.onsuccess = () => {
          db.close()
          const record = getRequest.result as { value?: string } | undefined
          resolve(typeof record?.value === 'string' ? record.value : null)
        }
      }
    })
  }, key)
}

async function writeStorageValue(
  page: import('@playwright/test').Page,
  key: string,
  value: string,
): Promise<void> {
  await page.evaluate(async ({ storageKey, storageValue }) => {
    const dbName = (window as unknown as { __TEST_DB_NAME__?: string }).__TEST_DB_NAME__ || 'PromptOptimizerDB'
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(dbName)
      request.onerror = () => reject(request.error || new Error('Failed to open test database'))
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction('storage', 'readwrite')
        const store = transaction.objectStore('storage')
        const putRequest = store.put({ key: storageKey, value: storageValue })
        putRequest.onerror = () => reject(putRequest.error || new Error(`Failed to write ${storageKey}`))
        transaction.oncomplete = () => {
          db.close()
          resolve()
        }
        transaction.onerror = () => {
          db.close()
          reject(transaction.error || new Error(`Failed to write ${storageKey}`))
        }
      }
    })
  }, { storageKey: key, storageValue: value })
}

async function readGardenFavorite(page: import('@playwright/test').Page) {
  const raw = await readStorageValue(page, 'favorites')
  if (!raw) return null
  const favorites = JSON.parse(raw) as Array<{ title?: string; metadata?: any }>
  return favorites.find((item) => item.title === FAVORITE_TITLE) || null
}

async function waitForFavoriteSaved(page: import('@playwright/test').Page): Promise<void> {
  await expect.poll(async () => {
    const raw = await readStorageValue(page, 'favorites')
    if (!raw) return []
    const favorites = JSON.parse(raw) as Array<{ title?: string; metadata?: Record<string, unknown> }>
    return favorites.map((favorite) => ({
      title: favorite.title,
      metadata: favorite.metadata,
    }))
  }, { timeout: 45000 }).toContainEqual(expect.objectContaining({
    title: FAVORITE_TITLE,
    metadata: expect.objectContaining({
      gardenSnapshot: expect.objectContaining({
        importCode: IMPORT_CODE,
        gardenBaseUrl: GARDEN_BASE_URL,
      }),
    }),
  }))

  const favorite = await readGardenFavorite(page)
  const examples = favorite?.metadata?.gardenSnapshot?.assets?.examples || []
  expect(examples).toHaveLength(3)
  expect(examples[0].parameters).toEqual(expect.objectContaining({
    paper_doll: expect.any(String),
    macro_scene: expect.any(String),
    tiny_action: expect.any(String),
  }))
  expect(examples[0].imageAssetIds?.length || examples[0].images?.length || 0).toBeGreaterThan(0)
}

async function clearFavoritesAndReload(page: import('@playwright/test').Page): Promise<void> {
  await writeStorageValue(page, 'favorites', '[]')
  await page.goto('/#/favorites', { waitUntil: 'domcontentloaded' })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitForAppReady(page)
  await expect(page.getByTestId('favorites-manager-add')).toBeVisible({ timeout: 20000 })
  await expect.poll(async () => {
    const raw = await readStorageValue(page, 'favorites')
    return raw ? JSON.parse(raw).length : 0
  }, { timeout: 10000 }).toBe(0)
}

async function importFavoriteShareFile(
  page: import('@playwright/test').Page,
  filePath: string,
): Promise<void> {
  await page.getByTestId('favorites-manager-import').click()
  const importPanel = page.locator('.favorite-import-panel')
  await expect(importPanel).toBeVisible({ timeout: 10000 })
  await importPanel.locator('input[type="file"]').first().setInputFiles(filePath)
  await expect(importPanel).toContainText(filePath.split(/[\\/]/).pop() || '')
  await importPanel.getByRole('button', { name: /导入|Import/i }).click()
  await waitForFavoriteSaved(page)
}

test.describe('Favorite share export from live Prompt Garden', () => {
  test('imports ZH-T2I-006 from production Garden and exports HTML/PNG share files', async ({ page }, testInfo) => {
    test.setTimeout(120000)
    test.skip(process.env.RUN_LIVE_GARDEN_E2E !== '1', 'Live Garden E2E is opt-in because it depends on garden.always200.com')

    await page.goto(`/#/image/text2image?importCode=${IMPORT_CODE}&saveToFavorites=1`, {
      waitUntil: 'domcontentloaded',
    })
    await waitForAppReady(page)
    await waitForFavoriteSaved(page)

    await page.goto('/#/favorites', { waitUntil: 'domcontentloaded' })
    await waitForAppReady(page)
    await expect(page.getByTestId('favorites-manager-add')).toBeVisible({ timeout: 20000 })

    await page.locator('.favorites-manager-search input').fill(FAVORITE_TITLE)
    const listItem = page.getByTestId('favorite-workspace-list-item').filter({ hasText: FAVORITE_TITLE }).first()
    await expect(listItem).toBeVisible({ timeout: 20000 })
    await listItem.click()

    const detail = page.getByTestId('favorite-detail-panel')
    await expect(detail).toContainText(FAVORITE_TITLE, { timeout: 20000 })
    await expect(detail).toContainText('paper_doll', { timeout: 20000 })

    await page.getByTestId('favorite-detail-share').click()
    await expect(page.getByTestId('favorite-share-export-html')).toBeVisible({ timeout: 10000 })

    const htmlDownloadPromise = page.waitForEvent('download')
    await page.getByTestId('favorite-share-export-html').click()
    const htmlDownload = await htmlDownloadPromise
    const htmlPath = testInfo.outputPath('garden-favorite-share.html')
    await htmlDownload.saveAs(htmlPath)

    const html = await fs.readFile(htmlPath, 'utf8')
    expect(html).toContain(FAVORITE_TITLE)
    expect(html).toContain('prompt-optimizer/favorite-share/v1')
    expect(html).toContain('paper_doll')
    expect(html).toContain('来源气质复现示例')
    expect(html).toContain('example-images--output')
    expect(html).toContain('data-copy-button')
    await testInfo.attach('garden-favorite-share.html', {
      path: htmlPath,
      contentType: 'text/html',
    })

    const htmlPreview = await page.context().newPage()
    await htmlPreview.goto(pathToFileURL(htmlPath).toString(), { waitUntil: 'domcontentloaded' })
    await expect(htmlPreview.locator('h1')).toContainText(FAVORITE_TITLE)
    await expect(htmlPreview.locator('[data-copy-button]').first()).toBeVisible()
    await expect(htmlPreview.locator('.example-images--output img').first()).toBeVisible()
    const htmlScreenshotPath = testInfo.outputPath('garden-favorite-share-html-preview.png')
    await htmlPreview.screenshot({ path: htmlScreenshotPath, fullPage: true })
    await htmlPreview.close()
    await testInfo.attach('garden-favorite-share-html-preview.png', {
      path: htmlScreenshotPath,
      contentType: 'image/png',
    })

    const pngDownloadPromise = page.waitForEvent('download')
    await page.getByTestId('favorite-share-export-png').click()
    const pngDownload = await pngDownloadPromise
    const pngPath = testInfo.outputPath('garden-favorite-share.png')
    await pngDownload.saveAs(pngPath)
    const pngBytes = await fs.readFile(pngPath)
    expect(pngBytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    expect(pngBytes.toString('utf8')).toContain('PromptOptimizerFavoriteShare')
    await testInfo.attach('garden-favorite-share.png', {
      path: pngPath,
      contentType: 'image/png',
    })
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('favorite-share-export-html')).toBeHidden({ timeout: 10000 })

    await clearFavoritesAndReload(page)
    await importFavoriteShareFile(page, htmlPath)
    const htmlImportedFavorite = await readGardenFavorite(page)
    expect(htmlImportedFavorite?.metadata?.gardenSnapshot?.assets?.examples?.[0]?.imageAssetIds?.length || 0).toBeGreaterThan(0)

    await clearFavoritesAndReload(page)
    await importFavoriteShareFile(page, pngPath)
    const pngImportedFavorite = await readGardenFavorite(page)
    expect(pngImportedFavorite?.metadata?.gardenSnapshot?.assets?.examples?.[0]?.imageAssetIds?.length || 0).toBeGreaterThan(0)
  })
})
