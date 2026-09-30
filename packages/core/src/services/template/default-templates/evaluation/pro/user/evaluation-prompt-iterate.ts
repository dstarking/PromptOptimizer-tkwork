import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-pro-variable-prompt-iterate',
    name: '变量提示词迭代评估',
    description: '基于迭代要求评估变量提示词',
    language: 'zh',
    tags: ['evaluation', 'prompt-iterate', 'pro', 'user', 'variable'],
  },
  {
    subjectLabel: '变量提示词',
    roleName: '变量提示词迭代分析专家',
  },
  true
);
