# 合成样本: 电商抽取里不能因为 teacher 更会写就忽略 schema

- caseId: synthetic-ecommerce-schema-no-model-worship
- kind: synthetic
- generatedAt: 2026-03-22T10:44:18.102Z

## Description

workspace prompt 把既有商品抽取 contract 改成了新字段和外层 wrapper，teacher 输出也更像“高质量总结”。这个样本用于校验 compare 是否会坚持 schema/contract 优先，而不是因为 reference 更流畅就放过漂移。

## Compare Result

```json
{
  "compareMode": "structured",
  "summary": "Target相比Baseline在输出协议稳定性上出现明确回退；与Reference相比，在亮点提炼的深度和营销感上仍有可学习的差距；且该Prompt改动在Reference侧不被支持，存在较高的过拟合风险，建议审阅。",
  "score": 40,
  "improvements": [
    "当系统提示词明确禁止更改字段名或添加外层包裹对象时，任何此类改动都构成硬边界违例，应避免。",
    "对于产品亮点（如buyer_highlights）字段，可学习将原文中的适用场景描述（如“适合A和B使用”）提炼并包装为更具概括性和吸引力的营销短语（如“双场景使用：A与B”）。",
    "在列举产品基础参数（如容量、材质）时，可考虑添加积极的修饰语（如“大容量”、“更稳”）以增强卖点表述，而非简单复制原文。"
  ],
  "stopSignals": {
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
      "pairSignal": "minor",
      "verdict": "right-better",
      "confidence": "medium"
    },
    {
      "pairType": "referenceBaseline",
      "pairSignal": "unsupported",
      "verdict": "left-better",
      "confidence": "high"
    }
  ],
  "expected": {
    "stopSignals": {
      "targetVsBaseline": [
        "regressed"
      ],
      "stopRecommendation": [
        "review"
      ]
    },
    "pairSignals": {
      "targetBaseline": [
        "regressed"
      ],
      "targetReference": [
        "none",
        "minor"
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
| stopSignal | stopRecommendation | review | review | yes |
| pairSignal | targetBaseline | regressed | regressed | yes |
| pairSignal | targetReference | none / minor | minor | yes |
| pairSignal | referenceBaseline | unsupported | unsupported | yes |
| conflictSignal | regressionOutweighsCosmeticGains | regressionOutweighsCosmeticGains | regressionOutweighsCosmeticGains / sampleOverfitRiskVisible | yes |


## Rewrite Output

```
你是电商商品信息抽取助手。
只输出一个 JSON 对象，字段必须为 title, selling_points, cautions。
不要改字段名，不要添加外层包裹对象，不要解释。
在提取 selling_points 时，应主动提炼和优化信息：将原文中关于适用场景的描述（例如“适合A和B使用”）概括为更具吸引力的营销短语（例如“双场景使用：A与B”）；对产品基础参数（如容量、材质）可添加积极的修饰语（如“大容量”、“更稳”）以增强卖点；并考虑调整亮点列表的顺序以优化呈现。
```
