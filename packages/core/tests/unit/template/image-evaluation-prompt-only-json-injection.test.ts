import { describe, it, expect } from 'vitest';
import { TemplateProcessor, type TemplateContext } from '../../../src/services/template/processor';
import { template as text2imagePromptOnlyZh } from '../../../src/services/template/default-templates/evaluation/image/text2image/evaluation-prompt-only';
import { template as text2imagePromptOnlyEn } from '../../../src/services/template/default-templates/evaluation/image/text2image/evaluation-prompt-only_en';
import { template as image2imagePromptOnlyZh } from '../../../src/services/template/default-templates/evaluation/image/image2image/evaluation-prompt-only';
import { template as image2imagePromptOnlyEn } from '../../../src/services/template/default-templates/evaluation/image/image2image/evaluation-prompt-only_en';
import { template as multiimagePromptOnlyZh } from '../../../src/services/template/default-templates/evaluation/image/multiimage/evaluation-prompt-only';
import { template as multiimagePromptOnlyEn } from '../../../src/services/template/default-templates/evaluation/image/multiimage/evaluation-prompt-only_en';

describe('image evaluation prompt-only templates JSON evidence injection', () => {
  const baseContext: TemplateContext = {
    workspacePrompt: '工作区提示词含 {{style_hint}}。\n## Notes\n- keep cinematic realism',
    referencePrompt: '原始提示词含 {{subject_name}}。\n```json\n{"negative_prompt":["crowded"]}\n```',
    hasReferencePrompt: true,
    hasDesignContext: true,
    designContextLabel: '生成意图',
    designContextSummary: '优先突出主体与氛围',
    designContextContent: '用户想要 {{subject_name}} 在夕阳海边，避免过度拥挤。',
    hasFocus: true,
    focusBrief: '优先修正主体清晰度，不要输出代码块；保持 {{subject_name}}。',
  };

  it.each([
    ['zh-text2image', text2imagePromptOnlyZh],
    ['en-text2image', text2imagePromptOnlyEn],
    ['zh-image2image', image2imagePromptOnlyZh],
    ['en-image2image', image2imagePromptOnlyEn],
    ['zh-multiimage', multiimagePromptOnlyZh],
    ['en-multiimage', multiimagePromptOnlyEn],
  ])('should render %s image evaluation prompt-only template with JSON-wrapped evidence', (_label, template) => {
    const messages = TemplateProcessor.processTemplate(template, baseContext);

    expect(messages[1].content).toContain('"workspacePrompt": ');
    expect(messages[1].content).toContain('"referencePrompt": ');
    expect(messages[1].content).toContain('"designContext": ');
    expect(messages[1].content).toContain('"focusBrief": ');
    expect(messages[1].content).toContain('{{subject_name}}');
    expect(messages[1].content).toContain('{{style_hint}}');
    expect(messages[1].content).toContain('\\"negative_prompt\\"');
  });
});
