import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8')

describe('app preview image adoption guards', () => {
  it('replaces direct preview image usage with AppPreviewImage in key UI surfaces', () => {
    const files = [
      'src/components/FavoriteMediaPreviewPanel.vue',
      'src/components/GardenSnapshotPreview.vue',
      'src/components/ImageModelEditModal.vue',
      'src/components/ImageModelManager.vue',
      'src/components/MainLayout.vue',
      'src/components/common/PromptGardenInspirationPopover.vue',
      'src/components/FavoriteEditorForm.vue',
      'src/components/image-mode/ImageImage2ImageWorkspace.vue',
      'src/components/image-mode/ImageText2ImageWorkspace.vue',
    ]

    for (const file of files) {
      const source = readSource(file)
      expect(source).toMatch(/AppPreviewImage/)
      expect(source).not.toMatch(/<NImage[\s>]/)
    }
  })

  it('replaces grouped preview image usage with AppPreviewImageGroup', () => {
    const files = [
      'src/components/FavoriteMediaPreviewPanel.vue',
      'src/components/GardenSnapshotPreview.vue',
      'src/components/FavoriteEditorForm.vue',
      'src/components/common/PromptGardenInspirationPopover.vue',
    ]

    for (const file of files) {
      const source = readSource(file)
      expect(source).toMatch(/AppPreviewImageGroup/)
      expect(source).not.toMatch(/<NImageGroup[\s>]/)
    }
  })

  it('exports safe preview wrappers from the UI entry and removes stale direct imports', () => {
    const dialogSource = readSource('src/components/SaveFavoriteDialog.vue')
    expect(dialogSource).not.toMatch(/\bNImage\b/)
    expect(dialogSource).not.toMatch(/\bNImageGroup\b/)

    const entrySource = readSource('src/index.ts')
    expect(entrySource).toContain('export { default as AppPreviewImage } from "./components/media/AppPreviewImage.vue";')
    expect(entrySource).toContain(
      'export { default as AppPreviewImageGroup } from "./components/media/AppPreviewImageGroup.vue";',
    )
    expect(entrySource).toMatch(/\bNImage\b/)
  })
})
