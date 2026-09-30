import { createEvaluationRewriteTemplate } from './builders';

export const template = createEvaluationRewriteTemplate(
  {
    id: 'evaluation-rewrite-basic-system',
    name: '系统提示词评估后智能改写',
    description: '基于评估结果重写当前工作区系统提示词',
    language: 'zh',
    tags: ['evaluation', 'rewrite', 'basic', 'system'],
  },
  {
    subjectLabel: '系统提示词',
  }
);
