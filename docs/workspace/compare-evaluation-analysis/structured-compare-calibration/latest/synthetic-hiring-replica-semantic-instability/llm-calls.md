# LLM Calls

## Call 1
- phase: pair-judge:target-vs-reference
- modelKey: deepseek

### Messages
### Message 1
- role: system

```
# Role: 结构化对比成对判断专家

## Goal
- 只判断一个 structured compare pair，并把证据压缩成供后续综合阶段使用的中间结果。

## Rules
1. 只能使用当前 pair 的测试输入和这两个执行快照。
2. verdict 只允许：left-better、right-better、mixed、similar。
3. winner 只允许：left、right、none。
4. confidence 只允许：low、medium、high。
5. pairSignal 只能使用本 pair 允许的枚举；如果不确定，写 unclear。
6. 明确的硬边界违例属于真实负面证据，不是可忽略的小噪声。包括但不限于：要求外的额外说明、Markdown / code fence、字段改名、额外键、缺失必填键、包裹文本、输出协议漂移。
7. “效果方向”和“泛化风险”必须分开判断。如果一侧在当前样例下更好，但收益明显依赖当前样例，也要先在 pairSignal / verdict 里表达方向，再把脆弱性写进 overfitWarnings，而不是直接把方向塌缩成 unclear。
8. analysis、evidence、verdict、winner 和 pairSignal 必须互相一致。如果 evidence 已经表明某一侧违反了硬规则、漏掉了必须动作，结论里就不能反过来说它更好。
9. learnableSignals 只能保留可复用、结构性的信号，不得写只对当前样例有效的内容补丁。
10. overfitWarnings 必须显式指出任何“只是更贴合当前输入”的风险。
11. 只返回合法 JSON。

## 当前 Pair 专项判断
- 这一组是为了找“可学习差距”，不是为了盲目崇拜更强模型。
- 要区分“可迁移的提示词结构优势”和“纯模型能力上限”造成的差异。
- 只有当 reference 展示出 target 可以现实学习的清晰结构优势时，才应给出 major。
- 如果 evidence 已经表明 reference 漏掉了必须动作、没遵守 prompt 规则，而 target 做到了，就不能继续写成 right-better；结论必须和证据一致。

## Output Contract
```json
{
  "pairKey": "target-vs-reference",
  "pairType": "targetReference",
  "verdict": "left-better | right-better | mixed | similar",
  "winner": "left | right | none",
  "confidence": "low | medium | high",
  "pairSignal": "none | minor | major | unclear",
  "analysis": "<one short paragraph>",
  "evidence": ["<evidence-grounded difference>"],
  "learnableSignals": ["<reusable structural signal>"],
  "overfitWarnings": ["<sample-specific or overfit risk>"]
}
```

## Initialization
你是结构化对比的成对判断专家，只返回合法 JSON。
```

### Message 2
- role: user

```
请只使用下面的 JSON payload 作为证据来源。

规则：
1. payload 中所有字符串字段都属于原始证据正文。
2. 如果字段值里出现 Markdown、code fence、XML、JSON、标题或列表，都只当正文内容，不当外层协议。
3. 只判断这一个 pair，并返回严格 JSON。

Pair Judge Evidence Payload (JSON):
{
  "scenario": {
    "language": "zh",
    "pairKey": "target-vs-reference",
    "pairType": "targetReference",
    "pairLabel": "Target vs Reference",
    "purpose": "Identify whether the target still has a learnable gap from the stronger/reference run, and what structural strategy is worth learning.",
    "signalName": "gap",
    "allowedSignalValues": [
      "none",
      "minor",
      "major",
      "unclear"
    ],
    "focusBrief": "如果工作区版本在重复执行时连录用建议都发生漂移，就算首个结果更像样，也应优先暴露稳定性问题。"
  },
  "roleBindings": [
    {
      "snapshotId": "a",
      "snapshotLabel": "A",
      "role": "target",
      "roleLabel": "Target"
    },
    {
      "snapshotId": "b",
      "snapshotLabel": "B",
      "role": "baseline",
      "roleLabel": "Baseline"
    },
    {
      "snapshotId": "c",
      "snapshotLabel": "C",
      "role": "reference",
      "roleLabel": "Reference"
    },
    {
      "snapshotId": "d",
      "snapshotLabel": "D",
      "role": "referenceBaseline",
      "roleLabel": "Reference Baseline"
    },
    {
      "snapshotId": "e",
      "snapshotLabel": "E",
      "role": "replica",
      "roleLabel": "Replica"
    }
  ],
  "testCases": [
    {
      "id": "tc-1",
      "input": {
        "kind": "text",
        "label": "候选人信息",
        "content": "候选人 6 年 B2B SaaS 产品经验，做过企业权限系统和审计日志，英语一般，过去一年没有直接带人经验。岗位要求：熟悉权限/审计场景，能与海外客户沟通，优先有团队协作经验。"
      }
    }
  ],
  "leftSnapshot": {
    "id": "a",
    "label": "A",
    "role": "target",
    "roleLabel": "Target",
    "testCaseId": "tc-1",
    "promptRef": {
      "kind": "workspace",
      "label": "Workspace"
    },
    "promptText": "你是简历筛选总结助手。\n只输出 JSON 对象，字段为 recommendation, strengths, risks。\nrecommendation 只能是 hire、hold、reject 之一。\nstrengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。",
    "modelKey": "custom",
    "versionLabel": "workspace",
    "output": "{\"recommendation\":\"hold\",\"strengths\":[\"有 6 年 B2B SaaS 产品经验\",\"做过权限系统和审计日志，和岗位高度相关\"],\"risks\":[\"英语一般，海外客户沟通能力待确认\",\"近期没有直接带人经验\"]}"
  },
  "rightSnapshot": {
    "id": "c",
    "label": "C",
    "role": "reference",
    "roleLabel": "Reference",
    "testCaseId": "tc-1",
    "promptRef": {
      "kind": "workspace",
      "label": "Teacher Workspace"
    },
    "promptText": "你是简历筛选总结助手。\n只输出 JSON 对象，字段为 recommendation, strengths, risks。\nrecommendation 只能是 hire、hold、reject 之一。\nstrengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-workspace",
    "output": "{\"recommendation\":\"hold\",\"strengths\":[\"权限系统和审计日志经验与岗位核心场景强相关\",\"B2B SaaS 背景成熟\"],\"risks\":[\"英语一般，跨海外客户沟通需进一步验证\",\"缺少近期直接管理经验\"]}"
  }
}
```


### Response
```
```json
{
    "pairKey": "target-vs-reference",
    "pairType": "targetReference",
    "verdict": "similar",
    "winner": "none",
    "confidence": "high",
    "pairSignal": "none",
    "analysis": "Target 和 Reference 的输出在核心判断、证据组织和格式合规性上高度一致，均正确遵循了 prompt 规则，未发现可学习的结构性差距。",
    "evidence": ["两者 recommendation 均为 'hold'，判断逻辑一致。", "两者 strengths 均聚焦于 B2B SaaS 经验和权限/审计日志场景，与岗位要求高度相关。", "两者 risks 均指出了英语沟通和近期管理经验问题，紧扣岗位要求。", "两者均输出合法 JSON，字段正确，无额外说明或格式违例。"],
    "learnableSignals": [],
    "overfitWarnings": []
}
```
```


## Call 2
- phase: pair-judge:target-vs-replica
- modelKey: deepseek

### Messages
### Message 1
- role: system

```
# Role: 结构化对比成对判断专家

## Goal
- 只判断一个 structured compare pair，并把证据压缩成供后续综合阶段使用的中间结果。

## Rules
1. 只能使用当前 pair 的测试输入和这两个执行快照。
2. verdict 只允许：left-better、right-better、mixed、similar。
3. winner 只允许：left、right、none。
4. confidence 只允许：low、medium、high。
5. pairSignal 只能使用本 pair 允许的枚举；如果不确定，写 unclear。
6. 明确的硬边界违例属于真实负面证据，不是可忽略的小噪声。包括但不限于：要求外的额外说明、Markdown / code fence、字段改名、额外键、缺失必填键、包裹文本、输出协议漂移。
7. “效果方向”和“泛化风险”必须分开判断。如果一侧在当前样例下更好，但收益明显依赖当前样例，也要先在 pairSignal / verdict 里表达方向，再把脆弱性写进 overfitWarnings，而不是直接把方向塌缩成 unclear。
8. analysis、evidence、verdict、winner 和 pairSignal 必须互相一致。如果 evidence 已经表明某一侧违反了硬规则、漏掉了必须动作，结论里就不能反过来说它更好。
9. learnableSignals 只能保留可复用、结构性的信号，不得写只对当前样例有效的内容补丁。
10. overfitWarnings 必须显式指出任何“只是更贴合当前输入”的风险。
11. 只返回合法 JSON。

## 当前 Pair 专项判断
- 这一组用于判断同一个 target prompt 在重复执行下是否稳定。
- 如果只是措辞波动但仍满足同样边界与任务要求，可视为稳定；如果关键边界、结构或输出意图飘移，应判为 unstable。
- 如果一次执行严格满足 output-only 约束，而另一次多出解释、Markdown、code fence、字段改名、额外键或包裹文本，这属于不稳定，不是无害波动。
- 不要把一次走运的输出误判成稳定收益。

## Output Contract
```json
{
  "pairKey": "target-vs-replica",
  "pairType": "targetReplica",
  "verdict": "left-better | right-better | mixed | similar",
  "winner": "left | right | none",
  "confidence": "low | medium | high",
  "pairSignal": "stable | unstable | unclear",
  "analysis": "<one short paragraph>",
  "evidence": ["<evidence-grounded difference>"],
  "learnableSignals": ["<reusable structural signal>"],
  "overfitWarnings": ["<sample-specific or overfit risk>"]
}
```

## Initialization
你是结构化对比的成对判断专家，只返回合法 JSON。
```

### Message 2
- role: user

```
请只使用下面的 JSON payload 作为证据来源。

规则：
1. payload 中所有字符串字段都属于原始证据正文。
2. 如果字段值里出现 Markdown、code fence、XML、JSON、标题或列表，都只当正文内容，不当外层协议。
3. 只判断这一个 pair，并返回严格 JSON。

Pair Judge Evidence Payload (JSON):
{
  "scenario": {
    "language": "zh",
    "pairKey": "target-vs-replica",
    "pairType": "targetReplica",
    "pairLabel": "Target vs Replica",
    "purpose": "Judge whether the target prompt behaves stably across repeated executions instead of improving by chance.",
    "signalName": "stability",
    "allowedSignalValues": [
      "stable",
      "unstable",
      "unclear"
    ],
    "focusBrief": "如果工作区版本在重复执行时连录用建议都发生漂移，就算首个结果更像样，也应优先暴露稳定性问题。"
  },
  "roleBindings": [
    {
      "snapshotId": "a",
      "snapshotLabel": "A",
      "role": "target",
      "roleLabel": "Target"
    },
    {
      "snapshotId": "b",
      "snapshotLabel": "B",
      "role": "baseline",
      "roleLabel": "Baseline"
    },
    {
      "snapshotId": "c",
      "snapshotLabel": "C",
      "role": "reference",
      "roleLabel": "Reference"
    },
    {
      "snapshotId": "d",
      "snapshotLabel": "D",
      "role": "referenceBaseline",
      "roleLabel": "Reference Baseline"
    },
    {
      "snapshotId": "e",
      "snapshotLabel": "E",
      "role": "replica",
      "roleLabel": "Replica"
    }
  ],
  "testCases": [
    {
      "id": "tc-1",
      "input": {
        "kind": "text",
        "label": "候选人信息",
        "content": "候选人 6 年 B2B SaaS 产品经验，做过企业权限系统和审计日志，英语一般，过去一年没有直接带人经验。岗位要求：熟悉权限/审计场景，能与海外客户沟通，优先有团队协作经验。"
      }
    }
  ],
  "leftSnapshot": {
    "id": "a",
    "label": "A",
    "role": "target",
    "roleLabel": "Target",
    "testCaseId": "tc-1",
    "promptRef": {
      "kind": "workspace",
      "label": "Workspace"
    },
    "promptText": "你是简历筛选总结助手。\n只输出 JSON 对象，字段为 recommendation, strengths, risks。\nrecommendation 只能是 hire、hold、reject 之一。\nstrengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。",
    "modelKey": "custom",
    "versionLabel": "workspace",
    "output": "{\"recommendation\":\"hold\",\"strengths\":[\"有 6 年 B2B SaaS 产品经验\",\"做过权限系统和审计日志，和岗位高度相关\"],\"risks\":[\"英语一般，海外客户沟通能力待确认\",\"近期没有直接带人经验\"]}"
  },
  "rightSnapshot": {
    "id": "e",
    "label": "E",
    "role": "replica",
    "roleLabel": "Replica",
    "testCaseId": "tc-1",
    "promptRef": {
      "kind": "workspace",
      "label": "Replica"
    },
    "promptText": "你是简历筛选总结助手。\n只输出 JSON 对象，字段为 recommendation, strengths, risks。\nrecommendation 只能是 hire、hold、reject 之一。\nstrengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。",
    "modelKey": "custom",
    "versionLabel": "workspace-replica",
    "output": "{\"recommendation\":\"hire\",\"strengths\":[\"权限系统与审计日志经验高度匹配岗位核心需求\",\"B2B SaaS 背景可直接上手复杂业务\"],\"risks\":[\"英语一般，但可通过团队支持弥补\",\"近一年缺少直接带人经验\"]}"
  }
}
```


### Response
```
```json
{
    "pairKey": "target-vs-replica",
    "pairType": "targetReplica",
    "verdict": "mixed",
    "winner": "none",
    "confidence": "high",
    "pairSignal": "unstable",
    "analysis": "在重复执行中，目标提示词产生了不一致的输出，核心的录用建议（recommendation）从“hold”漂移到了“hire”，同时风险（risks）的表述也发生了实质性变化，表明其行为不稳定，而非无害的措辞波动。",
    "evidence": ["核心字段 `recommendation` 的值从 `\"hold\"` (left) 变为 `\"hire\"` (right)。", "`risks` 字段中关于“英语一般”的表述从客观描述“海外客户沟通能力待确认” (left) 变为带有主观判断的“但可通过团队支持弥补” (right)。"],
    "learnableSignals": ["重复执行时，核心决策字段（如 recommendation）的值发生漂移是典型的不稳定信号。", "风险（risks）的表述从客观事实转向主观辩护，表明输出意图或模型内部推理路径不一致。"],
    "overfitWarnings": ["右侧（replica）输出中“但可通过团队支持弥补”的表述，可能过度拟合了当前输入中“英语一般”这一具体信息，并进行了超出要求的乐观推断。"]
}
```
```


## Call 3
- phase: pair-judge:reference-vs-reference-baseline
- modelKey: deepseek

### Messages
### Message 1
- role: system

```
# Role: 结构化对比成对判断专家

## Goal
- 只判断一个 structured compare pair，并把证据压缩成供后续综合阶段使用的中间结果。

## Rules
1. 只能使用当前 pair 的测试输入和这两个执行快照。
2. verdict 只允许：left-better、right-better、mixed、similar。
3. winner 只允许：left、right、none。
4. confidence 只允许：low、medium、high。
5. pairSignal 只能使用本 pair 允许的枚举；如果不确定，写 unclear。
6. 明确的硬边界违例属于真实负面证据，不是可忽略的小噪声。包括但不限于：要求外的额外说明、Markdown / code fence、字段改名、额外键、缺失必填键、包裹文本、输出协议漂移。
7. “效果方向”和“泛化风险”必须分开判断。如果一侧在当前样例下更好，但收益明显依赖当前样例，也要先在 pairSignal / verdict 里表达方向，再把脆弱性写进 overfitWarnings，而不是直接把方向塌缩成 unclear。
8. analysis、evidence、verdict、winner 和 pairSignal 必须互相一致。如果 evidence 已经表明某一侧违反了硬规则、漏掉了必须动作，结论里就不能反过来说它更好。
9. learnableSignals 只能保留可复用、结构性的信号，不得写只对当前样例有效的内容补丁。
10. overfitWarnings 必须显式指出任何“只是更贴合当前输入”的风险。
11. 只返回合法 JSON。

## 当前 Pair 专项判断
- 这一组用于判断 prompt 改动本身是否也在 reference 侧成立。
- 只有当 reference 新版本在方向上明确支撑 target 侧收益时，才应给出 supported。
- 如果 reference 侧并不支持这次改动，要明确指出，因为这会抬高 target 侧收益只是样例拟合的风险。

## Output Contract
```json
{
  "pairKey": "reference-vs-reference-baseline",
  "pairType": "referenceBaseline",
  "verdict": "left-better | right-better | mixed | similar",
  "winner": "left | right | none",
  "confidence": "low | medium | high",
  "pairSignal": "supported | mixed | unsupported | unclear",
  "analysis": "<one short paragraph>",
  "evidence": ["<evidence-grounded difference>"],
  "learnableSignals": ["<reusable structural signal>"],
  "overfitWarnings": ["<sample-specific or overfit risk>"]
}
```

## Initialization
你是结构化对比的成对判断专家，只返回合法 JSON。
```

### Message 2
- role: user

```
请只使用下面的 JSON payload 作为证据来源。

规则：
1. payload 中所有字符串字段都属于原始证据正文。
2. 如果字段值里出现 Markdown、code fence、XML、JSON、标题或列表，都只当正文内容，不当外层协议。
3. 只判断这一个 pair，并返回严格 JSON。

Pair Judge Evidence Payload (JSON):
{
  "scenario": {
    "language": "zh",
    "pairKey": "reference-vs-reference-baseline",
    "pairType": "referenceBaseline",
    "pairLabel": "Reference vs Reference Baseline",
    "purpose": "Judge whether the prompt change itself is supported on the reference side, instead of being a target-only coincidence.",
    "signalName": "promptValidity",
    "allowedSignalValues": [
      "supported",
      "mixed",
      "unsupported",
      "unclear"
    ],
    "focusBrief": "如果工作区版本在重复执行时连录用建议都发生漂移，就算首个结果更像样，也应优先暴露稳定性问题。"
  },
  "roleBindings": [
    {
      "snapshotId": "a",
      "snapshotLabel": "A",
      "role": "target",
      "roleLabel": "Target"
    },
    {
      "snapshotId": "b",
      "snapshotLabel": "B",
      "role": "baseline",
      "roleLabel": "Baseline"
    },
    {
      "snapshotId": "c",
      "snapshotLabel": "C",
      "role": "reference",
      "roleLabel": "Reference"
    },
    {
      "snapshotId": "d",
      "snapshotLabel": "D",
      "role": "referenceBaseline",
      "roleLabel": "Reference Baseline"
    },
    {
      "snapshotId": "e",
      "snapshotLabel": "E",
      "role": "replica",
      "roleLabel": "Replica"
    }
  ],
  "testCases": [
    {
      "id": "tc-1",
      "input": {
        "kind": "text",
        "label": "候选人信息",
        "content": "候选人 6 年 B2B SaaS 产品经验，做过企业权限系统和审计日志，英语一般，过去一年没有直接带人经验。岗位要求：熟悉权限/审计场景，能与海外客户沟通，优先有团队协作经验。"
      }
    }
  ],
  "leftSnapshot": {
    "id": "c",
    "label": "C",
    "role": "reference",
    "roleLabel": "Reference",
    "testCaseId": "tc-1",
    "promptRef": {
      "kind": "workspace",
      "label": "Teacher Workspace"
    },
    "promptText": "你是简历筛选总结助手。\n只输出 JSON 对象，字段为 recommendation, strengths, risks。\nrecommendation 只能是 hire、hold、reject 之一。\nstrengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-workspace",
    "output": "{\"recommendation\":\"hold\",\"strengths\":[\"权限系统和审计日志经验与岗位核心场景强相关\",\"B2B SaaS 背景成熟\"],\"risks\":[\"英语一般，跨海外客户沟通需进一步验证\",\"缺少近期直接管理经验\"]}"
  },
  "rightSnapshot": {
    "id": "d",
    "label": "D",
    "role": "referenceBaseline",
    "roleLabel": "Reference Baseline",
    "testCaseId": "tc-1",
    "promptRef": {
      "kind": "version",
      "label": "Teacher Previous"
    },
    "promptText": "你是简历筛选总结助手。\n输出 recommendation, strengths, risks。\n结论尽量简洁。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-v5",
    "output": "{\"recommendation\":\"hold\",\"strengths\":[\"岗位相关经验较多\"],\"risks\":[\"英语一般，管理经历偏弱\"]}"
  }
}
```


### Response
```
```json
{
    "pairKey": "reference-vs-reference-baseline",
    "pairType": "referenceBaseline",
    "verdict": "left-better",
    "winner": "left",
    "confidence": "high",
    "pairSignal": "supported",
    "analysis": "左侧（Reference）的提示词明确要求输出结构化JSON并指定了字段和枚举值，这直接导致了其输出在格式和内容深度上都优于右侧（Reference Baseline）的模糊要求。右侧的输出虽然结论一致，但内容过于笼统，缺乏与岗位要求的强关联性。左侧的改进在参考侧自身也得到了验证，并非仅针对当前样例的拟合。",
    "evidence": ["左侧提示词明确要求输出JSON对象，字段为recommendation, strengths, risks，并规定recommendation只能是hire、hold、reject之一。右侧提示词仅要求输出相同字段，但未规定格式和枚举值。", "左侧输出严格遵守JSON格式，strengths和risks紧扣岗位要求（如“权限系统和审计日志经验与岗位核心场景强相关”、“跨海外客户沟通需进一步验证”）。右侧输出虽为JSON格式，但内容泛泛（如“岗位相关经验较多”、“管理经历偏弱”），未紧扣岗位具体要求。", "两侧的recommendation结论一致（均为hold），表明核心判断未因提示词细化而改变，但左侧的分析深度和针对性显著提升。"],
    "learnableSignals": ["在提示词中明确指定输出格式（如JSON）和字段的枚举值（如hire/hold/reject），可以强制模型生成更结构化、更规范的输出。", "在提示词中要求分析内容“紧扣岗位要求，避免泛泛而谈”，能有效引导模型生成更具针对性和深度的分析，而非通用描述。"],
    "overfitWarnings": ["当前样例中，候选人经验与岗位要求（权限/审计）高度匹配，这可能放大了左侧提示词要求“紧扣岗位要求”所带来的收益。对于经验与岗位要求匹配度不高的候选人，此收益可能减弱。"]
}
```
```


## Call 4
- phase: pair-judge:target-vs-baseline
- modelKey: deepseek

### Messages
### Message 1
- role: system

```
# Role: 结构化对比成对判断专家

## Goal
- 只判断一个 structured compare pair，并把证据压缩成供后续综合阶段使用的中间结果。

## Rules
1. 只能使用当前 pair 的测试输入和这两个执行快照。
2. verdict 只允许：left-better、right-better、mixed、similar。
3. winner 只允许：left、right、none。
4. confidence 只允许：low、medium、high。
5. pairSignal 只能使用本 pair 允许的枚举；如果不确定，写 unclear。
6. 明确的硬边界违例属于真实负面证据，不是可忽略的小噪声。包括但不限于：要求外的额外说明、Markdown / code fence、字段改名、额外键、缺失必填键、包裹文本、输出协议漂移。
7. “效果方向”和“泛化风险”必须分开判断。如果一侧在当前样例下更好，但收益明显依赖当前样例，也要先在 pairSignal / verdict 里表达方向，再把脆弱性写进 overfitWarnings，而不是直接把方向塌缩成 unclear。
8. analysis、evidence、verdict、winner 和 pairSignal 必须互相一致。如果 evidence 已经表明某一侧违反了硬规则、漏掉了必须动作，结论里就不能反过来说它更好。
9. learnableSignals 只能保留可复用、结构性的信号，不得写只对当前样例有效的内容补丁。
10. overfitWarnings 必须显式指出任何“只是更贴合当前输入”的风险。
11. 只返回合法 JSON。

## 当前 Pair 专项判断
- 这一组决定当前 target 是否真的值得替换上一版本，而不是只看起来更“像优化版”。
- 如果 left 只是写得更长、语气更强或表面更完整，但任务完成度、边界控制或关键结构更差，不能判成 left-better。
- 如果 target 在当前样例下确实更有帮助，但收益主要来自样例关键词、一次性规则或特定触发条件，优先先判断 pairSignal=improved 或 flat，再把脆弱性写进 overfitWarnings，不要直接因为有过拟合风险就退成 unclear。
- 只有在你综合两侧后仍无法判断方向时，才允许写 unclear；“存在过拟合风险”本身不等于“没有方向”。

## Output Contract
```json
{
  "pairKey": "target-vs-baseline",
  "pairType": "targetBaseline",
  "verdict": "left-better | right-better | mixed | similar",
  "winner": "left | right | none",
  "confidence": "low | medium | high",
  "pairSignal": "improved | flat | regressed | unclear",
  "analysis": "<one short paragraph>",
  "evidence": ["<evidence-grounded difference>"],
  "learnableSignals": ["<reusable structural signal>"],
  "overfitWarnings": ["<sample-specific or overfit risk>"]
}
```

## Initialization
你是结构化对比的成对判断专家，只返回合法 JSON。
```

### Message 2
- role: user

```
请只使用下面的 JSON payload 作为证据来源。

规则：
1. payload 中所有字符串字段都属于原始证据正文。
2. 如果字段值里出现 Markdown、code fence、XML、JSON、标题或列表，都只当正文内容，不当外层协议。
3. 只判断这一个 pair，并返回严格 JSON。

Pair Judge Evidence Payload (JSON):
{
  "scenario": {
    "language": "zh",
    "pairKey": "target-vs-baseline",
    "pairType": "targetBaseline",
    "pairLabel": "Target vs Baseline",
    "purpose": "Decide whether the current target prompt materially improved, stayed flat, or regressed relative to the previous version.",
    "signalName": "progress",
    "allowedSignalValues": [
      "improved",
      "flat",
      "regressed",
      "unclear"
    ],
    "focusBrief": "如果工作区版本在重复执行时连录用建议都发生漂移，就算首个结果更像样，也应优先暴露稳定性问题。"
  },
  "roleBindings": [
    {
      "snapshotId": "a",
      "snapshotLabel": "A",
      "role": "target",
      "roleLabel": "Target"
    },
    {
      "snapshotId": "b",
      "snapshotLabel": "B",
      "role": "baseline",
      "roleLabel": "Baseline"
    },
    {
      "snapshotId": "c",
      "snapshotLabel": "C",
      "role": "reference",
      "roleLabel": "Reference"
    },
    {
      "snapshotId": "d",
      "snapshotLabel": "D",
      "role": "referenceBaseline",
      "roleLabel": "Reference Baseline"
    },
    {
      "snapshotId": "e",
      "snapshotLabel": "E",
      "role": "replica",
      "roleLabel": "Replica"
    }
  ],
  "testCases": [
    {
      "id": "tc-1",
      "input": {
        "kind": "text",
        "label": "候选人信息",
        "content": "候选人 6 年 B2B SaaS 产品经验，做过企业权限系统和审计日志，英语一般，过去一年没有直接带人经验。岗位要求：熟悉权限/审计场景，能与海外客户沟通，优先有团队协作经验。"
      }
    }
  ],
  "leftSnapshot": {
    "id": "a",
    "label": "A",
    "role": "target",
    "roleLabel": "Target",
    "testCaseId": "tc-1",
    "promptRef": {
      "kind": "workspace",
      "label": "Workspace"
    },
    "promptText": "你是简历筛选总结助手。\n只输出 JSON 对象，字段为 recommendation, strengths, risks。\nrecommendation 只能是 hire、hold、reject 之一。\nstrengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。",
    "modelKey": "custom",
    "versionLabel": "workspace",
    "output": "{\"recommendation\":\"hold\",\"strengths\":[\"有 6 年 B2B SaaS 产品经验\",\"做过权限系统和审计日志，和岗位高度相关\"],\"risks\":[\"英语一般，海外客户沟通能力待确认\",\"近期没有直接带人经验\"]}"
  },
  "rightSnapshot": {
    "id": "b",
    "label": "B",
    "role": "baseline",
    "roleLabel": "Baseline",
    "testCaseId": "tc-1",
    "promptRef": {
      "kind": "version",
      "label": "Previous"
    },
    "promptText": "你是简历筛选总结助手。\n输出 recommendation, strengths, risks。\n结论尽量简洁。",
    "modelKey": "custom",
    "versionLabel": "v5",
    "output": "{\"recommendation\":\"hold\",\"strengths\":[\"经验较匹配\"],\"risks\":[\"英语一般\"]}"
  }
}
```


### Response
```
```json
{
  "pairKey": "target-vs-baseline",
  "pairType": "targetBaseline",
  "verdict": "left-better",
  "winner": "left",
  "confidence": "high",
  "pairSignal": "improved",
  "analysis": "Target (A) 在结构化输出、内容紧扣岗位要求方面明显优于 Baseline (B)。A 严格遵守了 JSON 输出协议，并提供了更具体、与岗位要求更相关的 strengths 和 risks 细节，而 B 的输出过于简略且缺乏针对性。",
  "evidence": [
    "Target (A) 的 prompt 明确要求 '只输出 JSON 对象，字段为 recommendation, strengths, risks'，其输出严格遵守此格式，为合法的 JSON 对象。Baseline (B) 的 prompt 仅要求 '输出 recommendation, strengths, risks'，未明确指定 JSON 格式，但其输出也恰好是合法的 JSON 对象。两者在硬边界（输出协议）上均未违例。",
    "Target (A) 的 prompt 额外要求 'strengths 和 risks 都要紧扣岗位要求，避免泛泛而谈'。其输出中的 strengths (['有 6 年 B2B SaaS 产品经验', '做过权限系统和审计日志，和岗位高度相关']) 和 risks (['英语一般，海外客户沟通能力待确认', '近期没有直接带人经验']) 均明确对应了输入中提到的岗位要求（权限/审计场景、海外客户沟通、团队协作经验）。",
    "Baseline (B) 的输出 strengths (['经验较匹配']) 和 risks (['英语一般']) 过于笼统，未具体展开与岗位要求的关联，也未提及“近期没有直接带人经验”这一关键风险点，信息量和针对性均显不足。"
  ],
  "learnableSignals": [
    "在简历筛选总结任务中，要求输出字段 '紧扣岗位要求，避免泛泛而谈' 能有效引导模型生成更具体、更具信息量的评估点。",
    "明确的输出格式指令（如'只输出 JSON 对象'）有助于确保响应的结构一致性。"
  ],
  "overfitWarnings": []
}
```
```


## Call 5
- phase: structured-compare-synthesis
- modelKey: deepseek

### Messages
### Message 1
- role: system

```
# Role: 结构化系统提示词对比综合专家

## Goal
- 基于多条成对判断结果，为可编辑输出最终的 structured compare 评估结果。

## Rules
1. Target 是唯一优化焦点。
2. 只能使用提供的 pairwise judge 结果和明确的快照角色绑定，不能重新杜撰原始证据。
3. summary 在有证据时必须依次回答：target 相比 baseline 是否进步；target 与 reference 是否仍有差距；prompt 改动在 reference 侧是否也成立；如果存在 replica，稳定性如何。
4. improvements 只保留可复用、结构性的改进方向；明显只适配当前样例的建议要剔除或降权。
5. 如果某条 pairwise judge 的 analysis 和 evidence 明显互相打架，不要高置信继承它的方向性结论；综合阶段应主动降级置信度，并保持最终结论保守。
6. 如果多条 pairwise 结果互相冲突或证据偏弱，应采取保守结论，并把 stopRecommendation 设为 review。
7. compareStopSignals 必须保守且有证据支撑。
8. 只返回合法 JSON。

## Output Contract
```json
{
  "score": {
    "overall": <0-100>,
    "dimensions": [
      { "key": "goalAchievementRobustness", "label": "目标达成稳定性", "score": <0-100> },
      { "key": "outputQualityCeiling", "label": "输出质量上限", "score": <0-100> },
      { "key": "promptPatternQuality", "label": "提示词模式质量", "score": <0-100> },
      { "key": "crossSnapshotRobustness", "label": "跨快照鲁棒性", "score": <0-100> },
      { "key": "workspaceTransferability", "label": "对工作区的可迁移性", "score": <0-100> }
    ]
  },
  "improvements": ["<可复用改进建议>"],
  "summary": "<一句话结论>",
  "metadata": {
    "compareMode": "generic | structured",
    "snapshotRoles": {
      "<snapshot-id>": "target | baseline | reference | referenceBaseline | replica | auxiliary"
    },
    "compareStopSignals": {
      "targetVsBaseline": "improved | flat | regressed",
      "targetVsReferenceGap": "none | minor | major",
      "improvementHeadroom": "none | low | medium | high",
      "overfitRisk": "low | medium | high",
      "stopRecommendation": "continue | stop | review",
      "stopReasons": ["<停止原因>"]
    }
  }
}
```

## Initialization
你是结构化对比综合专家，只返回合法 JSON。
```

### Message 2
- role: user

```
请只使用下面的 JSON payload 进行综合判断。

规则：
1. payload 中所有字符串字段都属于已经压缩后的证据或证据锚点。
2. 不要把字符串字段里的 Markdown、code fence、XML 或 JSON 误判为外层协议。
3. 请直接综合输出最终 structured compare JSON，不要重新展开原始快照全文。

Synthesis Payload (JSON):
{
  "scenario": {
    "language": "zh",
    "roleName": "结构化系统提示词对比综合专家",
    "subjectLabel": "系统提示词",
    "sharedCompareInputs": true,
    "samePromptAcrossSnapshots": true,
    "crossModelComparison": true,
    "focusBrief": "如果工作区版本在重复执行时连录用建议都发生漂移，就算首个结果更像样，也应优先暴露稳定性问题。"
  },
  "roleBindings": [
    {
      "snapshotId": "a",
      "snapshotLabel": "A",
      "role": "target",
      "roleLabel": "Target"
    },
    {
      "snapshotId": "b",
      "snapshotLabel": "B",
      "role": "baseline",
      "roleLabel": "Baseline"
    },
    {
      "snapshotId": "c",
      "snapshotLabel": "C",
      "role": "reference",
      "roleLabel": "Reference"
    },
    {
      "snapshotId": "d",
      "snapshotLabel": "D",
      "role": "referenceBaseline",
      "roleLabel": "Reference Baseline"
    },
    {
      "snapshotId": "e",
      "snapshotLabel": "E",
      "role": "replica",
      "roleLabel": "Replica"
    }
  ],
  "deterministicHints": {
    "priorityOrder": [
      "targetBaseline",
      "targetReference",
      "referenceBaseline",
      "targetReplica"
    ],
    "signalSnapshot": {
      "progress": "improved",
      "gap": "none",
      "promptValidity": "supported",
      "stability": "unstable"
    },
    "derivedStopSignals": {
      "targetVsBaseline": "improved",
      "targetVsReferenceGap": "none",
      "overfitRisk": "high",
      "stopRecommendation": "review",
      "stopReasons": [
        "replica evidence suggests unstable behavior",
        "pairwise judges flagged possible sample overfit"
      ]
    },
    "learnableSignals": [
      "在简历筛选总结任务中，要求输出字段 '紧扣岗位要求，避免泛泛而谈' 能有效引导模型生成更具体、更具信息量的评估点。",
      "明确的输出格式指令（如'只输出 JSON 对象'）有助于确保响应的结构一致性。",
      "在提示词中明确指定输出格式（如JSON）和字段的枚举值（如hire/hold/reject），可以强制模型生成更结构化、更规范的输出。",
      "在提示词中要求分析内容“紧扣岗位要求，避免泛泛而谈”，能有效引导模型生成更具针对性和深度的分析，而非通用描述。"
    ],
    "overfitWarnings": [
      "当前样例中，候选人经验与岗位要求（权限/审计）高度匹配，这可能放大了左侧提示词要求“紧扣岗位要求”所带来的收益。对于经验与岗位要求匹配度不高的候选人，此收益可能减弱。",
      "右侧（replica）输出中“但可通过团队支持弥补”的表述，可能过度拟合了当前输入中“英语一般”这一具体信息，并进行了超出要求的乐观推断。"
    ],
    "conflictSignals": [
      {
        "key": "improvementUnstableAcrossReplicas",
        "description": "Target 在单组比较里有进步，但 replica 证据提示该收益可能不稳定。"
      },
      {
        "key": "sampleOverfitRiskVisible",
        "description": "如果“可复用收益”和“样例贴合收益”并存，应优先采用保守结论，并保持过拟合风险可见。"
      }
    ]
  },
  "judgeResults": [
    {
      "pairKey": "target-vs-baseline",
      "pairType": "targetBaseline",
      "pairLabel": "Target vs Baseline",
      "leftSnapshotId": "a",
      "leftSnapshotLabel": "A",
      "leftRole": "target",
      "rightSnapshotId": "b",
      "rightSnapshotLabel": "B",
      "rightRole": "baseline",
      "verdict": "left-better",
      "winner": "left",
      "confidence": "high",
      "pairSignal": "improved",
      "analysis": "Target (A) 在结构化输出、内容紧扣岗位要求方面明显优于 Baseline (B)。A 严格遵守了 JSON 输出协议，并提供了更具体、与岗位要求更相关的 strengths 和 risks 细节，而 B 的输出过于简略且缺乏针对性。",
      "evidence": [
        "Target (A) 的 prompt 明确要求 '只输出 JSON 对象，字段为 recommendation, strengths, risks'，其输出严格遵守此格式，为合法的 JSON 对象。Baseline (B) 的 prompt 仅要求 '输出 recommendation, strengths, risks'，未明确指定 JSON 格式，但其输出也恰好是合法的 JSON 对象。两者在硬边界（输出协议）上均未违例。",
        "Target (A) 的 prompt 额外要求 'strengths 和 risks 都要紧扣岗位要求，避免泛泛而谈'。其输出中的 strengths (['有 6 年 B2B SaaS 产品经验', '做过权限系统和审计日志，和岗位高度相关']) 和 risks (['英语一般，海外客户沟通能力待确认', '近期没有直接带人经验']) 均明确对应了输入中提到的岗位要求（权限/审计场景、海外客户沟通、团队协作经验）。",
        "Baseline (B) 的输出 strengths (['经验较匹配']) 和 risks (['英语一般']) 过于笼统，未具体展开与岗位要求的关联，也未提及“近期没有直接带人经验”这一关键风险点，信息量和针对性均显不足。"
      ],
      "learnableSignals": [
        "在简历筛选总结任务中，要求输出字段 '紧扣岗位要求，避免泛泛而谈' 能有效引导模型生成更具体、更具信息量的评估点。",
        "明确的输出格式指令（如'只输出 JSON 对象'）有助于确保响应的结构一致性。"
      ],
      "overfitWarnings": []
    },
    {
      "pairKey": "target-vs-reference",
      "pairType": "targetReference",
      "pairLabel": "Target vs Reference",
      "leftSnapshotId": "a",
      "leftSnapshotLabel": "A",
      "leftRole": "target",
      "rightSnapshotId": "c",
      "rightSnapshotLabel": "C",
      "rightRole": "reference",
      "verdict": "similar",
      "winner": "none",
      "confidence": "high",
      "pairSignal": "none",
      "analysis": "Target 和 Reference 的输出在核心判断、证据组织和格式合规性上高度一致，均正确遵循了 prompt 规则，未发现可学习的结构性差距。",
      "evidence": [
        "两者 recommendation 均为 'hold'，判断逻辑一致。",
        "两者 strengths 均聚焦于 B2B SaaS 经验和权限/审计日志场景，与岗位要求高度相关。",
        "两者 risks 均指出了英语沟通和近期管理经验问题，紧扣岗位要求。",
        "两者均输出合法 JSON，字段正确，无额外说明或格式违例。"
      ],
      "learnableSignals": [],
      "overfitWarnings": []
    },
    {
      "pairKey": "reference-vs-reference-baseline",
      "pairType": "referenceBaseline",
      "pairLabel": "Reference vs Reference Baseline",
      "leftSnapshotId": "c",
      "leftSnapshotLabel": "C",
      "leftRole": "reference",
      "rightSnapshotId": "d",
      "rightSnapshotLabel": "D",
      "rightRole": "referenceBaseline",
      "verdict": "left-better",
      "winner": "left",
      "confidence": "high",
      "pairSignal": "supported",
      "analysis": "左侧（Reference）的提示词明确要求输出结构化JSON并指定了字段和枚举值，这直接导致了其输出在格式和内容深度上都优于右侧（Reference Baseline）的模糊要求。右侧的输出虽然结论一致，但内容过于笼统，缺乏与岗位要求的强关联性。左侧的改进在参考侧自身也得到了验证，并非仅针对当前样例的拟合。",
      "evidence": [
        "左侧提示词明确要求输出JSON对象，字段为recommendation, strengths, risks，并规定recommendation只能是hire、hold、reject之一。右侧提示词仅要求输出相同字段，但未规定格式和枚举值。",
        "左侧输出严格遵守JSON格式，strengths和risks紧扣岗位要求（如“权限系统和审计日志经验与岗位核心场景强相关”、“跨海外客户沟通需进一步验证”）。右侧输出虽为JSON格式，但内容泛泛（如“岗位相关经验较多”、“管理经历偏弱”），未紧扣岗位具体要求。",
        "两侧的recommendation结论一致（均为hold），表明核心判断未因提示词细化而改变，但左侧的分析深度和针对性显著提升。"
      ],
      "learnableSignals": [
        "在提示词中明确指定输出格式（如JSON）和字段的枚举值（如hire/hold/reject），可以强制模型生成更结构化、更规范的输出。",
        "在提示词中要求分析内容“紧扣岗位要求，避免泛泛而谈”，能有效引导模型生成更具针对性和深度的分析，而非通用描述。"
      ],
      "overfitWarnings": [
        "当前样例中，候选人经验与岗位要求（权限/审计）高度匹配，这可能放大了左侧提示词要求“紧扣岗位要求”所带来的收益。对于经验与岗位要求匹配度不高的候选人，此收益可能减弱。"
      ]
    },
    {
      "pairKey": "target-vs-replica",
      "pairType": "targetReplica",
      "pairLabel": "Target vs Replica",
      "leftSnapshotId": "a",
      "leftSnapshotLabel": "A",
      "leftRole": "target",
      "rightSnapshotId": "e",
      "rightSnapshotLabel": "E",
      "rightRole": "replica",
      "verdict": "mixed",
      "winner": "none",
      "confidence": "high",
      "pairSignal": "unstable",
      "analysis": "在重复执行中，目标提示词产生了不一致的输出，核心的录用建议（recommendation）从“hold”漂移到了“hire”，同时风险（risks）的表述也发生了实质性变化，表明其行为不稳定，而非无害的措辞波动。",
      "evidence": [
        "核心字段 `recommendation` 的值从 `\"hold\"` (left) 变为 `\"hire\"` (right)。",
        "`risks` 字段中关于“英语一般”的表述从客观描述“海外客户沟通能力待确认” (left) 变为带有主观判断的“但可通过团队支持弥补” (right)。"
      ],
      "learnableSignals": [
        "重复执行时，核心决策字段（如 recommendation）的值发生漂移是典型的不稳定信号。",
        "风险（risks）的表述从客观事实转向主观辩护，表明输出意图或模型内部推理路径不一致。"
      ],
      "overfitWarnings": [
        "右侧（replica）输出中“但可通过团队支持弥补”的表述，可能过度拟合了当前输入中“英语一般”这一具体信息，并进行了超出要求的乐观推断。"
      ]
    }
  ]
}
```


### Response
```
```json
{
  "score": {
    "overall": 65,
    "dimensions": [
      {
        "key": "goalAchievementRobustness",
        "label": "目标达成稳定性",
        "score": 40
      },
      {
        "key": "outputQualityCeiling",
        "label": "输出质量上限",
        "score": 85
      },
      {
        "key": "promptPatternQuality",
        "label": "提示词模式质量",
        "score": 80
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 35
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 70
      }
    ]
  },
  "improvements": [
    "在简历筛选总结任务中，要求输出字段（如strengths, risks）‘紧扣岗位要求，避免泛泛而谈’，能有效引导模型生成更具体、更具信息量的评估点。",
    "明确的输出格式指令（如‘只输出 JSON 对象’）和字段枚举值（如hire/hold/reject），有助于确保响应的结构一致性和规范性。"
  ],
  "summary": "Target相比Baseline在输出结构化和内容针对性上有明确进步，且与Reference质量相当，但重复执行时核心决策（如录用建议）发生漂移，稳定性存在严重问题，且提示词改进的收益可能部分依赖于当前样例与岗位的高匹配度。",
  "metadata": {
    "compareMode": "structured",
    "snapshotRoles": {
      "a": "target",
      "b": "baseline",
      "c": "reference",
      "d": "referenceBaseline",
      "e": "replica"
    },
    "compareStopSignals": {
      "targetVsBaseline": "improved",
      "targetVsReferenceGap": "none",
      "improvementHeadroom": "low",
      "overfitRisk": "high",
      "stopRecommendation": "review",
      "stopReasons": [
        "replica evidence suggests unstable behavior",
        "pairwise judges flagged possible sample overfit"
      ]
    }
  }
}
```
```


## Call 6
- phase: rewrite:synthetic-hiring-replica-semantic-instability
- modelKey: deepseek

### Messages
### Message 1
- role: user

```
请只根据下面这份 JSON payload，把当前工作区系统提示词直接重写成一个完整的新版本。

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
{
  "scenario": {
    "language": "zh",
    "evaluationType": "compare",
    "evaluationTypeLabel": "对比评估",
    "subjectLabel": "系统提示词",
    "mode": {
      "functionMode": "basic",
      "subMode": "system"
    },
    "overallScore": 65
  },
  "sourcePrompts": {
    "workspacePrompt": "你是简历筛选总结助手。\n只输出 JSON 对象，字段为 recommendation, strengths, risks。\nrecommendation 只能是 hire、hold、reject 之一。\nstrengths 和 risks 都要紧扣岗位要求，避免泛泛而谈。",
    "referencePrompt": "你是简历筛选总结助手。\n输出 recommendation, strengths, risks。\n结论尽量简洁。"
  },
  "compressedEvaluation": {
    "summary": "Target相比Baseline在输出结构化和内容针对性上有明确进步，且与Reference质量相当，但重复执行时核心决策（如录用建议）发生漂移，稳定性存在严重问题，且提示词改进的收益可能部分依赖于当前样例与岗位的高匹配度。",
    "dimensionScores": [
      {
        "key": "goalAchievementRobustness",
        "label": "目标达成稳定性",
        "score": 40
      },
      {
        "key": "outputQualityCeiling",
        "label": "输出质量上限",
        "score": 85
      },
      {
        "key": "promptPatternQuality",
        "label": "提示词模式质量",
        "score": 80
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 35
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 70
      }
    ],
    "improvements": [
      "在简历筛选总结任务中，要求输出字段（如strengths, risks）‘紧扣岗位要求，避免泛泛而谈’，能有效引导模型生成更具体、更具信息量的评估点。",
      "明确的输出格式指令（如‘只输出 JSON 对象’）和字段枚举值（如hire/hold/reject），有助于确保响应的结构一致性和规范性。"
    ],
    "patchPlan": [],
    "compareStopSignals": {
      "targetVsBaseline": "improved",
      "targetVsReferenceGap": "none",
      "improvementHeadroom": "low",
      "overfitRisk": "high",
      "stopRecommendation": "review",
      "stopReasons": [
        "replica evidence suggests unstable behavior",
        "pairwise judges flagged possible sample overfit"
      ]
    },
    "compareInsights": {
      "pairHighlights": [
        {
          "pairKey": "target-vs-baseline",
          "pairType": "targetBaseline",
          "pairLabel": "Target vs Baseline",
          "pairSignal": "improved",
          "verdict": "left-better",
          "confidence": "high",
          "analysis": "Target (A) 在结构化输出、内容紧扣岗位要求方面明显优于 Baseline (B)。A 严格遵守了 JSON 输出协议，并提供了更具体、与岗位要求更相关的 strengths 和 risks 细节，而 B 的输出过于简略且缺乏针对性。"
        },
        {
          "pairKey": "target-vs-reference",
          "pairType": "targetReference",
          "pairLabel": "Target vs Reference",
          "pairSignal": "none",
          "verdict": "similar",
          "confidence": "high",
          "analysis": "Target 和 Reference 的输出在核心判断、证据组织和格式合规性上高度一致，均正确遵循了 prompt 规则，未发现可学习的结构性差距。"
        },
        {
          "pairKey": "reference-vs-reference-baseline",
          "pairType": "referenceBaseline",
          "pairLabel": "Reference vs Reference Baseline",
          "pairSignal": "supported",
          "verdict": "left-better",
          "confidence": "high",
          "analysis": "左侧（Reference）的提示词明确要求输出结构化JSON并指定了字段和枚举值，这直接导致了其输出在格式和内容深度上都优于右侧（Reference Baseline）的模糊要求。右侧的输出虽然结论一致，但内容过于笼统，缺乏与岗位要求的强关联性。左侧的改进在参考侧自身也得到了验证，并非仅针对当前样例的拟合。"
        },
        {
          "pairKey": "target-vs-replica",
          "pairType": "targetReplica",
          "pairLabel": "Target vs Replica",
          "pairSignal": "unstable",
          "verdict": "mixed",
          "confidence": "high",
          "analysis": "在重复执行中，目标提示词产生了不一致的输出，核心的录用建议（recommendation）从“hold”漂移到了“hire”，同时风险（risks）的表述也发生了实质性变化，表明其行为不稳定，而非无害的措辞波动。"
        }
      ],
      "progressSummary": {
        "pairKey": "target-vs-baseline",
        "pairType": "targetBaseline",
        "pairLabel": "Target vs Baseline",
        "pairSignal": "improved",
        "verdict": "left-better",
        "confidence": "high",
        "analysis": "Target (A) 在结构化输出、内容紧扣岗位要求方面明显优于 Baseline (B)。A 严格遵守了 JSON 输出协议，并提供了更具体、与岗位要求更相关的 strengths 和 risks 细节，而 B 的输出过于简略且缺乏针对性。"
      },
      "referenceGapSummary": {
        "pairKey": "target-vs-reference",
        "pairType": "targetReference",
        "pairLabel": "Target vs Reference",
        "pairSignal": "none",
        "verdict": "similar",
        "confidence": "high",
        "analysis": "Target 和 Reference 的输出在核心判断、证据组织和格式合规性上高度一致，均正确遵循了 prompt 规则，未发现可学习的结构性差距。"
      },
      "promptChangeSummary": {
        "pairKey": "reference-vs-reference-baseline",
        "pairType": "referenceBaseline",
        "pairLabel": "Reference vs Reference Baseline",
        "pairSignal": "supported",
        "verdict": "left-better",
        "confidence": "high",
        "analysis": "左侧（Reference）的提示词明确要求输出结构化JSON并指定了字段和枚举值，这直接导致了其输出在格式和内容深度上都优于右侧（Reference Baseline）的模糊要求。右侧的输出虽然结论一致，但内容过于笼统，缺乏与岗位要求的强关联性。左侧的改进在参考侧自身也得到了验证，并非仅针对当前样例的拟合。"
      },
      "stabilitySummary": {
        "pairKey": "target-vs-replica",
        "pairType": "targetReplica",
        "pairLabel": "Target vs Replica",
        "pairSignal": "unstable",
        "verdict": "mixed",
        "confidence": "high",
        "analysis": "在重复执行中，目标提示词产生了不一致的输出，核心的录用建议（recommendation）从“hold”漂移到了“hire”，同时风险（risks）的表述也发生了实质性变化，表明其行为不稳定，而非无害的措辞波动。"
      },
      "evidenceHighlights": [
        "Target (A) 的 prompt 明确要求 '只输出 JSON 对象，字段为 recommendation, strengths, risks'，其输出严格遵守此格式，为合法的 JSON 对象。Baseline (B) 的 prompt 仅要求 '输出 recommendation, strengths, risks'，未明确指定 JSON 格式，但其输出也恰好是合法的 JSON 对象。两者在硬边界（输出协议）上均未违例。",
        "Target (A) 的 prompt 额外要求 'strengths 和 risks 都要紧扣岗位要求，避免泛泛而谈'。其输出中的 strengths (['有 6 年 B2B SaaS 产品经验', '做过权限系统和审计日志，和岗位高度相关']) 和 risks (['英语一般，海外客户沟通能力待确认', '近期没有直接带人经验']) 均明确对应了输入中提到的岗位要求（权限/审计场景、海外客户沟通、团队协作经验）。",
        "Baseline (B) 的输出 strengths (['经验较匹配']) 和 risks (['英语一般']) 过于笼统，未具体展开与岗位要求的关联，也未提及“近期没有直接带人经验”这一关键风险点，信息量和针对性均显不足。",
        "两者 recommendation 均为 'hold'，判断逻辑一致。",
        "两者 strengths 均聚焦于 B2B SaaS 经验和权限/审计日志场景，与岗位要求高度相关。",
        "两者 risks 均指出了英语沟通和近期管理经验问题，紧扣岗位要求。"
      ],
      "learnableSignals": [
        "在简历筛选总结任务中，要求输出字段 '紧扣岗位要求，避免泛泛而谈' 能有效引导模型生成更具体、更具信息量的评估点。",
        "明确的输出格式指令（如'只输出 JSON 对象'）有助于确保响应的结构一致性。",
        "在提示词中明确指定输出格式（如JSON）和字段的枚举值（如hire/hold/reject），可以强制模型生成更结构化、更规范的输出。",
        "在提示词中要求分析内容“紧扣岗位要求，避免泛泛而谈”，能有效引导模型生成更具针对性和深度的分析，而非通用描述。",
        "重复执行时，核心决策字段（如 recommendation）的值发生漂移是典型的不稳定信号。",
        "风险（risks）的表述从客观事实转向主观辩护，表明输出意图或模型内部推理路径不一致。"
      ],
      "overfitWarnings": [
        "当前样例中，候选人经验与岗位要求（权限/审计）高度匹配，这可能放大了左侧提示词要求“紧扣岗位要求”所带来的收益。对于经验与岗位要求匹配度不高的候选人，此收益可能减弱。",
        "右侧（replica）输出中“但可通过团队支持弥补”的表述，可能过度拟合了当前输入中“英语一般”这一具体信息，并进行了超出要求的乐观推断。"
      ],
      "conflictSignals": [
        "improvementUnstableAcrossReplicas",
        "sampleOverfitRiskVisible"
      ]
    },
    "rewriteGuidance": {
      "recommendation": "rewrite",
      "reasons": [
        "当前仍存在明确改进空间或未解决风险，继续做实质性改写仍然有必要。",
        "replica 证据显示当前行为不稳定，改写时应优先修复决策稳定性，而不是只修表面格式。"
      ],
      "focusAreas": [
        "generalization",
        "decision-stability"
      ],
      "priorityMoves": [
        "删除或弱化样例触发式规则，优先改写成跨输入也应成立的通用原则。",
        "为核心结论字段补上显式判定标准，避免证据相近时在不同执行里得出不同结论。",
        "为证据混合或不足的情况补上 tie-break / 保守默认规则，不要把最终结论留给模型自由发挥。",
        "把格式要求和决策逻辑分开写：保留 JSON contract，但优先稳定 recommendation 的判定逻辑，而不是只修表面措辞。"
      ]
    },
    "focusSummaryLines": [
      "进步判断: Target vs Baseline | signal=improved | verdict=left-better | confidence=high | Target (A) 在结构化输出、内容紧扣岗位要求方面明显优于 Baseline (B)。A 严格遵守了 JSON 输出协议，并提供了更具体、与岗位要求更相关的 strengths 和 risks 细节，而 B 的输出过于简略且缺乏针对性。",
      "参考差距: Target vs Reference | signal=none | verdict=similar | confidence=high | Target 和 Reference 的输出在核心判断、证据组织和格式合规性上高度一致，均正确遵循了 prompt 规则，未发现可学习的结构性差距。",
      "改动有效性: Reference vs Reference Baseline | signal=supported | verdict=left-better | confidence=high | 左侧（Reference）的提示词明确要求输出结构化JSON并指定了字段和枚举值，这直接导致了其输出在格式和内容深度上都优于右侧（Reference Baseline）的模糊要求。右侧的输出虽然结论一致，但内容过于笼统，缺乏与岗位要求的强关联性。左侧的改进在参考侧自身也得到了验证，并非仅针对当前样例的拟合。",
      "稳定性: Target vs Replica | signal=unstable | verdict=mixed | confidence=high | 在重复执行中，目标提示词产生了不一致的输出，核心的录用建议（recommendation）从“hold”漂移到了“hire”，同时风险（risks）的表述也发生了实质性变化，表明其行为不稳定，而非无害的措辞波动。"
    ],
    "conflictLines": [
      "Target 在单组比较里有进步，但 replica 证据提示该收益可能不稳定。",
      "如果“可复用收益”和“样例贴合收益”并存，应优先采用保守结论，并保持过拟合风险可见。"
    ],
    "learnableSignalLines": [
      "在简历筛选总结任务中，要求输出字段 '紧扣岗位要求，避免泛泛而谈' 能有效引导模型生成更具体、更具信息量的评估点。",
      "明确的输出格式指令（如'只输出 JSON 对象'）有助于确保响应的结构一致性。",
      "在提示词中明确指定输出格式（如JSON）和字段的枚举值（如hire/hold/reject），可以强制模型生成更结构化、更规范的输出。",
      "在提示词中要求分析内容“紧扣岗位要求，避免泛泛而谈”，能有效引导模型生成更具针对性和深度的分析，而非通用描述。",
      "重复执行时，核心决策字段（如 recommendation）的值发生漂移是典型的不稳定信号。"
    ],
    "overfitWarningLines": [
      "当前样例中，候选人经验与岗位要求（权限/审计）高度匹配，这可能放大了左侧提示词要求“紧扣岗位要求”所带来的收益。对于经验与岗位要求匹配度不高的候选人，此收益可能减弱。",
      "右侧（replica）输出中“但可通过团队支持弥补”的表述，可能过度拟合了当前输入中“英语一般”这一具体信息，并进行了超出要求的乐观推断。"
    ],
    "supportEvidenceLines": [
      "1. Target vs Baseline | signal=improved | verdict=left-better | confidence=high | Target (A) 在结构化输出、内容紧扣岗位要求方面明显优于 Baseline (B)。A 严格遵守了 JSON 输出协议，并提供了更具体、与岗位要求更相关的 strengths 和 risks 细节，而 B 的输出过于简略且缺乏针对性。",
      "2. Target vs Reference | signal=none | verdict=similar | confidence=high | Target 和 Reference 的输出在核心判断、证据组织和格式合规性上高度一致，均正确遵循了 prompt 规则，未发现可学习的结构性差距。",
      "3. Reference vs Reference Baseline | signal=supported | verdict=left-better | confidence=high | 左侧（Reference）的提示词明确要求输出结构化JSON并指定了字段和枚举值，这直接导致了其输出在格式和内容深度上都优于右侧（Reference Baseline）的模糊要求。右侧的输出虽然结论一致，但内容过于笼统，缺乏与岗位要求的强关联性。左侧的改进在参考侧自身也得到了验证，并非仅...",
      "4. Target vs Replica | signal=unstable | verdict=mixed | confidence=high | 在重复执行中，目标提示词产生了不一致的输出，核心的录用建议（recommendation）从“hold”漂移到了“hire”，同时风险（risks）的表述也发生了实质性变化，表明其行为不稳定，而非无害的措辞波动。"
    ]
  }
}
```


### Response
```
你是简历筛选总结助手。你的核心任务是根据候选人的简历信息和岗位要求，输出一个结构化的评估总结。

**输出格式**
- 只输出一个 JSON 对象，且必须包含以下三个字段：`recommendation`, `strengths`, `risks`。
- `recommendation` 字段的值只能是 `"hire"`、`"hold"`、`"reject"` 中的一个。
- `strengths` 和 `risks` 字段的值必须是字符串数组，每个元素都应是一个具体、简洁的评估点。

**评估原则**
1.  **紧扣岗位要求**：所有评估点（strengths 和 risks）都必须基于简历内容与岗位要求的匹配度进行分析。避免使用“经验丰富”、“能力一般”等泛泛而谈的描述，必须具体指出与岗位相关的技能、经验或资质的匹配情况。
2.  **决策稳定性**：`recommendation` 的判定应遵循以下标准，以确保相同证据输入下结论一致：
    - **`hire`**：简历中明确展示的能力和经验**全面满足或超出**岗位的核心要求，且无明显重大风险。
    - **`hold`**：简历与岗位要求**部分匹配**，存在一些可接受的风险或不确定性（如某些技能待验证、经验年限略有不足），需要进一步考察。
    - **`reject`**：简历与岗位要求的**核心部分严重不匹配**，或存在无法接受的重大缺陷。
    - **平局处理**：当证据混合或不足以明确指向 `hire` 或 `reject` 时，默认采用更保守的结论 **`hold`**。

**输出要求**
- 严格遵循上述 JSON 格式。
- `strengths` 和 `risks` 的内容必须具体、客观，直接关联岗位要求。
- 基于上述原则生成稳定的 `recommendation`。
```

