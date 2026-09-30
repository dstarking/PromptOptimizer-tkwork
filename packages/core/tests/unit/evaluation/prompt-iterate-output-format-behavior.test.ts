import { describe, it, expect } from 'vitest'

import { EvaluationService } from '../../../src/services/evaluation/service'
import type { PromptIterateEvaluationRequest } from '../../../src/services/evaluation/types'

import type {
  ILLMService,
  LLMResponse,
  Message,
  ModelOption,
  StreamHandlers,
  ToolDefinition,
} from '../../../src/services/llm/types'
import type { IModelManager, TextModelConfig } from '../../../src/services/model/types'

import { TemplateManager } from '../../../src/services/template/manager'
import { MemoryStorageProvider } from '../../../src/services/storage/memoryStorageProvider'
import type {
  BuiltinTemplateLanguage,
  ITemplateLanguageService,
} from '../../../src/services/template/languageService'

class StubTemplateLanguageService implements ITemplateLanguageService {
  private lang: BuiltinTemplateLanguage

  constructor(lang: BuiltinTemplateLanguage) {
    this.lang = lang
  }

  async initialize() {}
  async getCurrentLanguage() {
    return this.lang
  }
  async setLanguage(language: BuiltinTemplateLanguage) {
    this.lang = language
  }
  async toggleLanguage() {
    this.lang = this.lang === 'zh-CN' ? 'en-US' : 'zh-CN'
    return this.lang
  }
  async isValidLanguage(language: string) {
    return language === 'zh-CN' || language === 'en-US'
  }
  async getSupportedLanguages() {
    return ['zh-CN', 'en-US'] as BuiltinTemplateLanguage[]
  }
  getLanguageDisplayName(language: BuiltinTemplateLanguage) {
    return language
  }
  isInitialized() {
    return true
  }
}

class StubModelManager implements IModelManager {
  constructor(private models: Record<string, TextModelConfig>) {}

  async ensureInitialized(): Promise<void> {}
  async isInitialized(): Promise<boolean> {
    return true
  }
  async getAllModels(): Promise<TextModelConfig[]> {
    return Object.values(this.models)
  }
  async getModel(key: string): Promise<TextModelConfig | undefined> {
    return this.models[key]
  }
  async addModel(key: string, config: TextModelConfig): Promise<void> {
    this.models[key] = config
  }
  async updateModel(key: string, config: Partial<TextModelConfig>): Promise<void> {
    const current = this.models[key]
    if (!current) return
    this.models[key] = { ...current, ...config }
  }
  async deleteModel(key: string): Promise<void> {
    delete this.models[key]
  }
  async enableModel(key: string): Promise<void> {
    const current = this.models[key]
    if (!current) return
    this.models[key] = { ...current, enabled: true }
  }
  async disableModel(key: string): Promise<void> {
    const current = this.models[key]
    if (!current) return
    this.models[key] = { ...current, enabled: false }
  }
  async getEnabledModels(): Promise<TextModelConfig[]> {
    return Object.values(this.models).filter((m) => m.enabled)
  }
  async exportData(): Promise<any> {
    return []
  }
  async importData(_data: any): Promise<void> {}
  async getDataType(): Promise<string> {
    return 'models'
  }
  async validateData(_data: any): Promise<boolean> {
    return true
  }
}

class RuleBasedEvaluationLLM implements ILLMService {
  public lastMessages: Message[] = []

  async sendMessage(messages: Message[], _provider: string): Promise<string> {
    this.lastMessages = messages
    const text = messages.map((m) => m.content).join('\n\n')

    const hasWorkspacePrompt = text.includes('## 当前工作区系统提示词')
    const hasIterateRequirement = text.includes('"iterateRequirement":')
    const hasFocusBrief = text.includes('"focusBrief":')

    return JSON.stringify({
      score: {
        overall: hasWorkspacePrompt && hasIterateRequirement && hasFocusBrief ? 92 : 60,
        dimensions: [
          { key: 'goalClarity', label: '目标清晰度', score: 92 },
          { key: 'instructionCompleteness', label: '指令完备度', score: 91 },
          { key: 'structuralExecutability', label: '结构可执行性', score: 92 },
          { key: 'ambiguityControl', label: '歧义控制', score: 93 },
          { key: 'robustness', label: '稳健性', score: 92 },
        ],
      },
      improvements: [
        hasFocusBrief
          ? '优先围绕聚焦问题收敛输出结构要求。'
          : '需要显式声明聚焦问题。',
      ],
      patchPlan: [],
      summary: hasFocusBrief ? '聚焦结构问题' : '缺少聚焦信息',
    })
  }

  async sendMessageStructured(messages: Message[], provider: string): Promise<LLMResponse> {
    return { content: await this.sendMessage(messages, provider) }
  }

  async sendMessageStream(_messages: Message[], _provider: string, callbacks: StreamHandlers): Promise<void> {
    callbacks.onError(new Error('RuleBasedEvaluationLLM.sendMessageStream is not used in this test'))
  }

  async sendMessageStreamWithTools(
    _messages: Message[],
    _provider: string,
    _tools: ToolDefinition[],
    callbacks: StreamHandlers
  ): Promise<void> {
    callbacks.onError(new Error('RuleBasedEvaluationLLM.sendMessageStreamWithTools is not used in this test'))
  }

  async testConnection(_provider: string): Promise<void> {
    throw new Error('RuleBasedEvaluationLLM.testConnection is not used in this test')
  }

  async fetchModelList(_provider: string, _customConfig?: any): Promise<ModelOption[]> {
    return []
  }
}

describe('Prompt-iterate template behavior', () => {
  it('renders workspace prompt, iterate requirement, and focus brief together', async () => {
    const templateManager = new TemplateManager(
      new MemoryStorageProvider(),
      new StubTemplateLanguageService('zh-CN')
    )

    const modelKey = 'test-model'
    const modelManager = new StubModelManager({
      [modelKey]: {
        id: modelKey,
        name: 'Test Model',
        enabled: true,
        providerMeta: {
          id: 'test',
          name: 'Test',
          requiresApiKey: false,
          defaultBaseURL: 'https://example.com',
          supportsDynamicModels: false,
        },
        modelMeta: {
          id: modelKey,
          name: 'Test Model',
          providerId: 'test',
          capabilities: { supportsTools: false },
          parameterDefinitions: [],
        },
        connectionConfig: {},
        paramOverrides: {},
      }
    })

    const llm = new RuleBasedEvaluationLLM()
    const service = new EvaluationService(llm, modelManager, templateManager)

    const request: PromptIterateEvaluationRequest = {
      type: 'prompt-iterate',
      evaluationModelKey: modelKey,
      mode: { functionMode: 'basic', subMode: 'system' },
      target: {
        workspacePrompt: '# Profile\n...\n\n# Workflow\n...\n\n# Output\n默认只输出标题+正文',
        referencePrompt: '旧版本（参考）',
      },
      iterateRequirement: '需要简化最终输出结构，但不要误删提示词的章节骨架。',
      focus: {
        content: '优先检查输出结构是否过重，而不是要求删除 Profile / Workflow 这些章节。',
        source: 'user',
        priority: 'highest',
      },
    }

    const result = await service.evaluate(request)

    const promptText = llm.lastMessages.map((m) => m.content).join('\n\n')
    expect(promptText).toContain('## 当前工作区系统提示词')
    expect(promptText).toContain('### 分析证据（JSON）')
    expect(promptText).toContain('"iterateRequirement":')
    expect(promptText).toContain('"focusBrief":')
    expect(promptText).toContain('需要简化最终输出结构')
    expect(promptText).toContain('优先检查输出结构是否过重')

    expect(result.summary).toBe('聚焦结构问题')
    expect(result.improvements.join('\n')).toContain('聚焦问题')
  })
})
