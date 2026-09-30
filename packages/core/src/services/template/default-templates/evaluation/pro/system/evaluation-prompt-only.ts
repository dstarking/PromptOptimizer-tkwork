import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-pro-multi-prompt-only',
    name: '上下文消息直接评估',
    description: '直接评估上下文消息提示词质量',
    language: 'zh',
    tags: ['evaluation', 'prompt-only', 'pro', 'system', 'multi'],
  },
  {
    subjectLabel: '上下文消息提示词',
    roleName: '上下文消息分析专家',
  }
);
