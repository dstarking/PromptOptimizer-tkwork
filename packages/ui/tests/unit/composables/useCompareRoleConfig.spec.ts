import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useCompareRoleConfig } from '../../../src/composables/prompt/useCompareRoleConfig'
import {
  buildCompareRoleCandidateSignature,
  buildCompareRoleCandidateWorkspacePromptSignature,
  serializeCompareRolePersistedSignature,
  type CompareRoleCandidate,
} from '../../../src/composables/prompt/compareEvaluation'
import type {
  PersistedCompareSnapshotRoles,
  PersistedCompareSnapshotRoleSignatures,
} from '../../../src/types/evaluation'

type VariantId = 'a' | 'b'

const createCandidates = (): CompareRoleCandidate<VariantId>[] => ([
  {
    id: 'a',
    label: 'A',
    promptRef: { kind: 'workspace', label: 'Workspace A' },
    promptText: 'Prompt previous',
    modelKey: 'qwen3-32b',
    versionLabel: 'workspace',
  },
  {
    id: 'b',
    label: 'B',
    promptRef: { kind: 'workspace', label: 'Workspace B' },
    promptText: 'Prompt current',
    modelKey: 'qwen3-32b',
    versionLabel: 'workspace',
  },
])

const createVersionCandidates = (): CompareRoleCandidate<VariantId>[] => ([
  {
    id: 'a',
    label: 'A',
    promptRef: { kind: 'workspace', label: 'Workspace A' },
    promptText: 'Prompt current',
    modelKey: 'qwen3-32b',
    versionLabel: 'workspace',
  },
  {
    id: 'b',
    label: 'B',
    promptRef: { kind: 'version', version: 1, label: 'v1' },
    promptText: 'Prompt baseline',
    modelKey: 'qwen3-32b',
    versionLabel: 'v1',
  },
])

describe('useCompareRoleConfig', () => {
  it('keeps a manual target role only when its persisted signature still matches', () => {
    const candidates = ref(createCandidates())
    const persistedRoles = ref<PersistedCompareSnapshotRoles<VariantId>>({
      b: 'target',
    })
    const persistedRoleSignatures = ref<PersistedCompareSnapshotRoleSignatures<VariantId>>({
      b: serializeCompareRolePersistedSignature({
        baseSignature: buildCompareRoleCandidateSignature(candidates.value[1]),
        workspacePromptSignature: buildCompareRoleCandidateWorkspacePromptSignature(
          candidates.value[1],
        ),
      }),
    })

    const config = useCompareRoleConfig({
      candidates: computed(() => candidates.value),
      persistedRoles,
      persistedRoleSignatures,
      persistRoles: vi.fn(),
    })

    expect(config.validManualRoles.value).toEqual({
      b: 'target',
    })
    expect(config.requiresExplicitTargetSelection.value).toBe(false)
    expect(config.inferredRoles.value).toEqual({
      a: 'baseline',
      b: 'target',
    })
  })

  it('drops stale manual roles when the slot signature no longer matches', () => {
    const candidates = ref(createCandidates())
    const persistedRoles = ref<PersistedCompareSnapshotRoles<VariantId>>({
      b: 'target',
    })
    const persistedRoleSignatures = ref<PersistedCompareSnapshotRoleSignatures<VariantId>>({
      b: JSON.stringify({
        promptKind: 'workspace',
        promptVersion: '',
        modelKey: 'deepseek-chat',
      }),
    })

    const config = useCompareRoleConfig({
      candidates: computed(() => candidates.value),
      persistedRoles,
      persistedRoleSignatures,
      persistRoles: vi.fn(),
    })

    expect(config.validManualRoles.value).toEqual({})
    expect(config.staleManualRoles.value).toEqual({
      b: 'target',
    })
    expect(config.requiresExplicitTargetSelection.value).toBe(false)
    expect(config.inferredRoles.value).toEqual({
      a: 'target',
      b: 'baseline',
    })
    expect(config.entries.value.every((entry) => entry.roleSource !== 'manual')).toBe(true)
    expect(config.entries.value.find((entry) => entry.id === 'b')?.staleManualRole).toBe('target')
  })

  it('keeps a manual workspace target but requires review when only the workspace prompt text changes', () => {
    const candidates = ref(createCandidates())
    const persistedRoles = ref<PersistedCompareSnapshotRoles<VariantId>>({
      b: 'target',
    })
    const persistedRoleSignatures = ref<PersistedCompareSnapshotRoleSignatures<VariantId>>({
      b: serializeCompareRolePersistedSignature({
        baseSignature: buildCompareRoleCandidateSignature(candidates.value[1]),
        workspacePromptSignature: buildCompareRoleCandidateWorkspacePromptSignature(
          candidates.value[1],
        ),
      }),
    })

    candidates.value = [
      candidates.value[0],
      {
        ...candidates.value[1],
        promptText: 'Prompt current but edited in workspace',
      },
    ]

    const config = useCompareRoleConfig({
      candidates: computed(() => candidates.value),
      persistedRoles,
      persistedRoleSignatures,
      persistRoles: vi.fn(),
    })

    expect(config.validManualRoles.value).toEqual({
      b: 'target',
    })
    expect(config.staleManualRoles.value).toEqual({})
    expect(config.workspaceChangedManualRoles.value).toEqual({
      b: 'target',
    })
    expect(config.requiresManualRoleReview.value).toBe(true)
    expect(
      config.entries.value.find((entry) => entry.id === 'b')?.workspaceChangedManualRole
    ).toBe('target')
  })

  it('keeps a legacy workspace manual role valid without forcing review', () => {
    const candidates = ref(createCandidates())
    const persistedRoles = ref<PersistedCompareSnapshotRoles<VariantId>>({
      b: 'target',
    })
    const persistedRoleSignatures = ref<PersistedCompareSnapshotRoleSignatures<VariantId>>({
      b: buildCompareRoleCandidateSignature(candidates.value[1]),
    })

    candidates.value = [
      candidates.value[0],
      {
        ...candidates.value[1],
        promptText: 'Prompt current but edited in workspace',
      },
    ]

    const config = useCompareRoleConfig({
      candidates: computed(() => candidates.value),
      persistedRoles,
      persistedRoleSignatures,
      persistRoles: vi.fn(),
    })

    expect(config.validManualRoles.value).toEqual({
      b: 'target',
    })
    expect(config.workspaceChangedManualRoles.value).toEqual({})
    expect(config.requiresManualRoleReview.value).toBe(false)
  })

  it('drops a manual non-workspace role when the referenced prompt text changes', () => {
    const candidates = ref(createVersionCandidates())
    const persistedRoles = ref<PersistedCompareSnapshotRoles<VariantId>>({
      b: 'baseline',
    })
    const persistedRoleSignatures = ref<PersistedCompareSnapshotRoleSignatures<VariantId>>({
      b: buildCompareRoleCandidateSignature(candidates.value[1]),
    })

    candidates.value = [
      candidates.value[0],
      {
        ...candidates.value[1],
        promptText: 'Prompt baseline updated',
      },
    ]

    const config = useCompareRoleConfig({
      candidates: computed(() => candidates.value),
      persistedRoles,
      persistedRoleSignatures,
      persistRoles: vi.fn(),
    })

    expect(config.validManualRoles.value).toEqual({})
    expect(config.staleManualRoles.value).toEqual({
      b: 'baseline',
    })
  })

  it('persists current signatures together with saved manual roles', async () => {
    const candidates = ref(createCandidates())
    const persistedRoles = ref<PersistedCompareSnapshotRoles<VariantId>>({})
    const persistedRoleSignatures = ref<PersistedCompareSnapshotRoleSignatures<VariantId>>({})
    const persistRoles = vi.fn()

    const config = useCompareRoleConfig({
      candidates: computed(() => candidates.value),
      persistedRoles,
      persistedRoleSignatures,
      persistRoles,
    })

    await config.saveRoles({
      b: 'target',
    })

    expect(persistRoles).toHaveBeenCalledWith(
      {
        b: 'target',
      },
      {
        b: serializeCompareRolePersistedSignature({
          baseSignature: buildCompareRoleCandidateSignature(candidates.value[1]),
          workspacePromptSignature: buildCompareRoleCandidateWorkspacePromptSignature(
            candidates.value[1],
          ),
        }),
      },
    )
  })

  it('marks duplicate singleton roles as a non-structured compare plan', () => {
    const candidates = ref(createCandidates())
    const persistedRoles = ref<PersistedCompareSnapshotRoles<VariantId>>({
      a: 'target',
      b: 'target',
    })
    const persistedRoleSignatures = ref<PersistedCompareSnapshotRoleSignatures<VariantId>>({
      a: buildCompareRoleCandidateSignature(candidates.value[0]),
      b: buildCompareRoleCandidateSignature(candidates.value[1]),
    })

    const config = useCompareRoleConfig({
      candidates: computed(() => candidates.value),
      persistedRoles,
      persistedRoleSignatures,
      persistRoles: vi.fn(),
    })

    expect(config.effectivePlanAnalysis.value.mode).toBe('generic')
    expect(config.structuredRolesReady.value).toBe(false)
    expect(config.effectivePlanAnalysis.value.blockingReasons).toContain('duplicateTarget')
  })

  it('falls back to generic compare when auto inference leaves auxiliary candidates', () => {
    type MultiVariantId =
      | 'target'
      | 'baseline-v2'
      | 'baseline-v3'
      | 'reference-workspace'
      | 'reference-alt'
      | 'reference-baseline-v1'
      | 'reference-baseline-v2'

    const candidates = ref<CompareRoleCandidate<MultiVariantId>[]>([
      {
        id: 'target',
        label: 'Target',
        promptRef: { kind: 'workspace', label: 'Workspace' },
        promptText: 'Prompt current',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'baseline-v2',
        label: 'Baseline v2',
        promptRef: { kind: 'version', version: 2, label: 'v2' },
        promptText: 'Prompt older',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'baseline-v3',
        label: 'Baseline v3',
        promptRef: { kind: 'version', version: 3, label: 'v3' },
        promptText: 'Prompt previous',
        modelKey: 'qwen3-32b',
      },
      {
        id: 'reference-workspace',
        label: 'Reference workspace',
        promptRef: { kind: 'workspace', label: 'Teacher Workspace' },
        promptText: 'Prompt current',
        modelKey: 'deepseek-chat',
      },
      {
        id: 'reference-alt',
        label: 'Reference alt',
        promptRef: { kind: 'workspace', label: 'Alt Teacher' },
        promptText: 'Prompt current',
        modelKey: 'claude-3-7-sonnet',
      },
      {
        id: 'reference-baseline-v1',
        label: 'Reference baseline v1',
        promptRef: { kind: 'version', version: 1, label: 'teacher-v1' },
        promptText: 'Teacher prompt oldest',
        modelKey: 'deepseek-chat',
      },
      {
        id: 'reference-baseline-v2',
        label: 'Reference baseline v2',
        promptRef: { kind: 'version', version: 2, label: 'teacher-v2' },
        promptText: 'Teacher prompt previous',
        modelKey: 'deepseek-chat',
      },
    ])

    const persistedRoles = ref<PersistedCompareSnapshotRoles<MultiVariantId>>({
      target: 'target',
    })
    const persistedRoleSignatures = ref<PersistedCompareSnapshotRoleSignatures<MultiVariantId>>({
      target: serializeCompareRolePersistedSignature({
        baseSignature: buildCompareRoleCandidateSignature(candidates.value[0]),
        workspacePromptSignature: buildCompareRoleCandidateWorkspacePromptSignature(
          candidates.value[0],
        ),
      }),
    })

    const config = useCompareRoleConfig({
      candidates: computed(() => candidates.value),
      persistedRoles,
      persistedRoleSignatures,
      persistRoles: vi.fn(),
    })

    expect(config.structuredRolesReady.value).toBe(false)
    expect(config.effectivePlanAnalysis.value.mode).toBe('generic')
    expect(config.effectivePlanAnalysis.value.blockingReasons).toContain('hasAuxiliarySnapshot')
    expect(config.effectiveRoles.value).toEqual({
      target: 'target',
      'baseline-v2': 'auxiliary',
      'baseline-v3': 'baseline',
      'reference-workspace': 'reference',
      'reference-alt': 'auxiliary',
      'reference-baseline-v1': 'auxiliary',
      'reference-baseline-v2': 'referenceBaseline',
    })
  })
})
