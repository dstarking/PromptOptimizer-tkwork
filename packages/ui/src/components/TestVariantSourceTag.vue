<template>
  <NTag
    :key="feedbackRenderKey"
    size="small"
    :type="tagType"
    :bordered="false"
    class="test-variant-source-tag"
    :class="feedbackClass"
    :title="sourceLabel"
    :data-source-tone="sourceTone"
    :data-feedback-tone="feedbackTone || undefined"
    role="button"
    tabindex="0"
    @click="emit('activate')"
    @keydown.enter.prevent="emit('activate')"
    @keydown.space.prevent="emit('activate')"
  >
    {{ sourceLabel }}
  </NTag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NTag } from 'naive-ui'
import {
  formatTestPanelVariantSourceLabel,
  getTestPanelVersionSourceTone,
  type DynamicTestPanelVersionValue,
  type TestPanelVersionLabels,
  type TestPanelVersionSourceTone,
} from '../utils/testPanelVersion'

type FeedbackTone = 'change' | 'error'
type TagType = 'default' | 'primary' | 'info' | 'warning' | 'error'

const props = defineProps<{
  variantLabel: string
  selection: DynamicTestPanelVersionValue
  resolvedVersion: number
  labels: TestPanelVersionLabels
  feedbackKey?: number
  feedbackTone?: FeedbackTone | null
}>()

const emit = defineEmits<{
  activate: []
}>()

const sourceTone = computed<TestPanelVersionSourceTone>(() =>
  getTestPanelVersionSourceTone(props.selection, props.resolvedVersion),
)

const sourceLabel = computed(() =>
  formatTestPanelVariantSourceLabel(
    props.variantLabel,
    props.selection,
    props.resolvedVersion,
    props.labels,
  ),
)

const sourceTagType = computed<TagType>(() => {
  switch (sourceTone.value) {
    case 'workspace':
      return 'primary'
    case 'previous':
      return 'warning'
    case 'version':
      return 'info'
    case 'original':
    default:
      return 'default'
  }
})

const tagType = computed<TagType>(() =>
  props.feedbackTone === 'error' ? 'error' : sourceTagType.value,
)

const feedbackClass = computed(() => ({
  'test-variant-source-tag--feedback-change':
    props.feedbackTone === 'change' && !!props.feedbackKey,
  'test-variant-source-tag--feedback-error':
    props.feedbackTone === 'error' && !!props.feedbackKey,
}))

const feedbackRenderKey = computed(() =>
  `${props.selection}:${props.resolvedVersion}:${props.feedbackTone || 'idle'}:${props.feedbackKey || 0}`,
)
</script>

<style scoped>
.test-variant-source-tag {
  max-width: 132px;
  flex-shrink: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    filter 0.16s ease,
    box-shadow 0.16s ease;
}

.test-variant-source-tag--feedback-change {
  animation: test-source-change-pulse 780ms ease-out;
}

.test-variant-source-tag--feedback-error {
  animation: test-source-error-pulse 860ms ease-out;
}

@keyframes test-source-change-pulse {
  0% {
    transform: scale(1);
    filter: brightness(1) saturate(1);
    box-shadow: 0 0 0 0 currentColor;
  }
  24% {
    transform: scale(1.07);
    filter: brightness(1.08) saturate(1.35);
    box-shadow:
      0 0 0 2px currentColor,
      0 0 0 6px color-mix(in srgb, currentColor 18%, transparent);
  }
  62% {
    transform: scale(1.03);
    filter: brightness(1.04) saturate(1.18);
    box-shadow:
      0 0 0 1px currentColor,
      0 0 0 4px color-mix(in srgb, currentColor 12%, transparent);
  }
  100% {
    transform: scale(1);
    filter: brightness(1) saturate(1);
    box-shadow: 0 0 0 0 currentColor;
  }
}

@keyframes test-source-error-pulse {
  0% {
    transform: translateX(0);
    filter: brightness(1) saturate(1);
    box-shadow: 0 0 0 0 currentColor;
  }
  20% {
    transform: translateX(-2px);
    filter: brightness(1.1) saturate(1.35);
  }
  40% {
    transform: translateX(2px);
    filter: brightness(1.1) saturate(1.4);
    box-shadow:
      0 0 0 2px currentColor,
      0 0 0 6px color-mix(in srgb, currentColor 20%, transparent);
  }
  60% {
    transform: translateX(-1px);
    box-shadow:
      0 0 0 1px currentColor,
      0 0 0 4px color-mix(in srgb, currentColor 12%, transparent);
  }
  100% {
    transform: translateX(0);
    filter: brightness(1) saturate(1);
    box-shadow: 0 0 0 0 currentColor;
  }
}
</style>
