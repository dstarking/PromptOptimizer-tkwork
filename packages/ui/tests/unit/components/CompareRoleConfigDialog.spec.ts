import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CompareRoleConfigDialog from '../../../src/components/evaluation/CompareRoleConfigDialog.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (!params) return key
      return `${key}:${JSON.stringify(params)}`
    },
  }),
}))

const naiveStubs = {
  NModal: {
    name: 'NModal',
    template: '<div v-if="show" class="n-modal"><slot name="header-extra" /><slot /></div>',
    props: ['show', 'preset', 'title', 'style', 'maskClosable'],
  },
  NFlex: {
    name: 'NFlex',
    template: '<div class="n-flex"><slot /></div>',
    props: ['vertical', 'size', 'justify', 'wrap', 'align'],
  },
  NAlert: {
    name: 'NAlert',
    template: '<div class="n-alert"><slot /></div>',
    props: ['type', 'showIcon'],
  },
  NCard: {
    name: 'NCard',
    template: '<div class="n-card"><slot /></div>',
    props: ['size', 'embedded', 'title'],
  },
  NTooltip: {
    name: 'NTooltip',
    template: '<div class="n-tooltip"><slot name="trigger" /><slot /></div>',
    props: ['trigger', 'placement'],
  },
  NText: {
    name: 'NText',
    template: '<span><slot /></span>',
    props: ['depth', 'strong', 'type'],
  },
  NTag: {
    name: 'NTag',
    template: '<span class="n-tag"><slot /></span>',
    props: ['size', 'type', 'bordered'],
  },
  NButton: {
    name: 'NButton',
    template: '<button :disabled="disabled" @click="$emit(\'click\', $event)"><slot /></button>',
    props: ['type', 'disabled', 'quaternary', 'text', 'size'],
    emits: ['click'],
  },
}

const createEntries = () => ([
  {
    id: 'a',
    label: 'A',
    promptRef: { kind: 'workspace', label: 'Workspace A' },
    promptRefLabel: 'Workspace A',
    promptText: 'Prompt current',
    modelKey: 'qwen3-32b',
    versionLabel: 'workspace',
    inferredRole: 'target',
  },
  {
    id: 'b',
    label: 'B',
    promptRef: { kind: 'version', version: 1, label: 'v1', dynamicAlias: 'previous' },
    promptRefLabel: 'Previous (v1)',
    promptText: 'Prompt previous',
    modelKey: 'qwen3-32b',
    versionLabel: 'Previous (v1)',
    inferredRole: 'baseline',
  },
  {
    id: 'c',
    label: 'C',
    promptRef: { kind: 'version', version: 0, label: 'v0' },
    promptRefLabel: 'v0',
    promptText: 'Prompt older',
    modelKey: 'qwen3-32b',
    versionLabel: 'v0',
  },
])

const createStructuredEntries = () => createEntries().slice(0, 2)

const createTeacherEntries = () => ([
  {
    id: 'a',
    label: 'A',
    promptRef: { kind: 'version', version: 1, label: 'v1', dynamicAlias: 'previous' },
    promptRefLabel: 'Previous (v1)',
    promptText: 'Prompt previous',
    modelKey: 'qwen3-32b',
    versionLabel: 'Previous (v1)',
  },
  {
    id: 'b',
    label: 'B',
    promptRef: { kind: 'workspace', label: 'Workspace B' },
    promptRefLabel: 'Workspace B',
    promptText: 'Prompt current',
    modelKey: 'qwen3-32b',
    versionLabel: 'workspace',
  },
  {
    id: 'c',
    label: 'C',
    promptRef: { kind: 'workspace', label: 'Workspace C' },
    promptRefLabel: 'Workspace C',
    promptText: 'Prompt current',
    modelKey: 'deepseek-chat',
    versionLabel: 'workspace',
  },
])

describe('CompareRoleConfigDialog', () => {
  it('shows the current target and active pair summary directly in the overview', () => {
    const wrapper = mount(CompareRoleConfigDialog, {
      props: {
        modelValue: true,
        entries: createStructuredEntries(),
        manualRoles: {},
      },
      global: {
        stubs: {
          ...naiveStubs,
          CompareHelpButton: { template: '<div class="compare-help-button" />' },
        },
      },
    })

    expect(wrapper.text()).toContain('A · workspace')
    expect(wrapper.text()).toContain('Smart Compare')
    expect(wrapper.text()).toContain('targetBaseline')
  })

  it('only shows the actually enabled pair tags for the current compare setup', () => {
    const wrapper = mount(CompareRoleConfigDialog, {
      props: {
        modelValue: true,
        entries: createTeacherEntries(),
        manualRoles: {},
      },
      global: {
        stubs: {
          ...naiveStubs,
          CompareHelpButton: { template: '<div class="compare-help-button" />' },
        },
      },
    })

    expect(wrapper.text()).toContain('targetBaseline')
    expect(wrapper.text()).toContain('targetReference')
    expect(wrapper.text()).not.toContain('targetReplica')
  })

  it('emits only explicit manual overrides on confirm', async () => {
    const wrapper = mount(CompareRoleConfigDialog, {
      props: {
        modelValue: true,
        entries: createStructuredEntries(),
        manualRoles: {},
      },
      global: {
        stubs: {
          ...naiveStubs,
          CompareHelpButton: { template: '<div class="compare-help-button" />' },
        },
      },
    })

    await wrapper.get('[data-testid="compare-role-config-confirm"]').trigger('click')

    expect(wrapper.emitted('confirm')).toEqual([[{}]])
  })

  it('does not keep a manual override when the selected role already matches the system suggestion', async () => {
    const wrapper = mount(CompareRoleConfigDialog, {
      props: {
        modelValue: true,
        entries: createStructuredEntries(),
        manualRoles: {},
      },
      global: {
        stubs: {
          ...naiveStubs,
          CompareHelpButton: { template: '<div class="compare-help-button" />' },
        },
      },
    })

    await wrapper.get('[data-testid="compare-role-button-b-baseline"]').trigger('click')
    await wrapper.get('[data-testid="compare-role-config-confirm"]').trigger('click')

    expect(wrapper.emitted('confirm')).toEqual([[{}]])
  })

  it('auto-releases an older unique role assignment when another column takes it', async () => {
    const wrapper = mount(CompareRoleConfigDialog, {
      props: {
        modelValue: true,
        entries: createEntries(),
        manualRoles: {},
      },
      global: {
        stubs: {
          ...naiveStubs,
          CompareHelpButton: { template: '<div class="compare-help-button" />' },
        },
      },
    })

    await wrapper.get('[data-testid="compare-role-button-b-reference"]').trigger('click')
    await wrapper.get('[data-testid="compare-role-button-c-reference"]').trigger('click')
    await wrapper.get('[data-testid="compare-role-config-confirm"]').trigger('click')

    expect(wrapper.emitted('confirm')).toEqual([
      [
        {
          c: 'reference',
        },
      ],
    ])
  })

  it('keeps the UI focused on the four core roles only', () => {
    const wrapper = mount(CompareRoleConfigDialog, {
      props: {
        modelValue: true,
        entries: createEntries(),
        manualRoles: {},
      },
      global: {
        stubs: {
          ...naiveStubs,
          CompareHelpButton: { template: '<div class="compare-help-button" />' },
        },
      },
    })

    expect(wrapper.find('[data-testid="compare-role-button-a-referenceBaseline"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="compare-role-button-a-auxiliary"]').exists()).toBe(false)
  })

  it('shows which columns are still unresolved when smart compare falls back', () => {
    const wrapper = mount(CompareRoleConfigDialog, {
      props: {
        modelValue: true,
        entries: createEntries(),
        manualRoles: {},
      },
      global: {
        stubs: {
          ...naiveStubs,
          CompareHelpButton: { template: '<div class="compare-help-button" />' },
        },
      },
    })

    expect(wrapper.text()).toContain('evaluation.compareConfig.unresolvedFallbackSummary:{"entries":"C"}')
    expect(wrapper.text()).not.toContain('evaluation.compareConfig.advancedSectionTitle')
    expect(wrapper.text()).not.toContain('evaluation.compareConfig.previewReasonsLabel')
    expect(wrapper.text()).not.toContain('evaluation.compareConfig.reasonValues.hasAuxiliarySnapshot')
  })

  it('shows workspace review warnings when a saved workspace role needs reconfirmation', () => {
    const wrapper = mount(CompareRoleConfigDialog, {
      props: {
        modelValue: true,
        entries: [
          {
            ...createEntries()[0],
            manualRole: 'target',
            workspaceChangedManualRole: 'target',
          },
          createEntries()[1],
        ],
        manualRoles: {
          a: 'target',
        },
      },
      global: {
        stubs: {
          ...naiveStubs,
          CompareHelpButton: { template: '<div class="compare-help-button" />' },
        },
      },
    })

    expect(wrapper.text()).toContain('evaluation.compareConfig.workspaceChangedTag')
    expect(wrapper.text()).toContain('evaluation.compareConfig.workspaceChangedInline')
  })
})
