import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-pro-variable-prompt-only',
    name: '变量提示词直接评估',
    description: '直接评估变量提示词质量',
    language: 'zh',
    tags: ['evaluation', 'prompt-only', 'pro', 'user', 'variable'],
  },
  {
    subjectLabel: '变量提示词',
    roleName: '变量提示词分析专家',
  }
);
