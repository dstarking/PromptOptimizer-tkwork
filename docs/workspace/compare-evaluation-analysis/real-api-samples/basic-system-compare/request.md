# basic-system-compare

## Meta
- Type: `compare`
- Evaluation Model: `dashscope`
- Mode: `basic/system`

## Editable Target

### Workspace Prompt

```text
你是一个客服助手。请先判断问题类型，再给出建议回复。输出格式固定为：问题类型、风险等级、建议回复。
```

### Reference Prompt

```text
你是一个助手。
```

## Test Case 1
- Id: `shared-test-case`
- Label: `测试内容`

### Input

- Label: `测试内容`
- Kind: `text`

```text
用户说：订单超过一周还没发货，我很着急。
```

## Snapshot 1
- Id: `a`
- Label: `A`
- Test Case Id: `shared-test-case`
- Model: `siliconflow`
- Version: `原始`
- Prompt Source: `原始`

### Executed Prompt

```text
你是一个助手。
```

### Output

```text
很抱歉。
```

## Snapshot 2
- Id: `b`
- Label: `B`
- Test Case Id: `shared-test-case`
- Model: `dashscope`
- Version: `工作区`
- Prompt Source: `工作区`

### Executed Prompt

```text
你是一个客服助手。请先判断问题类型，再给出建议回复。输出格式固定为：问题类型、风险等级、建议回复。
```

### Output

```text
问题类型：物流延迟
风险等级：中
建议回复：非常抱歉让您久等，我们会立即帮您核查物流状态，并优先跟进处理。
```

## Raw Request JSON

```json
{
  "type": "compare",
  "evaluationModelKey": "dashscope",
  "mode": {
    "functionMode": "basic",
    "subMode": "system"
  },
  "target": {
    "workspacePrompt": "你是一个客服助手。请先判断问题类型，再给出建议回复。输出格式固定为：问题类型、风险等级、建议回复。",
    "referencePrompt": "你是一个助手。"
  },
  "testCases": [
    {
      "id": "shared-test-case",
      "label": "测试内容",
      "input": {
        "kind": "text",
        "label": "测试内容",
        "content": "用户说：订单超过一周还没发货，我很着急。"
      }
    }
  ],
  "snapshots": [
    {
      "id": "a",
      "label": "A",
      "testCaseId": "shared-test-case",
      "promptRef": {
        "kind": "original",
        "label": "原始"
      },
      "promptText": "你是一个助手。",
      "output": "很抱歉。",
      "modelKey": "siliconflow",
      "versionLabel": "原始"
    },
    {
      "id": "b",
      "label": "B",
      "testCaseId": "shared-test-case",
      "promptRef": {
        "kind": "workspace",
        "label": "工作区"
      },
      "promptText": "你是一个客服助手。请先判断问题类型，再给出建议回复。输出格式固定为：问题类型、风险等级、建议回复。",
      "output": "问题类型：物流延迟\n风险等级：中\n建议回复：非常抱歉让您久等，我们会立即帮您核查物流状态，并优先跟进处理。",
      "modelKey": "dashscope",
      "versionLabel": "工作区"
    }
  ]
}
```

