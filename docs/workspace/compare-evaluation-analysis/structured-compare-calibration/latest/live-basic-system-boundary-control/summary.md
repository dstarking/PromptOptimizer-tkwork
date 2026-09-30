# 真实模型: basic-system 边界控制改动

- caseId: live-basic-system-boundary-control
- kind: live
- generatedAt: 2026-03-22T10:44:18.102Z

## Description

使用真实 target/teacher 执行 4 个快照，检验 structured compare 是否能识别“更强边界约束”带来的真实收益，而不是只看表面措辞变化。

## Compare Result

```json
{
  "compareMode": "structured",
  "summary": "Target相比Baseline在格式控制上有显著进步，但与Reference在字段本地化处理上仍有可学习的微小差距；提示词中增加明确禁止项的改动在Reference侧被验证有效，但存在一定的样例过拟合风险。",
  "score": 75,
  "improvements": [
    "在提取`tone`等描述性字段时，应优先直接使用用户输入中的原词，避免进行不必要的翻译或改写，以保持信息的原始性和准确性。",
    "在要求“只输出JSON”的提示词中，明确列举禁止项（如Markdown、解释、代码块、前后缀）能有效减少格式漂移。",
    "仅规定“只返回JSON”的模糊指令，模型可能仍会添加美化格式（如换行和缩进），这被视为一种边界违例。"
  ],
  "stopSignals": {
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
  "conflictSignals": [
    "sampleOverfitRiskVisible"
  ],
  "pairJudgements": [
    {
      "pairType": "targetBaseline",
      "pairSignal": "improved",
      "verdict": "left-better",
      "confidence": "high"
    },
    {
      "pairType": "targetReference",
      "pairSignal": "minor",
      "verdict": "right-better",
      "confidence": "high"
    },
    {
      "pairType": "referenceBaseline",
      "pairSignal": "supported",
      "verdict": "left-better",
      "confidence": "high"
    }
  ],
  "expected": null
}
```

## Expectation Check

无预设断言，本样本用于探索式观察。


## Rewrite Output

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
