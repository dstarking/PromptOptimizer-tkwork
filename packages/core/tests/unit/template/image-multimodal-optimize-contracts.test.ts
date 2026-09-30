import { describe, expect, it } from 'vitest'

import { TemplateProcessor, type TemplateContext } from '../../../src/services/template/processor'
import { template as image2imageOptimizeZh } from '../../../src/services/template/default-templates/image-optimize/image2image/image2image-optimize'
import { template as designTextEditOptimizeZh } from '../../../src/services/template/default-templates/image-optimize/image2image/design-text-edit-optimize'
import { template as image2imageJsonZh } from '../../../src/services/template/default-templates/image-optimize/image2image/json-structured-optimize'
import { template as multiimageOptimizeZh } from '../../../src/services/template/default-templates/image-optimize/multiimage/multiimage-optimize'

describe('image multimodal optimize template contracts', () => {
  const context: TemplateContext = {
    originalPrompt: '保留图1中的人物，把他融合到图2的海边场景中',
    hasInputImages: true,
    inputImageCount: 2,
    inputImagesJson: '[{"index":1,"label":"图1","mimeType":"image/png"},{"index":2,"label":"图2","mimeType":"image/jpeg"}]',
  }

  it.each([
    ['image2image-general-zh', image2imageOptimizeZh],
    ['image2image-design-text-zh', designTextEditOptimizeZh],
    ['image2image-json-zh', image2imageJsonZh],
  ])('declares attached image semantics for %s', (_label, template) => {
    const messages = TemplateProcessor.processTemplate(template, context)
    const combined = messages.map((message) => message.content).join('\n')

    expect(combined).toContain('图片')
    expect(combined).not.toContain('"b64"')
    expect(combined).not.toContain('{{inputImagesJson}}')
  })

  it('declares numbered attached image semantics for multiimage template', () => {
    const messages = TemplateProcessor.processTemplate(multiimageOptimizeZh, context)
    const combined = messages.map((message) => message.content).join('\n')

    expect(combined).toContain('图1')
    expect(combined).toContain('图2')
    expect(combined).toContain('图片')
    expect(combined).not.toContain('"b64"')
    expect(combined).not.toContain('{{inputImagesJson}}')
  })
})
