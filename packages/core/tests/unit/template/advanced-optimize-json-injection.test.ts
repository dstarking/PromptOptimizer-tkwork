import { describe, it, expect } from 'vitest';
import { TemplateProcessor, type TemplateContext } from '../../../src/services/template/processor';
import { template as analyticalOptimizeZh } from '../../../src/services/template/default-templates/optimize/analytical-optimize';
import { template as contextMessageOptimizeZh } from '../../../src/services/template/default-templates/optimize/context/context-message-optimize';
import { template as contextAnalyticalOptimizeZh } from '../../../src/services/template/default-templates/optimize/context/context-analytical-optimize';
import { template as contextOutputFormatOptimizeZh } from '../../../src/services/template/default-templates/optimize/context/context-output-format-optimize';
import { template as contextMessageOptimizeEn } from '../../../src/services/template/default-templates/optimize/context/context-message-optimize_en';
import { template as contextAnalyticalOptimizeEn } from '../../../src/services/template/default-templates/optimize/context/context-analytical-optimize_en';
import { template as contextOutputFormatOptimizeEn } from '../../../src/services/template/default-templates/optimize/context/context-output-format-optimize_en';

describe('advanced optimize templates JSON evidence injection', () => {
  it('should render analytical-optimize with original prompt wrapped as JSON evidence', () => {
    const messages = TemplateProcessor.processTemplate(
      analyticalOptimizeZh,
      {
        originalPrompt: '保留变量 {{draft_text}}，并保留 JSON:\n```json\n{"tone":"direct"}\n```',
      },
    );

    expect(messages[1].content).toContain('"originalPrompt": ');
    expect(messages[1].content).toContain('"保留变量 {{draft_text}}，并保留 JSON:\\n```json\\n{\\"tone\\":\\"direct\\"}\\n```"');
  });

  const baseContext: TemplateContext = {
    conversationMessages: [
      {
        index: 1,
        roleLabel: 'SYSTEM',
        isSelected: false,
        content: '你是一个直接指出问题的助手。',
      },
      {
        index: 2,
        roleLabel: 'USER',
        isSelected: true,
        content: '请帮我判断 {{focus_area}} 是否有问题：\n```ts\nconst value = "demo"\n```',
      },
    ],
    selectedMessage: {
      index: 2,
      roleLabel: 'USER',
      content: '请帮我判断 {{focus_area}} 是否有问题：\n```ts\nconst value = "demo"\n```',
      contentTooLong: false,
    },
    toolsContext: '工具名称: validator\n描述: 校验 JSON "schema"',
  };

  it.each([
    ['zh-general', contextMessageOptimizeZh],
    ['zh-analytical', contextAnalyticalOptimizeZh],
    ['zh-format', contextOutputFormatOptimizeZh],
    ['en-general', contextMessageOptimizeEn],
    ['en-analytical', contextAnalyticalOptimizeEn],
    ['en-format', contextOutputFormatOptimizeEn],
  ])('should render %s context optimize template with JSON-wrapped evidence strings', (_label, template) => {
    const messages = TemplateProcessor.processTemplate(template, baseContext);

    expect(messages[1].content).toContain('"content": ');
    expect(messages[1].content).toContain('{{focus_area}}');
    expect(messages[1].content).toContain('\\"demo\\"');
    expect(messages[1].content).toContain('"toolsContext": ');
    expect(messages[1].content).toContain('schema');
  });
});
