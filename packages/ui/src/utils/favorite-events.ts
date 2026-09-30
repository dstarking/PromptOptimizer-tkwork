export const FAVORITE_UPDATED_EVENT = 'prompt-optimizer:favorite-updated'

export type FavoriteUpdatedEventDetail = {
  favoriteId: string
}

export const dispatchFavoriteUpdatedEvent = (favoriteId: string) => {
  const normalizedFavoriteId = favoriteId.trim()
  if (!normalizedFavoriteId || typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent<FavoriteUpdatedEventDetail>(
    FAVORITE_UPDATED_EVENT,
    {
      detail: {
        favoriteId: normalizedFavoriteId,
      },
    },
  ))
}

export const getFavoriteUpdatedEventDetail = (
  event: Event,
): FavoriteUpdatedEventDetail | null => {
  const detail = (event as CustomEvent<FavoriteUpdatedEventDetail>).detail
  const favoriteId = typeof detail?.favoriteId === 'string'
    ? detail.favoriteId.trim()
    : ''
  return favoriteId ? { favoriteId } : null
}
