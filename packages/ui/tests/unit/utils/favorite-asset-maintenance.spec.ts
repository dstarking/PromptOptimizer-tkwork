import { describe, it, expect, vi } from 'vitest'

import {
  attachFavoriteAssetGc,
  runFavoriteAssetGc,
} from '../../../src/utils/favorite-asset-maintenance'

describe('favoriteAssetMaintenance', () => {
  it('deletes orphaned assets from the favorite image store', async () => {
    const favoriteManager = {
      getFavorites: vi.fn(async () => [
        {
          id: 'fav-1',
          metadata: {
            media: {
              coverAssetId: 'cover-1',
              assetIds: ['asset-1'],
            },
            promptAsset: {
              schemaVersion: 'prompt-model/v1',
              versions: [
                {
                  content: {
                    kind: 'image-prompt',
                    text: 'Generate',
                    images: [
                      { kind: 'asset', assetId: 'asset-version-input' },
                      { kind: 'url', url: 'https://example.test/input.png' },
                    ],
                  },
                },
              ],
              examples: [
                {
                  input: {
                    images: [{ kind: 'asset', assetId: 'asset-example-input' }],
                  },
                  output: {
                    images: [{ kind: 'asset', assetId: 'asset-example-output' }],
                  },
                },
              ],
            },
            gardenSnapshot: {
              assets: {
                showcases: [{ imageAssetIds: ['gallery-1'] }],
                examples: [{ inputImageAssetIds: ['input-1'] }],
              },
            },
            reproducibility: {
              examples: [
                {
                  imageAssetIds: ['manual-output-1'],
                  inputImageAssetIds: ['manual-input-1'],
                },
              ],
            },
            examples: [
              {
                imageAssetIds: ['legacy-output-1'],
                inputImageAssetIds: ['legacy-input-1'],
              },
            ],
          },
        },
      ]),
    }

    const favoriteImageStorageService = {
      listAllMetadata: vi.fn(async () => [
        { id: 'cover-1' },
        { id: 'asset-1' },
        { id: 'asset-version-input' },
        { id: 'asset-example-input' },
        { id: 'asset-example-output' },
        { id: 'gallery-1' },
        { id: 'input-1' },
        { id: 'manual-output-1' },
        { id: 'manual-input-1' },
        { id: 'legacy-output-1' },
        { id: 'legacy-input-1' },
        { id: 'orphan-1' },
      ]),
      deleteImages: vi.fn(async (_ids: string[]) => {}),
    }

    const result = await runFavoriteAssetGc(
      favoriteManager as any,
      favoriteImageStorageService as any,
    )

    expect(favoriteImageStorageService.deleteImages).toHaveBeenCalledWith(['orphan-1'])
    expect(result.deletedIds).toEqual(['orphan-1'])
    expect(result.referencedIds).toEqual(expect.arrayContaining([
      'asset-version-input',
      'asset-example-input',
      'asset-example-output',
    ]))
  })

  it('keeps images that are referenced only by promptAsset metadata', async () => {
    const favoriteManager = {
      getFavorites: vi.fn(async () => [
        {
          id: 'fav-prompt-asset-only',
          metadata: {
            promptAsset: {
              schemaVersion: 'prompt-model/v1',
              versions: [
                {
                  content: {
                    kind: 'image-prompt',
                    text: 'Edit image',
                    images: [{ kind: 'asset', assetId: 'version-only-asset' }],
                  },
                },
              ],
              examples: [
                {
                  input: {
                    images: [{ kind: 'asset', assetId: 'input-only-asset' }],
                  },
                  output: {
                    images: [{ kind: 'asset', assetId: 'output-only-asset' }],
                  },
                },
              ],
            },
          },
        },
      ]),
    }

    const favoriteImageStorageService = {
      listAllMetadata: vi.fn(async () => [
        { id: 'version-only-asset' },
        { id: 'input-only-asset' },
        { id: 'output-only-asset' },
        { id: 'orphan-asset' },
      ]),
      deleteImages: vi.fn(async (_ids: string[]) => {}),
    }

    const result = await runFavoriteAssetGc(
      favoriteManager as any,
      favoriteImageStorageService as any,
    )

    expect(favoriteImageStorageService.deleteImages).toHaveBeenCalledWith(['orphan-asset'])
    expect(result.referencedIds.sort()).toEqual([
      'input-only-asset',
      'output-only-asset',
      'version-only-asset',
    ])
  })

  it('runs GC after deleting a favorite and keeps assets still referenced by siblings', async () => {
    const favorites = [
      {
        id: 'fav-1',
        metadata: {
          media: {
            assetIds: ['shared-asset', 'soon-orphaned'],
          },
        },
      },
      {
        id: 'fav-2',
        metadata: {
          media: {
            assetIds: ['shared-asset'],
          },
        },
      },
    ]

    const favoriteManager = {
      addFavorite: vi.fn(),
      getFavorites: vi.fn(async () => favorites),
      getFavorite: vi.fn(async (id: string) => favorites.find((favorite) => favorite.id === id) || null),
      updateFavorite: vi.fn(),
      deleteFavorite: vi.fn(async (id: string) => {
        const index = favorites.findIndex((favorite) => favorite.id === id)
        if (index >= 0) {
          favorites.splice(index, 1)
        }
      }),
      deleteFavorites: vi.fn(),
      incrementUseCount: vi.fn(),
      getCategories: vi.fn(),
      addCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      getStats: vi.fn(),
      searchFavorites: vi.fn(),
      exportFavorites: vi.fn(),
      importFavorites: vi.fn(),
      getAllTags: vi.fn(),
      addTag: vi.fn(),
      renameTag: vi.fn(),
      mergeTags: vi.fn(),
      deleteTag: vi.fn(),
      reorderCategories: vi.fn(),
      getCategoryUsage: vi.fn(),
      ensureDefaultCategories: vi.fn(),
    }

    const favoriteImageStorageService = {
      listAllMetadata: vi.fn(async () => [
        { id: 'shared-asset' },
        { id: 'soon-orphaned' },
      ]),
      deleteImages: vi.fn(async (_ids: string[]) => {}),
    }

    const guardedManager = attachFavoriteAssetGc(
      favoriteManager as any,
      favoriteImageStorageService as any,
    )

    await guardedManager.deleteFavorite('fav-1')

    expect(favoriteManager.deleteFavorite).toHaveBeenCalledWith('fav-1')
    expect(favoriteImageStorageService.deleteImages).toHaveBeenCalledWith(['soon-orphaned'])
  })

  it('runs GC after updating a favorite when image references change', async () => {
    const favorites = [
      {
        id: 'fav-1',
        metadata: {
          media: {
            assetIds: ['old-asset'],
          },
        },
      },
    ]

    const favoriteManager = {
      addFavorite: vi.fn(),
      getFavorites: vi.fn(async () => favorites),
      getFavorite: vi.fn(async (id: string) => favorites.find((favorite) => favorite.id === id) || null),
      updateFavorite: vi.fn(async (id: string, updates: Record<string, unknown>) => {
        const index = favorites.findIndex((favorite) => favorite.id === id)
        if (index >= 0) {
          favorites[index] = {
            ...favorites[index],
            ...updates,
          }
        }
      }),
      deleteFavorite: vi.fn(),
      deleteFavorites: vi.fn(),
      incrementUseCount: vi.fn(),
      getCategories: vi.fn(),
      addCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      getStats: vi.fn(),
      searchFavorites: vi.fn(),
      exportFavorites: vi.fn(),
      importFavorites: vi.fn(),
      getAllTags: vi.fn(),
      addTag: vi.fn(),
      renameTag: vi.fn(),
      mergeTags: vi.fn(),
      deleteTag: vi.fn(),
      reorderCategories: vi.fn(),
      getCategoryUsage: vi.fn(),
      ensureDefaultCategories: vi.fn(),
    }

    const favoriteImageStorageService = {
      listAllMetadata: vi.fn(async () => [
        { id: 'old-asset' },
        { id: 'new-asset' },
      ]),
      deleteImages: vi.fn(async (_ids: string[]) => {}),
    }

    const guardedManager = attachFavoriteAssetGc(
      favoriteManager as any,
      favoriteImageStorageService as any,
    )

    await guardedManager.updateFavorite('fav-1', {
      metadata: {
        media: {
          assetIds: ['new-asset'],
        },
      },
    } as any)

    expect(favoriteManager.updateFavorite).toHaveBeenCalled()
    expect(favoriteImageStorageService.deleteImages).toHaveBeenCalledWith(['old-asset'])
  })

  it('runs GC after importing favorites when overwrite changes image references', async () => {
    const favorites = [
      {
        id: 'fav-1',
        content: 'same-content',
        metadata: {
          media: {
            assetIds: ['old-asset'],
          },
        },
      },
    ]

    const favoriteManager = {
      addFavorite: vi.fn(),
      getFavorites: vi.fn(async () => favorites),
      getFavorite: vi.fn(async (id: string) => favorites.find((favorite) => favorite.id === id) || null),
      updateFavorite: vi.fn(),
      deleteFavorite: vi.fn(),
      deleteFavorites: vi.fn(),
      incrementUseCount: vi.fn(),
      getCategories: vi.fn(),
      addCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      getStats: vi.fn(),
      searchFavorites: vi.fn(),
      exportFavorites: vi.fn(),
      importFavorites: vi.fn(async () => {
        favorites[0] = {
          ...favorites[0],
          metadata: {
            media: {
              assetIds: ['new-asset'],
            },
          },
        }

        return {
          imported: 1,
          skipped: 0,
          errors: [],
        }
      }),
      getAllTags: vi.fn(),
      addTag: vi.fn(),
      renameTag: vi.fn(),
      mergeTags: vi.fn(),
      deleteTag: vi.fn(),
      reorderCategories: vi.fn(),
      getCategoryUsage: vi.fn(),
      ensureDefaultCategories: vi.fn(),
    }

    const favoriteImageStorageService = {
      listAllMetadata: vi.fn(async () => [
        { id: 'old-asset' },
        { id: 'new-asset' },
      ]),
      deleteImages: vi.fn(async (_ids: string[]) => {}),
    }

    const guardedManager = attachFavoriteAssetGc(
      favoriteManager as any,
      favoriteImageStorageService as any,
    )

    await guardedManager.importFavorites(JSON.stringify({ favorites: [] }), {
      mergeStrategy: 'overwrite',
    })

    expect(favoriteManager.importFavorites).toHaveBeenCalled()
    expect(favoriteImageStorageService.deleteImages).toHaveBeenCalledWith(['old-asset'])
  })
})
