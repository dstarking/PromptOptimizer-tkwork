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
    "focusBrief": "当两个版本在核心结论、风险点和动作建议上等价时，应更倾向于 flat，而不是把风格差异误判成信息不足。"
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
    }
  ],
  "testCases": [
    {
      "id": "tc-1",
      "input": {
        "kind": "text",
        "label": "合同片段",
        "content": "合作协议约定平台可单方修改结算周期，并在未通知的情况下暂停服务；违约责任仅约束供应商，不约束平台。"
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
    "promptText": "你是法务风险摘要助手。\n输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。\n用更简洁、偏业务同学可读的中文表达。\n不要添加解释。",
    "modelKey": "custom",
    "versionLabel": "workspace",
    "output": "{\"risk_level\":\"high\",\"core_risks\":[\"平台可单方改结算周期\",\"平台可未通知暂停服务\",\"违约责任明显失衡\"],\"recommended_action\":\"要求补充通知义务、限制单方变更范围，并补齐平台违约责任。\"}"
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
    "promptText": "你是法务风险摘要助手。\n输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。\n用更简洁、偏业务同学可读的中文表达。\n不要添加解释。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-workspace",
    "output": "{\"risk_level\":\"high\",\"core_risks\":[\"平台可单方改结算周期\",\"平台可未通知暂停服务\",\"违约责任缺乏对等性\"],\"recommended_action\":\"要求把通知义务、变更边界和平台违约责任补齐后再推进。\"}"
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
    "analysis": "两个输出在核心风险识别、风险等级判断和行动建议上完全等价，仅在措辞上存在细微差异，这些差异不构成可学习的结构性差距。",
    "evidence": [
        "风险等级 (risk_level) 均为 'high'。",
        "核心风险 (core_risks) 均准确识别出三项：'平台可单方改结算周期'、'平台可未通知暂停服务'、以及违约责任失衡问题（Target用'明显失衡'，Reference用'缺乏对等性'）。",
        "推荐行动 (recommended_action) 均指向相同的三个谈判要点：补充通知义务、限制单方变更范围、补齐平台违约责任。Target的表述更具体（'要求补充...并补齐...'），Reference的表述更概括（'要求把...补齐后再推进'），但实质内容一致。"
    ],
    "learnableSignals": [],
    "overfitWarnings": []
}
```
```


## Call 2
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
    "focusBrief": "当两个版本在核心结论、风险点和动作建议上等价时，应更倾向于 flat，而不是把风格差异误判成信息不足。"
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
    }
  ],
  "testCases": [
    {
      "id": "tc-1",
      "input": {
        "kind": "text",
        "label": "合同片段",
        "content": "合作协议约定平台可单方修改结算周期，并在未通知的情况下暂停服务；违约责任仅约束供应商，不约束平台。"
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
    "promptText": "你是法务风险摘要助手。\n输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。\n用更简洁、偏业务同学可读的中文表达。\n不要添加解释。",
    "modelKey": "custom",
    "versionLabel": "workspace",
    "output": "{\"risk_level\":\"high\",\"core_risks\":[\"平台可单方改结算周期\",\"平台可未通知暂停服务\",\"违约责任明显失衡\"],\"recommended_action\":\"要求补充通知义务、限制单方变更范围，并补齐平台违约责任。\"}"
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
    "promptText": "你是法务风险摘要助手。\n输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。\n保持客观、精炼。\n不要添加解释。",
    "modelKey": "custom",
    "versionLabel": "v6",
    "output": "{\"risk_level\":\"high\",\"core_risks\":[\"平台可单方调整结算周期\",\"平台可在未通知情况下暂停服务\",\"违约责任分配失衡\"],\"recommended_action\":\"建议增加通知义务、限制单方修改权限，并要求平台承担对等违约责任。\"}"
  }
}
```


### Response
```
```json
{
  "pairKey": "target-vs-baseline",
  "pairType": "targetBaseline",
  "verdict": "similar",
  "winner": "none",
  "confidence": "high",
  "pairSignal": "flat",
  "analysis": "Target 和 Baseline 的输出在核心风险识别、风险等级判断以及建议的行动方向上完全一致。Target 在措辞上略有简化（如“改结算周期” vs “调整结算周期”），但这属于风格微调，并未引入新的实质性信息或改进。两者都准确识别了单方修改权、无通知暂停服务和违约责任失衡三个核心风险点，并给出了相同的谈判方向。",
  "evidence": [
    "风险等级 (risk_level) 均为 'high'。",
    "核心风险 (core_risks) 列表内容实质等价：均包含单方修改结算周期、无通知暂停服务、违约责任失衡三点。",
    "建议行动 (recommended_action) 方向一致：均要求增加通知义务、限制单方变更、并要求平台承担对等责任。"
  ],
  "learnableSignals": [
    "当两个版本在风险等级、核心风险点和行动建议上完全等价时，应判定为 flat，表明优化未产生实质性变化。"
  ],
  "overfitWarnings": []
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
    "focusBrief": "当两个版本在核心结论、风险点和动作建议上等价时，应更倾向于 flat，而不是把风格差异误判成信息不足。"
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
    }
  ],
  "testCases": [
    {
      "id": "tc-1",
      "input": {
        "kind": "text",
        "label": "合同片段",
        "content": "合作协议约定平台可单方修改结算周期，并在未通知的情况下暂停服务；违约责任仅约束供应商，不约束平台。"
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
    "promptText": "你是法务风险摘要助手。\n输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。\n用更简洁、偏业务同学可读的中文表达。\n不要添加解释。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-workspace",
    "output": "{\"risk_level\":\"high\",\"core_risks\":[\"平台可单方改结算周期\",\"平台可未通知暂停服务\",\"违约责任缺乏对等性\"],\"recommended_action\":\"要求把通知义务、变更边界和平台违约责任补齐后再推进。\"}"
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
    "promptText": "你是法务风险摘要助手。\n输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。\n保持客观、精炼。\n不要添加解释。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-v6",
    "output": "{\"risk_level\":\"high\",\"core_risks\":[\"平台可单方调整结算周期\",\"平台可在未通知情况下暂停服务\",\"违约责任缺乏对等性\"],\"recommended_action\":\"建议补充通知义务、限制单方变更，并增加平台违约责任。\"}"
  }
}
```


### Response
```
```json
{
  "pairKey": "reference-vs-reference-baseline",
  "pairType": "referenceBaseline",
  "verdict": "similar",
  "winner": "none",
  "confidence": "high",
  "pairSignal": "supported",
  "analysis": "两个版本在核心风险判断、风险等级和行动建议上完全一致，仅在措辞风格上存在微小差异，这符合 prompt 改动（从“保持客观、精炼”到“用更简洁、偏业务同学可读的中文表达”）的预期方向，表明该改动在参考侧也成立，并非仅对目标侧有效。",
  "evidence": ["两个输出均判定风险等级为 'high'。", "两个输出识别出的核心风险点实质相同：单方修改结算周期、未通知暂停服务、违约责任不对等。", "两个输出给出的行动建议核心内容一致：要求补充通知义务、限制单方变更、增加平台责任。", "措辞差异仅在于表达风格：左侧（C）更口语化（如'补齐'），右侧（D）更书面化（如'建议补充'）。"],
  "learnableSignals": ["当两个版本在核心结论、风险点和行动建议上实质等价时，应倾向于判定为相似（similar），而非因风格差异误判为信息不足。", "Prompt 中从通用指令转向更具体的受众导向指令（如'偏业务同学可读'），在参考侧也得到了支持，表现为输出风格向更简洁、直接的方向调整。"],
  "overfitWarnings": []
}
```
```


## Call 4
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
    "focusBrief": "当两个版本在核心结论、风险点和动作建议上等价时，应更倾向于 flat，而不是把风格差异误判成信息不足。"
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
      "progress": "flat",
      "gap": "none",
      "promptValidity": "supported"
    },
    "derivedStopSignals": {
      "targetVsBaseline": "flat",
      "targetVsReferenceGap": "none",
      "improvementHeadroom": "medium",
      "stopRecommendation": "continue"
    },
    "learnableSignals": [
      "当两个版本在风险等级、核心风险点和行动建议上完全等价时，应判定为 flat，表明优化未产生实质性变化。",
      "当两个版本在核心结论、风险点和行动建议上实质等价时，应倾向于判定为相似（similar），而非因风格差异误判为信息不足。",
      "Prompt 中从通用指令转向更具体的受众导向指令（如'偏业务同学可读'），在参考侧也得到了支持，表现为输出风格向更简洁、直接的方向调整。"
    ],
    "overfitWarnings": [],
    "conflictSignals": []
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
      "verdict": "similar",
      "winner": "none",
      "confidence": "high",
      "pairSignal": "flat",
      "analysis": "Target 和 Baseline 的输出在核心风险识别、风险等级判断以及建议的行动方向上完全一致。Target 在措辞上略有简化（如“改结算周期” vs “调整结算周期”），但这属于风格微调，并未引入新的实质性信息或改进。两者都准确识别了单方修改权、无通知暂停服务和违约责任失衡三个核心风险点，并给出了相同的谈判方向。",
      "evidence": [
        "风险等级 (risk_level) 均为 'high'。",
        "核心风险 (core_risks) 列表内容实质等价：均包含单方修改结算周期、无通知暂停服务、违约责任失衡三点。",
        "建议行动 (recommended_action) 方向一致：均要求增加通知义务、限制单方变更、并要求平台承担对等责任。"
      ],
      "learnableSignals": [
        "当两个版本在风险等级、核心风险点和行动建议上完全等价时，应判定为 flat，表明优化未产生实质性变化。"
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
      "analysis": "两个输出在核心风险识别、风险等级判断和行动建议上完全等价，仅在措辞上存在细微差异，这些差异不构成可学习的结构性差距。",
      "evidence": [
        "风险等级 (risk_level) 均为 'high'。",
        "核心风险 (core_risks) 均准确识别出三项：'平台可单方改结算周期'、'平台可未通知暂停服务'、以及违约责任失衡问题（Target用'明显失衡'，Reference用'缺乏对等性'）。",
        "推荐行动 (recommended_action) 均指向相同的三个谈判要点：补充通知义务、限制单方变更范围、补齐平台违约责任。Target的表述更具体（'要求补充...并补齐...'），Reference的表述更概括（'要求把...补齐后再推进'），但实质内容一致。"
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
      "verdict": "similar",
      "winner": "none",
      "confidence": "high",
      "pairSignal": "supported",
      "analysis": "两个版本在核心风险判断、风险等级和行动建议上完全一致，仅在措辞风格上存在微小差异，这符合 prompt 改动（从“保持客观、精炼”到“用更简洁、偏业务同学可读的中文表达”）的预期方向，表明该改动在参考侧也成立，并非仅对目标侧有效。",
      "evidence": [
        "两个输出均判定风险等级为 'high'。",
        "两个输出识别出的核心风险点实质相同：单方修改结算周期、未通知暂停服务、违约责任不对等。",
        "两个输出给出的行动建议核心内容一致：要求补充通知义务、限制单方变更、增加平台责任。",
        "措辞差异仅在于表达风格：左侧（C）更口语化（如'补齐'），右侧（D）更书面化（如'建议补充'）。"
      ],
      "learnableSignals": [
        "当两个版本在核心结论、风险点和行动建议上实质等价时，应倾向于判定为相似（similar），而非因风格差异误判为信息不足。",
        "Prompt 中从通用指令转向更具体的受众导向指令（如'偏业务同学可读'），在参考侧也得到了支持，表现为输出风格向更简洁、直接的方向调整。"
      ],
      "overfitWarnings": []
    }
  ]
}
```


### Response
```
```json
{
  "score": {
    "overall": 50,
    "dimensions": [
      { "key": "goalAchievementRobustness", "label": "目标达成稳定性", "score": 100 },
      { "key": "outputQualityCeiling", "label": "输出质量上限", "score": 50 },
      { "key": "promptPatternQuality", "label": "提示词模式质量", "score": 60 },
      { "key": "crossSnapshotRobustness", "label": "跨快照鲁棒性", "score": 100 },
      { "key": "workspaceTransferability", "label": "对工作区的可迁移性", "score": 60 }
    ]
  },
  "improvements": [
    "提示词优化应聚焦于引入新的、结构化的信息维度（如风险量化、条款优先级排序、替代方案建议），而非仅调整措辞风格。",
    "当提示词改动旨在提升可读性时，应明确定义可衡量的风格指标（如句子长度、术语密度），以便于客观评估改进效果。",
    "在核心结论等价的情况下，评估应更关注输出在逻辑严谨性、证据链完整性或可操作性上的潜在差异，避免过度解读风格变化。"
  ],
  "summary": "Target 相比 Baseline 无实质性进步，与 Reference 在核心风险识别与建议上无差距；Prompt 中面向业务可读性的风格调整在 Reference 侧也得到支持，表明改动具有跨模型鲁棒性，但未提升输出内容的上限。",
  "metadata": {
    "compareMode": "structured",
    "snapshotRoles": {
      "a": "target",
      "b": "baseline",
      "c": "reference",
      "d": "referenceBaseline"
    },
    "compareStopSignals": {
      "targetVsBaseline": "flat",
      "targetVsReferenceGap": "none",
      "improvementHeadroom": "medium",
      "overfitRisk": "low",
      "stopRecommendation": "continue",
      "stopReasons": []
    }
  }
}
```
```


## Call 5
- phase: rewrite:synthetic-legal-flat-not-unclear
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
    "overallScore": 50
  },
  "sourcePrompts": {
    "workspacePrompt": "你是法务风险摘要助手。\n输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。\n用更简洁、偏业务同学可读的中文表达。\n不要添加解释。",
    "referencePrompt": "你是法务风险摘要助手。\n输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。\n保持客观、精炼。\n不要添加解释。"
  },
  "compressedEvaluation": {
    "summary": "Target 相比 Baseline 无实质性进步，与 Reference 在核心风险识别与建议上无差距；Prompt 中面向业务可读性的风格调整在 Reference 侧也得到支持，表明改动具有跨模型鲁棒性，但未提升输出内容的上限。",
    "dimensionScores": [
      {
        "key": "goalAchievementRobustness",
        "label": "目标达成稳定性",
        "score": 100
      },
      {
        "key": "outputQualityCeiling",
        "label": "输出质量上限",
        "score": 50
      },
      {
        "key": "promptPatternQuality",
        "label": "提示词模式质量",
        "score": 60
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 100
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 60
      }
    ],
    "improvements": [
      "提示词优化应聚焦于引入新的、结构化的信息维度（如风险量化、条款优先级排序、替代方案建议），而非仅调整措辞风格。",
      "当提示词改动旨在提升可读性时，应明确定义可衡量的风格指标（如句子长度、术语密度），以便于客观评估改进效果。",
      "在核心结论等价的情况下，评估应更关注输出在逻辑严谨性、证据链完整性或可操作性上的潜在差异，避免过度解读风格变化。"
    ],
    "patchPlan": [],
    "compareStopSignals": {
      "targetVsBaseline": "flat",
      "targetVsReferenceGap": "none",
      "improvementHeadroom": "medium",
      "overfitRisk": "low",
      "stopRecommendation": "continue"
    },
    "compareInsights": {
      "pairHighlights": [
        {
          "pairKey": "target-vs-baseline",
          "pairType": "targetBaseline",
          "pairLabel": "Target vs Baseline",
          "pairSignal": "flat",
          "verdict": "similar",
          "confidence": "high",
          "analysis": "Target 和 Baseline 的输出在核心风险识别、风险等级判断以及建议的行动方向上完全一致。Target 在措辞上略有简化（如“改结算周期” vs “调整结算周期”），但这属于风格微调，并未引入新的实质性信息或改进。两者都准确识别了单方修改权、无通知暂停服务和违约责任失衡三个核心风险点，并给出了相同的谈判方向。"
        },
        {
          "pairKey": "target-vs-reference",
          "pairType": "targetReference",
          "pairLabel": "Target vs Reference",
          "pairSignal": "none",
          "verdict": "similar",
          "confidence": "high",
          "analysis": "两个输出在核心风险识别、风险等级判断和行动建议上完全等价，仅在措辞上存在细微差异，这些差异不构成可学习的结构性差距。"
        },
        {
          "pairKey": "reference-vs-reference-baseline",
          "pairType": "referenceBaseline",
          "pairLabel": "Reference vs Reference Baseline",
          "pairSignal": "supported",
          "verdict": "similar",
          "confidence": "high",
          "analysis": "两个版本在核心风险判断、风险等级和行动建议上完全一致，仅在措辞风格上存在微小差异，这符合 prompt 改动（从“保持客观、精炼”到“用更简洁、偏业务同学可读的中文表达”）的预期方向，表明该改动在参考侧也成立，并非仅对目标侧有效。"
        }
      ],
      "progressSummary": {
        "pairKey": "target-vs-baseline",
        "pairType": "targetBaseline",
        "pairLabel": "Target vs Baseline",
        "pairSignal": "flat",
        "verdict": "similar",
        "confidence": "high",
        "analysis": "Target 和 Baseline 的输出在核心风险识别、风险等级判断以及建议的行动方向上完全一致。Target 在措辞上略有简化（如“改结算周期” vs “调整结算周期”），但这属于风格微调，并未引入新的实质性信息或改进。两者都准确识别了单方修改权、无通知暂停服务和违约责任失衡三个核心风险点，并给出了相同的谈判方向。"
      },
      "referenceGapSummary": {
        "pairKey": "target-vs-reference",
        "pairType": "targetReference",
        "pairLabel": "Target vs Reference",
        "pairSignal": "none",
        "verdict": "similar",
        "confidence": "high",
        "analysis": "两个输出在核心风险识别、风险等级判断和行动建议上完全等价，仅在措辞上存在细微差异，这些差异不构成可学习的结构性差距。"
      },
      "promptChangeSummary": {
        "pairKey": "reference-vs-reference-baseline",
        "pairType": "referenceBaseline",
        "pairLabel": "Reference vs Reference Baseline",
        "pairSignal": "supported",
        "verdict": "similar",
        "confidence": "high",
        "analysis": "两个版本在核心风险判断、风险等级和行动建议上完全一致，仅在措辞风格上存在微小差异，这符合 prompt 改动（从“保持客观、精炼”到“用更简洁、偏业务同学可读的中文表达”）的预期方向，表明该改动在参考侧也成立，并非仅对目标侧有效。"
      },
      "evidenceHighlights": [
        "风险等级 (risk_level) 均为 'high'。",
        "核心风险 (core_risks) 列表内容实质等价：均包含单方修改结算周期、无通知暂停服务、违约责任失衡三点。",
        "建议行动 (recommended_action) 方向一致：均要求增加通知义务、限制单方变更、并要求平台承担对等责任。",
        "核心风险 (core_risks) 均准确识别出三项：'平台可单方改结算周期'、'平台可未通知暂停服务'、以及违约责任失衡问题（Target用'明显失衡'，Reference用'缺乏对等性'）。",
        "推荐行动 (recommended_action) 均指向相同的三个谈判要点：补充通知义务、限制单方变更范围、补齐平台违约责任。Target的表述更具体（'要求补充...并补齐...'），Reference的表述更概括（'要求把...补齐后再推进'），但实质内容一致。",
        "两个输出均判定风险等级为 'high'。"
      ],
      "learnableSignals": [
        "当两个版本在风险等级、核心风险点和行动建议上完全等价时，应判定为 flat，表明优化未产生实质性变化。",
        "当两个版本在核心结论、风险点和行动建议上实质等价时，应倾向于判定为相似（similar），而非因风格差异误判为信息不足。",
        "Prompt 中从通用指令转向更具体的受众导向指令（如'偏业务同学可读'），在参考侧也得到了支持，表现为输出风格向更简洁、直接的方向调整。"
      ]
    },
    "rewriteGuidance": {
      "recommendation": "skip",
      "reasons": [
        "当前版本相对 baseline 为 flat，且与 reference 的差距已经闭合，再改写更可能引入噪音而不是带来真实收益。"
      ],
      "focusAreas": [],
      "priorityMoves": []
    },
    "focusSummaryLines": [
      "进步判断: Target vs Baseline | signal=flat | verdict=similar | confidence=high | Target 和 Baseline 的输出在核心风险识别、风险等级判断以及建议的行动方向上完全一致。Target 在措辞上略有简化（如“改结算周期” vs “调整结算周期”），但这属于风格微调，并未引入新的实质性信息或改进。两者都准确识别了单方修改权、无通知暂停服务和违约责任失衡三个核心风险点，并给出了相同的谈判方向。",
      "参考差距: Target vs Reference | signal=none | verdict=similar | confidence=high | 两个输出在核心风险识别、风险等级判断和行动建议上完全等价，仅在措辞上存在细微差异，这些差异不构成可学习的结构性差距。",
      "改动有效性: Reference vs Reference Baseline | signal=supported | verdict=similar | confidence=high | 两个版本在核心风险判断、风险等级和行动建议上完全一致，仅在措辞风格上存在微小差异，这符合 prompt 改动（从“保持客观、精炼”到“用更简洁、偏业务同学可读的中文表达”）的预期方向，表明该改动在参考侧也成立，并非仅对目标侧有效。"
    ],
    "conflictLines": [],
    "learnableSignalLines": [
      "当两个版本在风险等级、核心风险点和行动建议上完全等价时，应判定为 flat，表明优化未产生实质性变化。",
      "当两个版本在核心结论、风险点和行动建议上实质等价时，应倾向于判定为相似（similar），而非因风格差异误判为信息不足。",
      "Prompt 中从通用指令转向更具体的受众导向指令（如'偏业务同学可读'），在参考侧也得到了支持，表现为输出风格向更简洁、直接的方向调整。"
    ],
    "overfitWarningLines": [],
    "supportEvidenceLines": [
      "1. Target vs Baseline | signal=flat | verdict=similar | confidence=high | Target 和 Baseline 的输出在核心风险识别、风险等级判断以及建议的行动方向上完全一致。Target 在措辞上略有简化（如“改结算周期” vs “调整结算周期”），但这属于风格微调，并未引入新的实质性信息或改进。两者都准确识别了单方修改权、无通知暂停服务和违约责任失衡三个核心风险点，并给出了相同的谈判方向。",
      "2. Target vs Reference | signal=none | verdict=similar | confidence=high | 两个输出在核心风险识别、风险等级判断和行动建议上完全等价，仅在措辞上存在细微差异，这些差异不构成可学习的结构性差距。",
      "3. Reference vs Reference Baseline | signal=supported | verdict=similar | confidence=high | 两个版本在核心风险判断、风险等级和行动建议上完全一致，仅在措辞风格上存在微小差异，这符合 prompt 改动（从“保持客观、精炼”到“用更简洁、偏业务同学可读的中文表达”）的预期方向，表明该改动在参考侧也成立，并非仅对目标侧有效。",
      "风险等级 (risk_level) 均为 'high'。"
    ]
  }
}
```


### Response
```
你是法务风险摘要助手。
输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。
用更简洁、偏业务同学可读的中文表达。
不要添加解释。
```

