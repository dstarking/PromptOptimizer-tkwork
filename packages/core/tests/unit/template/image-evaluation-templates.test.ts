import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TemplateManager } from '../../../src/services/template/manager'
import { MemoryStorageProvider } from '../../../src/services/storage/memoryStorageProvider'
import { PreferenceService } from '../../../src/services/preference/service'
import {
  createTemplateLanguageService,
  type TemplateLanguageService,
} from '../../../src/services/template/languageService'

describe('image text2image evaluation templates', () => {
  let templateManager: TemplateManager
  let languageService: TemplateLanguageService

  beforeEach(() => {
    const storageProvider = new MemoryStorageProvider()
    const preferenceService = new PreferenceService(storageProvider)

    languageService = createTemplateLanguageService(preferenceService)
    vi.spyOn(languageService, 'initialize').mockResolvedValue(undefined)
    vi.spyOn(languageService, 'setLanguage').mockResolvedValue(undefined)
    vi.spyOn(languageService, 'getSupportedLanguages').mockReturnValue(['en-US', 'zh-CN'])

    templateManager = new TemplateManager(storageProvider, languageService)
  })

  it('registers the zh-CN image result and compare templates', async () => {
    vi.spyOn(languageService, 'getCurrentLanguage').mockReturnValue('zh-CN')

    const resultTemplate = await templateManager.getTemplate('evaluation-image-text2image-result')
    const compareTemplate = await templateManager.getTemplate('evaluation-image-text2image-compare')

    expect(resultTemplate).toBeDefined()
    expect(compareTemplate).toBeDefined()
    expect(resultTemplate?.content[0]?.content).toContain('原始生图意图')
    expect(compareTemplate?.content[0]?.content).toContain('同一生图意图')
    expect(resultTemplate?.content[0]?.content).toContain('0-100')
    expect(compareTemplate?.content[0]?.content).toContain('0-100')
    expect(resultTemplate?.content[0]?.content).toContain('10 分制')
    expect(compareTemplate?.content[0]?.content).toContain('10 分制')
    expect(resultTemplate?.content[0]?.content).toContain('保持生成器无关')
    expect(compareTemplate?.content[0]?.content).toContain('保持生成器无关')
    expect(resultTemplate?.content[0]?.content).toContain('ControlNet')
    expect(compareTemplate?.content[0]?.content).toContain('ControlNet')
  })

  it('registers the zh-CN image prompt-only template with builder-style analysis contract', async () => {
    vi.spyOn(languageService, 'getCurrentLanguage').mockReturnValue('zh-CN')

    const promptOnlyTemplate = await templateManager.getTemplate('evaluation-image-text2image-prompt-only')

    expect(promptOnlyTemplate).toBeDefined()
    expect(promptOnlyTemplate?.content[0]?.content).toContain('Focus Brief')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('当前工作区图像生成提示词')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('本任务没有执行结果')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('不得凭空引入平台/提供商特定命令语法')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('原始意图句的镜像')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"workspacePrompt":')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"referencePrompt":')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"analysisStage":')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"designContext":')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"focusBrief":')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('analysisStage = "original-input"')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('analysisStage = "workspace"')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('Stage Contract')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('只输出合法 JSON，禁止 Markdown')
  })

  it('registers the zh-CN multiimage prompt-only template', async () => {
    vi.spyOn(languageService, 'getCurrentLanguage').mockReturnValue('zh-CN')

    const promptOnlyTemplate = await templateManager.getTemplate('evaluation-image-multiimage-prompt-only')

    expect(promptOnlyTemplate).toBeDefined()
    expect(promptOnlyTemplate?.content[0]?.content).toContain('当前工作区多图生图提示词')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('参考图融合明确性')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"workspacePrompt":')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"analysisStage":')
  })

  it('registers the zh-CN image prompt-iterate template with iteration evidence', async () => {
    vi.spyOn(languageService, 'getCurrentLanguage').mockReturnValue('zh-CN')

    const promptIterateTemplate = await templateManager.getTemplate('evaluation-image-text2image-prompt-iterate')

    expect(promptIterateTemplate).toBeDefined()
    expect(promptIterateTemplate?.content[0]?.content).toContain('Focus Brief')
    expect(promptIterateTemplate?.content[0]?.content).toContain('当前工作区图像生成提示词')
    expect(promptIterateTemplate?.content[0]?.content).toContain('iterateRequirement')
    expect(promptIterateTemplate?.content[0]?.content).toContain('只输出合法 JSON')
    expect(promptIterateTemplate?.content[1]?.content).toContain('"workspacePrompt":')
    expect(promptIterateTemplate?.content[1]?.content).toContain('"referencePrompt":')
    expect(promptIterateTemplate?.content[1]?.content).toContain('"iterateRequirement":')
    expect(promptIterateTemplate?.content[1]?.content).toContain('请基于这些证据')
  })

  it('registers the en-US image result and compare templates', async () => {
    vi.spyOn(languageService, 'getCurrentLanguage').mockReturnValue('en-US')

    const resultTemplate = await templateManager.getTemplate('evaluation-image-text2image-result')
    const compareTemplate = await templateManager.getTemplate('evaluation-image-text2image-compare')

    expect(resultTemplate).toBeDefined()
    expect(compareTemplate).toBeDefined()
    expect(resultTemplate?.content[0]?.content).toContain('original image-generation intent')
    expect(compareTemplate?.content[0]?.content).toContain('same image-generation intent')
    expect(resultTemplate?.content[0]?.content).toContain('0-100')
    expect(compareTemplate?.content[0]?.content).toContain('0-100')
    expect(resultTemplate?.content[0]?.content).toContain('10-point')
    expect(compareTemplate?.content[0]?.content).toContain('10-point')
    expect(resultTemplate?.content[0]?.content).toContain('stay generator-agnostic')
    expect(compareTemplate?.content[0]?.content).toContain('stay generator-agnostic')
    expect(resultTemplate?.content[0]?.content).toContain('ControlNet')
    expect(compareTemplate?.content[0]?.content).toContain('ControlNet')
  })

  it('registers the en-US image prompt-only template with builder-style analysis contract', async () => {
    vi.spyOn(languageService, 'getCurrentLanguage').mockReturnValue('en-US')

    const promptOnlyTemplate = await templateManager.getTemplate('evaluation-image-text2image-prompt-only')

    expect(promptOnlyTemplate).toBeDefined()
    expect(promptOnlyTemplate?.content[0]?.content).toContain('Focus Brief')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('current workspace image-generation prompt')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('this task has no execution result')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('must not invent provider-specific command syntax')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('raw intent sentence')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"workspacePrompt":')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"referencePrompt":')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"analysisStage":')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"designContext":')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"focusBrief":')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('analysisStage = "original-input"')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('analysisStage = "workspace"')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('Stage Contract')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('No Markdown, no code fences')
  })

  it('registers the en-US multiimage prompt-only template', async () => {
    vi.spyOn(languageService, 'getCurrentLanguage').mockReturnValue('en-US')

    const promptOnlyTemplate = await templateManager.getTemplate('evaluation-image-multiimage-prompt-only')

    expect(promptOnlyTemplate).toBeDefined()
    expect(promptOnlyTemplate?.content[0]?.content).toContain('current workspace multi-image generation prompt')
    expect(promptOnlyTemplate?.content[0]?.content).toContain('Reference Integration')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"workspacePrompt":')
    expect(promptOnlyTemplate?.content[1]?.content).toContain('"analysisStage":')
  })

  it('registers the en-US image prompt-iterate template with iteration evidence', async () => {
    vi.spyOn(languageService, 'getCurrentLanguage').mockReturnValue('en-US')

    const promptIterateTemplate = await templateManager.getTemplate('evaluation-image-text2image-prompt-iterate')

    expect(promptIterateTemplate).toBeDefined()
    expect(promptIterateTemplate?.content[0]?.content).toContain('Focus Brief')
    expect(promptIterateTemplate?.content[0]?.content).toContain('current workspace image-generation prompt')
    expect(promptIterateTemplate?.content[0]?.content).toContain('iterateRequirement')
    expect(promptIterateTemplate?.content[0]?.content).toContain('valid JSON')
    expect(promptIterateTemplate?.content[1]?.content).toContain('"workspacePrompt":')
    expect(promptIterateTemplate?.content[1]?.content).toContain('"referencePrompt":')
    expect(promptIterateTemplate?.content[1]?.content).toContain('"iterateRequirement":')
    expect(promptIterateTemplate?.content[1]?.content).toContain('Please evaluate against this evidence')
  })
})
