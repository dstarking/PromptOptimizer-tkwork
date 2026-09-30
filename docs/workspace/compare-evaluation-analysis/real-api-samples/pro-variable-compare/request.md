# pro-variable-compare

## Meta
- Type: `compare`
- Evaluation Model: `dashscope`
- Mode: `pro/variable`

## Editable Target

### Workspace Prompt

```text
你是一位{{风格}}的诗人。请根据以下要求创作一首关于“{{主题}}”的诗歌，不要解释。
```

### Reference Prompt

```text
你是一位{{风格}}的诗人，请写一首{{主题}}的诗
```

## Test Case 1
- Id: `shared-variable-test-case`
- Label: `变量输入`

### Settings Summary

除模型外，其余测试设置保持一致

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
- Test Case Id: `shared-variable-test-case`
- Model: `dashscope`
- Version: `v1`
- Prompt Source: `v1`

### Executed Prompt

```text
你是一位{{风格}}的诗人。请根据以下要求创作一首关于“{{主题}}”的诗歌，不要解释。
```

### Output

```text
《夜半敲键歌》

残灯照案五更寒，十指敲冰未肯阑。
咖啡已冷人未歇，只把长更作短欢。
```

## Snapshot 2
- Id: `b`
- Label: `B`
- Test Case Id: `shared-variable-test-case`
- Model: `siliconflow`
- Version: `v1`
- Prompt Source: `v1`

### Executed Prompt

```text
你是一位{{风格}}的诗人。请根据以下要求创作一首关于“{{主题}}”的诗歌，不要解释。
```

### Output

```text
《夜半敲键歌》

夜深人静写代码。

说明：表达了加班的辛苦。
```

## Raw Request JSON

```json
{
  "type": "compare",
  "evaluationModelKey": "dashscope",
  "mode": {
    "functionMode": "pro",
    "subMode": "variable"
  },
  "target": {
    "workspacePrompt": "你是一位{{风格}}的诗人。请根据以下要求创作一首关于“{{主题}}”的诗歌，不要解释。",
    "referencePrompt": "你是一位{{风格}}的诗人，请写一首{{主题}}的诗"
  },
  "testCases": [
    {
      "id": "shared-variable-test-case",
      "label": "变量输入",
      "settingsSummary": "除模型外，其余测试设置保持一致",
      "input": {
        "kind": "variables",
        "label": "变量输入",
        "content": "风格=中文古典\n主题=程序员加班"
      }
    }
  ],
  "snapshots": [
    {
      "id": "a",
      "label": "A",
      "testCaseId": "shared-variable-test-case",
      "promptRef": {
        "kind": "version",
        "version": 1,
        "label": "v1"
      },
      "promptText": "你是一位{{风格}}的诗人。请根据以下要求创作一首关于“{{主题}}”的诗歌，不要解释。",
      "output": "《夜半敲键歌》\n\n残灯照案五更寒，十指敲冰未肯阑。\n咖啡已冷人未歇，只把长更作短欢。",
      "modelKey": "dashscope",
      "versionLabel": "v1"
    },
    {
      "id": "b",
      "label": "B",
      "testCaseId": "shared-variable-test-case",
      "promptRef": {
        "kind": "version",
        "version": 1,
        "label": "v1"
      },
      "promptText": "你是一位{{风格}}的诗人。请根据以下要求创作一首关于“{{主题}}”的诗歌，不要解释。",
      "output": "《夜半敲键歌》\n\n夜深人静写代码。\n\n说明：表达了加班的辛苦。",
      "modelKey": "siliconflow",
      "versionLabel": "v1"
    }
  ]
}
```

