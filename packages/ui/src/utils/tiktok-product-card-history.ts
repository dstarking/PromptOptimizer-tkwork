import type { IPreferenceService } from '@prompt-optimizer/core'
import { enhancedResultSchema, VIDEO_DURATIONS } from '@prompt-optimizer/core'

export const TIKTOK_PRODUCT_CARD_HISTORY_KEY = 'session/tiktok-product-card/history/v1'
export const TIKTOK_DESKTOP_HISTORY_KEY = 'session/tiktok-product-card/desktop-history/v2'
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
  desktop?: { version: 2; snapshot?: import('@prompt-optimizer/core').ProductSnapshot; selectedSkuId?: string; duration: import('@prompt-optimizer/core').VideoDuration; result: import('@prompt-optimizer/core').EnhancedProductCardResult; compliance: import('@prompt-optimizer/core').ComplianceReport; brandName?: string; brandAuthorized?: boolean }
}

export const isTikTokProductCardHistoryEntry = (
  value: unknown,
): value is TikTokProductCardHistoryEntry => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<TikTokProductCardHistoryEntry>
  if (candidate.desktop && (candidate.desktop.version !== 2 || !VIDEO_DURATIONS.includes(candidate.desktop.duration) || !enhancedResultSchema.safeParse(candidate.desktop.result).success)) return false
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

  let stored = await preferenceService.get<unknown>(TIKTOK_PRODUCT_CARD_HISTORY_KEY, [])
  if (typeof window !== 'undefined' && window.electronAPI?.productImport?.capability === 'windows-product-card-v1') {
    const enhanced = await preferenceService.get<unknown>(TIKTOK_DESKTOP_HISTORY_KEY, [])
    stored = [...(Array.isArray(enhanced) ? enhanced : []), ...(Array.isArray(stored) ? stored : [])]
      .filter(isTikTokProductCardHistoryEntry).sort((a, b) => b.createdAt - a.createdAt)
  }
  return Array.isArray(stored)
    ? stored.filter(isTikTokProductCardHistoryEntry).slice(0, MAX_TIKTOK_PRODUCT_CARD_HISTORY_ENTRIES)
    : []
}
