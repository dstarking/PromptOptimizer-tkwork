type Translate = (key: string) => string

interface ProviderDisplaySource {
  id?: string | null
  name?: string | null
}

interface TextModelConfigDisplaySource {
  id?: string | null
  name?: string | null
  providerMeta?: ProviderDisplaySource | null
}

const normalizeProviderText = (value?: string | null) => (value || '').trim().toLowerCase()

export const getProviderDisplayName = (
  provider: ProviderDisplaySource | undefined | null,
  t: Translate,
  fallback = 'Unknown'
) => {
  const id = normalizeProviderText(provider?.id)
  const name = provider?.name?.trim() || ''
  const normalizedName = normalizeProviderText(name)

  if (id === 'openai-compatible' || normalizedName === 'custom api (openai compatible)') {
    return t('modelManager.provider.openaiCompatibleCustomLabel')
  }

  if (
    id === 'seedream' ||
    normalizedName === 'seedream (volcano ark)' ||
    (normalizedName.includes('seedream') && normalizedName.includes('volcano ark'))
  ) {
    return 'Seedream'
  }

  return name || provider?.id || fallback
}

export const getTextModelConfigDisplayName = (
  model: TextModelConfigDisplaySource | undefined | null,
  t: Translate,
  fallback = ''
) => {
  const name = model?.name?.trim() || ''
  const normalizedName = normalizeProviderText(name)
  const providerId = normalizeProviderText(model?.providerMeta?.id)

  if (providerId === 'openai-compatible' && normalizedName === 'custom api (openai compatible)') {
    return t('modelManager.provider.openaiCompatibleCustomLabel')
  }

  return name || model?.id || fallback
}
