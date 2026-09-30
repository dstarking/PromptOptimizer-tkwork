import { createEvaluationRewriteTemplate } from './builders';

export const template = createEvaluationRewriteTemplate(
  {
    id: 'evaluation-rewrite-pro-variable',
    name: '变量提示词评估后智能改写',
    description: '基于评估结果重写当前工作区变量用户提示词',
    language: 'zh',
    tags: ['evaluation', 'rewrite', 'pro', 'variable'],
  },
  {
    subjectLabel: '变量用户提示词',
  }
);
