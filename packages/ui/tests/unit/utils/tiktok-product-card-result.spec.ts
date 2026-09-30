import { describe, expect, it } from 'vitest'
import { parseTikTokProductCardSections } from '../../../src/utils/tiktok-product-card-result'

describe('parseTikTokProductCardSections', () => {
  it('splits numbered markdown headings into ordered product-card blocks', () => {
    const sections = parseTikTokProductCardSections([
      '# 01. Product Identification',
      'Product type: pet bowl',
      '',
      '## 02. Confirmed Product Information',
      'Material: stainless steel',
      '',
      '## 14. Seller Confirmation Required',
      'Confirm the material before publishing.',
    ].join('\n'))

    expect(sections.map((section) => section.key)).toEqual([
      'identification',
      'confirmed',
      'seller-confirmation',
    ])
    expect(sections[0]?.content).toContain('Product type: pet bowl')
    expect(sections[2]?.content).toContain('Confirm the material')
  })

  it('keeps unstructured provider output visible as a fallback block', () => {
    const sections = parseTikTokProductCardSections('The provider ignored the heading contract.')

    expect(sections).toEqual([
      {
        key: 'full',
        title: 'Product Card Result',
        content: 'The provider ignored the heading contract.',
      },
    ])
  })
})
