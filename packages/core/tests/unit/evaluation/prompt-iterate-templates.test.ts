import { describe, it, expect } from 'vitest'

import { TemplateManager } from '../../../src/services/template/manager'
import { MemoryStorageProvider } from '../../../src/services/storage/memoryStorageProvider'
import type {
  BuiltinTemplateLanguage,
  ITemplateLanguageService,
} from '../../../src/services/template/languageService'
import type { MessageTemplate, Template } from '../../../src/services/template/types'

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

function getFirstMessageContent(template: Template, role: MessageTemplate['role']): string {
  if (typeof template.content === 'string') {
    throw new Error(`Expected template.content to be MessageTemplate[], got string for: ${template.id}`)
  }

  const msg = template.content.find((m) => m.role === role)
  if (!msg) {
    throw new Error(`Missing role=${role} message in template: ${template.id}`)
  }
  return msg.content
}

const PROMPT_ITERATE_TEMPLATE_IDS = [
  'evaluation-basic-system-prompt-iterate',
  'evaluation-basic-user-prompt-iterate',
  'evaluation-pro-multi-prompt-iterate',
  'evaluation-pro-variable-prompt-iterate',
  'evaluation-image-text2image-prompt-iterate',
] as const

describe('Prompt-iterate evaluation templates', () => {
  it('zh-CN built-ins contain explicit user-feedback interpretation rules', async () => {
    const tm = new TemplateManager(
      new MemoryStorageProvider(),
      new StubTemplateLanguageService('zh-CN')
    )

    for (const id of PROMPT_ITERATE_TEMPLATE_IDS) {
      const template = await tm.getTemplate(id)
      const system = getFirstMessageContent(template, 'system')
      const user = getFirstMessageContent(template, 'user')

      expect(system).toContain('## Goal')
      expect(system).toContain('## Rules')
      expect(system).toContain('## Workflow')
      expect(system).toContain('Focus Brief')
      expect(system).toContain('patchPlan')
      expect(system).toContain('只输出合法 JSON')

      expect(user).toContain('## 当前工作区')
      expect(user).toContain('### 分析证据（JSON）')
      expect(user).toContain('"focusBrief":')
    }
  })

  it('en-US built-ins contain explicit user-feedback interpretation rules', async () => {
    const tm = new TemplateManager(
      new MemoryStorageProvider(),
      new StubTemplateLanguageService('en-US')
    )

    for (const id of PROMPT_ITERATE_TEMPLATE_IDS) {
      const template = await tm.getTemplate(id)
      const system = getFirstMessageContent(template, 'system')
      const user = getFirstMessageContent(template, 'user')

      expect(system).toContain('## Goal')
      expect(system).toContain('## Rules')
      expect(system).toContain('## Workflow')
      expect(system).toContain('Focus Brief')
      expect(system).toContain('patchPlan')
      expect(system).toContain('valid JSON')

      expect(user).toContain('## Current Workspace')
      expect(user).toContain('### Analysis Evidence (JSON)')
      expect(user).toContain('"focusBrief":')
    }
  })
})
