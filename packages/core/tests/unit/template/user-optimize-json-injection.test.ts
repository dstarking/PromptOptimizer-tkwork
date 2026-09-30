import { describe, it, expect } from 'vitest';
import { TemplateProcessor, type TemplateContext } from '../../../src/services/template/processor';
import { user_prompt_professional } from '../../../src/services/template/default-templates/user-optimize/user-prompt-professional';
import { template as contextUserPromptProfessional } from '../../../src/services/template/default-templates/user-optimize/context/context-user-prompt-professional';

describe('user optimize templates JSON evidence injection', () => {
  const baseContext: TemplateContext = {
    originalPrompt: '帮我回一条消息，商品是 {{item}}，预算是 "1000"。\n请保留 Markdown:\n```md\n# title\n```',
    conversationContext: 'USER: 预算不能超。\nASSISTANT: 语气要坚定。',
    toolsContext: '工具名称: search\n描述: 查行情'
  };

  it('should render user-prompt-professional with original prompt as JSON string evidence', () => {
    const messages = TemplateProcessor.processTemplate(
      user_prompt_professional,
      baseContext,
    );

    expect(messages[1].content).toContain('"originalPrompt": ');
    expect(messages[1].content).toContain('"帮我回一条消息，商品是 {{item}}，预算是 \\"1000\\"。\\n请保留 Markdown:\\n```md\\n# title\\n```"');
  });

  it('should render context-user-prompt-professional with JSON-wrapped evidence blocks', () => {
    const messages = TemplateProcessor.processTemplate(
      contextUserPromptProfessional,
      baseContext,
    );

    expect(messages[0].content).toContain('"conversationContext": ');
    expect(messages[0].content).toContain('"toolsContext": ');
    expect(messages[1].content).toContain('"originalPrompt": ');
    expect(messages[1].content).toContain('{{item}}');
  });
});
