import { vi, describe, beforeEach, it, expect, afterEach } from 'vitest'
import { EvaluationService } from '../../../src/services/evaluation/service'
import {
  EvaluationExecutionError,
  EvaluationValidationError,
  EvaluationModelError,
  EvaluationTemplateError,
} from '../../../src/services/evaluation/errors'
import type {
  CompareEvaluationRequest,
  EvaluationModeConfig,
  PromptIterateEvaluationRequest,
  PromptOnlyEvaluationRequest,
  ResultEvaluationRequest,
} from '../../../src/services/evaluation/types'

describe('EvaluationService', () => {
  let evaluationService: EvaluationService
  let mockLLMService: any
  let mockModelManager: any
  let mockTemplateManager: any

  const defaultModeConfig: EvaluationModeConfig = {
    functionMode: 'basic',
    subMode: 'system',
  }

  const mockEvaluationResult = JSON.stringify({
    score: {
      overall: 85,
      dimensions: [
        { key: 'clarity', label: 'Clarity', score: 90 },
        { key: 'structure', label: 'Structure', score: 80 },
      ],
    },
    improvements: ['Add more examples'],
    patchPlan: [
      {
        op: 'replace',
        oldText: 'Old section',
        newText: 'New section with better instructions',
        instruction: 'Clarify the expected output structure',
      },
    ],
    summary: 'Good prompt',
  })

  const createPromptOnlyRequest = (
    overrides: Partial<PromptOnlyEvaluationRequest> = {}
  ): PromptOnlyEvaluationRequest => ({
    type: 'prompt-only',
    target: {
      workspacePrompt: 'Optimized prompt',
    },
    evaluationModelKey: 'test-model',
    mode: defaultModeConfig,
    ...overrides,
  })

  const createPromptIterateRequest = (
    overrides: Partial<PromptIterateEvaluationRequest> = {}
  ): PromptIterateEvaluationRequest => ({
    type: 'prompt-iterate',
    target: {
      workspacePrompt: 'Optimized prompt',
    },
    iterateRequirement: 'Make it more concise',
    evaluationModelKey: 'test-model',
    mode: defaultModeConfig,
    ...overrides,
  })

  const createResultRequest = (
    overrides: Partial<ResultEvaluationRequest> = {}
  ): ResultEvaluationRequest => ({
    type: 'result',
    target: {
      workspacePrompt: 'Workspace prompt',
    },
    testCase: {
      id: 'tc-1',
      input: {
        kind: 'text',
        label: 'Test Input',
        content: 'Input',
      },
    },
    snapshot: {
      id: 'snap-1',
      label: 'A',
      testCaseId: 'tc-1',
      promptRef: { kind: 'workspace' },
      promptText: 'Executed prompt',
      output: 'Output',
    },
    evaluationModelKey: 'test-model',
    mode: defaultModeConfig,
    ...overrides,
  })

  const createCompareRequest = (
    overrides: Partial<CompareEvaluationRequest> = {}
  ): CompareEvaluationRequest => ({
    type: 'compare',
    target: {
      workspacePrompt: 'Workspace prompt',
    },
    testCases: [
      {
        id: 'tc-1',
        input: {
          kind: 'text',
          label: 'Shared Input',
          content: 'Input',
        },
      },
    ],
    snapshots: [
      {
        id: 'snap-1',
        label: 'A',
        testCaseId: 'tc-1',
        promptRef: { kind: 'workspace' },
        promptText: 'Prompt A',
        output: 'Output A',
      },
      {
        id: 'snap-2',
        label: 'B',
        testCaseId: 'tc-1',
        promptRef: { kind: 'version', version: 1 },
        promptText: 'Prompt B',
        output: 'Output B',
      },
    ],
    evaluationModelKey: 'test-model',
    mode: defaultModeConfig,
    ...overrides,
  })

  beforeEach(() => {
    mockLLMService = {
      sendMessage: vi.fn().mockResolvedValue(mockEvaluationResult),
      sendMessageStream: vi.fn(),
    }

    mockModelManager = {
      getModel: vi.fn().mockResolvedValue({ id: 'test-model', enabled: true }),
    }

    mockTemplateManager = {
      getTemplate: vi.fn().mockResolvedValue({
        id: 'evaluation-basic-system-prompt-only',
        content: [
          { role: 'system', content: 'You are an evaluator.' },
          {
            role: 'user',
            content:
              '{{workspacePrompt}}\n{{iterateRequirement}}\n{{testContent}}\n{{testResult}}\n{{#hasFocus}}Focus: {{focusBrief}}{{/hasFocus}}',
          },
        ],
      }),
    }

    evaluationService = new EvaluationService(
      mockLLMService,
      mockModelManager,
      mockTemplateManager
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validateRequest', () => {
    it('passes validation with a valid prompt-only request', async () => {
      await expect(evaluationService.evaluate(createPromptOnlyRequest())).resolves.toBeDefined()
    })

    it('rejects prompt-only when workspacePrompt is empty', async () => {
      await expect(
        evaluationService.evaluate(
          createPromptOnlyRequest({
            target: { workspacePrompt: '' },
          })
        )
      ).rejects.toThrow(EvaluationValidationError)
    })

    it('passes validation with a valid prompt-iterate request', async () => {
      await expect(evaluationService.evaluate(createPromptIterateRequest())).resolves.toBeDefined()
    })

    it('rejects prompt-iterate when iterateRequirement is empty', async () => {
      await expect(
        evaluationService.evaluate(
          createPromptIterateRequest({
            iterateRequirement: '   ',
          })
        )
      ).rejects.toThrow(EvaluationValidationError)
    })

    it('allows omitted referencePrompt for result type', async () => {
      await expect(
        evaluationService.evaluate(
          createResultRequest({
            target: {
              workspacePrompt: 'Workspace prompt',
            },
          })
        )
      ).resolves.toBeDefined()
    })

    it('rejects compare when fewer than two snapshots are provided', async () => {
      await expect(
        evaluationService.evaluate(
          createCompareRequest({
            snapshots: [
              {
                id: 'snap-1',
                label: 'A',
                testCaseId: 'tc-1',
                promptRef: { kind: 'workspace' },
                promptText: 'Prompt A',
                output: 'Output A',
              },
            ],
          })
        )
      ).rejects.toThrow(EvaluationValidationError)
    })

    it('rejects when evaluationModelKey is empty', async () => {
      await expect(
        evaluationService.evaluate(
          createPromptOnlyRequest({
            evaluationModelKey: '',
          })
        )
      ).rejects.toThrow(EvaluationValidationError)
    })

    it('rejects when mode is missing', async () => {
      await expect(
        evaluationService.evaluate({
          ...createPromptOnlyRequest(),
          mode: undefined as any,
        })
      ).rejects.toThrow(EvaluationValidationError)
    })

    it('rejects unknown evaluation type', async () => {
      await expect(
        evaluationService.evaluate({
          ...createPromptOnlyRequest(),
          type: 'unknown-type' as any,
        })
      ).rejects.toThrow(EvaluationValidationError)
    })
  })

  describe('buildTemplateContext', () => {
    it('includes workspacePrompt only for prompt-only', async () => {
      await evaluationService.evaluate(createPromptOnlyRequest())

      expect(mockTemplateManager.getTemplate).toHaveBeenCalledWith(
        'evaluation-basic-system-prompt-only'
      )

      const sentMessages = mockLLMService.sendMessage.mock.calls[0][0]
      expect(sentMessages[1].content).toContain('Optimized prompt')
    })

    it('includes iterateRequirement and focus for prompt-iterate', async () => {
      await evaluationService.evaluate(
        createPromptIterateRequest({
          focus: {
            content: 'Need stricter output format',
            source: 'user',
            priority: 'highest',
          },
        })
      )

      expect(mockTemplateManager.getTemplate).toHaveBeenCalledWith(
        'evaluation-basic-system-prompt-iterate'
      )

      const sentMessages = mockLLMService.sendMessage.mock.calls[0][0]
      expect(sentMessages[1].content).toContain('Make it more concise')
      expect(sentMessages[1].content).toContain('Need stricter output format')
    })

    it('does not render focus block when focus is absent', async () => {
      await evaluationService.evaluate(createPromptOnlyRequest())

      const sentMessages = mockLLMService.sendMessage.mock.calls[0][0]
      expect(sentMessages[1].content).not.toContain('Focus:')
    })
  })

  describe('getTemplateId', () => {
    it('generates the correct template ID for prompt-only', async () => {
      await evaluationService.evaluate(
        createPromptOnlyRequest({
          mode: { functionMode: 'pro', subMode: 'variable' },
        })
      )

      expect(mockTemplateManager.getTemplate).toHaveBeenCalledWith(
        'evaluation-pro-variable-prompt-only'
      )
    })

    it('generates the correct template ID for prompt-iterate', async () => {
      await evaluationService.evaluate(
        createPromptIterateRequest({
          mode: { functionMode: 'basic', subMode: 'user' },
        })
      )

      expect(mockTemplateManager.getTemplate).toHaveBeenCalledWith(
        'evaluation-basic-user-prompt-iterate'
      )
    })
  })

  describe('model validation', () => {
    it('throws EvaluationModelError when model is not found', async () => {
      mockModelManager.getModel.mockResolvedValue(null)

      await expect(
        evaluationService.evaluate(
          createPromptOnlyRequest({
            evaluationModelKey: 'non-existent-model',
          })
        )
      ).rejects.toThrow(EvaluationModelError)
    })
  })

  describe('template validation', () => {
    it('throws EvaluationTemplateError when template is not found', async () => {
      mockTemplateManager.getTemplate.mockResolvedValue(null)

      await expect(evaluationService.evaluate(createPromptOnlyRequest())).rejects.toThrow(
        EvaluationTemplateError
      )
    })
  })

  describe('execution errors', () => {
    it('formats plain object provider errors without leaking [object Object]', async () => {
      mockLLMService.sendMessage.mockRejectedValueOnce({
        status: 429,
        body: {
          error: {
            message: 'rate limit exceeded',
          },
        },
      })

      try {
        await evaluationService.evaluate(createPromptOnlyRequest())
        throw new Error('Expected evaluation to fail')
      } catch (error) {
        expect(error).toBeInstanceOf(EvaluationExecutionError)
        expect((error as Error).message).toContain('HTTP 429')
        expect((error as Error).message).toContain('rate limit exceeded')
        expect((error as Error).message).not.toContain('[object Object]')
        expect((error as EvaluationExecutionError).params?.details).not.toContain('[object Object]')
      }
    })
  })

  describe('evaluateStream', () => {
    it('calls callbacks correctly for prompt-only', async () => {
      const onToken = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      mockLLMService.sendMessageStream.mockImplementation(
        async (_messages: any, _model: any, handlers: any) => {
          handlers.onToken('{"score":')
          handlers.onToken(
            '{"overall":85,"dimensions":[{"key":"test","label":"Test","score":85}]},"summary":"done","improvements":[],"patchPlan":[]}'
          )
          handlers.onComplete()
        }
      )

      await evaluationService.evaluateStream(createPromptOnlyRequest(), {
        onToken,
        onComplete,
        onError,
      })

      expect(onToken).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })

    it('calls onError for validation failure in prompt-iterate', async () => {
      const onToken = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      await evaluationService.evaluateStream(
        createPromptIterateRequest({
          iterateRequirement: '',
        }),
        {
          onToken,
          onComplete,
          onError,
        }
      )

      expect(onError).toHaveBeenCalled()
      expect(onToken).not.toHaveBeenCalled()
      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  describe('parse robustness', () => {
    const baseRequest = createPromptOnlyRequest()

    it('parses JSON inside a fenced code block without a language tag', async () => {
      mockLLMService.sendMessage.mockResolvedValueOnce(
        `Here is the result:\n\n\`\`\`\n${mockEvaluationResult}\n\`\`\`\n`
      )

      const res = await evaluationService.evaluate(baseRequest)
      expect(res.score.overall).toBe(85)
      expect(res.score.dimensions.length).toBeGreaterThan(0)
    })

    it('locates nested payloads that contain a score field', async () => {
      mockLLMService.sendMessage.mockResolvedValueOnce(
        JSON.stringify({
          evaluation: JSON.parse(mockEvaluationResult),
        })
      )

      const res = await evaluationService.evaluate(baseRequest)
      expect(res.score.overall).toBe(85)
    })

    it('accepts dimensions as an object map', async () => {
      mockLLMService.sendMessage.mockResolvedValueOnce(
        JSON.stringify({
          score: {
            overall: 80,
            dimensions: {
              goalAchievement: 90,
              outputQuality: 70,
            },
          },
          improvements: [],
          patchPlan: [],
          summary: 'OK',
        })
      )

      const res = await evaluationService.evaluate(baseRequest)
      expect(res.score.overall).toBe(80)
      expect(res.score.dimensions.find((d) => d.key === 'goalAchievement')?.score).toBe(90)
      expect(res.score.dimensions.find((d) => d.key === 'outputQuality')?.score).toBe(70)
    })

    it('falls back to an overall-only dimension when dimensions are missing', async () => {
      mockLLMService.sendMessage.mockResolvedValueOnce(
        JSON.stringify({
          score: {
            overall: 88,
          },
          improvements: [],
          patchPlan: [],
          summary: 'OK',
        })
      )

      const res = await evaluationService.evaluate(baseRequest)
      expect(res.score.overall).toBe(88)
      expect(res.score.dimensions).toHaveLength(1)
      expect(res.score.dimensions[0].key).toBe('overall')
    })

    it('extracts overall score from plain text when JSON parsing fails', async () => {
      mockLLMService.sendMessage.mockResolvedValueOnce('Overall score: 85/100')

      const res = await evaluationService.evaluate(baseRequest)
      expect(res.score.overall).toBe(85)
    })
  })
})
