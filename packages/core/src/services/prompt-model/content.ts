import type { PromptContent } from './types';

export const promptContentFromText = (
  text: string,
  modeKey = 'basic-system',
): PromptContent => {
  if (modeKey.startsWith('image-')) {
    return { kind: 'image-prompt', text };
  }
  return { kind: 'text', text };
};
