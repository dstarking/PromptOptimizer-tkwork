import { createCompareTemplate } from '../../builders';

export const template = createCompareTemplate(
  {
    id: 'evaluation-pro-multi-compare',
    name: '上下文消息对比评估',
    description: '基于多测试快照对当前工作区上下文消息提示词进行对比评估',
    language: 'zh',
    tags: ['evaluation', 'compare', 'pro', 'system', 'multi'],
  },
  {
    subjectLabel: '上下文消息提示词',
    roleName: '上下文消息对比评估专家',
  }
);
