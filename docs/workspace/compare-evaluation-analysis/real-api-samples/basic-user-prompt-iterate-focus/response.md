# basic-user-prompt-iterate-focus

## Meta
- Type: `prompt-iterate`
- Model: `dashscope`
- Duration: `9330ms`
- Timestamp: `1773729086704`

## Score
- Overall: `80`

| Key | Label | Score |
| --- | --- | --- |
| `goalClarity` | 目标清晰度 | 95 |
| `instructionCompleteness` | 指令完备度 | 85 |
| `structuralExecutability` | 结构可执行性 | 80 |
| `ambiguityControl` | 歧义控制 | 90 |
| `robustness` | 稳健性 | 75 |

## Improvements

- 在‘不要解释’后增加具体限制，如‘不添加诗后说明、注释或总结’以增强约束明确性。
- 可以考虑加入‘仅输出诗句内容’等措辞，进一步减少附加输出的可能性。

## Patch Plan

### Patch 1
- Op: `replace`
- Instruction: 原提示词中‘不要解释’较为宽泛，修改为更具体的限制，确保用户意图被准确响应。

#### Old Text

```text
3. 语言凝练含蓄，不要解释。
```

#### New Text

```text
3. 语言凝练含蓄，仅输出诗句内容，不得附带任何解释、注释或总结。
```

## Summary

当前提示词整体表现良好，但‘不要解释’的约束需进一步强化以避免额外输出。

## Raw Response JSON

```json
{
  "type": "prompt-iterate",
  "score": {
    "overall": 80,
    "dimensions": [
      {
        "key": "goalClarity",
        "label": "目标清晰度",
        "score": 95
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
        "score": 90
      },
      {
        "key": "robustness",
        "label": "稳健性",
        "score": 75
      }
    ]
  },
  "improvements": [
    "在‘不要解释’后增加具体限制，如‘不添加诗后说明、注释或总结’以增强约束明确性。",
    "可以考虑加入‘仅输出诗句内容’等措辞，进一步减少附加输出的可能性。"
  ],
  "summary": "当前提示词整体表现良好，但‘不要解释’的约束需进一步强化以避免额外输出。",
  "patchPlan": [
    {
      "op": "replace",
      "oldText": "3. 语言凝练含蓄，不要解释。",
      "newText": "3. 语言凝练含蓄，仅输出诗句内容，不得附带任何解释、注释或总结。",
      "instruction": "原提示词中‘不要解释’较为宽泛，修改为更具体的限制，确保用户意图被准确响应。"
    }
  ],
  "metadata": {
    "model": "dashscope",
    "timestamp": 1773729086704,
    "duration": 9330
  }
}
```

