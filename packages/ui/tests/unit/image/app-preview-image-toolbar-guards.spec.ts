import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8')

describe('app preview image toolbar guards', () => {
  it('preserves Naive UI default toolbar visibility in wrapper components', () => {
    const imageSource = readSource('src/components/media/AppPreviewImage.vue')
    const groupSource = readSource('src/components/media/AppPreviewImageGroup.vue')

    expect(imageSource).toMatch(/withDefaults\s*\(\s*defineProps</)
    expect(imageSource).toMatch(/showToolbar:\s*true/)
    expect(groupSource).toMatch(/withDefaults\s*\(\s*defineProps</)
    expect(groupSource).toMatch(/showToolbar:\s*true/)
  })
})
