import { reactive } from 'vue'

export type TestVariantSourceFeedbackTone = 'change' | 'error'

export interface TestVariantSourceFeedbackState {
  key: number
  tone: TestVariantSourceFeedbackTone | null
}

export const useTestVariantSourceFeedback = <Id extends string>(
  ids: readonly Id[],
) => {
  const variantSourceFeedback = reactive(
    Object.fromEntries(
      ids.map((id) => [id, { key: 0, tone: null }]),
    ) as Record<Id, TestVariantSourceFeedbackState>,
  ) as Record<Id, TestVariantSourceFeedbackState>

  const pulseVariantSource = (id: Id, tone: TestVariantSourceFeedbackTone) => {
    variantSourceFeedback[id] = {
      key: variantSourceFeedback[id].key + 1,
      tone,
    }
  }

  return {
    variantSourceFeedback,
    pulseVariantSource,
  }
}
