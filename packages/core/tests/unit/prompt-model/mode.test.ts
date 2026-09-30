import { describe, expect, it } from 'vitest'

import {
  createPromptContract,
  promptModeKeyToFavoriteMode,
  resolvePromptModeKey,
} from '../../../src/services/prompt-model'

describe('prompt-model mode mapping', () => {
  it('maps basic legacy modes to standard mode keys', () => {
    expect(resolvePromptModeKey({ functionMode: 'basic', optimizationMode: 'system' }))
      .toBe('basic-system')
    expect(resolvePromptModeKey({ functionMode: 'basic', optimizationMode: 'user' }))
      .toBe('basic-user')
  })

  it('maps legacy context modes to pro sub modes', () => {
    expect(resolvePromptModeKey({ functionMode: 'context', optimizationMode: 'user' }))
      .toBe('pro-variable')
    expect(resolvePromptModeKey({ functionMode: 'context', optimizationMode: 'system' }))
      .toBe('pro-conversation')
  })

  it('maps current pro sub modes to standard mode keys', () => {
    expect(resolvePromptModeKey({ functionMode: 'pro', proSubMode: 'variable' }))
      .toBe('pro-variable')
    expect(resolvePromptModeKey({ functionMode: 'pro', proSubMode: 'multi' }))
      .toBe('pro-conversation')
    expect(resolvePromptModeKey({ functionMode: 'pro', subMode: 'conversation' }))
      .toBe('pro-conversation')
  })

  it('maps image sub modes to standard mode keys', () => {
    expect(resolvePromptModeKey({ functionMode: 'image', imageSubMode: 'text2image' }))
      .toBe('image-text2image')
    expect(resolvePromptModeKey({ functionMode: 'image', imageSubMode: 'image2image' }))
      .toBe('image-image2image')
    expect(resolvePromptModeKey({ functionMode: 'image', imageSubMode: 'multiimage' }))
      .toBe('image-multiimage')
  })

  it('maps standard mode keys back to current favorite compatibility modes', () => {
    expect(promptModeKeyToFavoriteMode('pro-variable')).toEqual({
      functionMode: 'context',
      optimizationMode: 'user',
    })
    expect(promptModeKeyToFavoriteMode('pro-conversation')).toEqual({
      functionMode: 'context',
      optimizationMode: 'system',
    })
    expect(promptModeKeyToFavoriteMode('image-multiimage')).toEqual({
      functionMode: 'image',
      imageSubMode: 'multiimage',
    })
  })

  it('creates discriminated prompt contracts', () => {
    expect(createPromptContract('basic-user')).toMatchObject({
      family: 'basic',
      subMode: 'user',
      modeKey: 'basic-user',
    })
    expect(createPromptContract('pro-conversation')).toMatchObject({
      family: 'pro',
      subMode: 'conversation',
      modeKey: 'pro-conversation',
    })
  })
})
