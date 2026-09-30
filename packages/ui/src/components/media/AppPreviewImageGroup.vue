<template>
  <NImageGroup
    v-bind="attrs"
    :show-toolbar="showToolbar"
    :show-toolbar-tooltip="showToolbarTooltip"
    :render-toolbar="safeRenderToolbar"
  >
    <slot />
  </NImageGroup>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

import { NImageGroup } from 'naive-ui'
import useConfig from 'naive-ui/es/_mixins/use-config'
import type { ImageGroupRenderToolbar } from 'naive-ui/es/image/src/public-types'
import { useI18n } from 'vue-i18n'

import { createSafeImageToolbarRenderer, resolveActivePreviewImageSource } from './safe-preview-toolbar'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    showToolbar?: boolean
    showToolbarTooltip?: boolean
    renderToolbar?: ImageGroupRenderToolbar
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
    includeNavigation: true,
    userRenderToolbar: props.renderToolbar,
    resolveDownloadSource: () => resolveActivePreviewImageSource(mergedClsPrefixRef.value),
    resolveDownloadFilename: () => props.downloadFilename,
  }),
)
</script>
