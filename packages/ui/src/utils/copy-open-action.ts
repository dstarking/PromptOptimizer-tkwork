export type CopyOpenActionId = 'copy' | 'chatgpt' | 'claude' | 'gemini' | 'deepseek'

export interface CopyOpenAction {
  id: CopyOpenActionId
  platform?: 'ChatGPT' | 'Claude' | 'Gemini' | 'DeepSeek'
  homepage?: string
}

const COPY_OPEN_ACTION_SESSION_KEY_PREFIX = 'prompt-optimizer:copy-action:'

export const COPY_OPEN_ACTIONS: CopyOpenAction[] = [
  { id: 'copy' },
  { id: 'chatgpt', platform: 'ChatGPT', homepage: 'https://chatgpt.com/' },
  { id: 'claude', platform: 'Claude', homepage: 'https://claude.ai/new' },
  { id: 'gemini', platform: 'Gemini', homepage: 'https://gemini.google.com/app' },
  { id: 'deepseek', platform: 'DeepSeek', homepage: 'https://chat.deepseek.com/' },
]

export const DEFAULT_COPY_OPEN_ACTION_ID: CopyOpenActionId = 'copy'

const COPY_OPEN_ACTION_IDS = new Set<CopyOpenActionId>(
  COPY_OPEN_ACTIONS.map((action) => action.id),
)

export const isCopyOpenActionId = (value: unknown): value is CopyOpenActionId =>
  typeof value === 'string' && COPY_OPEN_ACTION_IDS.has(value as CopyOpenActionId)

export const getCopyOpenAction = (id: CopyOpenActionId): CopyOpenAction =>
  COPY_OPEN_ACTIONS.find((action) => action.id === id) ?? COPY_OPEN_ACTIONS[0]

export const getCopyOpenActionSessionKey = (workspacePath: string): string => {
  const normalizedPath = workspacePath.trim() || '/'
  return `${COPY_OPEN_ACTION_SESSION_KEY_PREFIX}${normalizedPath}`
}

export const readCopyOpenActionFromSession = (workspacePath: string): CopyOpenActionId => {
  if (typeof window === 'undefined') return DEFAULT_COPY_OPEN_ACTION_ID

  try {
    const stored = window.sessionStorage.getItem(getCopyOpenActionSessionKey(workspacePath))
    return isCopyOpenActionId(stored) ? stored : DEFAULT_COPY_OPEN_ACTION_ID
  } catch {
    return DEFAULT_COPY_OPEN_ACTION_ID
  }
}

export const writeCopyOpenActionToSession = (
  workspacePath: string,
  actionId: CopyOpenActionId,
): void => {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(getCopyOpenActionSessionKey(workspacePath), actionId)
  } catch {
    // Session persistence is a convenience; the action can still run without it.
  }
}

export const buildCopyOpenActionUrl = (actionId: CopyOpenActionId): string | null => {
  const action = getCopyOpenAction(actionId)
  if (action.id === 'copy') return null
  return action.homepage ?? null
}
