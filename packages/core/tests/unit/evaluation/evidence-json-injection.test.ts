import { describe, expect, it } from 'vitest'

import { EvaluationService } from '../../../src/services/evaluation/service'
import type {
  CompareEvaluationRequest,
  PromptOnlyEvaluationRequest,
  ResultEvaluationRequest,
} from '../../../src/services/evaluation/types'
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

class CapturingLLM implements ILLMService {
  public lastMessages: Message[] = []

  async sendMessage(messages: Message[], _provider: string): Promise<string> {
    this.lastMessages = messages
    return JSON.stringify({
      score: {
        overall: 80,
        dimensions: [{ key: 'overall', label: 'Overall', score: 80 }],
      },
      improvements: [],
      patchPlan: [],
      summary: 'ok',
      metadata: {
        compareMode: 'generic',
      },
    })
  }

  async sendMessageStructured(messages: Message[], provider: string): Promise<LLMResponse> {
    return { content: await this.sendMessage(messages, provider) }
  }

  async sendMessageStream(
    _messages: Message[],
    _provider: string,
    callbacks: StreamHandlers
  ): Promise<void> {
    callbacks.onError(new Error('CapturingLLM.sendMessageStream is not used in this test'))
  }

  async sendMessageStreamWithTools(
    _messages: Message[],
    _provider: string,
    _tools: ToolDefinition[],
    callbacks: StreamHandlers
  ): Promise<void> {
    callbacks.onError(new Error('CapturingLLM.sendMessageStreamWithTools is not used in this test'))
  }

  async testConnection(_provider: string): Promise<void> {
    throw new Error('CapturingLLM.testConnection is not used in this test')
  }

  async fetchModelList(_provider: string, _customConfig?: any): Promise<ModelOption[]> {
    return []
  }
}

const createService = () => {
  const modelKey = 'test-model'
  const templateManager = new TemplateManager(
    new MemoryStorageProvider(),
    new StubTemplateLanguageService('zh-CN')
  )
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
    },
  })
  const llm = new CapturingLLM()

  return {
    llm,
    modelKey,
    service: new EvaluationService(llm, modelManager, templateManager),
  }
}

describe('Evaluation template JSON evidence injection', () => {
  it('prompt-only analysis renders workspace prompt as JSON evidence', async () => {
    const { llm, modelKey, service } = createService()

    const request: PromptOnlyEvaluationRequest = {
      type: 'prompt-only',
      evaluationModelKey: modelKey,
      mode: { functionMode: 'basic', subMode: 'system' },
      target: {
        workspacePrompt: '# Role\n请输出 {"mode":"strict"}\n保留 {{topic}} 占位符',
      },
      focus: {
        content: '检查输出约束是否足够清晰',
        source: 'user',
        priority: 'highest',
      },
    }

    await service.evaluate(request)

    const promptText = llm.lastMessages.map((message) => message.content).join('\n\n')
    expect(promptText).toContain('分析证据（JSON）')
    expect(promptText).toContain('"workspacePrompt": "# Role\\n请输出 {\\"mode\\":\\"strict\\"}\\n保留 {{topic}} 占位符"')
    expect(promptText).toContain('"focusBrief": "检查输出约束是否足够清晰"')
  })

  it('result evaluation renders test input and snapshot as JSON evidence', async () => {
    const { llm, modelKey, service } = createService()

    const request: ResultEvaluationRequest = {
      type: 'result',
      evaluationModelKey: modelKey,
      mode: { functionMode: 'pro', subMode: 'variable' },
      target: {
        workspacePrompt: '你是一位{{风格}}的诗人。请写一首关于“{{主题}}”的诗，不要解释。',
      },
      testCase: {
        id: 'tc-var-json-1',
        label: '变量输入',
        input: {
          kind: 'variables',
          label: '变量输入',
          content: '风格=中文古典\n主题=程序员加班',
        },
      },
      snapshot: {
        id: 'snap-var-json-a',
        label: 'A',
        testCaseId: 'tc-var-json-1',
        promptRef: { kind: 'workspace', label: '工作区' },
        promptText: '你是一位{{风格}}的诗人。请写一首关于“{{主题}}”的诗，不要解释。',
        output: '《夜半敲键》',
        modelKey: 'dashscope',
        versionLabel: '工作区',
      },
    }

    await service.evaluate(request)

    const promptText = llm.lastMessages.map((message) => message.content).join('\n\n')
    expect(promptText).toContain('测试用例输入证据（JSON）')
    expect(promptText).toContain('"content": "风格=中文古典\\n主题=程序员加班"')
    expect(promptText).toContain('执行快照证据（JSON）')
    expect(promptText).toContain('"promptText": "你是一位{{风格}}的诗人。请写一首关于“{{主题}}”的诗，不要解释。"')
    expect(promptText).toContain('"output": "《夜半敲键》"')
  })

  it('generic compare evaluation renders snapshots as JSON evidence blocks', async () => {
    const { llm, modelKey, service } = createService()

    const request: CompareEvaluationRequest = {
      type: 'compare',
      evaluationModelKey: modelKey,
      mode: { functionMode: 'basic', subMode: 'user' },
      target: {
        workspacePrompt: '请写一首关于秋日思念的七言律诗，要求格律工整、婉约含蓄。',
      },
      testCases: [
        {
          id: 'tc-compare-json-1',
          label: '测试内容',
          input: {
            kind: 'text',
            label: '测试内容',
            content: '无额外测试输入，输出直接基于当前提示词生成。',
          },
        },
      ],
      snapshots: [
        {
          id: 'snap-compare-json-a',
          label: 'A',
          testCaseId: 'tc-compare-json-1',
          promptRef: { kind: 'original', label: '原始' },
          promptText: '写一首诗',
          output: '输出 A',
          modelKey: 'siliconflow',
          versionLabel: '原始',
        },
        {
          id: 'snap-compare-json-b',
          label: 'B',
          testCaseId: 'tc-compare-json-1',
          promptRef: { kind: 'version', version: 2, label: 'v2' },
          promptText: '写一首秋思诗，注意格律。',
          output: '输出 B',
          modelKey: 'deepseek',
          versionLabel: 'v2',
        },
      ],
    }

    await service.evaluate(request)

    const promptText = llm.lastMessages.map((message) => message.content).join('\n\n')
    expect(promptText).toContain('测试用例证据（JSON）')
    expect(promptText).toContain('快照证据（JSON）')
    expect(promptText).toContain('"promptText": "写一首诗"')
    expect(promptText).toContain('"promptText": "写一首秋思诗，注意格律。"')
    expect(promptText).toContain('"output": "输出 A"')
    expect(promptText).toContain('"output": "输出 B"')
  })
})
