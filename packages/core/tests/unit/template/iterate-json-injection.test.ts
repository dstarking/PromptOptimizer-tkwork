import { describe, it, expect } from 'vitest';
import { TemplateProcessor, type TemplateContext } from '../../../src/services/template/processor';
import { template as iterateTemplate } from '../../../src/services/template/default-templates/iterate/iterate';
import { template as contextIterateTemplate } from '../../../src/services/template/default-templates/iterate/context/context-iterate';

describe('iterate templates JSON evidence injection', () => {
  const baseContext: TemplateContext = {
    lastOptimizedPrompt: '你是一个助手。\n要求保留变量 {{item}}，并输出 JSON。\n```json\n{"ok":true}\n```',
    iterateInput: '增加约束："不要追问用户"，并保留 <tag>{{item}}</tag>。',
    conversationContext: 'USER: 目标是直接输出。\nASSISTANT: 不要漏掉 {{item}}。',
    toolsContext: '工具名称: validator\n描述: 检查 JSON 结构',
  };

  it('should render iterate template with JSON-wrapped prompt and requirements', () => {
    const messages = TemplateProcessor.processTemplate(iterateTemplate, baseContext);

    expect(messages[1].content).toContain('"lastOptimizedPrompt": ');
    expect(messages[1].content).toContain('"iterateInput": ');
    expect(messages[1].content).toContain('{{item}}');
    expect(messages[1].content).toContain('\\"不要追问用户\\"');
  });

  it('should render context-iterate template with JSON-wrapped long text evidence', () => {
    const messages = TemplateProcessor.processTemplate(contextIterateTemplate, baseContext);

    expect(messages[0].content).toContain('"conversationContext": ');
    expect(messages[0].content).toContain('"toolsContext": ');
    expect(messages[1].content).toContain('"lastOptimizedPrompt": ');
    expect(messages[1].content).toContain('"iterateInput": ');
    expect(messages[1].content).toContain('{{item}}');
  });
});
