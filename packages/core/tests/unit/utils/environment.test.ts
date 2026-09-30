import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearCustomModelEnvCache,
  getEnvVar,
  scanCustomModelEnvVars,
} from '../../../src/utils/environment'

const TEST_ENV_KEYS = [
  'VITE_CUSTOM_API_KEY_nvidia_test',
  'VITE_CUSTOM_API_BASE_URL_nvidia_test',
  'VITE_CUSTOM_API_MODEL_nvidia_test',
  'VITE_CUSTOM_API_PARAMS_nvidia_test',
  'VITE_CUSTOM_API_HEADERS_nvidia_test',
  'VITE_CUSTOM_API_KEY_invalid_json_test',
  'VITE_CUSTOM_API_BASE_URL_invalid_json_test',
  'VITE_CUSTOM_API_MODEL_invalid_json_test',
  'VITE_CUSTOM_API_PARAMS_invalid_json_test',
  'VITE_CUSTOM_API_HEADERS_invalid_json_test',
  'VITE_CUSTOM_API_KEY_invalid_shape_test',
  'VITE_CUSTOM_API_BASE_URL_invalid_shape_test',
  'VITE_CUSTOM_API_MODEL_invalid_shape_test',
  'VITE_CUSTOM_API_PARAMS_invalid_shape_test',
  'VITE_CUSTOM_API_HEADERS_forbidden_test',
  'VITE_CUSTOM_API_KEY_forbidden_test',
  'VITE_CUSTOM_API_BASE_URL_forbidden_test',
  'VITE_CUSTOM_API_MODEL_forbidden_test',
  'VITE_CUSTOM_API_KEY_runtime_override_test',
  'VITE_CUSTOM_API_BASE_URL_runtime_override_test',
  'VITE_CUSTOM_API_MODEL_runtime_override_test',
  'VITE_CUSTOM_API_PARAMS_runtime_override_test',
  'VITE_CUSTOM_API_HEADERS_runtime_override_test',
  'VITE_ENABLE_PROMPT_GARDEN_IMPORT',
  'VITE_PROMPT_GARDEN_BASE_URL',
]

function cleanupTestEnv() {
  TEST_ENV_KEYS.forEach((key) => {
    delete process.env[key]
  })
}

describe('scanCustomModelEnvVars', () => {
  beforeEach(() => {
    clearCustomModelEnvCache()
    cleanupTestEnv()
  })

  afterEach(() => {
    cleanupTestEnv()
    clearCustomModelEnvCache()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('should parse PARAMS and drop forbidden request keys', () => {
    process.env.VITE_CUSTOM_API_KEY_nvidia_test = 'nvapi-test-key'
    process.env.VITE_CUSTOM_API_BASE_URL_nvidia_test = 'https://integrate.api.nvidia.com/v1'
    process.env.VITE_CUSTOM_API_MODEL_nvidia_test = 'qwen/qwen3.5-397b-a17b'
    process.env.VITE_CUSTOM_API_PARAMS_nvidia_test = JSON.stringify({
      chat_template_kwargs: { enable_thinking: true },
      temperature: 0.6,
      timeout: 45000,
      model: 'should-not-win',
      messages: [{ role: 'user', content: 'blocked' }],
      stream: false,
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const models = scanCustomModelEnvVars(false)

    expect(models.nvidia_test).toMatchObject({
      suffix: 'nvidia_test',
      apiKey: 'nvapi-test-key',
      baseURL: 'https://integrate.api.nvidia.com/v1',
      model: 'qwen/qwen3.5-397b-a17b',
      params: {
        chat_template_kwargs: { enable_thinking: true },
        temperature: 0.6,
        timeout: 45000,
      },
    })
    expect(models.nvidia_test.params).not.toHaveProperty('model')
    expect(models.nvidia_test.params).not.toHaveProperty('messages')
    expect(models.nvidia_test.params).not.toHaveProperty('stream')
    expect(
      warnSpy.mock.calls.some(([message]) =>
        String(message).includes('Ignored forbidden PARAMS keys for nvidia_test: model, messages, stream')
      )
    ).toBe(true)
  })

  it('should parse HEADERS for custom OpenAI-compatible models', () => {
    process.env.VITE_CUSTOM_API_KEY_nvidia_test = 'nvapi-test-key'
    process.env.VITE_CUSTOM_API_BASE_URL_nvidia_test = 'https://integrate.api.nvidia.com/v1'
    process.env.VITE_CUSTOM_API_MODEL_nvidia_test = 'qwen/qwen3.5-397b-a17b'
    process.env.VITE_CUSTOM_API_HEADERS_nvidia_test = JSON.stringify({
      'x-auth-token': 'gateway-token',
      'x-tenant-id': 42,
    })

    const models = scanCustomModelEnvVars(false)

    expect(models.nvidia_test.customHeaders).toEqual({
      'x-auth-token': 'gateway-token',
      'x-tenant-id': '42',
    })
  })

  it('should warn and ignore invalid PARAMS JSON without dropping the model', () => {
    process.env.VITE_CUSTOM_API_KEY_invalid_json_test = 'invalid-json-key'
    process.env.VITE_CUSTOM_API_BASE_URL_invalid_json_test = 'https://example.com/v1'
    process.env.VITE_CUSTOM_API_MODEL_invalid_json_test = 'test-model'
    process.env.VITE_CUSTOM_API_PARAMS_invalid_json_test = '{"temperature":0.5'

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const models = scanCustomModelEnvVars(false)

    expect(models.invalid_json_test).toMatchObject({
      suffix: 'invalid_json_test',
      apiKey: 'invalid-json-key',
      baseURL: 'https://example.com/v1',
      model: 'test-model',
    })
    expect(models.invalid_json_test.params).toBeUndefined()
    expect(
      warnSpy.mock.calls.some(([message]) =>
        String(message).includes('Failed to parse PARAMS for invalid_json_test:')
      )
    ).toBe(true)
  })

  it('should warn and ignore invalid HEADERS JSON without dropping the model', () => {
    process.env.VITE_CUSTOM_API_KEY_invalid_json_test = 'invalid-json-key'
    process.env.VITE_CUSTOM_API_BASE_URL_invalid_json_test = 'https://example.com/v1'
    process.env.VITE_CUSTOM_API_MODEL_invalid_json_test = 'test-model'
    process.env.VITE_CUSTOM_API_HEADERS_invalid_json_test = '{"x-auth-token":'

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const models = scanCustomModelEnvVars(false)

    expect(models.invalid_json_test).toBeDefined()
    expect(models.invalid_json_test.customHeaders).toBeUndefined()
    expect(
      warnSpy.mock.calls.some(([message]) =>
        String(message).includes('Failed to parse HEADERS for invalid_json_test:')
      )
    ).toBe(true)
  })

  it('should reject forbidden custom HEADERS without dropping the model', () => {
    process.env.VITE_CUSTOM_API_KEY_forbidden_test = 'forbidden-key'
    process.env.VITE_CUSTOM_API_BASE_URL_forbidden_test = 'https://example.com/v1'
    process.env.VITE_CUSTOM_API_MODEL_forbidden_test = 'test-model'
    process.env.VITE_CUSTOM_API_HEADERS_forbidden_test = JSON.stringify({
      Authorization: 'Bearer should-not-win',
      'x-auth-token': 'gateway-token',
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const models = scanCustomModelEnvVars(false)

    expect(models.forbidden_test).toBeDefined()
    expect(models.forbidden_test.customHeaders).toBeUndefined()
    expect(
      warnSpy.mock.calls.some(([message]) =>
        String(message).includes('Ignored invalid HEADERS for forbidden_test: Authorization (forbidden-name)')
      )
    ).toBe(true)
  })

  it('should only accept PARAMS as a JSON object', () => {
    process.env.VITE_CUSTOM_API_KEY_invalid_shape_test = 'invalid-shape-key'
    process.env.VITE_CUSTOM_API_BASE_URL_invalid_shape_test = 'https://example.com/v1'
    process.env.VITE_CUSTOM_API_MODEL_invalid_shape_test = 'test-model'
    process.env.VITE_CUSTOM_API_PARAMS_invalid_shape_test = '["not","an","object"]'

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const models = scanCustomModelEnvVars(false)

    expect(models.invalid_shape_test).toBeDefined()
    expect(models.invalid_shape_test.params).toBeUndefined()
    expect(
      warnSpy.mock.calls.some(([message]) =>
        String(message).includes('Invalid PARAMS for invalid_shape_test: must be a JSON object')
      )
    ).toBe(true)
  })

  it('should prefer runtime_config over process.env for Docker runtime overrides', () => {
    process.env.VITE_CUSTOM_API_KEY_runtime_override_test = 'process-key'
    process.env.VITE_CUSTOM_API_BASE_URL_runtime_override_test = 'https://process.example.com/v1'
    process.env.VITE_CUSTOM_API_MODEL_runtime_override_test = 'process-model'
    process.env.VITE_CUSTOM_API_PARAMS_runtime_override_test = JSON.stringify({
      temperature: 0.1,
    })
    process.env.VITE_CUSTOM_API_HEADERS_runtime_override_test = JSON.stringify({
      'x-auth-token': 'process-token',
    })

    vi.stubGlobal('window', {
      runtime_config: {
        CUSTOM_API_KEY_runtime_override_test: 'runtime-key',
        CUSTOM_API_BASE_URL_runtime_override_test: 'https://runtime.example.com/v1',
        CUSTOM_API_MODEL_runtime_override_test: 'runtime-model',
        CUSTOM_API_PARAMS_runtime_override_test: '{"temperature":0.8,"top_p":0.95}',
        CUSTOM_API_HEADERS_runtime_override_test: '{"x-auth-token":"runtime-token"}',
      },
    })

    const models = scanCustomModelEnvVars(false)

    expect(models.runtime_override_test).toMatchObject({
      apiKey: 'runtime-key',
      baseURL: 'https://runtime.example.com/v1',
      model: 'runtime-model',
      params: {
        temperature: 0.8,
        top_p: 0.95,
      },
      customHeaders: {
        'x-auth-token': 'runtime-token',
      },
    })
  })
})

describe('getEnvVar default values', () => {
  beforeEach(() => {
    cleanupTestEnv()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    cleanupTestEnv()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('should provide built-in Prompt Garden defaults when no env is configured', () => {
    expect(getEnvVar('VITE_ENABLE_PROMPT_GARDEN_IMPORT')).toBe('1')
    expect(getEnvVar('VITE_PROMPT_GARDEN_BASE_URL')).toBe('https://garden.always200.com')
  })

  it('should allow process.env to override built-in Prompt Garden defaults', () => {
    process.env.VITE_ENABLE_PROMPT_GARDEN_IMPORT = 'false'
    process.env.VITE_PROMPT_GARDEN_BASE_URL = 'https://garden.example.test'

    expect(getEnvVar('VITE_ENABLE_PROMPT_GARDEN_IMPORT')).toBe('false')
    expect(getEnvVar('VITE_PROMPT_GARDEN_BASE_URL')).toBe('https://garden.example.test')
  })

  it('should allow runtime_config to override built-in Prompt Garden defaults', () => {
    vi.stubGlobal('window', {
      runtime_config: {
        ENABLE_PROMPT_GARDEN_IMPORT: 'false',
        PROMPT_GARDEN_BASE_URL: 'https://runtime-garden.example.test',
      },
    })

    expect(getEnvVar('VITE_ENABLE_PROMPT_GARDEN_IMPORT')).toBe('false')
    expect(getEnvVar('VITE_PROMPT_GARDEN_BASE_URL')).toBe('https://runtime-garden.example.test')
  })
})
