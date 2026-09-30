import { describe, expect, it } from 'vitest'
import {
  applyCompareManualRoleSelection,
  buildComparePairPreviewEntries,
  buildCompareRoleSuggestionReason,
  buildCompareRoleTooltipCopy,
} from '../../../src/components/evaluation/compare-ui'

const t = (key: string) => key

describe('compare-ui', () => {
  it('does not show a warning for stale manual roles that are already ignored', () => {
    const tooltip = buildCompareRoleTooltipCopy(t, {
      effectiveRole: 'baseline',
      roleSource: 'auto',
      staleManualRole: 'target',
    })

    expect(tooltip).not.toBeNull()
    expect(tooltip?.warning).toBeNull()
  })

  it('keeps the warning when a workspace-linked manual role needs reconfirmation', () => {
    const tooltip = buildCompareRoleTooltipCopy(t, {
      effectiveRole: 'target',
      roleSource: 'manual',
      workspaceChangedManualRole: 'target',
    })

    expect(tooltip).not.toBeNull()
    expect(tooltip?.warning).toBe(
      'The workspace content changed after this role was confirmed. Please review it again.'
    )
  })

  it('returns unresolved tooltip copy when the role is still unclear', () => {
    const tooltip = buildCompareRoleTooltipCopy(t, {
      effectiveRole: undefined,
      roleSource: undefined,
    })

    expect(tooltip).not.toBeNull()
    expect(tooltip?.label).toBe('Not Clear Yet')
  })

  it('auto-releases an existing singleton role when another entry takes it manually', () => {
    const nextRoles = applyCompareManualRoleSelection(
      {
        a: 'reference',
        b: 'baseline',
      },
      {
        entryId: 'c',
        nextRole: 'reference',
        suggestedRole: 'auxiliary',
      },
    )

    expect(nextRoles).toEqual({
      b: 'baseline',
      c: 'reference',
    })
  })

  it('drops the manual override when the user selects the current system suggestion', () => {
    const nextRoles = applyCompareManualRoleSelection(
      {
        a: 'reference',
      },
      {
        entryId: 'a',
        nextRole: 'target',
        suggestedRole: 'target',
      },
    )

    expect(nextRoles).toEqual({})
  })

  it('keeps pair preview order fixed', () => {
    const entries = buildComparePairPreviewEntries(t, ['targetReference', 'targetBaseline'])

    expect(entries.map((entry) => entry.key)).toEqual([
      'targetBaseline',
      'targetReference',
      'referenceBaseline',
      'targetReplica',
    ])
    expect(entries.map((entry) => entry.enabled)).toEqual([true, true, false, false])
  })

  it('explains why a unique workspace is suggested as the optimization target', () => {
    const reason = buildCompareRoleSuggestionReason(t, {
      candidate: {
        id: 'a',
        promptRef: { kind: 'workspace', label: 'Workspace' },
        promptText: 'Prompt current',
        modelKey: 'qwen3-32b',
      },
      suggestedRole: 'target',
      candidates: [
        {
          id: 'a',
          promptRef: { kind: 'workspace', label: 'Workspace' },
          promptText: 'Prompt current',
          modelKey: 'qwen3-32b',
        },
      ],
      snapshotRoles: {
        a: 'target',
      },
    })

    expect(reason).toBe(
      'This is the only workspace column, so it is suggested as the optimization target.'
    )
  })

  it('explains when a previous alias matches workspace content and becomes a retest', () => {
    const reason = buildCompareRoleSuggestionReason(t, {
      candidate: {
        id: 'b',
        promptRef: { kind: 'version', version: 2, dynamicAlias: 'previous' },
        promptText: 'Prompt current',
        modelKey: 'qwen3-32b',
      },
      suggestedRole: 'replica',
      candidates: [
        {
          id: 'a',
          promptRef: { kind: 'workspace' },
          promptText: 'Prompt current',
          modelKey: 'qwen3-32b',
        },
        {
          id: 'b',
          promptRef: { kind: 'version', version: 2, dynamicAlias: 'previous' },
          promptText: 'Prompt current',
          modelKey: 'qwen3-32b',
        },
      ],
      snapshotRoles: {
        a: 'target',
        b: 'replica',
      },
    })

    expect(reason).toBe(
      'It matches the current workspace content, so it is suggested as a retest.'
    )
  })
})
