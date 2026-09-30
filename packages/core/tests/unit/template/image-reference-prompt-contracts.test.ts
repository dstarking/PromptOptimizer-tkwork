import { describe, expect, it } from 'vitest'

import { imagePromptCompositionTemplate } from '../../../src/services/template/default-templates/image-prompt-composition'
import { imagePromptMigrationTemplate } from '../../../src/services/template/default-templates/image-prompt-migration'
import { TemplateProcessor } from '../../../src/services/template/processor'

function collectContent(template: typeof imagePromptCompositionTemplate): string {
  return template.content
    .map((message) => (typeof message.content === 'string' ? message.content : ''))
    .join('\n\n')
}

describe('image reference prompt contracts', () => {
  it('uses a replication-first prompt contract for reference-only generation', () => {
    const content = collectContent(imagePromptCompositionTemplate)

    expect(content).toContain('唯一目标：把这张参考图尽可能准确地翻译')
    expect(content).toContain('prompt 内的键名与字段值默认都使用中文')
    expect(content).toContain('严禁主动添加')
    expect(content).toContain('不要直接写角色专名')
    expect(content).toContain('尽量写进 prompt，不要只保留主体本身')
    expect(content).toContain('必须保守命名')
    expect(content).toContain('变量是锦上添花，不是主要目标')
    expect(content).toContain('只有以下类型默认考虑变量化')
    expect(content).toContain('变量优先顺序固定为')
    expect(content).toContain('不要把以下内容做成变量')
    expect(content).toContain('提交前自检三次')
  })

  it('renders the literal double-brace placeholder guidance for reference-only generation', () => {
    const messages = TemplateProcessor.processTemplate(imagePromptCompositionTemplate, {
      generationGoal: '文生图参考生成',
      promptRequirement: '当前没有原始提示词，请直接根据参考图反推一份可复用、可直接生图的结构化 JSON 提示词。',
    })
    const systemPrompt = messages.find((message) => message.role === 'system')?.content ?? ''

    expect(systemPrompt).toContain('{{变量名}}')
    expect(systemPrompt).not.toContain('以  的形式')
  })

  it('uses a direct style-migration contract when current prompt exists', () => {
    const content = collectContent(imagePromptMigrationTemplate)

    expect(content).toContain('把当前提示词中的内容置入参考图')
    expect(content).toContain('近乎完整的图像模板')
    expect(content).toContain('视觉重点')
    expect(content).toContain('不要把新主体当成外来物贴进原图')
    expect(content).toContain('自然融入')
    expect(content).toContain('如果用户明确要求不要拟人化')
    expect(content).toContain('双视图')
    expect(content).toContain('不要坍缩成普通单主体图')
    expect(content).toContain('角色化或拟人化融入')
    expect(content).toContain('保留参考图的气质等级')
    expect(content).toContain('不要自动幼态化或吉祥物化')
    expect(content).toContain('氛围、柔光、空气感、情绪张力')
    expect(content).toContain('仍然必须一眼可辨')
    expect(content).toContain('削弱主体识别的人类皮肤')
    expect(content).toContain('符合新主体自身解剖/材质逻辑')
    expect(content).toContain('比例倾向与表情张力')
    expect(content).toContain('不要自动改成大头、大眼、吐舌')
    expect(content).toContain('默认继续沿用参考图')
    expect(content).toContain('意外组合和叙事张力')
    expect(content).toContain('优先服务于“被置入/被替换的内容”')
    expect(content).toContain('禁止输出 {变量}、「变量」')
    expect(content).toContain('删掉所有没有在 prompt 中实际出现的 defaults')
    expect(content).toContain('默认使用中文')
  })

  it('renders the literal double-brace placeholder guidance for style migration', () => {
    const messages = TemplateProcessor.processTemplate(imagePromptMigrationTemplate, {
      generationGoal: '文生图参考生成',
      originalPrompt: '白色柴犬',
      promptRequirement: '白色柴犬',
    })
    const systemPrompt = messages.find((message) => message.role === 'system')?.content ?? ''

    expect(systemPrompt).toContain('{{变量名}}')
    expect(systemPrompt).toContain('双花括号形式')
    expect(systemPrompt).toContain('禁止输出 {变量}、「变量」')
  })
})
