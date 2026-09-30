import { createCompareTemplate } from '../../builders';

export const template = createCompareTemplate(
  {
    id: 'evaluation-basic-system-compare',
    name: '系统提示词对比评估',
    description: '基于多测试快照对当前工作区系统提示词进行对比评估',
    language: 'zh',
    tags: ['evaluation', 'compare', 'basic', 'system'],
  },
  {
    subjectLabel: '系统提示词',
    roleName: '系统提示词对比评估专家',
  }
);
