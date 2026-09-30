<template>
  <NTooltip
    v-bind="$attrs"
    :trigger="trigger"
    :placement="placement"
    :disabled="disabled"
    :show-arrow="resolvedShowArrow"
    :to="to"
    :flip="flip"
    :keep-alive-on-hover="keepAliveOnHover"
    :theme-overrides="tooltipThemeOverrides"
    :overlay-style="mergedOverlayStyle"
    :content-style="mergedContentStyle"
  >
    <template #trigger>
      <slot />
    </template>
    <slot name="content">{{ label }}</slot>
  </NTooltip>
</template>

<script setup lang="ts">
import { computed, useSlots, type CSSProperties } from 'vue'
import { NTooltip, type TooltipProps } from 'naive-ui'

import {
  resolveTooltipDensity,
  useTooltipTheme,
  type TooltipVariant,
} from '../../composables/ui/useTooltipTheme'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  label?: string
  variant?: TooltipVariant
  trigger?: TooltipProps['trigger']
  placement?: TooltipProps['placement']
  disabled?: boolean
  showArrow?: boolean
  to?: TooltipProps['to']
  flip?: boolean
  keepAliveOnHover?: boolean
  maxWidth?: CSSProperties['maxWidth']
  maxHeight?: CSSProperties['maxHeight']
  whiteSpace?: CSSProperties['whiteSpace']
  wordBreak?: CSSProperties['wordBreak']
  overflowWrap?: CSSProperties['overflowWrap']
  padding?: CSSProperties['padding']
  overflowY?: CSSProperties['overflowY']
  overlayStyle?: CSSProperties
  contentStyle?: CSSProperties
}>(), {
  variant: 'auto',
  trigger: 'hover',
  placement: 'top',
  disabled: false,
})

const slots = useSlots()

const resolvedDensity = computed(() => resolveTooltipDensity({
  variant: props.variant,
  label: props.label,
  hasContentSlot: Boolean(slots.content),
}))

const resolvedShowArrow = computed(() => props.showArrow ?? (resolvedDensity.value === 'rich'))

const {
  tooltipThemeOverrides,
  tooltipOverlayStyle,
  tooltipContentStyle,
} = useTooltipTheme({
  density: resolvedDensity,
  maxWidth: props.maxWidth,
  maxHeight: props.maxHeight,
  whiteSpace: props.whiteSpace,
  wordBreak: props.wordBreak,
  overflowWrap: props.overflowWrap,
  padding: props.padding,
  overflowY: props.overflowY,
})

const mergedOverlayStyle = computed<CSSProperties>(() => ({
  ...tooltipOverlayStyle.value,
  ...props.overlayStyle,
}))

const mergedContentStyle = computed<CSSProperties>(() => ({
  ...tooltipContentStyle.value,
  ...props.contentStyle,
}))
</script>
