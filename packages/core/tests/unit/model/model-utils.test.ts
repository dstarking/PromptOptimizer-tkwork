import { describe, expect, it } from 'vitest'

import type { ValidatedCustomModelEnvConfig } from '../../../src/utils/environment'
import { generateCustomModelName, generateTextModelConfig } from '../../../src/services/model/model-utils'

describe('generateCustomModelName', () => {
  it('should format numeric version suffix with dot', () => {
    expect(generateCustomModelName('qwen3_5')).toBe('Qwen3.5')
  })

  it('should keep hyphenated words as spaced title case', () => {
    expect(generateCustomModelName('qwen3-coder-next')).toBe('Qwen3 Coder Next')
  })

  it('should preserve non-version underscores as spaces', () => {
    expect(generateCustomModelName('my_local_model')).toBe('My Local Model')
  })
})

describe('generateTextModelConfig', () => {
  const baseEnvConfig: ValidatedCustomModelEnvConfig = {
    suffix: 'nvidia',
    apiKey: 'nvapi-test-key',
    baseURL: 'https://integrate.api.nvidia.com/v1',
    model: 'qwen/qwen3.5-397b-a17b',
  }

  it('should map env params into paramOverrides', () => {
    const config = generateTextModelConfig({
      ...baseEnvConfig,
      params: {
        chat_template_kwargs: { enable_thinking: true },
        temperature: 0.6,
        top_p: 0.95,
      },
    })

    expect(config.paramOverrides).toEqual({
      chat_template_kwargs: { enable_thinking: true },
      temperature: 0.6,
      top_p: 0.95,
    })
  })

  it('should map env customHeaders into connectionConfig', () => {
    const config = generateTextModelConfig({
      ...baseEnvConfig,
      customHeaders: {
        'x-auth-token': 'gateway-token',
      },
    })

    expect(config.connectionConfig.customHeaders).toEqual({
      'x-auth-token': 'gateway-token',
    })
  })

  it('should default paramOverrides to an empty object when params are missing', () => {
    const config = generateTextModelConfig(baseEnvConfig)

    expect(config.paramOverrides).toEqual({})
  })

  it('should expose custom env models as OpenAI-compatible configs', () => {
    const config = generateTextModelConfig(baseEnvConfig)

    expect(config.providerMeta.id).toBe('openai-compatible')
    expect(config.providerMeta.name).toBe('OpenAI Compatible (Custom)')
    expect(config.connectionConfig.requestStyle).toBe('chat_completions')
    expect(config.modelMeta.providerId).toBe('openai-compatible')
  })
})
