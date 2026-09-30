import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8')

describe('image download integration guards', () => {
  it('routes result area downloads through the shared image download utility', () => {
    const text2imageSource = readSource('src/components/image-mode/ImageText2ImageWorkspace.vue')
    const image2imageSource = readSource('src/components/image-mode/ImageImage2ImageWorkspace.vue')

    expect(text2imageSource).toMatch(/downloadImageSource/)
    expect(text2imageSource).not.toMatch(/a\.download = filename/)
    expect(image2imageSource).toMatch(/downloadImageSource/)
    expect(image2imageSource).not.toMatch(/a\.download = filename/)
  })
})
