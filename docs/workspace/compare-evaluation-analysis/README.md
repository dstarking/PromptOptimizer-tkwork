# compare-evaluation-analysis

> 这个目录已经收敛成“当前规范 + 手工验收 + 真实样例 + 历史资料”四层结构。

## 先看什么

如果你只想快速理解现在的实现，不要再从旧进度稿开始读。按这个顺序看：

1. [current-spec.md](./current-spec.md)
2. [manual-acceptance.md](./manual-acceptance.md)
3. [manual-test-playbook.md](./manual-test-playbook.md)
4. [protocol-migration-minimal-plan.md](./protocol-migration-minimal-plan.md)
5. [auto-compare-rewrite-effect-analysis.md](./auto-compare-rewrite-effect-analysis.md)
6. [real-api-samples/review-summary.md](./real-api-samples/review-summary.md)
7. `real-api-samples/*/rendered-messages.md`

## 当前目录结构

- `current-spec.md`
  当前唯一推荐的总览文档。
  说明分析 / 评估 / 对比评估的语义、输入边界、4 个文本模式差异、当前已完成项和剩余问题。
- `manual-acceptance.md`
  当前手工测试入口。
  如果你要自己在浏览器里点一遍，就看这份。
- `manual-test-playbook.md`
  当前最适合直接照着操作的一份手测步骤文档。
  如果你要逐步验证 compare 阶段功能，优先看这份。
- `protocol-migration-minimal-plan.md`
  compare / rewrite 从 Markdown 协议层迁移到 JSON payload 协议层的最小实现方案与落地说明。
  如果你准备继续做协议层收敛或复盘这次迁移，优先看这份。
- `auto-compare-rewrite-effect-analysis.md`
  基于真实 calibration 产物整理的效果分析。
  如果你想判断“当前自动对比评估 + 智能改写到底有没有实际价值”，优先看这份。
- `real-api-samples/`
  真实模型请求样例。
  这是判断“现在到底发了什么给模型”的最高优先级证据。
- `history/`
  历史设计稿、阶段进度、旧推导文档。
  保留是为了追溯，不再作为当前实现的直接依据。

## 当前结论

- 左侧没有输出的是“分析”。
- 右侧单个输出的是“评估”。
- 右侧多个输出一起比的是“对比评估”。
- 左侧只看设计态输入，右侧只看执行态证据。
- 文本模式当前主线已经基本完成。
- compare / rewrite 的 LLM 协议层已经迁移为“规则说明 + JSON payload”，Markdown 现在主要保留给 docs / calibration 调试视图。
- image 右侧评估链路仍未纳入本轮范围。

## 当前真实样例覆盖

### 左侧分析

| 能力 | basic-user | basic-system | pro-variable | pro-multi |
| --- | --- | --- | --- | --- |
| `prompt-only` | 有 | 有 | 有 | 有 |
| `prompt-iterate + focus` | 有 | 暂无 | 暂无 | 暂无 |

### 右侧评估

| 能力 | basic-user | basic-system | pro-variable | pro-multi |
| --- | --- | --- | --- | --- |
| `result` | 有 | 有 | 有 | 有 |
| `result + focus` | 有 | 暂无 | 暂无 | 暂无 |
| `compare` | 有 | 有 | 有 | 有 |
| `compare + focus` | 有 | 有 | 有 | 暂无 |

## 一个重要提醒

如果你在 `history/` 里的旧文档中看到这些说法，不要直接当成当前事实：

- `original / optimized`
- `A/B only`
- `workspacePrompt + variants[]`
- `resolvedPrompt` 仍直接进入右侧评估请求
- compare 默认继续带 `## 当前工作区提示词`

这些都属于阶段性推导或旧实现记录。当前实现请以：

- [current-spec.md](./current-spec.md)
- [manual-acceptance.md](./manual-acceptance.md)
- [real-api-samples/](./real-api-samples/)

为准。
