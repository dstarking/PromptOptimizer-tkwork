import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { openExternalUrl } from '../../../src/utils/open-external-url'

describe('openExternalUrl', () => {
  let originalElectronAPI: unknown
  let openSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    originalElectronAPI = window.electronAPI
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      writable: true,
      value: undefined,
    })
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      writable: true,
      value: originalElectronAPI,
    })
    vi.restoreAllMocks()
  })

  it('opens with the desktop shell bridge when available', async () => {
    const openExternal = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      writable: true,
      value: { shell: { openExternal } },
    })

    const result = await openExternalUrl('https://example.com')

    expect(result).toBe(true)
    expect(openExternal).toHaveBeenCalledWith('https://example.com')
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('falls back to window.open in web runtime', async () => {
    const result = await openExternalUrl('https://example.com')

    expect(result).toBe(true)
    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('does not fall back to window.open when the desktop bridge rejects the URL', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const openExternal = vi.fn().mockRejectedValue(new Error('shell failed'))
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      writable: true,
      value: { shell: { openExternal } },
    })

    const result = await openExternalUrl('https://example.com', { logPrefix: 'Test' })

    expect(result).toBe(false)
    expect(openExternal).toHaveBeenCalledWith('https://example.com')
    expect(openSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Test] Failed to open external URL in Electron:',
      expect.any(Error),
    )
  })

  it('rejects unsupported protocols before any runtime opener is called', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const openExternal = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      writable: true,
      value: { shell: { openExternal } },
    })

    const result = await openExternalUrl('file:///tmp/prompt.txt', { logPrefix: 'Test' })

    expect(result).toBe(false)
    expect(openExternal).not.toHaveBeenCalled()
    expect(openSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Test] Refused to open unsupported external URL:',
      'file:///tmp/prompt.txt',
    )
  })
})
