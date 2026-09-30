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

describe('Image compare evaluation template guardrails', () => {
  it('zh-CN template forbids workspace bias and broad-intent overclaiming', async () => {
    const templateManager = new TemplateManager(
      new MemoryStorageProvider(),
      new StubTemplateLanguageService('zh-CN')
    )

    const template = await templateManager.getTemplate('evaluation-image-text2image-compare')
    const system = getFirstMessageContent(template, 'system')

    expect(system).toContain('不允许主场优势')
    expect(system).toContain('不能来自 workspacePrompt 自己额外写进去的细节')
    expect(system).toContain('不要把“更贴近 workspacePrompt”误写成“更贴近 originalIntent”')
    expect(system).toContain('mixed / limited advantage')
    expect(system).toContain('workspaceAdvantage 通常不应超过 75')
    expect(system).toContain('负面提示词')
    expect(system).toContain('随机种子')
    expect(system).toContain('如果 workspace 已经明显赢了且没有暴露出实质缺口，improvements 可以为空数组')
    expect(system).toContain('只有同时满足以下条件时，才允许给 patchPlan')
  })

  it('en-US template forbids workspace bias and broad-intent overclaiming', async () => {
    const templateManager = new TemplateManager(
      new MemoryStorageProvider(),
      new StubTemplateLanguageService('en-US')
    )

    const template = await templateManager.getTemplate('evaluation-image-text2image-compare')
    const system = getFirstMessageContent(template, 'system')

    expect(system).toContain('Do not apply home-field bias')
    expect(system).toContain('never from extra details that workspacePrompt added on its own')
    expect(system).toContain('Do not confuse "closer to workspacePrompt" with "closer to originalIntent"')
    expect(system).toContain('mixed / limited-advantage judgement')
    expect(system).toContain('workspaceAdvantage should usually stay at or below 75')
    expect(system).toContain('negative prompts')
    expect(system).toContain('random seeds')
    expect(system).toContain('If workspace already wins clearly and no meaningful gap is exposed, improvements may be []')
    expect(system).toContain('Only provide patchPlan when all of the following are true')
  })
})
