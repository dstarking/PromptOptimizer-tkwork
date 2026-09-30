import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { CloudflareImageAdapter } from '../../../src/services/image/adapters/cloudflare'
import type { ImageModelConfig, ImageRequest } from '../../../src/services/image/types'
import { IMAGE_ERROR_CODES } from '../../../src/constants/error-codes'

const MODEL_ID = '@cf/black-forest-labs/flux-2-klein-4b'
const RUN_REAL_API = process.env.RUN_REAL_API === '1'

describe('CloudflareImageAdapter', () => {
  let adapter: CloudflareImageAdapter
  const realFetch = global.fetch

  const createConfig = (): ImageModelConfig => ({
    id: 'test-cloudflare-config',
    name: 'Test Cloudflare Config',
    providerId: 'cloudflare',
    modelId: MODEL_ID,
    enabled: true,
    connectionConfig: {
      apiKey: 'test-api-key',
      accountId: 'test-account-id'
    },
    paramOverrides: {
      width: 512,
      height: 512,
      seed: 42
    },
    provider: adapter.getProvider(),
    model: adapter.getModels()[0]
  })

  beforeEach(() => {
    adapter = new CloudflareImageAdapter()
  })

  afterEach(() => {
    global.fetch = realFetch
  })

  describe('Provider Information', () => {
    test('should return correct provider information', () => {
      const provider = adapter.getProvider()

      expect(provider.id).toBe('cloudflare')
      expect(provider.name).toBe('Cloudflare')
      expect(provider.requiresApiKey).toBe(true)
      expect(provider.defaultBaseURL).toBe('https://api.cloudflare.com/client/v4')
      expect(provider.supportsDynamicModels).toBe(false)
      expect(provider.connectionSchema?.required).toEqual(expect.arrayContaining(['apiKey', 'accountId']))
      expect(provider.connectionSchema?.optional).toEqual(expect.arrayContaining(['baseURL']))
      expect(provider.connectionSchema?.fieldTypes.apiKey).toBe('string')
      expect(provider.connectionSchema?.fieldTypes.accountId).toBe('string')
      expect(provider.connectionSchema?.fieldTypes.baseURL).toBe('string')
    })
  })

  describe('Static Models', () => {
    test('should return static Cloudflare image models', () => {
      const models = adapter.getModels()

      expect(Array.isArray(models)).toBe(true)
      expect(models).toHaveLength(1)
      expect(models[0]).toMatchObject({
        id: MODEL_ID,
        name: 'FLUX.2 [klein] 4B',
        providerId: 'cloudflare',
        capabilities: {
          text2image: true,
          image2image: true,
          multiImage: false
        },
        parameterDefinitions: expect.any(Array)
      })
    })

    test('should include width, height and seed parameters', () => {
      const model = adapter.getModels()[0]

      const widthParam = model.parameterDefinitions.find(param => param.name === 'width')
      const heightParam = model.parameterDefinitions.find(param => param.name === 'height')
      const seedParam = model.parameterDefinitions.find(param => param.name === 'seed')

      expect(widthParam?.defaultValue).toBe(1024)
      expect(heightParam?.defaultValue).toBe(1024)
      expect(seedParam?.type).toBe('integer')
    })
  })

  describe('Validation', () => {
    test('should require accountId in connection config', async () => {
      const config = createConfig()
      config.connectionConfig = {
        apiKey: 'test-api-key'
      }

      const request: ImageRequest = {
        prompt: 'A bright orange cat',
        configId: config.id,
        count: 1
      }

      await expect(adapter.generate(request, config))
        .rejects.toMatchObject({ code: IMAGE_ERROR_CODES.CONNECTION_CONFIG_MISSING_FIELD })
    })
  })

  describe('Image Generation', () => {
    test('should send text-to-image requests as multipart form data', async () => {
      const config = createConfig()
      const request: ImageRequest = {
        prompt: 'A bright orange cat sitting by the window',
        configId: config.id,
        count: 1
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          result: {
            image: 'aGVsbG8='
          }
        })
      })

      const result = await adapter.generate(request, config)

      const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.cloudflare.com/client/v4/accounts/test-account-id/ai/run/@cf/black-forest-labs/flux-2-klein-4b',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-api-key'
          },
          body: expect.any(FormData)
        })
      )

      const [, options] = fetchMock.mock.calls[0]
      const formData = options.body as FormData
      expect(formData.get('prompt')).toBe('A bright orange cat sitting by the window')
      expect(formData.get('width')).toBe('512')
      expect(formData.get('height')).toBe('512')
      expect(formData.get('seed')).toBe('42')

      expect(result.images).toHaveLength(1)
      expect(result.images[0]).toEqual({
        b64: 'aGVsbG8=',
        mimeType: 'image/jpeg',
        url: 'data:image/jpeg;base64,aGVsbG8='
      })
      expect(result.metadata?.providerId).toBe('cloudflare')
      expect(result.metadata?.modelId).toBe(MODEL_ID)
      expect(result.metadata?.configId).toBe(config.id)
    })

    test('should retry transient 5xx failures and eventually succeed', async () => {
      const config = createConfig()
      const request: ImageRequest = {
        prompt: 'A bright orange cat sitting by the window',
        configId: config.id,
        count: 1
      }

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({
            errors: [{ message: 'temporary upstream failure' }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            result: {
              image: 'aGVsbG8='
            }
          })
        })

      const result = await adapter.generate(request, config)

      const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(result.images[0]?.b64).toBe('aGVsbG8=')
    })

    test('should send input images as multipart file uploads for image edits', async () => {
      const config = createConfig()
      const request: ImageRequest = {
        prompt: 'Give the cat a blue knitted hat',
        configId: config.id,
        count: 1,
        inputImage: {
          b64: 'aGVsbG8=',
          mimeType: 'image/png'
        }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          result: {
            image: 'ZWRpdGVk'
          }
        })
      })

      const result = await adapter.generate(request, config)

      const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
      const [, options] = fetchMock.mock.calls[0]
      const formData = options.body as FormData
      const inputFile = formData.get('input_image_0')

      expect(formData.get('prompt')).toBe('Give the cat a blue knitted hat')
      expect(inputFile).toBeInstanceOf(File)
      expect((inputFile as File).type).toBe('image/png')
      expect(await (inputFile as File).text()).toBe('hello')
      expect(result.images[0]?.b64).toBe('ZWRpdGVk')
    })

    test('should not retry non-retryable 4xx failures', async () => {
      const config = createConfig()
      const request: ImageRequest = {
        prompt: 'A bright orange cat sitting by the window',
        configId: config.id,
        count: 1
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          errors: [{ message: 'invalid prompt' }]
        })
      })

      await expect(adapter.generate(request, config))
        .rejects.toMatchObject({ code: IMAGE_ERROR_CODES.GENERATION_FAILED })

      const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    test('should reject invalid response payloads', async () => {
      const config = createConfig()
      const request: ImageRequest = {
        prompt: 'A red paper lantern hanging in a rainy alley',
        configId: config.id,
        count: 1
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          result: {}
        })
      })

      await expect(adapter.generate(request, config))
        .rejects.toMatchObject({ code: IMAGE_ERROR_CODES.INVALID_RESPONSE_FORMAT })
    })
  })

  describe.skipIf(!RUN_REAL_API || !process.env.VITE_CF_API_TOKEN || !process.env.VITE_CF_ACCOUNT_ID)('Real API Integration', () => {
    test('should perform a real Cloudflare text-to-image request', async () => {
      const realAdapter = new CloudflareImageAdapter()
      const config: ImageModelConfig = {
        id: 'real-cloudflare-config',
        name: 'Real Cloudflare Config',
        providerId: 'cloudflare',
        modelId: MODEL_ID,
        enabled: true,
        connectionConfig: {
          apiKey: process.env.VITE_CF_API_TOKEN!,
          accountId: process.env.VITE_CF_ACCOUNT_ID!
        },
        paramOverrides: {
          width: 512,
          height: 512,
          seed: 42
        },
        provider: realAdapter.getProvider(),
        model: realAdapter.getModels()[0]
      }

      const request: ImageRequest = {
        prompt: 'A simple orange tabby cat portrait, realistic photo',
        configId: config.id,
        count: 1
      }

      const result = await realAdapter.generate(request, config)

      expect(result.images).toHaveLength(1)
      expect(result.images[0]?.b64).toBeTruthy()
    }, 180000)

    test('should perform a real Cloudflare image edit request', async () => {
      const realAdapter = new CloudflareImageAdapter()
      const config: ImageModelConfig = {
        id: 'real-cloudflare-edit-config',
        name: 'Real Cloudflare Edit Config',
        providerId: 'cloudflare',
        modelId: MODEL_ID,
        enabled: true,
        connectionConfig: {
          apiKey: process.env.VITE_CF_API_TOKEN!,
          accountId: process.env.VITE_CF_ACCOUNT_ID!
        },
        paramOverrides: {
          width: 512,
          height: 512,
          seed: 42
        },
        provider: realAdapter.getProvider(),
        model: realAdapter.getModels()[0]
      }

      const generated = await realAdapter.generate({
        prompt: 'A realistic portrait photo of an orange tabby cat',
        configId: config.id,
        count: 1
      }, config)

      const edited = await realAdapter.generate({
        prompt: 'Keep the orange tabby cat unchanged, add a blue knitted hat, realistic photo',
        configId: config.id,
        count: 1,
        inputImage: {
          b64: generated.images[0]?.b64 || '',
          mimeType: generated.images[0]?.mimeType || 'image/jpeg'
        }
      }, config)

      expect(generated.images[0]?.b64).toBeTruthy()
      expect(edited.images).toHaveLength(1)
      expect(edited.images[0]?.b64).toBeTruthy()
      expect(edited.images[0]?.b64).not.toBe(generated.images[0]?.b64)
    }, 300000)
  })
})
