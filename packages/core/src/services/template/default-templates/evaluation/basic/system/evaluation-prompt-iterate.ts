import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-basic-system-prompt-iterate',
    name: '系统提示词迭代评估',
    description: '基于迭代要求评估系统提示词',
    language: 'zh',
    tags: ['evaluation', 'prompt-iterate', 'basic', 'system'],
  },
  {
    subjectLabel: '系统提示词',
    roleName: '系统提示词迭代分析专家',
  },
  true
);
