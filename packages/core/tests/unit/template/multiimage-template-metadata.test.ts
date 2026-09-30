import { describe, expect, it } from 'vitest'

import { template as multiimageOptimizeEn } from '../../../src/services/template/default-templates/image-optimize/multiimage/multiimage-optimize_en'

describe('multiimage template metadata', () => {
  it('uses the standardized english builtin metadata', () => {
    expect(multiimageOptimizeEn.id).toBe('multiimage-optimize-en')
    expect(multiimageOptimizeEn.name).toBe('Reference Relationship Builder')
    expect(multiimageOptimizeEn.metadata.description).toBe(
      'Organizes user requests around Image 1, Image 2, Image 3, and their visual relationships',
    )
  })
})
