import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IMAGE_ERROR_CODES } from '../../../src/constants/error-codes'
import { GrokImageAdapter } from '../../../src/services/image/adapters/grok'
import type { ImageModelConfig, ImageRequest } from '../../../src/services/image/types'

describe('GrokImageAdapter', () => {
  let adapter: GrokImageAdapter
  let config: ImageModelConfig
  const realFetch = global.fetch

  beforeEach(() => {
    adapter = new GrokImageAdapter()
    const provider = adapter.getProvider()
    const model = adapter.getModels()[0]

    config = {
      id: 'image-grok-imagine',
      name: 'Grok Imagine',
      providerId: 'grok',
      modelId: model.id,
      enabled: true,
      connectionConfig: {
        apiKey: 'test-grok-key',
        baseURL: provider.defaultBaseURL
      },
      paramOverrides: {
        ...(model.defaultParameterValues || {})
      },
      provider,
      model
    }
  })

  afterEach(() => {
    global.fetch = realFetch
  })

  it('should expose current non-retired Grok Imagine model', () => {
    const models = adapter.getModels()

    expect(models.map(model => model.id)).toEqual(['grok-imagine-image-2.0'])
    expect(models[0].parameterDefinitions.find(parameter => parameter.name === 'quality')?.allowedValues)
      .toEqual(['auto', 'low', 'medium'])
    expect(models[0].providerId).toBe('grok')
    expect(models[0].capabilities).toEqual({
      text2image: true,
      image2image: true,
      multiImage: true
    })
    expect(models[0].defaultParameterValues).toEqual(
      expect.objectContaining({
        response_format: 'b64_json'
      })
    )
  })

  it('should send text-to-image requests to xAI image generation endpoint', async () => {
    const request: ImageRequest = {
      prompt: 'a city at dawn',
      configId: config.id,
      count: 1
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [{ b64_json: 'aW1hZ2U=' }]
      })
    })

    const result = await adapter.generate(request, config)

    expect(result.images[0].b64).toBe('aW1hZ2U=')
    expect(result.images[0].url).toBe('data:image/jpeg;base64,aW1hZ2U=')

    const [url, options] = (global.fetch as any).mock.calls[0]
    expect(url).toBe('https://api.x.ai/v1/images/generations')
    expect(options.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer test-grok-key',
        'Content-Type': 'application/json'
      })
    )

    const payload = JSON.parse(options.body)
    expect(payload).toEqual(
      expect.objectContaining({
        model: 'grok-imagine-image-2.0',
        prompt: 'a city at dawn',
        response_format: 'b64_json',
        n: 1
      })
    )
  })

  it('should send image edits as JSON instead of multipart form data', async () => {
    const request: ImageRequest = {
      prompt: 'make it cinematic',
      configId: config.id,
      inputImage: {
        b64: 'cmVmZXJlbmNl',
        mimeType: 'image/png'
      },
      count: 1
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [{ b64_json: 'ZWRpdA==' }]
      })
    })

    await adapter.generate(request, config)

    const [url, options] = (global.fetch as any).mock.calls[0]
    expect(url).toBe('https://api.x.ai/v1/images/edits')
    expect(options.body).not.toBeInstanceOf(FormData)

    const payload = JSON.parse(options.body)
    expect(payload).toEqual(
      expect.objectContaining({
        model: 'grok-imagine-image-2.0',
        prompt: 'make it cinematic',
        response_format: 'b64_json',
        n: 1,
        image: {
          type: 'image_url',
          url: 'data:image/png;base64,cmVmZXJlbmNl'
        }
      })
    )
  })

  it('should reject more than five input images before calling xAI', async () => {
    const request: ImageRequest = {
      prompt: 'combine references',
      configId: config.id,
      inputImages: Array.from({ length: 6 }, () => ({
        b64: 'cmVmZXJlbmNl',
        mimeType: 'image/png'
      })),
      count: 1
    }

    global.fetch = vi.fn()

    await expect(adapter.generate(request, config)).rejects.toMatchObject({
      code: IMAGE_ERROR_CODES.INPUT_IMAGE_TOO_MANY,
      params: {
        maxCount: 5,
        actualCount: 6
      }
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
