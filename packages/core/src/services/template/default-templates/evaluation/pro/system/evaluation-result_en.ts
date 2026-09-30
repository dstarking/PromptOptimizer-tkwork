import { createResultTemplate } from '../../builders';

export const template = createResultTemplate(
  {
    id: 'evaluation-pro-multi-result',
    name: 'Conversation Prompt Result Evaluation',
    description: 'Evaluate the effectiveness of a single result in multi-message mode',
    language: 'en',
    tags: ['evaluation', 'result', 'pro', 'system', 'multi'],
  },
  {
    subjectLabel: 'conversation prompt',
    roleName: 'Conversation Prompt Execution Evaluation Expert',
  }
);
