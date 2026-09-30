import { describe, it, expect } from 'vitest'
import {
  analyzeStructuredComparePlan,
  buildCompareEvaluationPayload,
  hasStructuredJudgePlan,
  inferCompareSnapshotRoles,
} from '../../../src/composables/prompt/compareEvaluation'

describe('buildCompareEvaluationPayload', () => {
  it('returns null when workspace prompt is empty', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: '   ',
      },
      testCases: [
        {
          id: 'tc-1',
          input: {
            kind: 'text',
            label: 'Shared Input',
            content: 'Input A',
          },
        },
      ],
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt A',
          output: 'Output A',
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 1 },
          promptText: 'Prompt B',
          output: 'Output B',
        },
      ],
    })

    expect(payload).toBeNull()
  })

  it('returns null when fewer than two valid snapshots remain', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: ' Current prompt ',
      },
      testCases: [
        {
          id: 'tc-1',
          input: {
            kind: 'text',
            label: 'Shared Input',
            content: 'Input A',
          },
        },
      ],
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt A',
          output: '   ',
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: '   ',
          output: 'Output B',
        },
      ],
    })

    expect(payload).toBeNull()
  })

  it('returns null when none of the valid compare snapshots represent the workspace prompt', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: ' Current prompt ',
      },
      testCases: [
        {
          id: 'tc-1',
          input: {
            kind: 'text',
            label: 'Shared Input',
            content: 'Input A',
          },
        },
      ],
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'tc-1',
          promptRef: { kind: 'original' },
          promptText: 'Prompt A',
          output: 'Output A',
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 1 },
          promptText: 'Prompt B',
          output: 'Output B',
        },
      ],
    })

    expect(payload).toBeNull()
  })

  it('normalizes target, test cases, snapshots, and compare hints', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: ' Current prompt ',
        referencePrompt: ' Reference prompt ',
        designContext: {
          kind: 'json',
          label: ' Design Context ',
          content: ' { "mode": "variable" } ',
          summary: ' Schema only ',
        },
      },
      testCases: [
        {
          id: ' tc-1 ',
          label: ' Shared Case ',
          input: {
            kind: 'text',
            label: ' Shared Input ',
            content: ' Input A ',
            summary: ' Summary A ',
          },
          settingsSummary: ' model=dashscope ',
        },
      ],
      snapshots: [
        {
          id: ' a ',
          label: ' A ',
          testCaseId: ' tc-1 ',
          promptRef: { kind: 'workspace', label: ' Workspace ' },
          promptText: ' Prompt A ',
          output: ' Output A ',
          reasoning: ' Why A ',
          modelKey: ' model-a ',
          versionLabel: ' v1 ',
          executionInput: {
            kind: 'custom',
            label: ' Rendered Content ',
            content: ' Extra A ',
            summary: ' Summary Extra ',
          },
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 2 },
          promptText: 'Prompt B',
          output: 'Output B',
          executionInput: {
            kind: 'custom',
            label: 'Ignored',
            content: '   ',
            summary: '   ',
          },
        },
        null,
      ],
    })

    expect(payload).toEqual({
      target: {
        workspacePrompt: 'Current prompt',
        referencePrompt: 'Reference prompt',
        designContext: {
          kind: 'json',
          label: 'Design Context',
          content: '{ "mode": "variable" }',
          summary: 'Schema only',
        },
      },
      testCases: [
        {
          id: 'tc-1',
          label: 'Shared Case',
          input: {
            kind: 'text',
            label: 'Shared Input',
            content: 'Input A',
            summary: 'Summary A',
          },
          settingsSummary: 'model=dashscope',
        },
      ],
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace', label: ' Workspace ' },
          promptText: 'Prompt A',
          output: 'Output A',
          reasoning: 'Why A',
          modelKey: 'model-a',
          versionLabel: 'v1',
          executionInput: {
            kind: 'custom',
            label: 'Rendered Content',
            content: 'Extra A',
            summary: 'Summary Extra',
          },
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 2 },
          promptText: 'Prompt B',
          output: 'Output B',
          reasoning: undefined,
          modelKey: undefined,
          versionLabel: undefined,
          executionInput: undefined,
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

  it('keeps all valid snapshots in multi-snapshot compare payloads', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: ' Workspace prompt ',
      },
      testCases: [
        {
          id: 'tc-1',
          input: {
            kind: 'text',
            label: 'Shared Input',
            content: 'Input A',
          },
        },
      ],
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt A',
          output: 'Output A',
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt B',
          output: 'Output B',
          executionInput: {
            kind: 'custom',
            label: 'Input Snapshot',
            content: 'Input B',
            summary: 'Vars: tone=formal',
          },
        },
        {
          id: 'c',
          label: 'C',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 2 },
          promptText: 'Prompt C',
          output: 'Output C',
          reasoning: 'Reasoning C',
          modelKey: 'model-c',
          versionLabel: 'v2',
        },
      ],
    })

    expect(payload).toEqual({
      target: {
        workspacePrompt: 'Workspace prompt',
        referencePrompt: undefined,
        designContext: undefined,
      },
      testCases: [
        {
          id: 'tc-1',
          label: undefined,
          input: {
            kind: 'text',
            label: 'Shared Input',
            content: 'Input A',
            summary: undefined,
          },
          settingsSummary: undefined,
        },
      ],
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt A',
          output: 'Output A',
          reasoning: undefined,
          modelKey: undefined,
          versionLabel: undefined,
          executionInput: undefined,
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt B',
          output: 'Output B',
          reasoning: undefined,
          modelKey: undefined,
          versionLabel: undefined,
          executionInput: {
            kind: 'custom',
            label: 'Input Snapshot',
            content: 'Input B',
            summary: 'Vars: tone=formal',
          },
        },
        {
          id: 'c',
          label: 'C',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 2 },
          promptText: 'Prompt C',
          output: 'Output C',
          reasoning: 'Reasoning C',
          modelKey: 'model-c',
          versionLabel: 'v2',
          executionInput: undefined,
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

  it('preserves output image evidence blocks when snapshots provide multimodal results', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: 'Workspace prompt',
      },
      testCases: [
        {
          id: 'tc-1',
          input: {
            kind: 'text',
            label: '生成意图',
            content: 'A corgi running on the beach',
          },
        },
      ],
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt A',
          output: 'Prompt A image result',
          outputBlock: {
            kind: 'image',
            label: '生成结果',
            content: 'Prompt A image result',
            media: [
              {
                label: 'A-1',
                b64: 'ZmFrZS1pbWFnZS1B',
                mimeType: 'image/png',
              },
            ],
          },
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 1 },
          promptText: 'Prompt B',
          output: 'Prompt B image result',
          outputBlock: {
            kind: 'image',
            label: '生成结果',
            content: 'Prompt B image result',
            media: [
              {
                label: 'B-1',
                assetId: 'asset-b',
                mimeType: 'image/jpeg',
              },
            ],
          },
        },
      ],
    })

    expect(payload?.snapshots).toEqual([
      expect.objectContaining({
        id: 'a',
        outputBlock: {
          kind: 'image',
          label: '生成结果',
          content: 'Prompt A image result',
          media: [
            {
              label: 'A-1',
              b64: 'ZmFrZS1pbWFnZS1B',
              mimeType: 'image/png',
            },
          ],
        },
      }),
      expect.objectContaining({
        id: 'b',
        outputBlock: {
          kind: 'image',
          label: '生成结果',
          content: 'Prompt B image result',
          media: [
            {
              label: 'B-1',
              assetId: 'asset-b',
              mimeType: 'image/jpeg',
            },
          ],
        },
      }),
    ])
  })

  it('treats distinct testCaseIds with the same effective input as shared evidence', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: 'Workspace prompt',
      },
      testCases: [
        {
          id: 'tc-a',
          input: {
            kind: 'conversation',
            label: 'Conversation Snapshot',
            summary: 'same shared conversation',
            content: 'system: marker\nuser: hello',
          },
        },
        {
          id: 'tc-b',
          input: {
            kind: 'conversation',
            label: 'Conversation Snapshot',
            summary: 'same shared conversation',
            content: 'system: marker\nuser: hello',
          },
        },
      ],
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'tc-a',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt A',
          output: 'Output A',
          modelKey: 'model-a',
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-b',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt A',
          output: 'Output B',
          modelKey: 'model-b',
        },
      ],
    })

    expect(payload).not.toBeNull()
    expect(payload?.compareHints).toEqual({
      mode: 'structured',
      snapshotRoles: {
        a: 'target',
        b: 'reference',
      },
      hasSharedTestCases: true,
      hasSamePromptSnapshots: true,
      hasCrossModelComparison: true,
    })
  })

  it('infers structured compare roles when exactly one workspace snapshot exists', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: 'Workspace prompt',
      },
      testCases: [
        {
          id: 'tc-1',
          input: {
            kind: 'text',
            label: 'Shared Input',
            content: 'Input A',
          },
        },
      ],
      snapshots: [
        {
          id: 'target',
          label: 'A',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt target',
          output: 'Output target',
          modelKey: 'qwen3-32b',
        },
        {
          id: 'baseline',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 3 },
          promptText: 'Prompt baseline',
          output: 'Output baseline',
          modelKey: 'qwen3-32b',
        },
        {
          id: 'reference',
          label: 'C',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 3 },
          promptText: 'Prompt target',
          output: 'Output reference',
          modelKey: 'deepseek-chat',
        },
        {
          id: 'reference-baseline',
          label: 'D',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 2 },
          promptText: 'Prompt previous',
          output: 'Output reference baseline',
          modelKey: 'deepseek-chat',
        },
      ],
    })

    expect(payload?.compareHints).toEqual({
      mode: 'structured',
      snapshotRoles: {
        target: 'target',
        baseline: 'baseline',
        reference: 'reference',
        'reference-baseline': 'referenceBaseline',
      },
      hasSharedTestCases: true,
      hasSamePromptSnapshots: false,
      hasCrossModelComparison: false,
    })
  })

  it('exports inferred snapshot roles for structured compare candidates', () => {
    const snapshotRoles = inferCompareSnapshotRoles([
      {
        id: 'target',
        promptRef: { kind: 'workspace' },
        promptText: 'Prompt target',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'baseline',
        promptRef: { kind: 'version', version: 3 },
        promptText: 'Prompt baseline',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'reference',
        promptRef: { kind: 'version', version: 3 },
        promptText: 'Prompt target',
        modelKey: 'deepseek-chat',
      },
      {
        id: 'reference-baseline',
        promptRef: { kind: 'version', version: 2 },
        promptText: 'Prompt previous',
        modelKey: 'deepseek-chat',
      },
      {
        id: 'replica',
        promptRef: { kind: 'version', version: 3 },
        promptText: 'Prompt target',
        modelKey: 'qwen3-32b',
      },
    ])

    expect(snapshotRoles).toEqual({
      target: 'target',
      baseline: 'baseline',
      reference: 'reference',
      'reference-baseline': 'referenceBaseline',
      replica: 'replica',
    })
    expect(hasStructuredJudgePlan(snapshotRoles)).toBe(true)
  })

  it('normalizes prompt whitespace before inferring structured compare roles', () => {
    const snapshotRoles = inferCompareSnapshotRoles([
      {
        id: 'target',
        promptRef: { kind: 'workspace' },
        promptText: 'Prompt target\n\n- step 1\n- step 2',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'baseline',
        promptRef: { kind: 'version', version: 3 },
        promptText: 'Prompt previous',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'reference',
        promptRef: { kind: 'workspace' },
        promptText: '  Prompt target - step 1   - step 2  ',
        modelKey: 'deepseek-chat',
      },
      {
        id: 'reference-baseline',
        promptRef: { kind: 'version', version: 2 },
        promptText: 'Reference previous',
        modelKey: 'deepseek-chat',
      },
      {
        id: 'replica',
        promptRef: { kind: 'version', version: 4 },
        promptText: 'Prompt target - step 1 - step 2',
        modelKey: 'qwen3-32b',
      },
    ], {
      target: 'target',
    })

    expect(snapshotRoles).toEqual({
      target: 'target',
      baseline: 'baseline',
      reference: 'reference',
      'reference-baseline': 'referenceBaseline',
      replica: 'replica',
    })
  })

  it('uses a manually selected target to auto-complete the remaining structured roles', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: 'Workspace prompt',
      },
      testCases: [
        {
          id: 'tc-1',
          input: {
            kind: 'text',
            label: 'Shared Input',
            content: 'Input A',
          },
        },
      ],
      snapshotRolesOverride: {
        b: 'target',
      },
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt previous',
          output: 'Output A',
          modelKey: 'qwen3-32b',
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt current',
          output: 'Output B',
          modelKey: 'qwen3-32b',
        },
        {
          id: 'c',
          label: 'C',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt current',
          output: 'Output C',
          modelKey: 'deepseek-chat',
        },
      ],
    })

    expect(payload?.compareHints).toEqual({
      mode: 'structured',
      snapshotRoles: {
        a: 'baseline',
        b: 'target',
        c: 'reference',
      },
      hasSharedTestCases: true,
      hasSamePromptSnapshots: false,
      hasCrossModelComparison: false,
    })
  })

  it('defaults the first workspace snapshot to the optimization target when multiple workspaces exist', () => {
    const snapshotRoles = inferCompareSnapshotRoles([
      {
        id: 'a',
        promptRef: { kind: 'workspace' },
        promptText: 'Prompt current',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'b',
        promptRef: { kind: 'workspace' },
        promptText: 'Prompt current',
        modelKey: 'deepseek-chat',
      },
      {
        id: 'c',
        promptRef: { kind: 'version', version: 2 },
        promptText: 'Prompt previous',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'd',
        promptRef: { kind: 'version', version: 1 },
        promptText: 'Teacher previous',
        modelKey: 'deepseek-chat',
      },
    ])

    expect(snapshotRoles).toEqual({
      a: 'target',
      b: 'reference',
      c: 'baseline',
      d: 'referenceBaseline',
    })
  })

  it('prioritizes the dynamic previous alias as baseline when multiple same-model candidates exist', () => {
    const snapshotRoles = inferCompareSnapshotRoles([
      {
        id: 'target',
        promptRef: { kind: 'workspace' },
        promptText: 'Prompt current with local edits',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'previous',
        promptRef: { kind: 'version', version: 3, dynamicAlias: 'previous' },
        promptText: 'Prompt current',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'older',
        promptRef: { kind: 'version', version: 2 },
        promptText: 'Prompt old',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'teacher',
        promptRef: { kind: 'workspace' },
        promptText: 'Prompt current with local edits',
        modelKey: 'deepseek-chat',
      },
    ])

    expect(snapshotRoles).toEqual({
      target: 'target',
      previous: 'baseline',
      older: 'auxiliary',
      teacher: 'reference',
    })
  })

  it('treats a previous alias with identical prompt text as a replica stability check', () => {
    const snapshotRoles = inferCompareSnapshotRoles([
      {
        id: 'target',
        promptRef: { kind: 'workspace' },
        promptText: 'Prompt current',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'previous',
        promptRef: { kind: 'version', version: 3, dynamicAlias: 'previous' },
        promptText: 'Prompt current',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'teacher',
        promptRef: { kind: 'workspace' },
        promptText: 'Prompt current',
        modelKey: 'deepseek-chat',
      },
    ])

    expect(snapshotRoles).toEqual({
      target: 'target',
      previous: 'replica',
      teacher: 'reference',
    })
  })

  it('uses a manually selected target as the seed for role inference', () => {
    const snapshotRoles = inferCompareSnapshotRoles(
      [
        {
          id: 'a',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt previous',
          modelKey: 'qwen3-32b',
        },
        {
          id: 'b',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt current',
          modelKey: 'qwen3-32b',
        },
        {
          id: 'c',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt current',
          modelKey: 'deepseek-chat',
        },
        {
          id: 'd',
          promptRef: { kind: 'version', version: 1 },
          promptText: 'Prompt old reference',
          modelKey: 'deepseek-chat',
        },
      ],
      {
        b: 'target',
      }
    )

    expect(snapshotRoles).toEqual({
      a: 'baseline',
      b: 'target',
      c: 'reference',
      d: 'referenceBaseline',
    })
  })

  it('uses manual snapshot role overrides to force structured compare when auto inference is ambiguous', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: 'Workspace prompt',
      },
      testCases: [
        {
          id: 'tc-1',
          input: {
            kind: 'text',
            label: 'Shared Input',
            content: 'Input A',
          },
        },
      ],
      snapshotRolesOverride: {
        a: 'target',
        b: 'reference',
      },
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt A',
          output: 'Output A',
          modelKey: 'qwen3-32b',
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt A',
          output: 'Output B',
          modelKey: 'deepseek-chat',
        },
      ],
    })

    expect(payload?.compareHints).toEqual({
      mode: 'structured',
      snapshotRoles: {
        a: 'target',
        b: 'reference',
      },
      hasSharedTestCases: true,
      hasSamePromptSnapshots: true,
      hasCrossModelComparison: true,
    })
  })

  it('falls back to generic compare when manual roles still cannot form a structured plan', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: 'Workspace prompt',
      },
      testCases: [
        {
          id: 'tc-1',
          input: {
            kind: 'text',
            label: 'Shared Input',
            content: 'Input A',
          },
        },
      ],
      snapshotRolesOverride: {
        a: 'target',
        b: 'auxiliary',
      },
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt A',
          output: 'Output A',
          modelKey: 'qwen3-32b',
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt B',
          output: 'Output B',
          modelKey: 'deepseek-chat',
        },
      ],
    })

    expect(payload?.compareHints).toEqual({
      mode: 'generic',
      hasSharedTestCases: true,
      hasSamePromptSnapshots: false,
      hasCrossModelComparison: false,
    })
  })

  it('falls back to generic compare when inferred roles include auxiliary snapshots', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: 'Workspace prompt',
      },
      snapshotRolesOverride: {
        target: 'target',
      },
      testCases: [
        {
          id: 'tc-1',
          input: {
            kind: 'text',
            label: 'Shared Input',
            content: 'Input A',
          },
        },
      ],
      snapshots: [
        {
          id: 'target',
          label: 'Target',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt current',
          output: 'Output target',
          modelKey: 'qwen3-32b',
        },
        {
          id: 'baseline-v2',
          label: 'Baseline v2',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 2 },
          promptText: 'Prompt older',
          output: 'Output baseline v2',
          modelKey: 'qwen3-32b',
        },
        {
          id: 'baseline-v3',
          label: 'Baseline v3',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 3 },
          promptText: 'Prompt previous',
          output: 'Output baseline v3',
          modelKey: 'qwen3-32b',
        },
        {
          id: 'reference-workspace',
          label: 'Reference workspace',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt current',
          output: 'Output reference workspace',
          modelKey: 'deepseek-chat',
        },
        {
          id: 'reference-alt',
          label: 'Reference alt',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt current',
          output: 'Output reference alt',
          modelKey: 'claude-3-7-sonnet',
        },
        {
          id: 'reference-baseline-v1',
          label: 'Reference baseline v1',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 1 },
          promptText: 'Reference prompt oldest',
          output: 'Output reference baseline v1',
          modelKey: 'deepseek-chat',
        },
        {
          id: 'reference-baseline-v2',
          label: 'Reference baseline v2',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 2 },
          promptText: 'Reference prompt previous',
          output: 'Output reference baseline v2',
          modelKey: 'deepseek-chat',
        },
      ],
    })

    expect(payload?.compareHints).toEqual({
      mode: 'generic',
      hasSharedTestCases: true,
      hasSamePromptSnapshots: false,
      hasCrossModelComparison: false,
    })
  })

  it('falls back to generic compare when a three-way setup includes a non-pairwise auxiliary snapshot', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: 'Workspace prompt',
      },
      testCases: [
        {
          id: 'tc-1',
          input: {
            kind: 'text',
            label: 'Shared Input',
            content: 'Input A',
          },
        },
      ],
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'tc-1',
          promptRef: { kind: 'original' },
          promptText: 'Prompt original',
          output: 'Output original',
          modelKey: 'model-a',
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt current',
          output: 'Output current',
          modelKey: 'model-b',
        },
        {
          id: 'c',
          label: 'C',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 2 },
          promptText: 'Prompt previous',
          output: 'Output previous',
          modelKey: 'model-b',
        },
      ],
    })

    expect(payload?.compareHints).toEqual({
      mode: 'generic',
      hasSharedTestCases: true,
      hasSamePromptSnapshots: false,
      hasCrossModelComparison: false,
    })
  })

  it('treats duplicate singleton roles as an invalid structured compare plan', () => {
    const analysis = analyzeStructuredComparePlan({
      a: 'target',
      b: 'target',
      c: 'baseline',
      d: 'reference',
    })

    expect(analysis.mode).toBe('generic')
    expect(analysis.blockingReasons).toContain('duplicateTarget')
    expect(analysis.singletonConflicts).toEqual([
      {
        role: 'target',
        snapshotIds: ['a', 'b'],
      },
    ])
    expect(hasStructuredJudgePlan({
      a: 'target',
      b: 'target',
      c: 'baseline',
      d: 'reference',
    })).toBe(false)
  })

  it('treats auxiliary snapshots as a blocking reason for structured compare', () => {
    const analysis = analyzeStructuredComparePlan({
      a: 'target',
      b: 'baseline',
      c: 'auxiliary',
    })

    expect(analysis.mode).toBe('generic')
    expect(analysis.blockingReasons).toContain('hasAuxiliarySnapshot')
    expect(hasStructuredJudgePlan({
      a: 'target',
      b: 'baseline',
      c: 'auxiliary',
    })).toBe(false)
  })

  it('falls back to generic compare when manual overrides create duplicate singleton roles', () => {
    const payload = buildCompareEvaluationPayload({
      target: {
        workspacePrompt: 'Workspace prompt',
      },
      testCases: [
        {
          id: 'tc-1',
          input: {
            kind: 'text',
            label: 'Shared Input',
            content: 'Input A',
          },
        },
      ],
      snapshotRolesOverride: {
        a: 'target',
        b: 'target',
        c: 'baseline',
      },
      snapshots: [
        {
          id: 'a',
          label: 'A',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt A',
          output: 'Output A',
          modelKey: 'qwen3-32b',
        },
        {
          id: 'b',
          label: 'B',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt B',
          output: 'Output B',
          modelKey: 'deepseek-chat',
        },
        {
          id: 'c',
          label: 'C',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', version: 1 },
          promptText: 'Prompt C',
          output: 'Output C',
          modelKey: 'qwen3-32b',
        },
      ],
    })

    expect(payload?.compareHints).toEqual({
      mode: 'generic',
      hasSharedTestCases: true,
      hasSamePromptSnapshots: false,
      hasCrossModelComparison: false,
    })
  })
})
