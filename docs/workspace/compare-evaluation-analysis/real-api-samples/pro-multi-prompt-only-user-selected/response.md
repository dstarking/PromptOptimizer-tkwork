# pro-multi-prompt-only-user-selected

## Meta
- Type: `prompt-only`
- Model: `dashscope`
- Duration: `13332ms`
- Timestamp: `1773729217687`

## Score
- Overall: `55`

| Key | Label | Score |
| --- | --- | --- |
| `goalClarity` | 目标清晰度 | 60 |
| `instructionCompleteness` | 指令完备度 | 40 |
| `structuralExecutability` | 结构可执行性 | 70 |
| `ambiguityControl` | 歧义控制 | 50 |
| `robustness` | 稳健性 | 45 |

## Improvements

- 增加对诗歌形式（如五言、七言、现代诗等）的引导，提高任务明确性。
- 补充对主题范围或风格的约束，减少模型输出的不确定性。
- 在变量占位 {{主题}} 前添加引导语（例如“请根据以下主题”），提升提示词的自然流畅度。

## Patch Plan

### Patch 1
- Op: `replace`
- Instruction: 原句缺少对诗歌形式和风格的指引，可能导致模型输出不稳定；修改后明确了体裁为‘现代诗’，增强了可执行性。

#### Old Text

```text
请你写一首关于{{主题}}的诗。
```

#### New Text

```text
请根据以下主题写一首简短的现代诗：{{主题}}。
```

## Summary

当前提示词基本能完成任务，但缺乏足够的约束和指导，需增强明确性和稳定性。

## Raw Response JSON

```json
{
  "type": "prompt-only",
  "score": {
    "overall": 55,
    "dimensions": [
      {
        "key": "goalClarity",
        "label": "目标清晰度",
        "score": 60
      },
      {
        "key": "instructionCompleteness",
        "label": "指令完备度",
        "score": 40
      },
      {
        "key": "structuralExecutability",
        "label": "结构可执行性",
        "score": 70
      },
      {
        "key": "ambiguityControl",
        "label": "歧义控制",
        "score": 50
      },
      {
        "key": "robustness",
        "label": "稳健性",
        "score": 45
      }
    ]
  },
  "improvements": [
    "增加对诗歌形式（如五言、七言、现代诗等）的引导，提高任务明确性。",
    "补充对主题范围或风格的约束，减少模型输出的不确定性。",
    "在变量占位 {{主题}} 前添加引导语（例如“请根据以下主题”），提升提示词的自然流畅度。"
  ],
  "summary": "当前提示词基本能完成任务，但缺乏足够的约束和指导，需增强明确性和稳定性。",
  "patchPlan": [
    {
      "op": "replace",
      "oldText": "请你写一首关于{{主题}}的诗。",
      "newText": "请根据以下主题写一首简短的现代诗：{{主题}}。",
      "instruction": "原句缺少对诗歌形式和风格的指引，可能导致模型输出不稳定；修改后明确了体裁为‘现代诗’，增强了可执行性。"
    }
  ],
  "metadata": {
    "model": "dashscope",
    "timestamp": 1773729217687,
    "duration": 13332
  }
}
```

