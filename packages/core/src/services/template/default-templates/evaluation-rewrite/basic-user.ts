import { createEvaluationRewriteTemplate } from './builders';

export const template = createEvaluationRewriteTemplate(
  {
    id: 'evaluation-rewrite-basic-user',
    name: '用户提示词评估后智能改写',
    description: '基于评估结果重写当前工作区用户提示词',
    language: 'zh',
    tags: ['evaluation', 'rewrite', 'basic', 'user'],
  },
  {
    subjectLabel: '用户提示词',
  }
);
