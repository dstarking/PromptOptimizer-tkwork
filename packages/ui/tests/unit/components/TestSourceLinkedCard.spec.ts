import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TestSourceLinkedCard from '../../../src/components/TestSourceLinkedCard.vue'

const mountCard = (props: Record<string, unknown>) =>
  mount(TestSourceLinkedCard, {
    props,
    slots: {
      default: 'Linked area',
    },
  })

describe('TestSourceLinkedCard', () => {
  it('keeps the source tone on the linked left-side area', () => {
    const wrapper = mountCard({
      sourceTone: 'workspace',
      feedbackKey: 1,
      feedbackTone: 'change',
    })

    const card = wrapper.get('.test-source-linked-card')
    expect(card.text()).toContain('Linked area')
    expect(card.attributes('data-source-tone')).toBe('workspace')
    expect(card.attributes('data-feedback-tone')).toBe('change')
    expect(card.classes()).toContain('test-source-linked-card--feedback-change')
    expect(wrapper.get('.test-source-linked-card__pulse').classes()).toContain(
      'test-source-linked-card__pulse--change',
    )
  })

  it('uses the error feedback class for UI-level interception', () => {
    const wrapper = mountCard({
      sourceTone: 'original',
      feedbackKey: 2,
      feedbackTone: 'error',
    })

    expect(wrapper.get('.test-source-linked-card').classes()).toContain(
      'test-source-linked-card--feedback-error',
    )
    expect(wrapper.get('.test-source-linked-card__pulse').classes()).toContain(
      'test-source-linked-card__pulse--error',
    )
  })
})
