import type {
  CompareConflictSignal,
  CompareJudgementPairType,
  CompareStopSignals,
  EvaluationModeConfig,
} from '../../../evaluation/types';

export type ComparePromptLanguage = 'zh' | 'en';

export interface StructuredCompareRoleBindingView {
  snapshotId: string;
  snapshotLabel: string;
  roleLabel: string;
}

export interface StructuredCompareTestCaseView {
  id: string;
  label: string;
  hasLabel: boolean;
  inputLabel: string;
  inputSummary: string;
  hasInputSummary: boolean;
  inputContent: string;
  settingsSummary: string;
  hasSettingsSummary: boolean;
}

export interface StructuredCompareSnapshotView {
  label: string;
  promptRefLabel: string;
  promptText: string;
  output: string;
  roleLabel: string;
  hasRole: boolean;
  modelKey: string;
  hasModelKey: boolean;
  versionLabel: string;
  hasVersionLabel: boolean;
  executionInputLabel: string;
  executionInputSummary: string;
  hasExecutionInputSummary: boolean;
  executionInputContent: string;
  hasExecutionInput: boolean;
  reasoning: string;
  hasReasoning: boolean;
}

export interface StructuredCompareJudgeResultView {
  pairKey: string;
  pairType: string;
  verdict: string;
  winner: string;
  confidence: string;
  pairSignal: string;
  analysis: string;
  evidence: string[];
  learnableSignals: string[];
  overfitWarnings: string[];
}

export interface StructuredCompareSignalSnapshotView {
  progress?: string;
  gap?: string;
  promptValidity?: string;
  stability?: string;
}

export interface StructuredCompareSubjectConfig {
  subjectLabel: string;
  roleName: string;
}

export const resolveStructuredComparePromptSubjectConfig = (
  mode: EvaluationModeConfig,
  language: ComparePromptLanguage,
): StructuredCompareSubjectConfig => {
  if (language === 'en') {
    if (mode.functionMode === 'basic' && mode.subMode === 'system') {
      return {
        subjectLabel: 'system prompt',
        roleName: 'Structured System Prompt Compare Synthesizer',
      };
    }
    if (mode.functionMode === 'basic') {
      return {
        subjectLabel: 'user prompt',
        roleName: 'Structured User Prompt Compare Synthesizer',
      };
    }
    if (mode.functionMode === 'pro' && mode.subMode === 'multi') {
      return {
        subjectLabel: 'conversation prompt',
        roleName: 'Structured Conversation Prompt Compare Synthesizer',
      };
    }
    if (mode.functionMode === 'pro') {
      return {
        subjectLabel: 'variable prompt',
        roleName: 'Structured Variable Prompt Compare Synthesizer',
      };
    }
    return {
      subjectLabel: 'workspace prompt',
      roleName: 'Structured Prompt Compare Synthesizer',
    };
  }

  if (mode.functionMode === 'basic' && mode.subMode === 'system') {
    return {
      subjectLabel: '系统提示词',
      roleName: '结构化系统提示词对比综合专家',
    };
  }
  if (mode.functionMode === 'basic') {
    return {
      subjectLabel: '用户提示词',
      roleName: '结构化用户提示词对比综合专家',
    };
  }
  if (mode.functionMode === 'pro' && mode.subMode === 'multi') {
    return {
      subjectLabel: '上下文消息提示词',
      roleName: '结构化上下文消息对比综合专家',
    };
  }
  if (mode.functionMode === 'pro') {
    return {
      subjectLabel: '变量提示词',
      roleName: '结构化变量提示词对比综合专家',
    };
  }
  return {
    subjectLabel: '工作区提示词',
    roleName: '结构化提示词对比综合专家',
  };
};

export const renderStructuredComparePairGuidance = (
  pairType: CompareJudgementPairType,
  language: ComparePromptLanguage,
): string => {
  if (language === 'en') {
    switch (pairType) {
      case 'targetBaseline':
        return [
          '- This pair decides whether the current target is actually worth keeping instead of the previous version.',
          '- Do not reward cosmetic rewrites, longer wording, or more confident tone if task completion, boundary control, or required structure got weaker.',
          '- If the target is genuinely more helpful on this sample but the gain mainly comes from sample-tied wording, keywords, or one-off rules, prefer pairSignal=improved or flat first, then expose the fragility in overfitWarnings instead of defaulting to unclear.',
          '- Only use unclear when you truly cannot determine the direction after weighing both sides, not merely because overfit risk exists.',
        ].join('\n');
      case 'targetReference':
        return [
          '- This pair is for learnable gap analysis, not raw model worship.',
          '- Separate transferable prompt-side structure from differences that mainly look like model ceiling or raw reasoning ability.',
          '- Only use "major" when the reference shows a clear structural advantage that the target could realistically learn from.',
          '- If your evidence says the reference missed a required action or violated the prompt-side rule while the target followed it, do not still conclude "right-better". Downgrade or flip the verdict so it matches the evidence.',
        ].join('\n');
      case 'referenceBaseline':
        return [
          '- This pair checks whether the prompt change itself is supported on the reference side.',
          '- Prefer "supported" only when the newer reference-side prompt clearly improves in the same direction as the target-side gain.',
          '- If the reference side does not support the change, call that out explicitly because it raises overfit risk for the target-side improvement.',
        ].join('\n');
      case 'targetReplica':
        return [
          '- This pair checks stability across repeated executions with the same target prompt.',
          '- Treat requirement-preserving variation as acceptable, but mark "unstable" when key boundaries, task structure, or output intent drift across runs.',
          '- If one run obeys an explicit output-only contract and another adds prose, markdown, code fences, renamed fields, extra keys, or wrapper text, that is instability rather than harmless variation.',
          '- Do not confuse one lucky output with reliable stability.',
        ].join('\n');
      default:
        return '- Judge only the provided pair and keep the conclusion conservative.';
    }
  }

  switch (pairType) {
    case 'targetBaseline':
      return [
        '- 这一组决定当前 target 是否真的值得替换上一版本，而不是只看起来更“像优化版”。',
        '- 如果 left 只是写得更长、语气更强或表面更完整，但任务完成度、边界控制或关键结构更差，不能判成 left-better。',
        '- 如果 target 在当前样例下确实更有帮助，但收益主要来自样例关键词、一次性规则或特定触发条件，优先先判断 pairSignal=improved 或 flat，再把脆弱性写进 overfitWarnings，不要直接因为有过拟合风险就退成 unclear。',
        '- 只有在你综合两侧后仍无法判断方向时，才允许写 unclear；“存在过拟合风险”本身不等于“没有方向”。',
      ].join('\n');
    case 'targetReference':
      return [
        '- 这一组是为了找“可学习差距”，不是为了盲目崇拜更强模型。',
        '- 要区分“可迁移的提示词结构优势”和“纯模型能力上限”造成的差异。',
        '- 只有当 reference 展示出 target 可以现实学习的清晰结构优势时，才应给出 major。',
        '- 如果 evidence 已经表明 reference 漏掉了必须动作、没遵守 prompt 规则，而 target 做到了，就不能继续写成 right-better；结论必须和证据一致。',
      ].join('\n');
    case 'referenceBaseline':
      return [
        '- 这一组用于判断 prompt 改动本身是否也在 reference 侧成立。',
        '- 只有当 reference 新版本在方向上明确支撑 target 侧收益时，才应给出 supported。',
        '- 如果 reference 侧并不支持这次改动，要明确指出，因为这会抬高 target 侧收益只是样例拟合的风险。',
      ].join('\n');
    case 'targetReplica':
      return [
        '- 这一组用于判断同一个 target prompt 在重复执行下是否稳定。',
        '- 如果只是措辞波动但仍满足同样边界与任务要求，可视为稳定；如果关键边界、结构或输出意图飘移，应判为 unstable。',
        '- 如果一次执行严格满足 output-only 约束，而另一次多出解释、Markdown、code fence、字段改名、额外键或包裹文本，这属于不稳定，不是无害波动。',
        '- 不要把一次走运的输出误判成稳定收益。',
      ].join('\n');
    default:
      return '- 只判断当前这一组 pair，并保持结论保守。';
  }
};

export const renderStructuredCompareConflictSignal = (
  signal: CompareConflictSignal,
  language: ComparePromptLanguage,
): string => {
  switch (signal) {
    case 'improvementNotSupportedOnReference':
      return language === 'en'
        ? 'The target improved over baseline, but the same prompt change is not supported on the reference side.'
        : 'Target 相比 baseline 有进步，但同一类 prompt 改动在 reference 侧并未得到支持。';
    case 'improvementUnstableAcrossReplicas':
      return language === 'en'
        ? 'The target improved in one comparison, but replica evidence suggests the gain may be unstable.'
        : 'Target 在单组比较里有进步，但 replica 证据提示该收益可能不稳定。';
    case 'regressionOutweighsCosmeticGains':
      return language === 'en'
        ? 'Regression against the baseline should outweigh cosmetic improvements elsewhere.'
        : '相对 baseline 的回退应优先于其他表面优化。';
    case 'sampleOverfitRiskVisible':
      return language === 'en'
        ? 'When reusable gains and sample-fitting gains coexist, prefer conservative conclusions and keep the overfit risk visible.'
        : '如果“可复用收益”和“样例贴合收益”并存，应优先采用保守结论，并保持过拟合风险可见。';
    default:
      return signal;
  }
};

export const renderStructuredCompareRoleBindings = (
  roleBindings: StructuredCompareRoleBindingView[],
  language: ComparePromptLanguage,
): string => {
  if (!roleBindings.length) {
    return '';
  }

  const lines = roleBindings.map((binding) =>
    language === 'en'
      ? `- Snapshot ${binding.snapshotLabel} (${binding.snapshotId}): ${binding.roleLabel}`
      : `- 快照 ${binding.snapshotLabel}（${binding.snapshotId}）：${binding.roleLabel}`
  );

  return language === 'en'
    ? `## Structured Compare Roles\n${lines.join('\n')}\n\n`
    : `## Structured Compare 角色\n${lines.join('\n')}\n\n`;
};

export const renderStructuredCompareTestCases = (
  testCases: StructuredCompareTestCaseView[],
  language: ComparePromptLanguage,
): string => {
  if (!testCases.length) {
    return '';
  }

  const header =
    language === 'en'
      ? `## Relevant Test Cases (${testCases.length})`
      : `## 相关测试用例（${testCases.length}）`;
  const sections = testCases.map((testCase) => {
    if (language === 'en') {
      return `### Test Case ${testCase.hasLabel ? testCase.label : testCase.id}
#### Input (${testCase.inputLabel})
${testCase.hasInputSummary ? `${testCase.inputSummary}\n` : ''}${testCase.inputContent}
${testCase.hasSettingsSummary ? `\n#### Settings\n${testCase.settingsSummary}` : ''}`;
    }

    return `### 测试用例 ${testCase.hasLabel ? testCase.label : testCase.id}
#### 输入（${testCase.inputLabel}）
${testCase.hasInputSummary ? `${testCase.inputSummary}\n` : ''}${testCase.inputContent}
${testCase.hasSettingsSummary ? `\n#### 设置\n${testCase.settingsSummary}` : ''}`;
  });

  return `${header}\n${sections.join('\n\n')}\n\n`;
};

export const renderStructuredCompareSnapshot = (
  snapshot: StructuredCompareSnapshotView,
  language: ComparePromptLanguage,
): string => {
  const lines = [
    language === 'en' ? `- Snapshot: ${snapshot.label}` : `- 快照：${snapshot.label}`,
  ];

  if (snapshot.hasRole) {
    lines.push(
      language === 'en'
        ? `- Compare Role: ${snapshot.roleLabel}`
        : `- 对比角色：${snapshot.roleLabel}`
    );
  }
  lines.push(
    language === 'en'
      ? `- Prompt Source: ${snapshot.promptRefLabel}`
      : `- 提示词来源：${snapshot.promptRefLabel}`
  );
  if (snapshot.hasModelKey) {
    lines.push(language === 'en' ? `- Model: ${snapshot.modelKey}` : `- 模型：${snapshot.modelKey}`);
  }
  if (snapshot.hasVersionLabel) {
    lines.push(
      language === 'en'
        ? `- Version: ${snapshot.versionLabel}`
        : `- 版本：${snapshot.versionLabel}`
    );
  }

  return `${lines.join('\n')}
${language === 'en' ? '#### Executed Prompt' : '#### 执行提示词'}
${snapshot.promptText}
${snapshot.hasExecutionInput
  ? `\n\n${language === 'en' ? `#### Additional Execution Input (${snapshot.executionInputLabel})` : `#### 额外执行输入（${snapshot.executionInputLabel}）`}
${snapshot.hasExecutionInputSummary ? `${snapshot.executionInputSummary}\n` : ''}${snapshot.executionInputContent}`
  : ''}

${language === 'en' ? '#### Output' : '#### 输出'}
${snapshot.output}${snapshot.hasReasoning ? `\n\n${language === 'en' ? '#### Reasoning' : '#### 推理'}\n${snapshot.reasoning}` : ''}`;
};

export const renderStructuredCompareJudgeResults = (
  judgeResults: StructuredCompareJudgeResultView[],
  language: ComparePromptLanguage,
): string => {
  const header =
    language === 'en'
      ? `## Pairwise Judge Results (${judgeResults.length})`
      : `## 成对判断结果（${judgeResults.length}）`;
  const sections = judgeResults.map((result, index) => {
    const evidenceLines =
      result.evidence.length > 0
        ? result.evidence.map((item) => `- ${item}`).join('\n')
        : language === 'en'
          ? '- none'
          : '- 无';
    const signalLines =
      result.learnableSignals.length > 0
        ? result.learnableSignals.map((item) => `- ${item}`).join('\n')
        : language === 'en'
          ? '- none'
          : '- 无';
    const overfitLines =
      result.overfitWarnings.length > 0
        ? result.overfitWarnings.map((item) => `- ${item}`).join('\n')
        : language === 'en'
          ? '- none'
          : '- 无';

    return language === 'en'
      ? `### Result ${index + 1}
- Pair Key: ${result.pairKey}
- Pair Type: ${result.pairType}
- Verdict: ${result.verdict}
- Winner: ${result.winner}
- Confidence: ${result.confidence}
- Pair Signal: ${result.pairSignal}
#### Analysis
${result.analysis}
#### Evidence
${evidenceLines}
#### Learnable Signals
${signalLines}
#### Overfit Warnings
${overfitLines}`
      : `### 结果 ${index + 1}
- Pair Key：${result.pairKey}
- Pair Type：${result.pairType}
- Verdict：${result.verdict}
- Winner：${result.winner}
- Confidence：${result.confidence}
- Pair Signal：${result.pairSignal}
#### Analysis
${result.analysis}
#### Evidence
${evidenceLines}
#### Learnable Signals
${signalLines}
#### Overfit Warnings
${overfitLines}`;
  });

  return `${header}\n${sections.join('\n\n')}\n\n`;
};

export const renderStructuredCompareSynthesisHints = (params: {
  language: ComparePromptLanguage;
  signalSnapshot: StructuredCompareSignalSnapshotView;
  derivedStopSignals?: CompareStopSignals;
  learnableSignals: string[];
  overfitWarnings: string[];
  conflictChecks: string[];
}): string => {
  const { language, signalSnapshot, derivedStopSignals, learnableSignals, overfitWarnings, conflictChecks } = params;
  const signalLines = [
    language === 'en'
      ? `- Progress Signal: ${signalSnapshot.progress || 'n/a'}`
      : `- Progress Signal：${signalSnapshot.progress || 'n/a'}`,
    language === 'en'
      ? `- Reference Gap Signal: ${signalSnapshot.gap || 'n/a'}`
      : `- Reference Gap Signal：${signalSnapshot.gap || 'n/a'}`,
    language === 'en'
      ? `- Prompt Validity Signal: ${signalSnapshot.promptValidity || 'n/a'}`
      : `- Prompt Validity Signal：${signalSnapshot.promptValidity || 'n/a'}`,
    language === 'en'
      ? `- Stability Signal: ${signalSnapshot.stability || 'n/a'}`
      : `- Stability Signal：${signalSnapshot.stability || 'n/a'}`,
    language === 'en'
      ? `- Derived Stop Recommendation: ${derivedStopSignals?.stopRecommendation || 'n/a'}`
      : `- Derived Stop Recommendation：${derivedStopSignals?.stopRecommendation || 'n/a'}`,
  ];

  const learnableSection =
    learnableSignals.length > 0
      ? learnableSignals.map((item) => `- ${item}`).join('\n')
      : language === 'en'
        ? '- none'
        : '- 无';
  const overfitSection =
    overfitWarnings.length > 0
      ? overfitWarnings.map((item) => `- ${item}`).join('\n')
      : language === 'en'
        ? '- none'
        : '- 无';
  const conflictSection =
    conflictChecks.length > 0
      ? conflictChecks.map((item) => `- ${item}`).join('\n')
      : language === 'en'
        ? '- none'
        : '- 无';

  return language === 'en'
    ? `## Deterministic Synthesis Hints
- Priority Order: targetBaseline > targetReference > referenceBaseline > targetReplica
${signalLines.join('\n')}

### Reusable Signal Candidates
${learnableSection}

### Overfit / Risk Candidates
${overfitSection}

### Conflict Checks
${conflictSection}

`
    : `## 综合提示（确定性）
- Priority Order：targetBaseline > targetReference > referenceBaseline > targetReplica
${signalLines.join('\n')}

### 可复用信号候选
${learnableSection}

### 过拟合 / 风险候选
${overfitSection}

### 冲突检查
${conflictSection}

`;
};
