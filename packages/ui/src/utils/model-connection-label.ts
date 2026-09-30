export function resolveTextConnectionFieldLabel(
  fieldName: string,
  t: (key: string) => string
): string {
  if (fieldName === 'apiKey') {
    return t('modelManager.apiKey')
  }

  if (fieldName === 'baseURL') {
    return t('modelManager.apiUrl')
  }

  const translationKey = `modelManager.connection.${fieldName}`
  const translated = t(translationKey)
  return translated !== translationKey ? translated : fieldName
}
