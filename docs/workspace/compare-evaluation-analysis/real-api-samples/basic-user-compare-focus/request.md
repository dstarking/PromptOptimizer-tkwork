# basic-user-compare-focus

## Meta
- Type: `compare`
- Evaluation Model: `dashscope`
- Mode: `basic/user`

## Focus Brief

优先比较哪种写法更能稳定避免解释性尾注

## Editable Target

### Workspace Prompt

```text
请写一首关于秋日思念的七言律诗。具体要求：1. 八句四联，押平声韵。2. 通过秋景间接表达思念。3. 语言凝练含蓄，不要解释。
```

### Reference Prompt

```text
写一首诗
```

## Test Case 1
- Id: `shared-test-case-a`
- Label: `测试内容-无附加输入`

### Input

- Label: `测试内容`
- Kind: `text`

```text
无额外测试输入，输出直接基于当前提示词生成。
```

## Test Case 2
- Id: `shared-test-case-b`
- Label: `测试内容-指定意象`

### Input

- Label: `测试内容`
- Kind: `text`

额外限制了意象范围

```text
请尽量使用霜叶、孤灯、归雁三个意象。
```

## Snapshot 1
- Id: `a`
- Label: `A`
- Test Case Id: `shared-test-case-a`
- Model: `siliconflow`
- Version: `原始`
- Prompt Source: `原始`

### Executed Prompt

```text
写一首诗
```

### Output

```text
《秋思》

秋风秋雨愁煞人。

这首诗表达思念。
```

## Snapshot 2
- Id: `b`
- Label: `B`
- Test Case Id: `shared-test-case-b`
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

霜叶摇灯夜色长，孤窗一点对潇湘。
归雁无声穿暮霭，离怀有意入秋光。
```

### Reasoning

```text
该版本没有再追加解释性尾注。
```

## Raw Request JSON

```json
{
  "type": "compare",
  "evaluationModelKey": "dashscope",
  "mode": {
    "functionMode": "basic",
    "subMode": "user"
  },
  "focus": {
    "content": "优先比较哪种写法更能稳定避免解释性尾注",
    "source": "user",
    "priority": "highest"
  },
  "target": {
    "workspacePrompt": "请写一首关于秋日思念的七言律诗。具体要求：1. 八句四联，押平声韵。2. 通过秋景间接表达思念。3. 语言凝练含蓄，不要解释。",
    "referencePrompt": "写一首诗"
  },
  "testCases": [
    {
      "id": "shared-test-case-a",
      "label": "测试内容-无附加输入",
      "input": {
        "kind": "text",
        "label": "测试内容",
        "content": "无额外测试输入，输出直接基于当前提示词生成。"
      }
    },
    {
      "id": "shared-test-case-b",
      "label": "测试内容-指定意象",
      "input": {
        "kind": "text",
        "label": "测试内容",
        "summary": "额外限制了意象范围",
        "content": "请尽量使用霜叶、孤灯、归雁三个意象。"
      }
    }
  ],
  "snapshots": [
    {
      "id": "a",
      "label": "A",
      "testCaseId": "shared-test-case-a",
      "promptRef": {
        "kind": "original",
        "label": "原始"
      },
      "promptText": "写一首诗",
      "output": "《秋思》\n\n秋风秋雨愁煞人。\n\n这首诗表达思念。",
      "modelKey": "siliconflow",
      "versionLabel": "原始"
    },
    {
      "id": "b",
      "label": "B",
      "testCaseId": "shared-test-case-b",
      "promptRef": {
        "kind": "workspace",
        "label": "工作区"
      },
      "promptText": "请写一首关于秋日思念的七言律诗。具体要求：1. 八句四联，押平声韵。2. 通过秋景间接表达思念。3. 语言凝练含蓄，不要解释。",
      "output": "《秋思》\n\n霜叶摇灯夜色长，孤窗一点对潇湘。\n归雁无声穿暮霭，离怀有意入秋光。",
      "reasoning": "该版本没有再追加解释性尾注。",
      "modelKey": "dashscope",
      "versionLabel": "工作区"
    }
  ]
}
```

