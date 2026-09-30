# basic-system-compare

## Meta
- Type: `compare`
- Model: `dashscope`
- Duration: `8418ms`
- Timestamp: `1773732666570`

## Score
- Overall: `65`

| Key | Label | Score |
| --- | --- | --- |
| `goalAchievementRobustness` | 目标达成稳定性 | 40 |
| `outputQualityCeiling` | 输出质量上限 | 70 |
| `promptPatternQuality` | 提示词模式质量 | 30 |
| `crossSnapshotRobustness` | 跨快照鲁棒性 | 20 |
| `workspaceTransferability` | 对工作区的可迁移性 | 80 |

## Improvements

- 在提示词中明确角色（如客服助手）、任务步骤（判断问题类型）和输出格式，以提升输出结构化与目标达成率。
- 增加示例或更具体的约束条件，引导模型生成更贴合场景的回复内容。
- 统一不同模型间的提示词规范，增强跨模型响应的一致性和可靠性。

## Summary

快照 B 表现更好，因为它补充了明确的角色、任务步骤和输出格式，而快照 A 的提示词过于模糊，导致输出质量低且缺乏结构。

## Raw Response JSON

```json
{
  "type": "compare",
  "score": {
    "overall": 65,
    "dimensions": [
      {
        "key": "goalAchievementRobustness",
        "label": "目标达成稳定性",
        "score": 40
      },
      {
        "key": "outputQualityCeiling",
        "label": "输出质量上限",
        "score": 70
      },
      {
        "key": "promptPatternQuality",
        "label": "提示词模式质量",
        "score": 30
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 20
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 80
      }
    ]
  },
  "improvements": [
    "在提示词中明确角色（如客服助手）、任务步骤（判断问题类型）和输出格式，以提升输出结构化与目标达成率。",
    "增加示例或更具体的约束条件，引导模型生成更贴合场景的回复内容。",
    "统一不同模型间的提示词规范，增强跨模型响应的一致性和可靠性。"
  ],
  "summary": "快照 B 表现更好，因为它补充了明确的角色、任务步骤和输出格式，而快照 A 的提示词过于模糊，导致输出质量低且缺乏结构。",
  "patchPlan": [],
  "metadata": {
    "model": "dashscope",
    "timestamp": 1773732666570,
    "duration": 8418
  }
}
```

