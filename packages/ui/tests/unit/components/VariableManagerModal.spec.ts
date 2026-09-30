import { describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import VariableManagerModal from '../../../src/components/variable/VariableManagerModal.vue'

const createVariableManager = () => {
  const addVariable = vi.fn()
  const variables: Record<string, string> = {}
  const manager = {
    resolveAllVariables: () => ({ ...variables }),
    getVariableSource: (name: string) => name === 'originalPrompt' ? 'predefined' : 'custom',
    isPredefinedVariable: (name: string) => name === 'originalPrompt'
  }

  return {
    addVariable,
    hook: {
      variableManager: ref(manager),
      addVariable: (name: string, value: string) => {
        variables[name] = value
        addVariable(name, value)
      }
    }
  }
}

describe('VariableManagerModal', () => {
  it('allows Chinese variable names in quick add', async () => {
    const { hook, addVariable } = createVariableManager()
    const wrapper = shallowMount(VariableManagerModal, {
      props: {
        visible: true,
        variableManager: hook as any
      }
    })

    ;(wrapper.vm as any).quickAddForm = {
      name: '中文变量',
      value: '测试值'
    }

    expect((wrapper.vm as any).canQuickAdd).toBe(true)

    await (wrapper.vm as any).quickAddVariable()

    expect(addVariable).toHaveBeenCalledWith('中文变量', '测试值')
    expect(wrapper.emitted('variableChange')?.[0]).toEqual(['中文变量', '测试值', 'add'])
  })

  it('blocks invalid and predefined names in quick add', () => {
    const { hook } = createVariableManager()
    const wrapper = shallowMount(VariableManagerModal, {
      props: {
        visible: true,
        variableManager: hook as any
      }
    })

    ;(wrapper.vm as any).quickAddForm = {
      name: 'foo bar',
      value: 'value'
    }
    expect((wrapper.vm as any).canQuickAdd).toBe(false)

    ;(wrapper.vm as any).quickAddForm = {
      name: 'originalPrompt',
      value: 'value'
    }
    expect((wrapper.vm as any).canQuickAdd).toBe(false)
  })
})
