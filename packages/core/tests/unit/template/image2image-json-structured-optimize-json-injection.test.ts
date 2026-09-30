import { describe, it, expect } from 'vitest';
import { TemplateProcessor, type TemplateContext } from '../../../src/services/template/processor';
import { template as image2imageJsonStructuredOptimizeZh } from '../../../src/services/template/default-templates/image-optimize/image2image/json-structured-optimize';
import { template as image2imageJsonStructuredOptimizeEn } from '../../../src/services/template/default-templates/image-optimize/image2image/json-structured-optimize_en';

describe('image2image json-structured optimize templates JSON evidence injection', () => {
  const baseContext: TemplateContext = {
    originalPrompt: '保留 {{subject_name}} 和 {{style_hint}}。\n```json\n{"negative_prompt":["cartoon"],"strength":0.45}\n```',
  };

  it.each([
    ['zh', image2imageJsonStructuredOptimizeZh],
    ['en', image2imageJsonStructuredOptimizeEn],
  ])('should render %s image2image json-structured optimize template with JSON-wrapped original prompt evidence', (_label, template) => {
    const messages = TemplateProcessor.processTemplate(template, baseContext);

    expect(messages[1].content).toContain('"originalPrompt": ');
    expect(messages[1].content).toContain('{{subject_name}}');
    expect(messages[1].content).toContain('{{style_hint}}');
    expect(messages[1].content).toContain('\\"negative_prompt\\"');
    expect(messages[1].content).toContain('0.45');
  });
});
