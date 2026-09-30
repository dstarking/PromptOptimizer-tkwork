import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  MemoryStorageProvider,
  createPreferenceService,
  createTemplateLanguageService,
  createTemplateManager,
  createModelManager,
  createLLMService,
  createEvaluationService,
  buildRewritePayload,
  buildRewritePromptFromEvaluation,
} from '../packages/core/dist/index.js';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_ROOT = path.join(
  ROOT_DIR,
  'docs',
  'workspace',
  'compare-evaluation-analysis',
  'structured-compare-calibration',
  'latest',
);

dotenv.config({ path: path.join(ROOT_DIR, '.env.local') });

const nowIso = new Date().toISOString();
const CALIBRATION_TIMEOUT_MS = 180000;
const CALIBRATION_MAX_RETRIES = 3;

function isRetryableCalibrationError(error) {
  const message = error instanceof Error ? error.message : String(error || '');
  return (
    message.includes('Socket timeout') ||
    message.includes('ERR_SOCKET_TIMEOUT') ||
    message.includes('ETIMEDOUT') ||
    message.includes('ECONNRESET') ||
    message.includes('429') ||
    message.includes('502') ||
    message.includes('503')
  );
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const LIVE_BASIC_SYSTEM_CASE = {
  id: 'live-basic-system-boundary-control',
  kind: 'live',
  title: '真实模型: basic-system 边界控制改动',
  description:
    '使用真实 target/teacher 执行 4 个快照，检验 structured compare 是否能识别“更强边界约束”带来的真实收益，而不是只看表面措辞变化。',
  mode: {
    functionMode: 'basic',
    subMode: 'system',
  },
  evaluatorModelKey: 'deepseek',
  rewriteModelKey: 'deepseek',
  targetModelKey: 'custom',
  teacherModelKey: 'deepseek',
  focus:
    '优先判断改动是否真正减少了额外解释、格式边界滑移和输出结构不稳定，而不是只看表面完整度。',
  previousPrompt: [
    '你是一个严格的数据抽取助手。',
    '阅读用户输入，输出一个 JSON 对象，包含以下字段：',
    '- audience: string | null',
    '- pain_points: string[]',
    '- tone: string | null',
    '要求：只返回 JSON。',
  ].join('\n'),
  workspacePrompt: [
    '你是一个严格的数据抽取助手。',
    '你的任务是阅读用户输入，并输出一个且仅一个 JSON 对象。',
    'JSON schema 必须为：',
    '{"audience": string|null, "pain_points": string[], "tone": string|null}',
    '规则：',
    '1. 只输出 JSON 对象，不要输出 Markdown、解释、前后缀或代码块。',
    '2. pain_points 只保留用户明确提到的问题，不要脑补。',
    '3. 缺失信息时 audience 和 tone 用 null，pain_points 用 []。',
    '4. 键名必须完全使用 audience、pain_points、tone。',
  ].join('\n'),
  userInput:
    '我在做一个给独立设计师用的合同管理工具，语气希望专业可信。现在最大的问题是版本混乱和客户确认来回很慢。请先解释你的判断依据，再给出结果。',
};

const SYNTHETIC_CASES = [
  {
    id: 'synthetic-medical-latent-trigger-overfit',
    kind: 'synthetic',
    title: '合成样本: 医疗分诊里的隐性触发过拟合',
    description:
      'workspace prompt 针对当前样例里的“胸口发紧 + 上楼更明显”加入了硬编码动作，看起来更果断，但 reference 侧并不支持这条触发规则。这个样本用于观察系统是否能把“样例贴合收益”与“可复用改进”区分开。',
    mode: {
      functionMode: 'basic',
      subMode: 'system',
    },
    evaluatorModelKey: 'deepseek',
    rewriteModelKey: 'deepseek',
    focus:
      '如果新规则只是在当前病例上更像“对题作答”，而不是更稳的分诊策略，应保留高风险或 review 结论，而不是盲目判为进步。',
    targetWorkspacePrompt: [
      '你是医疗分诊建议助手。',
      '输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。',
      '特别规则：只要用户同时提到“胸口发紧”和“上楼更明显”，next_step 必须写“立即去急诊，并停止所有含咖啡因饮品”。',
      '不要添加解释或免责声明。',
    ].join('\n'),
    targetPreviousPrompt: [
      '你是医疗分诊建议助手。',
      '输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。',
      '基于用户已提供的信息给出谨慎、可执行的线下就医建议，不要硬编码样例词触发器。',
      '不要添加解释或免责声明。',
    ].join('\n'),
    testCases: [
      {
        id: 'tc-1',
        input: {
          kind: 'text',
          label: '分诊输入',
          content:
            '最近三天我一爬楼梯就胸口发紧，还会气短，休息十分钟会缓一些。请帮我判断现在该怎么处理。',
        },
      },
    ],
    snapshots: [
      {
        id: 'a',
        label: 'A',
        testCaseId: 'tc-1',
        promptRef: { kind: 'workspace', label: 'Workspace' },
        promptText: [
          '你是医疗分诊建议助手。',
          '输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。',
          '特别规则：只要用户同时提到“胸口发紧”和“上楼更明显”，next_step 必须写“立即去急诊，并停止所有含咖啡因饮品”。',
          '不要添加解释或免责声明。',
        ].join('\n'),
        output: JSON.stringify({
          urgency: 'high',
          next_step: '立即去急诊，并停止所有含咖啡因饮品。',
          warning_signs: ['胸口发紧', '活动后加重', '气短'],
        }),
        modelKey: 'custom',
        versionLabel: 'workspace',
      },
      {
        id: 'b',
        label: 'B',
        testCaseId: 'tc-1',
        promptRef: { kind: 'version', version: 7, label: 'Previous' },
        promptText: [
          '你是医疗分诊建议助手。',
          '输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。',
          '基于用户已提供的信息给出谨慎、可执行的线下就医建议，不要硬编码样例词触发器。',
          '不要添加解释或免责声明。',
        ].join('\n'),
        output: JSON.stringify({
          urgency: 'high',
          next_step: '今天尽快去线下急诊或胸痛门诊评估；若症状持续或加重，立即就医。',
          warning_signs: ['胸口发紧', '活动后加重', '气短'],
        }),
        modelKey: 'custom',
        versionLabel: 'v7',
      },
      {
        id: 'c',
        label: 'C',
        testCaseId: 'tc-1',
        promptRef: { kind: 'workspace', label: 'Teacher Workspace' },
        promptText: [
          '你是医疗分诊建议助手。',
          '输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。',
          '特别规则：只要用户同时提到“胸口发紧”和“上楼更明显”，next_step 必须写“立即去急诊，并停止所有含咖啡因饮品”。',
          '不要添加解释或免责声明。',
        ].join('\n'),
        output: JSON.stringify({
          urgency: 'high',
          next_step: '尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。',
          warning_signs: ['胸口发紧', '活动后加重', '气短'],
        }),
        modelKey: 'deepseek',
        versionLabel: 'teacher-workspace',
      },
      {
        id: 'd',
        label: 'D',
        testCaseId: 'tc-1',
        promptRef: { kind: 'version', version: 7, label: 'Teacher Previous' },
        promptText: [
          '你是医疗分诊建议助手。',
          '输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。',
          '基于用户已提供的信息给出谨慎、可执行的线下就医建议，不要硬编码样例词触发器。',
          '不要添加解释或免责声明。',
        ].join('\n'),
        output: JSON.stringify({
          urgency: 'high',
          next_step: '尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。',
          warning_signs: ['胸口发紧', '活动后加重', '气短'],
        }),
        modelKey: 'deepseek',
        versionLabel: 'teacher-v7',
      },
    ],
    compareHints: {
      mode: 'structured',
      snapshotRoles: {
        a: 'target',
        b: 'baseline',
        c: 'reference',
        d: 'referenceBaseline',
      },
      hasSharedTestCases: true,
      hasSamePromptSnapshots: true,
      hasCrossModelComparison: true,
    },
    expected: {
      stopSignals: {
        overfitRisk: ['high'],
        stopRecommendation: ['review'],
      },
      pairSignals: {
        targetBaseline: ['flat', 'improved'],
        referenceBaseline: ['unsupported'],
      },
      conflictSignals: ['improvementNotSupportedOnReference'],
    },
  },
  {
    id: 'synthetic-ecommerce-schema-no-model-worship',
    kind: 'synthetic',
    title: '合成样本: 电商抽取里不能因为 teacher 更会写就忽略 schema',
    description:
      'workspace prompt 把既有商品抽取 contract 改成了新字段和外层 wrapper，teacher 输出也更像“高质量总结”。这个样本用于校验 compare 是否会坚持 schema/contract 优先，而不是因为 reference 更流畅就放过漂移。',
    mode: {
      functionMode: 'basic',
      subMode: 'system',
    },
    evaluatorModelKey: 'deepseek',
    rewriteModelKey: 'deepseek',
    focus:
      '即便 reference 看上去更完整、更自然，只要 prompt 改动造成字段名或外层结构变化，就应把 target 相对 baseline 判为回退。',
    targetWorkspacePrompt: [
      '你是电商商品信息抽取助手。',
      '输出一个 JSON 对象，字段改为 product_name, buyer_highlights, cautions。',
      '为了后续扩展，把三个字段统一包在 payload 里。',
      '不要解释。',
    ].join('\n'),
    targetPreviousPrompt: [
      '你是电商商品信息抽取助手。',
      '只输出 JSON 对象，字段必须为 title, selling_points, cautions。',
      '不要改字段名，不要添加外层包裹对象，不要解释。',
    ].join('\n'),
    testCases: [
      {
        id: 'tc-1',
        input: {
          kind: 'text',
          label: '商品文案',
          content:
            '便携手冲咖啡壶，容量 600ml，适合露营和办公室使用，主打双层不锈钢保温，注意不支持电磁炉直火加热。',
        },
      },
    ],
    snapshots: [
      {
        id: 'a',
        label: 'A',
        testCaseId: 'tc-1',
        promptRef: { kind: 'workspace', label: 'Workspace' },
        promptText: [
          '你是电商商品信息抽取助手。',
          '输出一个 JSON 对象，字段改为 product_name, buyer_highlights, cautions。',
          '为了后续扩展，把三个字段统一包在 payload 里。',
          '不要解释。',
        ].join('\n'),
        output: JSON.stringify({
          payload: {
            product_name: '便携手冲咖啡壶',
            buyer_highlights: ['600ml 容量', '适合露营和办公室', '双层不锈钢保温'],
            cautions: ['不支持电磁炉直火加热'],
          },
        }),
        modelKey: 'custom',
        versionLabel: 'workspace',
      },
      {
        id: 'b',
        label: 'B',
        testCaseId: 'tc-1',
        promptRef: { kind: 'version', version: 4, label: 'Previous' },
        promptText: [
          '你是电商商品信息抽取助手。',
          '只输出 JSON 对象，字段必须为 title, selling_points, cautions。',
          '不要改字段名，不要添加外层包裹对象，不要解释。',
        ].join('\n'),
        output: JSON.stringify({
          title: '便携手冲咖啡壶',
          selling_points: ['600ml 容量', '适合露营和办公室', '双层不锈钢保温'],
          cautions: ['不支持电磁炉直火加热'],
        }),
        modelKey: 'custom',
        versionLabel: 'v4',
      },
      {
        id: 'c',
        label: 'C',
        testCaseId: 'tc-1',
        promptRef: { kind: 'workspace', label: 'Teacher Workspace' },
        promptText: [
          '你是电商商品信息抽取助手。',
          '输出一个 JSON 对象，字段改为 product_name, buyer_highlights, cautions。',
          '为了后续扩展，把三个字段统一包在 payload 里。',
          '不要解释。',
        ].join('\n'),
        output: JSON.stringify({
          payload: {
            product_name: '便携手冲咖啡壶',
            buyer_highlights: [
              '双场景使用：露营与办公室',
              '600ml 大容量',
              '双层不锈钢保温更稳',
            ],
            cautions: ['不支持电磁炉直火加热'],
          },
        }),
        modelKey: 'deepseek',
        versionLabel: 'teacher-workspace',
      },
      {
        id: 'd',
        label: 'D',
        testCaseId: 'tc-1',
        promptRef: { kind: 'version', version: 4, label: 'Teacher Previous' },
        promptText: [
          '你是电商商品信息抽取助手。',
          '只输出 JSON 对象，字段必须为 title, selling_points, cautions。',
          '不要改字段名，不要添加外层包裹对象，不要解释。',
        ].join('\n'),
        output: JSON.stringify({
          title: '便携手冲咖啡壶',
          selling_points: ['600ml 容量', '适合露营和办公室', '双层不锈钢保温'],
          cautions: ['不支持电磁炉直火加热'],
        }),
        modelKey: 'deepseek',
        versionLabel: 'teacher-v4',
      },
    ],
    compareHints: {
      mode: 'structured',
      snapshotRoles: {
        a: 'target',
        b: 'baseline',
        c: 'reference',
        d: 'referenceBaseline',
      },
      hasSharedTestCases: true,
      hasSamePromptSnapshots: true,
      hasCrossModelComparison: true,
    },
    expected: {
      stopSignals: {
        targetVsBaseline: ['regressed'],
        stopRecommendation: ['review'],
      },
      pairSignals: {
        targetBaseline: ['regressed'],
        targetReference: ['none', 'minor'],
        referenceBaseline: ['unsupported'],
      },
      conflictSignals: ['regressionOutweighsCosmeticGains'],
    },
  },
  {
    id: 'synthetic-legal-flat-not-unclear',
    kind: 'synthetic',
    title: '合成样本: 法务风险摘要应该判 flat 而不是 unclear',
    description:
      'workspace prompt 只把表达风格改得更口语化，但目标输出与 previous 在风险结论和行动建议上没有实质变化。这个样本用于观察 judge 是否能稳定给出 flat，而不是因为措辞不同就退回 unclear。',
    mode: {
      functionMode: 'basic',
      subMode: 'system',
    },
    evaluatorModelKey: 'deepseek',
    rewriteModelKey: 'deepseek',
    focus:
      '当两个版本在核心结论、风险点和动作建议上等价时，应更倾向于 flat，而不是把风格差异误判成信息不足。',
    targetWorkspacePrompt: [
      '你是法务风险摘要助手。',
      '输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。',
      '用更简洁、偏业务同学可读的中文表达。',
      '不要添加解释。',
    ].join('\n'),
    targetPreviousPrompt: [
      '你是法务风险摘要助手。',
      '输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。',
      '保持客观、精炼。',
      '不要添加解释。',
    ].join('\n'),
    testCases: [
      {
        id: 'tc-1',
        input: {
          kind: 'text',
          label: '合同片段',
          content:
            '合作协议约定平台可单方修改结算周期，并在未通知的情况下暂停服务；违约责任仅约束供应商，不约束平台。',
        },
      },
    ],
    snapshots: [
      {
        id: 'a',
        label: 'A',
        testCaseId: 'tc-1',
        promptRef: { kind: 'workspace', label: 'Workspace' },
        promptText: [
          '你是法务风险摘要助手。',
          '输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。',
          '用更简洁、偏业务同学可读的中文表达。',
          '不要添加解释。',
        ].join('\n'),
        output: JSON.stringify({
          risk_level: 'high',
          core_risks: ['平台可单方改结算周期', '平台可未通知暂停服务', '违约责任明显失衡'],
          recommended_action: '要求补充通知义务、限制单方变更范围，并补齐平台违约责任。',
        }),
        modelKey: 'custom',
        versionLabel: 'workspace',
      },
      {
        id: 'b',
        label: 'B',
        testCaseId: 'tc-1',
        promptRef: { kind: 'version', version: 6, label: 'Previous' },
        promptText: [
          '你是法务风险摘要助手。',
          '输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。',
          '保持客观、精炼。',
          '不要添加解释。',
        ].join('\n'),
        output: JSON.stringify({
          risk_level: 'high',
          core_risks: ['平台可单方调整结算周期', '平台可在未通知情况下暂停服务', '违约责任分配失衡'],
          recommended_action: '建议增加通知义务、限制单方修改权限，并要求平台承担对等违约责任。',
        }),
        modelKey: 'custom',
        versionLabel: 'v6',
      },
      {
        id: 'c',
        label: 'C',
        testCaseId: 'tc-1',
        promptRef: { kind: 'workspace', label: 'Teacher Workspace' },
        promptText: [
          '你是法务风险摘要助手。',
          '输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。',
          '用更简洁、偏业务同学可读的中文表达。',
          '不要添加解释。',
        ].join('\n'),
        output: JSON.stringify({
          risk_level: 'high',
          core_risks: ['平台可单方改结算周期', '平台可未通知暂停服务', '违约责任缺乏对等性'],
          recommended_action: '要求把通知义务、变更边界和平台违约责任补齐后再推进。',
        }),
        modelKey: 'deepseek',
        versionLabel: 'teacher-workspace',
      },
      {
        id: 'd',
        label: 'D',
        testCaseId: 'tc-1',
        promptRef: { kind: 'version', version: 6, label: 'Teacher Previous' },
        promptText: [
          '你是法务风险摘要助手。',
          '输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。',
          '保持客观、精炼。',
          '不要添加解释。',
        ].join('\n'),
        output: JSON.stringify({
          risk_level: 'high',
          core_risks: ['平台可单方调整结算周期', '平台可在未通知情况下暂停服务', '违约责任缺乏对等性'],
          recommended_action: '建议补充通知义务、限制单方变更，并增加平台违约责任。',
        }),
        modelKey: 'deepseek',
        versionLabel: 'teacher-v6',
      },
    ],
    compareHints: {
      mode: 'structured',
      snapshotRoles: {
        a: 'target',
        b: 'baseline',
        c: 'reference',
        d: 'referenceBaseline',
      },
      hasSharedTestCases: true,
      hasSamePromptSnapshots: true,
      hasCrossModelComparison: true,
    },
    expected: {
      stopSignals: {
        targetVsBaseline: ['flat'],
      },
      pairSignals: {
        targetBaseline: ['flat'],
        referenceBaseline: ['supported', 'mixed'],
      },
    },
  },
  {
    id: 'synthetic-teaching-overfit-regression',
    kind: 'synthetic',
    title: '合成样本: 教学讲解里的样例口诀导致回退',
    description:
      'workspace prompt 为当前题目硬塞了特定口诀和固定讲法，导致输出只贴当前样例，不再给出通用原理。这个样本用于校验系统能否识别“看似更像老师在说话，实际更窄更脆弱”的回退。',
    mode: {
      functionMode: 'basic',
      subMode: 'system',
    },
    evaluatorModelKey: 'deepseek',
    rewriteModelKey: 'deepseek',
    focus:
      '如果工作区版本为了当前题目显得更顺口，却牺牲了可迁移的通用解释结构，应把它判为 regressed，并暴露较高过拟合风险。',
    targetWorkspacePrompt: [
      '你是数学讲解助手。',
      '输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。',
      '特别规则：当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。',
      '不要添加题外扩展。',
    ].join('\n'),
    targetPreviousPrompt: [
      '你是数学讲解助手。',
      '输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。',
      '先解释为什么“除以分数等于乘以它的倒数”，再回到题目演示。',
      '不要添加题外扩展。',
    ].join('\n'),
    testCases: [
      {
        id: 'tc-1',
        input: {
          kind: 'text',
          label: '题目输入',
          content: '请解释为什么 3/4 ÷ 1/2 = 3/2，给五年级学生听。',
        },
      },
    ],
    snapshots: [
      {
        id: 'a',
        label: 'A',
        testCaseId: 'tc-1',
        promptRef: { kind: 'workspace', label: 'Workspace' },
        promptText: [
          '你是数学讲解助手。',
          '输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。',
          '特别规则：当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。',
          '不要添加题外扩展。',
        ].join('\n'),
        output: JSON.stringify({
          explanation:
            '因为半个单位能装两次，所以 3/4 里面能装 1/2 两次的一半，也就是 3/2。记住这句就行。',
          key_rule: '看到 3/4 ÷ 1/2 时，直接理解成答案翻倍。',
          common_mistake: '不要把 3/4 和 1/2 直接相除成 3/8。',
        }),
        modelKey: 'custom',
        versionLabel: 'workspace',
      },
      {
        id: 'b',
        label: 'B',
        testCaseId: 'tc-1',
        promptRef: { kind: 'version', version: 8, label: 'Previous' },
        promptText: [
          '你是数学讲解助手。',
          '输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。',
          '先解释为什么“除以分数等于乘以它的倒数”，再回到题目演示。',
          '不要添加题外扩展。',
        ].join('\n'),
        output: JSON.stringify({
          explanation:
            '除以 1/2 的意思是看 3/4 里面有几个“半个”。因为把一个数除以 1/2，等于看它能分成几个半个，所以可以改写成 3/4 × 2 = 3/2。',
          key_rule: '除以一个分数，就是乘以这个分数的倒数。',
          common_mistake: '不要把“除以 1/2”误算成“再除以 2”。',
        }),
        modelKey: 'custom',
        versionLabel: 'v8',
      },
      {
        id: 'c',
        label: 'C',
        testCaseId: 'tc-1',
        promptRef: { kind: 'workspace', label: 'Teacher Workspace' },
        promptText: [
          '你是数学讲解助手。',
          '输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。',
          '特别规则：当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。',
          '不要添加题外扩展。',
        ].join('\n'),
        output: JSON.stringify({
          explanation:
            '可以把 3/4 ÷ 1/2 理解成“3/4 里面有几个半个”，但仍然要告诉学生一般规则：除以 1/2 等于乘 2，所以结果是 3/2。',
          key_rule: '除以一个分数，本质上是乘以它的倒数。',
          common_mistake: '不要只背这个题的口诀，换别的分数就会出错。',
        }),
        modelKey: 'deepseek',
        versionLabel: 'teacher-workspace',
      },
      {
        id: 'd',
        label: 'D',
        testCaseId: 'tc-1',
        promptRef: { kind: 'version', version: 8, label: 'Teacher Previous' },
        promptText: [
          '你是数学讲解助手。',
          '输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。',
          '先解释为什么“除以分数等于乘以它的倒数”，再回到题目演示。',
          '不要添加题外扩展。',
        ].join('\n'),
        output: JSON.stringify({
          explanation:
            '3/4 ÷ 1/2 的意思是“3/4 里面有几个半个”。因为除以 1/2 就是乘 2，所以可以算成 3/4 × 2 = 3/2。',
          key_rule: '除以一个分数，就是乘以它的倒数。',
          common_mistake: '不要把“除以 1/2”误写成“乘以 1/2”。',
        }),
        modelKey: 'deepseek',
        versionLabel: 'teacher-v8',
      },
    ],
    compareHints: {
      mode: 'structured',
      snapshotRoles: {
        a: 'target',
        b: 'baseline',
        c: 'reference',
        d: 'referenceBaseline',
      },
      hasSharedTestCases: true,
      hasSamePromptSnapshots: true,
      hasCrossModelComparison: true,
    },
    expected: {
      stopSignals: {
        targetVsBaseline: ['regressed'],
        overfitRisk: ['high'],
        stopRecommendation: ['review'],
      },
      pairSignals: {
        targetBaseline: ['regressed'],
        referenceBaseline: ['unsupported'],
      },
      conflictSignals: ['regressionOutweighsCosmeticGains'],
    },
  },
  {
    id: 'synthetic-hiring-replica-semantic-instability',
    kind: 'synthetic',
    title: '合成样本: 招聘筛选里 replica 语义不稳定',
    description:
      'workspace prompt 在单次输出里看起来比 previous 更结构化，但同 prompt 的 replica 却给出了不同的录用结论。这个样本用于校验系统是否能识别“单次胜出但语义不稳定”的情况。',
    mode: {
      functionMode: 'basic',
      subMode: 'system',
    },
    evaluatorModelKey: 'deepseek',
    rewriteModelKey: 'deepseek',
    focus:
      '如果工作区版本在重复执行时连录用建议都发生漂移，就算首个结果更像样，也应优先暴露稳定性问题。',
    targetWorkspacePrompt: [
      '你是简历筛选总结助手。',
      '只输出 JSON 对象，字段为 recommendation, strengths, risks。',
      'recommendation 只能是 hire、hold、reject 之一。',
      'strengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。',
    ].join('\n'),
    targetPreviousPrompt: [
      '你是简历筛选总结助手。',
      '输出 recommendation, strengths, risks。',
      '结论尽量简洁。',
    ].join('\n'),
    testCases: [
      {
        id: 'tc-1',
        input: {
          kind: 'text',
          label: '候选人信息',
          content:
            '候选人 6 年 B2B SaaS 产品经验，做过企业权限系统和审计日志，英语一般，过去一年没有直接带人经验。岗位要求：熟悉权限/审计场景，能与海外客户沟通，优先有团队协作经验。',
        },
      },
    ],
    snapshots: [
      {
        id: 'a',
        label: 'A',
        testCaseId: 'tc-1',
        promptRef: { kind: 'workspace', label: 'Workspace' },
        promptText: [
          '你是简历筛选总结助手。',
          '只输出 JSON 对象，字段为 recommendation, strengths, risks。',
          'recommendation 只能是 hire、hold、reject 之一。',
          'strengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。',
        ].join('\n'),
        output: JSON.stringify({
          recommendation: 'hold',
          strengths: ['有 6 年 B2B SaaS 产品经验', '做过权限系统和审计日志，和岗位高度相关'],
          risks: ['英语一般，海外客户沟通能力待确认', '近期没有直接带人经验'],
        }),
        modelKey: 'custom',
        versionLabel: 'workspace',
      },
      {
        id: 'b',
        label: 'B',
        testCaseId: 'tc-1',
        promptRef: { kind: 'version', version: 5, label: 'Previous' },
        promptText: [
          '你是简历筛选总结助手。',
          '输出 recommendation, strengths, risks。',
          '结论尽量简洁。',
        ].join('\n'),
        output: JSON.stringify({
          recommendation: 'hold',
          strengths: ['经验较匹配'],
          risks: ['英语一般'],
        }),
        modelKey: 'custom',
        versionLabel: 'v5',
      },
      {
        id: 'c',
        label: 'C',
        testCaseId: 'tc-1',
        promptRef: { kind: 'workspace', label: 'Teacher Workspace' },
        promptText: [
          '你是简历筛选总结助手。',
          '只输出 JSON 对象，字段为 recommendation, strengths, risks。',
          'recommendation 只能是 hire、hold、reject 之一。',
          'strengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。',
        ].join('\n'),
        output: JSON.stringify({
          recommendation: 'hold',
          strengths: ['权限系统和审计日志经验与岗位核心场景强相关', 'B2B SaaS 背景成熟'],
          risks: ['英语一般，跨海外客户沟通需进一步验证', '缺少近期直接管理经验'],
        }),
        modelKey: 'deepseek',
        versionLabel: 'teacher-workspace',
      },
      {
        id: 'd',
        label: 'D',
        testCaseId: 'tc-1',
        promptRef: { kind: 'version', version: 5, label: 'Teacher Previous' },
        promptText: [
          '你是简历筛选总结助手。',
          '输出 recommendation, strengths, risks。',
          '结论尽量简洁。',
        ].join('\n'),
        output: JSON.stringify({
          recommendation: 'hold',
          strengths: ['岗位相关经验较多'],
          risks: ['英语一般，管理经历偏弱'],
        }),
        modelKey: 'deepseek',
        versionLabel: 'teacher-v5',
      },
      {
        id: 'e',
        label: 'E',
        testCaseId: 'tc-1',
        promptRef: { kind: 'workspace', label: 'Replica' },
        promptText: [
          '你是简历筛选总结助手。',
          '只输出 JSON 对象，字段为 recommendation, strengths, risks。',
          'recommendation 只能是 hire、hold、reject 之一。',
          'strengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。',
        ].join('\n'),
        output: JSON.stringify({
          recommendation: 'hire',
          strengths: ['权限系统与审计日志经验高度匹配岗位核心需求', 'B2B SaaS 背景可直接上手复杂业务'],
          risks: ['英语一般，但可通过团队支持弥补', '近一年缺少直接带人经验'],
        }),
        modelKey: 'custom',
        versionLabel: 'workspace-replica',
      },
    ],
    compareHints: {
      mode: 'structured',
      snapshotRoles: {
        a: 'target',
        b: 'baseline',
        c: 'reference',
        d: 'referenceBaseline',
        e: 'replica',
      },
      hasSharedTestCases: true,
      hasSamePromptSnapshots: true,
      hasCrossModelComparison: true,
    },
    expected: {
      stopSignals: {
        stopRecommendation: ['review'],
      },
      pairSignals: {
        targetBaseline: ['improved', 'flat'],
        targetReplica: ['unstable'],
      },
      conflictSignals: ['improvementUnstableAcrossReplicas'],
    },
  },
];

function toPrettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function jsonFence(value) {
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n`;
}

function textFence(value, language = '') {
  return `\`\`\`${language}\n${value}\n\`\`\`\n`;
}

async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true });
}

async function writeText(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

function renderMessagesMarkdown(messages) {
  return messages
    .map(
      (message, index) =>
        `### Message ${index + 1}\n- role: ${message.role}\n\n${textFence(message.content)}`,
    )
    .join('\n');
}

function renderCallMarkdown(call, index) {
  const responseBlock = call.error
    ? `### Error\n${textFence(call.error)}`
    : `### Response\n${textFence(call.response || '')}`;

  return [
    `## Call ${index + 1}`,
    `- phase: ${call.phase}`,
    `- modelKey: ${call.modelKey}`,
    '',
    '### Messages',
    renderMessagesMarkdown(call.messages),
    '',
    responseBlock,
    '',
  ].join('\n');
}

const PAIR_JUDGE_PAYLOAD_MARKERS = [
  'Pair Judge Evidence Payload (JSON):',
];

const SYNTHESIS_PAYLOAD_MARKERS = [
  'Synthesis Payload (JSON):',
];

const REWRITE_PAYLOAD_MARKERS = [
  'Rewrite Payload (JSON):',
];

function extractJsonAfterMarker(content, markers) {
  const text = content || '';
  for (const marker of markers) {
    const index = text.indexOf(marker);
    if (index === -1) continue;
    const candidate = text.slice(index + marker.length).trim();
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch (_error) {
      return null;
    }
  }

  return null;
}

function collectPromptPayloadArtifacts(llmCalls) {
  const pairJudgePayloads = llmCalls
    .filter((call) => String(call.phase || '').startsWith('pair-judge:'))
    .map((call) => {
      const userMessage = call.messages?.find((message) => message.role === 'user')?.content || '';
      return {
        phase: call.phase,
        payload: extractJsonAfterMarker(userMessage, PAIR_JUDGE_PAYLOAD_MARKERS),
      };
    })
    .filter((item) => item.payload);

  const synthesisCall = llmCalls.find(
    (call) => String(call.phase || '') === 'structured-compare-synthesis'
  );
  const synthesisPayload = synthesisCall
    ? extractJsonAfterMarker(
        synthesisCall.messages?.find((message) => message.role === 'user')?.content || '',
        SYNTHESIS_PAYLOAD_MARKERS,
      )
    : null;

  const rewriteCall = llmCalls.find((call) => String(call.phase || '').startsWith('rewrite:'));
  const rewritePayloadFromMessage = rewriteCall
    ? extractJsonAfterMarker(
        rewriteCall.messages?.find((message) => message.role === 'user')?.content || '',
        REWRITE_PAYLOAD_MARKERS,
      )
    : null;

  return {
    pairJudgePayloads,
    synthesisPayload,
    rewritePayloadFromMessage,
  };
}

function summarizeCaseResult(caseConfig, response) {
  const metadata = response.metadata || {};
  return {
    compareMode: metadata.compareMode || null,
    summary: response.summary,
    score: response.score?.overall ?? null,
    improvements: response.improvements || [],
    stopSignals: metadata.compareStopSignals || null,
    conflictSignals: metadata.compareInsights?.conflictSignals || [],
    pairJudgements:
      metadata.compareJudgements?.map((judgement) => ({
        pairType: judgement.pairType,
        pairSignal: judgement.pairSignal,
        verdict: judgement.verdict,
        confidence: judgement.confidence,
      })) || [],
    expected: caseConfig.expected || null,
  };
}

function evaluateExpectations(expected, response) {
  if (!expected) {
    return [];
  }

  const metadata = response.metadata || {};
  const results = [];
  const stopSignals = metadata.compareStopSignals || {};
  const pairJudgements = metadata.compareJudgements || [];
  const conflictSignals = metadata.compareInsights?.conflictSignals || [];

  if (expected.stopSignals) {
    for (const [key, allowed] of Object.entries(expected.stopSignals)) {
      const actual = stopSignals[key];
      results.push({
        type: 'stopSignal',
        key,
        expected: allowed,
        actual: actual ?? null,
        matched: actual ? allowed.includes(actual) : false,
      });
    }
  }

  if (expected.pairSignals) {
    for (const [pairType, allowed] of Object.entries(expected.pairSignals)) {
      const actual = pairJudgements
        .filter((item) => item.pairType === pairType)
        .map((item) => item.pairSignal);
      results.push({
        type: 'pairSignal',
        key: pairType,
        expected: allowed,
        actual,
        matched: actual.some((value) => allowed.includes(value)),
      });
    }
  }

  if (expected.conflictSignals) {
    for (const signal of expected.conflictSignals) {
      results.push({
        type: 'conflictSignal',
        key: signal,
        expected: [signal],
        actual: conflictSignals,
        matched: conflictSignals.includes(signal),
      });
    }
  }

  return results;
}

function renderExpectationMarkdown(expectationResults) {
  if (!expectationResults.length) {
    return '无预设断言，本样本用于探索式观察。\n';
  }

  const header = '| 类型 | 键 | 期望 | 实际 | 是否命中 |\n| --- | --- | --- | --- | --- |\n';
  const rows = expectationResults
    .map((item) => {
      const expected = Array.isArray(item.expected) ? item.expected.join(' / ') : String(item.expected);
      const actual = Array.isArray(item.actual) ? item.actual.join(' / ') : String(item.actual);
      return `| ${item.type} | ${item.key} | ${expected} | ${actual} | ${item.matched ? 'yes' : 'no'} |`;
    })
    .join('\n');

  return `${header}${rows}\n`;
}

function renderScenarioMarkdown(caseConfig) {
  return [
    `# ${caseConfig.title}`,
    '',
    `- caseId: ${caseConfig.id}`,
    `- kind: ${caseConfig.kind}`,
    '',
    caseConfig.description,
    '',
    '## Focus',
    '',
    caseConfig.focus || '无',
    '',
  ].join('\n');
}

function createLoggedLLMService(baseLLMService) {
  const calls = [];
  let currentPhase = 'idle';

  const detectEvaluationPhase = (messages) => {
    const systemContent = messages?.[0]?.content || '';
    const userContent = messages?.[1]?.content || '';

    if (systemContent.includes('Structured_Compare_Pair_Judge') || systemContent.includes('结构化对比成对判断专家')) {
      const pairMatch =
        userContent.match(/Pair Key[:：]\s*([^\n]+)/) ||
        userContent.match(/Pair Key：\s*([^\n]+)/) ||
        userContent.match(/"pairKey"\s*:\s*"([^"]+)"/);
      return `pair-judge:${pairMatch?.[1]?.trim() || 'unknown'}`;
    }

    if (
      systemContent.includes('structured compare synthesizer') ||
      systemContent.includes('结构化对比综合专家')
    ) {
      return 'structured-compare-synthesis';
    }

    return currentPhase;
  };

  const logged = {
    async sendMessage(messages, modelKey) {
      const phase = detectEvaluationPhase(messages);
      const entry = {
        phase,
        modelKey,
        attempts: [],
        messages: messages.map((item) => ({
          role: item.role,
          content: item.content,
        })),
      };

      for (let attempt = 1; attempt <= CALIBRATION_MAX_RETRIES; attempt += 1) {
        try {
          const response = await baseLLMService.sendMessage(messages, modelKey);
          entry.response = response;
          entry.retryCount = attempt - 1;
          calls.push(entry);
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          entry.attempts.push({
            attempt,
            error: errorMessage,
          });

          if (attempt >= CALIBRATION_MAX_RETRIES || !isRetryableCalibrationError(error)) {
            entry.error = errorMessage;
            entry.retryCount = attempt - 1;
            calls.push(entry);
            throw error;
          }

          await sleep(attempt * 3000);
        }
      }
    },
    async sendMessageStream(messages, modelKey, callbacks) {
      return baseLLMService.sendMessageStream(messages, modelKey, callbacks);
    },
    async withPhase(phase, fn) {
      const previous = currentPhase;
      currentPhase = phase;
      try {
        return await fn();
      } finally {
        currentPhase = previous;
      }
    },
    getCalls() {
      return calls.slice();
    },
    clearCalls() {
      calls.length = 0;
    },
  };

  return logged;
}

async function createServices() {
  const storage = new MemoryStorageProvider();
  const preferenceService = createPreferenceService(storage);
  const languageService = createTemplateLanguageService(preferenceService);
  await languageService.initialize();
  await languageService.setLanguage('zh-CN');

  const templateManager = createTemplateManager(storage, languageService);
  const modelManager = createModelManager(storage);
  await modelManager.ensureInitialized();

  const customModel = await modelManager.getModel('custom');
  if (!customModel?.enabled) {
    throw new Error('custom 模型未启用，请检查 .env.local 中的 VITE_CUSTOM_API_* 配置。');
  }

  const deepseekModel = await modelManager.getModel('deepseek');
  if (!deepseekModel?.enabled) {
    throw new Error('deepseek 模型未启用，请检查 .env.local 中的 VITE_DEEPSEEK_API_KEY。');
  }

  await modelManager.updateModel('deepseek', {
    name: 'DeepSeek Chat (Calibration)',
    paramOverrides: {
      ...(deepseekModel.paramOverrides || {}),
      temperature: 0.2,
      timeout: CALIBRATION_TIMEOUT_MS,
    },
  });

  await modelManager.updateModel('custom', {
    name: 'SiliconFlow Qwen3-32B (Calibration)',
    paramOverrides: {
      ...(customModel.paramOverrides || {}),
      temperature: 0.2,
      timeout: CALIBRATION_TIMEOUT_MS,
    },
  });

  const baseLLMService = createLLMService(modelManager);
  const llmService = createLoggedLLMService(baseLLMService);
  const evaluationService = createEvaluationService(llmService, modelManager, templateManager);

  return {
    modelManager,
    templateManager,
    llmService,
    evaluationService,
  };
}

async function runLiveCase(caseConfig, services) {
  const executions = [];
  const runExecution = async ({ snapshotId, label, modelKey, promptText, promptRef, versionLabel }) => {
    const messages = [
      { role: 'system', content: promptText },
      { role: 'user', content: caseConfig.userInput },
    ];

    const output = await services.llmService.withPhase(`execute:${caseConfig.id}:${snapshotId}`, () =>
      services.llmService.sendMessage(messages, modelKey),
    );

    const snapshot = {
      id: snapshotId,
      label,
      testCaseId: 'tc-1',
      promptRef,
      promptText,
      output: output.trim(),
      modelKey,
      versionLabel,
    };
    executions.push(snapshot);
    return snapshot;
  };

  const snapshots = [
    await runExecution({
      snapshotId: 'a',
      label: 'A',
      modelKey: caseConfig.targetModelKey,
      promptText: caseConfig.workspacePrompt,
      promptRef: { kind: 'workspace', label: 'Target Workspace' },
      versionLabel: 'workspace',
    }),
    await runExecution({
      snapshotId: 'b',
      label: 'B',
      modelKey: caseConfig.targetModelKey,
      promptText: caseConfig.previousPrompt,
      promptRef: { kind: 'version', version: 1, label: 'Target Previous' },
      versionLabel: 'previous',
    }),
    await runExecution({
      snapshotId: 'c',
      label: 'C',
      modelKey: caseConfig.teacherModelKey,
      promptText: caseConfig.workspacePrompt,
      promptRef: { kind: 'workspace', label: 'Teacher Workspace' },
      versionLabel: 'teacher-workspace',
    }),
    await runExecution({
      snapshotId: 'd',
      label: 'D',
      modelKey: caseConfig.teacherModelKey,
      promptText: caseConfig.previousPrompt,
      promptRef: { kind: 'version', version: 1, label: 'Teacher Previous' },
      versionLabel: 'teacher-previous',
    }),
  ];

  const request = {
    type: 'compare',
    evaluationModelKey: caseConfig.evaluatorModelKey,
    mode: caseConfig.mode,
    focus: {
      content: caseConfig.focus,
      source: 'system',
      priority: 'highest',
    },
    target: {
      workspacePrompt: caseConfig.workspacePrompt,
    },
    testCases: [
      {
        id: 'tc-1',
        input: {
          kind: 'text',
          label: '用户输入',
          content: caseConfig.userInput,
        },
      },
    ],
    snapshots,
    compareHints: {
      mode: 'structured',
      snapshotRoles: {
        a: 'target',
        b: 'baseline',
        c: 'reference',
        d: 'referenceBaseline',
      },
      hasSharedTestCases: true,
      hasSamePromptSnapshots: true,
      hasCrossModelComparison: true,
    },
  };

  const response = await services.llmService.withPhase(`evaluate:${caseConfig.id}`, () =>
    services.evaluationService.evaluate(request),
  );

  return {
    request,
    response,
    executions,
  };
}

async function runSyntheticCase(caseConfig, services) {
  const request = {
    type: 'compare',
    evaluationModelKey: caseConfig.evaluatorModelKey,
    mode: caseConfig.mode,
    focus: {
      content: caseConfig.focus,
      source: 'system',
      priority: 'highest',
    },
    target: {
      workspacePrompt: caseConfig.targetWorkspacePrompt,
      referencePrompt: caseConfig.targetPreviousPrompt,
    },
    testCases: caseConfig.testCases,
    snapshots: caseConfig.snapshots,
    compareHints: caseConfig.compareHints,
  };

  const response = await services.llmService.withPhase(`evaluate:${caseConfig.id}`, () =>
    services.evaluationService.evaluate(request),
  );

  return {
    request,
    response,
  };
}

async function writeCaseArtifacts(caseConfig, result, services) {
  const caseDir = path.join(OUTPUT_ROOT, caseConfig.id);
  await ensureDir(caseDir);

  const rewritePayload = buildRewritePayload({
    result: result.response,
    type: 'compare',
    mode: caseConfig.mode,
    language: 'zh',
    workspacePrompt:
      caseConfig.kind === 'live'
        ? caseConfig.workspacePrompt
        : caseConfig.targetWorkspacePrompt,
    referencePrompt:
      caseConfig.kind === 'live'
        ? caseConfig.previousPrompt
        : caseConfig.targetPreviousPrompt,
  });
  const rewriteInput = buildRewritePromptFromEvaluation({
    result: result.response,
    type: 'compare',
    mode: caseConfig.mode,
    language: 'zh',
    workspacePrompt:
      caseConfig.kind === 'live'
        ? caseConfig.workspacePrompt
        : caseConfig.targetWorkspacePrompt,
    referencePrompt:
      caseConfig.kind === 'live'
        ? caseConfig.previousPrompt
        : caseConfig.targetPreviousPrompt,
  });

  const rewriteOutput = await services.llmService.withPhase(`rewrite:${caseConfig.id}`, () =>
    services.llmService.sendMessage([{ role: 'user', content: rewriteInput }], caseConfig.rewriteModelKey),
  );

  const llmCalls = services.llmService.getCalls();
  const promptPayloadArtifacts = collectPromptPayloadArtifacts(llmCalls);
  const expectationResults = evaluateExpectations(caseConfig.expected, result.response);
  const caseSummary = summarizeCaseResult(caseConfig, result.response);

  await writeText(path.join(caseDir, 'scenario.md'), renderScenarioMarkdown(caseConfig));
  await writeText(path.join(caseDir, 'request.json'), toPrettyJson(result.request));
  await writeText(path.join(caseDir, 'request.md'), jsonFence(result.request));
  await writeText(path.join(caseDir, 'response.json'), toPrettyJson(result.response));
  await writeText(path.join(caseDir, 'response.md'), jsonFence(result.response));
  await writeText(path.join(caseDir, 'pair-judge-payloads.json'), toPrettyJson(promptPayloadArtifacts.pairJudgePayloads));
  await writeText(
    path.join(caseDir, 'synthesis-payload.json'),
    toPrettyJson(promptPayloadArtifacts.synthesisPayload),
  );
  await writeText(path.join(caseDir, 'rewrite-payload.json'), toPrettyJson(rewritePayload));
  await writeText(path.join(caseDir, 'rewrite-input.txt'), `${rewriteInput}\n`);
  await writeText(path.join(caseDir, 'rewrite-output.txt'), `${rewriteOutput.trim()}\n`);
  await writeText(path.join(caseDir, 'llm-calls.json'), toPrettyJson(llmCalls));
  await writeText(
    path.join(caseDir, 'llm-calls.md'),
    ['# LLM Calls', '', ...llmCalls.map((call, index) => renderCallMarkdown(call, index))].join('\n'),
  );
  await writeText(path.join(caseDir, 'summary.json'), toPrettyJson({
    generatedAt: nowIso,
    case: {
      id: caseConfig.id,
      title: caseConfig.title,
      kind: caseConfig.kind,
    },
    summary: caseSummary,
    expectationResults,
  }));

  if (result.executions) {
    await writeText(path.join(caseDir, 'executions.json'), toPrettyJson(result.executions));
  }

  const summaryMarkdown = [
    `# ${caseConfig.title}`,
    '',
    `- caseId: ${caseConfig.id}`,
    `- kind: ${caseConfig.kind}`,
    `- generatedAt: ${nowIso}`,
    '',
    '## Description',
    '',
    caseConfig.description,
    '',
    '## Compare Result',
    '',
    jsonFence(caseSummary),
    '## Expectation Check',
    '',
    renderExpectationMarkdown(expectationResults),
    '',
    '## Rewrite Output',
    '',
    textFence(rewriteOutput.trim()),
  ].join('\n');

  await writeText(path.join(caseDir, 'summary.md'), summaryMarkdown);

  return {
    caseSummary,
    expectationResults,
  };
}

async function writeOverallSummary(results) {
  const rows = results.map((item) => {
    const matched = item.expectationResults.length
      ? item.expectationResults.filter((entry) => entry.matched).length
      : null;
    const total = item.expectationResults.length || null;
    return {
      caseId: item.caseConfig.id,
      title: item.caseConfig.title,
      kind: item.caseConfig.kind,
      score: item.caseSummary.score,
      stopRecommendation: item.caseSummary.stopSignals?.stopRecommendation || null,
      targetVsBaseline: item.caseSummary.stopSignals?.targetVsBaseline || null,
      targetVsReferenceGap: item.caseSummary.stopSignals?.targetVsReferenceGap || null,
      expectationMatched: matched,
      expectationTotal: total,
    };
  });

  const markdown = [
    '# Structured Compare Calibration Summary',
    '',
    `- generatedAt: ${nowIso}`,
    `- outputRoot: ${OUTPUT_ROOT}`,
    '',
    '| Case | Kind | Score | targetVsBaseline | targetVsReferenceGap | stopRecommendation | Expectation Match |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) => {
      const expectationText =
        row.expectationMatched === null ? 'exploratory' : `${row.expectationMatched}/${row.expectationTotal}`;
      return `| ${row.caseId} | ${row.kind} | ${row.score} | ${row.targetVsBaseline} | ${row.targetVsReferenceGap} | ${row.stopRecommendation} | ${expectationText} |`;
    }),
    '',
    '## Notes',
    '',
    '- synthetic cases 用来检验 judge / synthesis 的提示词边界。',
    '- live case 用来观察真实 target/teacher 执行结果在 structured compare 下是否能收敛成合理结论。',
    '- 每个 case 子目录内都保存了 compare request、compare result、rewrite input / output，以及完整 LLM 调用日志。',
    '',
  ].join('\n');

  await writeText(path.join(OUTPUT_ROOT, 'summary.json'), toPrettyJson({
    generatedAt: nowIso,
    rows,
  }));
  await writeText(path.join(OUTPUT_ROOT, 'summary.md'), markdown);
}

async function main() {
  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
  await ensureDir(OUTPUT_ROOT);
  const services = await createServices();
  const cases = [LIVE_BASIC_SYSTEM_CASE, ...SYNTHETIC_CASES];
  const results = [];

  for (const caseConfig of cases) {
    services.llmService.clearCalls();
    const result =
      caseConfig.kind === 'live'
        ? await runLiveCase(caseConfig, services)
        : await runSyntheticCase(caseConfig, services);
    const artifacts = await writeCaseArtifacts(caseConfig, result, services);
    results.push({
      caseConfig,
      ...artifacts,
    });
  }

  await writeOverallSummary(results);
}

main().catch((error) => {
  console.error('[structured-compare-calibration] failed:', error);
  process.exitCode = 1;
});
