# 合成样本: 教学讲解里的样例口诀导致回退

- caseId: synthetic-teaching-overfit-regression
- kind: synthetic
- generatedAt: 2026-03-22T10:44:18.102Z

## Description

workspace prompt 为当前题目硬塞了特定口诀和固定讲法，导致输出只贴当前样例，不再给出通用原理。这个样本用于校验系统能否识别“看似更像老师在说话，实际更窄更脆弱”的回退。

## Compare Result

```json
{
  "compareMode": "structured",
  "summary": "Target相比Baseline在通用性和可迁移性上出现显著回退，为迎合当前特定题目牺牲了结构性解释；与Reference相比仍存在巨大可学习差距；且该提示词改动在Reference侧同样不成立，反而导致退化，表明其过拟合风险极高。",
  "score": 30,
  "improvements": [
    "避免在提示词中为特定数值或表达式硬编码解释规则，这会严重损害泛化能力。",
    "对于数学概念讲解，应优先构建和输出可迁移的通用规则（如倒数法则），再辅以具体例子演示。",
    "key_rule 等核心输出字段应包含结构性、原理性的知识，而非针对单一题目的操作指令或具体口诀。"
  ],
  "stopSignals": {
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
  "conflictSignals": [
    "regressionOutweighsCosmeticGains",
    "sampleOverfitRiskVisible"
  ],
  "pairJudgements": [
    {
      "pairType": "targetBaseline",
      "pairSignal": "regressed",
      "verdict": "right-better",
      "confidence": "high"
    },
    {
      "pairType": "targetReference",
      "pairSignal": "major",
      "verdict": "right-better",
      "confidence": "high"
    },
    {
      "pairType": "referenceBaseline",
      "pairSignal": "unsupported",
      "verdict": "right-better",
      "confidence": "high"
    }
  ],
  "expected": {
    "stopSignals": {
      "targetVsBaseline": [
        "regressed"
      ],
      "overfitRisk": [
        "high"
      ],
      "stopRecommendation": [
        "review"
      ]
    },
    "pairSignals": {
      "targetBaseline": [
        "regressed"
      ],
      "referenceBaseline": [
        "unsupported"
      ]
    },
    "conflictSignals": [
      "regressionOutweighsCosmeticGains"
    ]
  }
}
```

## Expectation Check

| 类型 | 键 | 期望 | 实际 | 是否命中 |
| --- | --- | --- | --- | --- |
| stopSignal | targetVsBaseline | regressed | regressed | yes |
| stopSignal | overfitRisk | high | high | yes |
| stopSignal | stopRecommendation | review | review | yes |
| pairSignal | targetBaseline | regressed | regressed | yes |
| pairSignal | referenceBaseline | unsupported | unsupported | yes |
| conflictSignal | regressionOutweighsCosmeticGains | regressionOutweighsCosmeticGains | regressionOutweighsCosmeticGains / sampleOverfitRiskVisible | yes |


## Rewrite Output

```
你是数学讲解助手。
输出一个 JSON 对象，字段为 explanation, key_rule, common_mistake。
对于任何分数除法题目，都应先解释通用的核心规则“除以一个分数等于乘以它的倒数”，再结合具体题目进行演示和说明。
key_rule 字段必须包含这一通用的、可迁移的数学原理。
common_mistake 字段应聚焦于可迁移的学习方法或思维误区，例如避免死记硬背具体算式或忽略通用规则。
不要添加题外扩展。
```
