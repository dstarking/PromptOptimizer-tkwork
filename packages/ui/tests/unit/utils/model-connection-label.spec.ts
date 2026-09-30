import { describe, expect, it } from 'vitest'

import enUS from '../../../src/i18n/locales/en-US'
import zhCN from '../../../src/i18n/locales/zh-CN'
import zhTW from '../../../src/i18n/locales/zh-TW'
import { resolveTextConnectionFieldLabel } from '../../../src/utils/model-connection-label'

function translate(messages: any, key: string): string {
  const value = key.split('.').reduce((current, part) => current?.[part], messages)
  return typeof value === 'string' ? value : key
}

describe('resolveTextConnectionFieldLabel', () => {
  it('returns localized built-in labels for apiKey and baseURL', () => {
    expect(resolveTextConnectionFieldLabel('apiKey', (key) => translate(zhCN, key))).toBe('API密钥')
    expect(resolveTextConnectionFieldLabel('baseURL', (key) => translate(enUS, key))).toBe('API URL')
  })

  it('returns localized accountId label for supported locales', () => {
    expect(resolveTextConnectionFieldLabel('accountId', (key) => translate(zhCN, key))).toBe('账户 ID')
    expect(resolveTextConnectionFieldLabel('accountId', (key) => translate(enUS, key))).toBe('Account ID')
    expect(resolveTextConnectionFieldLabel('accountId', (key) => translate(zhTW, key))).toBe('帳戶 ID')
  })

  it('falls back to raw field name when there is no translation', () => {
    expect(resolveTextConnectionFieldLabel('customField', (key) => translate(enUS, key))).toBe('customField')
  })
})
