import { describe, it, expect } from 'vitest';
import { TemplateProcessor, type TemplateContext } from '../../../src/services/template/processor';
import { template as imageJsonStructuredOptimizeZh } from '../../../src/services/template/default-templates/image-optimize/text2image/json-structured-optimize';
import { template as imageJsonStructuredOptimizeEn } from '../../../src/services/template/default-templates/image-optimize/text2image/json-structured-optimize_en';

describe('image json-structured optimize templates JSON evidence injection', () => {
  const baseContext: TemplateContext = {
    originalPrompt: '保留 {{subject_name}} 和 {{style_hint}}。\n```json\n{"negative_prompt":["crowded"]}\n```',
  };

  it.each([
    ['zh', imageJsonStructuredOptimizeZh],
    ['en', imageJsonStructuredOptimizeEn],
  ])('should render %s image json-structured optimize template with JSON-wrapped original prompt evidence', (_label, template) => {
    const messages = TemplateProcessor.processTemplate(template, baseContext);

    expect(messages[1].content).toContain('"originalPrompt": ');
    expect(messages[1].content).toContain('{{subject_name}}');
    expect(messages[1].content).toContain('{{style_hint}}');
    expect(messages[1].content).toContain('\\"negative_prompt\\"');
  });
});
