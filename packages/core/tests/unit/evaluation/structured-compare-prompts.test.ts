import { describe, expect, it } from 'vitest';
import {
  buildStructuredComparePairJudgeMessages,
  buildStructuredCompareSynthesisMessages,
} from '../../../src/services/evaluation/structured-compare-prompts';

describe('structured-compare-prompts', () => {
  it('builds zh pair-judge prompt without escaping rendered evidence', () => {
    const messages = buildStructuredComparePairJudgeMessages({
      language: 'zh',
      pairGuidance: '- 如果更强一侧只是更贴合当前样例，应下调结论。',
      payload: {
        scenario: {
          language: 'zh',
          pairKey: 'target-vs-baseline',
          pairType: 'targetBaseline',
          pairLabel: 'Target vs Previous',
          purpose: '判断当前版本是否进步',
          signalName: 'progress',
          allowedSignalValues: ['improved', 'flat', 'regressed', 'unclear'],
          focusBrief: '优先检查结构稳定性',
        },
        roleBindings: [
          {
            snapshotId: 'snap-a',
            snapshotLabel: 'A',
            role: 'target',
            roleLabel: 'Target',
          },
        ],
        testCases: [
          {
            id: 'tc-1',
            label: '测试用例 tc-1',
            input: {
              kind: 'text',
              label: '任务输入',
              content: 'Input A',
            },
          },
        ],
        leftSnapshot: {
          id: 'snap-a',
          label: 'A',
          role: 'target',
          roleLabel: 'Target',
          testCaseId: 'tc-1',
          promptRef: { kind: 'workspace', label: 'Workspace' },
          promptText: 'Prompt A',
          output: 'Output A',
        },
        rightSnapshot: {
          id: 'snap-b',
          label: 'B',
          role: 'baseline',
          roleLabel: 'Baseline',
          testCaseId: 'tc-1',
          promptRef: { kind: 'version', label: 'Previous' },
          promptText: 'Prompt B',
          output: 'Output B',
        },
      },
    });

    expect(messages).toHaveLength(2);
    expect(messages[0].content).toContain('结构化对比成对判断专家');
    expect(messages[0].content).toContain('"pairKey": "target-vs-baseline"');
    expect(messages[0].content).toContain('硬边界违例属于真实负面证据');
    expect(messages[0].content).toContain('“效果方向”和“泛化风险”必须分开判断');
    expect(messages[0].content).toContain('analysis、evidence、verdict、winner 和 pairSignal 必须互相一致');
    expect(messages[1].content).toContain('Pair Judge Evidence Payload (JSON):');
    expect(messages[1].content).toContain('"roleBindings"');
    expect(messages[1].content).toContain('"allowedSignalValues"');
    expect(messages[1].content).toContain('"focusBrief": "优先检查结构稳定性"');
    expect(messages[1].content).toContain('Output A');
    expect(messages[1].content).not.toContain('&#x3D;');
  });

  it('builds en synthesis prompt with scenario and hints', () => {
    const messages = buildStructuredCompareSynthesisMessages({
      language: 'en',
      payload: {
        scenario: {
          language: 'en',
          roleName: 'Structured System Prompt Compare Synthesizer',
          subjectLabel: 'system prompt',
          sharedCompareInputs: true,
          samePromptAcrossSnapshots: false,
          crossModelComparison: true,
          focusBrief: 'Keep reusable improvements only',
        },
        roleBindings: [
          {
            snapshotId: 'snap-a',
            snapshotLabel: 'A',
            role: 'target',
            roleLabel: 'Target',
          },
        ],
        deterministicHints: {
          priorityOrder: ['targetBaseline', 'targetReference'],
          signalSnapshot: {
            progress: 'improved',
          },
          derivedStopSignals: {
            stopRecommendation: 'review',
          },
          learnableSignals: ['Keep structure stable'],
          overfitWarnings: ['Avoid sample hacks'],
          conflictSignals: [
            {
              key: 'sampleOverfitRiskVisible',
              description: 'Prefer conservative conclusions when overfit risk is visible.',
            },
          ],
        },
        judgeResults: [
          {
            pairKey: 'target-vs-baseline',
            pairType: 'targetBaseline',
            pairSignal: 'improved',
          },
        ],
      },
    });

    expect(messages).toHaveLength(2);
    expect(messages[0].content).toContain('Structured System Prompt Compare Synthesizer');
    expect(messages[0].content).toContain('"compareMode": "generic | structured"');
    expect(messages[0].content).toContain('internal inconsistency between its analysis and its evidence');
    expect(messages[1].content).toContain('Synthesis Payload (JSON):');
    expect(messages[1].content).toContain('"sharedCompareInputs": true');
    expect(messages[1].content).toContain('"crossModelComparison": true');
    expect(messages[1].content).toContain('"deterministicHints"');
    expect(messages[1].content).toContain('"judgeResults"');
  });
});
