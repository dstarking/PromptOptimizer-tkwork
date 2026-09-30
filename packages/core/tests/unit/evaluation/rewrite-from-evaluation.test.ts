import { describe, expect, it } from 'vitest';
import type {
  EvaluationResponse,
  EvaluationType,
} from '../../../src/services/evaluation/types';
import {
  buildRewritePayload,
  buildRewriteFromEvaluationContext,
  buildRewritePromptFromEvaluation,
  normalizeRewriteLocaleLanguage,
} from '../../../src/services/evaluation/rewrite-from-evaluation';

const createEvaluationResponse = (
  overall: number,
  type: EvaluationType = 'result'
): EvaluationResponse => ({
  type,
  score: {
    overall,
    dimensions: [
      {
        key: 'overall',
        label: 'Overall',
        score: overall,
      },
    ],
  },
  improvements: [],
  summary: `score-${overall}`,
  patchPlan: [],
});

describe('rewrite-from-evaluation', () => {
  it('builds a JSON-payload compare rewrite brief in Chinese', () => {
    const input = buildRewritePromptFromEvaluation({
      type: 'compare',
      mode: {
        functionMode: 'basic',
        subMode: 'system',
      },
      workspacePrompt: [
        '你是风险分级助手。',
        '只输出 JSON 对象，字段为 level, rationale, next_action。',
        '不要输出解释或代码块。',
      ].join('\n'),
      referencePrompt: '你是风险分级助手。输出 level, rationale, next_action。',
      result: {
        ...createEvaluationResponse(88, 'compare'),
        summary: '当前版本比上一版本更稳定，但和参考模型相比还有轻微格式差距。',
        improvements: [
          '把输出结构约束写得更前置，并明确结尾不要附加解释。',
          '把输出结构约束写得更前置，并明确结尾不要附加解释。',
        ],
        patchPlan: [
          {
            op: 'replace',
            instruction: '将输出格式要求前置，并保留禁止附加说明的边界。',
            oldText: '请回答问题。',
            newText: '请先按固定结构回答，并且不要附加解释。',
          },
        ],
        metadata: {
          compareStopSignals: {
            targetVsBaseline: 'improved',
            targetVsReferenceGap: 'minor',
            improvementHeadroom: 'low',
            overfitRisk: 'medium',
            stopRecommendation: 'continue',
            stopReasons: ['still trailing the reference on format consistency'],
          },
          compareInsights: {
            progressSummary: {
              pairKey: 'target-vs-baseline',
              pairType: 'targetBaseline',
              pairLabel: 'Target vs Previous',
              pairSignal: 'improved',
              verdict: 'left-better',
              confidence: 'high',
              analysis: '当前版本结构更清晰，漏项更少。',
            },
            pairHighlights: [
              {
                pairKey: 'target-vs-baseline',
                pairType: 'targetBaseline',
                pairLabel: 'Target vs Previous',
                pairSignal: 'improved',
                verdict: 'left-better',
                confidence: 'high',
                analysis: '当前版本结构更清晰，漏项更少。',
              },
            ],
            learnableSignals: [
              '保留显式步骤结构。',
              '保留显式步骤结构。',
            ],
            overfitWarnings: [
              '不要为了这条样例单独添加领域规则。',
              '不要为了这条样例单独添加领域规则。',
            ],
            conflictSignals: [
              'sampleOverfitRiskVisible',
            ],
          },
        },
      },
    });

    expect(input).toContain('Rewrite Payload (JSON):');
    expect(input).toContain('"evaluationTypeLabel": "对比评估"');
    expect(input).toContain('"workspacePrompt": "你是风险分级助手。\\n只输出 JSON 对象');
    expect(input).toContain('"referencePrompt": "你是风险分级助手。输出 level, rationale, next_action。"');
    expect(input).toContain('"compareStopSignals"');
    expect(input).toContain('"compareInsights"');
    expect(input).toContain('"rewriteGuidance"');
    expect(input).toContain('"recommendation": "rewrite"');
    expect(input).toContain('"priorityMoves"');
    expect(input).toContain('"focusSummaryLines"');
    expect(input).toContain('"supportEvidenceLines"');
    expect(input).toContain('"sampleOverfitRiskVisible"');
    expect(input).toContain('只输出提示词正文');
    expect(input).toContain('如果 recommendation 是 "skip"');
    expect(input).toContain('先看 "compressedEvaluation.rewriteGuidance.priorityMoves"');
  });

  it('emits English rewrite guidance for design-only analysis', () => {
    const input = buildRewritePromptFromEvaluation(
      {
        type: 'prompt-only',
        mode: {
          functionMode: 'basic',
          subMode: 'user',
        },
        language: 'en',
        workspacePrompt: 'Return JSON with keys title and tags only.',
        result: {
          ...createEvaluationResponse(76, 'prompt-only'),
          summary: 'The prompt intent is clear, but the response boundary is still loose.',
          improvements: [
            'Move the output format requirement earlier.',
          ],
        },
      }
    );

    expect(input).toContain('Rewrite the current workspace user prompt into one complete new version');
    expect(input).toContain('Rewrite Payload (JSON):');
    expect(input).toContain('"workspacePrompt": "Return JSON with keys title and tags only."');
    expect(input).toContain('Preserve the original prompt');
    expect(input).toContain('use it as the contract anchor for the repair');
    expect(input).toContain('Do not wrap it as JSON');
    expect(input).toContain('"evaluationTypeLabel": "Prompt Design Analysis"');
    expect(input).toContain('"improvements"');
    expect(input).toContain('"rewriteGuidance"');
    expect(input).toContain('"recommendation": "rewrite"');
    expect(input).toContain('"Move the output format requirement earlier."');
    expect(input).toContain('If the recommendation is "skip"');
    expect(input).toContain('priorityMoves');
  });

  it('builds structured context with section flags for templates', () => {
    const context = buildRewriteFromEvaluationContext({
      type: 'result',
      mode: {
        functionMode: 'pro',
        subMode: 'multi',
      },
      result: {
        ...createEvaluationResponse(82, 'result'),
        improvements: ['先澄清再建议。'],
      },
    });

    expect(context.subjectLabel).toBe('多消息 system 提示词');
    expect(context.hasDimensionScoreLines).toBe(true);
    expect(context.hasRewriteTargetLines).toBe(true);
    expect(context.isResultEvaluation).toBe(true);
    expect(context.isCompareEvaluation).toBe(false);
  });

  it('builds a structured rewrite payload object', () => {
    const payload = buildRewritePayload({
      type: 'compare',
      mode: {
        functionMode: 'basic',
        subMode: 'system',
      },
      language: 'zh',
      workspacePrompt: '当前工作区 prompt',
      referencePrompt: '上一版 prompt',
      result: {
        ...createEvaluationResponse(81, 'compare'),
        summary: '比较总结',
        improvements: ['改进 A'],
        metadata: {
          compareStopSignals: {
            targetVsBaseline: 'improved',
            stopRecommendation: 'continue',
          },
          compareInsights: {
            learnableSignals: ['结构信号'],
            overfitWarnings: ['样例拟合风险'],
            conflictSignals: ['sampleOverfitRiskVisible'],
          },
        },
      },
    });

    expect(payload.scenario.evaluationTypeLabel).toBe('对比评估');
    expect(payload.sourcePrompts.workspacePrompt).toBe('当前工作区 prompt');
    expect(payload.sourcePrompts.referencePrompt).toBe('上一版 prompt');
    expect(payload.compressedEvaluation.compareStopSignals?.targetVsBaseline).toBe('improved');
    expect(payload.compressedEvaluation.compareInsights?.learnableSignals).toEqual(['结构信号']);
    expect(payload.compressedEvaluation.rewriteGuidance.recommendation).toBe('rewrite');
    expect(payload.compressedEvaluation.rewriteGuidance.focusAreas).toEqual(['generalization']);
    expect(payload.compressedEvaluation.rewriteGuidance.priorityMoves[0]).toContain('样例触发式规则');
    expect(payload.compressedEvaluation.learnableSignalLines).toEqual(['结构信号']);
    expect(payload.compressedEvaluation.overfitWarningLines).toEqual(['样例拟合风险']);
  });

  it('marks flat no-gap compare results as skip for rewrite gating', () => {
    const payload = buildRewritePayload({
      type: 'compare',
      mode: {
        functionMode: 'basic',
        subMode: 'system',
      },
      language: 'zh',
      workspacePrompt: '当前工作区 prompt',
      referencePrompt: '上一版 prompt',
      result: {
        ...createEvaluationResponse(84, 'compare'),
        summary: '核心结论等价，没有明显改进空间。',
        metadata: {
          compareStopSignals: {
            targetVsBaseline: 'flat',
            targetVsReferenceGap: 'none',
            improvementHeadroom: 'medium',
            overfitRisk: 'medium',
            stopRecommendation: 'continue',
          },
          compareInsights: {
            conflictSignals: ['sampleOverfitRiskVisible'],
          },
        },
      },
    });

    expect(payload.compressedEvaluation.rewriteGuidance.recommendation).toBe('skip');
    expect(payload.compressedEvaluation.rewriteGuidance.reasons[0]).toContain('flat');
  });

  it('marks low-headroom closed-gap compare results as minor rewrite', () => {
    const payload = buildRewritePayload({
      type: 'compare',
      mode: {
        functionMode: 'basic',
        subMode: 'system',
      },
      language: 'en',
      workspacePrompt: 'Current workspace prompt',
      referencePrompt: 'Previous prompt',
      result: {
        ...createEvaluationResponse(91, 'compare'),
        summary: 'Already strong, but there may still be tiny generalization polish.',
        metadata: {
          compareStopSignals: {
            targetVsBaseline: 'improved',
            targetVsReferenceGap: 'none',
            improvementHeadroom: 'low',
            overfitRisk: 'medium',
            stopRecommendation: 'review',
          },
          compareInsights: {
            conflictSignals: ['sampleOverfitRiskVisible'],
          },
        },
      },
    });

    expect(payload.compressedEvaluation.rewriteGuidance.recommendation).toBe('minor-rewrite');
    expect(payload.compressedEvaluation.rewriteGuidance.reasons.join(' ')).toContain('minimal');
  });

  it('adds decision-stability guidance when compare detects replica instability', () => {
    const payload = buildRewritePayload({
      type: 'compare',
      mode: {
        functionMode: 'basic',
        subMode: 'system',
      },
      language: 'en',
      workspacePrompt: 'Current workspace prompt',
      referencePrompt: 'Previous prompt',
      result: {
        ...createEvaluationResponse(78, 'compare'),
        summary: 'The current prompt looks stronger once, but the recommendation is unstable across replicas.',
        metadata: {
          compareStopSignals: {
            targetVsBaseline: 'improved',
            targetVsReferenceGap: 'none',
            improvementHeadroom: 'low',
            overfitRisk: 'high',
            stopRecommendation: 'review',
          },
          compareInsights: {
            conflictSignals: [
              'improvementUnstableAcrossReplicas',
              'sampleOverfitRiskVisible',
            ],
          },
        },
      },
    });

    expect(payload.compressedEvaluation.rewriteGuidance.recommendation).toBe('rewrite');
    expect(payload.compressedEvaluation.rewriteGuidance.focusAreas).toContain('decision-stability');
    expect(payload.compressedEvaluation.rewriteGuidance.priorityMoves.join(' ')).toContain('decision criteria');
    expect(payload.compressedEvaluation.rewriteGuidance.priorityMoves.join(' ')).toContain('tie-break');
  });

  it('normalizes locale into supported rewrite languages', () => {
    expect(normalizeRewriteLocaleLanguage('en-US')).toBe('en');
    expect(normalizeRewriteLocaleLanguage('EN')).toBe('en');
    expect(normalizeRewriteLocaleLanguage('zh-CN')).toBe('zh');
    expect(normalizeRewriteLocaleLanguage(undefined)).toBe('zh');
  });
});
