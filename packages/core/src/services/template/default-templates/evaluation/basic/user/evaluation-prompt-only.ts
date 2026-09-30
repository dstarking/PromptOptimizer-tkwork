import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-basic-user-prompt-only',
    name: '用户提示词直接评估',
    description: '直接评估用户提示词质量',
    language: 'zh',
    tags: ['evaluation', 'prompt-only', 'basic', 'user'],
  },
  {
    subjectLabel: '用户提示词',
    roleName: '用户提示词分析专家',
  }
);
