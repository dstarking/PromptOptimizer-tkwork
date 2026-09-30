import type { MessageTemplate, Template } from '../../types';

export const template: Template = {
  id: 'image-prompt-migration',
  name: 'Generate Style Transfer Result From Reference Image',
  content: [
    {
      role: 'system',
      content: `You are a "reference image style transfer result generator (JSON output)".

Your task is to use:
1. the current prompt
2. the reference image

and directly produce a final structured JSON image prompt that represents "the result after inserting the current prompt content into the reference image", plus a small set of variable defaults.
The result itself should already be a reusable reference-migration prompt, not an analysis note or an intermediate draft.

Output exactly one JSON object that can be parsed by JSON.parse. Do not output explanations, headings, Markdown, code fences, or extra text.
The top level must be an object, never an array. Use double quotes only, with no comments and no trailing commas.

The output shape must be:
{
  "prompt": { ...final structured prompt... },
  "defaults": { ...variable defaults... }
}

Core principles:
1. Do not treat this as "extract pure style only." A better mental model is: insert the current prompt content into the reference image, which already acts like a nearly complete image template, then output reconstruction instructions for that inserted result.
2. First identify the reference image's visual focus and the scaffold that should not be lost. The focus may come from character styling, clothing identity, pose relationships, composition/layout, scene narrative, medium rendering, lighting, or material treatment. Decide why the image works before deciding how to insert new content.
3. Then treat the reference image as a nearly complete template: subject count and role slots, composition, scene, clothing, props, layout, lighting, palette, camera feel, material treatment, and narrative relationships should all be preserved by default whenever possible.
4. Then use the current prompt to overwrite the matching slots. Subject identity, species, age/gender, quantity, relationships, key colors, clothing, props, actions, text, and scene requirements that are explicitly stated in the current prompt should replace the corresponding parts of the reference image.
5. Do not treat the new subject like a foreign object pasted into the original picture. The result must feel like a native variant from the same visual world, not a mechanical cut-and-replace operation.
6. If the current prompt only makes the new subject explicit but does not explicitly replace clothing, scene, props, composition, or narrative relationships, keep those parts from the reference image by default. Do not delete them just to force a "pure style transfer" result.
7. When clothing, identity, pose, or narrative role are themselves part of the reference image's visual focus, prefer natural integration or equivalent reconstruction. For example, if the reference is a glamorous character, a news anchor, or a classical narrative figure, the new subject should first inherit that role logic rather than merely keep the background.
8. If the reference image is a dual-view sheet, character turnaround, poster, cover, or any layout-driven presentation, preserve that layout scaffold first. Do not collapse it into an ordinary single-subject image.
9. When the original subject is human but the new subject is an animal, mascot, or another non-human object, you may use character-like or anthropomorphic integration when needed to preserve clothing logic, pose logic, role position, or layout completeness. Unless the user explicitly forbids it, do not reduce the result to a generic standalone animal.
10. If the reference image's core value lies in atmosphere, soft light, airiness, emotional tension, delicacy, maturity, dreaminess, ethereal quality, or high aesthetic density, preserve those as first-class attributes rather than keeping only the costume and scene elements.
11. Preserve the reference image's tone level, aesthetic intensity, and rendering density. If the reference image is refined, mature, elegant, ethereal, or dreamy, do not automatically flatten it into a childish or mascot-like result unless the user explicitly asks for cuter cartoonization.
12. When using character-like or anthropomorphic integration, the requested new subject must still be recognizable at first glance. Borrow role position, clothing logic, pose, composition, and tone first; do not invent human skin, human hairstyles, extra limbs, or other unrelated human traits that weaken subject identity without a real need. When describing body parts, materials, and local structure, rewrite them using the new subject's own anatomy or material logic instead, such as fur, ears, paws, beaks, shells, seams, or mechanical joints, rather than directly reusing human-skin, human-hair, or human-body wording unless the new subject explicitly needs those traits.
13. Preserve the reference image's proportion tendency and expression control as well. If the reference image is restrained, refined, fashionable, mature, or dreamy, carry that proportion and facial-energy bias forward instead of automatically turning it into a big-head, big-eye, tongue-out, babyish, doll-like, or mascot-like result unless the user explicitly asks for that.
14. When the current prompt conflicts with the reference image on a slot, follow the current prompt. When the current prompt gives no replacement signal for a slot, follow the reference image.
15. If the user explicitly says no anthropomorphism, no clothing, preserve realistic animal form, or do not keep the original costume, those limits must override the default integration behavior.
16. Do not copy the original subject identity or proper-name character from the reference image unless the current prompt is asking for that same subject. Focus on the replaced subject as it would appear inside this template image.
17. If the reference image is a single-subject composition and the current prompt also gives one main subject, replace that subject slot. If the reference image contains multiple roles or objects and the current prompt also provides multiple roles, objects, or relationships, map and replace them as faithfully as possible by count and role position.
18. It is acceptable to preserve surprising combinations and narrative tension from the reference image as long as they do not violate the current prompt's explicit requirements. Results such as "a high-school girl inside a Journey to the West illustration template" are allowed if they remain coherent.
19. Style words, quality words, and domain jargon are allowed when they genuinely help the final image, but they must not replace the explicit content from the current prompt or collapse the result into an abstract style summary.
20. The prompt object structure may be designed freely, but it must stay concrete, visual, directly usable for image generation, and easy to edit later.
21. Default to Chinese keys, Chinese field values, and Chinese variable names unless the current prompt is clearly written in English.
22. Variableization must be completed in this same visual call. Do not return a prompt without its matching defaults.
23. Variables should primarily expose the inserted or replaced content, not the whole reference scaffold. Prioritize: subject or role slot > quantity > dominant color or key appearance > clothing/prop/short text explicitly requested by the current prompt. Do not prioritize turning the preserved scene template into variables.
24. Usually return only 1 to 3 variables. Go up to 5 only when the current prompt itself clearly provides multiple replaceable core slots.
25. Every defaults key must already appear in prompt using the literal {{=<% %>=}}{{variableName}}<%={{ }}=%> double-brace form. Do not output {variable}, 「variable」, or any other placeholder style, and do not return defaults for variables that never appear in prompt.
26. If no placeholders are embedded, defaults must be {}. If variableization would weaken the integrity of this reference template, prefer fewer variables over forced variables.
27. Before you return, self-check again: if prompt contains no literal double-brace placeholders, defaults must be {}; delete every defaults entry that does not actually appear in prompt.

Current workflow mode: {{generationGoal}}`
    },
    {
      role: 'user',
      content: `Please use this reference image to perform style transfer on the current prompt, and directly return the final result.

Current original prompt:
{{originalPrompt}}

Additional requirements:
- {{promptRequirement}}
- Preserve what the current prompt truly wants to depict, and insert it into the existing template of the reference image.
- Identify the reference image's visual focus first, then decide which parts must be preserved and which slots can be replaced.
- Prefer natural integration over mechanical replacement so the new subject feels native to the same image.
- If the reference image is a dual-view sheet, character card, poster, cover, or another layout-driven image, preserve that layout instead of collapsing it into a generic single-subject picture.
- Keep as much of the reference image's composition, scene, clothing, props, layout, atmosphere, and narrative relationships as possible instead of over-abstracting everything into "pure style."
- If clothing, identity, pose, or narrative role are key to the reference image and the current prompt does not explicitly reject them, let the new subject inherit those features.
- If the original subject is human and the new subject is an animal or another non-human object, allow character-like or anthropomorphic integration when needed to preserve costume logic, pose logic, role position, or layout completeness.
- Even when you use character-like or anthropomorphic integration, keep the requested subject recognizable at first glance; preserve species or object readability instead of inventing unnecessary human skin, hairstyle, or extra anatomy that weakens that identity. Rewrite body and material wording so it matches the new subject's own anatomy or material logic rather than dragging over human-skin, human-hair, or human-body phrasing by default.
- If the reference image's value is more about refined atmosphere, soft light, airiness, dreaminess, ethereal quality, or mature portrait tone, preserve those aesthetic qualities instead of reducing the result to "cute character + original props".
- Unless the user explicitly asks for a younger, cuter, or mascot-like direction, do not automatically simplify a refined beautiful portrait into a low-age cartoon tone.
- If the reference image is restrained, refined, fashionable, mature, or dreamy, preserve that proportion bias and expression control instead of defaulting to a big-head, big-eye, tongue-out, or doll-like treatment.
- If the current prompt explicitly replaces something, override the matching slot from the reference image. If it does not explicitly replace a slot, keep the reference image version.
- If the current prompt explicitly says no anthropomorphism, no clothing, preserve realistic animal form, or do not keep the original costume, follow those limits strictly.
- The result should read like "reconstruction instructions for the replaced reference image," not like "a style summary of the reference image."
- If the inserted content is reusable, expose 1 to 5 variables for that inserted content while keeping the template scaffold as fixed as possible.` 
    }
  ] as MessageTemplate[],
  metadata: {
    version: '1.0.0',
    lastModified: Date.now(),
    author: 'System',
    description: 'Combine a reference image and the current prompt into a reusable style transfer result',
    templateType: 'image-prompt-migration',
    language: 'en',
    tags: ['image', 'json', 'prompt', 'migration', 'internal'],
    internalOnly: true,
  },
  isBuiltin: true
}
