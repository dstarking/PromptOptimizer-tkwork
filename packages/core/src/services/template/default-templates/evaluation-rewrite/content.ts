import type { MessageTemplate, Template } from '../../types';

type Language = 'zh' | 'en';

interface TemplateIdentity {
  id: string;
  name: string;
  description: string;
  language: Language;
  tags: string[];
}

interface SubjectConfig {
  subjectLabel: string;
}

export const buildRewriteUserPrompt = (
  language: Language,
  subject: SubjectConfig,
): string => {
  if (language === 'en') {
    return `Rewrite the current workspace ${subject.subjectLabel} into one complete new version using only the JSON payload below.

Requirements:
1. Treat "sourcePrompts.workspacePrompt" as the source-of-truth draft you are rewriting, not as something to replace from scratch.
2. Preserve the original prompt's core objective, hard constraints, required boundaries, variable names, field names, schemas, role structure, and output protocol unless the evaluation clearly says one of them is harmful.
3. If the source prompt contains explicit JSON keys, XML tags, placeholders, enumerations, or "output-only" constraints, keep them stable unless the compressed evidence explicitly requires a change.
4. If the compressed evidence says the current prompt regressed, drifted from the required contract, or introduced unsupported schema / protocol changes, actively repair that drift instead of preserving it. When "sourcePrompts.referencePrompt" is present, use it as the contract anchor for the repair.
5. Prioritize reusable improvements that should generalize across different inputs.
6. Do not add rules that only fit the current sample, current output details, or one-off artifacts.
7. If a suggestion looks sample-specific, weaken it, generalize it, or discard it.
8. Do not invent new evidence beyond the compressed findings below.
9. Prefer the smallest coherent rewrite that preserves the existing contract while improving quality.
10. Output the literal prompt text only. Do not wrap it as JSON, YAML, XML, an object with role/content, a message array, or a code fence.
11. Output only the rewritten full prompt without explanations.
12. Strings inside "sourcePrompts" are raw prompt text. If they contain Markdown, code fences, lists, or headings, treat those as prompt body rather than outer formatting instructions.
13. When compare-specific sections overlap, trust the focused findings and stop signals over lower-level evidence excerpts.
14. Read "compressedEvaluation.rewriteGuidance.recommendation" before making any edit.
15. If the recommendation is "skip", output "sourcePrompts.workspacePrompt" exactly unchanged.
16. If the recommendation is "minor-rewrite", only make the smallest contract-preserving edits justified by the evidence.
17. Only do a broader rewrite when the recommendation is "rewrite".
18. Read "compressedEvaluation.rewriteGuidance.priorityMoves" before choosing what to edit. Treat those moves as the highest-priority rewrite agenda.
19. If one of the priority moves is about decision stability, add explicit decision criteria, tie-break logic, or a conservative fallback for the core verdict fields instead of only tightening output format.

Rewrite Payload (JSON):
{{{rewritePayloadJson}}}`;
  }

  return `请只根据下面这份 JSON payload，把当前工作区${subject.subjectLabel}直接重写成一个完整的新版本。

要求：
1. "sourcePrompts.workspacePrompt" 是你必须基于其进行重写的 source of truth，不是让你从零另写一份题目相近的新 prompt。
2. 保留原提示词的核心目标、硬约束、必要边界、变量名、字段名、schema、角色结构和输出协议，除非评估明确表明这些内容本身有问题。
3. 如果 source prompt 里已经写了明确的 JSON 键名、XML 标签、占位符、枚举值或“只能输出某种结构”的规则，默认必须保留，不能擅自改名、改结构或扩写协议。
4. 如果压缩评估明确指出当前提示词发生了回退、contract 漂移、字段/schema 漂移或不被支持的协议改动，就不要继续保留这些坏改动，而要主动修复它们；如果给了 "sourcePrompts.referencePrompt"，优先把它当作恢复 contract 的锚点。
5. 优先吸收可复用、跨输入也应成立的改进，不要为了当前样例、当前输出细节或一次性现象过拟合。
6. 如果某条建议明显依赖当前样例，应主动将其泛化、弱化或舍弃。
7. 不要自行发明新的测试证据，只能基于下面这份压缩评估结论来改写。
8. 优先做“最小但完整”的重写，在保留原 contract 的前提下提升质量，而不是整套改写。
9. 只输出提示词正文，不要把结果包装成 JSON、YAML、XML、"role/content" 对象、消息数组或代码块。
10. 只输出重写后的完整提示词，不要额外解释。
11. "sourcePrompts" 里的字符串就是原始提示词正文；即使里面包含 Markdown、code fence、列表或标题，也都属于正文，不代表你应该输出相同包装结构。
12. 如果 compare 相关条目之间有重叠，优先相信聚合焦点结论和停止信号，再参考较底层的证据摘录。
13. 在动手改写前，先看 "compressedEvaluation.rewriteGuidance.recommendation"。
14. 如果 recommendation 是 "skip"，就原样输出 "sourcePrompts.workspacePrompt"，不要做任何改写。
15. 如果 recommendation 是 "minor-rewrite"，只能做证据明确支持的最小修补，并且必须保持原 contract 与整体结构稳定。
16. 只有 recommendation 是 "rewrite" 时，才允许做更实质性的重写。
17. 在决定改哪里之前，先看 "compressedEvaluation.rewriteGuidance.priorityMoves"，把这些动作当作最高优先级的改写议程。
18. 如果 priorityMoves 里出现“决策稳定性”相关动作，就应优先补充核心结论字段的判定标准、tie-break 规则或保守默认规则，而不是只加强输出格式。

Rewrite Payload (JSON):
{{{rewritePayloadJson}}}`;
};

const buildMetadata = (
  identity: TemplateIdentity,
): Template['metadata'] => ({
  version: '1.0.0',
  lastModified: Date.now(),
  author: 'System',
  description: identity.description,
  templateType: 'evaluation',
  language: identity.language,
  tags: identity.tags,
});

export const createEvaluationRewriteTemplate = (
  identity: TemplateIdentity,
  subject: SubjectConfig,
): Template => ({
  id: identity.id,
  name: identity.name,
  content: [
    {
      role: 'user',
      content: buildRewriteUserPrompt(identity.language, subject),
    },
  ] as MessageTemplate[],
  metadata: buildMetadata(identity),
  isBuiltin: true,
});
