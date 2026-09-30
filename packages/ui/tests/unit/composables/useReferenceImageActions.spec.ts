import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import type { ReferencePromptPreview } from '../../../src/services/ImageStyleExtractor'
import { useReferenceImageActions } from '../../../src/composables/image/useReferenceImageActions'

describe('useReferenceImageActions', () => {
  const createPreview = (
    prompt = JSON.stringify(
      {
        场景: {
          主体: [{ 类型: '猫', 描述: '两只{{主体颜色}}的小猫' }],
        },
      },
      null,
      2,
    ),
  ): ReferencePromptPreview => ({
    prompt,
    variableDefaults: {
      主体颜色: '棕色',
    },
    rawText: '{"prompt":{"场景":{"主体":[{"类型":"猫","描述":"两只{{主体颜色}}的小猫"}]}}}',
  })

  it('根据当前提示词动态决定是否允许风格学习，并在触发时锁定提示词快照', () => {
    const currentPrompt = ref('')
    const currentVariables = ref<Record<string, string>>({})

    const actions = useReferenceImageActions({
      getCurrentPrompt: () => currentPrompt.value,
      applyPrompt: (nextPrompt) => {
        currentPrompt.value = nextPrompt
      },
      applyVariables: (nextVariables) => {
        currentVariables.value = { ...nextVariables }
      },
      resetPromptArtifacts: vi.fn(),
    })

    expect(actions.canTriggerStyleLearning.value).toBe(false)

    currentPrompt.value = '两只棕色的猫'
    expect(actions.canTriggerStyleLearning.value).toBe(true)

    actions.requestAction('style-learn')
    currentPrompt.value = '已经改成别的内容了'

    expect(actions.actionKind.value).toBe('style-learn')
    expect(actions.currentPromptSnapshot.value).toBe('两只棕色的猫')
    expect(actions.status.value).toBe('idle')
  })

  it('处理完成后默认不自动展开结果浮层，并保留缩略图和结果', () => {
    const currentPrompt = ref('两只棕色的猫')

    const actions = useReferenceImageActions({
      getCurrentPrompt: () => currentPrompt.value,
      applyPrompt: vi.fn(),
      applyVariables: vi.fn(),
      resetPromptArtifacts: vi.fn(),
    })

    actions.requestAction('replicate')
    actions.setSourceImagePreview('data:image/png;base64,ZmFrZS1pbWFnZQ==')
    actions.beginProcessing()
    actions.setResultPreview(createPreview())

    expect(actions.status.value).toBe('ready')
    expect(actions.sourceImagePreviewUrl.value).toContain('data:image/png;base64')
    expect(actions.resultPreview.value?.prompt).toContain('{{主体颜色}}')
    expect(actions.resultPreview.value?.variableDefaults).toEqual({
      主体颜色: '棕色',
    })
  })

  it('只保留轻量动作状态，不再暴露浮层编辑相关状态', () => {
    const actions = useReferenceImageActions({
      getCurrentPrompt: () => '两只棕色的猫',
      applyPrompt: vi.fn(),
      applyVariables: vi.fn(),
      resetPromptArtifacts: vi.fn(),
    })

    actions.requestAction('replicate')
    actions.setSourceImagePreview('data:image/png;base64,ZmFrZS1pbWFnZQ==')
    actions.setResultPreview(createPreview())

    expect(actions).not.toHaveProperty('showDialog')
    expect(actions).not.toHaveProperty('isPopoverVisible')
    expect(actions).not.toHaveProperty('resultVariableEntries')
    expect(actions).not.toHaveProperty('canApply')
    expect(actions).not.toHaveProperty('openPopover')
    expect(actions).not.toHaveProperty('closePopover')
  })

  it('应用结果时直接使用生成后的提示词和变量', () => {
    const currentPrompt = ref('两只棕色的猫')
    const currentVariables = ref<Record<string, string>>({
      老变量: '旧值',
    })
    const resetPromptArtifacts = vi.fn()

    const actions = useReferenceImageActions({
      getCurrentPrompt: () => currentPrompt.value,
      applyPrompt: (nextPrompt) => {
        currentPrompt.value = nextPrompt
      },
      applyVariables: (nextVariables) => {
        currentVariables.value = { ...nextVariables }
      },
      resetPromptArtifacts,
    })

    actions.requestAction('replicate')
    actions.setSourceImagePreview('data:image/png;base64,ZmFrZS1pbWFnZQ==')
    actions.setResultPreview(createPreview())

    const applied = actions.applyToCurrentPrompt()

    expect(applied).toBe(true)
    expect(currentPrompt.value).toContain('{{主体颜色}}')
    expect(currentVariables.value).toEqual({
      主体颜色: '棕色',
    })
    expect(resetPromptArtifacts).toHaveBeenCalledTimes(1)
  })

  it('当 prompt 为空时，应用时会回退到 rawText', () => {
    const currentPrompt = ref('')

    const actions = useReferenceImageActions({
      getCurrentPrompt: () => currentPrompt.value,
      applyPrompt: (nextPrompt) => {
        currentPrompt.value = nextPrompt
      },
      applyVariables: vi.fn(),
      resetPromptArtifacts: vi.fn(),
    })

    actions.requestAction('replicate')
    actions.setSourceImagePreview('data:image/png;base64,ZmFrZS1pbWFnZQ==')
    actions.setResultPreview({
      prompt: '',
      variableDefaults: {
        主体颜色: '棕色',
      },
      rawText: '{"场景":{"主体":"一只{{主体颜色}}的小猫"}}',
    })

    const applied = actions.applyToCurrentPrompt()

    expect(applied).toBe(true)
    expect(currentPrompt.value).toBe('{"场景":{"主体":"一只{{主体颜色}}的小猫"}}')
  })
})
