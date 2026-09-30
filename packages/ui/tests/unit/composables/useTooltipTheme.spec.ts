import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

vi.mock('naive-ui', () => ({
  useThemeVars: () => ref({
    popoverColor: '#ffffff',
    textColor2: '#4b5563',
    boxShadow1: '0 6px 16px rgba(0, 0, 0, 0.08)',
    boxShadow2: '0 12px 28px rgba(0, 0, 0, 0.16)',
    borderRadius: '8px',
    dividerColor: '#eef1f4',
  }),
}))

import {
  resolveTooltipDensity,
  useTooltipTheme,
} from '../../../src/composables/ui/useTooltipTheme'

describe('resolveTooltipDensity', () => {
  it('uses compact density for short plain labels', () => {
    expect(resolveTooltipDensity({ variant: 'auto', label: 'Prompt Garden' })).toBe('compact')
    expect(resolveTooltipDensity({ variant: 'auto', label: 'Workspace Tools' })).toBe('compact')
  })

  it('uses rich density for long labels, multiline labels, or slot content', () => {
    expect(resolveTooltipDensity({
      variant: 'auto',
      label: 'This tooltip explains a longer interaction in detail',
    })).toBe('rich')
    expect(resolveTooltipDensity({ variant: 'auto', label: 'Line one\nLine two' })).toBe('rich')
    expect(resolveTooltipDensity({ variant: 'auto', label: 'Short', hasContentSlot: true })).toBe('rich')
  })

  it('allows explicit density overrides', () => {
    expect(resolveTooltipDensity({ variant: 'rich', label: 'Short' })).toBe('rich')
    expect(resolveTooltipDensity({
      variant: 'compact',
      label: 'This tooltip explains a longer interaction in detail',
      hasContentSlot: true,
    })).toBe('compact')
  })
})

describe('useTooltipTheme', () => {
  it('returns lighter content styles for compact hints', () => {
    const { tooltipThemeOverrides, tooltipContentStyle } = useTooltipTheme({ density: 'compact' })

    expect(tooltipThemeOverrides.value.boxShadow).toBe('0 6px 16px rgba(0, 0, 0, 0.08)')
    expect(tooltipThemeOverrides.value.padding).toBe('4px 8px')
    expect(tooltipContentStyle.value).not.toHaveProperty('padding')
    expect(tooltipContentStyle.value.border).toBe('none')
    expect(tooltipContentStyle.value.whiteSpace).toBe('nowrap')
  })

  it('keeps richer content styles for explanatory tooltips', () => {
    const { tooltipThemeOverrides, tooltipContentStyle } = useTooltipTheme({ density: 'rich' })

    expect(tooltipThemeOverrides.value.boxShadow).toBe('0 12px 28px rgba(0, 0, 0, 0.16)')
    expect(tooltipThemeOverrides.value.padding).toBe('0')
    expect(tooltipContentStyle.value.padding).toBe('10px 12px')
    expect(tooltipContentStyle.value.border).toBe('1px solid #eef1f4')
    expect(tooltipContentStyle.value.whiteSpace).toBe('pre-wrap')
  })

  it('applies custom padding through tooltip theme overrides', () => {
    const { tooltipThemeOverrides } = useTooltipTheme({ density: 'compact', padding: 8 })

    expect(tooltipThemeOverrides.value.padding).toBe('8px')
  })

  it('applies custom rich padding through content styles', () => {
    const { tooltipThemeOverrides, tooltipContentStyle } = useTooltipTheme({ density: 'rich', padding: 8 })

    expect(tooltipThemeOverrides.value.padding).toBe('0')
    expect(tooltipContentStyle.value.padding).toBe('8px')
  })
})
