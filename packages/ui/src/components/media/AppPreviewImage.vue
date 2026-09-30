<template>
  <NImage
    v-bind="attrs"
    :src="src"
    :preview-src="previewSrc"
    :preview-disabled="previewDisabled"
    :show-toolbar="showToolbar"
    :show-toolbar-tooltip="showToolbarTooltip"
    :render-toolbar="safeRenderToolbar"
  >
    <template v-if="$slots.placeholder" #placeholder>
      <slot name="placeholder" />
    </template>
    <template v-if="$slots.error" #error>
      <slot name="error" />
    </template>
  </NImage>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

import { NImage } from 'naive-ui'
import useConfig from 'naive-ui/es/_mixins/use-config'
import type { ImageRenderToolbar } from 'naive-ui/es/image/src/public-types'
import { useI18n } from 'vue-i18n'

import { createSafeImageToolbarRenderer, resolveActivePreviewImageSource } from './safe-preview-toolbar'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    src?: string
    previewSrc?: string
    previewDisabled?: boolean
    showToolbar?: boolean
    showToolbarTooltip?: boolean
    renderToolbar?: ImageRenderToolbar
    downloadFilename?: string
  }>(),
  {
    showToolbar: true,
  },
)

const attrs = useAttrs()
const { t } = useI18n()
const { mergedClsPrefixRef } = useConfig(props)

const safeRenderToolbar = computed(() =>
  createSafeImageToolbarRenderer({
    clsPrefixRef: mergedClsPrefixRef,
    showToolbarTooltip: Boolean(props.showToolbarTooltip),
    downloadLabel: t('common.download'),
    includeNavigation: false,
    userRenderToolbar: props.renderToolbar,
    resolveDownloadSource: () =>
      resolveActivePreviewImageSource(mergedClsPrefixRef.value) || props.previewSrc || props.src || null,
    resolveDownloadFilename: () => props.downloadFilename,
  }),
)
</script>
