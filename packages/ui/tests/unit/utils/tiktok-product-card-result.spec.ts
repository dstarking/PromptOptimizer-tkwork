import { describe, expect, it } from 'vitest'
import { parseTikTokProductCardSections } from '../../../src/utils/tiktok-product-card-result'

describe('parseTikTokProductCardSections', () => {
  it('splits numbered markdown headings into ordered product-card blocks', () => {
    const sections = parseTikTokProductCardSections([
      '# 01. Optimized Product Title',
      'Interactive Cat Toy for Indoor Play',
      '',
      '## 02. Optimized Product Description',
      'Keep indoor cats engaged with active play.',
      '',
      '## 03. Best Main Image Prompt',
      'Use the uploaded product as the exact reference.',
    ].join('\n'))

    expect(sections.map((section) => section.key)).toEqual([
      'title',
      'description',
      'main-image-prompt',
    ])
    expect(sections[0]?.content).toContain('Interactive Cat Toy')
    expect(sections[2]?.content).toContain('exact reference')
    expect(sections.map((section) => section.title)).toEqual([
      '优化后的商品标题',
      '优化后的商品描述',
      '最佳主图提示词',
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

  it('discards extra numbered sections, preambles, and repeated result sections', () => {
    const sections = parseTikTokProductCardSections([
      'Unrequested analysis that must not be displayed.',
      '',
      '## 01. Optimized Product Title',
      'First title.',
      '',
      '## 04. SEO Keywords',
      'extra keywords',
      '',
      '## 02. Optimized Product Description',
      'Final description.',
      '',
      '## 01. Optimized Product Title',
      'Repeated title.',
      '',
      '## 03. Best Main Image Prompt',
      'Best prompt.',
    ].join('\n'))

    expect(sections.map((section) => section.key)).toEqual([
      'title',
      'description',
      'main-image-prompt',
    ])
    expect(sections[0]?.content).toBe('First title.')
    expect(sections[1]?.content).toBe('Final description.')
    expect(sections[2]?.content).toBe('Best prompt.')
    expect(sections.some((section) => section.content.includes('extra keywords'))).toBe(false)
    expect(sections.some((section) => section.content.includes('Unrequested analysis'))).toBe(false)
  })
})
