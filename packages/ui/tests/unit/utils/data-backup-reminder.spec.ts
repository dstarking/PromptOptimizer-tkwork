import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  DATA_BACKUP_STATUS_KEY,
  isDataBackupReminderDue,
  loadDataBackupStatus,
  recordDataBackupCompleted,
} from '../../../src/utils/data-backup-reminder'

describe('data backup reminder', () => {
  afterEach(() => {
    window.localStorage.removeItem(DATA_BACKUP_STATUS_KEY)
  })

  it('is not due when no backup has been recorded yet', () => {
    expect(isDataBackupReminderDue({}, new Date('2026-05-06T00:00:00.000Z'))).toBe(false)
  })

  it('is due only after ten days since the last backup', () => {
    expect(isDataBackupReminderDue({
      lastBackupAt: '2026-04-26T00:00:00.000Z',
    }, new Date('2026-05-06T00:00:00.000Z'))).toBe(true)

    expect(isDataBackupReminderDue({
      lastBackupAt: '2026-04-27T00:00:01.000Z',
    }, new Date('2026-05-06T00:00:00.000Z'))).toBe(false)
  })

  it('records a completed backup and notifies the current tab', () => {
    const listener = vi.fn()
    window.addEventListener('prompt-optimizer:data-backup-status-changed', listener)

    const status = recordDataBackupCompleted(new Date('2026-05-06T01:02:03.000Z'))

    expect(status.lastBackupAt).toBe('2026-05-06T01:02:03.000Z')
    expect(loadDataBackupStatus()).toEqual(status)
    expect(listener).toHaveBeenCalledTimes(1)

    window.removeEventListener('prompt-optimizer:data-backup-status-changed', listener)
  })
})
