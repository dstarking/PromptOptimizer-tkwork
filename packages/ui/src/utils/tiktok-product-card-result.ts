export interface TikTokProductCardSection {
  key: string
  title: string
  content: string
}

export const TIKTOK_PRODUCT_CARD_SECTION_DEFINITIONS = [
  { key: 'identification', title: 'Product Identification' },
  { key: 'confirmed', title: 'Confirmed Product Information' },
  { key: 'confirmation', title: 'Needs Seller Confirmation' },
  { key: 'selling-points', title: 'Core Selling Points' },
  { key: 'titles', title: 'SEO Product Titles' },
  { key: 'keywords', title: 'SEO Keywords' },
  { key: 'description', title: 'Final Product Description' },
  { key: 'gallery', title: '9-Image Product Gallery Strategy' },
  { key: 'main-image-concepts', title: 'Main Image Concepts' },
  { key: 'main-image-prompts', title: 'Main Image AI Prompts' },
  { key: 'image-prompts', title: 'Image 2-9 AI Prompts' },
  { key: 'ctr', title: 'CTR Optimisation Analysis' },
  { key: 'ab-test', title: 'Recommended A/B Test' },
  { key: 'seller-confirmation', title: 'Seller Confirmation Required' },
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

  if (number !== null && number >= 1 && number <= TIKTOK_PRODUCT_CARD_SECTION_DEFINITIONS.length) {
    const byNumber = TIKTOK_PRODUCT_CARD_SECTION_DEFINITIONS[number - 1]
    if (!title || normalizeHeading(byNumber.title) === title || title.includes(normalizeHeading(byNumber.title))) {
      return byNumber
    }
  }

  return TIKTOK_PRODUCT_CARD_SECTION_DEFINITIONS.find((definition) => {
    const normalizedTitle = normalizeHeading(definition.title)
    return title === normalizedTitle || title.includes(normalizedTitle)
  }) ?? null
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
    return [{ key: 'full', title: 'Product Card Result', content: source }]
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
