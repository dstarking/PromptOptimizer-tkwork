# basic-user-result

## Meta
- Type: `result`
- Evaluation Model: `dashscope`
- Mode: `basic/user`

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
- Id: `a-test-case`
- Label: `测试内容`

### Input

- Label: `测试内容`
- Kind: `text`

```text
无额外测试输入，输出直接基于当前提示词生成。
```

## Snapshot 1
- Id: `a`
- Label: `A`
- Test Case Id: `a-test-case`
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

风起云飞叶落时，孤灯照影夜迟迟。
庭前菊老香犹在，檐下雁归声未移。

旧梦依稀如雾散，新愁漫漫似烟滋。
凭栏远望天涯路，一缕斜阳照客思。

——愿这首诗能寄托你心中的思绪。
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
  "target": {
    "workspacePrompt": "请写一首关于秋日思念的七言律诗。具体要求：1. 八句四联，押平声韵。2. 通过秋景间接表达思念。3. 语言凝练含蓄，不要解释。",
    "referencePrompt": "写一首诗"
  },
  "testCase": {
    "id": "a-test-case",
    "label": "测试内容",
    "input": {
      "kind": "text",
      "label": "测试内容",
      "content": "无额外测试输入，输出直接基于当前提示词生成。"
    }
  },
  "snapshot": {
    "id": "a",
    "label": "A",
    "testCaseId": "a-test-case",
    "promptRef": {
      "kind": "original",
      "label": "原始"
    },
    "promptText": "写一首诗",
    "output": "《秋思》\n\n风起云飞叶落时，孤灯照影夜迟迟。\n庭前菊老香犹在，檐下雁归声未移。\n\n旧梦依稀如雾散，新愁漫漫似烟滋。\n凭栏远望天涯路，一缕斜阳照客思。\n\n——愿这首诗能寄托你心中的思绪。",
    "modelKey": "siliconflow",
    "versionLabel": "原始"
  }
}
```

