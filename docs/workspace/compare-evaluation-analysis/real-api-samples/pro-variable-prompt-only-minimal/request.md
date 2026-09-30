# pro-variable-prompt-only-minimal

## Meta
- Type: `prompt-only`
- Evaluation Model: `dashscope`
- Mode: `pro/variable`

## Focus Brief

重点检查模板设计是否足够稳健，尤其是“不要解释”在变量替换后是否仍然清晰。

## Editable Target

### Workspace Prompt

```text
你是一位{{风格}}的诗人。请围绕“{{主题}}”创作一首古典风格诗歌，不要解释。
```

### Design Context

- Label: `Variable Structure`
- Kind: `variables`

这里只说明模板变量结构，不包含任何测试值。

```text
变量: 风格, 主题
```

## Raw Request JSON

```json
{
  "type": "prompt-only",
  "evaluationModelKey": "dashscope",
  "mode": {
    "functionMode": "pro",
    "subMode": "variable"
  },
  "focus": {
    "content": "重点检查模板设计是否足够稳健，尤其是“不要解释”在变量替换后是否仍然清晰。",
    "source": "user",
    "priority": "highest"
  },
  "target": {
    "workspacePrompt": "你是一位{{风格}}的诗人。请围绕“{{主题}}”创作一首古典风格诗歌，不要解释。",
    "designContext": {
      "kind": "variables",
      "label": "Variable Structure",
      "summary": "这里只说明模板变量结构，不包含任何测试值。",
      "content": "变量: 风格, 主题"
    }
  }
}
```

