import { describe, expect, it } from 'vitest'
import {
  buildTestPanelVersionOptions,
  formatTestPanelVariantSourceLabel,
  formatTestPanelVersionSelectionLabel,
  getSelectablePreviousSavedVersionNumber,
  getTestPanelVersionSourceTone,
  resolvePreviousSavedVersionNumber,
  resolveTestPanelVersionSelection,
} from '../../../src/utils/testPanelVersion'

const labels = {
  workspace: 'Workspace',
  previous: 'Previous',
  original: 'Original',
}

describe('testPanelVersion', () => {
  it('resolves the selectable previous version as the saved version before head', () => {
    expect(getSelectablePreviousSavedVersionNumber([
      { version: 1 },
      { version: 2 },
      { version: 3 },
    ])).toBe(2)
  })

  it('falls back to original when resolving previous for a single saved version chain', () => {
    expect(resolvePreviousSavedVersionNumber([
      { version: 1 },
    ])).toBe(0)
  })

  it('always keeps the previous alias in version options', () => {
    expect(buildTestPanelVersionOptions([], labels)).toEqual([
      { label: 'Workspace', fullLabel: 'Workspace', value: 'workspace' },
      { label: 'Previous', fullLabel: 'Previous (Original)', value: 'previous' },
      { label: 'Original', fullLabel: 'Original', value: 0 },
    ])
  })

  it('builds version options with a dynamic previous alias ahead of fixed versions', () => {
    expect(buildTestPanelVersionOptions([
      { version: 1 },
      { version: 2 },
      { version: 3 },
    ], labels)).toEqual([
      { label: 'Workspace', fullLabel: 'Workspace', value: 'workspace' },
      { label: 'Previous', fullLabel: 'Previous (v2)', value: 'previous' },
      { label: 'Original', fullLabel: 'Original', value: 0 },
      { label: 'v1', fullLabel: 'v1', value: 1 },
      { label: 'v2', fullLabel: 'v2', value: 2 },
      { label: 'v3', fullLabel: 'v3', value: 3 },
    ])
  })

  it('attaches dynamic previous resolution metadata when context is available', () => {
    const options = buildTestPanelVersionOptions([
      { id: 'v1', version: 1, optimizedPrompt: 'Prompt v1' },
      { id: 'v2', version: 2, optimizedPrompt: 'Prompt v2' },
      { id: 'v3', version: 3, optimizedPrompt: 'Prompt v3' },
    ], labels, {
      currentVersionId: 'v3',
      workspacePrompt: 'Prompt v3 plus local edits',
      originalPrompt: 'Prompt v0',
    })

    expect(options[1]).toMatchObject({
      label: 'Previous',
      fullLabel: 'Previous (v3)',
      value: 'previous',
      meta: {
        resolutionReason: 'currentBase',
        resolvedVersion: 3,
        isSameAsWorkspace: false,
      },
    })
  })

  it('marks previous as same-as-workspace when it falls back to the original prompt', () => {
    const options = buildTestPanelVersionOptions([], labels, {
      currentVersionId: '',
      workspacePrompt: 'Prompt v0',
      originalPrompt: 'Prompt v0',
    })

    expect(options[1]).toMatchObject({
      label: 'Previous',
      fullLabel: 'Previous (Original)',
      value: 'previous',
      meta: {
        resolutionReason: 'originalFallback',
        resolvedVersion: 0,
        isSameAsWorkspace: true,
      },
    })
  })

  it('formats previous labels using the resolved saved version', () => {
    expect(formatTestPanelVersionSelectionLabel('previous', 2, labels)).toBe('Previous (v2)')
    expect(formatTestPanelVersionSelectionLabel('previous', 0, labels)).toBe('Previous (Original)')
  })

  it('formats compact variant source labels without adding another tag concept', () => {
    expect(formatTestPanelVariantSourceLabel('A', 'workspace', -1, labels)).toBe('A · Workspace')
    expect(formatTestPanelVariantSourceLabel('B', 'previous', 2, labels)).toBe('B · Previous (v2)')
    expect(formatTestPanelVariantSourceLabel('C', 0, 0, labels)).toBe('C · Original')
    expect(formatTestPanelVariantSourceLabel('D', 3, 3, labels)).toBe('D · v3')
  })

  it('maps source selections to a small semantic tone set', () => {
    expect(getTestPanelVersionSourceTone('workspace', -1)).toBe('workspace')
    expect(getTestPanelVersionSourceTone('previous', 2)).toBe('previous')
    expect(getTestPanelVersionSourceTone(0, 0)).toBe('original')
    expect(getTestPanelVersionSourceTone(2, 2)).toBe('version')
  })

  it('resolves previous to the current saved version when the workspace has unsaved edits', () => {
    expect(resolveTestPanelVersionSelection({
      selection: 'previous',
      versions: [
        { id: 'v1', version: 1, optimizedPrompt: 'Prompt v1' },
        { id: 'v2', version: 2, optimizedPrompt: 'Prompt v2' },
        { id: 'v3', version: 3, optimizedPrompt: 'Prompt v3' },
      ],
      currentVersionId: 'v3',
      workspacePrompt: 'Prompt v3 plus local edits',
      originalPrompt: 'Prompt v0',
    })).toEqual({
      selection: 'previous',
      text: 'Prompt v3',
      resolvedVersion: 3,
      promptKind: 'version',
      dynamicAlias: 'previous',
      isSameAsWorkspace: false,
      resolutionReason: 'currentBase',
    })
  })

  it('resolves previous to the earlier saved version when the workspace is clean', () => {
    expect(resolveTestPanelVersionSelection({
      selection: 'previous',
      versions: [
        { id: 'v1', version: 1, optimizedPrompt: 'Prompt v1' },
        { id: 'v2', version: 2, optimizedPrompt: 'Prompt v2' },
        { id: 'v3', version: 3, optimizedPrompt: 'Prompt v3' },
      ],
      currentVersionId: 'v3',
      workspacePrompt: 'Prompt v3',
      originalPrompt: 'Prompt v0',
    })).toEqual({
      selection: 'previous',
      text: 'Prompt v2',
      resolvedVersion: 2,
      promptKind: 'version',
      dynamicAlias: 'previous',
      isSameAsWorkspace: false,
      resolutionReason: 'earlierSaved',
    })
  })

  it('resolves previous to original when only v0 exists and the workspace is unchanged', () => {
    expect(resolveTestPanelVersionSelection({
      selection: 'previous',
      versions: [],
      currentVersionId: '',
      workspacePrompt: 'Prompt v0',
      originalPrompt: 'Prompt v0',
    })).toEqual({
      selection: 'previous',
      text: 'Prompt v0',
      resolvedVersion: 0,
      promptKind: 'original',
      dynamicAlias: 'previous',
      isSameAsWorkspace: true,
      resolutionReason: 'originalFallback',
    })
  })
})
