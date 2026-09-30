# basic-user-compare

## Meta
- Type: `compare`
- Model: `dashscope`
- Duration: `10153ms`
- Timestamp: `1773732635109`

## Score
- Overall: `78`

| Key | Label | Score |
| --- | --- | --- |
| `goalAchievementRobustness` | 目标达成稳定性 | 70 |
| `outputQualityCeiling` | 输出质量上限 | 90 |
| `promptPatternQuality` | 提示词模式质量 | 65 |
| `crossSnapshotRobustness` | 跨快照鲁棒性 | 60 |
| `workspaceTransferability` | 对工作区的可迁移性 | 85 |

## Improvements

- 在原始提示词中补充明确的任务类型（如七言律诗）、表达方式要求（含蓄、不解释）和意象范围，可以显著提升模型输出的质量与一致性。
- 为提高跨快照鲁棒性，建议在提示词中加入格式规范（如八句四联、押平声韵），以减少模型因理解偏差导致的输出不稳定。
- 在需要控制输出风格时，应避免模糊指令（如“写一首诗”），而应使用更具体的任务描述，引导模型聚焦于特定文学形式或情感表达。

## Summary

快照 B 的输出质量更高，主要得益于其明确了任务类型、格式约束及禁止项，这些差异直接影响了生成结果的文学性和一致性。

## Raw Response JSON

```json
{
  "type": "compare",
  "score": {
    "overall": 78,
    "dimensions": [
      {
        "key": "goalAchievementRobustness",
        "label": "目标达成稳定性",
        "score": 70
      },
      {
        "key": "outputQualityCeiling",
        "label": "输出质量上限",
        "score": 90
      },
      {
        "key": "promptPatternQuality",
        "label": "提示词模式质量",
        "score": 65
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 60
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 85
      }
    ]
  },
  "improvements": [
    "在原始提示词中补充明确的任务类型（如七言律诗）、表达方式要求（含蓄、不解释）和意象范围，可以显著提升模型输出的质量与一致性。",
    "为提高跨快照鲁棒性，建议在提示词中加入格式规范（如八句四联、押平声韵），以减少模型因理解偏差导致的输出不稳定。",
    "在需要控制输出风格时，应避免模糊指令（如“写一首诗”），而应使用更具体的任务描述，引导模型聚焦于特定文学形式或情感表达。"
  ],
  "summary": "快照 B 的输出质量更高，主要得益于其明确了任务类型、格式约束及禁止项，这些差异直接影响了生成结果的文学性和一致性。",
  "patchPlan": [],
  "metadata": {
    "model": "dashscope",
    "timestamp": 1773732635109,
    "duration": 10153
  }
}
```

