export type NormalizedFavoriteFunctionMode = 'basic' | 'context' | 'image'

export const normalizeFavoriteFunctionMode = (mode: unknown): NormalizedFavoriteFunctionMode => {
  if (mode === 'image') return 'image'
  if (mode === 'context' || mode === 'pro') return 'context'
  return 'basic'
}
