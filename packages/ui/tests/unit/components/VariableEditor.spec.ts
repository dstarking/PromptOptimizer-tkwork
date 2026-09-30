import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import VariableEditor from '../../../src/components/variable/VariableEditor.vue'

const stubs = {
  NModal: {
    name: 'NModal',
    template: '<div><slot /><slot name="footer" /></div>',
    props: ['show', 'title', 'preset', 'style', 'maskClosable']
  },
  NForm: {
    name: 'NForm',
    template: '<form><slot /></form>',
    props: ['model', 'rules']
  },
  NFormItem: {
    name: 'NFormItem',
    template: '<div><slot /><slot name="feedback" /></div>',
    props: ['path', 'label', 'required']
  },
  NInput: {
    name: 'NInput',
    template: '<input :value="value" @input="$emit(\'update:value\', ($event.target as HTMLInputElement).value)" />',
    props: ['value', 'placeholder', 'disabled', 'clearable', 'type', 'autosize'],
    emits: ['update:value']
  },
  NButton: {
    name: 'NButton',
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'disabled', 'loading'],
    emits: ['click']
  },
  NSpace: {
    name: 'NSpace',
    template: '<div><slot /></div>',
    props: ['justify']
  },
  NText: {
    name: 'NText',
    template: '<span><slot /></span>',
    props: ['depth']
  }
}

const mountEditor = () => mount(VariableEditor, {
  props: {
    show: true,
    existingNames: []
  },
  global: {
    stubs
  }
})

describe('VariableEditor', () => {
  it('uses the shared variable-name contract so Chinese names are valid', () => {
    const wrapper = mountEditor()
    const nameRules = (wrapper.vm as any).formRules.name

    expect(nameRules[1].validator({}, '中文变量')).toBeUndefined()
    expect(nameRules[1].validator({}, 'foo bar')).toBeInstanceOf(Error)
    expect(nameRules[1].validator({}, '1name')).toBeInstanceOf(Error)
  })

  it('keeps predefined variable names blocked', () => {
    const wrapper = mountEditor()
    const nameRules = (wrapper.vm as any).formRules.name

    expect(nameRules[2].validator({}, 'originalPrompt')).toBeInstanceOf(Error)
  })
})
