import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8')

describe('image2image reference entry guards', () => {
  it('removes reference extraction entry from image2image without affecting text2image reference flow', () => {
    const image2imageSource = readSource('src/components/image-mode/ImageImage2ImageWorkspace.vue')
    const text2imageSource = readSource('src/components/image-mode/ImageText2ImageWorkspace.vue')

    expect(image2imageSource).not.toMatch(/image-image2image-extract-button/)
    expect(image2imageSource).not.toMatch(/openExtractImagePicker/)
    expect(image2imageSource).not.toMatch(/handleExtractImageFileChange/)
    expect(image2imageSource).not.toMatch(/extractPromptFromReferenceImage/)
    expect(image2imageSource).not.toMatch(/resolveReferencePromptPreview/)
    expect(image2imageSource).not.toMatch(/extractImageInputRef/)
    expect(text2imageSource).toMatch(/resolveReferencePromptPreview/)
    expect(text2imageSource).toMatch(/referenceActionButtons/)
  })
})
