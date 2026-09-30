import { describe, expect, it } from 'vitest'

import enUS from '../../../src/i18n/locales/en-US'
import zhCN from '../../../src/i18n/locales/zh-CN'
import zhTW from '../../../src/i18n/locales/zh-TW'

describe('image connection i18n', () => {
  it('defines Cloudflare accountId labels for zh-CN', () => {
    expect(zhCN.image.connection.accountId.label).toBeTruthy()
    expect(zhCN.image.connection.accountId.description).toBeTruthy()
    expect(zhCN.image.connection.accountId.placeholder).toBeTruthy()
  })

  it('defines Cloudflare accountId labels for en-US', () => {
    expect(enUS.image.connection.accountId.label).toBeTruthy()
    expect(enUS.image.connection.accountId.description).toBeTruthy()
    expect(enUS.image.connection.accountId.placeholder).toBeTruthy()
  })

  it('defines Cloudflare accountId labels for zh-TW', () => {
    expect(zhTW.image.connection.accountId.label).toBeTruthy()
    expect(zhTW.image.connection.accountId.description).toBeTruthy()
    expect(zhTW.image.connection.accountId.placeholder).toBeTruthy()
  })
})
