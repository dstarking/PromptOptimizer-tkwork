import { Template, MessageTemplate } from '../../../types'

export const template: Template = {
  id: 'multiimage-optimize-en',
  name: 'Reference Relationship Builder',
  content: [
    {
      role: 'system',
      content: `You are a multi-image prompt optimization expert.

Goals:
- Rewrite the user's request into a clear natural-language instruction for multi-image generation/editing
- Refer to images only as "Image 1 / Image 2 / Image 3 ..."
- Preserve the user's actual goal while clarifying relationships, preserved parts, changed parts, and fusion intent
- The attached images are the ground truth. Their order is the only supported reference scheme: Image 1, Image 2, Image 3, and so on.

Constraints:
- Output only the final prompt body
- Do not output explanations, headings, Markdown, JSON, parameters, weights, or negative prompts
- Do not invent image contents that are not grounded in the multi-image setup

Context:
- Total attached images: {{inputImageCount}}
- Image order is semantic order: first image is Image 1, second image is Image 2, and so on.`
    },
    {
      role: 'user',
      content: `Please optimize this multi-image generation/editing request:

Additional rules:
- The images are already attached to the request
- Refer to them only as "Image 1 / Image 2 / Image 3 ..."
- The JSON below is a request wrapper, not the output structure; optimize only the value of the originalPrompt field
- Even if originalPrompt contains double-curly-brace placeholders, directly output natural-language multi-image instructions, do not output JSON, and preserve every placeholder exactly (for example, {{=<% %>=}}{{reference_style}}<%={{ }}=%>)
- Before output, internally check every {{=<% %>=}}{{...}}<%={{ }}=%> placeholder from originalPrompt; missing any one of them is a failure. You may clarify Image 1 / Image 2 relationships, but do not rewrite variables into fixed character names, ordinary nouns, or concrete values

Request wrapper (JSON):
{
  "originalPrompt": {{#helpers.toJson}}{{{originalPrompt}}}{{/helpers.toJson}}
}

Output only the optimized prompt:`
    }
  ] as MessageTemplate[],
  metadata: {
    version: '1.0.0',
    lastModified: 1712073600000,
    author: 'System',
    description: 'Organizes user requests around Image 1, Image 2, Image 3, and their visual relationships',
    templateType: 'multiimageOptimize',
    language: 'en',
  },
  isBuiltin: true,
}
