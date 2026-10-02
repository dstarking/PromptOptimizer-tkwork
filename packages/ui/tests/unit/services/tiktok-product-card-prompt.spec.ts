import { describe, expect, it } from 'vitest'
import {
  TIKTOK_PRODUCT_CARD_SYSTEM_PROMPT,
  buildTikTokProductCardUserPrompt,
} from '../../../src/services/tiktok-product-card-prompt'

describe('TikTok product-card prompt', () => {
  it('requests exactly the three supported result sections', () => {
    const headings = TIKTOK_PRODUCT_CARD_SYSTEM_PROMPT
      .split('\n')
      .filter((line) => line.startsWith('## '))

    expect(headings).toEqual([
      '## 01. Optimized Product Title',
      '## 02. Optimized Product Description',
      '## 03. Best Main Image Prompt',
    ])
    expect(TIKTOK_PRODUCT_CARD_SYSTEM_PROMPT).not.toContain('SEO Product Titles')
    expect(TIKTOK_PRODUCT_CARD_SYSTEM_PROMPT).not.toContain('9-Image Product Gallery Strategy')
    expect(TIKTOK_PRODUCT_CARD_SYSTEM_PROMPT).not.toContain('CTR Optimisation Analysis')
  })

  it('keeps optional seller inputs while forbidding extra output', () => {
    const prompt = buildTikTokProductCardUserPrompt({
      productTitle: 'Interactive cat toy',
      specifications: 'Colour: beige',
    })

    expect(prompt).toContain('Interactive cat toy')
    expect(prompt).toContain('Colour: beige')
    expect(prompt).toContain('Return exactly the three English sections')
    expect(prompt).toContain('Return nothing else.')
  })
})
