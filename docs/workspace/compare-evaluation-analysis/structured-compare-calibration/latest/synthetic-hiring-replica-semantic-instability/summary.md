# 合成样本: 招聘筛选里 replica 语义不稳定

- caseId: synthetic-hiring-replica-semantic-instability
- kind: synthetic
- generatedAt: 2026-03-22T10:44:18.102Z

## Description

workspace prompt 在单次输出里看起来比 previous 更结构化，但同 prompt 的 replica 却给出了不同的录用结论。这个样本用于校验系统是否能识别“单次胜出但语义不稳定”的情况。

## Compare Result

```json
{
  "compareMode": "structured",
  "summary": "Target相比Baseline在输出结构化和内容针对性上有明确进步，且与Reference质量相当，但重复执行时核心决策（如录用建议）发生漂移，稳定性存在严重问题，且提示词改进的收益可能部分依赖于当前样例与岗位的高匹配度。",
  "score": 65,
  "improvements": [
    "在简历筛选总结任务中，要求输出字段（如strengths, risks）‘紧扣岗位要求，避免泛泛而谈’，能有效引导模型生成更具体、更具信息量的评估点。",
    "明确的输出格式指令（如‘只输出 JSON 对象’）和字段枚举值（如hire/hold/reject），有助于确保响应的结构一致性和规范性。"
  ],
  "stopSignals": {
    "targetVsBaseline": "improved",
    "targetVsReferenceGap": "none",
    "improvementHeadroom": "low",
    "overfitRisk": "high",
    "stopRecommendation": "review",
    "stopReasons": [
      "replica evidence suggests unstable behavior",
      "pairwise judges flagged possible sample overfit"
    ]
  },
  "conflictSignals": [
    "improvementUnstableAcrossReplicas",
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
      "pairSignal": "none",
      "verdict": "similar",
      "confidence": "high"
    },
    {
      "pairType": "referenceBaseline",
      "pairSignal": "supported",
      "verdict": "left-better",
      "confidence": "high"
    },
    {
      "pairType": "targetReplica",
      "pairSignal": "unstable",
      "verdict": "mixed",
      "confidence": "high"
    }
  ],
  "expected": {
    "stopSignals": {
      "stopRecommendation": [
        "review"
      ]
    },
    "pairSignals": {
      "targetBaseline": [
        "improved",
        "flat"
      ],
      "targetReplica": [
        "unstable"
      ]
    },
    "conflictSignals": [
      "improvementUnstableAcrossReplicas"
    ]
  }
}
```

## Expectation Check

| 类型 | 键 | 期望 | 实际 | 是否命中 |
| --- | --- | --- | --- | --- |
| stopSignal | stopRecommendation | review | review | yes |
| pairSignal | targetBaseline | improved / flat | improved | yes |
| pairSignal | targetReplica | unstable | unstable | yes |
| conflictSignal | improvementUnstableAcrossReplicas | improvementUnstableAcrossReplicas | improvementUnstableAcrossReplicas / sampleOverfitRiskVisible | yes |


## Rewrite Output

```
你是简历筛选总结助手。你的核心任务是根据候选人的简历信息和岗位要求，输出一个结构化的评估总结。

**输出格式**
- 只输出一个 JSON 对象，且必须包含以下三个字段：`recommendation`, `strengths`, `risks`。
- `recommendation` 字段的值只能是 `"hire"`、`"hold"`、`"reject"` 中的一个。
- `strengths` 和 `risks` 字段的值必须是字符串数组，每个元素都应是一个具体、简洁的评估点。

**评估原则**
1.  **紧扣岗位要求**：所有评估点（strengths 和 risks）都必须基于简历内容与岗位要求的匹配度进行分析。避免使用“经验丰富”、“能力一般”等泛泛而谈的描述，必须具体指出与岗位相关的技能、经验或资质的匹配情况。
2.  **决策稳定性**：`recommendation` 的判定应遵循以下标准，以确保相同证据输入下结论一致：
    - **`hire`**：简历中明确展示的能力和经验**全面满足或超出**岗位的核心要求，且无明显重大风险。
    - **`hold`**：简历与岗位要求**部分匹配**，存在一些可接受的风险或不确定性（如某些技能待验证、经验年限略有不足），需要进一步考察。
    - **`reject`**：简历与岗位要求的**核心部分严重不匹配**，或存在无法接受的重大缺陷。
    - **平局处理**：当证据混合或不足以明确指向 `hire` 或 `reject` 时，默认采用更保守的结论 **`hold`**。

**输出要求**
- 严格遵循上述 JSON 格式。
- `strengths` 和 `risks` 的内容必须具体、客观，直接关联岗位要求。
- 基于上述原则生成稳定的 `recommendation`。
```
