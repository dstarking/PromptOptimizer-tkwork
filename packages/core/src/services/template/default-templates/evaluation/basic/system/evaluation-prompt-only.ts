import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-basic-system-prompt-only',
    name: '系统提示词直接评估',
    description: '直接评估系统提示词质量',
    language: 'zh',
    tags: ['evaluation', 'prompt-only', 'basic', 'system'],
  },
  {
    subjectLabel: '系统提示词',
    roleName: '系统提示词分析专家',
  }
);
