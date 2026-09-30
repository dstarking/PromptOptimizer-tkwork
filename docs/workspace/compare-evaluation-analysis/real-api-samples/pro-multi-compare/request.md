# pro-multi-compare

## Meta
- Type: `compare`
- Evaluation Model: `dashscope`
- Mode: `pro/multi`

## Focus Brief

优先判断 system 消息是否真正促使 assistant 先澄清

## Editable Target

### Workspace Prompt

```text
作为 system 消息，要求 assistant 先澄清用户目标，再给出建议，且不要抢答。
```

### Reference Prompt

```text
作为 system 消息，给出建议
```

## Test Case 1
- Id: `shared-conversation-test-case`
- Label: `Conversation Snapshot`

### Input

- Label: `Conversation Snapshot`
- Kind: `conversation`

目标消息已用“【当前执行提示词见下方快照】”标记，实际内容见下方执行提示词。

```text
system: 【当前执行提示词见下方快照】
user: 我想做一个给团队用的笔记系统。
```

## Snapshot 1
- Id: `a`
- Label: `A`
- Test Case Id: `shared-conversation-test-case`
- Model: `siliconflow`
- Version: `原始`
- Prompt Source: `原始`

### Executed Prompt

```text
作为 system 消息，给出建议
```

### Output

```text
建议你直接选 Notion。
```

### Reasoning

```text
没有任何澄清问题。
```

## Snapshot 2
- Id: `b`
- Label: `B`
- Test Case Id: `shared-conversation-test-case`
- Model: `dashscope`
- Version: `工作区`
- Prompt Source: `工作区`

### Executed Prompt

```text
作为 system 消息，要求 assistant 先澄清用户目标，再给出建议，且不要抢答。
```

### Output

```text
你更关注多人实时协作、权限控制，还是知识沉淀与搜索？
```

### Reasoning

```text
先澄清了需求，没有直接给方案。
```

## Raw Request JSON

```json
{
  "type": "compare",
  "evaluationModelKey": "dashscope",
  "mode": {
    "functionMode": "pro",
    "subMode": "multi"
  },
  "focus": {
    "content": "优先判断 system 消息是否真正促使 assistant 先澄清",
    "source": "user",
    "priority": "highest"
  },
  "target": {
    "workspacePrompt": "作为 system 消息，要求 assistant 先澄清用户目标，再给出建议，且不要抢答。",
    "referencePrompt": "作为 system 消息，给出建议"
  },
  "testCases": [
    {
      "id": "shared-conversation-test-case",
      "label": "Conversation Snapshot",
      "input": {
        "kind": "conversation",
        "label": "Conversation Snapshot",
        "summary": "目标消息已用“【当前执行提示词见下方快照】”标记，实际内容见下方执行提示词。",
        "content": "system: 【当前执行提示词见下方快照】\nuser: 我想做一个给团队用的笔记系统。"
      }
    }
  ],
  "snapshots": [
    {
      "id": "a",
      "label": "A",
      "testCaseId": "shared-conversation-test-case",
      "promptRef": {
        "kind": "original",
        "label": "原始"
      },
      "promptText": "作为 system 消息，给出建议",
      "output": "建议你直接选 Notion。",
      "reasoning": "没有任何澄清问题。",
      "modelKey": "siliconflow",
      "versionLabel": "原始"
    },
    {
      "id": "b",
      "label": "B",
      "testCaseId": "shared-conversation-test-case",
      "promptRef": {
        "kind": "workspace",
        "label": "工作区"
      },
      "promptText": "作为 system 消息，要求 assistant 先澄清用户目标，再给出建议，且不要抢答。",
      "output": "你更关注多人实时协作、权限控制，还是知识沉淀与搜索？",
      "reasoning": "先澄清了需求，没有直接给方案。",
      "modelKey": "dashscope",
      "versionLabel": "工作区"
    }
  ]
}
```

