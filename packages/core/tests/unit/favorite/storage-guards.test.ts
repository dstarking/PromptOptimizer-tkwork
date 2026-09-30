import { describe, expect, it } from 'vitest'

import { normalizeFavoriteRecord } from '../../../src/services/favorite/storage-guards'

describe('normalizeFavoriteRecord', () => {
  it('falls back invalid function modes to basic/system', () => {
    const favorite = normalizeFavoriteRecord({
      id: 'fav-invalid-mode',
      title: 'Invalid Mode',
      content: '内容',
      functionMode: 'not-real',
      optimizationMode: 'also-not-real',
    })

    expect(favorite.functionMode).toBe('basic')
    expect(favorite.optimizationMode).toBe('system')
    expect(favorite.imageSubMode).toBeUndefined()
  })

  it('drops conflicting fields and keeps a salvageable image favorite', () => {
    const favorite = normalizeFavoriteRecord({
      id: 'fav-image-conflict',
      title: 'Image Favorite',
      content: '内容',
      functionMode: 'image',
      imageSubMode: 'multiimage',
      optimizationMode: 'system',
    })

    expect(favorite.functionMode).toBe('image')
    expect(favorite.imageSubMode).toBe('multiimage')
    expect(favorite.optimizationMode).toBeUndefined()
  })
})
