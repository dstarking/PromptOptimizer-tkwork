import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { SubModeKey } from '../../../src/stores/session/useSessionManager'
import { createWorkspaceRouteSwitchController } from '../../../src/components/app-layout/workspaceRouteSwitch'

const parseSubModeKey = (path: string): SubModeKey | null => {
  const cleanPath = path.split('?')[0].split('#')[0]
  const match = cleanPath.match(/^\/(basic|pro|image)\/([^/]+)$/)
  if (!match) return null
  return `${match[1]}-${match[2]}` as SubModeKey
}

const flushSwitchQueue = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

const createController = (activeKey: SubModeKey = 'basic-user') => {
  const calls: string[] = []
  const switchMode = vi.fn(async (fromKey: SubModeKey, toKey: SubModeKey) => {
    calls.push(`switchMode:${fromKey}->${toKey}`)
  })
  const switchSubMode = vi.fn(async (fromKey: SubModeKey, toKey: SubModeKey) => {
    calls.push(`switchSubMode:${fromKey}->${toKey}`)
  })
  const restoreSessionToUI = vi.fn(async () => {
    calls.push('restore')
  })
  const onError = vi.fn()

  const controller = createWorkspaceRouteSwitchController({
    hasRestoredInitialState: ref(true),
    parseSubModeKey,
    getActiveSubModeKey: () => activeKey,
    switchMode,
    switchSubMode,
    restoreSessionToUI,
    onError,
  })

  return {
    calls,
    controller,
    onError,
    restoreSessionToUI,
    switchMode,
    switchSubMode,
  }
}

describe('createWorkspaceRouteSwitchController', () => {
  it('lets route watchers skip while external data is loading', async () => {
    const { controller, switchSubMode, restoreSessionToUI } = createController()

    await controller.handleRouteChange('/basic/system', '/basic/user', {
      externalDataLoading: true,
    })

    expect(switchSubMode).not.toHaveBeenCalled()
    expect(restoreSessionToUI).not.toHaveBeenCalled()
  })

  it('allows explicit external-data navigation to run the workspace transaction', async () => {
    const { calls, controller, switchSubMode, restoreSessionToUI } = createController('basic-user')

    await controller.run('/basic/system', '/favorites?from=/basic/user')

    expect(switchSubMode).toHaveBeenCalledWith('basic-user', 'basic-system')
    expect(restoreSessionToUI).toHaveBeenCalled()
    expect(calls).toEqual([
      'switchSubMode:basic-user->basic-system',
      'restore',
    ])
  })

  it('deduplicates the watcher and explicit navigation for the same route transaction', async () => {
    let releaseSwitch!: () => void
    const switchMode = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          releaseSwitch = resolve
        }),
    )
    const restoreSessionToUI = vi.fn(async () => {})
    const controller = createWorkspaceRouteSwitchController({
      hasRestoredInitialState: ref(true),
      parseSubModeKey,
      getActiveSubModeKey: () => 'basic-system',
      switchMode,
      switchSubMode: vi.fn(async () => {}),
      restoreSessionToUI,
    })

    const first = controller.run('/pro/variable', '/favorites?from=/basic/system')
    const second = controller.run('/pro/variable', '/favorites?from=/basic/system')

    await flushSwitchQueue()
    releaseSwitch()
    await Promise.all([first, second])

    expect(switchMode).toHaveBeenCalledTimes(1)
    expect(restoreSessionToUI).toHaveBeenCalledTimes(1)
  })

  it('serializes different route transactions and executes with the settled active key', async () => {
    const calls: string[] = []
    const releases: Array<() => void> = []
    let activeKey: SubModeKey = 'basic-system'
    const switchMode = vi.fn((fromKey: SubModeKey, toKey: SubModeKey) => {
      calls.push(`switchMode:${fromKey}->${toKey}`)
      return new Promise<void>((resolve) => {
        releases.push(() => {
          activeKey = toKey
          resolve()
        })
      })
    })
    const restoreSessionToUI = vi.fn(async () => {
      calls.push('restore')
    })
    const controller = createWorkspaceRouteSwitchController({
      hasRestoredInitialState: ref(true),
      parseSubModeKey,
      getActiveSubModeKey: () => activeKey,
      switchMode,
      switchSubMode: vi.fn(async () => {}),
      restoreSessionToUI,
    })

    const first = controller.run('/pro/variable', '/basic/system')
    const second = controller.run('/image/text2image', '/basic/system')

    await flushSwitchQueue()

    expect(switchMode).toHaveBeenCalledTimes(1)
    expect(calls).toEqual(['switchMode:basic-system->pro-variable'])

    releases[0]()
    await first
    await flushSwitchQueue()

    expect(switchMode).toHaveBeenCalledTimes(2)
    expect(calls).toEqual([
      'switchMode:basic-system->pro-variable',
      'restore',
      'switchMode:pro-variable->image-text2image',
    ])

    releases[1]()
    await Promise.all([first, second])

    expect(calls).toEqual([
      'switchMode:basic-system->pro-variable',
      'restore',
      'switchMode:pro-variable->image-text2image',
      'restore',
    ])
    expect(restoreSessionToUI).toHaveBeenCalledTimes(2)
  })
})
