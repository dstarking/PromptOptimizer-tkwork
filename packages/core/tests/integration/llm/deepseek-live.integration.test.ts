import { beforeAll, describe, expect, it } from 'vitest'
import dotenv from 'dotenv'
import path from 'path'
import { DeepseekAdapter } from '../../../src/services/llm/adapters/deepseek-adapter'
import type { Message, TextModelConfig } from '../../../src/services/llm/types'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const RUN_REAL_API = process.env.RUN_REAL_API === '1'
const API_KEY = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY

describe.skipIf(!RUN_REAL_API || !API_KEY)('DeepSeek Adapter - Real API', () => {
  let adapter: DeepseekAdapter
  let config: TextModelConfig

  beforeAll(() => {
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
        apiKey: API_KEY,
        baseURL: provider.defaultBaseURL
      },
      paramOverrides: {
        thinking_type: 'disabled',
        temperature: 0,
        max_tokens: 32
      }
    }
  })

  it('should call DeepSeek with thinking disabled by default', async () => {
    const messages: Message[] = [
      { role: 'user', content: '只回复两个字：你好' }
    ]

    const response = await adapter.sendMessage(messages, {
      ...config,
      paramOverrides: {
        temperature: 0,
        max_tokens: 32
      }
    })

    expect(response.content).toBeTruthy()
    expect(response.metadata.model).toBe('deepseek-v4-flash')
  }, 60000)

  it('should stream DeepSeek with thinking disabled', async () => {
    const messages: Message[] = [
      { role: 'user', content: '只回复两个字：你好' }
    ]

    let content = ''
    let completed = false

    await adapter.sendMessageStream(messages, config, {
      onToken: (token) => {
        content += token
      },
      onComplete: () => {
        completed = true
      },
      onError: (error) => {
        throw error
      }
    })

    expect(completed).toBe(true)
    expect(content).toBeTruthy()
  }, 60000)
})
