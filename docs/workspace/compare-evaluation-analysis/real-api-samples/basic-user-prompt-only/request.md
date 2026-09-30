# basic-user-prompt-only

## Meta
- Type: `prompt-only`
- Evaluation Model: `dashscope`
- Mode: `basic/user`

## Focus Brief

重点检查“不要解释”是否写得足够强，并判断是否会诱发模型追加说明性尾注

## Editable Target

### Workspace Prompt

```text
请写一首关于秋日思念的七言律诗。具体要求：1. 八句四联，押平声韵。2. 通过秋景间接表达思念。3. 语言凝练含蓄，不要解释。
```

## Raw Request JSON

```json
{
  "type": "prompt-only",
  "evaluationModelKey": "dashscope",
  "mode": {
    "functionMode": "basic",
    "subMode": "user"
  },
  "focus": {
    "content": "重点检查“不要解释”是否写得足够强，并判断是否会诱发模型追加说明性尾注",
    "source": "user",
    "priority": "highest"
  },
  "target": {
    "workspacePrompt": "请写一首关于秋日思念的七言律诗。具体要求：1. 八句四联，押平声韵。2. 通过秋景间接表达思念。3. 语言凝练含蓄，不要解释。"
  }
}
```

