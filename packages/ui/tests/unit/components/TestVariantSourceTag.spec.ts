import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TestVariantSourceTag from '../../../src/components/TestVariantSourceTag.vue'

const labels = {
  workspace: 'Workspace',
  previous: 'Previous',
  original: 'Original',
}

const mountTag = (props: Record<string, unknown>) =>
  mount(TestVariantSourceTag, {
    props: {
      variantLabel: 'A',
      selection: 'workspace',
      resolvedVersion: -1,
      labels,
      ...props,
    },
  })

describe('TestVariantSourceTag', () => {
  it('combines column identity with the selected source', () => {
    const wrapper = mountTag({
      variantLabel: 'B',
      selection: 'previous',
      resolvedVersion: 2,
    })

    expect(wrapper.get('.test-variant-source-tag').text()).toBe('B · Previous (v2)')
    expect(wrapper.get('.test-variant-source-tag').attributes('title')).toBe('B · Previous (v2)')
  })

  it('uses a small semantic tone set instead of per-version colors', () => {
    expect(mountTag({ selection: 'workspace', resolvedVersion: -1 }).get('.test-variant-source-tag').attributes('data-source-tone')).toBe('workspace')
    expect(mountTag({ selection: 'previous', resolvedVersion: 1 }).get('.test-variant-source-tag').attributes('data-source-tone')).toBe('previous')
    expect(mountTag({ selection: 0, resolvedVersion: 0 }).get('.test-variant-source-tag').attributes('data-source-tone')).toBe('original')
    expect(mountTag({ selection: 3, resolvedVersion: 3 }).get('.test-variant-source-tag').attributes('data-source-tone')).toBe('version')
  })

  it('uses theme error tone only for validation feedback', () => {
    const wrapper = mountTag({
      selection: 'workspace',
      resolvedVersion: -1,
      feedbackKey: 1,
      feedbackTone: 'error',
    })

    expect(wrapper.get('.test-variant-source-tag').attributes('data-feedback-tone')).toBe('error')
    expect(wrapper.get('.test-variant-source-tag').classes()).toContain('test-variant-source-tag--feedback-error')
  })

  it('emits activate when the source tag is clicked or keyboard activated', async () => {
    const wrapper = mountTag({
      selection: 1,
      resolvedVersion: 1,
    })

    await wrapper.get('.test-variant-source-tag').trigger('click')
    await wrapper.get('.test-variant-source-tag').trigger('keydown', { key: 'Enter' })
    await wrapper.get('.test-variant-source-tag').trigger('keydown', { key: ' ' })

    expect(wrapper.emitted('activate')).toHaveLength(3)
  })
})
