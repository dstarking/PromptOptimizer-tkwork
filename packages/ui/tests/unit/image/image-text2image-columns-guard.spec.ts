import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readWorkspaceSource = () =>
  readFileSync(
    resolve(process.cwd(), 'src/components/image-mode/ImageText2ImageWorkspace.vue'),
    'utf8',
  )

describe('image text2image columns guard', () => {
  it('imports radio components required by the test columns control', () => {
    const source = readWorkspaceSource()

    expect(source).toMatch(/<NRadioGroup[\s>]/)
    expect(source).toMatch(/<NRadioButton[\s>]/)
    expect(source).toMatch(/NRadioGroup,/)
    expect(source).toMatch(/NRadioButton,/)
  })
})
