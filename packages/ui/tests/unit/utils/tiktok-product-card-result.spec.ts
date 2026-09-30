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
    expect(sections.map((section) => section.title)).toEqual([
      '商品识别',
      '已确认的商品信息',
      '卖家确认事项',
    ])
  })

  it('keeps unstructured provider output visible as a fallback block', () => {
    const sections = parseTikTokProductCardSections('The provider ignored the heading contract.')

    expect(sections).toEqual([
      {
        key: 'full',
        title: '商品卡结果',
        content: 'The provider ignored the heading contract.',
      },
    ])
  })
})
