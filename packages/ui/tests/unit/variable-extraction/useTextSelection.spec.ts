import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import {
  TEXT_SELECTION_ERRORS,
  useTextSelection,
} from '../../../src/components/variable-extraction/useTextSelection'

describe('useTextSelection', () => {
  it('returns an english fallback when the input is not ready', () => {
    const { getSelection } = useTextSelection(ref(null))

    expect(getSelection()).toEqual({
      text: '',
      start: 0,
      end: 0,
      isValid: false,
      invalidReason: TEXT_SELECTION_ERRORS.inputNotReady,
    })
  })

  it('returns english validation reasons for invalid selections', () => {
    const element = document.createElement('textarea')
    element.value = 'Hello {{name}} world'
    element.selectionStart = 3
    element.selectionEnd = 10

    const { getSelection, validateSelection } = useTextSelection(ref(element))

    expect(getSelection().invalidReason).toBe(
      TEXT_SELECTION_ERRORS.crossesVariableBoundary
    )
    expect(validateSelection(element.value, 5, 5, '').reason).toBe(
      TEXT_SELECTION_ERRORS.emptySelection
    )
  })
})
