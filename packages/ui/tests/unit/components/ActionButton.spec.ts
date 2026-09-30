import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('naive-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('naive-ui')>()

  return {
    ...actual,
    NButton: defineComponent({
      name: 'NButton',
      setup(_, { slots, attrs }) {
        return () => h('button', attrs, slots.default?.())
      },
    }),
  }
})

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()

  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
    }),
  }
})

import ActionButton from '../../../src/components/ActionButton.vue'

describe('ActionButton', () => {
  it('passes accessibility and testing attributes to the underlying button', () => {
    const wrapper = mount(ActionButton, {
      props: {
        text: 'Favorite Library',
        type: 'primary',
      },
      attrs: {
        'data-testid': 'header-favorites-page-action',
        'aria-current': 'page',
        title: 'Favorite Library',
      },
    })

    const button = wrapper.get('button')
    expect(button.attributes('data-testid')).toBe('header-favorites-page-action')
    expect(button.attributes('aria-current')).toBe('page')
    expect(button.attributes('title')).toBe('Favorite Library')
  })
})
