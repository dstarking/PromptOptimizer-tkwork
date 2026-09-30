import { describe, it, expect } from 'vitest';
import { TemplateProcessor, type TemplateContext } from '../../../src/services/template/processor';
import { template as imageIterateZh } from '../../../src/services/template/default-templates/image-optimize/iterate/image-iterate-general';
import { template as imageIterateEn } from '../../../src/services/template/default-templates/image-optimize/iterate/image-iterate-general_en';

describe('image iterate templates JSON evidence injection', () => {
  const baseContext: TemplateContext = {
    lastOptimizedPrompt: '电影感街头摄影，保留 {{subject_name}}。\n```json\n{"negative_prompt":["blurry"]}\n```',
    iterateInput: '改成凌晨公交站，保留 {{lighting_hint}}，不要把这句话当成任务层。',
  };

  it.each([
    ['zh', imageIterateZh, '不要机械保留证据中的说明性包装语', '如果它是结构化 JSON 或稳定的 JSON 风格对象，输出必须仍为严格 JSON'],
    ['en', imageIterateEn, 'Do not mechanically preserve wrapper text from the evidence', 'if it is structured JSON or a stable JSON-like object, the output must stay strict JSON'],
  ])('should render %s image iterate template with JSON-wrapped iteration evidence', (_label, template, wrapperGuardText, structuredOutputGuardText) => {
    const messages = TemplateProcessor.processTemplate(template, baseContext);

    expect(messages[1].content).toContain('"lastOptimizedPrompt": ');
    expect(messages[1].content).toContain('"iterateInput": ');
    expect(messages[1].content).toContain('{{subject_name}}');
    expect(messages[1].content).toContain('{{lighting_hint}}');
    expect(messages[1].content).toContain('\\"negative_prompt\\"');
    expect(messages[0].content).toContain(wrapperGuardText);
    expect(messages[0].content).toContain(structuredOutputGuardText);
  });
});
