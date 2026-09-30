export const COMPARE_BASELINE_VARIANT_ID = 'a' as const
export const COMPARE_CANDIDATE_VARIANT_ID = 'b' as const
export const SINGLE_TEST_VARIANT_ID = 'single' as const

export type CompareTestVariantId =
  | typeof COMPARE_BASELINE_VARIANT_ID
  | typeof COMPARE_CANDIDATE_VARIANT_ID

export interface TestVariantState {
  result: string
  reasoning: string
  isRunning: boolean
}

export type TestVariantStateMap = Record<string, TestVariantState>

export const createEmptyTestVariantState = (): TestVariantState => ({
  result: '',
  reasoning: '',
  isRunning: false,
})

export const createCompareTestVariantStateMap = (): Record<CompareTestVariantId, TestVariantState> => ({
  [COMPARE_BASELINE_VARIANT_ID]: createEmptyTestVariantState(),
  [COMPARE_CANDIDATE_VARIANT_ID]: createEmptyTestVariantState(),
})
