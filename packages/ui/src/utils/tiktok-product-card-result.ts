export interface TikTokProductCardSection {
  key: string
  title: string
  content: string
}

export const TIKTOK_PRODUCT_CARD_SECTION_DEFINITIONS = [
  {
    key: 'title',
    title: '优化后的商品标题',
    aliases: ['Optimized Product Title', 'Optimised Product Title'],
  },
  {
    key: 'description',
    title: '优化后的商品描述',
    aliases: ['Optimized Product Description', 'Optimised Product Description'],
  },
  {
    key: 'main-image-prompt',
    title: '最佳主图提示词',
    aliases: ['Best Main Image Prompt', 'Best Main Image AI Prompt'],
  },
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
      return title === normalizedCandidate
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

  // Only numbered top-level headings are section boundaries. Nested headings
  // inside a section can mention the same business term and must stay content.
  const headingPattern = /^#{1,2}\s+(\d{1,2}\s*[.)\-:]?\s+.+?)\s*$/gm
  const matches = Array.from(source.matchAll(headingPattern)).map((match) => ({
    index: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
    heading: match[1].trim(),
    definition: resolveSection(match[1]),
  }))

  if (!matches.some((match) => match.definition)) {
    return [{ key: 'full', title: '商品卡结果', content: source }]
  }

  const sections = new Map<string, TikTokProductCardSection>()
  matches.forEach((match, index) => {
    const nextIndex = matches[index + 1]?.index ?? source.length
    const content = source.slice(match.end, nextIndex).trim()
    const definition = match.definition
    if (!definition || sections.has(definition.key)) return

    sections.set(definition.key, { key: definition.key, title: definition.title, content })
  })

  return TIKTOK_PRODUCT_CARD_SECTION_DEFINITIONS
    .map((definition) => sections.get(definition.key))
    .filter((section): section is TikTokProductCardSection => Boolean(section))
}
