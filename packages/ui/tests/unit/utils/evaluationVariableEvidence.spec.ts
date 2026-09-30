import { describe, expect, it } from 'vitest'

import {
  collectReferencedBusinessVariableNames,
  formatVariableEvidenceEntries,
} from '../../../src/utils/evaluationVariableEvidence'

describe('evaluationVariableEvidence', () => {
  it('collects only referenced business variables and excludes internal predefined variables', () => {
    expect(
      collectReferencedBusinessVariableNames(
        [
          '你是一位{{风格}}的诗人。',
          '请根据“{{主题}}”创作，突出{{特征}}。',
          '不要引用{{currentPrompt}}、{{userQuestion}}、{{originalPrompt}}。',
        ].join(' ')
      )
    ).toEqual(['风格', '主题', '特征'])
  })

  it('dedupes repeated variables while preserving first-seen order', () => {
    expect(
      collectReferencedBusinessVariableNames(
        '请围绕{{主题}}写作，并再次呼应{{主题}}，同时体现{{风格}}。'
      )
    ).toEqual(['主题', '风格'])
  })

  it('formats variable evidence entries and falls back when none are provided', () => {
    expect(
      formatVariableEvidenceEntries(
        [
          { name: '风格', value: '中文古典' },
          { name: '主题', value: '程序员加班' },
        ],
        '无显式变量输入'
      )
    ).toBe('风格=中文古典\n主题=程序员加班')

    expect(formatVariableEvidenceEntries([], '无显式变量输入')).toBe('无显式变量输入')
  })
})
