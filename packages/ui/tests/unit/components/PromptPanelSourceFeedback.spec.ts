import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PromptPanel from '../../../src/components/PromptPanel.vue'

const versions = [
  {
    id: 'record-v1',
    version: 1,
    originalPrompt: 'original prompt',
    optimizedPrompt: 'version one',
  },
  {
    id: 'record-v2',
    version: 2,
    originalPrompt: 'original prompt',
    optimizedPrompt: 'version two',
  },
]

const mountPromptPanel = (props: Record<string, unknown>) =>
  mount(PromptPanel, {
    props: {
      optimizedPrompt: 'version two',
      originalPrompt: 'original prompt',
      reasoning: '',
      optimizationMode: 'system',
      versions,
      currentVersionId: 'record-v2',
      ...props,
    },
    global: {
      stubs: {
        OutputDisplay: true,
        Modal: true,
        TemplateSelect: true,
        EvaluationScoreBadge: true,
        FocusAnalyzeButton: true,
        AnalyzeActionIcon: true,
      },
    },
  })

describe('PromptPanel source feedback', () => {
  it('highlights the resolved saved version tag', () => {
    const wrapper = mountPromptPanel({
      sourceFeedbackKey: 4,
      sourceFeedbackTone: 'change',
      sourceFeedbackVersion: 1,
    })

    const versionTag = wrapper.get('[data-testid="prompt-panel-version-tag-v1"]')
    expect(versionTag.classes()).toContain('version-tag-clickable--source-change')
    expect(versionTag.attributes('data-source-feedback-tone')).toBe('change')
  })

  it('highlights the original version tag when the resolved version is v0', () => {
    const wrapper = mountPromptPanel({
      sourceFeedbackKey: 2,
      sourceFeedbackTone: 'error',
      sourceFeedbackVersion: 0,
    })

    const originalTag = wrapper.get('[data-testid="prompt-panel-version-tag-v0"]')
    expect(originalTag.classes()).toContain('version-tag-clickable--source-error')
    expect(originalTag.attributes('data-source-feedback-tone')).toBe('error')
  })
})
