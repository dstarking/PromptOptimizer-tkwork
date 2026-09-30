import { createEvaluationRewriteTemplate } from './builders';

export const template = createEvaluationRewriteTemplate(
  {
    id: 'evaluation-rewrite-pro-multi',
    name: '多消息提示词评估后智能改写',
    description: '基于评估结果重写当前工作区多消息 system 提示词',
    language: 'zh',
    tags: ['evaluation', 'rewrite', 'pro', 'multi'],
  },
  {
    subjectLabel: '多消息 system 提示词',
  }
);
