import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
}))

vi.mock('../../../src/composables/ui/useToast', () => ({
  useToast: () => toastSpies,
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
    }),
  }
})

vi.mock('../../../src/composables/mode', () => ({
  useFunctionMode: () => ({
    functionMode: ref('basic'),
  }),
}))

import { usePromptOptimizer } from '../../../src/composables/prompt/usePromptOptimizer'

describe('usePromptOptimizer history failure i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the localized save-history warning when contextual optimization history creation fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const promptService = {
      optimizePromptStream: vi.fn(async (_request, handlers) => {
        handlers.onToken('optimized output')
        await handlers.onComplete()
      }),
    }

    const services = ref({
      modelManager: {} as never,
      templateManager: {} as never,
      historyManager: {
        createNewChain: vi.fn().mockRejectedValue(new Error('disk full')),
      } as never,
      promptService: promptService as never,
    })

    const optimizer = usePromptOptimizer(
      services,
      ref<'system' | 'user'>('system'),
      ref('test-model'),
    )

    optimizer.prompt = 'rewrite this prompt'
    optimizer.selectedOptimizeTemplate = {
      id: 'opt-template',
      name: 'Optimize Template',
      content: 'content',
      isBuiltin: true,
      metadata: {
        templateType: 'optimize',
        version: '1.0.0',
        lastModified: Date.now(),
      },
    }

    await optimizer.handleOptimizePromptWithContext({
      variables: {},
      messages: [
        {
          role: 'system',
          content: 'Original message',
        },
      ],
    })

    expect(toastSpies.warning).toHaveBeenCalledWith('toast.warning.saveHistoryFailed')
    expect(toastSpies.error).not.toHaveBeenCalledWith(
      expect.stringContaining('Failed to create the history record:'),
    )

    consoleErrorSpy.mockRestore()
  })
})
