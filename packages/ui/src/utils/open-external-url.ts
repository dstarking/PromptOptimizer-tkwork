export interface OpenExternalUrlOptions {
  target?: string
  features?: string
  logPrefix?: string
}

const SUPPORTED_EXTERNAL_URL_PROTOCOLS = new Set(['http:', 'https:'])

const isSupportedExternalUrl = (url: string): boolean => {
  try {
    return SUPPORTED_EXTERNAL_URL_PROTOCOLS.has(new URL(url).protocol)
  } catch {
    return false
  }
}

export const openExternalUrl = async (
  url: string,
  options: OpenExternalUrlOptions = {},
): Promise<boolean> => {
  if (!url || typeof window === 'undefined') return false

  const prefix = options.logPrefix ?? 'openExternalUrl'
  if (!isSupportedExternalUrl(url)) {
    console.error(`[${prefix}] Refused to open unsupported external URL:`, url)
    return false
  }

  const target = options.target ?? '_blank'
  const features = options.features ?? 'noopener,noreferrer'

  if (window.electronAPI?.shell?.openExternal) {
    try {
      await window.electronAPI.shell.openExternal(url)
      return true
    } catch (error) {
      console.error(`[${prefix}] Failed to open external URL in Electron:`, error)
      return false
    }
  }

  window.open(url, target, features)
  return true
}
