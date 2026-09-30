import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

import FocusAnalyzeButton from '../../../src/components/evaluation/FocusAnalyzeButton.vue'

const NTooltipStub = defineComponent({
  name: 'NTooltip',
  props: {
    disabled: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'n-tooltip-stub', 'data-disabled': String(props.disabled) }, [
        slots.trigger?.(),
        h('div', { class: 'n-tooltip-content' }, slots.default?.()),
      ])
  },
})

const NButtonStub = defineComponent({
  name: 'NButton',
  props: {
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { slots, emit, attrs }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          disabled: props.disabled,
          onClick: (event: MouseEvent) => emit('click', event),
        },
        slots.default?.()
      )
  },
})

const simpleStub = (name: string) =>
  defineComponent({
    name,
    setup(_, { slots }) {
      return () => h('div', { class: name }, slots.default?.())
    },
  })

describe('FocusAnalyzeButton', () => {
  it('renders disabled reason tooltip content when evaluation is blocked', () => {
    const wrapper = mount(FocusAnalyzeButton, {
      props: {
        type: 'compare',
        label: '对比评估',
        disabled: true,
        disabledReason: '对比评估至少需要一个工作区测试结果。',
      },
      global: {
        stubs: {
          NButton: NButtonStub,
          NButtonGroup: simpleStub('NButtonGroup'),
          NCard: simpleStub('NCard'),
          NIcon: simpleStub('NIcon'),
          NPopover: simpleStub('NPopover'),
          NSpace: simpleStub('NSpace'),
          NTag: simpleStub('NTag'),
          NText: simpleStub('NText'),
          NTooltip: NTooltipStub,
          FeedbackEditor: simpleStub('FeedbackEditor'),
          AnalyzeActionIcon: simpleStub('AnalyzeActionIcon'),
          Focus2: simpleStub('Focus2'),
        },
      },
    })

    expect(wrapper.get('.focus-analyze-tooltip-trigger').attributes('title')).toBe(
      '对比评估至少需要一个工作区测试结果。'
    )
  })
})
