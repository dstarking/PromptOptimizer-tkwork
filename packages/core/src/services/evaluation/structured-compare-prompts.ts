import { TemplateProcessor } from '../template/processor';
import type { Message } from '../llm/types';
import type { CompareStopSignals } from './types';
import {
  compareJsonContractEn,
  compareJsonContractZh,
} from '../template/default-templates/evaluation/builders';
import { template as pairJudgeTemplateZh } from '../template/default-templates/evaluation-structured-compare/pair-judge';
import { template as pairJudgeTemplateEn } from '../template/default-templates/evaluation-structured-compare/pair-judge_en';
import { template as synthesisTemplateZh } from '../template/default-templates/evaluation-structured-compare/synthesis';
import { template as synthesisTemplateEn } from '../template/default-templates/evaluation-structured-compare/synthesis_en';

export type StructuredComparePromptLanguage = 'zh' | 'en';

const jsonFence = (content: string) => `\`\`\`json
${content}
\`\`\``;

const stringifyPayload = (value: unknown): string => JSON.stringify(value, null, 2);

export interface StructuredCompareRoleBindingPromptPayload {
  snapshotId: string;
  snapshotLabel: string;
  role: string;
  roleLabel: string;
}

export interface StructuredCompareContentPromptPayload {
  kind: string;
  label: string;
  content: string;
  summary?: string;
}

export interface StructuredCompareTestCasePromptPayload {
  id: string;
  label?: string;
  input: StructuredCompareContentPromptPayload;
  settingsSummary?: string;
}

export interface StructuredCompareSnapshotPromptPayload {
  id: string;
  label: string;
  role?: string;
  roleLabel?: string;
  testCaseId: string;
  testCaseLabel?: string;
  promptRef: {
    kind: string;
    label: string;
  };
  promptText: string;
  modelKey?: string;
  versionLabel?: string;
  output: string;
  reasoning?: string;
  executionInput?: StructuredCompareContentPromptPayload;
}

export interface StructuredComparePairJudgePayload {
  scenario: {
    language: StructuredComparePromptLanguage;
    pairKey: string;
    pairType: string;
    pairLabel: string;
    purpose: string;
    signalName: string;
    allowedSignalValues: string[];
    focusBrief?: string;
  };
  roleBindings: StructuredCompareRoleBindingPromptPayload[];
  testCases: StructuredCompareTestCasePromptPayload[];
  leftSnapshot: StructuredCompareSnapshotPromptPayload;
  rightSnapshot: StructuredCompareSnapshotPromptPayload;
}

export interface StructuredCompareSynthesisDeterministicHintsPayload {
  priorityOrder: string[];
  signalSnapshot: {
    progress?: string;
    gap?: string;
    promptValidity?: string;
    stability?: string;
  };
  derivedStopSignals?: CompareStopSignals;
  learnableSignals: string[];
  overfitWarnings: string[];
  conflictSignals: Array<{
    key: string;
    description: string;
  }>;
}

export interface StructuredCompareSynthesisPayload {
  scenario: {
    language: StructuredComparePromptLanguage;
    roleName: string;
    subjectLabel: string;
    sharedCompareInputs: boolean;
    samePromptAcrossSnapshots: boolean;
    crossModelComparison: boolean;
    focusBrief?: string;
  };
  roleBindings: StructuredCompareRoleBindingPromptPayload[];
  deterministicHints: StructuredCompareSynthesisDeterministicHintsPayload;
  judgeResults: unknown[];
}

export interface StructuredComparePairJudgePromptParams {
  language: StructuredComparePromptLanguage;
  pairGuidance: string;
  payload: StructuredComparePairJudgePayload;
}

export interface StructuredCompareSynthesisPromptParams {
  language: StructuredComparePromptLanguage;
  payload: StructuredCompareSynthesisPayload;
}

const buildPairJudgeJsonContract = (
  pairKey: string,
  pairType: string,
  allowedSignalValues: string[],
): string =>
  jsonFence(`{
  "pairKey": "${pairKey}",
  "pairType": "${pairType}",
  "verdict": "left-better | right-better | mixed | similar",
  "winner": "left | right | none",
  "confidence": "low | medium | high",
  "pairSignal": "${allowedSignalValues.join(' | ')}",
  "analysis": "<one short paragraph>",
  "evidence": ["<evidence-grounded difference>"],
  "learnableSignals": ["<reusable structural signal>"],
  "overfitWarnings": ["<sample-specific or overfit risk>"]
}`);

export const buildStructuredComparePairJudgePayloadJson = (
  payload: StructuredComparePairJudgePayload,
): string => stringifyPayload(payload);

export const buildStructuredComparePairJudgeMessages = (
  params: StructuredComparePairJudgePromptParams,
): Message[] => {
  const template = params.language === 'en' ? pairJudgeTemplateEn : pairJudgeTemplateZh;
  const messages = TemplateProcessor.processTemplate(template, {
    pairGuidance: params.pairGuidance,
    pairJudgeJsonContract: buildPairJudgeJsonContract(
      params.payload.scenario.pairKey,
      params.payload.scenario.pairType,
      params.payload.scenario.allowedSignalValues,
    ),
    pairJudgePayloadJson: buildStructuredComparePairJudgePayloadJson(params.payload),
  });

  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
};

export const buildStructuredCompareSynthesisPayloadJson = (
  payload: StructuredCompareSynthesisPayload,
): string => stringifyPayload(payload);

export const buildStructuredCompareSynthesisMessages = (
  params: StructuredCompareSynthesisPromptParams,
): Message[] => {
  const template = params.language === 'en' ? synthesisTemplateEn : synthesisTemplateZh;
  const compareJsonContract =
    params.language === 'en' ? compareJsonContractEn : compareJsonContractZh;

  const messages = TemplateProcessor.processTemplate(template, {
    roleName: params.payload.scenario.roleName,
    compareJsonContract,
    synthesisPayloadJson: buildStructuredCompareSynthesisPayloadJson(params.payload),
  });

  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
};
