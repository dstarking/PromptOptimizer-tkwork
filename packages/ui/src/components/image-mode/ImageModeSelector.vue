<template>
  <NButtonGroup>
    <NButton
      data-testid="image-sub-mode-text2image"
      :type="modelValue === 'text2image' ? 'primary' : 'default'"
      size="small"
      @click="handleModeChange('text2image')"
      :disabled="disabled"
    >
      {{ t('imageMode.text2image') }}
    </NButton>
    <NButton
      data-testid="image-sub-mode-image2image"
      :type="modelValue === 'image2image' ? 'primary' : 'default'"
      size="small"
      @click="handleModeChange('image2image')"
      :disabled="disabled"
    >
      {{ t('imageMode.image2image') }}
    </NButton>
    <NButton
      data-testid="image-sub-mode-multiimage"
      :type="modelValue === 'multiimage' ? 'primary' : 'default'"
      size="small"
      @click="handleModeChange('multiimage')"
      :disabled="disabled"
    >
      {{ t('imageMode.multiimage') }}
    </NButton>
  </NButtonGroup>
</template>

<script setup lang="ts">
import { NButtonGroup, NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'

export type ImageMode = 'text2image' | 'image2image' | 'multiimage'

interface Props {
  modelValue: ImageMode
  disabled?: boolean
  allowReselect?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: ImageMode): void
  (e: 'change', value: ImageMode): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  allowReselect: false,
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const handleModeChange = (mode: ImageMode) => {
  if (props.disabled) return
  if (props.modelValue === mode && !props.allowReselect) return

  emit('update:modelValue', mode)
  emit('change', mode)
}
</script>
