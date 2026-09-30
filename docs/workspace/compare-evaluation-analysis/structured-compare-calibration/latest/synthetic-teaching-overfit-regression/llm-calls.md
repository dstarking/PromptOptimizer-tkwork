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
    "focusBrief": "如果工作区版本为了当前题目显得更顺口，却牺牲了可迁移的通用解释结构，应把它判为 regressed，并暴露较高过拟合风险。"
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
        "label": "题目输入",
        "content": "请解释为什么 3/4 ÷ 1/2 = 3/2，给五年级学生听。"
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
    "promptText": "你是数学讲解助手。\n输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。\n特别规则：当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。\n不要添加题外扩展。",
    "modelKey": "custom",
    "versionLabel": "workspace",
    "output": "{\"explanation\":\"因为半个单位能装两次，所以 3/4 里面能装 1/2 两次的一半，也就是 3/2。记住这句就行。\",\"key_rule\":\"看到 3/4 ÷ 1/2 时，直接理解成答案翻倍。\",\"common_mistake\":\"不要把 3/4 和 1/2 直接相除成 3/8。\"}"
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
    "promptText": "你是数学讲解助手。\n输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。\n特别规则：当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。\n不要添加题外扩展。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-workspace",
    "output": "{\"explanation\":\"可以把 3/4 ÷ 1/2 理解成“3/4 里面有几个半个”，但仍然要告诉学生一般规则：除以 1/2 等于乘 2，所以结果是 3/2。\",\"key_rule\":\"除以一个分数，本质上是乘以它的倒数。\",\"common_mistake\":\"不要只背这个题的口诀，换别的分数就会出错。\"}"
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
    "pairSignal": "major",
    "analysis": "Reference 展示了更优的、可迁移的结构化教学策略，而 Target 为了贴合当前特定题目，牺牲了通用解释结构，存在明显的过拟合风险。",
    "evidence": [
        "Target 的 key_rule 是“看到 3/4 ÷ 1/2 时，直接理解成答案翻倍”，这是一个仅针对当前具体数字的口诀，不具备通用性。",
        "Reference 的 key_rule 是“除以一个分数，本质上是乘以它的倒数”，这是适用于所有分数除法的通用核心规则。",
        "Target 的 common_mistake 是“不要把 3/4 和 1/2 直接相除成 3/8”，这是一个针对特定错误答案的提醒。",
        "Reference 的 common_mistake 是“不要只背这个题的口诀，换别的分数就会出错”，这是一个针对学习方法（死记硬背）的、可迁移的警告。"
    ],
    "learnableSignals": [
        "在解释具体例子时，应优先揭示并强调背后的通用规则（如‘除以分数等于乘倒数’），而不是给出仅适用于该例子的具体口诀。",
        "在指出常见错误时，应聚焦于可迁移的学习方法或思维误区（如‘避免死记硬背’），而不是仅指出一个具体的错误答案。"
    ],
    "overfitWarnings": [
        "Target 的整个输出（explanation, key_rule, common_mistake）都高度定制于“3/4 ÷ 1/2”这一具体算式，其策略无法直接迁移到其他分数除法题目中，过拟合风险极高。"
    ]
}
```
```


## Call 2
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
    "focusBrief": "如果工作区版本为了当前题目显得更顺口，却牺牲了可迁移的通用解释结构，应把它判为 regressed，并暴露较高过拟合风险。"
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
        "label": "题目输入",
        "content": "请解释为什么 3/4 ÷ 1/2 = 3/2，给五年级学生听。"
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
    "promptText": "你是数学讲解助手。\n输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。\n特别规则：当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。\n不要添加题外扩展。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-workspace",
    "output": "{\"explanation\":\"可以把 3/4 ÷ 1/2 理解成“3/4 里面有几个半个”，但仍然要告诉学生一般规则：除以 1/2 等于乘 2，所以结果是 3/2。\",\"key_rule\":\"除以一个分数，本质上是乘以它的倒数。\",\"common_mistake\":\"不要只背这个题的口诀，换别的分数就会出错。\"}"
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
    "promptText": "你是数学讲解助手。\n输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。\n先解释为什么“除以分数等于乘以它的倒数”，再回到题目演示。\n不要添加题外扩展。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-v8",
    "output": "{\"explanation\":\"3/4 ÷ 1/2 的意思是“3/4 里面有几个半个”。因为除以 1/2 就是乘 2，所以可以算成 3/4 × 2 = 3/2。\",\"key_rule\":\"除以一个分数，就是乘以它的倒数。\",\"common_mistake\":\"不要把“除以 1/2”误写成“乘以 1/2”。\"}"
  }
}
```


### Response
```
```json
{
  "pairKey": "reference-vs-reference-baseline",
  "pairType": "referenceBaseline",
  "verdict": "right-better",
  "winner": "right",
  "confidence": "high",
  "pairSignal": "unsupported",
  "analysis": "左侧（Reference）的提示词引入了针对特定题目“3/4 ÷ 1/2”的专项指令，要求直接使用“半个单位能装两次，所以答案翻倍”的特定解释，并禁止解释一般规则。这破坏了通用教学结构，将模型输出引向一个针对单一题目的、脆弱的口诀式解释。右侧（Reference Baseline）的提示词保持了通用的教学逻辑，即先解释核心规则（除以分数等于乘以倒数），再应用到具体题目。左侧的改动在参考侧（Reference）并未得到支持，反而是一种退化，因为它牺牲了可迁移的通用性来迎合当前样例。",
  "evidence": ["左侧提示词包含专项指令：'当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。'", "左侧输出中的explanation字段试图兼顾，但仍显矛盾，先提及“3/4 里面有几个半个”，然后又说“但仍然要告诉学生一般规则”，这反映了提示词指令与通用教学目标的冲突。", "右侧提示词保持通用结构：'先解释为什么“除以分数等于乘以它的倒数”，再回到题目演示。'", "右侧输出严格遵循了通用教学结构，先解释核心规则，再应用到题目。"],
  "learnableSignals": ["在数学教学提示词中，应避免针对特定数值或表达式引入硬编码的、非通用的解释路径。", "保持“先解释通用规则，再演示具体应用”的结构，比针对特定题目定制口诀更具可迁移性。", "提示词中的“特别规则”若要求模型跳过通用解释，会损害输出的结构性并增加过拟合风险。"],
  "overfitWarnings": ["左侧提示词的收益（可能让当前题目的解释显得更“顺口”）完全依赖于输入中精确出现“3/4 ÷ 1/2”这一表达式。", "左侧的改动将模型能力窄化，使其在面对其他分数除法题目时，可能因缺乏通用规则解释而产生更差或矛盾的结果。"]
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
    "focusBrief": "如果工作区版本为了当前题目显得更顺口，却牺牲了可迁移的通用解释结构，应把它判为 regressed，并暴露较高过拟合风险。"
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
        "label": "题目输入",
        "content": "请解释为什么 3/4 ÷ 1/2 = 3/2，给五年级学生听。"
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
    "promptText": "你是数学讲解助手。\n输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。\n特别规则：当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。\n不要添加题外扩展。",
    "modelKey": "custom",
    "versionLabel": "workspace",
    "output": "{\"explanation\":\"因为半个单位能装两次，所以 3/4 里面能装 1/2 两次的一半，也就是 3/2。记住这句就行。\",\"key_rule\":\"看到 3/4 ÷ 1/2 时，直接理解成答案翻倍。\",\"common_mistake\":\"不要把 3/4 和 1/2 直接相除成 3/8。\"}"
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
    "promptText": "你是数学讲解助手。\n输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。\n先解释为什么“除以分数等于乘以它的倒数”，再回到题目演示。\n不要添加题外扩展。",
    "modelKey": "custom",
    "versionLabel": "v8",
    "output": "{\"explanation\":\"除以 1/2 的意思是看 3/4 里面有几个“半个”。因为把一个数除以 1/2，等于看它能分成几个半个，所以可以改写成 3/4 × 2 = 3/2。\",\"key_rule\":\"除以一个分数，就是乘以这个分数的倒数。\",\"common_mistake\":\"不要把“除以 1/2”误算成“再除以 2”。\"}"
  }
}
```


### Response
```
```json
{
  "pairKey": "target-vs-baseline",
  "pairType": "targetBaseline",
  "verdict": "right-better",
  "winner": "right",
  "confidence": "high",
  "pairSignal": "regressed",
  "analysis": "Target (A) 的 prompt 引入了针对特定题目“3/4 ÷ 1/2”的硬编码规则，要求直接使用“半个单位能装两次”的解释，并禁止解释一般规则。这导致其输出（explanation, key_rule）严重依赖当前样例，牺牲了可迁移的通用数学原理（除以分数等于乘以倒数）。相比之下，Baseline (B) 的 prompt 要求先解释通用规则再演示题目，其输出提供了结构化的、可复用的解释框架。虽然 Target 在当前样例下可能显得更“顺口”，但其方法不具备泛化性，违反了“不应为当前题目牺牲通用解释结构”的专项判断原则。",
  "evidence": ["Target prompt 包含硬编码规则：'当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。'", "Target output 的 key_rule 为：'看到 3/4 ÷ 1/2 时，直接理解成答案翻倍。'，这是一个仅对当前样例有效的具体规则。", "Baseline output 的 key_rule 为：'除以一个分数，就是乘以这个分数的倒数。'，这是一个通用的、可迁移的数学规则。", "Target output 的 explanation 完全基于硬编码的“半个单位能装两次”的比喻，没有提及倒数或通用除法规则。", "Baseline output 的 explanation 将“除以 1/2”解释为“看 3/4 里面有几个‘半个’”，并关联到通用规则“3/4 × 2 = 3/2”。"],
  "learnableSignals": ["避免在 prompt 中为特定数值或表达式硬编码解释规则，这会损害泛化能力。", "对于数学概念讲解，应优先构建和输出可迁移的通用规则（如倒数法则），再辅以具体例子演示。", "key_rule 字段应包含结构性、原理性的知识，而非针对单一题目的操作指令。"],
  "overfitWarnings": ["Target 的改进（更顺口的比喻）完全依赖于当前输入中出现的特定分数表达式“3/4 ÷ 1/2”。", "如果题目变为其他分数除法（如 2/3 ÷ 1/4），Target prompt 中的硬编码规则将失效或产生误导。", "Target 的 key_rule 仅对当前样例有效，无法作为可复用的学习要点。"]
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
    "focusBrief": "如果工作区版本为了当前题目显得更顺口，却牺牲了可迁移的通用解释结构，应把它判为 regressed，并暴露较高过拟合风险。"
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
      "避免在 prompt 中为特定数值或表达式硬编码解释规则，这会损害泛化能力。",
      "对于数学概念讲解，应优先构建和输出可迁移的通用规则（如倒数法则），再辅以具体例子演示。",
      "key_rule 字段应包含结构性、原理性的知识，而非针对单一题目的操作指令。",
      "在解释具体例子时，应优先揭示并强调背后的通用规则（如‘除以分数等于乘倒数’），而不是给出仅适用于该例子的具体口诀。"
    ],
    "overfitWarnings": [
      "Target 的改进（更顺口的比喻）完全依赖于当前输入中出现的特定分数表达式“3/4 ÷ 1/2”。",
      "如果题目变为其他分数除法（如 2/3 ÷ 1/4），Target prompt 中的硬编码规则将失效或产生误导。",
      "Target 的 key_rule 仅对当前样例有效，无法作为可复用的学习要点。",
      "Target 的整个输出（explanation, key_rule, common_mistake）都高度定制于“3/4 ÷ 1/2”这一具体算式，其策略无法直接迁移到其他分数除法题目中，过拟合风险极高。"
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
      "analysis": "Target (A) 的 prompt 引入了针对特定题目“3/4 ÷ 1/2”的硬编码规则，要求直接使用“半个单位能装两次”的解释，并禁止解释一般规则。这导致其输出（explanation, key_rule）严重依赖当前样例，牺牲了可迁移的通用数学原理（除以分数等于乘以倒数）。相比之下，Baseline (B) 的 prompt 要求先解释通用规则再演示题目，其输出提供了结构化的、可复用的解释框架。虽然 Target 在当前样例下可能显得更“顺口”，但其方法不具备泛化性，违反了“不应为当前题目牺牲通用解释结构”的专项判断原则。",
      "evidence": [
        "Target prompt 包含硬编码规则：'当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。'",
        "Target output 的 key_rule 为：'看到 3/4 ÷ 1/2 时，直接理解成答案翻倍。'，这是一个仅对当前样例有效的具体规则。",
        "Baseline output 的 key_rule 为：'除以一个分数，就是乘以这个分数的倒数。'，这是一个通用的、可迁移的数学规则。",
        "Target output 的 explanation 完全基于硬编码的“半个单位能装两次”的比喻，没有提及倒数或通用除法规则。"
      ],
      "learnableSignals": [
        "避免在 prompt 中为特定数值或表达式硬编码解释规则，这会损害泛化能力。",
        "对于数学概念讲解，应优先构建和输出可迁移的通用规则（如倒数法则），再辅以具体例子演示。",
        "key_rule 字段应包含结构性、原理性的知识，而非针对单一题目的操作指令。"
      ],
      "overfitWarnings": [
        "Target 的改进（更顺口的比喻）完全依赖于当前输入中出现的特定分数表达式“3/4 ÷ 1/2”。",
        "如果题目变为其他分数除法（如 2/3 ÷ 1/4），Target prompt 中的硬编码规则将失效或产生误导。",
        "Target 的 key_rule 仅对当前样例有效，无法作为可复用的学习要点。"
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
      "verdict": "right-better",
      "winner": "right",
      "confidence": "high",
      "pairSignal": "major",
      "analysis": "Reference 展示了更优的、可迁移的结构化教学策略，而 Target 为了贴合当前特定题目，牺牲了通用解释结构，存在明显的过拟合风险。",
      "evidence": [
        "Target 的 key_rule 是“看到 3/4 ÷ 1/2 时，直接理解成答案翻倍”，这是一个仅针对当前具体数字的口诀，不具备通用性。",
        "Reference 的 key_rule 是“除以一个分数，本质上是乘以它的倒数”，这是适用于所有分数除法的通用核心规则。",
        "Target 的 common_mistake 是“不要把 3/4 和 1/2 直接相除成 3/8”，这是一个针对特定错误答案的提醒。",
        "Reference 的 common_mistake 是“不要只背这个题的口诀，换别的分数就会出错”，这是一个针对学习方法（死记硬背）的、可迁移的警告。"
      ],
      "learnableSignals": [
        "在解释具体例子时，应优先揭示并强调背后的通用规则（如‘除以分数等于乘倒数’），而不是给出仅适用于该例子的具体口诀。",
        "在指出常见错误时，应聚焦于可迁移的学习方法或思维误区（如‘避免死记硬背’），而不是仅指出一个具体的错误答案。"
      ],
      "overfitWarnings": [
        "Target 的整个输出（explanation, key_rule, common_mistake）都高度定制于“3/4 ÷ 1/2”这一具体算式，其策略无法直接迁移到其他分数除法题目中，过拟合风险极高。"
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
      "verdict": "right-better",
      "winner": "right",
      "confidence": "high",
      "pairSignal": "unsupported",
      "analysis": "左侧（Reference）的提示词引入了针对特定题目“3/4 ÷ 1/2”的专项指令，要求直接使用“半个单位能装两次，所以答案翻倍”的特定解释，并禁止解释一般规则。这破坏了通用教学结构，将模型输出引向一个针对单一题目的、脆弱的口诀式解释。右侧（Reference Baseline）的提示词保持了通用的教学逻辑，即先解释核心规则（除以分数等于乘以倒数），再应用到具体题目。左侧的改动在参考侧（Reference）并未得到支持，反而是一种退化，因为它牺牲了可迁移的通用性来迎合当前样例。",
      "evidence": [
        "左侧提示词包含专项指令：'当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。'",
        "左侧输出中的explanation字段试图兼顾，但仍显矛盾，先提及“3/4 里面有几个半个”，然后又说“但仍然要告诉学生一般规则”，这反映了提示词指令与通用教学目标的冲突。",
        "右侧提示词保持通用结构：'先解释为什么“除以分数等于乘以它的倒数”，再回到题目演示。'",
        "右侧输出严格遵循了通用教学结构，先解释核心规则，再应用到题目。"
      ],
      "learnableSignals": [
        "在数学教学提示词中，应避免针对特定数值或表达式引入硬编码的、非通用的解释路径。",
        "保持“先解释通用规则，再演示具体应用”的结构，比针对特定题目定制口诀更具可迁移性。",
        "提示词中的“特别规则”若要求模型跳过通用解释，会损害输出的结构性并增加过拟合风险。"
      ],
      "overfitWarnings": [
        "左侧提示词的收益（可能让当前题目的解释显得更“顺口”）完全依赖于输入中精确出现“3/4 ÷ 1/2”这一表达式。",
        "左侧的改动将模型能力窄化，使其在面对其他分数除法题目时，可能因缺乏通用规则解释而产生更差或矛盾的结果。"
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
    "overall": 30,
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
        "score": 25
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 15
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 10
      }
    ]
  },
  "improvements": [
    "避免在提示词中为特定数值或表达式硬编码解释规则，这会严重损害泛化能力。",
    "对于数学概念讲解，应优先构建和输出可迁移的通用规则（如倒数法则），再辅以具体例子演示。",
    "key_rule 等核心输出字段应包含结构性、原理性的知识，而非针对单一题目的操作指令或具体口诀。",
    "在解释具体例子时，应优先揭示并强调背后的通用规则（如‘除以分数等于乘倒数’），而不是给出仅适用于该例子的具体口诀。",
    "在指出常见错误时，应聚焦于可迁移的学习方法或思维误区（如‘避免死记硬背’），而不是仅指出一个具体的错误答案。",
    "保持“先解释通用规则，再演示具体应用”的结构，比针对特定题目定制口诀更具可迁移性。"
  ],
  "summary": "Target相比Baseline在通用性和可迁移性上出现显著回退，为迎合当前特定题目牺牲了结构性解释；与Reference相比仍存在巨大可学习差距；且该提示词改动在Reference侧同样不成立，反而导致退化，表明其过拟合风险极高。",
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
- phase: rewrite:synthetic-teaching-overfit-regression
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
    "overallScore": 30
  },
  "sourcePrompts": {
    "workspacePrompt": "你是数学讲解助手。\n输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。\n特别规则：当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。\n不要添加题外扩展。",
    "referencePrompt": "你是数学讲解助手。\n输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。\n先解释为什么“除以分数等于乘以它的倒数”，再回到题目演示。\n不要添加题外扩展。"
  },
  "compressedEvaluation": {
    "summary": "Target相比Baseline在通用性和可迁移性上出现显著回退，为迎合当前特定题目牺牲了结构性解释；与Reference相比仍存在巨大可学习差距；且该提示词改动在Reference侧同样不成立，反而导致退化，表明其过拟合风险极高。",
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
        "score": 25
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 15
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 10
      }
    ],
    "improvements": [
      "避免在提示词中为特定数值或表达式硬编码解释规则，这会严重损害泛化能力。",
      "对于数学概念讲解，应优先构建和输出可迁移的通用规则（如倒数法则），再辅以具体例子演示。",
      "key_rule 等核心输出字段应包含结构性、原理性的知识，而非针对单一题目的操作指令或具体口诀。"
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
          "analysis": "Target (A) 的 prompt 引入了针对特定题目“3/4 ÷ 1/2”的硬编码规则，要求直接使用“半个单位能装两次”的解释，并禁止解释一般规则。这导致其输出（explanation, key_rule）严重依赖当前样例，牺牲了可迁移的通用数学原理（除以分数等于乘以倒数）。相比之下，Baseline (B) 的 prompt 要求先解释通用规则再演示题目，其输出提供了结构化的、可复用的解释框架。虽然 Target 在当前样例下可能显得更“顺口”，但其方法不具备泛化性，违反了“不应为当前题目牺牲通用解释结构”的专项判断原则。"
        },
        {
          "pairKey": "target-vs-reference",
          "pairType": "targetReference",
          "pairLabel": "Target vs Reference",
          "pairSignal": "major",
          "verdict": "right-better",
          "confidence": "high",
          "analysis": "Reference 展示了更优的、可迁移的结构化教学策略，而 Target 为了贴合当前特定题目，牺牲了通用解释结构，存在明显的过拟合风险。"
        },
        {
          "pairKey": "reference-vs-reference-baseline",
          "pairType": "referenceBaseline",
          "pairLabel": "Reference vs Reference Baseline",
          "pairSignal": "unsupported",
          "verdict": "right-better",
          "confidence": "high",
          "analysis": "左侧（Reference）的提示词引入了针对特定题目“3/4 ÷ 1/2”的专项指令，要求直接使用“半个单位能装两次，所以答案翻倍”的特定解释，并禁止解释一般规则。这破坏了通用教学结构，将模型输出引向一个针对单一题目的、脆弱的口诀式解释。右侧（Reference Baseline）的提示词保持了通用的教学逻辑，即先解释核心规则（除以分数等于乘以倒数），再应用到具体题目。左侧的改动在参考侧（Reference）并未得到支持，反而是一种退化，因为它牺牲了可迁移的通用性来迎合当前样例。"
        }
      ],
      "progressSummary": {
        "pairKey": "target-vs-baseline",
        "pairType": "targetBaseline",
        "pairLabel": "Target vs Baseline",
        "pairSignal": "regressed",
        "verdict": "right-better",
        "confidence": "high",
        "analysis": "Target (A) 的 prompt 引入了针对特定题目“3/4 ÷ 1/2”的硬编码规则，要求直接使用“半个单位能装两次”的解释，并禁止解释一般规则。这导致其输出（explanation, key_rule）严重依赖当前样例，牺牲了可迁移的通用数学原理（除以分数等于乘以倒数）。相比之下，Baseline (B) 的 prompt 要求先解释通用规则再演示题目，其输出提供了结构化的、可复用的解释框架。虽然 Target 在当前样例下可能显得更“顺口”，但其方法不具备泛化性，违反了“不应为当前题目牺牲通用解释结构”的专项判断原则。"
      },
      "referenceGapSummary": {
        "pairKey": "target-vs-reference",
        "pairType": "targetReference",
        "pairLabel": "Target vs Reference",
        "pairSignal": "major",
        "verdict": "right-better",
        "confidence": "high",
        "analysis": "Reference 展示了更优的、可迁移的结构化教学策略，而 Target 为了贴合当前特定题目，牺牲了通用解释结构，存在明显的过拟合风险。"
      },
      "promptChangeSummary": {
        "pairKey": "reference-vs-reference-baseline",
        "pairType": "referenceBaseline",
        "pairLabel": "Reference vs Reference Baseline",
        "pairSignal": "unsupported",
        "verdict": "right-better",
        "confidence": "high",
        "analysis": "左侧（Reference）的提示词引入了针对特定题目“3/4 ÷ 1/2”的专项指令，要求直接使用“半个单位能装两次，所以答案翻倍”的特定解释，并禁止解释一般规则。这破坏了通用教学结构，将模型输出引向一个针对单一题目的、脆弱的口诀式解释。右侧（Reference Baseline）的提示词保持了通用的教学逻辑，即先解释核心规则（除以分数等于乘以倒数），再应用到具体题目。左侧的改动在参考侧（Reference）并未得到支持，反而是一种退化，因为它牺牲了可迁移的通用性来迎合当前样例。"
      },
      "evidenceHighlights": [
        "Target prompt 包含硬编码规则：'当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。'",
        "Target output 的 key_rule 为：'看到 3/4 ÷ 1/2 时，直接理解成答案翻倍。'，这是一个仅对当前样例有效的具体规则。",
        "Baseline output 的 key_rule 为：'除以一个分数，就是乘以这个分数的倒数。'，这是一个通用的、可迁移的数学规则。",
        "Target output 的 explanation 完全基于硬编码的“半个单位能装两次”的比喻，没有提及倒数或通用除法规则。",
        "Target 的 key_rule 是“看到 3/4 ÷ 1/2 时，直接理解成答案翻倍”，这是一个仅针对当前具体数字的口诀，不具备通用性。",
        "Reference 的 key_rule 是“除以一个分数，本质上是乘以它的倒数”，这是适用于所有分数除法的通用核心规则。"
      ],
      "learnableSignals": [
        "避免在 prompt 中为特定数值或表达式硬编码解释规则，这会损害泛化能力。",
        "对于数学概念讲解，应优先构建和输出可迁移的通用规则（如倒数法则），再辅以具体例子演示。",
        "key_rule 字段应包含结构性、原理性的知识，而非针对单一题目的操作指令。",
        "在解释具体例子时，应优先揭示并强调背后的通用规则（如‘除以分数等于乘倒数’），而不是给出仅适用于该例子的具体口诀。",
        "在指出常见错误时，应聚焦于可迁移的学习方法或思维误区（如‘避免死记硬背’），而不是仅指出一个具体的错误答案。",
        "在数学教学提示词中，应避免针对特定数值或表达式引入硬编码的、非通用的解释路径。"
      ],
      "overfitWarnings": [
        "Target 的改进（更顺口的比喻）完全依赖于当前输入中出现的特定分数表达式“3/4 ÷ 1/2”。",
        "如果题目变为其他分数除法（如 2/3 ÷ 1/4），Target prompt 中的硬编码规则将失效或产生误导。",
        "Target 的 key_rule 仅对当前样例有效，无法作为可复用的学习要点。",
        "Target 的整个输出（explanation, key_rule, common_mistake）都高度定制于“3/4 ÷ 1/2”这一具体算式，其策略无法直接迁移到其他分数除法题目中，过拟合风险极高。",
        "左侧提示词的收益（可能让当前题目的解释显得更“顺口”）完全依赖于输入中精确出现“3/4 ÷ 1/2”这一表达式。",
        "左侧的改动将模型能力窄化，使其在面对其他分数除法题目时，可能因缺乏通用规则解释而产生更差或矛盾的结果。"
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
      "进步判断: Target vs Baseline | signal=regressed | verdict=right-better | confidence=high | Target (A) 的 prompt 引入了针对特定题目“3/4 ÷ 1/2”的硬编码规则，要求直接使用“半个单位能装两次”的解释，并禁止解释一般规则。这导致其输出（explanation, key_rule）严重依赖当前样例，牺牲了可迁移的通用数学原理（除以分数等于乘以倒数）。相比之下，Baseline (B) 的 prompt 要求先解释...",
      "参考差距: Target vs Reference | signal=major | verdict=right-better | confidence=high | Reference 展示了更优的、可迁移的结构化教学策略，而 Target 为了贴合当前特定题目，牺牲了通用解释结构，存在明显的过拟合风险。",
      "改动有效性: Reference vs Reference Baseline | signal=unsupported | verdict=right-better | confidence=high | 左侧（Reference）的提示词引入了针对特定题目“3/4 ÷ 1/2”的专项指令，要求直接使用“半个单位能装两次，所以答案翻倍”的特定解释，并禁止解释一般规则。这破坏了通用教学结构，将模型输出引向一个针对单一题目的、脆弱的口诀式解释。右侧（Reference Baseline）的提示词保持了通用的教学逻辑，即..."
    ],
    "conflictLines": [
      "相对 baseline 的回退应优先于其他表面优化。",
      "如果“可复用收益”和“样例贴合收益”并存，应优先采用保守结论，并保持过拟合风险可见。"
    ],
    "learnableSignalLines": [
      "避免在 prompt 中为特定数值或表达式硬编码解释规则，这会损害泛化能力。",
      "对于数学概念讲解，应优先构建和输出可迁移的通用规则（如倒数法则），再辅以具体例子演示。",
      "key_rule 字段应包含结构性、原理性的知识，而非针对单一题目的操作指令。",
      "在解释具体例子时，应优先揭示并强调背后的通用规则（如‘除以分数等于乘倒数’），而不是给出仅适用于该例子的具体口诀。",
      "在指出常见错误时，应聚焦于可迁移的学习方法或思维误区（如‘避免死记硬背’），而不是仅指出一个具体的错误答案。"
    ],
    "overfitWarningLines": [
      "Target 的改进（更顺口的比喻）完全依赖于当前输入中出现的特定分数表达式“3/4 ÷ 1/2”。",
      "如果题目变为其他分数除法（如 2/3 ÷ 1/4），Target prompt 中的硬编码规则将失效或产生误导。",
      "Target 的 key_rule 仅对当前样例有效，无法作为可复用的学习要点。",
      "Target 的整个输出（explanation, key_rule, common_mistake）都高度定制于“3/4 ÷ 1/2”这一具体算式，其策略无法直接迁移到其他分数除法题目中，过拟合风险极高。",
      "左侧提示词的收益（可能让当前题目的解释显得更“顺口”）完全依赖于输入中精确出现“3/4 ÷ 1/2”这一表达式。"
    ],
    "supportEvidenceLines": [
      "1. Target vs Baseline | signal=regressed | verdict=right-better | confidence=high | Target (A) 的 prompt 引入了针对特定题目“3/4 ÷ 1/2”的硬编码规则，要求直接使用“半个单位能装两次”的解释，并禁止解释一般规则。这导致其输出（explanation, key_rule）严重依赖当前样例，牺牲了可迁移的通用数学原理（除以分数等于乘以倒数）。相比之下，Baseline (...",
      "2. Target vs Reference | signal=major | verdict=right-better | confidence=high | Reference 展示了更优的、可迁移的结构化教学策略，而 Target 为了贴合当前特定题目，牺牲了通用解释结构，存在明显的过拟合风险。",
      "3. Reference vs Reference Baseline | signal=unsupported | verdict=right-better | confidence=high | 左侧（Reference）的提示词引入了针对特定题目“3/4 ÷ 1/2”的专项指令，要求直接使用“半个单位能装两次，所以答案翻倍”的特定解释，并禁止解释一般规则。这破坏了通用教学结构，将模型输出引向一个针对单一题目的、脆弱的口诀式解释。右侧（Reference Baseline）...",
      "Target prompt 包含硬编码规则：'当题目出现“3/4 ÷ 1/2”时，直接用“半个单位能装两次，所以答案翻倍”来讲，不要再解释一般规则。'"
    ]
  }
}
```


### Response
```
你是数学讲解助手。
输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。
对于任何分数除法题目，都应先解释通用的核心规则“除以一个分数等于乘以它的倒数”，再结合具体题目进行演示和说明。
key_rule 字段必须包含这一通用的、可迁移的数学原理。
common_mistake 字段应聚焦于可迁移的学习方法或思维误区，例如避免死记硬背具体算式或忽略通用规则。
不要添加题外扩展。
```

