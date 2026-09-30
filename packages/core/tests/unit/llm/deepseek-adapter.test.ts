import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DeepseekAdapter } from '../../../src/services/llm/adapters/deepseek-adapter'
import type { Message, TextModelConfig, ToolDefinition } from '../../../src/services/llm/types'

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

describe('DeepseekAdapter', () => {
  let adapter: DeepseekAdapter
  let config: TextModelConfig

  const messages: Message[] = [
    { role: 'user', content: 'Hello' }
  ]

  beforeEach(() => {
    adapter = new DeepseekAdapter()
    const provider = adapter.getProvider()
    const model = adapter.getModels()[0]

    config = {
      id: 'deepseek',
      name: 'DeepSeek',
      enabled: true,
      providerMeta: provider,
      modelMeta: model,
      connectionConfig: {
        apiKey: 'test-deepseek-key',
        baseURL: provider.defaultBaseURL
      },
      paramOverrides: {
        ...(model.defaultParameterValues || {})
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

  it('should expose the current DeepSeek static models only', () => {
    const models = adapter.getModels()

    expect(models.map((model) => model.id)).toEqual([
      'deepseek-v4-flash',
      'deepseek-v4-pro'
    ])
    expect(models[0].defaultParameterValues).toEqual({
      thinking_type: 'disabled'
    })
    expect(models[1].defaultParameterValues).toEqual({
      thinking_type: 'disabled'
    })
  })

  it('should build dynamic DeepSeek models with DeepSeek parameter defaults', async () => {
    mockOpenAIInstance.models.list.mockResolvedValue({
      data: [
        { id: 'deepseek-v4-pro', object: 'model', owned_by: 'deepseek' },
        { id: 'deepseek-v4-flash', object: 'model', owned_by: 'deepseek' }
      ]
    })

    const models = await adapter.getModelsAsync(config)

    expect(models.map((model) => model.id)).toEqual([
      'deepseek-v4-flash',
      'deepseek-v4-pro'
    ])
    expect(models[0].defaultParameterValues).toEqual({
      thinking_type: 'disabled'
    })
    expect(models[0].parameterDefinitions.map((definition) => definition.name)).toContain('thinking_type')
    expect(models[0].parameterDefinitions.map((definition) => definition.name)).toContain('reasoning_effort')
  })

  it('should convert thinking_type for non-streaming chat requests', async () => {
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

    await adapter.sendMessage(messages, {
      ...config,
      paramOverrides: {
        thinking_type: 'enabled',
        reasoning_effort: 'max',
        temperature: 0.2
      }
    })

    expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'deepseek-v4-flash',
        messages: [{ role: 'user', content: 'Hello' }],
        thinking: { type: 'enabled' },
        reasoning_effort: 'max',
        temperature: 0.2
      })
    )
    expect(mockOpenAIInstance.chat.completions.create.mock.calls[0][0]).not.toHaveProperty('thinking_type')
  })

  it('should send thinking disabled when thinking_type is missing', async () => {
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

    await adapter.sendMessage(messages, {
      ...config,
      paramOverrides: {}
    })

    expect(mockOpenAIInstance.chat.completions.create.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        thinking: { type: 'disabled' }
      })
    )
  })

  it('should convert thinking_type for streaming chat requests', async () => {
    mockOpenAIInstance.chat.completions.create.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          choices: [
            {
              delta: { content: 'ok' },
              finish_reason: null
            }
          ]
        }
      }
    })

    await adapter.sendMessageStream(
      messages,
      {
        ...config,
        paramOverrides: {
          thinking_type: 'enabled'
        }
      },
      {
        onToken: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn()
      }
    )

    expect(mockOpenAIInstance.chat.completions.create.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        stream: true,
        thinking: { type: 'enabled' }
      })
    )
    expect(mockOpenAIInstance.chat.completions.create.mock.calls[0][0]).not.toHaveProperty('thinking_type')
  })

  it('should convert thinking_type for tool streaming requests', async () => {
    mockOpenAIInstance.chat.completions.create.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          choices: [
            {
              delta: { content: 'ok' },
              finish_reason: null
            }
          ]
        }
      }
    })

    const tools: ToolDefinition[] = [
      {
        type: 'function',
        function: {
          name: 'lookup',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      }
    ]

    await adapter.sendMessageStreamWithTools(
      messages,
      {
        ...config,
        paramOverrides: {
          thinking_type: 'disabled'
        }
      },
      tools,
      {
        onToken: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn()
      }
    )

    expect(mockOpenAIInstance.chat.completions.create.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        tools,
        tool_choice: 'auto',
        thinking: { type: 'disabled' }
      })
    )
    expect(mockOpenAIInstance.chat.completions.create.mock.calls[0][0]).not.toHaveProperty('thinking_type')
  })

  it('should let config thinking_type win when image request overrides other params only', async () => {
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

    await adapter.sendImageUnderstanding(
      {
        userPrompt: 'Describe this image',
        images: [
          {
            b64: 'dGVzdA==',
            mimeType: 'image/png'
          }
        ],
        paramOverrides: {
          temperature: 0.1
        }
      },
      {
        ...config,
        paramOverrides: {
          thinking_type: 'enabled',
          reasoning_effort: 'high'
        }
      }
    )

    expect(mockOpenAIInstance.chat.completions.create.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        thinking: { type: 'enabled' },
        reasoning_effort: 'high',
        temperature: 0.1
      })
    )
    expect(mockOpenAIInstance.chat.completions.create.mock.calls[0][0]).not.toHaveProperty('thinking_type')
  })
})
