import { describe, it, expect, beforeAll } from 'vitest';
import { TextAdapterRegistry } from '../../../src/services/llm/adapters/registry';
import type { TextModelConfig, Message, TextAdapter } from '../../../src/services/llm/types';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
beforeAll(() => {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
});

const RUN_REAL_API = process.env.RUN_REAL_API === '1';

/**
 * 辅助函数：从 adapter 创建测试配置
 * 避免硬编码模型和 baseURL，统一使用 adapter 的默认值
 */
function createTestConfig(
  adapter: TextAdapter,
  apiKey: string,
  paramOverrides: Record<string, any> = {},
  options: {
    modelId?: string
    connectionConfig?: Record<string, unknown>
  } = {}
): TextModelConfig {
  const models = adapter.getModels();
  const selectedModel = options.modelId
    ? models.find(model => model.id === options.modelId) || adapter.buildDefaultModel(options.modelId)
    : models[0];

  if (!selectedModel) {
    throw new Error(`No models available for adapter: ${adapter.getProvider().id}`);
  }

  return {
    id: adapter.getProvider().id,
    name: adapter.getProvider().name,
    enabled: true,
    providerMeta: adapter.getProvider(),
    modelMeta: selectedModel,
    connectionConfig: {
      apiKey,
      ...(options.connectionConfig || {})
      // 不覆盖 baseURL，使用 adapter 的默认值
    },
    paramOverrides
  };
}

describe.skipIf(!RUN_REAL_API)('Adapter Integration Tests - Real SDK', () => {
  let registry: TextAdapterRegistry;

  beforeAll(() => {
    registry = new TextAdapterRegistry();
  });

  describe('OpenAIAdapter Real API', () => {
    const hasApiKey = !!(process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY);
    const responsesTestModel =
      process.env.OPENAI_RESPONSES_TEST_MODEL ||
      process.env.VITE_OPENAI_RESPONSES_TEST_MODEL ||
      'gpt-5-mini';

    it.skipIf(!hasApiKey)('should successfully call OpenAI API with sendMessage', async () => {
      const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
      const adapter = registry.getAdapter('openai');
      
      const config = createTestConfig(adapter, apiKey!, {
        temperature: 0.7,
        max_tokens: 100
      });

      const messages: Message[] = [
        { role: 'user', content: '请用一句话介绍你自己' }
      ];

      const response = await adapter.sendMessage(messages, config);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.metadata.model).toBeDefined();

    }, 30000);

    it.skipIf(!hasApiKey)('should successfully call OpenAI Responses API with sendMessage', async () => {
      const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
      const adapter = registry.getAdapter('openai');

      const config = createTestConfig(
        adapter,
        apiKey!,
        {
          temperature: 0.3,
          max_output_tokens: 120
        },
        {
          modelId: responsesTestModel,
          connectionConfig: {
            requestStyle: 'responses'
          }
        }
      );

      const messages: Message[] = [
        { role: 'user', content: '请只用一句中文介绍你自己。' }
      ];

      const response = await adapter.sendMessage(messages, config);

      expect(response).toBeDefined();
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.metadata.model).toBe(responsesTestModel);
    }, 30000);

    it.skipIf(!hasApiKey)('should successfully stream OpenAI API with callbacks', async () => {
      const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
      const adapter = registry.getAdapter('openai');

      const config = createTestConfig(adapter, apiKey!);

      const messages: Message[] = [
        { role: 'user', content: '请说"你好"' }
      ];

      let contentTokens = '';
      let tokenCount = 0;
      let finalResponse: any = null;
      let isCompleted = false;

      await adapter.sendMessageStream(messages, config, {
        onToken: (token) => {
          contentTokens += token;
          tokenCount++;
        },
        onComplete: (response) => {
          finalResponse = response;
          isCompleted = true;
        },
        onError: (error) => {
          console.error('OpenAI streaming error:', error);
        }
      });

      expect(isCompleted).toBe(true);
      expect(tokenCount).toBeGreaterThan(0);
      expect(contentTokens.length).toBeGreaterThan(0);
      expect(finalResponse).toBeDefined();
      expect(finalResponse.content).toBe(contentTokens);
    }, 30000);

    it.skipIf(!hasApiKey)('should successfully stream OpenAI Responses API with callbacks', async () => {
      const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
      const adapter = registry.getAdapter('openai');

      const config = createTestConfig(
        adapter,
        apiKey!,
        {
          temperature: 0.3,
          max_output_tokens: 120
        },
        {
          modelId: responsesTestModel,
          connectionConfig: {
            requestStyle: 'responses'
          }
        }
      );

      const messages: Message[] = [
        { role: 'user', content: '请只回复“你好，Responses”。' }
      ];

      let contentTokens = '';
      let tokenCount = 0;
      let finalResponse: any = null;
      let isCompleted = false;

      await adapter.sendMessageStream(messages, config, {
        onToken: (token) => {
          contentTokens += token;
          tokenCount++;
        },
        onComplete: (response) => {
          finalResponse = response;
          isCompleted = true;
        },
        onError: (error) => {
          console.error('OpenAI Responses streaming error:', error);
        }
      });

      expect(isCompleted).toBe(true);
      expect(tokenCount).toBeGreaterThan(0);
      expect(contentTokens.length).toBeGreaterThan(0);
      expect(finalResponse).toBeDefined();
      expect(finalResponse.content).toBe(contentTokens);
      expect(finalResponse.metadata.model).toBe(responsesTestModel);
    }, 30000);

    it.skipIf(!hasApiKey)('should handle OpenAI API errors with stack trace', async () => {
      const adapter = registry.getAdapter('openai');
      const config = createTestConfig(adapter, 'invalid-api-key');

      const messages: Message[] = [
        { role: 'user', content: 'Test' }
      ];

      try {
        await adapter.sendMessage(messages, config);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.stack).toBeDefined();
        expect(error.message).toBeDefined();
      }
    }, 30000);
  });

  describe('GeminiAdapter Real API', () => {
    const hasApiKey = !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);

    it.skipIf(!hasApiKey)('should successfully call Gemini API', async () => {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      const adapter = registry.getAdapter('gemini');
      
      const config = createTestConfig(adapter, apiKey!, {
        temperature: 0.7,
        maxOutputTokens: 100
      });

      const messages: Message[] = [
        { role: 'user', content: '请用一句话介绍你自己' }
      ];

      const response = await adapter.sendMessage(messages, config);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
    }, 30000);

    it.skipIf(!hasApiKey)('should successfully stream Gemini API', async () => {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      const adapter = registry.getAdapter('gemini');
      
      const config = createTestConfig(adapter, apiKey!);

      const messages: Message[] = [
        { role: 'user', content: '请说"你好"' }
      ];

      let contentTokens = '';
      let tokenCount = 0;
      let isCompleted = false;

      await adapter.sendMessageStream(messages, config, {
        onToken: (token) => {
          contentTokens += token;
          tokenCount++;
        },
        onComplete: (response) => {
          isCompleted = true;
        },
        onError: (error) => {
          console.error('Gemini streaming error:', error);
        }
      });

      expect(isCompleted).toBe(true);
      expect(tokenCount).toBeGreaterThan(0);
      expect(contentTokens.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('DashScopeAdapter Real API', () => {
    const hasApiKey = !!(process.env.DASHSCOPE_API_KEY || process.env.VITE_DASHSCOPE_API_KEY);
    const runResponsesTests = hasApiKey && process.env.RUN_DASHSCOPE_RESPONSES_REAL_API === '1';
    const responsesTestModel =
      process.env.DASHSCOPE_RESPONSES_TEST_MODEL ||
      process.env.VITE_DASHSCOPE_RESPONSES_TEST_MODEL ||
      'qwen-plus';

    it.skipIf(!runResponsesTests)('should successfully call DashScope Responses API with sendMessage', async () => {
      const apiKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_DASHSCOPE_API_KEY;
      const adapter = registry.getAdapter('dashscope');

      const config = createTestConfig(
        adapter,
        apiKey!,
        {
          temperature: 0.3,
          max_output_tokens: 120
        },
        {
          modelId: responsesTestModel,
          connectionConfig: {
            requestStyle: 'responses'
          }
        }
      );

      const messages: Message[] = [
        { role: 'user', content: '请只用一句中文介绍你自己。' }
      ];

      const response = await adapter.sendMessage(messages, config);

      expect(response).toBeDefined();
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.metadata.model).toBe(responsesTestModel);
    }, 30000);

    it.skipIf(!runResponsesTests)('should successfully stream DashScope Responses API with callbacks', async () => {
      const apiKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_DASHSCOPE_API_KEY;
      const adapter = registry.getAdapter('dashscope');

      const config = createTestConfig(
        adapter,
        apiKey!,
        {
          temperature: 0.3,
          max_output_tokens: 120
        },
        {
          modelId: responsesTestModel,
          connectionConfig: {
            requestStyle: 'responses'
          }
        }
      );

      const messages: Message[] = [
        { role: 'user', content: '请只回复“你好，百炼 Responses”。' }
      ];

      let contentTokens = '';
      let tokenCount = 0;
      let finalResponse: any = null;
      let isCompleted = false;

      await adapter.sendMessageStream(messages, config, {
        onToken: (token) => {
          contentTokens += token;
          tokenCount++;
        },
        onComplete: (response) => {
          finalResponse = response;
          isCompleted = true;
        },
        onError: (error) => {
          console.error('DashScope Responses streaming error:', error);
        }
      });

      expect(isCompleted).toBe(true);
      expect(tokenCount).toBeGreaterThan(0);
      expect(contentTokens.length).toBeGreaterThan(0);
      expect(finalResponse).toBeDefined();
      expect(finalResponse.content).toBe(contentTokens);
      expect(finalResponse.metadata.model).toBe(responsesTestModel);
    }, 30000);
  });

  describe('AnthropicAdapter Real API', () => {
    const hasApiKey = !!(process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY);

    it.skipIf(!hasApiKey)('should successfully call Anthropic API', async () => {
      const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
      const adapter = registry.getAdapter('anthropic');
      
      const config = createTestConfig(adapter, apiKey!, {
        temperature: 0.7,
        max_tokens: 100
      });

      const messages: Message[] = [
        { role: 'user', content: '请用一句话介绍你自己' }
      ];

      const response = await adapter.sendMessage(messages, config);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
    }, 30000);

    it.skipIf(!hasApiKey)('should successfully stream Anthropic API', async () => {
      const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
      const adapter = registry.getAdapter('anthropic');
      
      const config = createTestConfig(adapter, apiKey!);

      const messages: Message[] = [
        { role: 'user', content: '请说"你好"' }
      ];

      let contentTokens = '';
      let tokenCount = 0;
      let isCompleted = false;

      await adapter.sendMessageStream(messages, config, {
        onToken: (token) => {
          contentTokens += token;
          tokenCount++;
        },
        onComplete: (response) => {
          isCompleted = true;
        },
        onError: (error) => {
          console.error('Anthropic streaming error:', error);
        }
      });

      expect(isCompleted).toBe(true);
      expect(tokenCount).toBeGreaterThan(0);
      expect(contentTokens.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Tool Calls Integration', () => {
    const hasOpenAI = !!(process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY);

    it.skipIf(!hasOpenAI)('should handle tool calls with OpenAI', async () => {
      const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
      const adapter = registry.getAdapter('openai');
      
      const config = createTestConfig(adapter, apiKey!);

      const messages: Message[] = [
        { role: 'user', content: '现在北京的天气怎么样?' }
      ];

      const tools = [
        {
          type: 'function' as const,
          function: {
            name: 'get_weather',
            description: '获取指定城市的天气信息',
            parameters: {
              type: 'object',
              properties: {
                city: {
                  type: 'string',
                  description: '城市名称'
                }
              },
              required: ['city']
            }
          }
        }
      ];

      let toolCalls: any[] = [];
      let isCompleted = false;

      await adapter.sendMessageStreamWithTools(messages, config, tools, {
        onToken: (token) => {
          // Content tokens
        },
        onToolCall: (toolCall) => {
          toolCalls.push(toolCall);
        },
        onComplete: (response) => {
          isCompleted = true;
        },
        onError: (error) => {
          console.error('Tool call error:', error);
        }
      });

      expect(isCompleted).toBe(true);
      expect(toolCalls.length).toBeGreaterThan(0);
      expect(toolCalls[0].function).toBeDefined();
      expect(toolCalls[0].function.name).toBe('get_weather');
      expect(toolCalls[0].function.arguments).toBeDefined();
    }, 30000);
  });

  describe('ModelScopeAdapter Real API', () => {
    const hasApiKey = !!(process.env.MODELSCOPE_API_KEY || process.env.VITE_MODELSCOPE_API_KEY);

    it.skipIf(!hasApiKey)('should successfully call ModelScope API with sendMessage', async () => {
      const apiKey = process.env.MODELSCOPE_API_KEY || process.env.VITE_MODELSCOPE_API_KEY;
      const adapter = registry.getAdapter('modelscope');

      const config = createTestConfig(adapter, apiKey!, {
        temperature: 0.7,
        max_tokens: 100
      });

      const messages: Message[] = [
        { role: 'user', content: '请用一句话介绍你自己' }
      ];

      const response = await adapter.sendMessage(messages, config);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.metadata.model).toBeDefined();
    }, 30000);

    it.skipIf(!hasApiKey)('should successfully stream ModelScope API with callbacks', async () => {
      const apiKey = process.env.MODELSCOPE_API_KEY || process.env.VITE_MODELSCOPE_API_KEY;
      const adapter = registry.getAdapter('modelscope');

      const config = createTestConfig(adapter, apiKey!);

      const messages: Message[] = [
        { role: 'user', content: '请说"你好"' }
      ];

      let contentTokens = '';
      let tokenCount = 0;
      let finalResponse: any = null;
      let isCompleted = false;

      await adapter.sendMessageStream(messages, config, {
        onToken: (token) => {
          contentTokens += token;
          tokenCount++;
        },
        onComplete: (response) => {
          finalResponse = response;
          isCompleted = true;
        },
        onError: (error) => {
          console.error('ModelScope streaming error:', error);
        }
      });

      expect(isCompleted).toBe(true);
      expect(tokenCount).toBeGreaterThan(0);
      expect(contentTokens.length).toBeGreaterThan(0);
      expect(finalResponse).toBeDefined();
      expect(finalResponse.content).toBe(contentTokens);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should throw clear error for unknown provider', () => {
      expect(() => registry.getAdapter('unknown-provider'))
        .toThrow(/Unknown (provider|文本模型提供商): unknown-provider/);
    });

    it('should return correct static models for each provider', () => {
      const openaiModels = registry.getStaticModels('openai');
      const geminiModels = registry.getStaticModels('gemini');
      const anthropicModels = registry.getStaticModels('anthropic');
      const modelscopeModels = registry.getStaticModels('modelscope');

      expect(openaiModels.length).toBeGreaterThan(0);
      expect(geminiModels.length).toBeGreaterThan(0);
      expect(anthropicModels.length).toBeGreaterThan(0);
      expect(modelscopeModels.length).toBeGreaterThan(0);

      expect(openaiModels.every(m => m.providerId === 'openai')).toBe(true);
      expect(geminiModels.every(m => m.providerId === 'gemini')).toBe(true);
      expect(anthropicModels.every(m => m.providerId === 'anthropic')).toBe(true);
      expect(modelscopeModels.every(m => m.providerId === 'modelscope')).toBe(true);
    });
  });
});
