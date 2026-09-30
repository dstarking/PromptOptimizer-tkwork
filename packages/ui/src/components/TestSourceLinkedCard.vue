<template>
  <NCard
    v-bind="$attrs"
    class="test-source-linked-card"
    :class="feedbackClass"
    :style="linkedStyle"
    :data-source-tone="sourceTone"
    :data-feedback-tone="feedbackTone || undefined"
  >
    <span
      v-if="showFeedback"
      :key="feedbackRenderKey"
      class="test-source-linked-card__pulse"
      :class="pulseClass"
      aria-hidden="true"
    />
    <slot />
  </NCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, useThemeVars } from 'naive-ui'
import type { TestPanelVersionSourceTone } from '../utils/testPanelVersion'

defineOptions({
  inheritAttrs: false,
})

type FeedbackTone = 'change' | 'error'

const props = defineProps<{
  feedbackKey?: number
  feedbackTone?: FeedbackTone | null
  sourceTone?: TestPanelVersionSourceTone
}>()

const themeVars = useThemeVars()

const linkedColor = computed(() => {
  switch (props.sourceTone) {
    case 'workspace':
      return themeVars.value.primaryColor
    case 'previous':
      return themeVars.value.warningColor
    case 'version':
      return themeVars.value.infoColor
    case 'original':
    default:
      return themeVars.value.textColor3
  }
})

const linkedStyle = computed(() => ({
  '--test-source-linked-color': linkedColor.value,
}))

const feedbackClass = computed(() => ({
  'test-source-linked-card--feedback-change':
    props.feedbackTone === 'change' && !!props.feedbackKey,
  'test-source-linked-card--feedback-error':
    props.feedbackTone === 'error' && !!props.feedbackKey,
}))

const pulseClass = computed(() => ({
  'test-source-linked-card__pulse--change':
    props.feedbackTone === 'change' && !!props.feedbackKey,
  'test-source-linked-card__pulse--error':
    props.feedbackTone === 'error' && !!props.feedbackKey,
}))

const showFeedback = computed(() => !!props.feedbackKey && !!props.feedbackTone)

const feedbackRenderKey = computed(() =>
  `${props.sourceTone || 'original'}:${props.feedbackTone || 'idle'}:${props.feedbackKey || 0}`,
)
</script>

<style scoped>
.test-source-linked-card {
  position: relative;
}

.test-source-linked-card__pulse {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: inherit;
  opacity: 0;
  background: color-mix(in srgb, var(--test-source-linked-color) 12%, transparent);
  box-shadow: inset 0 0 0 1px var(--test-source-linked-color);
}

.test-source-linked-card__pulse--change {
  animation: test-source-linked-change-pulse 880ms ease-out;
}

.test-source-linked-card__pulse--error {
  animation: test-source-linked-error-pulse 920ms ease-out;
}

@keyframes test-source-linked-change-pulse {
  0% {
    opacity: 0;
    background: color-mix(in srgb, var(--test-source-linked-color) 6%, transparent);
    box-shadow: inset 0 0 0 1px var(--test-source-linked-color);
  }
  24% {
    opacity: 0.82;
    background: color-mix(in srgb, var(--test-source-linked-color) 16%, transparent);
    box-shadow:
      inset 0 0 0 2px var(--test-source-linked-color),
      0 0 0 5px color-mix(in srgb, var(--test-source-linked-color) 18%, transparent);
  }
  66% {
    opacity: 0.48;
    background: color-mix(in srgb, var(--test-source-linked-color) 10%, transparent);
  }
  100% {
    opacity: 0;
    background: color-mix(in srgb, var(--test-source-linked-color) 4%, transparent);
    box-shadow: inset 0 0 0 1px var(--test-source-linked-color);
  }
}

@keyframes test-source-linked-error-pulse {
  0% {
    opacity: 0;
    background: color-mix(in srgb, var(--test-source-linked-color) 8%, transparent);
    box-shadow: inset 0 0 0 1px var(--test-source-linked-color);
  }
  24% {
    opacity: 0.9;
    background: color-mix(in srgb, var(--test-source-linked-color) 18%, transparent);
    box-shadow:
      inset 0 0 0 2px var(--test-source-linked-color),
      0 0 0 6px color-mix(in srgb, var(--test-source-linked-color) 22%, transparent);
  }
  62% {
    opacity: 0.52;
    background: color-mix(in srgb, var(--test-source-linked-color) 12%, transparent);
  }
  100% {
    opacity: 0;
    background: color-mix(in srgb, var(--test-source-linked-color) 5%, transparent);
    box-shadow: inset 0 0 0 1px var(--test-source-linked-color);
  }
}
</style>
