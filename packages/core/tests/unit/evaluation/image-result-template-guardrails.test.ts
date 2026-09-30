import { describe, expect, it } from 'vitest'

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

  const message = template.content.find((item) => item.role === role)
  if (!message) {
    throw new Error(`Missing role=${role} message in template: ${template.id}`)
  }

  return message.content
}

describe('Image result evaluation template guardrails', () => {
  it('zh-CN template distinguishes lucky hits, prompt drift, and patch gating', async () => {
    const templateManager = new TemplateManager(
      new MemoryStorageProvider(),
      new StubTemplateLanguageService('zh-CN')
    )

    const template = await templateManager.getTemplate('evaluation-image-text2image-result')
    const system = getFirstMessageContent(template, 'system')

    expect(system).toContain('幸运命中')
    expect(system).toContain('结果未遵循已明确提示')
    expect(system).toContain('不是把一次幸运结果反向展开成“复刻这张图”的新长提示词')
    expect(system).toContain('负面提示词')
    expect(system).toContain('随机种子')
    expect(system).toContain('只有同时满足以下条件时，才允许给 patchPlan')
  })

  it('en-US template distinguishes lucky hits, prompt drift, and patch gating', async () => {
    const templateManager = new TemplateManager(
      new MemoryStorageProvider(),
      new StubTemplateLanguageService('en-US')
    )

    const template = await templateManager.getTemplate('evaluation-image-text2image-result')
    const system = getFirstMessageContent(template, 'system')

    expect(system).toContain('lucky hit')
    expect(system).toContain('failed to follow a clear prompt')
    expect(system).toContain('not to reverse-engineer one lucky result into a new "replicate this image" prompt')
    expect(system).toContain('negative prompts')
    expect(system).toContain('random seeds')
    expect(system).toContain('Only provide patchPlan when all of the following are true')
  })
})
