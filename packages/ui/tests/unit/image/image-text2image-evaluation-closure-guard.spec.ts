import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readWorkspaceSource = () =>
  readFileSync(
    resolve(process.cwd(), 'src/components/image-mode/ImageText2ImageWorkspace.vue'),
    'utf8',
  )

describe('image text2image evaluation closure guard', () => {
  it('keeps prompt evaluation scoped to prompt-only and disables panel-side rewrite actions', () => {
    const source = readWorkspaceSource()

    expect(source).toContain('evaluation-type-override="prompt-only"')
    expect(source).toContain(':can-rewrite-from-evaluation="false"')
  })

  it('wires result and compare evaluation actions to the current evaluation handlers', () => {
    const source = readWorkspaceSource()

    expect(source).toContain('@evaluate="handleEvaluateCompare"')
    expect(source).toContain('@evaluate-with-feedback="handleCompareEvaluateWithFeedback"')
    expect(source).toContain("@evaluate=\"() => handleEvaluateResult(id)\"")
    expect(source).toContain('@evaluate-with-feedback="handleResultEvaluateWithFeedbackEvent(id, $event)"')
  })

  it('routes original-input analysis through reference actions and keeps prompt analysis wired', () => {
    const source = readWorkspaceSource()

    expect(source).toContain('v-for="button in referenceActionButtons"')
    expect(source).toContain('@click="triggerReferenceAction(button.kind)"')
    expect(source).toContain("kind: 'replicate' as ReferenceActionKind")
    expect(source).toContain("kind: 'style-learn' as ReferenceActionKind")
    expect(source).toContain('referenceAction.requestAction(actionKind)')
    expect(source).toContain("extractImageInputRef.value?.click()")
    expect(source).toContain('data-testid="image-text2image-analyze-button"')
    expect(source).toContain('@click="handleAnalyzePrompt"')
    expect(source).toContain("await handleEvaluateInternal('prompt-only')")
  })
})
