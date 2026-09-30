import { createCompareTemplate } from '../../builders';

export const template = createCompareTemplate(
  {
    id: 'evaluation-basic-user-compare',
    name: '用户提示词对比评估',
    description: '基于多测试快照对当前工作区用户提示词进行对比评估',
    language: 'zh',
    tags: ['evaluation', 'compare', 'basic', 'user'],
  },
  {
    subjectLabel: '用户提示词',
    roleName: '用户提示词对比评估专家',
  }
);
