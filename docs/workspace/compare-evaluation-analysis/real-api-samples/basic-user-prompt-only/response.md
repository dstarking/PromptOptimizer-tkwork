# basic-user-prompt-only

## Meta
- Type: `prompt-only`
- Model: `dashscope`
- Duration: `8653ms`
- Timestamp: `1773729077366`

## Score
- Overall: `85`

| Key | Label | Score |
| --- | --- | --- |
| `goalClarity` | 目标清晰度 | 90 |
| `instructionCompleteness` | 指令完备度 | 85 |
| `structuralExecutability` | 结构可执行性 | 90 |
| `ambiguityControl` | 歧义控制 | 80 |
| `robustness` | 稳健性 | 80 |

## Improvements

- 将'不要解释'改为更强烈的表述，例如'禁止添加任何说明性文字或尾注'，以明确约束输出格式。

## Patch Plan

### Patch 1
- Op: `replace`
- Instruction: 当前'不要解释'可能不足以阻止模型在输出后追加解释性内容。强化该指令为'禁止添加任何说明性文字或尾注'，以确保模型严格遵守输出要求。

#### Old Text

```text
不要解释。
```

#### New Text

```text
禁止添加任何说明性文字或尾注。
```

## Summary

提示词整体设计良好，但'不要解释'的表达力度较弱，可能诱发模型附加说明性内容。

## Raw Response JSON

```json
{
  "type": "prompt-only",
  "score": {
    "overall": 85,
    "dimensions": [
      {
        "key": "goalClarity",
        "label": "目标清晰度",
        "score": 90
      },
      {
        "key": "instructionCompleteness",
        "label": "指令完备度",
        "score": 85
      },
      {
        "key": "structuralExecutability",
        "label": "结构可执行性",
        "score": 90
      },
      {
        "key": "ambiguityControl",
        "label": "歧义控制",
        "score": 80
      },
      {
        "key": "robustness",
        "label": "稳健性",
        "score": 80
      }
    ]
  },
  "improvements": [
    "将'不要解释'改为更强烈的表述，例如'禁止添加任何说明性文字或尾注'，以明确约束输出格式。"
  ],
  "summary": "提示词整体设计良好，但'不要解释'的表达力度较弱，可能诱发模型附加说明性内容。",
  "patchPlan": [
    {
      "op": "replace",
      "oldText": "不要解释。",
      "newText": "禁止添加任何说明性文字或尾注。",
      "instruction": "当前'不要解释'可能不足以阻止模型在输出后追加解释性内容。强化该指令为'禁止添加任何说明性文字或尾注'，以确保模型严格遵守输出要求。"
    }
  ],
  "metadata": {
    "model": "dashscope",
    "timestamp": 1773729077366,
    "duration": 8653
  }
}
```

