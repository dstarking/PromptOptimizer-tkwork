import type { Ref } from 'vue'
import type { SubModeKey } from '../../stores/session/useSessionManager'

interface WorkspaceRouteSwitchOptions {
  hasRestoredInitialState: Ref<boolean>
  parseSubModeKey: (path: string) => SubModeKey | null
  getActiveSubModeKey: () => SubModeKey | null
  switchMode: (fromKey: SubModeKey, toKey: SubModeKey) => Promise<void>
  switchSubMode: (fromKey: SubModeKey, toKey: SubModeKey) => Promise<void>
  restoreSessionToUI: () => Promise<void>
  onError?: (error: unknown, fromKey: SubModeKey, toKey: SubModeKey) => void
}

interface RouteChangeOptions {
  externalDataLoading?: boolean
}

const getModeFromSubModeKey = (key: SubModeKey) => key.split('-')[0]

export const createWorkspaceRouteSwitchController = (options: WorkspaceRouteSwitchOptions) => {
  const activeSwitches = new Map<string, Promise<void>>()
  let switchQueue: Promise<void> = Promise.resolve()

  const run = (toPath: string, fromPath: string): Promise<void> => {
    if (!options.hasRestoredInitialState.value) return Promise.resolve()

    const fromKey = options.parseSubModeKey(fromPath) ?? options.getActiveSubModeKey()
    const toKey = options.parseSubModeKey(toPath)

    if (!fromKey || !toKey || fromKey === toKey) return Promise.resolve()

    const switchKey = `${fromKey}->${toKey}`
    const existingSwitch = activeSwitches.get(switchKey)
    if (existingSwitch) {
      return existingSwitch
    }

    const executeSwitch = async () => {
      const actualFromKey = options.getActiveSubModeKey() ?? fromKey
      if (!actualFromKey || actualFromKey === toKey) return

      const fromMode = getModeFromSubModeKey(actualFromKey)
      const toMode = getModeFromSubModeKey(toKey)

      if (fromMode !== toMode) {
        await options.switchMode(actualFromKey, toKey)
      } else {
        await options.switchSubMode(actualFromKey, toKey)
      }

      await options.restoreSessionToUI()
    }

    const promise = switchQueue.then(executeSwitch, executeSwitch)
    activeSwitches.set(switchKey, promise)
    switchQueue = promise.catch(() => {})

    void promise.finally(() => {
      if (activeSwitches.get(switchKey) === promise) {
        activeSwitches.delete(switchKey)
      }
    })

    return promise
  }

  const handleRouteChange = async (
    toPath: string,
    fromPath: string,
    routeChangeOptions: RouteChangeOptions = {},
  ) => {
    if (routeChangeOptions.externalDataLoading) return

    try {
      await run(toPath, fromPath)
    } catch (error) {
      const fromKey = options.parseSubModeKey(fromPath) ?? options.getActiveSubModeKey()
      const toKey = options.parseSubModeKey(toPath)
      if (fromKey && toKey) {
        options.onError?.(error, fromKey, toKey)
      }
    }
  }

  return {
    run,
    handleRouteChange,
  }
}
