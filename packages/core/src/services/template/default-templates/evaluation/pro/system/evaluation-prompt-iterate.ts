import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-pro-multi-prompt-iterate',
    name: '上下文消息迭代评估',
    description: '基于迭代要求评估上下文消息提示词',
    language: 'zh',
    tags: ['evaluation', 'prompt-iterate', 'pro', 'system', 'multi'],
  },
  {
    subjectLabel: '上下文消息提示词',
    roleName: '上下文消息迭代分析专家',
  },
  true
);
