import { describe, expect, it } from 'vitest'

import {
  getTestSourceAreaForSelection,
  useTestSourceAreaFeedback,
} from '../../../src/composables/prompt/useTestSourceAreaFeedback'

describe('useTestSourceAreaFeedback', () => {
  it('maps original selections to the original prompt area and all optimized sources to the workspace area', () => {
    expect(getTestSourceAreaForSelection(0)).toBe('original')
    expect(getTestSourceAreaForSelection('workspace')).toBe('workspace')
    expect(getTestSourceAreaForSelection('previous')).toBe('workspace')
    expect(getTestSourceAreaForSelection(3)).toBe('workspace')
  })

  it('records the semantic source tone for the physical area pulse', () => {
    const { sourceAreaFeedback, pulseSourceAreaForSelection } = useTestSourceAreaFeedback()

    pulseSourceAreaForSelection('previous', 2, 'change')
    expect(sourceAreaFeedback.workspace).toMatchObject({
      key: 1,
      tone: 'change',
      sourceTone: 'previous',
      resolvedVersion: 2,
    })

    pulseSourceAreaForSelection(0, 0, 'error')
    expect(sourceAreaFeedback.original).toMatchObject({
      key: 1,
      tone: 'error',
      sourceTone: 'original',
      resolvedVersion: 0,
    })
  })
})
