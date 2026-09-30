# basic-user-result-focus

## Meta
- Type: `result`
- Evaluation Model: `dashscope`
- Mode: `basic/user`

## Focus Brief

优先判断“不要解释”是否真正生效，不要泛泛评价诗歌质量

## Editable Target

### Workspace Prompt

```text
请写一首关于秋日思念的七言律诗。具体要求：1. 八句四联，押平声韵。2. 通过秋景间接表达思念。3. 语言凝练含蓄，不要解释。
```

### Reference Prompt

```text
写一首诗
```

## Test Case
- Id: `focus-result-test-case`
- Label: `测试内容`

### Input

- Label: `测试内容`
- Kind: `text`

```text
无额外测试输入，输出直接基于当前提示词生成。
```

## Snapshot 1
- Id: `b`
- Label: `B`
- Test Case Id: `focus-result-test-case`
- Model: `dashscope`
- Version: `工作区`
- Prompt Source: `工作区`

### Executed Prompt

```text
请写一首关于秋日思念的七言律诗。具体要求：1. 八句四联，押平声韵。2. 通过秋景间接表达思念。3. 语言凝练含蓄，不要解释。
```

### Output

```text
《秋思》

霜叶摇灯夜色长，归雁无声过小窗。
孤枕寒更人未寐，秋心一寸到潇湘。

附：这首诗通过秋景表达了思念之情。
```

### Reasoning

```text
主体已经写成诗，但结尾又补了一句说明性尾注。
```

## Raw Request JSON

```json
{
  "type": "result",
  "evaluationModelKey": "dashscope",
  "mode": {
    "functionMode": "basic",
    "subMode": "user"
  },
  "focus": {
    "content": "优先判断“不要解释”是否真正生效，不要泛泛评价诗歌质量",
    "source": "user",
    "priority": "highest"
  },
  "target": {
    "workspacePrompt": "请写一首关于秋日思念的七言律诗。具体要求：1. 八句四联，押平声韵。2. 通过秋景间接表达思念。3. 语言凝练含蓄，不要解释。",
    "referencePrompt": "写一首诗"
  },
  "testCase": {
    "id": "focus-result-test-case",
    "label": "测试内容",
    "input": {
      "kind": "text",
      "label": "测试内容",
      "content": "无额外测试输入，输出直接基于当前提示词生成。"
    }
  },
  "snapshot": {
    "id": "b",
    "label": "B",
    "testCaseId": "focus-result-test-case",
    "promptRef": {
      "kind": "workspace",
      "label": "工作区"
    },
    "promptText": "请写一首关于秋日思念的七言律诗。具体要求：1. 八句四联，押平声韵。2. 通过秋景间接表达思念。3. 语言凝练含蓄，不要解释。",
    "output": "《秋思》\n\n霜叶摇灯夜色长，归雁无声过小窗。\n孤枕寒更人未寐，秋心一寸到潇湘。\n\n附：这首诗通过秋景表达了思念之情。",
    "reasoning": "主体已经写成诗，但结尾又补了一句说明性尾注。",
    "modelKey": "dashscope",
    "versionLabel": "工作区"
  }
}
```

