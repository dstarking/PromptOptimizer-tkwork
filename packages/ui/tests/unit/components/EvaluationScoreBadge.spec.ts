import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import EvaluationScoreBadge from '../../../src/components/evaluation/EvaluationScoreBadge.vue'

const NPopoverStub = defineComponent({
  name: 'NPopover',
  props: {
    show: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:show', 'clickoutside'],
  setup(props, { slots, expose }) {
    expose({
      syncPosition: () => {
        // no-op in unit tests
      },
    })

    return () =>
      h('div', { class: 'n-popover-stub' }, [
        slots.trigger?.(),
        props.show ? h('div', { class: 'n-popover-content' }, slots.default?.()) : null,
      ])
  },
})

const NButtonStub = defineComponent({
  name: 'NButton',
  props: {
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
  },
  emits: ['click', 'mouseenter', 'mouseleave'],
  setup(props, { slots, emit, attrs }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          disabled: props.disabled,
          onClick: (e: MouseEvent) => emit('click', e),
          onMouseenter: (e: MouseEvent) => emit('mouseenter', e),
          onMouseleave: (e: MouseEvent) => emit('mouseleave', e),
        },
        slots.default?.()
      )
  },
})

const EvaluationHoverCardStub = defineComponent({
  name: 'EvaluationHoverCard',
  props: ['result', 'type', 'loading', 'visible', 'disableEvaluate', 'disableEvaluateReason'],
  emits: ['show-detail', 'evaluate', 'evaluate-with-feedback', 'apply-improvement', 'apply-patch'],
  setup(props) {
    return () => h('div', { class: 'hover-card-stub' }, [
      props.disableEvaluateReason
        ? h('div', { 'data-testid': 'disable-evaluate-reason' }, String(props.disableEvaluateReason))
        : null,
      h('textarea', { 'data-testid': 'feedback-input' }),
    ])
  },
})

const baseResult = {
  type: 'result',
  score: {
    overall: 88,
    dimensions: [
      {
        key: 'overall',
        label: 'Overall',
        score: 88,
      },
    ],
  },
  improvements: [],
  summary: 'summary',
  patchPlan: [],
}

describe('EvaluationScoreBadge popover focus interaction', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('clicking the score badge should open detail directly when a result exists', async () => {
    const wrapper = mount(EvaluationScoreBadge, {
      props: {
        score: 88,
        level: 'good',
        loading: false,
        result: baseResult,
        type: 'result',
      },
      global: {
        stubs: {
          NPopover: NPopoverStub,
          NButton: NButtonStub,
          EvaluationHoverCard: EvaluationHoverCardStub,
        },
      },
    })

    const badgeButton = wrapper.find('[data-testid="score-badge-result"]')
    await badgeButton.trigger('click')
    await nextTick()

    expect(wrapper.emitted('show-detail')).toEqual([[]])
    expect(wrapper.find('.hover-card-wrapper').exists()).toBe(false)
  })

  it('focus within popover should prevent hover auto-close while typing', async () => {
    vi.useFakeTimers()

    const wrapper = mount(EvaluationScoreBadge, {
      props: {
        score: 80,
        level: 'good',
        loading: false,
        result: null,
        type: 'result',
      },
      global: {
        stubs: {
          NPopover: NPopoverStub,
          NButton: NButtonStub,
          EvaluationHoverCard: EvaluationHoverCardStub,
        },
      },
    })

    const badgeButton = wrapper.find('[data-testid="score-badge-result"]')
    expect(badgeButton.exists()).toBe(true)

    // Open popover via hover
    await badgeButton.trigger('mouseenter')
    await nextTick()
    expect(wrapper.find('.hover-card-wrapper').exists()).toBe(true)

    // Enter focus state (e.g., user clicks into textarea and starts typing)
    await wrapper.find('.hover-card-wrapper').trigger('focusin')

    // Simulate mouse leaving the popover while still focused
    await wrapper.find('.hover-card-wrapper').trigger('mouseleave')
    vi.advanceTimersByTime(300)
    await nextTick()

    // Should still be visible because focus prevents scheduleClose
    expect(wrapper.find('.hover-card-wrapper').exists()).toBe(true)
  })

  it('should keep popover open when applying an improvement', async () => {
    const wrapper = mount(EvaluationScoreBadge, {
      props: {
        score: 80,
        level: 'good',
        loading: false,
        result: null,
        type: 'result',
      },
      global: {
        stubs: {
          NPopover: NPopoverStub,
          NButton: NButtonStub,
          EvaluationHoverCard: EvaluationHoverCardStub,
        },
      },
    })

    const badgeButton = wrapper.find('[data-testid="score-badge-result"]')
    await badgeButton.trigger('click')
    await nextTick()

    expect(wrapper.find('.hover-card-wrapper').exists()).toBe(true)

    const hoverCard = wrapper.findComponent({ name: 'EvaluationHoverCard' })
    hoverCard.vm.$emit('apply-improvement', { improvement: 'Do X', type: 'result' })
    await nextTick()

    expect(wrapper.find('.hover-card-wrapper').exists()).toBe(true)
    expect(wrapper.emitted('apply-improvement')?.[0]?.[0]).toEqual({
      improvement: 'Do X',
      type: 'result',
    })
  })

  it('should keep popover open when applying a patch', async () => {
    const wrapper = mount(EvaluationScoreBadge, {
      props: {
        score: 80,
        level: 'good',
        loading: false,
        result: null,
        type: 'result',
      },
      global: {
        stubs: {
          NPopover: NPopoverStub,
          NButton: NButtonStub,
          EvaluationHoverCard: EvaluationHoverCardStub,
        },
      },
    })

    const badgeButton = wrapper.find('[data-testid="score-badge-result"]')
    await badgeButton.trigger('click')
    await nextTick()

    expect(wrapper.find('.hover-card-wrapper').exists()).toBe(true)

    const operation = {
      op: 'replace',
      oldText: 'Old',
      newText: 'New',
      instruction: 'Replace it',
    }

    const hoverCard = wrapper.findComponent({ name: 'EvaluationHoverCard' })
    hoverCard.vm.$emit('apply-patch', { operation })
    await nextTick()

    expect(wrapper.find('.hover-card-wrapper').exists()).toBe(true)
    expect(wrapper.emitted('apply-patch')?.[0]?.[0]).toEqual({ operation })
  })

  it('should suppress evaluate events when disableEvaluate is true', async () => {
    const wrapper = mount(EvaluationScoreBadge, {
      props: {
        score: 80,
        level: 'good',
        loading: false,
        result: baseResult,
        type: 'result',
        disableEvaluate: true,
      },
      global: {
        stubs: {
          NPopover: NPopoverStub,
          NButton: NButtonStub,
          EvaluationHoverCard: EvaluationHoverCardStub,
        },
      },
    })

    const badgeButton = wrapper.find('[data-testid="score-badge-result"]')
    await badgeButton.trigger('mouseenter')
    await nextTick()

    const hoverCard = wrapper.findComponent({ name: 'EvaluationHoverCard' })
    hoverCard.vm.$emit('evaluate')
    hoverCard.vm.$emit('evaluate-with-feedback', { feedback: 'focus' })
    await nextTick()

    expect(wrapper.emitted('evaluate')).toBeFalsy()
    expect(wrapper.emitted('evaluate-with-feedback')).toBeFalsy()
  })

  it('passes disableEvaluateReason into the hover card when evaluation is blocked', async () => {
    const wrapper = mount(EvaluationScoreBadge, {
      props: {
        score: 80,
        level: 'good',
        loading: false,
        result: baseResult,
        type: 'compare',
        disableEvaluate: true,
        disableEvaluateReason: '对比评估至少需要一个工作区测试结果。',
      },
      global: {
        stubs: {
          NPopover: NPopoverStub,
          NButton: NButtonStub,
          EvaluationHoverCard: EvaluationHoverCardStub,
        },
      },
    })

    const badgeButton = wrapper.find('[data-testid="score-badge-compare"]')
    await badgeButton.trigger('mouseenter')
    await nextTick()

    expect(wrapper.get('[data-testid="disable-evaluate-reason"]').text()).toBe(
      '对比评估至少需要一个工作区测试结果。'
    )
  })
})
