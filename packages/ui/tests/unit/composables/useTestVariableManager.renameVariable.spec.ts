import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

const messageApi = {
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('naive-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('naive-ui')>()
  return {
    ...actual,
    useMessage: () => messageApi,
  }
})

import { useTestVariableManager } from '../../../src/composables/variable/useTestVariableManager'

describe('useTestVariableManager.renameVariable', () => {
  beforeEach(() => {
    messageApi.success.mockReset()
    messageApi.warning.mockReset()
  })

  it('成功重命名：移除旧名、写入新名并提示 success', () => {
    const globalVariables = ref<Record<string, string>>({})
    const predefinedVariables = ref<Record<string, string>>({})
    const temporaryVariables = ref<Record<string, string>>({
      oldName: 'value',
    })

    const onVariableChange = vi.fn()
    const onVariableRemove = vi.fn()

    const mgr = useTestVariableManager({
      globalVariables,
      predefinedVariables,
      temporaryVariables,
      onVariableChange,
      onVariableRemove,
    })

    const ok = mgr.renameVariable('oldName', 'newName')
    expect(ok).toBe(true)

    expect(onVariableRemove).toHaveBeenCalledWith('oldName')
    expect(onVariableChange).toHaveBeenCalledWith('newName', 'value')
    expect(messageApi.success).toHaveBeenCalledTimes(1)

    // internal state should contain the new name
    expect(mgr.sortedVariables.value).toContain('newName')
    expect(mgr.sortedVariables.value).not.toContain('oldName')
  })

  it('重命名为空：返回 false 并 warning required', () => {
    const mgr = useTestVariableManager({
      globalVariables: ref({}),
      predefinedVariables: ref({}),
      temporaryVariables: ref({ a: '1' }),
    })

    const ok = mgr.renameVariable('a', '   ')
    expect(ok).toBe(false)
    expect(messageApi.warning).toHaveBeenCalledWith('variableExtraction.validation.required')
  })

  it('重命名为重复变量名：返回 false 并 warning duplicate', () => {
    const mgr = useTestVariableManager({
      globalVariables: ref({}),
      predefinedVariables: ref({}),
      temporaryVariables: ref({ a: '1', b: '2' }),
    })

    const ok = mgr.renameVariable('a', 'b')
    expect(ok).toBe(false)
    expect(messageApi.warning).toHaveBeenCalledWith('variableExtraction.validation.duplicateVariable')
  })

  it('缺少 remove/rename 回调：返回 false 并 warning renameNotSupported（不修改内部状态）', () => {
    const onVariableChange = vi.fn()
    const mgr = useTestVariableManager({
      globalVariables: ref({}),
      predefinedVariables: ref({}),
      temporaryVariables: ref({ a: '1' }),
      onVariableChange,
      // Intentionally omit onVariableRemove / onVariableRename.
    })

    const ok = mgr.renameVariable('a', 'b')
    expect(ok).toBe(false)
    expect(messageApi.warning).toHaveBeenCalledWith('test.variables.renameNotSupported')

    expect(mgr.sortedVariables.value).toContain('a')
    expect(mgr.sortedVariables.value).not.toContain('b')
    expect(onVariableChange).not.toHaveBeenCalled()
  })
})
