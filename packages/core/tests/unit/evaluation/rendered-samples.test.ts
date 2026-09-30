import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

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

class CapturingEvaluationLLM implements ILLMService {
  public lastMessages: Message[] = []

  constructor(private responseContent: string) {}

  async sendMessage(messages: Message[], _provider: string): Promise<string> {
    this.lastMessages = messages
    return this.responseContent
  }

  async sendMessageStructured(messages: Message[], provider: string): Promise<LLMResponse> {
    return { content: await this.sendMessage(messages, provider) }
  }

  async sendMessageStream(_messages: Message[], _provider: string, callbacks: StreamHandlers): Promise<void> {
    callbacks.onError(new Error('CapturingEvaluationLLM.sendMessageStream is not used in this test'))
  }

  async sendMessageStreamWithTools(
    _messages: Message[],
    _provider: string,
    _tools: ToolDefinition[],
    callbacks: StreamHandlers
  ): Promise<void> {
    callbacks.onError(new Error('CapturingEvaluationLLM.sendMessageStreamWithTools is not used in this test'))
  }

  async testConnection(_provider: string): Promise<void> {
    throw new Error('CapturingEvaluationLLM.testConnection is not used in this test')
  }

  async fetchModelList(_provider: string, _customConfig?: any): Promise<ModelOption[]> {
    return []
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesRoot = resolve(__dirname, '../../fixtures/evaluation-rendered')

const createService = (responseContent: string) => {
  const modelKey = 'sample-render-model'
  const templateManager = new TemplateManager(
    new MemoryStorageProvider(),
    new StubTemplateLanguageService('zh-CN')
  )
  const modelManager = new StubModelManager({
    [modelKey]: {
      id: modelKey,
      name: 'Sample Render Model',
      enabled: true,
      providerMeta: {
        id: 'sample',
        name: 'Sample',
        requiresApiKey: false,
        defaultBaseURL: 'https://example.com',
        supportsDynamicModels: false,
      },
      modelMeta: {
        id: modelKey,
        name: 'Sample Render Model',
        providerId: 'sample',
        capabilities: { supportsTools: false },
        parameterDefinitions: [],
      },
      connectionConfig: {},
      paramOverrides: {},
    },
  })
  const llm = new CapturingEvaluationLLM(
    JSON.stringify({
      score: {
        overall: 80,
        dimensions: [
          { key: 'overall', label: 'Overall', score: 80 },
        ],
      },
      improvements: [],
      patchPlan: [],
      summary: 'ok',
    })
  )
  return {
    llm,
    service: new EvaluationService(llm, modelManager, templateManager),
  }
}

const toMarkdown = (messages: Message[]) =>
  messages
    .map(
      (message, index) =>
        `## Message ${index + 1} (${message.role})\n\n\`\`\`text\n${message.content}\n\`\`\`\n`
    )
    .join('\n')

const normalizeMarkdown = (value: string) => value.replace(/\r\n/g, '\n').trim()

const basePoemPrompt =
  '请写一首关于秋日思念的七言律诗。具体要求：1. 八句四联，押平声韵。2. 通过秋景间接表达思念。3. 语言凝练含蓄，不要解释。'

const approvalCases: Array<{
  title: string
  fixture: string
  request: PromptOnlyEvaluationRequest | ResultEvaluationRequest | CompareEvaluationRequest
}> = [
  {
    title: 'basic-user prompt-only stays minimal',
    fixture: 'basic-user-prompt-only.md',
    request: {
      type: 'prompt-only',
      evaluationModelKey: 'sample-render-model',
      mode: { functionMode: 'basic', subMode: 'user' },
      target: {
        workspacePrompt: basePoemPrompt,
      },
    },
  },
  {
    title: 'pro-variable prompt-only keeps structure without concrete values',
    fixture: 'pro-variable-prompt-only.md',
    request: {
      type: 'prompt-only',
      evaluationModelKey: 'sample-render-model',
      mode: { functionMode: 'pro', subMode: 'variable' },
      target: {
        workspacePrompt:
          '你是一位{{风格}}的诗人。请围绕“{{主题}}”创作一首古典风格诗歌，不要解释。',
        designContext: {
          kind: 'variables',
          label: 'Variable Structure',
          summary: '这里只说明模板变量结构，不包含任何测试值。',
          content: '变量: 风格, 主题',
        },
      },
    },
  },
  {
    title: 'basic-user result keeps evidence limited to single snapshot',
    fixture: 'basic-user-result.md',
    request: {
      type: 'result',
      evaluationModelKey: 'sample-render-model',
      mode: { functionMode: 'basic', subMode: 'user' },
      target: {
        workspacePrompt: basePoemPrompt,
        referencePrompt: '写一首诗',
      },
      testCase: {
        id: 'tc-basic-result-1',
        label: '测试内容',
        input: {
          kind: 'text',
          label: '测试内容',
          content: '无额外测试输入，输出直接基于当前提示词生成。',
        },
      },
      snapshot: {
        id: 'snap-basic-result-a',
        label: 'A',
        testCaseId: 'tc-basic-result-1',
        promptRef: { kind: 'original', label: '原始' },
        promptText: '写一首诗',
        output: '《秋思》\n\n落叶西风动客心，寒灯一盏照孤衾。',
        modelKey: 'siliconflow',
        versionLabel: '原始',
      },
    },
  },
  {
    title: 'basic-user compare renders generic test cases when inputs differ',
    fixture: 'basic-user-compare.md',
    request: {
      type: 'compare',
      evaluationModelKey: 'sample-render-model',
      mode: { functionMode: 'basic', subMode: 'user' },
      focus: { content: '优先比较哪种写法更能稳定避免解释性尾注', source: 'user', priority: 'highest' },
      target: {
        workspacePrompt: basePoemPrompt,
        referencePrompt: '写一首诗',
      },
      testCases: [
        {
          id: 'tc-basic-compare-2a',
          label: '测试内容-无附加输入',
          input: {
            kind: 'text',
            label: '测试内容',
            content: '无额外测试输入，输出直接基于当前提示词生成。',
          },
        },
        {
          id: 'tc-basic-compare-2b',
          label: '测试内容-指定意象',
          input: {
            kind: 'text',
            label: '测试内容',
            summary: '额外限制了意象范围',
            content: '请尽量使用霜叶、孤灯、归雁三个意象。',
          },
        },
      ],
      snapshots: [
        {
          id: 'snap-basic-compare-c',
          label: 'A',
          testCaseId: 'tc-basic-compare-2a',
          promptRef: { kind: 'original', label: '原始' },
          promptText: '写一首诗',
          output: '《秋思》\n\n秋风秋雨愁煞人。\n\n这首诗表达思念。',
          modelKey: 'siliconflow',
          versionLabel: '原始',
        },
        {
          id: 'snap-basic-compare-d',
          label: 'B',
          testCaseId: 'tc-basic-compare-2b',
          promptRef: { kind: 'workspace', label: '工作区' },
          promptText: basePoemPrompt,
          output: '《秋思》\n\n霜叶摇灯夜色长，雁声一缕过潇湘。',
          reasoning: '该版本没有再追加解释性尾注。',
          modelKey: 'dashscope',
          versionLabel: '工作区',
          executionInput: {
            kind: 'text',
            label: '意象约束',
            content: '霜叶、孤灯、归雁',
          },
        },
      ],
    },
  },
  {
    title: 'pro-multi compare keeps shared conversation context only once',
    fixture: 'pro-multi-compare.md',
    request: {
      type: 'compare',
      evaluationModelKey: 'sample-render-model',
      mode: { functionMode: 'pro', subMode: 'multi' },
      focus: { content: '优先判断 system 消息是否真正促使 assistant 先澄清', source: 'user', priority: 'highest' },
      target: {
        workspacePrompt: '作为 system 消息，要求 assistant 先澄清用户目标，再给出建议，且不要抢答。',
        referencePrompt: '作为 system 消息，给出建议',
      },
      testCases: [
        {
          id: 'tc-pro-multi-compare-1',
          label: 'Conversation Snapshot',
          input: {
            kind: 'conversation',
            label: 'Conversation Snapshot',
            summary: '目标消息已用“【当前执行提示词见下方快照】”标记，实际内容见下方执行提示词。',
            content: 'system: 【当前执行提示词见下方快照】\nuser: 我想做一个给团队用的笔记系统。',
          },
        },
      ],
      snapshots: [
        {
          id: 'snap-pro-multi-compare-a',
          label: 'A',
          testCaseId: 'tc-pro-multi-compare-1',
          promptRef: { kind: 'original', label: '原始' },
          promptText: '作为 system 消息，给出建议',
          output: '建议你直接选 Notion。',
          reasoning: '没有任何澄清问题。',
          modelKey: 'siliconflow',
          versionLabel: '原始',
        },
        {
          id: 'snap-pro-multi-compare-b',
          label: 'B',
          testCaseId: 'tc-pro-multi-compare-1',
          promptRef: { kind: 'workspace', label: '工作区' },
          promptText: '作为 system 消息，要求 assistant 先澄清用户目标，再给出建议，且不要抢答。',
          output: '你更关注多人实时协作、权限控制，还是知识沉淀与搜索？',
          reasoning: '先澄清了需求，没有直接给方案。',
          modelKey: 'dashscope',
          versionLabel: '工作区',
        },
      ],
    },
  },
]

describe('Rendered evaluation approvals', () => {
  it.each(approvalCases)('$title', async ({ request, fixture }) => {
    const { llm, service } = createService('ignored')
    await service.evaluate(request)

    const actual = normalizeMarkdown(toMarkdown(llm.lastMessages))
    const expected = normalizeMarkdown(
      await readFile(resolve(fixturesRoot, fixture), 'utf8')
    )

    expect(actual).toBe(expected)
  })
})
