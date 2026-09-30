import { describe, it, expect, vi } from 'vitest'

import { createTestPinia } from '../../../utils/pinia-test-helpers'
import { useGlobalSettings } from '../../../../src/stores/settings/useGlobalSettings'

describe('Global settings runtime messages', () => {
  it('uses English warning when preferenceService is unavailable during save', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { pinia } = createTestPinia({
      preferenceService: undefined as any,
    })

    const store = useGlobalSettings(pinia)
    store.hasRestored = true as any

    await store.saveGlobalSettings()

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[GlobalSettings] PreferenceService is unavailable; cannot save global settings',
    )

    consoleWarnSpy.mockRestore()
  })

  it('uses English error log when restore fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('boom')
    const { pinia } = createTestPinia({
      preferenceService: {
        get: vi.fn(async () => {
          throw error
        }),
        set: vi.fn(async () => {}),
        delete: async () => {},
        keys: async () => [],
        clear: async () => {},
        getAll: async () => ({}),
        exportData: async () => ({}),
        importData: async () => {},
        getDataType: async () => 'preference',
        validateData: async () => true,
      } as any,
    })

    const store = useGlobalSettings(pinia)
    await store.restoreGlobalSettings()

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[GlobalSettings] Failed to restore global settings:',
      error,
    )

    consoleErrorSpy.mockRestore()
  })
})
