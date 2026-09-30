import { beforeEach, describe, expect, it, vi } from 'vitest'
import { XiaomiMimoTokenPlanAdapter } from '../../../src/services/llm/adapters/xiaomi-mimo-token-plan-adapter'
import type { Message, TextModelConfig } from '../../../src/services/llm/types'

let mockOpenAIInstance: any

vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      constructor() {
        return mockOpenAIInstance
      }
    }
  }
})

describe('XiaomiMimoTokenPlanAdapter', () => {
  let adapter: XiaomiMimoTokenPlanAdapter
  let config: TextModelConfig

  const messages: Message[] = [
    { role: 'user', content: 'Hello' }
  ]

  beforeEach(() => {
    adapter = new XiaomiMimoTokenPlanAdapter()
    const provider = adapter.getProvider()
    const model = adapter.getModels()[0]

    config = {
      id: 'xiaomi-mimo-token-plan',
      name: 'Xiaomi MiMo Token Plan',
      enabled: true,
      providerMeta: provider,
      modelMeta: model,
      connectionConfig: {
        apiKey: 'test-mimo-key',
        baseURL: provider.defaultBaseURL
      },
      paramOverrides: {
        max_completion_tokens: 1024
      }
    }

    mockOpenAIInstance = {
      chat: {
        completions: {
          create: vi.fn()
        }
      },
      models: {
        list: vi.fn()
      },
      responses: {
        create: vi.fn()
      }
    }
  })

  it('should expose Xiaomi MiMo Token Plan provider metadata', () => {
    const provider = adapter.getProvider()

    expect(provider.id).toBe('xiaomi-mimo-token-plan')
    expect(provider.name).toBe('Xiaomi MiMo Token Plan')
    expect(provider.defaultBaseURL).toBe('https://token-plan-cn.xiaomimimo.com/v1')
    expect(provider.supportsDynamicModels).toBe(true)
    expect(provider.connectionSchema?.required).toEqual(['apiKey'])
    expect(provider.connectionSchema?.optional).toEqual(['baseURL'])
  })

  it('should expose only MiMo 2.5 Pro and MiMo 2.5 as static defaults', () => {
    const models = adapter.getModels()

    expect(models.map(model => model.id)).toEqual([
      'mimo-v2.5-pro',
      'mimo-v2.5'
    ])
    expect(models[0].capabilities.maxContextLength).toBe(1000000)
    expect(models[1].capabilities.supportsTools).toBe(true)
  })

  it('should use chat completions for Xiaomi MiMo Token Plan requests', async () => {
    mockOpenAIInstance.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'ok'
          },
          finish_reason: 'stop'
        }
      ]
    })

    await adapter.sendMessage(messages, config)

    expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mimo-v2.5-pro',
        messages: [{ role: 'user', content: 'Hello' }],
        max_completion_tokens: 1024
      })
    )
    expect(mockOpenAIInstance.responses.create).not.toHaveBeenCalled()
  })
})
