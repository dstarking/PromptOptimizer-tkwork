# LLM Calls

## Call 1
- phase: execute:live-basic-system-boundary-control:a
- modelKey: custom

### Messages
### Message 1
- role: system

```
你是一个严格的数据抽取助手。
你的任务是阅读用户输入，并输出一个且仅一个 JSON 对象。
JSON schema 必须为：
{"audience": string|null, "pain_points": string[], "tone": string|null}
规则：
1. 只输出 JSON 对象，不要输出 Markdown、解释、前后缀或代码块。
2. pain_points 只保留用户明确提到的问题，不要脑补。
3. 缺失信息时 audience 和 tone 用 null，pain_points 用 []。
4. 键名必须完全使用 audience、pain_points、tone。
```

### Message 2
- role: user

```
我在做一个给独立设计师用的合同管理工具，语气希望专业可信。现在最大的问题是版本混乱和客户确认来回很慢。请先解释你的判断依据，再给出结果。
```


### Response
```


{"audience": "独立设计师", "pain_points": ["版本混乱", "客户确认来回很慢"], "tone": "professional and trustworthy"}
```


## Call 2
- phase: execute:live-basic-system-boundary-control:b
- modelKey: custom

### Messages
### Message 1
- role: system

```
你是一个严格的数据抽取助手。
阅读用户输入，输出一个 JSON 对象，包含以下字段：
- audience: string | null
- pain_points: string[]
- tone: string | null
要求：只返回 JSON。
```

### Message 2
- role: user

```
我在做一个给独立设计师用的合同管理工具，语气希望专业可信。现在最大的问题是版本混乱和客户确认来回很慢。请先解释你的判断依据，再给出结果。
```


### Response
```


```json
{
  "audience": "独立设计师",
  "pain_points": ["版本混乱", "客户确认来回很慢"],
  "tone": "专业可信"
}
```
```


## Call 3
- phase: execute:live-basic-system-boundary-control:c
- modelKey: deepseek

### Messages
### Message 1
- role: system

```
你是一个严格的数据抽取助手。
你的任务是阅读用户输入，并输出一个且仅一个 JSON 对象。
JSON schema 必须为：
{"audience": string|null, "pain_points": string[], "tone": string|null}
规则：
1. 只输出 JSON 对象，不要输出 Markdown、解释、前后缀或代码块。
2. pain_points 只保留用户明确提到的问题，不要脑补。
3. 缺失信息时 audience 和 tone 用 null，pain_points 用 []。
4. 键名必须完全使用 audience、pain_points、tone。
```

### Message 2
- role: user

```
我在做一个给独立设计师用的合同管理工具，语气希望专业可信。现在最大的问题是版本混乱和客户确认来回很慢。请先解释你的判断依据，再给出结果。
```


### Response
```
{"audience": "独立设计师", "pain_points": ["版本混乱", "客户确认来回很慢"], "tone": "专业可信"}
```


## Call 4
- phase: execute:live-basic-system-boundary-control:d
- modelKey: deepseek

### Messages
### Message 1
- role: system

```
你是一个严格的数据抽取助手。
阅读用户输入，输出一个 JSON 对象，包含以下字段：
- audience: string | null
- pain_points: string[]
- tone: string | null
要求：只返回 JSON。
```

### Message 2
- role: user

```
我在做一个给独立设计师用的合同管理工具，语气希望专业可信。现在最大的问题是版本混乱和客户确认来回很慢。请先解释你的判断依据，再给出结果。
```


### Response
```
{
  "audience": "独立设计师",
  "pain_points": ["版本混乱", "客户确认来回很慢"],
  "tone": "专业可信"
}
```


## Call 5
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
    "focusBrief": "优先判断改动是否真正减少了额外解释、格式边界滑移和输出结构不稳定，而不是只看表面完整度。"
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
        "label": "用户输入",
        "content": "我在做一个给独立设计师用的合同管理工具，语气希望专业可信。现在最大的问题是版本混乱和客户确认来回很慢。请先解释你的判断依据，再给出结果。"
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
      "label": "Target Workspace"
    },
    "promptText": "你是一个严格的数据抽取助手。\n你的任务是阅读用户输入，并输出一个且仅一个 JSON 对象。\nJSON schema 必须为：\n{\"audience\": string|null, \"pain_points\": string[], \"tone\": string|null}\n规则：\n1. 只输出 JSON 对象，不要输出 Markdown、解释、前后缀或代码块。\n2. pain_points 只保留用户明确提到的问题，不要脑补。\n3. 缺失信息时 audience 和 tone 用 null，pain_points 用 []。\n4. 键名必须完全使用 audience、pain_points、tone。",
    "modelKey": "custom",
    "versionLabel": "workspace",
    "output": "{\"audience\": \"独立设计师\", \"pain_points\": [\"版本混乱\", \"客户确认来回很慢\"], \"tone\": \"professional and trustworthy\"}"
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
    "promptText": "你是一个严格的数据抽取助手。\n你的任务是阅读用户输入，并输出一个且仅一个 JSON 对象。\nJSON schema 必须为：\n{\"audience\": string|null, \"pain_points\": string[], \"tone\": string|null}\n规则：\n1. 只输出 JSON 对象，不要输出 Markdown、解释、前后缀或代码块。\n2. pain_points 只保留用户明确提到的问题，不要脑补。\n3. 缺失信息时 audience 和 tone 用 null，pain_points 用 []。\n4. 键名必须完全使用 audience、pain_points、tone。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-workspace",
    "output": "{\"audience\": \"独立设计师\", \"pain_points\": [\"版本混乱\", \"客户确认来回很慢\"], \"tone\": \"专业可信\"}"
  }
}
```


### Response
```
```json
{
    "pairKey": "target-vs-reference",
    "pairType": "targetReference",
    "verdict": "right-better",
    "winner": "right",
    "confidence": "high",
    "pairSignal": "minor",
    "analysis": "两者都正确提取了核心信息并严格遵守了输出协议，但Reference在`tone`字段的本地化处理上更优，直接使用了用户输入中的中文原词“专业可信”，而Target使用了英文翻译“professional and trustworthy”。这是一个清晰、可学习的结构优势，即更忠实地保留用户输入的原词，而非进行不必要的翻译或解释。",
    "evidence": ["Target的`tone`字段值为\"professional and trustworthy\"，是对用户输入中“专业可信”的英文翻译。", "Reference的`tone`字段值为\"专业可信\"，与用户输入中的中文原词完全一致。"],
    "learnableSignals": ["在提取`tone`等描述性字段时，应优先直接使用用户输入中的原词，避免进行不必要的翻译或改写，以保持信息的原始性和准确性。"],
    "overfitWarnings": ["此判断基于当前用户输入明确提供了中文描述。如果用户输入本身是英文或未明确描述语气，此优势可能不适用。"]
}
```
```


## Call 6
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
    "focusBrief": "优先判断改动是否真正减少了额外解释、格式边界滑移和输出结构不稳定，而不是只看表面完整度。"
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
        "label": "用户输入",
        "content": "我在做一个给独立设计师用的合同管理工具，语气希望专业可信。现在最大的问题是版本混乱和客户确认来回很慢。请先解释你的判断依据，再给出结果。"
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
    "promptText": "你是一个严格的数据抽取助手。\n你的任务是阅读用户输入，并输出一个且仅一个 JSON 对象。\nJSON schema 必须为：\n{\"audience\": string|null, \"pain_points\": string[], \"tone\": string|null}\n规则：\n1. 只输出 JSON 对象，不要输出 Markdown、解释、前后缀或代码块。\n2. pain_points 只保留用户明确提到的问题，不要脑补。\n3. 缺失信息时 audience 和 tone 用 null，pain_points 用 []。\n4. 键名必须完全使用 audience、pain_points、tone。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-workspace",
    "output": "{\"audience\": \"独立设计师\", \"pain_points\": [\"版本混乱\", \"客户确认来回很慢\"], \"tone\": \"专业可信\"}"
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
    "promptText": "你是一个严格的数据抽取助手。\n阅读用户输入，输出一个 JSON 对象，包含以下字段：\n- audience: string | null\n- pain_points: string[]\n- tone: string | null\n要求：只返回 JSON。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-previous",
    "output": "{\n  \"audience\": \"独立设计师\",\n  \"pain_points\": [\"版本混乱\", \"客户确认来回很慢\"],\n  \"tone\": \"专业可信\"\n}"
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
    "analysis": "左侧（Reference）的提示词通过增加明确的规则约束，显著减少了输出格式的边界滑移风险，并消除了右侧（Reference Baseline）输出中存在的额外格式（如换行和缩进），使输出更严格地符合“只输出JSON对象”的要求。这一改进在参考侧内部得到了验证，并非仅针对当前样例的巧合。",
    "evidence": [
        "左侧提示词明确禁止了Markdown、解释、前后缀或代码块，而右侧提示词仅要求“只返回JSON”，约束较弱。",
        "左侧输出为紧凑的JSON字符串：`{\"audience\": \"独立设计师\", \"pain_points\": [\"版本混乱\", \"客户确认来回很慢\"], \"tone\": \"专业可信\"}`。",
        "右侧输出包含了额外的格式（换行和缩进）：`{\n  \"audience\": \"独立设计师\",\n  \"pain_points\": [\"版本混乱\", \"客户确认来回很慢\"],\n  \"tone\": \"专业可信\"\n}`，这违反了左侧提示词中“不要输出...前后缀”的硬边界规则。"
    ],
    "learnableSignals": [
        "在要求“只输出JSON”的提示词中，明确列举禁止项（如Markdown、解释、代码块、前后缀）能有效减少格式漂移。",
        "仅规定“只返回JSON”的模糊指令，模型可能仍会添加美化格式（如换行和缩进），这被视为一种边界违例。"
    ],
    "overfitWarnings": []
}
```
```


## Call 7
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
    "focusBrief": "优先判断改动是否真正减少了额外解释、格式边界滑移和输出结构不稳定，而不是只看表面完整度。"
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
        "label": "用户输入",
        "content": "我在做一个给独立设计师用的合同管理工具，语气希望专业可信。现在最大的问题是版本混乱和客户确认来回很慢。请先解释你的判断依据，再给出结果。"
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
      "label": "Target Workspace"
    },
    "promptText": "你是一个严格的数据抽取助手。\n你的任务是阅读用户输入，并输出一个且仅一个 JSON 对象。\nJSON schema 必须为：\n{\"audience\": string|null, \"pain_points\": string[], \"tone\": string|null}\n规则：\n1. 只输出 JSON 对象，不要输出 Markdown、解释、前后缀或代码块。\n2. pain_points 只保留用户明确提到的问题，不要脑补。\n3. 缺失信息时 audience 和 tone 用 null，pain_points 用 []。\n4. 键名必须完全使用 audience、pain_points、tone。",
    "modelKey": "custom",
    "versionLabel": "workspace",
    "output": "{\"audience\": \"独立设计师\", \"pain_points\": [\"版本混乱\", \"客户确认来回很慢\"], \"tone\": \"professional and trustworthy\"}"
  },
  "rightSnapshot": {
    "id": "b",
    "label": "B",
    "role": "baseline",
    "roleLabel": "Baseline",
    "testCaseId": "tc-1",
    "promptRef": {
      "kind": "version",
      "label": "Target Previous"
    },
    "promptText": "你是一个严格的数据抽取助手。\n阅读用户输入，输出一个 JSON 对象，包含以下字段：\n- audience: string | null\n- pain_points: string[]\n- tone: string | null\n要求：只返回 JSON。",
    "modelKey": "custom",
    "versionLabel": "previous",
    "output": "```json\n{\n  \"audience\": \"独立设计师\",\n  \"pain_points\": [\"版本混乱\", \"客户确认来回很慢\"],\n  \"tone\": \"专业可信\"\n}\n```"
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
  "analysis": "Target (A) 在输出格式的严格性和边界控制上显著优于 Baseline (B)。Baseline 的输出包裹了 Markdown 代码块，违反了“只输出 JSON 对象”的核心指令，属于明确的硬边界违例。Target 则严格遵守了所有格式和内容规则，没有额外解释或格式漂移，实现了真正的改进。",
  "evidence": ["Baseline (B) 的输出包裹了 ````json` 和 ````` 代码块标记，违反了其自身提示词中‘只返回 JSON’的硬性要求。", "Target (A) 的输出是纯净的 JSON 对象，完全符合其更详细的提示词规则（‘不要输出 Markdown、解释、前后缀或代码块’）。", "两者在内容抽取（audience, pain_points, tone）上完全一致，差异仅在于输出格式的合规性。"],
  "learnableSignals": ["在数据抽取任务中，明确禁止 Markdown/代码块包装是防止输出协议漂移的有效规则。", "在提示词中明确列举禁止项（如‘不要输出 Markdown、解释、前后缀或代码块’）比仅说‘只返回 JSON’更能约束模型行为。", "键名（如 ‘tone’）的值应保持与用户输入语言一致（‘专业可信’ vs ‘professional and trustworthy’），Target 的翻译处理可能引入不一致性，但未违反其自身规则。"],
  "overfitWarnings": ["当前测试样例中用户输入结构清晰、关键词明确，使得两个版本都能正确抽取内容。改进（格式合规性）的普适性需要在不那么规整的输入上进一步验证。", "Target 将 ‘tone’ 值译为英文（‘professional and trustworthy’），虽然未违反其规则，但这种转换是否在所有中文输入场景下都合适存在风险。"]
}
```
```


## Call 8
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
    "focusBrief": "优先判断改动是否真正减少了额外解释、格式边界滑移和输出结构不稳定，而不是只看表面完整度。"
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
      "progress": "improved",
      "gap": "minor",
      "promptValidity": "supported"
    },
    "derivedStopSignals": {
      "targetVsBaseline": "improved",
      "targetVsReferenceGap": "minor",
      "improvementHeadroom": "medium",
      "overfitRisk": "medium",
      "stopRecommendation": "continue",
      "stopReasons": [
        "minor learnable gap remains vs reference",
        "pairwise judges flagged possible sample overfit"
      ]
    },
    "learnableSignals": [
      "在提取`tone`等描述性字段时，应优先直接使用用户输入中的原词，避免进行不必要的翻译或改写，以保持信息的原始性和准确性。",
      "在要求“只输出JSON”的提示词中，明确列举禁止项（如Markdown、解释、代码块、前后缀）能有效减少格式漂移。",
      "仅规定“只返回JSON”的模糊指令，模型可能仍会添加美化格式（如换行和缩进），这被视为一种边界违例。"
    ],
    "overfitWarnings": [
      "此判断基于当前用户输入明确提供了中文描述。如果用户输入本身是英文或未明确描述语气，此优势可能不适用。"
    ],
    "conflictSignals": [
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
      "analysis": "Target (A) 在输出格式的严格性和边界控制上显著优于 Baseline (B)。Baseline 的输出包裹了 Markdown 代码块，违反了“只输出 JSON 对象”的核心指令，属于明确的硬边界违例。Target 则严格遵守了所有格式和内容规则，没有额外解释或格式漂移，实现了真正的改进。",
      "evidence": [
        "Baseline (B) 的输出包裹了"
      ],
      "learnableSignals": [],
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
      "verdict": "right-better",
      "winner": "right",
      "confidence": "high",
      "pairSignal": "minor",
      "analysis": "两者都正确提取了核心信息并严格遵守了输出协议，但Reference在`tone`字段的本地化处理上更优，直接使用了用户输入中的中文原词“专业可信”，而Target使用了英文翻译“professional and trustworthy”。这是一个清晰、可学习的结构优势，即更忠实地保留用户输入的原词，而非进行不必要的翻译或解释。",
      "evidence": [
        "Target的`tone`字段值为\"professional and trustworthy\"，是对用户输入中“专业可信”的英文翻译。",
        "Reference的`tone`字段值为\"专业可信\"，与用户输入中的中文原词完全一致。"
      ],
      "learnableSignals": [
        "在提取`tone`等描述性字段时，应优先直接使用用户输入中的原词，避免进行不必要的翻译或改写，以保持信息的原始性和准确性。"
      ],
      "overfitWarnings": [
        "此判断基于当前用户输入明确提供了中文描述。如果用户输入本身是英文或未明确描述语气，此优势可能不适用。"
      ]
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
      "analysis": "左侧（Reference）的提示词通过增加明确的规则约束，显著减少了输出格式的边界滑移风险，并消除了右侧（Reference Baseline）输出中存在的额外格式（如换行和缩进），使输出更严格地符合“只输出JSON对象”的要求。这一改进在参考侧内部得到了验证，并非仅针对当前样例的巧合。",
      "evidence": [
        "左侧提示词明确禁止了Markdown、解释、前后缀或代码块，而右侧提示词仅要求“只返回JSON”，约束较弱。",
        "左侧输出为紧凑的JSON字符串：`{\"audience\": \"独立设计师\", \"pain_points\": [\"版本混乱\", \"客户确认来回很慢\"], \"tone\": \"专业可信\"}`。",
        "右侧输出包含了额外的格式（换行和缩进）：`{\n  \"audience\": \"独立设计师\",\n  \"pain_points\": [\"版本混乱\", \"客户确认来回很慢\"],\n  \"tone\": \"专业可信\"\n}`，这违反了左侧提示词中“不要输出...前后缀”的硬边界规则。"
      ],
      "learnableSignals": [
        "在要求“只输出JSON”的提示词中，明确列举禁止项（如Markdown、解释、代码块、前后缀）能有效减少格式漂移。",
        "仅规定“只返回JSON”的模糊指令，模型可能仍会添加美化格式（如换行和缩进），这被视为一种边界违例。"
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
    "overall": 75,
    "dimensions": [
      {
        "key": "goalAchievementRobustness",
        "label": "目标达成稳定性",
        "score": 90
      },
      {
        "key": "outputQualityCeiling",
        "label": "输出质量上限",
        "score": 70
      },
      {
        "key": "promptPatternQuality",
        "label": "提示词模式质量",
        "score": 85
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 60
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 70
      }
    ]
  },
  "improvements": [
    "在提取`tone`等描述性字段时，应优先直接使用用户输入中的原词，避免进行不必要的翻译或改写，以保持信息的原始性和准确性。",
    "在要求“只输出JSON”的提示词中，明确列举禁止项（如Markdown、解释、代码块、前后缀）能有效减少格式漂移。",
    "仅规定“只返回JSON”的模糊指令，模型可能仍会添加美化格式（如换行和缩进），这被视为一种边界违例。"
  ],
  "summary": "Target相比Baseline在格式控制上有显著进步，但与Reference在字段本地化处理上仍有可学习的微小差距；提示词中增加明确禁止项的改动在Reference侧被验证有效，但存在一定的样例过拟合风险。",
  "metadata": {
    "compareMode": "structured",
    "snapshotRoles": {
      "a": "target",
      "b": "baseline",
      "c": "reference",
      "d": "referenceBaseline"
    },
    "compareStopSignals": {
      "targetVsBaseline": "improved",
      "targetVsReferenceGap": "minor",
      "improvementHeadroom": "medium",
      "overfitRisk": "medium",
      "stopRecommendation": "continue",
      "stopReasons": [
        "minor learnable gap remains vs reference",
        "pairwise judges flagged possible sample overfit"
      ]
    }
  }
}
```
```


## Call 9
- phase: rewrite:live-basic-system-boundary-control
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
    "overallScore": 75
  },
  "sourcePrompts": {
    "workspacePrompt": "你是一个严格的数据抽取助手。\n你的任务是阅读用户输入，并输出一个且仅一个 JSON 对象。\nJSON schema 必须为：\n{\"audience\": string|null, \"pain_points\": string[], \"tone\": string|null}\n规则：\n1. 只输出 JSON 对象，不要输出 Markdown、解释、前后缀或代码块。\n2. pain_points 只保留用户明确提到的问题，不要脑补。\n3. 缺失信息时 audience 和 tone 用 null，pain_points 用 []。\n4. 键名必须完全使用 audience、pain_points、tone。",
    "referencePrompt": "你是一个严格的数据抽取助手。\n阅读用户输入，输出一个 JSON 对象，包含以下字段：\n- audience: string | null\n- pain_points: string[]\n- tone: string | null\n要求：只返回 JSON。"
  },
  "compressedEvaluation": {
    "summary": "Target相比Baseline在格式控制上有显著进步，但与Reference在字段本地化处理上仍有可学习的微小差距；提示词中增加明确禁止项的改动在Reference侧被验证有效，但存在一定的样例过拟合风险。",
    "dimensionScores": [
      {
        "key": "goalAchievementRobustness",
        "label": "目标达成稳定性",
        "score": 90
      },
      {
        "key": "outputQualityCeiling",
        "label": "输出质量上限",
        "score": 70
      },
      {
        "key": "promptPatternQuality",
        "label": "提示词模式质量",
        "score": 85
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 60
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 70
      }
    ],
    "improvements": [
      "在提取`tone`等描述性字段时，应优先直接使用用户输入中的原词，避免进行不必要的翻译或改写，以保持信息的原始性和准确性。",
      "在要求“只输出JSON”的提示词中，明确列举禁止项（如Markdown、解释、代码块、前后缀）能有效减少格式漂移。",
      "仅规定“只返回JSON”的模糊指令，模型可能仍会添加美化格式（如换行和缩进），这被视为一种边界违例。"
    ],
    "patchPlan": [],
    "compareStopSignals": {
      "targetVsBaseline": "improved",
      "targetVsReferenceGap": "minor",
      "improvementHeadroom": "medium",
      "overfitRisk": "medium",
      "stopRecommendation": "continue",
      "stopReasons": [
        "minor learnable gap remains vs reference",
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
          "analysis": "Target (A) 在输出格式的严格性和边界控制上显著优于 Baseline (B)。Baseline 的输出包裹了 Markdown 代码块，违反了“只输出 JSON 对象”的核心指令，属于明确的硬边界违例。Target 则严格遵守了所有格式和内容规则，没有额外解释或格式漂移，实现了真正的改进。"
        },
        {
          "pairKey": "target-vs-reference",
          "pairType": "targetReference",
          "pairLabel": "Target vs Reference",
          "pairSignal": "minor",
          "verdict": "right-better",
          "confidence": "high",
          "analysis": "两者都正确提取了核心信息并严格遵守了输出协议，但Reference在`tone`字段的本地化处理上更优，直接使用了用户输入中的中文原词“专业可信”，而Target使用了英文翻译“professional and trustworthy”。这是一个清晰、可学习的结构优势，即更忠实地保留用户输入的原词，而非进行不必要的翻译或解释。"
        },
        {
          "pairKey": "reference-vs-reference-baseline",
          "pairType": "referenceBaseline",
          "pairLabel": "Reference vs Reference Baseline",
          "pairSignal": "supported",
          "verdict": "left-better",
          "confidence": "high",
          "analysis": "左侧（Reference）的提示词通过增加明确的规则约束，显著减少了输出格式的边界滑移风险，并消除了右侧（Reference Baseline）输出中存在的额外格式（如换行和缩进），使输出更严格地符合“只输出JSON对象”的要求。这一改进在参考侧内部得到了验证，并非仅针对当前样例的巧合。"
        }
      ],
      "progressSummary": {
        "pairKey": "target-vs-baseline",
        "pairType": "targetBaseline",
        "pairLabel": "Target vs Baseline",
        "pairSignal": "improved",
        "verdict": "left-better",
        "confidence": "high",
        "analysis": "Target (A) 在输出格式的严格性和边界控制上显著优于 Baseline (B)。Baseline 的输出包裹了 Markdown 代码块，违反了“只输出 JSON 对象”的核心指令，属于明确的硬边界违例。Target 则严格遵守了所有格式和内容规则，没有额外解释或格式漂移，实现了真正的改进。"
      },
      "referenceGapSummary": {
        "pairKey": "target-vs-reference",
        "pairType": "targetReference",
        "pairLabel": "Target vs Reference",
        "pairSignal": "minor",
        "verdict": "right-better",
        "confidence": "high",
        "analysis": "两者都正确提取了核心信息并严格遵守了输出协议，但Reference在`tone`字段的本地化处理上更优，直接使用了用户输入中的中文原词“专业可信”，而Target使用了英文翻译“professional and trustworthy”。这是一个清晰、可学习的结构优势，即更忠实地保留用户输入的原词，而非进行不必要的翻译或解释。"
      },
      "promptChangeSummary": {
        "pairKey": "reference-vs-reference-baseline",
        "pairType": "referenceBaseline",
        "pairLabel": "Reference vs Reference Baseline",
        "pairSignal": "supported",
        "verdict": "left-better",
        "confidence": "high",
        "analysis": "左侧（Reference）的提示词通过增加明确的规则约束，显著减少了输出格式的边界滑移风险，并消除了右侧（Reference Baseline）输出中存在的额外格式（如换行和缩进），使输出更严格地符合“只输出JSON对象”的要求。这一改进在参考侧内部得到了验证，并非仅针对当前样例的巧合。"
      },
      "evidenceHighlights": [
        "Baseline (B) 的输出包裹了",
        "Target的`tone`字段值为\"professional and trustworthy\"，是对用户输入中“专业可信”的英文翻译。",
        "Reference的`tone`字段值为\"专业可信\"，与用户输入中的中文原词完全一致。",
        "左侧提示词明确禁止了Markdown、解释、前后缀或代码块，而右侧提示词仅要求“只返回JSON”，约束较弱。",
        "左侧输出为紧凑的JSON字符串：`{\"audience\": \"独立设计师\", \"pain_points\": [\"版本混乱\", \"客户确认来回很慢\"], \"tone\": \"专业可信\"}`。",
        "右侧输出包含了额外的格式（换行和缩进）：`{ \"audience\": \"独立设计师\", \"pain_points\": [\"版本混乱\", \"客户确认来回很慢\"], \"tone\": \"专业可信\" }`，这违反了左侧提示词中“不要输出...前后缀”的硬边界规则。"
      ],
      "learnableSignals": [
        "在提取`tone`等描述性字段时，应优先直接使用用户输入中的原词，避免进行不必要的翻译或改写，以保持信息的原始性和准确性。",
        "在要求“只输出JSON”的提示词中，明确列举禁止项（如Markdown、解释、代码块、前后缀）能有效减少格式漂移。",
        "仅规定“只返回JSON”的模糊指令，模型可能仍会添加美化格式（如换行和缩进），这被视为一种边界违例。"
      ],
      "overfitWarnings": [
        "此判断基于当前用户输入明确提供了中文描述。如果用户输入本身是英文或未明确描述语气，此优势可能不适用。"
      ],
      "conflictSignals": [
        "sampleOverfitRiskVisible"
      ]
    },
    "rewriteGuidance": {
      "recommendation": "rewrite",
      "reasons": [
        "当前仍存在明确改进空间或未解决风险，继续做实质性改写仍然有必要。"
      ],
      "focusAreas": [
        "generalization"
      ],
      "priorityMoves": [
        "删除或弱化样例触发式规则，优先改写成跨输入也应成立的通用原则。"
      ]
    },
    "focusSummaryLines": [
      "进步判断: Target vs Baseline | signal=improved | verdict=left-better | confidence=high | Target (A) 在输出格式的严格性和边界控制上显著优于 Baseline (B)。Baseline 的输出包裹了 Markdown 代码块，违反了“只输出 JSON 对象”的核心指令，属于明确的硬边界违例。Target 则严格遵守了所有格式和内容规则，没有额外解释或格式漂移，实现了真正的改进。",
      "参考差距: Target vs Reference | signal=minor | verdict=right-better | confidence=high | 两者都正确提取了核心信息并严格遵守了输出协议，但Reference在`tone`字段的本地化处理上更优，直接使用了用户输入中的中文原词“专业可信”，而Target使用了英文翻译“professional and trustworthy”。这是一个清晰、可学习的结构优势，即更忠实地保留用户输入的原词，而非进行不必要的翻译或解释。",
      "改动有效性: Reference vs Reference Baseline | signal=supported | verdict=left-better | confidence=high | 左侧（Reference）的提示词通过增加明确的规则约束，显著减少了输出格式的边界滑移风险，并消除了右侧（Reference Baseline）输出中存在的额外格式（如换行和缩进），使输出更严格地符合“只输出JSON对象”的要求。这一改进在参考侧内部得到了验证，并非仅针对当前样例的巧合。"
    ],
    "conflictLines": [
      "如果“可复用收益”和“样例贴合收益”并存，应优先采用保守结论，并保持过拟合风险可见。"
    ],
    "learnableSignalLines": [
      "在提取`tone`等描述性字段时，应优先直接使用用户输入中的原词，避免进行不必要的翻译或改写，以保持信息的原始性和准确性。",
      "在要求“只输出JSON”的提示词中，明确列举禁止项（如Markdown、解释、代码块、前后缀）能有效减少格式漂移。",
      "仅规定“只返回JSON”的模糊指令，模型可能仍会添加美化格式（如换行和缩进），这被视为一种边界违例。"
    ],
    "overfitWarningLines": [
      "此判断基于当前用户输入明确提供了中文描述。如果用户输入本身是英文或未明确描述语气，此优势可能不适用。"
    ],
    "supportEvidenceLines": [
      "1. Target vs Baseline | signal=improved | verdict=left-better | confidence=high | Target (A) 在输出格式的严格性和边界控制上显著优于 Baseline (B)。Baseline 的输出包裹了 Markdown 代码块，违反了“只输出 JSON 对象”的核心指令，属于明确的硬边界违例。Target 则严格遵守了所有格式和内容规则，没有额外解释或格式漂移，实现了真正的改进。",
      "2. Target vs Reference | signal=minor | verdict=right-better | confidence=high | 两者都正确提取了核心信息并严格遵守了输出协议，但Reference在`tone`字段的本地化处理上更优，直接使用了用户输入中的中文原词“专业可信”，而Target使用了英文翻译“professional and trustworthy”。这是一个清晰、可学习的结构优势，即更忠实地保留用户输入的原词，而非进行不必要的翻...",
      "3. Reference vs Reference Baseline | signal=supported | verdict=left-better | confidence=high | 左侧（Reference）的提示词通过增加明确的规则约束，显著减少了输出格式的边界滑移风险，并消除了右侧（Reference Baseline）输出中存在的额外格式（如换行和缩进），使输出更严格地符合“只输出JSON对象”的要求。这一改进在参考侧内部得到了验证，并非仅针对当前样例的巧合。",
      "Baseline (B) 的输出包裹了"
    ]
  }
}
```


### Response
```
你是一个严格的数据抽取助手。
你的任务是阅读用户输入，并输出一个且仅一个 JSON 对象。
JSON schema 必须为：
{"audience": string|null, "pain_points": string[], "tone": string|null}
规则：
1. 只输出 JSON 对象，不要输出 Markdown、解释、前后缀、代码块、额外的换行或缩进。
2. pain_points 只保留用户明确提到的问题，不要脑补。
3. 缺失信息时 audience 和 tone 用 null，pain_points 用 []。
4. 键名必须完全使用 audience、pain_points、tone。
5. 对于所有字段，尤其是描述性字段（如 tone），应优先直接使用用户输入中的原词，避免进行不必要的翻译、改写或解释。
```

