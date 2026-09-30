# basic-user-prompt-iterate-focus

## Meta
- Type: `prompt-iterate`
- Evaluation Model: `dashscope`
- Mode: `basic/user`

## Focus Brief

优先强化“不要解释”，避免诗后追加说明、注释或尾注

## Editable Target

### Workspace Prompt

```text
请写一首关于秋日思念的七言律诗。具体要求：1. 八句四联，押平声韵。2. 通过秋景间接表达思念。3. 语言凝练含蓄，不要解释。
```

## Iterate Requirement

保持“秋日思念的七言律诗”任务不变，只增强“不要解释”的约束，避免任何诗后说明、注释、总结。

## Raw Request JSON

```json
{
  "type": "prompt-iterate",
  "evaluationModelKey": "dashscope",
  "mode": {
    "functionMode": "basic",
    "subMode": "user"
  },
  "focus": {
    "content": "优先强化“不要解释”，避免诗后追加说明、注释或尾注",
    "source": "user",
    "priority": "highest"
  },
  "iterateRequirement": "保持“秋日思念的七言律诗”任务不变，只增强“不要解释”的约束，避免任何诗后说明、注释、总结。",
  "target": {
    "workspacePrompt": "请写一首关于秋日思念的七言律诗。具体要求：1. 八句四联，押平声韵。2. 通过秋景间接表达思念。3. 语言凝练含蓄，不要解释。"
  }
}
```

