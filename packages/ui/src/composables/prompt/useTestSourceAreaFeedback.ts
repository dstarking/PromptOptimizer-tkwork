import { reactive } from 'vue'
import {
  getTestPanelVersionSourceTone,
  type DynamicTestPanelVersionValue,
  type TestPanelVersionSourceTone,
} from '../../utils/testPanelVersion'
import type { TestVariantSourceFeedbackTone } from './useTestVariantSourceFeedback'

export type TestSourceAreaId = 'original' | 'workspace'

export interface TestSourceAreaFeedbackState {
  key: number
  tone: TestVariantSourceFeedbackTone | null
  sourceTone: TestPanelVersionSourceTone
  resolvedVersion: number
}

const initialState = (
  sourceTone: TestPanelVersionSourceTone,
): TestSourceAreaFeedbackState => ({
  key: 0,
  tone: null,
  sourceTone,
  resolvedVersion: sourceTone === 'original' ? 0 : -1,
})

export const getTestSourceAreaForSelection = (
  selection: DynamicTestPanelVersionValue,
): TestSourceAreaId => (selection === 0 ? 'original' : 'workspace')

export const useTestSourceAreaFeedback = () => {
  const sourceAreaFeedback = reactive<Record<TestSourceAreaId, TestSourceAreaFeedbackState>>({
    original: initialState('original'),
    workspace: initialState('workspace'),
  })

  const pulseSourceArea = (
    id: TestSourceAreaId,
    tone: TestVariantSourceFeedbackTone,
    sourceTone: TestPanelVersionSourceTone,
    resolvedVersion: number,
  ) => {
    sourceAreaFeedback[id] = {
      key: sourceAreaFeedback[id].key + 1,
      tone,
      sourceTone,
      resolvedVersion,
    }
  }

  const pulseSourceAreaForSelection = (
    selection: DynamicTestPanelVersionValue,
    resolvedVersion: number,
    tone: TestVariantSourceFeedbackTone,
  ) => {
    const sourceTone = getTestPanelVersionSourceTone(selection, resolvedVersion)
    pulseSourceArea(getTestSourceAreaForSelection(selection), tone, sourceTone, resolvedVersion)
  }

  return {
    sourceAreaFeedback,
    pulseSourceArea,
    pulseSourceAreaForSelection,
  }
}
