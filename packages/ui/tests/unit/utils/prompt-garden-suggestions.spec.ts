import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildPromptGardenSuggestionsUrl,
  fetchPromptGardenSuggestions,
} from '../../../src/utils/prompt-garden-suggestions'

describe('prompt-garden-suggestions', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('builds a lightweight suggestions URL with mode, strategy, exclude, and locale', () => {
    const url = buildPromptGardenSuggestionsUrl({
      gardenBaseUrl: 'https://garden.always200.com/',
      mode: 'image-image2image',
      limit: 3,
      strategy: 'mixed',
      exclude: ['NB-001', 'NB-002', 'NB-001'],
      locale: 'zh-CN',
    })

    expect(url).toBe(
      'https://garden.always200.com/api/public/prompts/suggestions?mode=image-image2image&limit=3&strategy=mixed&exclude=NB-001%2CNB-002&locale=zh-CN',
    )
  })

  it('normalizes valid suggestion cards and drops invalid items', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'prompt-1',
            title: 'Cinematic portrait',
            summary: 'Keep the subject and improve lighting.',
            tags: ['portrait', 'cinematic', 'portrait'],
            importCode: 'NB-001',
            mode: 'image-image2image',
            thumbnailUrl: '/prompt-assets/thumb.webp',
            source: 'latest',
          },
          {
            id: 'prompt-2',
            title: 'Curated style transfer',
            summary: 'Featured by Garden before random fill.',
            tags: ['featured'],
            importCode: 'NB-002',
            mode: 'image-image2image',
            source: 'featured',
          },
          {
            id: 'missing-code',
            title: 'Invalid',
            summary: 'No code',
          },
        ],
        browseUrl: '/prompts?mode=image-image2image',
        nextExclude: ['NB-001', 'NB-002'],
        ttlSeconds: 120,
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchPromptGardenSuggestions({
      gardenBaseUrl: 'https://garden.always200.com',
      mode: 'image-image2image',
      timeoutMs: 1000,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://garden.always200.com/api/public/prompts/suggestions?mode=image-image2image&limit=3&strategy=mixed',
      expect.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
      }),
    )
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toMatchObject({
      id: 'prompt-1',
      importCode: 'NB-001',
      tags: ['portrait', 'cinematic'],
      thumbnailUrl: 'https://garden.always200.com/prompt-assets/thumb.webp',
    })
    expect(result.items[1]).toMatchObject({
      id: 'prompt-2',
      importCode: 'NB-002',
      source: 'featured',
    })
    expect(result.browseUrl).toBe('https://garden.always200.com/prompts?mode=image-image2image')
    expect(result.nextExclude).toEqual(['NB-001', 'NB-002'])
    expect(result.ttlSeconds).toBe(120)
  })

  it('falls back to a mode-scoped browse URL when Garden omits browseUrl', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      }),
    )

    const result = await fetchPromptGardenSuggestions({
      gardenBaseUrl: 'https://garden.always200.com',
      mode: 'image-text2image',
    })

    expect(result.items).toEqual([])
    expect(result.browseUrl).toBe('https://garden.always200.com/prompts?mode=image-text2image')
  })
})
