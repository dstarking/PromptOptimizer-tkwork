# pro-multi-prompt-only-user-selected

## Meta
- Type: `prompt-only`
- Evaluation Model: `dashscope`
- Mode: `pro/multi`

## Focus Brief

重点检查 user 消息是否足够明确任务目标，并保持变量占位的可执行性。

## Editable Target

### Workspace Prompt

```text
请你写一首关于{{主题}}的诗。
```

### Design Context

- Label: `Conversation Design Context`
- Kind: `conversation`

当前分析目标是 user 消息；会话中的该位置已用“【当前工作区要优化的提示词】”标记。

```text
目标消息角色: user
会话上下文:
- system: 你是一个诗人
- user: 【当前工作区要优化的提示词】
```

## Raw Request JSON

```json
{
  "type": "prompt-only",
  "evaluationModelKey": "dashscope",
  "mode": {
    "functionMode": "pro",
    "subMode": "multi"
  },
  "focus": {
    "content": "重点检查 user 消息是否足够明确任务目标，并保持变量占位的可执行性。",
    "source": "user",
    "priority": "highest"
  },
  "target": {
    "workspacePrompt": "请你写一首关于{{主题}}的诗。",
    "designContext": {
      "kind": "conversation",
      "label": "Conversation Design Context",
      "summary": "当前分析目标是 user 消息；会话中的该位置已用“【当前工作区要优化的提示词】”标记。",
      "content": "目标消息角色: user\n会话上下文:\n- system: 你是一个诗人\n- user: 【当前工作区要优化的提示词】"
    }
  }
}
```

