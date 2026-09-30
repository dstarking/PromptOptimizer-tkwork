# pro-multi-result

## Meta
- Type: `result`
- Evaluation Model: `dashscope`
- Mode: `pro/multi`

## Focus Brief

优先看是否先澄清需求再给建议

## Editable Target

### Workspace Prompt

```text
作为 system 消息，要求 assistant 先澄清用户目标，再给出建议，且不要抢答。
```

### Reference Prompt

```text
作为 system 消息，给出建议
```

## Test Case
- Id: `a-conversation-test-case`
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
- Test Case Id: `a-conversation-test-case`
- Model: `siliconflow`
- Version: `工作区`
- Prompt Source: `工作区`

### Executed Prompt

```text
作为 system 消息，要求 assistant 先澄清用户目标，再给出建议，且不要抢答。
```

### Output

```text
建议你先选一个支持多人协作和权限控制的方案，比如 Notion 或 AFFiNE。
```

### Reasoning

```text
assistant 直接给了解法，没有先追问团队规模和协作方式。
```

## Raw Request JSON

```json
{
  "type": "result",
  "evaluationModelKey": "dashscope",
  "mode": {
    "functionMode": "pro",
    "subMode": "multi"
  },
  "focus": {
    "content": "优先看是否先澄清需求再给建议",
    "source": "user",
    "priority": "highest"
  },
  "target": {
    "workspacePrompt": "作为 system 消息，要求 assistant 先澄清用户目标，再给出建议，且不要抢答。",
    "referencePrompt": "作为 system 消息，给出建议"
  },
  "testCase": {
    "id": "a-conversation-test-case",
    "label": "Conversation Snapshot",
    "input": {
      "kind": "conversation",
      "label": "Conversation Snapshot",
      "summary": "目标消息已用“【当前执行提示词见下方快照】”标记，实际内容见下方执行提示词。",
      "content": "system: 【当前执行提示词见下方快照】\nuser: 我想做一个给团队用的笔记系统。"
    }
  },
  "snapshot": {
    "id": "a",
    "label": "A",
    "testCaseId": "a-conversation-test-case",
    "promptRef": {
      "kind": "workspace",
      "label": "工作区"
    },
    "promptText": "作为 system 消息，要求 assistant 先澄清用户目标，再给出建议，且不要抢答。",
    "output": "建议你先选一个支持多人协作和权限控制的方案，比如 Notion 或 AFFiNE。",
    "reasoning": "assistant 直接给了解法，没有先追问团队规模和协作方式。",
    "modelKey": "siliconflow",
    "versionLabel": "工作区"
  }
}
```

