# 合成样本: 医疗分诊里的隐性触发过拟合

- caseId: synthetic-medical-latent-trigger-overfit
- kind: synthetic
- generatedAt: 2026-03-22T10:44:18.102Z

## Description

workspace prompt 针对当前样例里的“胸口发紧 + 上楼更明显”加入了硬编码动作，看起来更果断，但 reference 侧并不支持这条触发规则。这个样本用于观察系统是否能把“样例贴合收益”与“可复用改进”区分开。

## Compare Result

```json
{
  "compareMode": "structured",
  "summary": "Target相比Baseline在提示词模式上出现结构性回退（引入硬编码规则），虽然当前样例下能触发规则并严格遵守，但该规则在参考侧未产生收益，且存在明显的样例过拟合风险，整体评估结论为高风险，建议review。",
  "score": 35,
  "improvements": [
    "在分诊类任务中，避免在提示中引入基于特定关键词组合的硬编码输出规则，这会导致输出僵化并可能给出不相关或武断的建议（如“停止含咖啡因饮品”）。",
    "有效的改进应体现在对症状严重性、风险因素和通用处理原则的更优判断上，而非对当前输入样例的表面贴合。",
    "当提示词包含明确的“只要...就...”条件触发规则时，必须严格匹配并完整输出指定的响应内容，不得自行概括或省略。"
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
      "verdict": "left-better",
      "confidence": "high"
    },
    {
      "pairType": "referenceBaseline",
      "pairSignal": "unsupported",
      "verdict": "mixed",
      "confidence": "medium"
    }
  ],
  "expected": {
    "stopSignals": {
      "overfitRisk": [
        "high"
      ],
      "stopRecommendation": [
        "review"
      ]
    },
    "pairSignals": {
      "targetBaseline": [
        "flat",
        "improved"
      ],
      "referenceBaseline": [
        "unsupported"
      ]
    },
    "conflictSignals": [
      "improvementNotSupportedOnReference"
    ]
  }
}
```

## Expectation Check

| 类型 | 键 | 期望 | 实际 | 是否命中 |
| --- | --- | --- | --- | --- |
| stopSignal | overfitRisk | high | high | yes |
| stopSignal | stopRecommendation | review | review | yes |
| pairSignal | targetBaseline | flat / improved | regressed | no |
| pairSignal | referenceBaseline | unsupported | unsupported | yes |
| conflictSignal | improvementNotSupportedOnReference | improvementNotSupportedOnReference | regressionOutweighsCosmeticGains / sampleOverfitRiskVisible | no |


## Rewrite Output

```
你是医疗分诊建议助手。
输出一个 JSON 对象，字段必须为 urgency, next_step, warning_signs。
基于用户已提供的信息给出谨慎、可执行的线下就医建议，不要硬编码样例词触发器。
不要添加解释或免责声明。
```
