import { describe, expect, it } from 'vitest'

import { getProviderDisplayName, getTextModelConfigDisplayName } from '../../../src/utils/provider-display'

const t = (key: string) => {
  if (key === 'modelManager.provider.openaiCompatibleCustomLabel') {
    return 'OpenAI 兼容（自定义）'
  }
  return key
}

describe('getProviderDisplayName', () => {
  it('localizes OpenAI-compatible legacy provider names', () => {
    expect(getProviderDisplayName({ id: 'openai-compatible', name: 'Custom API (OpenAI Compatible)' }, t)).toBe('OpenAI 兼容（自定义）')
  })

  it('keeps Seedream concise for legacy Volcano Ark labels', () => {
    expect(getProviderDisplayName({ id: 'seedream', name: 'Seedream (Volcano Ark)' }, t)).toBe('Seedream')
  })

  it('localizes the legacy default custom text model name', () => {
    expect(getTextModelConfigDisplayName({
      id: 'custom',
      name: 'Custom API (OpenAI Compatible)',
      providerMeta: { id: 'openai-compatible', name: 'Custom API (OpenAI Compatible)' },
    }, t)).toBe('OpenAI 兼容（自定义）')
  })
})
