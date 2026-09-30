# Real API Samples 审查摘要

> 本文档用于说明 `real-api-samples/` 当前保留样例的定位、保留理由与参考级别。
> 目标不是重复逐条贴出请求内容，而是帮助后续快速判断：哪些是正式标准样例，哪些只是覆盖校验样例。

## 最终保留策略

- 只保留与当前代码、当前模板、当前语义一致的最终样例。
- 不再保留历史过渡态、`current` 命名样例、冗长旧版样例、仅用于中间调试的样例。
- 左侧分析样例优先体现“输入最小化”，避免在同一请求里重复长提示词。
- 右侧评估样例优先覆盖 `result` / `compare` / `focus` 等真实功能分支。
- “标准参考”表示可直接作为后续审查模板结构的基准样例。
- “覆盖校验”表示主要用于证明某个条件分支已真实跑通，不一定是最精简、最具代表性的标准模板。

## 左侧分析标准样例

以下 5 个样例可视为当前左侧分析的正式参考集合。

| 样例 | 模式 / 功能 | 语义定位 | 保留理由 | 级别 |
| --- | --- | --- | --- | --- |
| `basic-user-prompt-only` | `basic-user` / `prompt-only` | 基础用户提示词分析 | basic/user 左侧分析的最直接标准样例，体现“只分析工作区提示词本身” | 标准参考 |
| `basic-system-prompt-only-minimal` | `basic-system` / `prompt-only` | 基础系统提示词分析 | basic/system 左侧分析最小输入版本，适合检查 system prompt 分析结构 | 标准参考 |
| `pro-variable-prompt-only-minimal` | `pro-variable` / `prompt-only` | 变量模式提示词分析 | 体现变量模式下左侧分析如何只保留必要上下文，不引入右侧测试证据 | 标准参考 |
| `pro-multi-prompt-only-system-selected` | `pro-multi` / `prompt-only` | 多消息模式下选中 system 消息做分析 | 体现会话上下文存在时，如何明确“工作区要优化的目标”与上下文位置关系 | 标准参考 |
| `pro-multi-prompt-only-user-selected` | `pro-multi` / `prompt-only` | 多消息模式下选中 user 消息做分析 | 与上一条互补，覆盖 pro/multi 中选中 user 消息时的结构差异 | 标准参考 |

## 左侧分析覆盖样例

以下样例不是新的标准模板，而是用于证明分析侧的额外分支已真实生效。

| 样例 | 模式 / 功能 | 语义定位 | 保留理由 | 级别 |
| --- | --- | --- | --- | --- |
| `basic-user-prompt-iterate-focus` | `basic-user` / `prompt-iterate + focus` | 左侧迭代分析且带聚焦问题 | 证明 iterate 与 focus 组合分支已跑通，且 focus 会进入真实请求 | 覆盖校验 |

## 右侧单结果评估样例

以下样例用于覆盖单个执行结果的执行评估路径。

| 样例 | 模式 / 功能 | 语义定位 | 保留理由 | 级别 |
| --- | --- | --- | --- | --- |
| `basic-user-result` | `basic-user` / `result` | 基础用户提示词的单结果评估 | basic/user 右侧单结果评估基线样例 | 标准参考 |
| `basic-user-result-focus` | `basic-user` / `result + focus` | 基础用户提示词的聚焦单结果评估 | 用于校验 focus 对单结果评估有实际影响 | 覆盖校验 |
| `basic-system-result` | `basic-system` / `result` | 基础系统提示词的单结果评估 | basic/system 单结果评估覆盖 | 标准参考 |
| `pro-variable-result` | `pro-variable` / `result` | 变量模式单结果评估 | 用于校验变量模式结果评估结构 | 标准参考 |
| `pro-multi-result` | `pro-multi` / `result` | 多消息模式单结果评估 | 用于校验多消息上下文下的结果评估结构 | 标准参考 |

## 右侧对比评估样例

以下样例用于覆盖多执行快照的 compare 评估路径。

| 样例 | 模式 / 功能 | 语义定位 | 保留理由 | 级别 |
| --- | --- | --- | --- | --- |
| `basic-user-compare` | `basic-user` / `compare` | 基础用户提示词的对比评估 | basic/user compare 基线样例 | 标准参考 |
| `basic-system-compare` | `basic-system` / `compare` | 基础系统提示词的对比评估 | basic/system compare 基线样例 | 标准参考 |
| `pro-variable-compare` | `pro-variable` / `compare` | 变量模式对比评估 | 用于校验变量模式 compare 结构 | 标准参考 |
| `pro-multi-compare` | `pro-multi` / `compare` | 多消息模式对比评估 | 用于校验多消息模式 compare 结构 | 标准参考 |

补充说明：

- 当前 `compare` 模板已同时覆盖两类约束：
  - 跨模型 compare：必须先解释“同提示词跨模型差异”暴露的误解点，不能先给泛建议。
  - 普通 compare：必须先点名“已观察到的关键差异”（如角色、任务步骤、格式、禁止项），第一条建议也必须先处理这条差异。
- 2026-03-17 复核后，`basic-system-compare`、`basic-system-compare-focus`、`basic-user-compare`、`basic-user-compare-focus` 已按上述约束重新生成并通过人工复查，可继续作为当前标准样例使用。

## 右侧聚焦评估覆盖样例

以下样例主要用于确认 `focus` 不只是字段存在，而是真的进入评估任务目标。

| 样例 | 模式 / 功能 | 语义定位 | 保留理由 | 级别 |
| --- | --- | --- | --- | --- |
| `basic-user-compare-focus` | `basic-user` / `compare + focus` | 基础用户提示词对比评估聚焦样例 | 用于校验 basic/user compare 中 focus 的实际约束效果 | 覆盖校验 |
| `basic-system-compare-focus` | `basic-system` / `compare + focus` | 系统提示词对比评估聚焦样例 | 用于校验 system compare 中 focus 的实际约束效果 | 覆盖校验 |
| `pro-variable-compare-focus` | `pro-variable` / `compare + focus` | 变量模式对比评估聚焦样例 | 用于校验变量模式 compare 中 focus 的实际约束效果 | 覆盖校验 |

## 当前样例集合如何使用

- 如果要看左侧分析的正式结构，优先看 5 个“左侧分析标准样例”。
- 如果要看右侧单结果评估，优先看 `basic-user-result`，再按模式查看 `basic-system` / `pro-variable` / `pro-multi`。
- 如果要看右侧对比评估，优先看 `basic-user-compare` 与 `pro-variable-compare`。
- 如果要判断 focus 是否真的进入任务目标，优先看各类 `*-focus` 样例的 `request.md`、`rendered-messages.md` 与 `response.md` 是否一致围绕聚焦问题。
- 如果要继续压缩请求体积，应把这份样例集视为当前基线，后续任何模板改动都应重新生成并复核这些样例。

## 已明确移除的内容

- 历史冗长版 `prompt-only` 样例。
- 旧的 `current` 命名样例。
- 左侧分析中重复出现原始提示词 / 参考提示词的旧结构样例。
- 与当前模板不一致、仅用于早期推导的中间态样例。
