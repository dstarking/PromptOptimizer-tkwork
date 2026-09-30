import { describe, expect, it } from 'vitest'

import {
  buildImageText2ImageComparePayload,
  buildImageText2ImageResultEvaluationTargets,
  canEvaluateImageText2ImageCompare,
  canEvaluateImageText2ImageResult,
  shouldShowImageText2ImageCompareAction,
  shouldShowImageText2ImageResultAction,
} from '../../../src/components/image-mode/imageText2ImageEvaluation'

const versionLabels = {
  workspace: '工作区',
  previous: '上一版',
  original: '原始',
} as const

const baseContext = {
  originalIntent: '一只戴墨镜的柴犬在海滩上奔跑',
  workspacePrompt: 'workspace image prompt',
  referencePrompt: 'original image prompt',
  versionLabels,
}

const workspaceResolvedPrompt = {
  selection: 'workspace' as const,
  text: 'workspace image prompt',
  resolvedVersion: -1,
  promptKind: 'workspace' as const,
  isSameAsWorkspace: true,
}

const originalResolvedPrompt = {
  selection: 0 as const,
  text: 'original image prompt',
  resolvedVersion: 0,
  promptKind: 'original' as const,
  isSameAsWorkspace: false,
}

describe('imageText2ImageEvaluation helpers', () => {
  it('builds result evaluation targets with image output evidence', () => {
    const targets = buildImageText2ImageResultEvaluationTargets({
      context: baseContext,
      variants: [
        {
          id: 'b',
          label: 'B',
          resolvedPrompt: workspaceResolvedPrompt,
          promptText: 'workspace image prompt',
          modelKey: 'image-model-a',
          result: {
            images: [
              {
                b64: 'ZmFrZS1pbWFnZS0x',
                mimeType: 'image/png',
              },
            ],
          },
        },
      ],
    })

    expect(targets.b).toEqual({
      variantId: 'b',
      target: {
        workspacePrompt: 'workspace image prompt',
        referencePrompt: 'original image prompt',
      },
      testCase: {
        id: 'image-text2image-intent',
        label: 'Generation Intent',
        input: {
          kind: 'text',
          label: 'Generation Intent',
          content: '一只戴墨镜的柴犬在海滩上奔跑',
        },
      },
      snapshot: {
        id: 'b',
        label: 'B',
        testCaseId: 'image-text2image-intent',
        promptRef: {
          kind: 'workspace',
          label: '工作区',
        },
        promptText: 'workspace image prompt',
        output: 'Show the generated image result for column B.',
        outputBlock: {
          kind: 'image',
          label: 'Generated Output',
          content: 'Show the generated image result for column B.',
          media: [
            {
              label: 'B-1',
              b64: 'ZmFrZS1pbWFnZS0x',
              mimeType: 'image/png',
            },
          ],
        },
        modelKey: 'image-model-a',
        versionLabel: '工作区',
      },
    })
  })

  it('builds generic compare payloads only from variants that have image evidence', () => {
    const payload = buildImageText2ImageComparePayload({
      context: baseContext,
      variants: [
        {
          id: 'a',
          label: 'A',
          resolvedPrompt: originalResolvedPrompt,
          promptText: 'original image prompt',
          modelKey: 'image-model-a',
          result: {
            images: [
              {
                _type: 'image-ref',
                id: 'asset-1',
              },
            ],
          },
        },
        {
          id: 'b',
          label: 'B',
          resolvedPrompt: workspaceResolvedPrompt,
          promptText: 'workspace image prompt',
          modelKey: 'image-model-a',
          result: {
            images: [
              {
                b64: 'ZmFrZS1pbWFnZS0y',
                mimeType: 'image/png',
              },
            ],
          },
        },
        {
          id: 'c',
          label: 'C',
          resolvedPrompt: workspaceResolvedPrompt,
          promptText: 'workspace image prompt v2',
          modelKey: 'image-model-a',
          result: {
            images: [],
          },
        },
      ],
    })

    expect(payload).toEqual({
      target: {
        workspacePrompt: 'workspace image prompt',
        referencePrompt: 'original image prompt',
      },
      testCases: [
        {
          id: 'image-text2image-intent',
          label: 'Generation Intent',
          input: {
            kind: 'text',
            label: 'Generation Intent',
            content: '一只戴墨镜的柴犬在海滩上奔跑',
          },
        },
      ],
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'image-text2image-intent',
          promptRef: {
            kind: 'original',
            label: '原始',
          },
          promptText: 'original image prompt',
          output: 'Show the generated image result for column A.',
          outputBlock: {
            kind: 'image',
            label: 'Generated Output',
            content: 'Show the generated image result for column A.',
            media: [
              {
                label: 'A-1',
                assetId: 'asset-1',
              },
            ],
          },
          modelKey: 'image-model-a',
          versionLabel: '原始',
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'image-text2image-intent',
          promptRef: {
            kind: 'workspace',
            label: '工作区',
          },
          promptText: 'workspace image prompt',
          output: 'Show the generated image result for column B.',
          outputBlock: {
            kind: 'image',
            label: 'Generated Output',
            content: 'Show the generated image result for column B.',
            media: [
              {
                label: 'B-1',
                b64: 'ZmFrZS1pbWFnZS0y',
                mimeType: 'image/png',
              },
            ],
          },
          modelKey: 'image-model-a',
          versionLabel: '工作区',
        },
      ],
      compareHints: {
        mode: 'generic',
        hasSharedTestCases: true,
        hasSamePromptSnapshots: false,
        hasCrossModelComparison: false,
      },
    })
  })

  it('returns null for compare when fewer than two variants have image evidence', () => {
    const payload = buildImageText2ImageComparePayload({
      context: baseContext,
      variants: [
        {
          id: 'a',
          label: 'A',
          resolvedPrompt: originalResolvedPrompt,
          promptText: 'original image prompt',
          result: {
            images: [],
          },
        },
        {
          id: 'b',
          label: 'B',
          resolvedPrompt: workspaceResolvedPrompt,
          promptText: 'workspace image prompt',
          result: {
            images: [
              {
                b64: 'ZmFrZS1pbWFnZS0y',
                mimeType: 'image/png',
              },
            ],
          },
        },
      ],
    })

    expect(payload).toBeNull()
  })

  it('returns null for compare when no snapshot represents the workspace prompt', () => {
    const payload = buildImageText2ImageComparePayload({
      context: baseContext,
      variants: [
        {
          id: 'a',
          label: 'A',
          resolvedPrompt: originalResolvedPrompt,
          promptText: 'original image prompt',
          modelKey: 'image-model-a',
          result: {
            images: [
              {
                _type: 'image-ref',
                id: 'asset-1',
              },
            ],
          },
        },
        {
          id: 'b',
          label: 'B',
          resolvedPrompt: {
            selection: 1 as const,
            text: 'previous image prompt',
            resolvedVersion: 1,
            promptKind: 'version' as const,
            isSameAsWorkspace: false,
          },
          promptText: 'previous image prompt',
          modelKey: 'image-model-b',
          result: {
            images: [
              {
                b64: 'ZmFrZS1pbWFnZS0z',
                mimeType: 'image/png',
              },
            ],
          },
        },
      ],
    })

    expect(payload).toBeNull()
  })

  it('derives result and compare action availability from image evidence and model readiness', () => {
    const targets = buildImageText2ImageResultEvaluationTargets({
      context: baseContext,
      variants: [
        {
          id: 'a',
          label: 'A',
          resolvedPrompt: originalResolvedPrompt,
          promptText: 'original image prompt',
          modelKey: 'image-model-a',
          result: {
            images: [
              {
                _type: 'image-ref',
                id: 'asset-1',
              },
            ],
          },
        },
      ],
    })

    const comparePayload = buildImageText2ImageComparePayload({
      context: baseContext,
      variants: [
        {
          id: 'a',
          label: 'A',
          resolvedPrompt: originalResolvedPrompt,
          promptText: 'original image prompt',
          modelKey: 'image-model-a',
          result: {
            images: [
              {
                _type: 'image-ref',
                id: 'asset-1',
              },
            ],
          },
        },
        {
          id: 'b',
          label: 'B',
          resolvedPrompt: workspaceResolvedPrompt,
          promptText: 'workspace image prompt',
          modelKey: 'image-model-a',
          result: {
            images: [
              {
                b64: 'ZmFrZS1pbWFnZS0y',
                mimeType: 'image/png',
              },
            ],
          },
        },
      ],
    })

    expect(shouldShowImageText2ImageResultAction('a', targets)).toBe(true)
    expect(shouldShowImageText2ImageResultAction('b', targets)).toBe(false)
    expect(canEvaluateImageText2ImageResult('a', targets, true)).toBe(true)
    expect(canEvaluateImageText2ImageResult('a', targets, false)).toBe(false)
    expect(canEvaluateImageText2ImageResult('b', targets, true)).toBe(false)

    expect(shouldShowImageText2ImageCompareAction(comparePayload)).toBe(true)
    expect(shouldShowImageText2ImageCompareAction(null, true)).toBe(true)
    expect(shouldShowImageText2ImageCompareAction(null, false, true)).toBe(true)
    expect(canEvaluateImageText2ImageCompare(comparePayload, true)).toBe(true)
    expect(canEvaluateImageText2ImageCompare(comparePayload, false)).toBe(false)
    expect(canEvaluateImageText2ImageCompare(null, true)).toBe(false)
  })
})
