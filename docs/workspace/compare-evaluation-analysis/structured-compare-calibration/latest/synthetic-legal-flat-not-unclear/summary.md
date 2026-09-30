# 合成样本: 法务风险摘要应该判 flat 而不是 unclear

- caseId: synthetic-legal-flat-not-unclear
- kind: synthetic
- generatedAt: 2026-03-22T10:44:18.102Z

## Description

workspace prompt 只把表达风格改得更口语化，但目标输出与 previous 在风险结论和行动建议上没有实质变化。这个样本用于观察 judge 是否能稳定给出 flat，而不是因为措辞不同就退回 unclear。

## Compare Result

```json
{
  "compareMode": "structured",
  "summary": "Target 相比 Baseline 无实质性进步，与 Reference 在核心风险识别与建议上无差距；Prompt 中面向业务可读性的风格调整在 Reference 侧也得到支持，表明改动具有跨模型鲁棒性，但未提升输出内容的上限。",
  "score": 50,
  "improvements": [
    "提示词优化应聚焦于引入新的、结构化的信息维度（如风险量化、条款优先级排序、替代方案建议），而非仅调整措辞风格。",
    "当提示词改动旨在提升可读性时，应明确定义可衡量的风格指标（如句子长度、术语密度），以便于客观评估改进效果。",
    "在核心结论等价的情况下，评估应更关注输出在逻辑严谨性、证据链完整性或可操作性上的潜在差异，避免过度解读风格变化。"
  ],
  "stopSignals": {
    "targetVsBaseline": "flat",
    "targetVsReferenceGap": "none",
    "improvementHeadroom": "medium",
    "overfitRisk": "low",
    "stopRecommendation": "continue"
  },
  "conflictSignals": [],
  "pairJudgements": [
    {
      "pairType": "targetBaseline",
      "pairSignal": "flat",
      "verdict": "similar",
      "confidence": "high"
    },
    {
      "pairType": "targetReference",
      "pairSignal": "none",
      "verdict": "similar",
      "confidence": "high"
    },
    {
      "pairType": "referenceBaseline",
      "pairSignal": "supported",
      "verdict": "similar",
      "confidence": "high"
    }
  ],
  "expected": {
    "stopSignals": {
      "targetVsBaseline": [
        "flat"
      ]
    },
    "pairSignals": {
      "targetBaseline": [
        "flat"
      ],
      "referenceBaseline": [
        "supported",
        "mixed"
      ]
    }
  }
}
```

## Expectation Check

| 类型 | 键 | 期望 | 实际 | 是否命中 |
| --- | --- | --- | --- | --- |
| stopSignal | targetVsBaseline | flat | flat | yes |
| pairSignal | targetBaseline | flat | flat | yes |
| pairSignal | referenceBaseline | supported / mixed | supported | yes |


## Rewrite Output

```
你是法务风险摘要助手。
输出一个 JSON 对象，字段为 risk_level, core_risks, recommended_action。
用更简洁、偏业务同学可读的中文表达。
不要添加解释。
```
