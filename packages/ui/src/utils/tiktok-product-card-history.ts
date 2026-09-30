import type { IPreferenceService } from '@prompt-optimizer/core'

export const TIKTOK_PRODUCT_CARD_HISTORY_KEY = 'session/tiktok-product-card/history/v1'
export const MAX_TIKTOK_PRODUCT_CARD_HISTORY_ENTRIES = 20

export interface TikTokProductCardHistoryEntry {
  id: string
  title: string
  createdAt: number
  content: string
  modelKey: string
  productTitle: string
  specifications: string
  supplierDescription: string
  imageNames: string[]
}

export const isTikTokProductCardHistoryEntry = (
  value: unknown,
): value is TikTokProductCardHistoryEntry => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<TikTokProductCardHistoryEntry>
  return Boolean(
    typeof candidate.id === 'string' &&
      typeof candidate.title === 'string' &&
      typeof candidate.createdAt === 'number' &&
      typeof candidate.content === 'string' &&
      typeof candidate.modelKey === 'string' &&
      typeof candidate.productTitle === 'string' &&
      typeof candidate.specifications === 'string' &&
      typeof candidate.supplierDescription === 'string' &&
      Array.isArray(candidate.imageNames),
  )
}

export const loadTikTokProductCardHistory = async (
  preferenceService: IPreferenceService | null | undefined,
): Promise<TikTokProductCardHistoryEntry[]> => {
  if (!preferenceService) return []

  const stored = await preferenceService.get<unknown>(TIKTOK_PRODUCT_CARD_HISTORY_KEY, [])
  return Array.isArray(stored)
    ? stored.filter(isTikTokProductCardHistoryEntry).slice(0, MAX_TIKTOK_PRODUCT_CARD_HISTORY_ENTRIES)
    : []
}
