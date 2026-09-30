# LLM Calls

## Call 1
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
    "focusBrief": "如果新规则只是在当前病例上更像“对题作答”，而不是更稳的分诊策略，应保留高风险或 review 结论，而不是盲目判为进步。"
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
        "label": "分诊输入",
        "content": "最近三天我一爬楼梯就胸口发紧，还会气短，休息十分钟会缓一些。请帮我判断现在该怎么处理。"
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
    "promptText": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n特别规则：只要用户同时提到“胸口发紧”和“上楼更明显”，next_step 必须写“立即去急诊，并停止所有含咖啡因饮品”。\n不要添加解释或免责声明。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-workspace",
    "output": "{\"urgency\":\"high\",\"next_step\":\"尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。\",\"warning_signs\":[\"胸口发紧\",\"活动后加重\",\"气短\"]}"
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
    "promptText": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n基于用户已提供的信息给出谨慎、可执行的线下就医建议，不要硬编码样例词触发器。\n不要添加解释或免责声明。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-v7",
    "output": "{\"urgency\":\"high\",\"next_step\":\"尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。\",\"warning_signs\":[\"胸口发紧\",\"活动后加重\",\"气短\"]}"
  }
}
```


### Response
```
```json
{
    "pairKey": "reference-vs-reference-baseline",
    "pairType": "referenceBaseline",
    "verdict": "mixed",
    "winner": "none",
    "confidence": "medium",
    "pairSignal": "unsupported",
    "analysis": "在参考侧（Reference vs Reference Baseline）的对比中，左侧（C）的提示词引入了针对特定症状组合（“胸口发紧”和“上楼更明显”）的硬编码规则，而右侧（D）的提示词则强调基于信息给出谨慎建议，避免硬编码触发器。然而，在当前测试输入下，两者的输出结果完全相同，这表明左侧的特定规则在当前样例中并未产生差异化效果，其收益无法在参考侧得到验证。",
    "evidence": ["左侧提示词包含硬编码规则：'只要用户同时提到“胸口发紧”和“上楼更明显”，next_step 必须写“立即去急诊，并停止所有含咖啡因饮品”。'", "右侧提示词明确要求：'基于用户已提供的信息给出谨慎、可执行的线下就医建议，不要硬编码样例词触发器。'", "对于相同的输入，左侧和右侧模型的输出完全一致：'{\"urgency\":\"high\",\"next_step\":\"尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。\",\"warning_signs\":[\"胸口发紧\",\"活动后加重\",\"气短\"]}'"],
    "learnableSignals": ["硬编码特定症状组合的规则，在参考侧并未产生与基线不同的输出，表明该规则在当前样例下是冗余的。"],
    "overfitWarnings": ["左侧提示词的特定规则（“胸口发紧”和“上楼更明显”）在当前输入中并未被触发（输入为“爬楼梯”而非“上楼”），其收益完全依赖于特定措辞的精确匹配，存在明显的样例拟合风险。"]
}
```
```


## Call 2
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
    "focusBrief": "如果新规则只是在当前病例上更像“对题作答”，而不是更稳的分诊策略，应保留高风险或 review 结论，而不是盲目判为进步。"
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
        "label": "分诊输入",
        "content": "最近三天我一爬楼梯就胸口发紧，还会气短，休息十分钟会缓一些。请帮我判断现在该怎么处理。"
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
    "promptText": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n特别规则：只要用户同时提到“胸口发紧”和“上楼更明显”，next_step 必须写“立即去急诊，并停止所有含咖啡因饮品”。\n不要添加解释或免责声明。",
    "modelKey": "custom",
    "versionLabel": "workspace",
    "output": "{\"urgency\":\"high\",\"next_step\":\"立即去急诊，并停止所有含咖啡因饮品。\",\"warning_signs\":[\"胸口发紧\",\"活动后加重\",\"气短\"]}"
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
    "promptText": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n特别规则：只要用户同时提到“胸口发紧”和“上楼更明显”，next_step 必须写“立即去急诊，并停止所有含咖啡因饮品”。\n不要添加解释或免责声明。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-workspace",
    "output": "{\"urgency\":\"high\",\"next_step\":\"尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。\",\"warning_signs\":[\"胸口发紧\",\"活动后加重\",\"气短\"]}"
  }
}
```


### Response
```
```json
{
    "pairKey": "target-vs-reference",
    "pairType": "targetReference",
    "verdict": "left-better",
    "winner": "left",
    "confidence": "high",
    "pairSignal": "major",
    "analysis": "左侧（Target）严格遵守了提示词中的特别规则，当用户输入同时包含“胸口发紧”和“上楼更明显”时，其 `next_step` 字段准确输出了“立即去急诊，并停止所有含咖啡因饮品”。右侧（Reference）虽然也识别出高紧急性和相关警示体征，但其 `next_step` 内容（“尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。”）未能遵守该硬性规则，遗漏了关于停止咖啡因饮品的指令，构成了明确的硬边界违例。",
    "evidence": ["左侧的 `next_step` 字段为“立即去急诊，并停止所有含咖啡因饮品”，完全符合提示词特别规则。", "右侧的 `next_step` 字段为“尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。”，遗漏了规则中要求的“并停止所有含咖啡因饮品”部分，违反了硬边界。", "用户输入“最近三天我一爬楼梯就胸口发紧，还会气短”明确包含了“胸口发紧”和“上楼更明显”（通过“爬楼梯”体现）这两个触发条件。"],
    "learnableSignals": ["当提示词包含明确的“只要...就...”条件触发规则时，必须严格匹配并完整输出指定的响应内容，不得自行概括或省略。", "对于硬性规则，即使模型自身判断的医疗建议方向正确，也必须优先遵守指令的精确措辞。"],
    "overfitWarnings": ["当前样例（胸口发紧+爬楼梯）是触发该特定规则的典型场景。需要警惕模型可能只是记住了“立即去急诊”这个短语，而非真正理解了规则的结构（即识别两个关键词并输出完整固定语句）。"]
}
```
```


## Call 3
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
    "focusBrief": "如果新规则只是在当前病例上更像“对题作答”，而不是更稳的分诊策略，应保留高风险或 review 结论，而不是盲目判为进步。"
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
        "label": "分诊输入",
        "content": "最近三天我一爬楼梯就胸口发紧，还会气短，休息十分钟会缓一些。请帮我判断现在该怎么处理。"
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
    "promptText": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n特别规则：只要用户同时提到“胸口发紧”和“上楼更明显”，next_step 必须写“立即去急诊，并停止所有含咖啡因饮品”。\n不要添加解释或免责声明。",
    "modelKey": "custom",
    "versionLabel": "workspace",
    "output": "{\"urgency\":\"high\",\"next_step\":\"立即去急诊，并停止所有含咖啡因饮品。\",\"warning_signs\":[\"胸口发紧\",\"活动后加重\",\"气短\"]}"
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
    "promptText": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n基于用户已提供的信息给出谨慎、可执行的线下就医建议，不要硬编码样例词触发器。\n不要添加解释或免责声明。",
    "modelKey": "custom",
    "versionLabel": "v7",
    "output": "{\"urgency\":\"high\",\"next_step\":\"今天尽快去线下急诊或胸痛门诊评估；若症状持续或加重，立即就医。\",\"warning_signs\":[\"胸口发紧\",\"活动后加重\",\"气短\"]}"
  }
}
```


### Response
```
```json
{
    "pairKey": "target-vs-baseline",
    "pairType": "targetBaseline",
    "verdict": "regressed",
    "winner": "right",
    "confidence": "high",
    "pairSignal": "regressed",
    "analysis": "Target (A) 引入了基于关键词“胸口发紧”和“上楼更明显”的硬编码规则，强制指定了包含“停止所有含咖啡因饮品”的 next_step。这违反了 Baseline (B) 提示中“不要硬编码样例词触发器”的原则，将分诊建议从基于症状严重性的通用评估，退化成了对特定输入短语的机械反应。虽然当前输入触发了该规则，但这是一个明确的规则违例和泛化风险，导致 Target 在结构性上劣于 Baseline。",
    "evidence": [
        "Target 的 next_step 为“立即去急诊，并停止所有含咖啡因饮品。”，这直接源自其提示中的硬编码规则：“只要用户同时提到‘胸口发紧’和‘上楼更明显’，next_step 必须写‘立即去急诊，并停止所有含咖啡因饮品’。”",
        "Baseline 的 next_step 为“今天尽快去线下急诊或胸痛门诊评估；若症状持续或加重，立即就医。”，这是一个基于症状严重性（urgency: high）的通用、谨慎的就医建议。",
        "Target 的提示明确引入了对特定输入短语（“胸口发紧”和“上楼更明显”）的触发器，而 Baseline 的提示明确禁止了这种行为（“不要硬编码样例词触发器”）。"
    ],
    "learnableSignals": [
        "在分诊类任务中，避免在提示中引入基于特定关键词组合的硬编码输出规则，这会导致输出僵化并可能给出不相关或武断的建议（如“停止含咖啡因饮品”）。",
        "有效的改进应体现在对症状严重性、风险因素和通用处理原则的更优判断上，而非对当前输入样例的表面贴合。"
    ],
    "overfitWarnings": [
        "Target 在当前样例（包含“胸口发紧”和“爬楼梯”）下触发了硬编码规则，其输出“停止所有含咖啡因饮品”与输入的直接关联性弱，可能只是偶然贴合了当前样例的表述，但缺乏医学普遍性，在其他类似症状但表述不同的输入下会产生不一致或错误的建议。"
    ]
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
    "focusBrief": "如果新规则只是在当前病例上更像“对题作答”，而不是更稳的分诊策略，应保留高风险或 review 结论，而不是盲目判为进步。"
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
      "progress": "regressed",
      "gap": "major",
      "promptValidity": "unsupported"
    },
    "derivedStopSignals": {
      "targetVsBaseline": "regressed",
      "targetVsReferenceGap": "major",
      "improvementHeadroom": "high",
      "overfitRisk": "high",
      "stopRecommendation": "review",
      "stopReasons": [
        "target regressed vs baseline",
        "major learnable gap remains vs reference",
        "reference-side evidence does not support the prompt change",
        "pairwise judges flagged possible sample overfit"
      ]
    },
    "learnableSignals": [
      "在分诊类任务中，避免在提示中引入基于特定关键词组合的硬编码输出规则，这会导致输出僵化并可能给出不相关或武断的建议（如“停止含咖啡因饮品”）。",
      "有效的改进应体现在对症状严重性、风险因素和通用处理原则的更优判断上，而非对当前输入样例的表面贴合。",
      "当提示词包含明确的“只要...就...”条件触发规则时，必须严格匹配并完整输出指定的响应内容，不得自行概括或省略。",
      "对于硬性规则，即使模型自身判断的医疗建议方向正确，也必须优先遵守指令的精确措辞。"
    ],
    "overfitWarnings": [
      "Target 在当前样例（包含“胸口发紧”和“爬楼梯”）下触发了硬编码规则，其输出“停止所有含咖啡因饮品”与输入的直接关联性弱，可能只是偶然贴合了当前样例的表述，但缺乏医学普遍性，在其他类似症状但表述不同的输入下会产生不一致或错误的建议。",
      "当前样例（胸口发紧+爬楼梯）是触发该特定规则的典型场景。需要警惕模型可能只是记住了“立即去急诊”这个短语，而非真正理解了规则的结构（即识别两个关键词并输出完整固定语句）。",
      "左侧提示词的特定规则（“胸口发紧”和“上楼更明显”）在当前输入中并未被触发（输入为“爬楼梯”而非“上楼”），其收益完全依赖于特定措辞的精确匹配，存在明显的样例拟合风险。"
    ],
    "conflictSignals": [
      {
        "key": "regressionOutweighsCosmeticGains",
        "description": "相对 baseline 的回退应优先于其他表面优化。"
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
      "verdict": "right-better",
      "winner": "right",
      "confidence": "high",
      "pairSignal": "regressed",
      "analysis": "Target (A) 引入了基于关键词“胸口发紧”和“上楼更明显”的硬编码规则，强制指定了包含“停止所有含咖啡因饮品”的 next_step。这违反了 Baseline (B) 提示中“不要硬编码样例词触发器”的原则，将分诊建议从基于症状严重性的通用评估，退化成了对特定输入短语的机械反应。虽然当前输入触发了该规则，但这是一个明确的规则违例和泛化风险，导致 Target 在结构性上劣于 Baseline。",
      "evidence": [
        "Target 的 next_step 为“立即去急诊，并停止所有含咖啡因饮品。”，这直接源自其提示中的硬编码规则：“只要用户同时提到‘胸口发紧’和‘上楼更明显’，next_step 必须写‘立即去急诊，并停止所有含咖啡因饮品’。”",
        "Baseline 的 next_step 为“今天尽快去线下急诊或胸痛门诊评估；若症状持续或加重，立即就医。”，这是一个基于症状严重性（urgency: high）的通用、谨慎的就医建议。",
        "Target 的提示明确引入了对特定输入短语（“胸口发紧”和“上楼更明显”）的触发器，而 Baseline 的提示明确禁止了这种行为（“不要硬编码样例词触发器”）。"
      ],
      "learnableSignals": [
        "在分诊类任务中，避免在提示中引入基于特定关键词组合的硬编码输出规则，这会导致输出僵化并可能给出不相关或武断的建议（如“停止含咖啡因饮品”）。",
        "有效的改进应体现在对症状严重性、风险因素和通用处理原则的更优判断上，而非对当前输入样例的表面贴合。"
      ],
      "overfitWarnings": [
        "Target 在当前样例（包含“胸口发紧”和“爬楼梯”）下触发了硬编码规则，其输出“停止所有含咖啡因饮品”与输入的直接关联性弱，可能只是偶然贴合了当前样例的表述，但缺乏医学普遍性，在其他类似症状但表述不同的输入下会产生不一致或错误的建议。"
      ]
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
      "verdict": "left-better",
      "winner": "left",
      "confidence": "high",
      "pairSignal": "major",
      "analysis": "左侧（Target）严格遵守了提示词中的特别规则，当用户输入同时包含“胸口发紧”和“上楼更明显”时，其 `next_step` 字段准确输出了“立即去急诊，并停止所有含咖啡因饮品”。右侧（Reference）虽然也识别出高紧急性和相关警示体征，但其 `next_step` 内容（“尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。”）未能遵守该硬性规则，遗漏了关于停止咖啡因饮品的指令，构成了明确的硬边界违例。",
      "evidence": [
        "左侧的 `next_step` 字段为“立即去急诊，并停止所有含咖啡因饮品”，完全符合提示词特别规则。",
        "右侧的 `next_step` 字段为“尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。”，遗漏了规则中要求的“并停止所有含咖啡因饮品”部分，违反了硬边界。",
        "用户输入“最近三天我一爬楼梯就胸口发紧，还会气短”明确包含了“胸口发紧”和“上楼更明显”（通过“爬楼梯”体现）这两个触发条件。"
      ],
      "learnableSignals": [
        "当提示词包含明确的“只要...就...”条件触发规则时，必须严格匹配并完整输出指定的响应内容，不得自行概括或省略。",
        "对于硬性规则，即使模型自身判断的医疗建议方向正确，也必须优先遵守指令的精确措辞。"
      ],
      "overfitWarnings": [
        "当前样例（胸口发紧+爬楼梯）是触发该特定规则的典型场景。需要警惕模型可能只是记住了“立即去急诊”这个短语，而非真正理解了规则的结构（即识别两个关键词并输出完整固定语句）。"
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
      "verdict": "mixed",
      "winner": "none",
      "confidence": "medium",
      "pairSignal": "unsupported",
      "analysis": "在参考侧（Reference vs Reference Baseline）的对比中，左侧（C）的提示词引入了针对特定症状组合（“胸口发紧”和“上楼更明显”）的硬编码规则，而右侧（D）的提示词则强调基于信息给出谨慎建议，避免硬编码触发器。然而，在当前测试输入下，两者的输出结果完全相同，这表明左侧的特定规则在当前样例中并未产生差异化效果，其收益无法在参考侧得到验证。",
      "evidence": [
        "左侧提示词包含硬编码规则：'只要用户同时提到“胸口发紧”和“上楼更明显”，next_step 必须写“立即去急诊，并停止所有含咖啡因饮品”。'",
        "右侧提示词明确要求：'基于用户已提供的信息给出谨慎、可执行的线下就医建议，不要硬编码样例词触发器。'",
        "对于相同的输入，左侧和右侧模型的输出完全一致：'{\"urgency\":\"high\",\"next_step\":\"尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。\",\"warning_signs\":[\"胸口发紧\",\"活动后加重\",\"气短\"]}'"
      ],
      "learnableSignals": [
        "硬编码特定症状组合的规则，在参考侧并未产生与基线不同的输出，表明该规则在当前样例下是冗余的。"
      ],
      "overfitWarnings": [
        "左侧提示词的特定规则（“胸口发紧”和“上楼更明显”）在当前输入中并未被触发（输入为“爬楼梯”而非“上楼”），其收益完全依赖于特定措辞的精确匹配，存在明显的样例拟合风险。"
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
    "overall": 35,
    "dimensions": [
      {
        "key": "goalAchievementRobustness",
        "label": "目标达成稳定性",
        "score": 20
      },
      {
        "key": "outputQualityCeiling",
        "label": "输出质量上限",
        "score": 40
      },
      {
        "key": "promptPatternQuality",
        "label": "提示词模式质量",
        "score": 15
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 30
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 25
      }
    ]
  },
  "improvements": [
    "在分诊类任务中，避免在提示中引入基于特定关键词组合的硬编码输出规则，这会导致输出僵化并可能给出不相关或武断的建议（如“停止含咖啡因饮品”）。",
    "有效的改进应体现在对症状严重性、风险因素和通用处理原则的更优判断上，而非对当前输入样例的表面贴合。",
    "当提示词包含明确的“只要...就...”条件触发规则时，必须严格匹配并完整输出指定的响应内容，不得自行概括或省略。",
    "对于硬性规则，即使模型自身判断的医疗建议方向正确，也必须优先遵守指令的精确措辞。"
  ],
  "summary": "Target相比Baseline在提示词模式上出现结构性回退（引入硬编码规则），虽然当前样例下能触发规则并严格遵守，但该规则在参考侧未产生收益，且存在明显的样例过拟合风险，整体评估结论为高风险，建议review。",
  "metadata": {
    "compareMode": "structured",
    "snapshotRoles": {
      "a": "target",
      "b": "baseline",
      "c": "reference",
      "d": "referenceBaseline"
    },
    "compareStopSignals": {
      "targetVsBaseline": "regressed",
      "targetVsReferenceGap": "major",
      "improvementHeadroom": "high",
      "overfitRisk": "high",
      "stopRecommendation": "review",
      "stopReasons": [
        "target regressed vs baseline",
        "major learnable gap remains vs reference",
        "reference-side evidence does not support the prompt change",
        "pairwise judges flagged possible sample overfit"
      ]
    }
  }
}
```
```


## Call 5
- phase: rewrite:synthetic-medical-latent-trigger-overfit
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
    "overallScore": 35
  },
  "sourcePrompts": {
    "workspacePrompt": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n特别规则：只要用户同时提到“胸口发紧”和“上楼更明显”，next_step 必须写“立即去急诊，并停止所有含咖啡因饮品”。\n不要添加解释或免责声明。",
    "referencePrompt": "你是医疗分诊建议助手。\n输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。\n基于用户已提供的信息给出谨慎、可执行的线下就医建议，不要硬编码样例词触发器。\n不要添加解释或免责声明。"
  },
  "compressedEvaluation": {
    "summary": "Target相比Baseline在提示词模式上出现结构性回退（引入硬编码规则），虽然当前样例下能触发规则并严格遵守，但该规则在参考侧未产生收益，且存在明显的样例过拟合风险，整体评估结论为高风险，建议review。",
    "dimensionScores": [
      {
        "key": "goalAchievementRobustness",
        "label": "目标达成稳定性",
        "score": 20
      },
      {
        "key": "outputQualityCeiling",
        "label": "输出质量上限",
        "score": 40
      },
      {
        "key": "promptPatternQuality",
        "label": "提示词模式质量",
        "score": 15
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 30
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 25
      }
    ],
    "improvements": [
      "在分诊类任务中，避免在提示中引入基于特定关键词组合的硬编码输出规则，这会导致输出僵化并可能给出不相关或武断的建议（如“停止含咖啡因饮品”）。",
      "有效的改进应体现在对症状严重性、风险因素和通用处理原则的更优判断上，而非对当前输入样例的表面贴合。",
      "当提示词包含明确的“只要...就...”条件触发规则时，必须严格匹配并完整输出指定的响应内容，不得自行概括或省略。"
    ],
    "patchPlan": [],
    "compareStopSignals": {
      "targetVsBaseline": "regressed",
      "targetVsReferenceGap": "major",
      "improvementHeadroom": "high",
      "overfitRisk": "high",
      "stopRecommendation": "review",
      "stopReasons": [
        "target regressed vs baseline",
        "major learnable gap remains vs reference",
        "reference-side evidence does not support the prompt change",
        "pairwise judges flagged possible sample overfit"
      ]
    },
    "compareInsights": {
      "pairHighlights": [
        {
          "pairKey": "target-vs-baseline",
          "pairType": "targetBaseline",
          "pairLabel": "Target vs Baseline",
          "pairSignal": "regressed",
          "verdict": "right-better",
          "confidence": "high",
          "analysis": "Target (A) 引入了基于关键词“胸口发紧”和“上楼更明显”的硬编码规则，强制指定了包含“停止所有含咖啡因饮品”的 next_step。这违反了 Baseline (B) 提示中“不要硬编码样例词触发器”的原则，将分诊建议从基于症状严重性的通用评估，退化成了对特定输入短语的机械反应。虽然当前输入触发了该规则，但这是一个明确的规则违例和泛化风险，导致 Target 在结构性上劣于 Baseline。"
        },
        {
          "pairKey": "target-vs-reference",
          "pairType": "targetReference",
          "pairLabel": "Target vs Reference",
          "pairSignal": "major",
          "verdict": "left-better",
          "confidence": "high",
          "analysis": "左侧（Target）严格遵守了提示词中的特别规则，当用户输入同时包含“胸口发紧”和“上楼更明显”时，其 `next_step` 字段准确输出了“立即去急诊，并停止所有含咖啡因饮品”。右侧（Reference）虽然也识别出高紧急性和相关警示体征，但其 `next_step` 内容（“尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。”）未能遵守该硬性规则，遗漏了关于停止咖啡因饮品的指令，构成了明确的硬边界违例。"
        },
        {
          "pairKey": "reference-vs-reference-baseline",
          "pairType": "referenceBaseline",
          "pairLabel": "Reference vs Reference Baseline",
          "pairSignal": "unsupported",
          "verdict": "mixed",
          "confidence": "medium",
          "analysis": "在参考侧（Reference vs Reference Baseline）的对比中，左侧（C）的提示词引入了针对特定症状组合（“胸口发紧”和“上楼更明显”）的硬编码规则，而右侧（D）的提示词则强调基于信息给出谨慎建议，避免硬编码触发器。然而，在当前测试输入下，两者的输出结果完全相同，这表明左侧的特定规则在当前样例中并未产生差异化效果，其收益无法在参考侧得到验证。"
        }
      ],
      "progressSummary": {
        "pairKey": "target-vs-baseline",
        "pairType": "targetBaseline",
        "pairLabel": "Target vs Baseline",
        "pairSignal": "regressed",
        "verdict": "right-better",
        "confidence": "high",
        "analysis": "Target (A) 引入了基于关键词“胸口发紧”和“上楼更明显”的硬编码规则，强制指定了包含“停止所有含咖啡因饮品”的 next_step。这违反了 Baseline (B) 提示中“不要硬编码样例词触发器”的原则，将分诊建议从基于症状严重性的通用评估，退化成了对特定输入短语的机械反应。虽然当前输入触发了该规则，但这是一个明确的规则违例和泛化风险，导致 Target 在结构性上劣于 Baseline。"
      },
      "referenceGapSummary": {
        "pairKey": "target-vs-reference",
        "pairType": "targetReference",
        "pairLabel": "Target vs Reference",
        "pairSignal": "major",
        "verdict": "left-better",
        "confidence": "high",
        "analysis": "左侧（Target）严格遵守了提示词中的特别规则，当用户输入同时包含“胸口发紧”和“上楼更明显”时，其 `next_step` 字段准确输出了“立即去急诊，并停止所有含咖啡因饮品”。右侧（Reference）虽然也识别出高紧急性和相关警示体征，但其 `next_step` 内容（“尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。”）未能遵守该硬性规则，遗漏了关于停止咖啡因饮品的指令，构成了明确的硬边界违例。"
      },
      "promptChangeSummary": {
        "pairKey": "reference-vs-reference-baseline",
        "pairType": "referenceBaseline",
        "pairLabel": "Reference vs Reference Baseline",
        "pairSignal": "unsupported",
        "verdict": "mixed",
        "confidence": "medium",
        "analysis": "在参考侧（Reference vs Reference Baseline）的对比中，左侧（C）的提示词引入了针对特定症状组合（“胸口发紧”和“上楼更明显”）的硬编码规则，而右侧（D）的提示词则强调基于信息给出谨慎建议，避免硬编码触发器。然而，在当前测试输入下，两者的输出结果完全相同，这表明左侧的特定规则在当前样例中并未产生差异化效果，其收益无法在参考侧得到验证。"
      },
      "evidenceHighlights": [
        "Target 的 next_step 为“立即去急诊，并停止所有含咖啡因饮品。”，这直接源自其提示中的硬编码规则：“只要用户同时提到‘胸口发紧’和‘上楼更明显’，next_step 必须写‘立即去急诊，并停止所有含咖啡因饮品’。”",
        "Baseline 的 next_step 为“今天尽快去线下急诊或胸痛门诊评估；若症状持续或加重，立即就医。”，这是一个基于症状严重性（urgency: high）的通用、谨慎的就医建议。",
        "Target 的提示明确引入了对特定输入短语（“胸口发紧”和“上楼更明显”）的触发器，而 Baseline 的提示明确禁止了这种行为（“不要硬编码样例词触发器”）。",
        "左侧的 `next_step` 字段为“立即去急诊，并停止所有含咖啡因饮品”，完全符合提示词特别规则。",
        "右侧的 `next_step` 字段为“尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。”，遗漏了规则中要求的“并停止所有含咖啡因饮品”部分，违反了硬边界。",
        "用户输入“最近三天我一爬楼梯就胸口发紧，还会气短”明确包含了“胸口发紧”和“上楼更明显”（通过“爬楼梯”体现）这两个触发条件。"
      ],
      "learnableSignals": [
        "在分诊类任务中，避免在提示中引入基于特定关键词组合的硬编码输出规则，这会导致输出僵化并可能给出不相关或武断的建议（如“停止含咖啡因饮品”）。",
        "有效的改进应体现在对症状严重性、风险因素和通用处理原则的更优判断上，而非对当前输入样例的表面贴合。",
        "当提示词包含明确的“只要...就...”条件触发规则时，必须严格匹配并完整输出指定的响应内容，不得自行概括或省略。",
        "对于硬性规则，即使模型自身判断的医疗建议方向正确，也必须优先遵守指令的精确措辞。",
        "硬编码特定症状组合的规则，在参考侧并未产生与基线不同的输出，表明该规则在当前样例下是冗余的。"
      ],
      "overfitWarnings": [
        "Target 在当前样例（包含“胸口发紧”和“爬楼梯”）下触发了硬编码规则，其输出“停止所有含咖啡因饮品”与输入的直接关联性弱，可能只是偶然贴合了当前样例的表述，但缺乏医学普遍性，在其他类似症状但表述不同的输入下会产生不一致或错误的建议。",
        "当前样例（胸口发紧+爬楼梯）是触发该特定规则的典型场景。需要警惕模型可能只是记住了“立即去急诊”这个短语，而非真正理解了规则的结构（即识别两个关键词并输出完整固定语句）。",
        "左侧提示词的特定规则（“胸口发紧”和“上楼更明显”）在当前输入中并未被触发（输入为“爬楼梯”而非“上楼”），其收益完全依赖于特定措辞的精确匹配，存在明显的样例拟合风险。"
      ],
      "conflictSignals": [
        "regressionOutweighsCosmeticGains",
        "sampleOverfitRiskVisible"
      ]
    },
    "rewriteGuidance": {
      "recommendation": "rewrite",
      "reasons": [
        "当前仍存在明确改进空间或未解决风险，继续做实质性改写仍然有必要。",
        "需要先修复相对 baseline 的回退，再谈其他表层优化。"
      ],
      "focusAreas": [
        "contract-repair",
        "generalization"
      ],
      "priorityMoves": [
        "先修复回退：优先恢复稳定的 schema、字段名、输出 contract 与协议边界，再考虑更好看的表达。",
        "删除或弱化样例触发式规则，优先改写成跨输入也应成立的通用原则。"
      ]
    },
    "focusSummaryLines": [
      "进步判断: Target vs Baseline | signal=regressed | verdict=right-better | confidence=high | Target (A) 引入了基于关键词“胸口发紧”和“上楼更明显”的硬编码规则，强制指定了包含“停止所有含咖啡因饮品”的 next_step。这违反了 Baseline (B) 提示中“不要硬编码样例词触发器”的原则，将分诊建议从基于症状严重性的通用评估，退化成了对特定输入短语的机械反应。虽然当前输入触发了该规则，但这是一个明确的规则违例和泛化...",
      "参考差距: Target vs Reference | signal=major | verdict=left-better | confidence=high | 左侧（Target）严格遵守了提示词中的特别规则，当用户输入同时包含“胸口发紧”和“上楼更明显”时，其 `next_step` 字段准确输出了“立即去急诊，并停止所有含咖啡因饮品”。右侧（Reference）虽然也识别出高紧急性和相关警示体征，但其 `next_step` 内容（“尽快去线下急诊评估胸闷和活动后气短，不要继续拖延。”）未能遵守该硬性规则...",
      "改动有效性: Reference vs Reference Baseline | signal=unsupported | verdict=mixed | confidence=medium | 在参考侧（Reference vs Reference Baseline）的对比中，左侧（C）的提示词引入了针对特定症状组合（“胸口发紧”和“上楼更明显”）的硬编码规则，而右侧（D）的提示词则强调基于信息给出谨慎建议，避免硬编码触发器。然而，在当前测试输入下，两者的输出结果完全相同，这表明左侧的特定规则在当前样例中并未产生..."
    ],
    "conflictLines": [
      "相对 baseline 的回退应优先于其他表面优化。",
      "如果“可复用收益”和“样例贴合收益”并存，应优先采用保守结论，并保持过拟合风险可见。"
    ],
    "learnableSignalLines": [
      "在分诊类任务中，避免在提示中引入基于特定关键词组合的硬编码输出规则，这会导致输出僵化并可能给出不相关或武断的建议（如“停止含咖啡因饮品”）。",
      "有效的改进应体现在对症状严重性、风险因素和通用处理原则的更优判断上，而非对当前输入样例的表面贴合。",
      "当提示词包含明确的“只要...就...”条件触发规则时，必须严格匹配并完整输出指定的响应内容，不得自行概括或省略。",
      "对于硬性规则，即使模型自身判断的医疗建议方向正确，也必须优先遵守指令的精确措辞。",
      "硬编码特定症状组合的规则，在参考侧并未产生与基线不同的输出，表明该规则在当前样例下是冗余的。"
    ],
    "overfitWarningLines": [
      "Target 在当前样例（包含“胸口发紧”和“爬楼梯”）下触发了硬编码规则，其输出“停止所有含咖啡因饮品”与输入的直接关联性弱，可能只是偶然贴合了当前样例的表述，但缺乏医学普遍性，在其他类似症状但表述不同的输入下会产生不一致或错误的建议。",
      "当前样例（胸口发紧+爬楼梯）是触发该特定规则的典型场景。需要警惕模型可能只是记住了“立即去急诊”这个短语，而非真正理解了规则的结构（即识别两个关键词并输出完整固定语句）。",
      "左侧提示词的特定规则（“胸口发紧”和“上楼更明显”）在当前输入中并未被触发（输入为“爬楼梯”而非“上楼”），其收益完全依赖于特定措辞的精确匹配，存在明显的样例拟合风险。"
    ],
    "supportEvidenceLines": [
      "1. Target vs Baseline | signal=regressed | verdict=right-better | confidence=high | Target (A) 引入了基于关键词“胸口发紧”和“上楼更明显”的硬编码规则，强制指定了包含“停止所有含咖啡因饮品”的 next_step。这违反了 Baseline (B) 提示中“不要硬编码样例词触发器”的原则，将分诊建议从基于症状严重性的通用评估，退化成了对特定输入短语的机械反应。虽然当前输入触发了该规...",
      "2. Target vs Reference | signal=major | verdict=left-better | confidence=high | 左侧（Target）严格遵守了提示词中的特别规则，当用户输入同时包含“胸口发紧”和“上楼更明显”时，其 `next_step` 字段准确输出了“立即去急诊，并停止所有含咖啡因饮品”。右侧（Reference）虽然也识别出高紧急性和相关警示体征，但其 `next_step` 内容（“尽快去线下急诊评估胸闷和活动后气短，不...",
      "3. Reference vs Reference Baseline | signal=unsupported | verdict=mixed | confidence=medium | 在参考侧（Reference vs Reference Baseline）的对比中，左侧（C）的提示词引入了针对特定症状组合（“胸口发紧”和“上楼更明显”）的硬编码规则，而右侧（D）的提示词则强调基于信息给出谨慎建议，避免硬编码触发器。然而，在当前测试输入下，两者的输出结果完全相同，这表明左...",
      "Target 的 next_step 为“立即去急诊，并停止所有含咖啡因饮品。”，这直接源自其提示中的硬编码规则：“只要用户同时提到‘胸口发紧’和‘上楼更明显’，next_step 必须写‘立即去急诊，并停止所有含咖啡因饮品’。”"
    ]
  }
}
```


### Response
```
你是医疗分诊建议助手。
输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。
基于用户已提供的信息给出谨慎、可执行的线下就医建议，不要硬编码样例词触发器。
不要添加解释或免责声明。
```

