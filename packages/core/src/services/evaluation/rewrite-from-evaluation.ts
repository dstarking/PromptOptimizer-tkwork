import { TemplateProcessor } from '../template/processor';
import type { TemplateContext } from '../template/processor';
import type {
  CompareInsights,
  CompareStopSignals,
  EvaluationModeConfig,
  EvaluationResponse,
  EvaluationType,
} from './types';
import { template as evaluationRewriteBasicSystemTemplate } from '../template/default-templates/evaluation-rewrite/basic-system';
import { template as evaluationRewriteBasicSystemTemplateEn } from '../template/default-templates/evaluation-rewrite/basic-system_en';
import { template as evaluationRewriteBasicUserTemplate } from '../template/default-templates/evaluation-rewrite/basic-user';
import { template as evaluationRewriteBasicUserTemplateEn } from '../template/default-templates/evaluation-rewrite/basic-user_en';
import { template as evaluationRewriteProMultiTemplate } from '../template/default-templates/evaluation-rewrite/pro-multi';
import { template as evaluationRewriteProMultiTemplateEn } from '../template/default-templates/evaluation-rewrite/pro-multi_en';
import { template as evaluationRewriteProVariableTemplate } from '../template/default-templates/evaluation-rewrite/pro-variable';
import { template as evaluationRewriteProVariableTemplateEn } from '../template/default-templates/evaluation-rewrite/pro-variable_en';
import { template as evaluationRewriteGenericTemplate } from '../template/default-templates/evaluation-rewrite/generic';
import { template as evaluationRewriteGenericTemplateEn } from '../template/default-templates/evaluation-rewrite/generic_en';
import {
  buildEvaluationRewriteFocusSummaryLines,
  buildEvaluationRewriteGuidance,
  buildEvaluationRewriteTargetLines,
  formatEvaluationRewriteConflictSignal,
  resolveEvaluationRewriteSubjectLabel,
  resolveEvaluationRewriteTypeLabel,
  type RewriteFocusArea,
  type RewriteLanguage,
  type RewriteRecommendation,
} from '../template/default-templates/evaluation-rewrite/runtime-copy';

export type {
  RewriteFocusArea,
  RewriteLanguage,
  RewriteRecommendation,
};

export interface EvaluationRewriteLine {
  text: string;
}

export interface EvaluationRewritePromptParams {
  result: EvaluationResponse;
  type: EvaluationType;
  mode: EvaluationModeConfig;
  language?: RewriteLanguage;
  workspacePrompt?: string;
  referencePrompt?: string;
}

export interface EvaluationRewriteContext extends TemplateContext {
  language: RewriteLanguage;
  subjectLabel: string;
  evaluationTypeLabel: string;
  overallScore: string | number;
  rewritePayloadJson: string;
  hasWorkspacePrompt: boolean;
  workspacePrompt: string;
  hasReferencePrompt: boolean;
  referencePrompt: string;
  hasDimensionScoreLines: boolean;
  dimensionScoreLines: EvaluationRewriteLine[];
  hasRewriteTargetLines: boolean;
  rewriteTargetLines: EvaluationRewriteLine[];
  hasPatchPlanLines: boolean;
  patchPlanLines: EvaluationRewriteLine[];
  hasFocusSummaryLines: boolean;
  focusSummaryLines: EvaluationRewriteLine[];
  hasStopSignalLines: boolean;
  stopSignalLines: EvaluationRewriteLine[];
  hasConflictLines: boolean;
  conflictLines: EvaluationRewriteLine[];
  hasLearnableSignalLines: boolean;
  learnableSignalLines: EvaluationRewriteLine[];
  hasOverfitWarningLines: boolean;
  overfitWarningLines: EvaluationRewriteLine[];
  hasSupportEvidenceLines: boolean;
  supportEvidenceLines: EvaluationRewriteLine[];
  isCompareEvaluation: boolean;
  isResultEvaluation: boolean;
  isPromptOnlyEvaluation: boolean;
  isPromptIterateEvaluation: boolean;
}

export interface EvaluationRewritePayload {
  scenario: {
    language: RewriteLanguage;
    evaluationType: EvaluationType;
    evaluationTypeLabel: string;
    subjectLabel: string;
    mode: EvaluationModeConfig;
    overallScore: string | number;
  };
  sourcePrompts: {
    workspacePrompt?: string;
    referencePrompt?: string;
  };
  compressedEvaluation: {
    summary: string;
    dimensionScores: Array<{
      key: string;
      label: string;
      score: number;
    }>;
    improvements: string[];
    patchPlan: EvaluationResponse['patchPlan'];
    compareStopSignals?: CompareStopSignals;
    compareInsights?: CompareInsights;
    rewriteGuidance: {
      recommendation: RewriteRecommendation;
      reasons: string[];
      focusAreas: RewriteFocusArea[];
      priorityMoves: string[];
    };
    focusSummaryLines: string[];
    conflictLines: string[];
    learnableSignalLines: string[];
    overfitWarningLines: string[];
    supportEvidenceLines: string[];
  };
}

const normalizeInlineText = (content: string | undefined): string =>
  (content || '').replace(/\s+/gu, ' ').trim();

const truncateInline = (value: string | undefined, maxLength = 140): string => {
  const normalized = normalizeInlineText(value);
  if (!normalized) return '';

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized;
};

const collectUniqueLines = (
  values: Array<string | undefined>,
  options?: {
    limit?: number;
    maxLength?: number;
  },
): string[] => {
  const limit = options?.limit ?? 5;
  const maxLength = options?.maxLength ?? 220;
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const value of values) {
    const normalized = normalizeInlineText(value);
    if (!normalized) continue;

    const dedupeKey = normalized.toLocaleLowerCase();
    if (seen.has(dedupeKey)) continue;

    seen.add(dedupeKey);
    lines.push(truncateInline(normalized, maxLength));

    if (lines.length >= limit) {
      break;
    }
  }

  return lines;
};

const buildPatchPlanLines = (
  patchPlan: EvaluationResponse['patchPlan'],
): string[] =>
  (patchPlan || []).map((operation, index) => {
    const oldText = truncateInline(operation.oldText);
    const newText = truncateInline(operation.newText);
    const segments = [
      `${index + 1}. [${operation.op}] ${operation.instruction}`,
    ];

    if (oldText) {
      segments.push(`old="${oldText}"`);
    }
    if (newText) {
      segments.push(`new="${newText}"`);
    }

    return segments.join(' | ');
  });

const buildDimensionLines = (
  result: EvaluationResponse,
): string[] =>
  (result.score?.dimensions || []).map((dimension) =>
    `${dimension.label}: ${dimension.score}`
  );

const buildStopSignalLines = (
  stopSignals: CompareStopSignals | undefined,
): string[] => {
  if (!stopSignals) return [];

  const lines: string[] = [];

  if (stopSignals.targetVsBaseline) {
    lines.push(`targetVsBaseline=${stopSignals.targetVsBaseline}`);
  }
  if (stopSignals.targetVsReferenceGap) {
    lines.push(`targetVsReferenceGap=${stopSignals.targetVsReferenceGap}`);
  }
  if (stopSignals.improvementHeadroom) {
    lines.push(`improvementHeadroom=${stopSignals.improvementHeadroom}`);
  }
  if (stopSignals.overfitRisk) {
    lines.push(`overfitRisk=${stopSignals.overfitRisk}`);
  }
  if (stopSignals.stopRecommendation) {
    lines.push(`stopRecommendation=${stopSignals.stopRecommendation}`);
  }
  if (stopSignals.stopReasons?.length) {
    lines.push(`stopReasons=${stopSignals.stopReasons.join(' | ')}`);
  }

  return lines;
};

const buildCompareFocusSummaryLines = (
  compareInsights: CompareInsights | undefined,
  language: RewriteLanguage,
): string[] =>
  buildEvaluationRewriteFocusSummaryLines(compareInsights, language);

const buildCompareSupportLines = (
  compareInsights: CompareInsights | undefined,
): string[] =>
  collectUniqueLines(
    [
      ...(compareInsights?.pairHighlights || []).map((highlight, index) =>
        `${index + 1}. ${highlight.pairLabel} | signal=${highlight.pairSignal} | verdict=${highlight.verdict} | confidence=${highlight.confidence} | ${highlight.analysis}`
      ),
      ...(compareInsights?.evidenceHighlights || []),
    ],
    { limit: 4, maxLength: 240 }
  );

const buildCompareConflictLines = (
  compareInsights: CompareInsights | undefined,
  language: RewriteLanguage,
): string[] =>
  collectUniqueLines(
    (compareInsights?.conflictSignals || []).map((signal) =>
      formatEvaluationRewriteConflictSignal(signal, language)
    ),
    { limit: 4, maxLength: 260 }
  );

const buildRewriteTargetLines = (
  result: EvaluationResponse,
  language: RewriteLanguage,
): string[] =>
  buildEvaluationRewriteTargetLines(result, language);

const toTemplateLines = (values: string[]): EvaluationRewriteLine[] =>
  values.map((text) => ({ text }));

const resolveRewriteTemplate = (
  mode: EvaluationModeConfig,
  language: RewriteLanguage,
) => {
  const isEnglish = language === 'en';

  if (mode.functionMode === 'basic' && mode.subMode === 'system') {
    return isEnglish ? evaluationRewriteBasicSystemTemplateEn : evaluationRewriteBasicSystemTemplate;
  }

  if (mode.functionMode === 'basic' && mode.subMode === 'user') {
    return isEnglish ? evaluationRewriteBasicUserTemplateEn : evaluationRewriteBasicUserTemplate;
  }

  if (mode.functionMode === 'pro' && mode.subMode === 'multi') {
    return isEnglish ? evaluationRewriteProMultiTemplateEn : evaluationRewriteProMultiTemplate;
  }

  if (mode.functionMode === 'pro' && mode.subMode === 'variable') {
    return isEnglish ? evaluationRewriteProVariableTemplateEn : evaluationRewriteProVariableTemplate;
  }

  return isEnglish ? evaluationRewriteGenericTemplateEn : evaluationRewriteGenericTemplate;
};

export const normalizeRewriteLocaleLanguage = (
  locale: string | undefined,
): RewriteLanguage => locale?.toLowerCase().startsWith('en') ? 'en' : 'zh';

export const buildRewriteFromEvaluationContext = (
  params: EvaluationRewritePromptParams,
): EvaluationRewriteContext => {
  const language = params.language || 'zh';
  const { result, type, mode } = params;
  const metadata = result.metadata;
  const compareInsights = metadata?.compareInsights;
  const stopSignals = metadata?.compareStopSignals;
  const dimensionScoreLines = toTemplateLines(buildDimensionLines(result));
  const rewriteTargetLines = toTemplateLines(buildRewriteTargetLines(result, language));
  const patchPlanLines = toTemplateLines(
    collectUniqueLines(buildPatchPlanLines(result.patchPlan), {
      limit: 4,
      maxLength: 260,
    })
  );
  const focusSummaryLines = toTemplateLines(
    buildCompareFocusSummaryLines(compareInsights, language)
  );
  const stopSignalLines = toTemplateLines(
    collectUniqueLines(buildStopSignalLines(stopSignals), {
      limit: 6,
      maxLength: 220,
    })
  );
  const conflictLines = toTemplateLines(
    buildCompareConflictLines(compareInsights, language)
  );
  const learnableSignalLines = toTemplateLines(
    collectUniqueLines(compareInsights?.learnableSignals || [], {
      limit: 5,
      maxLength: 220,
    })
  );
  const overfitWarningLines = toTemplateLines(
    collectUniqueLines(compareInsights?.overfitWarnings || [], {
      limit: 5,
      maxLength: 220,
    })
  );
  const supportEvidenceLines = toTemplateLines(
    buildCompareSupportLines(compareInsights)
  );
  const rewritePayload = buildRewritePayload(params);

  return {
    language,
    subjectLabel: resolveEvaluationRewriteSubjectLabel(mode, language),
    evaluationTypeLabel: resolveEvaluationRewriteTypeLabel(type, language) || type,
    overallScore: result.score?.overall ?? 'N/A',
    rewritePayloadJson: JSON.stringify(rewritePayload, null, 2),
    hasWorkspacePrompt: !!params.workspacePrompt?.trim(),
    workspacePrompt: params.workspacePrompt?.trim() || '',
    hasReferencePrompt: !!params.referencePrompt?.trim(),
    referencePrompt: params.referencePrompt?.trim() || '',
    hasDimensionScoreLines: dimensionScoreLines.length > 0,
    dimensionScoreLines,
    hasRewriteTargetLines: rewriteTargetLines.length > 0,
    rewriteTargetLines,
    hasPatchPlanLines: patchPlanLines.length > 0,
    patchPlanLines,
    hasFocusSummaryLines: focusSummaryLines.length > 0,
    focusSummaryLines,
    hasStopSignalLines: stopSignalLines.length > 0,
    stopSignalLines,
    hasConflictLines: conflictLines.length > 0,
    conflictLines,
    hasLearnableSignalLines: learnableSignalLines.length > 0,
    learnableSignalLines,
    hasOverfitWarningLines: overfitWarningLines.length > 0,
    overfitWarningLines,
    hasSupportEvidenceLines: supportEvidenceLines.length > 0,
    supportEvidenceLines,
    isCompareEvaluation: type === 'compare',
    isResultEvaluation: type === 'result',
    isPromptOnlyEvaluation: type === 'prompt-only',
    isPromptIterateEvaluation: type === 'prompt-iterate',
  };
};

export const buildRewritePayload = (
  params: EvaluationRewritePromptParams,
): EvaluationRewritePayload => {
  const language = params.language || 'zh';
  const { result, type, mode } = params;
  const evaluationTypeLabel = resolveEvaluationRewriteTypeLabel(type, language) || type;
  const subjectLabel = resolveEvaluationRewriteSubjectLabel(mode, language);
  const compareInsights = result.metadata?.compareInsights;
  const stopSignals = result.metadata?.compareStopSignals;
  const rewriteGuidance = buildEvaluationRewriteGuidance({
    type,
    language,
    workspacePrompt: params.workspacePrompt,
    stopSignals,
    compareInsights,
  });

  return {
    scenario: {
      language,
      evaluationType: type,
      evaluationTypeLabel,
      subjectLabel,
      mode,
      overallScore: result.score?.overall ?? 'N/A',
    },
    sourcePrompts: {
      ...(params.workspacePrompt?.trim()
        ? { workspacePrompt: params.workspacePrompt.trim() }
        : {}),
      ...(params.referencePrompt?.trim()
        ? { referencePrompt: params.referencePrompt.trim() }
        : {}),
    },
    compressedEvaluation: {
      summary: result.summary,
      dimensionScores: (result.score?.dimensions || []).map((dimension) => ({
        key: dimension.key,
        label: dimension.label,
        score: dimension.score,
      })),
      improvements: [...(result.improvements || [])],
      patchPlan: [...(result.patchPlan || [])],
      ...(stopSignals ? { compareStopSignals: stopSignals } : {}),
      ...(compareInsights ? { compareInsights } : {}),
      rewriteGuidance,
      focusSummaryLines: buildCompareFocusSummaryLines(compareInsights, language),
      conflictLines: buildCompareConflictLines(compareInsights, language),
      learnableSignalLines: collectUniqueLines(compareInsights?.learnableSignals || [], {
        limit: 5,
        maxLength: 220,
      }),
      overfitWarningLines: collectUniqueLines(compareInsights?.overfitWarnings || [], {
        limit: 5,
        maxLength: 220,
      }),
      supportEvidenceLines: buildCompareSupportLines(compareInsights),
    },
  };
};

export const buildRewritePromptFromEvaluation = (
  params: EvaluationRewritePromptParams,
): string => {
  const language = params.language || 'zh';
  const template = resolveRewriteTemplate(params.mode, language);
  const context = buildRewriteFromEvaluationContext(params);
  const messages = TemplateProcessor.processTemplate(template, context);

  return messages.map((message) => message.content.trim()).filter(Boolean).join('\n\n').trim();
};
