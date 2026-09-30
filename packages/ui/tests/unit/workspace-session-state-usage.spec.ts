import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8')

describe('workspace session state usage guards', () => {
  it('text workspaces use storeToRefs for replaceable test variant state', () => {
    const files = [
      '../../src/components/basic-mode/BasicSystemWorkspace.vue',
      '../../src/components/basic-mode/BasicUserWorkspace.vue',
      '../../src/components/context-mode/ContextSystemWorkspace.vue',
      '../../src/components/context-mode/ContextUserWorkspace.vue',
    ]

    for (const file of files) {
      const source = readSource(file)
      expect(source).toMatch(/storeToRefs/)
      expect(source).toMatch(/testVariantResults:\s*variantResults/)
      expect(source).toMatch(/testVariantLastRunFingerprint:\s*variantLastRunFingerprint/)
      expect(source).not.toMatch(/const\s+variantResults\s*=\s*(session|proMultiSession|proVariableSession)\.testVariantResults/)
      expect(source).not.toMatch(/const\s+variantLastRunFingerprint\s*=\s*(session|proMultiSession|proVariableSession)\.testVariantLastRunFingerprint/)
    }
  })

  it('image workspaces keep replaceable test variant state behind computed accessors', () => {
    const files = [
      '../../src/components/image-mode/ImageText2ImageWorkspace.vue',
      '../../src/components/image-mode/ImageImage2ImageWorkspace.vue',
      '../../src/components/image-mode/ImageMultiImageWorkspace.vue',
    ]

    for (const file of files) {
      const source = readSource(file)
      expect(source).toMatch(/const\s+variantResults\s*=\s*computed/)
      expect(source).toMatch(/session\.testVariantResults/)
      expect(source).toMatch(/const\s+variantLastRunFingerprint\s*=\s*computed/)
      expect(source).toMatch(/session\.testVariantLastRunFingerprint/)
    }
  })
})
