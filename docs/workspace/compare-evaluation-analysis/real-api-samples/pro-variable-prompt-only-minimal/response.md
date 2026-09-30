# pro-variable-prompt-only-minimal

## Meta
- Type: `prompt-only`
- Model: `dashscope`
- Duration: `9695ms`
- Timestamp: `1773729170821`

## Score
- Overall: `80`

| Key | Label | Score |
| --- | --- | --- |
| `goalClarity` | 目标清晰度 | 90 |
| `instructionCompleteness` | 指令完备度 | 85 |
| `structuralExecutability` | 结构可执行性 | 80 |
| `ambiguityControl` | 歧义控制 | 75 |
| `robustness` | 稳健性 | 80 |

## Improvements

- 增强'不要解释'的表达强度，以确保在变量替换后仍能被明确理解。
- 考虑为'风格'和'主题'添加示例值说明，提升模板的直观可用性。

## Patch Plan

### Patch 1
- Op: `replace`
- Instruction: 当前'不要解释'可能在部分上下文中不够明确，修改为更具体的表达以提高稳健性。

#### Old Text

```text
不要解释
```

#### New Text

```text
请仅输出诗歌内容，不进行任何额外解释
```

## Summary

提示词基本稳健，但'不要解释'部分需强化以确保在变量替换后的清晰性。

## Raw Response JSON

```json
{
  "type": "prompt-only",
  "score": {
    "overall": 80,
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
        "score": 80
      },
      {
        "key": "ambiguityControl",
        "label": "歧义控制",
        "score": 75
      },
      {
        "key": "robustness",
        "label": "稳健性",
        "score": 80
      }
    ]
  },
  "improvements": [
    "增强'不要解释'的表达强度，以确保在变量替换后仍能被明确理解。",
    "考虑为'风格'和'主题'添加示例值说明，提升模板的直观可用性。"
  ],
  "summary": "提示词基本稳健，但'不要解释'部分需强化以确保在变量替换后的清晰性。",
  "patchPlan": [
    {
      "op": "replace",
      "oldText": "不要解释",
      "newText": "请仅输出诗歌内容，不进行任何额外解释",
      "instruction": "当前'不要解释'可能在部分上下文中不够明确，修改为更具体的表达以提高稳健性。"
    }
  ],
  "metadata": {
    "model": "dashscope",
    "timestamp": 1773729170821,
    "duration": 9695
  }
}
```

