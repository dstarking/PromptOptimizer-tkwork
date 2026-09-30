import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CompareRoleBadge from '../../../src/components/evaluation/CompareRoleBadge.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'evaluation.compareShared.unresolved.label') return '未明确'
      if (key === 'evaluation.compareShared.unresolved.description') return '这列还没有被明确归到核心比较角色里。'
      if (key === 'evaluation.compareShared.unresolved.source') return '系统暂时无法把它判断为优化目标、上一版、教师或复测。'
      if (key === 'evaluation.compareShared.roleAction') return '点击这个标签即可修改比较角色。'
      return params ? `${key}:${JSON.stringify(params)}` : key
    },
  }),
}))

const naiveStubs = {
  NPopover: {
    name: 'NPopover',
    template: '<div class="n-popover"><slot name="trigger" /><slot /></div>',
    props: ['trigger', 'placement', 'showArrow', 'class'],
  },
  NTag: {
    name: 'NTag',
    template: '<span class="n-tag"><slot /></span>',
    props: ['size', 'type', 'bordered', 'class'],
  },
  NText: {
    name: 'NText',
    template: '<span><slot /></span>',
    props: ['depth', 'strong', 'type'],
  },
}

describe('CompareRoleBadge', () => {
  it('renders an unresolved badge when the role is not clear yet', () => {
    const wrapper = mount(CompareRoleBadge, {
      props: {
        entry: {
          effectiveRole: undefined,
          roleSource: undefined,
        },
      },
      global: {
        stubs: naiveStubs,
      },
    })

    expect(wrapper.text()).toContain('未明确')
  })

  it('emits click when the badge is used as the compare settings entry', async () => {
    const wrapper = mount(CompareRoleBadge, {
      props: {
        clickable: true,
        entry: {
          effectiveRole: 'target',
          roleSource: 'auto',
        },
      },
      global: {
        stubs: naiveStubs,
      },
    })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('click')).toEqual([[]])
  })
})
