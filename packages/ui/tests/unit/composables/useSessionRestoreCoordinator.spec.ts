import { describe, it, expect, vi } from 'vitest'

import { useSessionRestoreCoordinator } from '../../../src/composables/session/useSessionRestoreCoordinator'

const flushMicrotasks = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('useSessionRestoreCoordinator', () => {
  it('uses English logs for pending restore and unmounted skip paths', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    let resolveRestore: (() => void) | null = null
    const restoreFn = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRestore = resolve
        }),
    )

    const coordinator = useSessionRestoreCoordinator(restoreFn)

    const firstRun = coordinator.executeRestore()
    await flushMicrotasks()
    await coordinator.executeRestore()

    coordinator.markUnmounted()
    resolveRestore?.()
    await firstRun
    await flushMicrotasks()

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[SessionRestoreCoordinator] executeRestore is already running; setting the pendingRestore flag',
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[SessionRestoreCoordinator] Detected pendingRestore; queueing another restore asynchronously',
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[SessionRestoreCoordinator] Component is unmounted; skipping the pending restore',
    )

    consoleWarnSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })
})
