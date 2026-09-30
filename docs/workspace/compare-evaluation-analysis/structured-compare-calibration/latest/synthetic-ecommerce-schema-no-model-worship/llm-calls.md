# LLM Calls

## Call 1
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
    "focusBrief": "即便 reference 看上去更完整、更自然，只要 prompt 改动造成字段名或外层结构变化，就应把 target 相对 baseline 判为回退。"
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
        "label": "商品文案",
        "content": "便携手冲咖啡壶，容量 600ml，适合露营和办公室使用，主打双层不锈钢保温，注意不支持电磁炉直火加热。"
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
    "promptText": "你是电商商品信息抽取助手。\n输出一个 JSON 对象，字段改为 product_name, buyer_highlights, cautions。\n为了后续扩展，把三个字段统一包在 payload 里。\n不要解释。",
    "modelKey": "custom",
    "versionLabel": "workspace",
    "output": "{\"payload\":{\"product_name\":\"便携手冲咖啡壶\",\"buyer_highlights\":[\"600ml 容量\",\"适合露营和办公室\",\"双层不锈钢保温\"],\"cautions\":[\"不支持电磁炉直火加热\"]}}"
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
    "promptText": "你是电商商品信息抽取助手。\n只输出 JSON 对象，字段必须为 title, selling_points, cautions。\n不要改字段名，不要添加外层包裹对象，不要解释。",
    "modelKey": "custom",
    "versionLabel": "v4",
    "output": "{\"title\":\"便携手冲咖啡壶\",\"selling_points\":[\"600ml 容量\",\"适合露营和办公室\",\"双层不锈钢保温\"],\"cautions\":[\"不支持电磁炉直火加热\"]}"
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
  "analysis": "Target (A) 的 prompt 指令要求输出结构包含外层 `payload` 对象，并更改了字段名，这直接违反了 Baseline (B) prompt 中“不要改字段名，不要添加外层包裹对象”的明确硬边界规则。虽然两者都正确提取了商品信息，但 Target 的输出结构不符合 Baseline 的指令要求，属于协议漂移，构成明确的回退。",
  "evidence": ["Target 输出结构为 `{\"payload\": {...}}`，添加了外层包裹对象 `payload`，违反了 Baseline prompt 中“不要添加外层包裹对象”的指令。", "Target 将字段名改为 `product_name` 和 `buyer_highlights`，而 Baseline prompt 要求字段必须为 `title` 和 `selling_points`，违反了“不要改字段名”的指令。", "Baseline 的输出 `{\"title\":..., \"selling_points\":..., \"cautions\":...}` 完全遵循了其自身 prompt 的指令。"],
  "learnableSignals": ["当 prompt 明确禁止更改字段名或添加外层包裹对象时，任何此类改动都构成硬边界违例，应判为回退。", "输出协议（字段名、结构层级）的稳定性是评估 prompt 版本间兼容性的关键信号。"],
  "overfitWarnings": []
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
    "focusBrief": "即便 reference 看上去更完整、更自然，只要 prompt 改动造成字段名或外层结构变化，就应把 target 相对 baseline 判为回退。"
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
        "label": "商品文案",
        "content": "便携手冲咖啡壶，容量 600ml，适合露营和办公室使用，主打双层不锈钢保温，注意不支持电磁炉直火加热。"
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
    "promptText": "你是电商商品信息抽取助手。\n输出一个 JSON 对象，字段改为 product_name, buyer_highlights, cautions。\n为了后续扩展，把三个字段统一包在 payload 里。\n不要解释。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-workspace",
    "output": "{\"payload\":{\"product_name\":\"便携手冲咖啡壶\",\"buyer_highlights\":[\"双场景使用：露营与办公室\",\"600ml 大容量\",\"双层不锈钢保温更稳\"],\"cautions\":[\"不支持电磁炉直火加热\"]}}"
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
    "promptText": "你是电商商品信息抽取助手。\n只输出 JSON 对象，字段必须为 title, selling_points, cautions。\n不要改字段名，不要添加外层包裹对象，不要解释。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-v4",
    "output": "{\"title\":\"便携手冲咖啡壶\",\"selling_points\":[\"600ml 容量\",\"适合露营和办公室\",\"双层不锈钢保温\"],\"cautions\":[\"不支持电磁炉直火加热\"]}"
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
    "pairSignal": "unsupported",
    "analysis": "左侧（Reference）的 prompt 明确要求将字段名改为 product_name, buyer_highlights, cautions，并将它们包裹在 payload 对象内。右侧（Reference Baseline）的 prompt 则要求字段名为 title, selling_points, cautions，且禁止添加外层包裹对象。左侧的输出严格遵守了其 prompt 指令，而右侧的输出也严格遵守了其 prompt 指令。因此，左侧 prompt 所要求的改动（字段改名和添加包裹层）在右侧（即其自身的基线版本）中是完全不被支持的，这构成了明确的硬边界违例。",
    "evidence": ["左侧 prompt 要求字段名为 product_name, buyer_highlights, cautions，右侧 prompt 要求字段名为 title, selling_points, cautions，两者冲突。", "左侧 prompt 要求将字段统一包在 payload 里，右侧 prompt 明确禁止添加外层包裹对象，两者冲突。", "左侧输出为 {\"payload\":{\"product_name\":...}}，右侧输出为 {\"title\":...}，均严格遵守了各自的 prompt 指令，但指令本身互斥。"],
    "learnableSignals": ["Prompt 中关于字段名的指令是硬性约束，违反即构成负面证据。", "Prompt 中关于是否添加外层包裹对象的指令是硬性约束，违反即构成负面证据。"],
    "overfitWarnings": ["当前判断基于 prompt 指令的硬性冲突，不依赖于具体输入内容，因此无样例拟合风险。"]
}
```
```


## Call 3
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
    "focusBrief": "即便 reference 看上去更完整、更自然，只要 prompt 改动造成字段名或外层结构变化，就应把 target 相对 baseline 判为回退。"
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
        "label": "商品文案",
        "content": "便携手冲咖啡壶，容量 600ml，适合露营和办公室使用，主打双层不锈钢保温，注意不支持电磁炉直火加热。"
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
    "promptText": "你是电商商品信息抽取助手。\n输出一个 JSON 对象，字段改为 product_name, buyer_highlights, cautions。\n为了后续扩展，把三个字段统一包在 payload 里。\n不要解释。",
    "modelKey": "custom",
    "versionLabel": "workspace",
    "output": "{\"payload\":{\"product_name\":\"便携手冲咖啡壶\",\"buyer_highlights\":[\"600ml 容量\",\"适合露营和办公室\",\"双层不锈钢保温\"],\"cautions\":[\"不支持电磁炉直火加热\"]}}"
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
    "promptText": "你是电商商品信息抽取助手。\n输出一个 JSON 对象，字段改为 product_name, buyer_highlights, cautions。\n为了后续扩展，把三个字段统一包在 payload 里。\n不要解释。",
    "modelKey": "deepseek",
    "versionLabel": "teacher-workspace",
    "output": "{\"payload\":{\"product_name\":\"便携手冲咖啡壶\",\"buyer_highlights\":[\"双场景使用：露营与办公室\",\"600ml 大容量\",\"双层不锈钢保温更稳\"],\"cautions\":[\"不支持电磁炉直火加热\"]}}"
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
    "confidence": "medium",
    "pairSignal": "minor",
    "analysis": "Reference 在 buyer_highlights 字段的处理上展示了更优的提示词遵循能力和信息提炼结构，将原始输入中的并列信息（“适合露营和办公室使用”）整合为更具营销感的“双场景使用：露营与办公室”，并调整了列表项的顺序以突出卖点，而 Target 则更直接地复制了原文片段。这种差异体现了 Reference 对“提炼亮点”这一指令的更深层理解，是一种可学习的结构化处理模式。",
    "evidence": ["Target 的 buyer_highlights 为 [\"600ml 容量\",\"适合露营和办公室\",\"双层不锈钢保温\"]，基本是原文片段的直接罗列。", "Reference 的 buyer_highlights 为 [\"双场景使用：露营与办公室\",\"600ml 大容量\",\"双层不锈钢保温更稳\"]，对“适合露营和办公室使用”进行了概念提炼和包装（“双场景使用”），并为“容量”和“保温”添加了修饰词（“大”、“更稳”），列表顺序也做了调整。", "两者在 product_name 和 cautions 字段上表现一致，且都严格遵守了输出 JSON 结构（包含 payload 外层）。"],
    "learnableSignals": ["对于 buyer_highlights 字段，可学习将原文中的适用场景描述（如“适合A和B使用”）提炼并包装为更具概括性和吸引力的营销短语（如“双场景使用：A与B”）。", "可学习在列举产品亮点时，考虑对基础参数（如容量、材质）添加积极的修饰语（如“大容量”、“更稳”）以增强卖点表述，而非简单复制。", "可学习调整亮点列表的顺序，以优化信息呈现的节奏和重点。"],
    "overfitWarnings": ["Reference 对“双层不锈钢保温”添加“更稳”这一修饰，其必要性可能依赖于具体产品描述语境，存在一定的主观性，不一定在所有情况下都是最优或必需的改写。"]
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
    "focusBrief": "即便 reference 看上去更完整、更自然，只要 prompt 改动造成字段名或外层结构变化，就应把 target 相对 baseline 判为回退。"
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
      "gap": "minor",
      "promptValidity": "unsupported"
    },
    "derivedStopSignals": {
      "targetVsBaseline": "regressed",
      "targetVsReferenceGap": "minor",
      "improvementHeadroom": "high",
      "overfitRisk": "high",
      "stopRecommendation": "review",
      "stopReasons": [
        "target regressed vs baseline",
        "minor learnable gap remains vs reference",
        "reference-side evidence does not support the prompt change",
        "pairwise judges flagged possible sample overfit"
      ]
    },
    "learnableSignals": [
      "当 prompt 明确禁止更改字段名或添加外层包裹对象时，任何此类改动都构成硬边界违例，应判为回退。",
      "输出协议（字段名、结构层级）的稳定性是评估 prompt 版本间兼容性的关键信号。",
      "对于 buyer_highlights 字段，可学习将原文中的适用场景描述（如“适合A和B使用”）提炼并包装为更具概括性和吸引力的营销短语（如“双场景使用：A与B”）。",
      "可学习在列举产品亮点时，考虑对基础参数（如容量、材质）添加积极的修饰语（如“大容量”、“更稳”）以增强卖点表述，而非简单复制。"
    ],
    "overfitWarnings": [
      "Reference 对“双层不锈钢保温”添加“更稳”这一修饰，其必要性可能依赖于具体产品描述语境，存在一定的主观性，不一定在所有情况下都是最优或必需的改写。",
      "当前判断基于 prompt 指令的硬性冲突，不依赖于具体输入内容，因此无样例拟合风险。"
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
      "analysis": "Target (A) 的 prompt 指令要求输出结构包含外层 `payload` 对象，并更改了字段名，这直接违反了 Baseline (B) prompt 中“不要改字段名，不要添加外层包裹对象”的明确硬边界规则。虽然两者都正确提取了商品信息，但 Target 的输出结构不符合 Baseline 的指令要求，属于协议漂移，构成明确的回退。",
      "evidence": [
        "Target 输出结构为 `{\"payload\": {...}}`，添加了外层包裹对象 `payload`，违反了 Baseline prompt 中“不要添加外层包裹对象”的指令。",
        "Target 将字段名改为 `product_name` 和 `buyer_highlights`，而 Baseline prompt 要求字段必须为 `title` 和 `selling_points`，违反了“不要改字段名”的指令。",
        "Baseline 的输出 `{\"title\":..., \"selling_points\":..., \"cautions\":...}` 完全遵循了其自身 prompt 的指令。"
      ],
      "learnableSignals": [
        "当 prompt 明确禁止更改字段名或添加外层包裹对象时，任何此类改动都构成硬边界违例，应判为回退。",
        "输出协议（字段名、结构层级）的稳定性是评估 prompt 版本间兼容性的关键信号。"
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
      "verdict": "right-better",
      "winner": "right",
      "confidence": "medium",
      "pairSignal": "minor",
      "analysis": "Reference 在 buyer_highlights 字段的处理上展示了更优的提示词遵循能力和信息提炼结构，将原始输入中的并列信息（“适合露营和办公室使用”）整合为更具营销感的“双场景使用：露营与办公室”，并调整了列表项的顺序以突出卖点，而 Target 则更直接地复制了原文片段。这种差异体现了 Reference 对“提炼亮点”这一指令的更深层理解，是一种可学习的结构化处理模式。",
      "evidence": [
        "Target 的 buyer_highlights 为 [\"600ml 容量\",\"适合露营和办公室\",\"双层不锈钢保温\"]，基本是原文片段的直接罗列。",
        "Reference 的 buyer_highlights 为 [\"双场景使用：露营与办公室\",\"600ml 大容量\",\"双层不锈钢保温更稳\"]，对“适合露营和办公室使用”进行了概念提炼和包装（“双场景使用”），并为“容量”和“保温”添加了修饰词（“大”、“更稳”），列表顺序也做了调整。",
        "两者在 product_name 和 cautions 字段上表现一致，且都严格遵守了输出 JSON 结构（包含 payload 外层）。"
      ],
      "learnableSignals": [
        "对于 buyer_highlights 字段，可学习将原文中的适用场景描述（如“适合A和B使用”）提炼并包装为更具概括性和吸引力的营销短语（如“双场景使用：A与B”）。",
        "可学习在列举产品亮点时，考虑对基础参数（如容量、材质）添加积极的修饰语（如“大容量”、“更稳”）以增强卖点表述，而非简单复制。",
        "可学习调整亮点列表的顺序，以优化信息呈现的节奏和重点。"
      ],
      "overfitWarnings": [
        "Reference 对“双层不锈钢保温”添加“更稳”这一修饰，其必要性可能依赖于具体产品描述语境，存在一定的主观性，不一定在所有情况下都是最优或必需的改写。"
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
      "pairSignal": "unsupported",
      "analysis": "左侧（Reference）的 prompt 明确要求将字段名改为 product_name, buyer_highlights, cautions，并将它们包裹在 payload 对象内。右侧（Reference Baseline）的 prompt 则要求字段名为 title, selling_points, cautions，且禁止添加外层包裹对象。左侧的输出严格遵守了其 prompt 指令，而右侧的输出也严格遵守了其 prompt 指令。因此，左侧 prompt 所要求的改动（字段改名和添加包裹层）在右侧（即其自身的基线版本）中是完全不被支持的，这构成了明确的硬边界违例。",
      "evidence": [
        "左侧 prompt 要求字段名为 product_name, buyer_highlights, cautions，右侧 prompt 要求字段名为 title, selling_points, cautions，两者冲突。",
        "左侧 prompt 要求将字段统一包在 payload 里，右侧 prompt 明确禁止添加外层包裹对象，两者冲突。",
        "左侧输出为 {\"payload\":{\"product_name\":...}}，右侧输出为 {\"title\":...}，均严格遵守了各自的 prompt 指令，但指令本身互斥。"
      ],
      "learnableSignals": [
        "Prompt 中关于字段名的指令是硬性约束，违反即构成负面证据。",
        "Prompt 中关于是否添加外层包裹对象的指令是硬性约束，违反即构成负面证据。"
      ],
      "overfitWarnings": [
        "当前判断基于 prompt 指令的硬性冲突，不依赖于具体输入内容，因此无样例拟合风险。"
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
    "overall": 40,
    "dimensions": [
      {
        "key": "goalAchievementRobustness",
        "label": "目标达成稳定性",
        "score": 20
      },
      {
        "key": "outputQualityCeiling",
        "label": "输出质量上限",
        "score": 60
      },
      {
        "key": "promptPatternQuality",
        "label": "提示词模式质量",
        "score": 30
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 10
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 30
      }
    ]
  },
  "improvements": [
    "当系统提示词明确禁止更改字段名或添加外层包裹对象时，任何此类改动都构成硬边界违例，应避免。",
    "对于产品亮点（如buyer_highlights）字段，可学习将原文中的适用场景描述（如“适合A和B使用”）提炼并包装为更具概括性和吸引力的营销短语（如“双场景使用：A与B”）。",
    "在列举产品基础参数（如容量、材质）时，可考虑添加积极的修饰语（如“大容量”、“更稳”）以增强卖点表述，而非简单复制原文。"
  ],
  "summary": "Target相比Baseline在输出协议稳定性上出现明确回退；与Reference相比，在亮点提炼的深度和营销感上仍有可学习的差距；且该Prompt改动在Reference侧不被支持，存在较高的过拟合风险，建议审阅。",
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
      "targetVsReferenceGap": "minor",
      "improvementHeadroom": "high",
      "overfitRisk": "high",
      "stopRecommendation": "review",
      "stopReasons": [
        "target regressed vs baseline",
        "minor learnable gap remains vs reference",
        "reference-side evidence does not support the prompt change",
        "pairwise judges flagged possible sample overfit"
      ]
    }
  }
}
```
```


## Call 5
- phase: rewrite:synthetic-ecommerce-schema-no-model-worship
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
    "overallScore": 40
  },
  "sourcePrompts": {
    "workspacePrompt": "你是电商商品信息抽取助手。\n输出一个 JSON 对象，字段改为 product_name, buyer_highlights, cautions。\n为了后续扩展，把三个字段统一包在 payload 里。\n不要解释。",
    "referencePrompt": "你是电商商品信息抽取助手。\n只输出 JSON 对象，字段必须为 title, selling_points, cautions。\n不要改字段名，不要添加外层包裹对象，不要解释。"
  },
  "compressedEvaluation": {
    "summary": "Target相比Baseline在输出协议稳定性上出现明确回退；与Reference相比，在亮点提炼的深度和营销感上仍有可学习的差距；且该Prompt改动在Reference侧不被支持，存在较高的过拟合风险，建议审阅。",
    "dimensionScores": [
      {
        "key": "goalAchievementRobustness",
        "label": "目标达成稳定性",
        "score": 20
      },
      {
        "key": "outputQualityCeiling",
        "label": "输出质量上限",
        "score": 60
      },
      {
        "key": "promptPatternQuality",
        "label": "提示词模式质量",
        "score": 30
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 10
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 30
      }
    ],
    "improvements": [
      "当系统提示词明确禁止更改字段名或添加外层包裹对象时，任何此类改动都构成硬边界违例，应避免。",
      "对于产品亮点（如buyer_highlights）字段，可学习将原文中的适用场景描述（如“适合A和B使用”）提炼并包装为更具概括性和吸引力的营销短语（如“双场景使用：A与B”）。",
      "在列举产品基础参数（如容量、材质）时，可考虑添加积极的修饰语（如“大容量”、“更稳”）以增强卖点表述，而非简单复制原文。"
    ],
    "patchPlan": [],
    "compareStopSignals": {
      "targetVsBaseline": "regressed",
      "targetVsReferenceGap": "minor",
      "improvementHeadroom": "high",
      "overfitRisk": "high",
      "stopRecommendation": "review",
      "stopReasons": [
        "target regressed vs baseline",
        "minor learnable gap remains vs reference",
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
          "analysis": "Target (A) 的 prompt 指令要求输出结构包含外层 `payload` 对象，并更改了字段名，这直接违反了 Baseline (B) prompt 中“不要改字段名，不要添加外层包裹对象”的明确硬边界规则。虽然两者都正确提取了商品信息，但 Target 的输出结构不符合 Baseline 的指令要求，属于协议漂移，构成明确的回退。"
        },
        {
          "pairKey": "target-vs-reference",
          "pairType": "targetReference",
          "pairLabel": "Target vs Reference",
          "pairSignal": "minor",
          "verdict": "right-better",
          "confidence": "medium",
          "analysis": "Reference 在 buyer_highlights 字段的处理上展示了更优的提示词遵循能力和信息提炼结构，将原始输入中的并列信息（“适合露营和办公室使用”）整合为更具营销感的“双场景使用：露营与办公室”，并调整了列表项的顺序以突出卖点，而 Target 则更直接地复制了原文片段。这种差异体现了 Reference 对“提炼亮点”这一指令的更深层理解，是一种可学习的结构化处理模式。"
        },
        {
          "pairKey": "reference-vs-reference-baseline",
          "pairType": "referenceBaseline",
          "pairLabel": "Reference vs Reference Baseline",
          "pairSignal": "unsupported",
          "verdict": "left-better",
          "confidence": "high",
          "analysis": "左侧（Reference）的 prompt 明确要求将字段名改为 product_name, buyer_highlights, cautions，并将它们包裹在 payload 对象内。右侧（Reference Baseline）的 prompt 则要求字段名为 title, selling_points, cautions，且禁止添加外层包裹对象。左侧的输出严格遵守了其 prompt 指令，而右侧的输出也严格遵守了其 prompt 指令。因此，左侧 prompt 所要求的改动（字段改名和添加包裹层）在右侧（即其自身的基线版本）中是完全不被支持的，这构成了明确的硬边界违例。"
        }
      ],
      "progressSummary": {
        "pairKey": "target-vs-baseline",
        "pairType": "targetBaseline",
        "pairLabel": "Target vs Baseline",
        "pairSignal": "regressed",
        "verdict": "right-better",
        "confidence": "high",
        "analysis": "Target (A) 的 prompt 指令要求输出结构包含外层 `payload` 对象，并更改了字段名，这直接违反了 Baseline (B) prompt 中“不要改字段名，不要添加外层包裹对象”的明确硬边界规则。虽然两者都正确提取了商品信息，但 Target 的输出结构不符合 Baseline 的指令要求，属于协议漂移，构成明确的回退。"
      },
      "referenceGapSummary": {
        "pairKey": "target-vs-reference",
        "pairType": "targetReference",
        "pairLabel": "Target vs Reference",
        "pairSignal": "minor",
        "verdict": "right-better",
        "confidence": "medium",
        "analysis": "Reference 在 buyer_highlights 字段的处理上展示了更优的提示词遵循能力和信息提炼结构，将原始输入中的并列信息（“适合露营和办公室使用”）整合为更具营销感的“双场景使用：露营与办公室”，并调整了列表项的顺序以突出卖点，而 Target 则更直接地复制了原文片段。这种差异体现了 Reference 对“提炼亮点”这一指令的更深层理解，是一种可学习的结构化处理模式。"
      },
      "promptChangeSummary": {
        "pairKey": "reference-vs-reference-baseline",
        "pairType": "referenceBaseline",
        "pairLabel": "Reference vs Reference Baseline",
        "pairSignal": "unsupported",
        "verdict": "left-better",
        "confidence": "high",
        "analysis": "左侧（Reference）的 prompt 明确要求将字段名改为 product_name, buyer_highlights, cautions，并将它们包裹在 payload 对象内。右侧（Reference Baseline）的 prompt 则要求字段名为 title, selling_points, cautions，且禁止添加外层包裹对象。左侧的输出严格遵守了其 prompt 指令，而右侧的输出也严格遵守了其 prompt 指令。因此，左侧 prompt 所要求的改动（字段改名和添加包裹层）在右侧（即其自身的基线版本）中是完全不被支持的，这构成了明确的硬边界违例。"
      },
      "evidenceHighlights": [
        "Target 输出结构为 `{\"payload\": {...}}`，添加了外层包裹对象 `payload`，违反了 Baseline prompt 中“不要添加外层包裹对象”的指令。",
        "Target 将字段名改为 `product_name` 和 `buyer_highlights`，而 Baseline prompt 要求字段必须为 `title` 和 `selling_points`，违反了“不要改字段名”的指令。",
        "Baseline 的输出 `{\"title\":..., \"selling_points\":..., \"cautions\":...}` 完全遵循了其自身 prompt 的指令。",
        "Target 的 buyer_highlights 为 [\"600ml 容量\",\"适合露营和办公室\",\"双层不锈钢保温\"]，基本是原文片段的直接罗列。",
        "Reference 的 buyer_highlights 为 [\"双场景使用：露营与办公室\",\"600ml 大容量\",\"双层不锈钢保温更稳\"]，对“适合露营和办公室使用”进行了概念提炼和包装（“双场景使用”），并为“容量”和“保温”添加了修饰词（“大”、“更稳”），列表顺序也做了调整。",
        "两者在 product_name 和 cautions 字段上表现一致，且都严格遵守了输出 JSON 结构（包含 payload 外层）。"
      ],
      "learnableSignals": [
        "当 prompt 明确禁止更改字段名或添加外层包裹对象时，任何此类改动都构成硬边界违例，应判为回退。",
        "输出协议（字段名、结构层级）的稳定性是评估 prompt 版本间兼容性的关键信号。",
        "对于 buyer_highlights 字段，可学习将原文中的适用场景描述（如“适合A和B使用”）提炼并包装为更具概括性和吸引力的营销短语（如“双场景使用：A与B”）。",
        "可学习在列举产品亮点时，考虑对基础参数（如容量、材质）添加积极的修饰语（如“大容量”、“更稳”）以增强卖点表述，而非简单复制。",
        "可学习调整亮点列表的顺序，以优化信息呈现的节奏和重点。",
        "Prompt 中关于字段名的指令是硬性约束，违反即构成负面证据。"
      ],
      "overfitWarnings": [
        "Reference 对“双层不锈钢保温”添加“更稳”这一修饰，其必要性可能依赖于具体产品描述语境，存在一定的主观性，不一定在所有情况下都是最优或必需的改写。",
        "当前判断基于 prompt 指令的硬性冲突，不依赖于具体输入内容，因此无样例拟合风险。"
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
      "进步判断: Target vs Baseline | signal=regressed | verdict=right-better | confidence=high | Target (A) 的 prompt 指令要求输出结构包含外层 `payload` 对象，并更改了字段名，这直接违反了 Baseline (B) prompt 中“不要改字段名，不要添加外层包裹对象”的明确硬边界规则。虽然两者都正确提取了商品信息，但 Target 的输出结构不符合 Baseline 的指令要求，属于协议漂移，构成明确的回退。",
      "参考差距: Target vs Reference | signal=minor | verdict=right-better | confidence=medium | Reference 在 buyer_highlights 字段的处理上展示了更优的提示词遵循能力和信息提炼结构，将原始输入中的并列信息（“适合露营和办公室使用”）整合为更具营销感的“双场景使用：露营与办公室”，并调整了列表项的顺序以突出卖点，而 Target 则更直接地复制了原文片段。这种差异体现了 Reference 对“提炼亮点”这一指令的更...",
      "改动有效性: Reference vs Reference Baseline | signal=unsupported | verdict=left-better | confidence=high | 左侧（Reference）的 prompt 明确要求将字段名改为 product_name, buyer_highlights, cautions，并将它们包裹在 payload 对象内。右侧（Reference Baseline）的 prompt 则要求字段名为 title, selling_points, ca..."
    ],
    "conflictLines": [
      "相对 baseline 的回退应优先于其他表面优化。",
      "如果“可复用收益”和“样例贴合收益”并存，应优先采用保守结论，并保持过拟合风险可见。"
    ],
    "learnableSignalLines": [
      "当 prompt 明确禁止更改字段名或添加外层包裹对象时，任何此类改动都构成硬边界违例，应判为回退。",
      "输出协议（字段名、结构层级）的稳定性是评估 prompt 版本间兼容性的关键信号。",
      "对于 buyer_highlights 字段，可学习将原文中的适用场景描述（如“适合A和B使用”）提炼并包装为更具概括性和吸引力的营销短语（如“双场景使用：A与B”）。",
      "可学习在列举产品亮点时，考虑对基础参数（如容量、材质）添加积极的修饰语（如“大容量”、“更稳”）以增强卖点表述，而非简单复制。",
      "可学习调整亮点列表的顺序，以优化信息呈现的节奏和重点。"
    ],
    "overfitWarningLines": [
      "Reference 对“双层不锈钢保温”添加“更稳”这一修饰，其必要性可能依赖于具体产品描述语境，存在一定的主观性，不一定在所有情况下都是最优或必需的改写。",
      "当前判断基于 prompt 指令的硬性冲突，不依赖于具体输入内容，因此无样例拟合风险。"
    ],
    "supportEvidenceLines": [
      "1. Target vs Baseline | signal=regressed | verdict=right-better | confidence=high | Target (A) 的 prompt 指令要求输出结构包含外层 `payload` 对象，并更改了字段名，这直接违反了 Baseline (B) prompt 中“不要改字段名，不要添加外层包裹对象”的明确硬边界规则。虽然两者都正确提取了商品信息，但 Target 的输出结构不符合 Baseline 的指令要...",
      "2. Target vs Reference | signal=minor | verdict=right-better | confidence=medium | Reference 在 buyer_highlights 字段的处理上展示了更优的提示词遵循能力和信息提炼结构，将原始输入中的并列信息（“适合露营和办公室使用”）整合为更具营销感的“双场景使用：露营与办公室”，并调整了列表项的顺序以突出卖点，而 Target 则更直接地复制了原文片段。这种差异体现了 Refere...",
      "3. Reference vs Reference Baseline | signal=unsupported | verdict=left-better | confidence=high | 左侧（Reference）的 prompt 明确要求将字段名改为 product_name, buyer_highlights, cautions，并将它们包裹在 payload 对象内。右侧（Reference Baseline）的 prompt 则要求字段名为 title, se...",
      "Target 输出结构为 `{\"payload\": {...}}`，添加了外层包裹对象 `payload`，违反了 Baseline prompt 中“不要添加外层包裹对象”的指令。"
    ]
  }
}
```


### Response
```
你是电商商品信息抽取助手。
只输出一个 JSON 对象，字段必须为 title, selling_points, cautions。
不要改字段名，不要添加外层包裹对象，不要解释。
在提取 selling_points 时，应主动提炼和优化信息：将原文中关于适用场景的描述（例如“适合A和B使用”）概括为更具吸引力的营销短语（例如“双场景使用：A与B”）；对产品基础参数（如容量、材质）可添加积极的修饰语（如“大容量”、“更稳”）以增强卖点；并考虑调整亮点列表的顺序以优化呈现。
```

