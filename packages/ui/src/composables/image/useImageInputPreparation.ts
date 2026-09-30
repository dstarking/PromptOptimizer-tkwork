import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '../ui/useToast'
import { useConfirmDialog } from '../ui/useConfirmDialog'
import {
  ImagePreparationError,
  fileToImageInputRef,
  formatImageBytes,
  formatImageDimensions,
  prepareImageFiles,
  type ImageCompressionResult,
} from '../../utils/image-compression'

export function useImageInputPreparation() {
  const { t } = useI18n()
  const toast = useToast()
  const confirmDialog = useConfirmDialog()

  const confirmMaterialChange = async (results: readonly ImageCompressionResult[]) => {
    const details = results.map((result) => t('imageWorkspace.upload.confirmItem', {
      name: result.file.name,
      beforeSize: formatImageBytes(result.originalBytes),
      afterSize: formatImageBytes(result.outputBytes),
      beforeDimensions: formatImageDimensions(result.originalWidth, result.originalHeight),
      afterDimensions: formatImageDimensions(result.outputWidth, result.outputHeight),
    })).join('\n')

    return await confirmDialog.warning({
      title: t('imageWorkspace.upload.confirmTitle'),
      content: () => h('div', { style: 'white-space: pre-line' },
        `${t('imageWorkspace.upload.confirmDescription', { count: results.length })}\n\n${details}`),
      positiveText: t('imageWorkspace.upload.confirmAction'),
      negativeText: t('common.cancel'),
    })
  }

  const prepareFiles = async (files: readonly File[]): Promise<ImageCompressionResult[] | null> => {
    if (files.length === 0) return []

    try {
      const results = await prepareImageFiles(files, confirmMaterialChange)
      if (!results) return null

      const changed = results.filter((result) => result.compressed)
      if (changed.length === 1) {
        const result = changed[0]
        toast.success(t('imageWorkspace.upload.preparedSuccess', {
          before: formatImageBytes(result.originalBytes),
          after: formatImageBytes(result.outputBytes),
        }))
      } else if (changed.length > 1) {
        toast.success(t('imageWorkspace.upload.preparedBatchSuccess', { count: changed.length }))
      } else {
        toast.success(t('imageWorkspace.upload.uploadSuccess'))
      }

      return results
    } catch (error) {
      console.error('[useImageInputPreparation] Failed to prepare image input:', error)
      if (error instanceof ImagePreparationError) {
        if (error.code === 'unsupported-type') {
          toast.error(t('imageWorkspace.upload.fileTypeNotSupported'))
        } else if (error.code === 'source-too-large') {
          toast.error(t('imageWorkspace.upload.fileTooLarge'))
        } else {
          toast.error(t('imageWorkspace.upload.processingFailed'))
        }
      } else {
        toast.error(t('imageWorkspace.upload.processingFailed'))
      }
      return null
    }
  }

  const prepareInputRefs = async (files: readonly File[]) => {
    const results = await prepareFiles(files)
    if (!results) return null
    return await Promise.all(results.map((result) => fileToImageInputRef(result.file)))
  }

  return {
    prepareFiles,
    prepareInputRefs,
  }
}
