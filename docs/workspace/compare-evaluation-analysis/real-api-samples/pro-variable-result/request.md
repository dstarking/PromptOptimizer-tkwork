# pro-variable-result

## Meta
- Type: `result`
- Evaluation Model: `dashscope`
- Mode: `pro/variable`

## Focus Brief

关注“不要解释”与变量替换后语气是否仍稳定

## Editable Target

### Workspace Prompt

```text
你是一位{{风格}}的诗人。请根据以下要求创作一首关于“{{主题}}”的诗歌，不要解释。
```

### Reference Prompt

```text
你是一位{{风格}}的诗人，请写一首{{主题}}的诗
```

## Test Case
- Id: `a-variable-test-case`
- Label: `变量输入`

### Input

- Label: `变量输入`
- Kind: `variables`

```text
风格=中文古典
主题=程序员加班
```

## Snapshot 1
- Id: `a`
- Label: `A`
- Test Case Id: `a-variable-test-case`
- Model: `dashscope`
- Version: `工作区`
- Prompt Source: `工作区`

### Executed Prompt

```text
你是一位{{风格}}的诗人。请根据以下要求创作一首关于“{{主题}}”的诗歌，不要解释。
```

### Output

```text
《夜半敲键歌》

残灯照案五更寒，十指敲冰未肯阑。
窗外鸡鸣天欲晓，人间犹有代码山。
```

## Raw Request JSON

```json
{
  "type": "result",
  "evaluationModelKey": "dashscope",
  "mode": {
    "functionMode": "pro",
    "subMode": "variable"
  },
  "focus": {
    "content": "关注“不要解释”与变量替换后语气是否仍稳定",
    "source": "user",
    "priority": "highest"
  },
  "target": {
    "workspacePrompt": "你是一位{{风格}}的诗人。请根据以下要求创作一首关于“{{主题}}”的诗歌，不要解释。",
    "referencePrompt": "你是一位{{风格}}的诗人，请写一首{{主题}}的诗"
  },
  "testCase": {
    "id": "a-variable-test-case",
    "label": "变量输入",
    "input": {
      "kind": "variables",
      "label": "变量输入",
      "content": "风格=中文古典\n主题=程序员加班"
    }
  },
  "snapshot": {
    "id": "a",
    "label": "A",
    "testCaseId": "a-variable-test-case",
    "promptRef": {
      "kind": "workspace",
      "label": "工作区"
    },
    "promptText": "你是一位{{风格}}的诗人。请根据以下要求创作一首关于“{{主题}}”的诗歌，不要解释。",
    "output": "《夜半敲键歌》\n\n残灯照案五更寒，十指敲冰未肯阑。\n窗外鸡鸣天欲晓，人间犹有代码山。",
    "modelKey": "dashscope",
    "versionLabel": "工作区"
  }
}
```

