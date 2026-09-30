import { createResultTemplate } from '../../builders';

export const template = createResultTemplate(
  {
    id: 'evaluation-pro-variable-result',
    name: 'Variable Prompt Result Evaluation',
    description: 'Evaluate the effectiveness of a single result in variable mode',
    language: 'en',
    tags: ['evaluation', 'result', 'pro', 'user', 'variable'],
  },
  {
    subjectLabel: 'variable prompt',
    roleName: 'Variable Prompt Execution Evaluation Expert',
  }
);
