export const DATA_BACKUP_STATUS_KEY = 'prompt-optimizer:data-backup-status'
export const DATA_BACKUP_STATUS_EVENT = 'prompt-optimizer:data-backup-status-changed'
export const DATA_BACKUP_REMINDER_THRESHOLD_DAYS = 10

export type DataBackupStatus = {
  lastBackupAt?: string
}

const DAY_MS = 24 * 60 * 60 * 1000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export const normalizeDataBackupStatus = (input: unknown): DataBackupStatus => {
  if (!isRecord(input) || typeof input.lastBackupAt !== 'string') return {}
  return { lastBackupAt: input.lastBackupAt }
}

export const loadDataBackupStatus = (): DataBackupStatus => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(DATA_BACKUP_STATUS_KEY)
    return normalizeDataBackupStatus(raw ? JSON.parse(raw) : null)
  } catch {
    return {}
  }
}

export const isDataBackupReminderDue = (
  status: DataBackupStatus = loadDataBackupStatus(),
  now: Date = new Date(),
): boolean => {
  if (!status.lastBackupAt) return false
  const lastBackup = new Date(status.lastBackupAt).getTime()
  if (!Number.isFinite(lastBackup)) return true
  return now.getTime() - lastBackup >= DATA_BACKUP_REMINDER_THRESHOLD_DAYS * DAY_MS
}

export const recordDataBackupCompleted = (now: Date = new Date()): DataBackupStatus => {
  const status = { lastBackupAt: now.toISOString() }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(DATA_BACKUP_STATUS_KEY, JSON.stringify(status))
    window.dispatchEvent(new CustomEvent(DATA_BACKUP_STATUS_EVENT, { detail: status }))
  }
  return status
}
