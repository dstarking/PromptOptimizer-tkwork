export interface TikTokProductCardSection {
  key: string
  title: string
  content: string
}

export const TIKTOK_PRODUCT_CARD_SECTION_DEFINITIONS = [
  { key: 'identification', title: '商品识别', aliases: ['Product Identification'] },
  { key: 'confirmed', title: '已确认的商品信息', aliases: ['Confirmed Product Information'] },
  { key: 'confirmation', title: '待卖家确认的信息', aliases: ['Needs Seller Confirmation'] },
  { key: 'selling-points', title: '核心卖点', aliases: ['Core Selling Points'] },
  { key: 'titles', title: 'SEO 商品标题', aliases: ['SEO Product Titles'] },
  { key: 'keywords', title: 'SEO 关键词', aliases: ['SEO Keywords'] },
  { key: 'description', title: '最终商品描述', aliases: ['Final Product Description'] },
  { key: 'gallery', title: '9 图商品画廊方案', aliases: ['9-Image Product Gallery Strategy'] },
  { key: 'main-image-concepts', title: '主图方案', aliases: ['Main Image Concepts'] },
  { key: 'main-image-prompts', title: '主图提示词', aliases: ['Main Image AI Prompts'] },
  { key: 'image-prompts', title: '第 2-9 张图提示词', aliases: ['Image 2-9 AI Prompts'] },
  { key: 'ctr', title: 'CTR 优化分析', aliases: ['CTR Optimisation Analysis'] },
  { key: 'ab-test', title: '推荐 A/B 测试', aliases: ['Recommended A/B Test'] },
  { key: 'seller-confirmation', title: '卖家确认事项', aliases: ['Seller Confirmation Required'] },
] as const

const normalizeHeading = (heading: string): string =>
  heading
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const resolveSection = (heading: string): (typeof TIKTOK_PRODUCT_CARD_SECTION_DEFINITIONS)[number] | null => {
  const numberMatch = heading.match(/^\s*(\d{1,2})\s*[.)\-:]?\s*(.*)$/)
  const number = numberMatch ? Number(numberMatch[1]) : null
  const title = normalizeHeading(numberMatch?.[2] || heading)
  const matchesDefinition = (definition: (typeof TIKTOK_PRODUCT_CARD_SECTION_DEFINITIONS)[number]) =>
    [definition.title, ...definition.aliases].some((candidate) => {
      const normalizedCandidate = normalizeHeading(candidate)
      return title === normalizedCandidate || title.includes(normalizedCandidate)
    })

  if (number !== null && number >= 1 && number <= TIKTOK_PRODUCT_CARD_SECTION_DEFINITIONS.length) {
    const byNumber = TIKTOK_PRODUCT_CARD_SECTION_DEFINITIONS[number - 1]
    if (!title || matchesDefinition(byNumber)) {
      return byNumber
    }
  }

  return TIKTOK_PRODUCT_CARD_SECTION_DEFINITIONS.find(matchesDefinition) ?? null
}

/**
 * Splits the model's strict numbered Markdown output into renderable blocks.
 * If a provider ignores the heading contract, the complete response remains
 * visible as one block instead of being silently discarded.
 */
export const parseTikTokProductCardSections = (markdown: string): TikTokProductCardSection[] => {
  const source = String(markdown || '').trim()
  if (!source) return []

  const headingPattern = /^#{1,3}\s+(.+?)\s*$/gm
  const matches = Array.from(source.matchAll(headingPattern))
    .map((match) => ({
      index: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      heading: match[1].trim(),
      definition: resolveSection(match[1]),
    }))
    .filter((match) => match.definition)

  if (matches.length === 0) {
    return [{ key: 'full', title: '商品卡结果', content: source }]
  }

  const sections: TikTokProductCardSection[] = []
  matches.forEach((match, index) => {
    const nextIndex = matches[index + 1]?.index ?? source.length
    const content = source.slice(match.end, nextIndex).trim()
    const definition = match.definition!

    sections.push({
      key: definition.key,
      title: definition.title,
      content,
    })
  })

  const preamble = source.slice(0, matches[0].index).trim()
  if (preamble) {
    sections[0].content = `${preamble}\n\n${sections[0].content}`.trim()
  }

  return sections
}
