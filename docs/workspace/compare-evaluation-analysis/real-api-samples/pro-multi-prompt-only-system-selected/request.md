# pro-multi-prompt-only-system-selected

## Meta
- Type: `prompt-only`
- Evaluation Model: `dashscope`
- Mode: `pro/multi`

## Focus Brief

重点检查 system 消息是否足够明确角色定位，并能稳定约束后续 user 写诗任务。

## Editable Target

### Workspace Prompt

```text
你是一个诗人
```

### Design Context

- Label: `Conversation Design Context`
- Kind: `conversation`

当前分析目标是 system 消息；会话中的该位置已用“【当前工作区要优化的提示词】”标记。

```text
目标消息角色: system
会话上下文:
- system: 【当前工作区要优化的提示词】
- user: 请你写一首关于{{主题}}的诗。
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
    "content": "重点检查 system 消息是否足够明确角色定位，并能稳定约束后续 user 写诗任务。",
    "source": "user",
    "priority": "highest"
  },
  "target": {
    "workspacePrompt": "你是一个诗人",
    "designContext": {
      "kind": "conversation",
      "label": "Conversation Design Context",
      "summary": "当前分析目标是 system 消息；会话中的该位置已用“【当前工作区要优化的提示词】”标记。",
      "content": "目标消息角色: system\n会话上下文:\n- system: 【当前工作区要优化的提示词】\n- user: 请你写一首关于{{主题}}的诗。"
    }
  }
}
```

