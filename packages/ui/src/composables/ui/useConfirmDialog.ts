import {
  createDiscreteApi,
  useDialog,
  type DialogApi,
  type DialogOptions,
} from 'naive-ui'

type ConfirmDialogType = 'warning' | 'error' | 'info' | 'success'

export interface ConfirmDialogOptions {
  title: DialogOptions['title']
  content: DialogOptions['content']
  positiveText: string
  negativeText: string
  type?: ConfirmDialogType
}

let globalDialogApi: DialogApi | null = null
let fallbackDialogApi: DialogApi | null = null

export function setGlobalDialogApi(api: DialogApi) {
  globalDialogApi = api
}

const getFallbackDialogApi = (): DialogApi => {
  if (!fallbackDialogApi) {
    fallbackDialogApi = createDiscreteApi(['dialog']).dialog
  }
  return fallbackDialogApi
}

const resolveDialogApi = (): DialogApi | null => {
  try {
    return useDialog()
  } catch {
    return null
  }
}

export function useConfirmDialog() {
  const contextDialog = resolveDialogApi()

  const getDialogApi = () => contextDialog ?? globalDialogApi ?? getFallbackDialogApi()

  const confirm = (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      let settled = false
      const settle = (value: boolean) => {
        if (settled) return
        settled = true
        resolve(value)
      }

      const dialog = getDialogApi()
      const createDialog = dialog[options.type ?? 'warning']

      createDialog({
        title: options.title,
        content: options.content,
        positiveText: options.positiveText,
        negativeText: options.negativeText,
        onPositiveClick: () => settle(true),
        onNegativeClick: () => settle(false),
        onClose: () => settle(false),
        onEsc: () => settle(false),
        onMaskClick: () => settle(false),
      })
    })
  }

  const warning = (options: Omit<ConfirmDialogOptions, 'type'>) =>
    confirm({ ...options, type: 'warning' })

  return {
    confirm,
    warning,
  }
}
