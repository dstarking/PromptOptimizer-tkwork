# pro-variable-compare-focus

## Meta
- Type: `compare`
- Model: `dashscope`
- Duration: `8345ms`
- Timestamp: `1773729186944`

## Score
- Overall: `60`

| Key | Label | Score |
| --- | --- | --- |
| `goalAchievementRobustness` | 目标达成稳定性 | 40 |
| `outputQualityCeiling` | 输出质量上限 | 70 |
| `promptPatternQuality` | 提示词模式质量 | 50 |
| `crossSnapshotRobustness` | 跨快照鲁棒性 | 30 |
| `workspaceTransferability` | 对工作区的可迁移性 | 60 |

## Improvements

- 增强'不要解释'的约束力，例如改为'请仅输出诗歌内容，不添加任何说明或注释'，以减少模型自由发挥空间。
- 在提示词中加入明确的输出格式示例（如展示一个无解释的诗作模板），提升模型理解一致性。

## Summary

当前提示词未能稳定抑制解释性输出，需加强约束和示例引导。

## Raw Response JSON

```json
{
  "type": "compare",
  "score": {
    "overall": 60,
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
        "score": 50
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 30
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 60
      }
    ]
  },
  "improvements": [
    "增强'不要解释'的约束力，例如改为'请仅输出诗歌内容，不添加任何说明或注释'，以减少模型自由发挥空间。",
    "在提示词中加入明确的输出格式示例（如展示一个无解释的诗作模板），提升模型理解一致性。"
  ],
  "summary": "当前提示词未能稳定抑制解释性输出，需加强约束和示例引导。",
  "patchPlan": [],
  "metadata": {
    "model": "dashscope",
    "timestamp": 1773729186944,
    "duration": 8345
  }
}
```

