import { computed, ref } from 'vue'

import type { ReferencePromptPreview } from '../../services/ImageStyleExtractor'

export type ReferenceActionKind = 'replicate' | 'style-learn'
export type ReferenceActionStatus = 'idle' | 'processing' | 'ready' | 'error'

interface ReferenceImageActionOptions {
  getCurrentPrompt: () => string
  applyPrompt: (prompt: string) => void
  applyVariables: (variables: Record<string, string>) => void
  resetPromptArtifacts?: () => void
}

const cloneVariables = (variables: Record<string, string>): Record<string, string> => ({
  ...variables,
})

const resolveGeneratedPrompt = (preview: ReferencePromptPreview): string => {
  const primaryPrompt = preview.prompt?.trim()
  if (primaryPrompt) {
    return preview.prompt
  }

  return preview.rawText?.trim() || ''
}

export function useReferenceImageActions(options: ReferenceImageActionOptions) {
  const actionKind = ref<ReferenceActionKind>('replicate')
  const status = ref<ReferenceActionStatus>('idle')
  const sourceImagePreviewUrl = ref('')
  const resultPreview = ref<ReferencePromptPreview | null>(null)
  const currentPromptSnapshot = ref('')
  const errorMessage = ref('')

  const canTriggerStyleLearning = computed(
    () => options.getCurrentPrompt().trim().length > 0,
  )
  const hasSourceImage = computed(() => sourceImagePreviewUrl.value.trim().length > 0)

  const requestAction = (nextActionKind: ReferenceActionKind) => {
    actionKind.value = nextActionKind
    currentPromptSnapshot.value =
      nextActionKind === 'style-learn' ? options.getCurrentPrompt().trim() : ''
  }

  const setSourceImagePreview = (previewUrl: string) => {
    sourceImagePreviewUrl.value = previewUrl.trim()
    resultPreview.value = null
    errorMessage.value = ''
  }

  const beginProcessing = () => {
    status.value = 'processing'
    resultPreview.value = null
    errorMessage.value = ''
  }

  const setResultPreview = (preview: ReferencePromptPreview) => {
    resultPreview.value = {
      prompt: resolveGeneratedPrompt(preview),
      variableDefaults: cloneVariables(preview.variableDefaults),
      rawText: preview.rawText,
    }
    status.value = 'ready'
    errorMessage.value = ''
  }

  const setError = (message: string) => {
    status.value = 'error'
    errorMessage.value = message.trim()
    resultPreview.value = null
  }

  const resetState = () => {
    status.value = 'idle'
    sourceImagePreviewUrl.value = ''
    resultPreview.value = null
    errorMessage.value = ''
    currentPromptSnapshot.value = ''
    actionKind.value = 'replicate'
  }

  const applyToCurrentPrompt = () => {
    if (!resultPreview.value) {
      return false
    }

    const prompt = resolveGeneratedPrompt(resultPreview.value)
    if (!prompt.trim()) {
      return false
    }

    options.applyPrompt(prompt)
    options.applyVariables(cloneVariables(resultPreview.value.variableDefaults))
    options.resetPromptArtifacts?.()
    return true
  }

  return {
    actionKind,
    status,
    sourceImagePreviewUrl,
    resultPreview,
    currentPromptSnapshot,
    errorMessage,
    canTriggerStyleLearning,
    hasSourceImage,
    requestAction,
    setSourceImagePreview,
    beginProcessing,
    setResultPreview,
    setError,
    resetState,
    applyToCurrentPrompt,
  }
}
