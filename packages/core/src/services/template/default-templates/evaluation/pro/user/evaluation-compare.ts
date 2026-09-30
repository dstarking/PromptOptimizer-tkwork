import { createCompareTemplate } from '../../builders';

export const template = createCompareTemplate(
  {
    id: 'evaluation-pro-variable-compare',
    name: '变量模式对比评估',
    description: '基于多测试快照对当前工作区变量提示词进行对比评估',
    language: 'zh',
    tags: ['evaluation', 'compare', 'pro', 'user', 'variable'],
  },
  {
    subjectLabel: '变量提示词',
    roleName: '变量提示词对比评估专家',
  }
);
