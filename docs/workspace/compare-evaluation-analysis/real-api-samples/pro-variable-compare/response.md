# pro-variable-compare

## Meta
- Type: `compare`
- Model: `dashscope`
- Duration: `9754ms`
- Timestamp: `1773731255810`

## Score
- Overall: `60`

| Key | Label | Score |
| --- | --- | --- |
| `goalAchievementRobustness` | 目标达成稳定性 | 50 |
| `outputQualityCeiling` | 输出质量上限 | 70 |
| `promptPatternQuality` | 提示词模式质量 | 65 |
| `crossSnapshotRobustness` | 跨快照鲁棒性 | 40 |
| `workspaceTransferability` | 对工作区的可迁移性 | 60 |

## Improvements

- 明确禁止添加额外说明，当前快照 B 违反了'不要解释'的指令，应强化该约束并加入示例展示符合要求的格式。
- 增强风格与主题融合的引导，例如通过增加'请用{{风格}}的语言特点描绘{{主题}}场景'来减少模型自由发挥空间。
- 提供诗歌结构示例（如四句、押韵方式），以提升不同模型对创作形式的一致理解。

## Summary

快照 B 违反了'不要解释'的指令，且同提示词下输出质量差异显著，提示词需加强边界约束和示例引导。

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
        "score": 50
      },
      {
        "key": "outputQualityCeiling",
        "label": "输出质量上限",
        "score": 70
      },
      {
        "key": "promptPatternQuality",
        "label": "提示词模式质量",
        "score": 65
      },
      {
        "key": "crossSnapshotRobustness",
        "label": "跨快照鲁棒性",
        "score": 40
      },
      {
        "key": "workspaceTransferability",
        "label": "对工作区的可迁移性",
        "score": 60
      }
    ]
  },
  "improvements": [
    "明确禁止添加额外说明，当前快照 B 违反了'不要解释'的指令，应强化该约束并加入示例展示符合要求的格式。",
    "增强风格与主题融合的引导，例如通过增加'请用{{风格}}的语言特点描绘{{主题}}场景'来减少模型自由发挥空间。",
    "提供诗歌结构示例（如四句、押韵方式），以提升不同模型对创作形式的一致理解。"
  ],
  "summary": "快照 B 违反了'不要解释'的指令，且同提示词下输出质量差异显著，提示词需加强边界约束和示例引导。",
  "patchPlan": [],
  "metadata": {
    "model": "dashscope",
    "timestamp": 1773731255810,
    "duration": 9754
  }
}
```

