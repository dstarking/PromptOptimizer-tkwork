import { describe, expect, it } from 'vitest'

import { ALL_TEMPLATES } from '../../../src/services/template/default-templates'
import { StaticLoader } from '../../../src/services/template/static-loader'
import { Template } from '../../../src/services/template/types'

const getTemplateVariants = (id: string) =>
  Object.values(ALL_TEMPLATES).filter((template) => template.id === id)

const getMessageContents = (template: Template): string[] =>
  Array.isArray(template.content) ? template.content.map((message) => message.content) : [template.content]

const expectContainsOneOf = (content: string, phrases: string[]) => {
  expect(phrases.some((phrase) => content.includes(phrase))).toBe(true)
}

describe('SOUL template registration', () => {
  it('registers the SOUL template ids in optimize and iterate collections', () => {
    const loader = new StaticLoader()
    const templates = loader.loadTemplates()

    expect(templates.byType.optimize.zh['soul-openclaw-compose']).toBeDefined()
    expect(templates.byType.optimize.en['soul-openclaw-compose']).toBeDefined()
    expect(templates.byType.optimize.zh['soul-hermes-compose']).toBeDefined()
    expect(templates.byType.optimize.en['soul-hermes-compose']).toBeDefined()
    expect(templates.byType.iterate.zh['soul-iterate']).toBeDefined()
    expect(templates.byType.iterate.en['soul-iterate']).toBeDefined()

    expect(templates.byType.optimize.zh['soul-openclaw-compose'].name).toBe('OpenClaw-SOUL 结构化模板')
    expect(templates.byType.optimize.zh['soul-hermes-compose'].name).toBe('Hermes-SOUL 结构化模板')
    expect(templates.byType.iterate.zh['soul-iterate'].name).toBe('SOUL 定向迭代模板')
  })

  it('keeps single-file SOUL output as the default contract for compose templates', () => {
    const openclawVariants = getTemplateVariants('soul-openclaw-compose')
    const hermesVariants = getTemplateVariants('soul-hermes-compose')

    for (const template of [...openclawVariants, ...hermesVariants]) {
      const contents = getMessageContents(template).join('\n')

      expectContainsOneOf(contents, ['默认只输出一个文件', 'If the result only needs one file'])
      expectContainsOneOf(contents, ['直接输出 SOUL.md', 'output the SOUL.md body directly'])
      expect(contents).toContain('----- FILE: SOUL.md -----')
      expect(contents).toContain('----- END FILE -----')
      expect(contents).toContain('USER.md')
      expectContainsOneOf(contents, ['先判断输入里的信息属于哪一类', 'First classify the input'])
      expectContainsOneOf(contents, ['通用示例，不要逐字照抄', 'generic examples, do not copy literally'])
      expectContainsOneOf(contents, ['不要把“输出规则”', 'Do not write output instructions'])
      expectContainsOneOf(contents, [
        '不要为了“完整”而补齐通用模块',
        '不要为了看起来标准而补齐空模块',
        'omit it instead of padding with generic filler',
        'omit it instead of filling it with generic slogans'
      ])
      expectContainsOneOf(contents, ['不要默认生成专门的规则/界限小节', 'Do not create a dedicated rules/limits section by default'])
      expectContainsOneOf(contents, ['不要默认补行为限制', 'Do not default to adding behavioral restrictions'])
      expectContainsOneOf(contents, ['不要写 # SOUL.md', 'do not add file-name headings such as # SOUL.md'])
      expectContainsOneOf(contents, ['参考骨架示例（仅示意，不要逐字照抄，也不是硬性要求）', 'Reference skeleton (illustrative only, do not copy literally, and not mandatory)'])
      expectContainsOneOf(contents, ['# Core Identity', '# Default Behavior'])
      expectContainsOneOf(contents, ['# Speaking Style', '# Task Behavior'])
      expectContainsOneOf(contents, ['# Example Lines', 'Example Lines'])
    }
  })

  it('treats targeted SOUL iteration as natural-language-first and optional file splitting', () => {
    const variants = getTemplateVariants('soul-iterate')

    for (const template of variants) {
      const contents = getMessageContents(template).join('\n')

      expect(Array.isArray(template.content)).toBe(true)
      expectContainsOneOf(contents, ['自然语言', 'natural-language'])
      expectContainsOneOf(contents, ['不依赖固定格式', 'do not depend on any fixed format'])
      expectContainsOneOf(contents, ['要叫我', 'Call me Xiaoye'])
      expect(contents).toContain('----- FILE: SOUL.md -----')
      expect(contents).toContain('USER.md')
      expectContainsOneOf(contents, ['先判断修改要求里哪些属于人格侧改动', 'First classify the revision request'])
      expectContainsOneOf(contents, ['通用示例，不要逐字照抄', 'generic examples, do not copy literally'])
      expectContainsOneOf(contents, ['不要把“输出规则”', 'Do not write output instructions'])
      expectContainsOneOf(contents, ['只改动与用户要求直接相关的章节', 'Change only the sections that are actually affected'])
      expectContainsOneOf(contents, ['不要默认补出专门的规则/界限小节', 'Do not create a dedicated rules/limits section by default'])
      expectContainsOneOf(contents, ['不要把界限改写成宽泛的拒绝规则', 'Do not rewrite limits into broad refusal rules'])
      expectContainsOneOf(contents, ['不要写 # SOUL.md', 'do not add file-name headings such as # SOUL.md'])
      expectContainsOneOf(contents, ['可参考的轻结构示意', 'Lightweight structure reference'])
      expectContainsOneOf(contents, ['不要把示意骨架原样贴回去', 'Do not paste the reference skeleton back verbatim'])
      expectContainsOneOf(contents, ['角色落地原则', 'Role-realization principles'])
      expectContainsOneOf(contents, ['默认自称、默认称呼', 'stable self-reference, default form of address'])
      expectContainsOneOf(contents, ['Task Behavior', '# Task Behavior'])
      expectContainsOneOf(contents, ['Example Lines', '# Example Lines'])
    }
  })
})
