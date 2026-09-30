import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-basic-user-prompt-iterate',
    name: '用户提示词迭代评估',
    description: '基于迭代要求评估用户提示词',
    language: 'zh',
    tags: ['evaluation', 'prompt-iterate', 'basic', 'user'],
  },
  {
    subjectLabel: '用户提示词',
    roleName: '用户提示词迭代分析专家',
  },
  true
);
