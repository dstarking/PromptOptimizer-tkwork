import { createEvaluationRewriteTemplate } from './builders';

export const template = createEvaluationRewriteTemplate(
  {
    id: 'evaluation-rewrite-generic',
    name: '评估后智能改写',
    description: '基于评估结果重写当前工作区提示词',
    language: 'zh',
    tags: ['evaluation', 'rewrite', 'generic'],
  },
  {
    subjectLabel: '工作区提示词',
  }
);
