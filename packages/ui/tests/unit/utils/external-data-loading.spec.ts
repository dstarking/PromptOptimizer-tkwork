import { describe, expect, it } from 'vitest'

import { createExternalDataLoadingGate } from '../../../src/utils/external-data-loading'

describe('createExternalDataLoadingGate', () => {
  it('keeps loading true until every concurrent owner leaves', () => {
    const gate = createExternalDataLoadingGate()

    gate.isLoading.value = true
    gate.isLoading.value = true

    expect(gate.isLoading.value).toBe(true)
    expect(gate.depth.value).toBe(2)

    gate.isLoading.value = false

    expect(gate.isLoading.value).toBe(true)
    expect(gate.depth.value).toBe(1)

    gate.isLoading.value = false

    expect(gate.isLoading.value).toBe(false)
    expect(gate.depth.value).toBe(0)
  })

  it('does not underflow when a caller leaves too many times', () => {
    const gate = createExternalDataLoadingGate()

    gate.isLoading.value = false

    expect(gate.isLoading.value).toBe(false)
    expect(gate.depth.value).toBe(0)
  })
})
