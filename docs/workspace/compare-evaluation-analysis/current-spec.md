# 当前规范：分析 / 评估 / 对比评估

> 这是当前目录唯一推荐的总览文档。
> 如果它与 `history/` 里的旧文档冲突，应优先以本文和 `real-api-samples/` 为准。
> 本文已按当前代码实现同步到 `2026-03-20`。

## 1. 一句话先讲清

- 左侧没有输出的是分析。
- 右侧单个输出的是评估。
- 右侧多个输出一起比的是对比评估。
- 左侧只看设计态，右侧只看执行态。

## 2. 当前任务边界

本轮真正完成的是文本工作区下的语义重构，不是所有模式的终局重写。

当前范围：

- `basic-user`
- `basic-system`
- `pro-variable`
- `pro-multi`

当前不在主线范围内：

- image 右侧 `result / compare`

## 3. 三类能力的当前语义

### 3.1 分析

分析作用在左侧工作区，是“提示词设计质量分析”。

它的特点：

- 没有执行结果输入。
- 不讨论输出质量。
- 允许产出 `patchPlan`，因为编辑目标就是左侧当前工作区。

### 3.2 单结果评估

评估作用在右侧某一列，是“基于一次执行快照的结果评估”。

它的特点：

- 只看这一次测试输入、这一次执行提示词、这一次输出。
- 不再额外注入当前工作区全文作为独立证据。
- 当前只保留方向性 `improvements`，不要求 `patchPlan`。

### 3.3 对比评估

对比评估作用在右侧顶部，是“基于多个执行快照的对比评估”。

它的特点：

- 只看公共测试输入和多个执行快照。
- 不再默认把问题理解成“原始 vs 优化后”。
- 不再默认额外注入当前工作区全文。
- 普通 compare 和跨模型 compare 都要求先解释“已观察到的关键差异”，不能先发散到泛建议。

补充说明：

- 当前代码里，compare 已经区分出两种运行模式：
  - `generic`
  - `structured`
- 当前 `structured` 的触发条件是：
  - compare payload 可构建
  - 且前端能推断出一组“可执行 judge plan”的角色
  - 至少要有 `target`，并至少存在 `baseline / reference / replica` 之一
- 当前 `structured` 已落地能力：
  - `CompareAnalysisHints.mode`
  - `CompareAnalysisHints.snapshotRoles`
  - `target / baseline / reference / referenceBaseline / replica / auxiliary` 角色语义
  - 并发 `pairwise judge`
  - 独立 `synthesis`
  - compare 角色配置弹窗
  - 自动角色推断结果展示
  - 自动角色推断支持“多候选收敛”：
    - 在确定 `target` 后，自动只保留一个 `baseline`
    - 自动只保留一个 `reference`
    - 自动只保留一个 `referenceBaseline`
    - 其余候选统一降级为 `auxiliary`
  - 手动角色修正与 session 持久化
  - 手工指定 `target` 后自动补全其余角色
  - 当存在多个 `workspace` 槽位时，不再自动猜 `target`
  - 必须由用户显式确认 `target` 后，才允许进入 structured compare
  - 当槽位语义签名变化时，旧的手工角色会自动失效并回退到自动推断
  - 当前槽位语义签名已覆盖：
    - `promptRef kind/version`
    - `modelKey`
    - `non-workspace` 槽位的 prompt 文本签名
  - `workspace` 槽位的 prompt 文本变化不会直接清空手工角色
  - 但如果用户曾确认过该角色，后续 compare 会把它标记为“待复核”，并要求用户在弹窗中重新确认后才能继续执行
  - compare 配置弹窗中的手动 / 自动 / 已失效来源可视化
  - compare 配置弹窗中的 structured / generic 模式预览与可执行 pair 预览
  - 会导致 structured compare 歧义的单例角色冲突拦截
  - 测试区顶部与槽位头部会显示 compare 角色复核提示
  - compare 结果中的 `metadata.compareMode`
  - compare 结果中的 `metadata.snapshotRoles`
  - compare 结果中的 `metadata.compareJudgements`
  - compare 结果中的 `metadata.compareStopSignals`
  - compare 结果中的 `metadata.compareInsights`
  - compare insights 中按 pairType 聚合的焦点结论：
    - `progressSummary`
    - `referenceGapSummary`
    - `promptChangeSummary`
    - `stabilitySummary`
  - compare insights 中新增 machine-readable `conflictSignals`
  - 结果面板中的 compare 决策摘要：
    - 基于 `compareStopSignals + compareInsights` 生成更可执行的“下一步建议”
  - 结果面板中的元信息、`pairwise judgement`、`compare insights` 与 `conflict checks` 展示
  - 结果面板中的“智能重写”按钮
  - 复用 iterate 链路的增强通用重写能力
  - 重写输入会对评估结果做去重、分层与 compare 焦点压缩
  - 重写输入已显式纳入 `conflictSignals`
  - 重写输入已新增 machine-readable `rewriteGuidance`
  - 当前已落地第一版 rewrite gating：
    - `flat + no-gap` 场景默认倾向 `skip`
    - `improved + no-gap + low-headroom` 场景默认倾向 `minor-rewrite`
    - 仍存在明显回退 / 不稳定 / 不被支持改动时，继续走 `rewrite`
- 当前仍未落地的，主要是上层复用能力：
  - 更独立的通用智能重写协议 / 模板

## 4. 当前输入边界

### 4.1 左侧分析

统一原则：

- 只看当前工作区目标。
- 不引用右侧测试文本。
- 不引用右侧测试输出。
- 不默认引用右侧变量实例值。

模式差异：

- `basic-user`
  只看当前工作区用户提示词。
- `basic-system`
  只看当前工作区系统提示词。
- `pro-variable`
  只保留变量结构，不带变量值。
- `pro-multi`
  只保留最小会话位置上下文，不带完整 transcript。

### 4.2 右侧单结果评估

统一结构：

- 公共测试输入
- 当前快照的执行提示词
- 当前快照的输出
- 必要的模型 / 版本元信息
- 编辑目标语义只认当前工作区，不回退到原始提示词

模式差异：

- `basic-user`
  可能没有额外测试文本，此时公共输入会明确写“无额外测试输入”。
- `basic-system`
  公共输入通常是右侧测试文本。
- `pro-variable`
  公共输入里带一次变量值；快照里只保留当前列执行提示词和输出。
- `pro-multi`
  公共输入里带一次 `Conversation Snapshot`；快照里只保留当前列执行提示词和输出。

### 4.3 右侧对比评估

统一结构：

- 公共测试输入只出现一次
- 每个快照只保留：
  - 执行提示词
  - 输出
  - 推理（如果有）
  - 模型 / 版本信息

当前已实现行为：

- compare 仍然要求存在当前工作区 prompt 作为可编辑 target
- 如果角色推断后无法形成可执行 judge plan，则回退到 `generic compare`
- 如果能推断出可执行 judge plan，则进入 `structured compare`
- compare 请求侧的 `compareHints` 是当前角色语义与模式的事实来源
- 当前自动角色策略是：
  - 若只有一个 `workspace` 槽位，可自动把它视作 `target`
  - 若有多个 `workspace` 槽位，必须显式选择 `target`
  - 在 `target` 确定后，系统会自动收敛出单一 `baseline / reference / referenceBaseline`
  - 其余未进入核心 judge 的槽位会降级为 `auxiliary`
- `structured compare` 当前内部执行流程是：
  - 生成 judge plan
  - 并发执行多次 pairwise judge
  - 基于 judge 结果做 synthesis
- compare 返回后会透传并展示：
  - `compareMode`
  - `snapshotRoles`
  - `compareJudgements`
  - `compareStopSignals`
  - `compareInsights`
  - 其中 `compareInsights` 已不仅是平铺列表，还包含面向业务消费的聚合焦点结论与 `conflictSignals`

计划中的下一阶段演进：

- 更细粒度的角色推断与歧义消解策略
- 当前已覆盖“多 workspace 必须显式 target”与“多候选自动收敛到单 baseline/reference/referenceBaseline”
- 目前已覆盖 `promptRef kind/version + modelKey`，以及 `non-workspace` 槽位的 prompt 文本变化触发的手工角色失效
- 基于整份 compare 结果的更强通用智能重写

当前不应再默认出现：

- `## 当前工作区提示词`
- 每个 variant 重复的渲染输入快照
- `resolvedPrompt`
- `targetMessage + conversationMessages` 原始 JSON

## 5. 4 个文本模式的差异

### 5.1 basic-user

- 左侧分析：只分析当前用户提示词。
- 右侧评估：无额外测试输入时，也按真实执行快照评估。
- 对比评估：更关注任务类型、格式约束、禁止项是否真的影响输出。

### 5.2 basic-system

- 左侧分析：只分析当前 system prompt。
- 右侧评估：公共输入通常来自右侧测试文本。
- 对比评估：更关注角色、任务步骤、输出格式、语气要求是否真的造成差异。
- 如果旧评估已经存在但右侧测试文本被清空，结果应保留可查看，但不允许重新评估。

### 5.3 pro-variable

- 左侧分析：只看变量结构，不看变量值。
- 右侧评估：变量值属于执行态公共输入，只出现一次。
- 对比评估：重点不是“变量渲染内容重复展示”，而是不同执行提示词 / 输出差异。

### 5.4 pro-multi

- 左侧分析：看最小会话位置上下文。
- 右侧评估：公共输入是一次性的会话快照。
- 对比评估：多个快照共享一次会话输入，每个快照只保留自己的执行证据。

## 6. 当前模板规则

### 6.1 分析模板

- 评分维度是设计导向，不评价输出质量。
- `focus` 出现时，summary / improvements / patchPlan 必须直接回应 focus。

### 6.2 单结果评估模板

- 评分维度是执行导向。
- 如果已经出现明确违例或输出边界滑移，summary 必须点名，第一条 improvement 必须先处理它。
- 不允许“内容质量不错”掩盖明显违例。

### 6.3 对比评估模板

- `generic compare`：
  - 必须先点名已观察到的关键差异。
  - 第一条 improvement 必须先处理这条差异。
- “同提示词跨模型” compare：
  - 必须先解释同提示词跨模型差异暴露的误解点。
  - 第一条 improvement 必须先处理这条误解点。
- `structured compare`：
  - 先执行多次 pairwise judge，每条 judge 只看一组 pair 的测试输入与两个快照
  - judge 产物会沉淀到 `metadata.compareJudgements`
  - synthesis 阶段只消费角色绑定和 judge 结果，不重新展开全部原始快照
  - synthesis prompt 会注入 pair 专项指导与确定性 hints，显式提醒优先级、gap、stability、overfit 等信号
  - 最终仍输出统一 compare 协议，并在证据足够时输出 `compareStopSignals`
  - 若 synthesis 缺失 stop signals，或给出比 pairwise judge 更乐观的 stop 判断，core 会以 pairwise 派生信号做保守合并

补充说明：

- 当前已不是“只有单一 compare 模板收紧”的阶段。
- 当前已经落地的是“pairwise judge + synthesis + machine-readable metadata”的 structured compare。
- `compareStopSignals` 已不是单纯信任 synthesis 文本，而是有 pairwise 证据兜底与保守收敛逻辑。
- 当前还没有落地的是“更强通用智能重写协议与更细粒度角色失效策略”。

## 7. 当前已完成项

- 文本模式的左侧分析 / 右侧 `result` / 右侧 `compare` 主线已打通。
- 测试区版本来源已统一到 `workspace / v0 / vN`。
- `latest` 只作为旧 session 迁移值，不再是面向用户的主语义。
- 真实样例已经收敛成最新标准集合，不再保留大量过渡态样例。
- 普通 compare 与跨模型 compare 的模板都已经收紧。
- 右侧评估入口已改为 strict workspace-only，不再回退到原始提示词。
- 已有评估结果在输入失效后保留为可查看态，但重跑入口会被禁用。
- compare request / response 已支持：
  - `compareMode`
  - `snapshotRoles`
  - `compareJudgements`
  - `compareStopSignals`
  - `compareInsights`
- compare insights 当前已可直接提供：
  - `pairHighlights`
  - `evidenceHighlights`
  - `learnableSignals`
  - `overfitWarnings`
  - `progressSummary / referenceGapSummary / promptChangeSummary / stabilitySummary`
  - `conflictSignals`
- 文本模式下已落地 structured compare 自动推断：
  - `basic-user`
  - `basic-system`
  - `pro-variable`
  - `pro-multi`
- compare 角色配置已进入稳定可用版本：
  - 测试区可打开配置弹窗
  - 支持查看自动推断角色
  - 支持手动指定角色并持久化到 session
  - 当存在多个 `workspace` 槽位时，必须显式指定 `target`
  - 当用户只手工指定 `target` 时，可自动补全其余角色
  - 自动推断会把多余候选收敛为单一 `baseline / reference / referenceBaseline`，其余降级为 `auxiliary`
  - 支持展示当前角色来源：手动 / 自动 / 已失效旧配置
  - `workspace` 手工角色在 prompt 变更后会进入“待复核”状态，而不是被静默清空
  - compare 真正执行前如果存在待复核角色，会强制重新确认
  - 支持预览当前会进入 `structured` 还是 `generic`
  - 支持预览当前可执行的核心 pairwise judge
  - 会拦截多个 `target / baseline / reference / referenceBaseline` 这类会导致 structured compare 歧义的配置
- 结果面板已可展示 compare 元信息、pairwise judgements、compare insights、conflict checks 与 stop signals。
- 结果面板已支持把 `compareStopSignals + compareInsights` 压成面向动作的 compare 决策摘要。
- 结果面板已支持基于整份评估结果的一键“智能重写”，并直接复用 iterate 版本链路。
- 智能重写当前会显式消费 `compareStopSignals + compareInsights + conflictSignals`。
- compare 结果元数据在 UI 侧已统一抽成共享消费模块，避免 `useEvaluation / EvaluationPanel / rewrite` 多处漂移。
- rewrite payload 当前已包含 `rewriteGuidance.recommendation`，用于约束 `skip / minor-rewrite / rewrite` 三类行为。
- rewrite payload 当前还会附带 `rewriteGuidance.focusAreas / priorityMoves`，用于把 `instability / contract-repair / generalization` 转成更可执行的专项改写指令。
- UI 侧当前已识别 `rewriteGuidance.recommendation = skip`，会在“智能重写”入口直接短路，不再无意义发起 iterate 请求。

## 8. 当前剩余问题

### 8.1 image 右侧评估链路未纳入本轮

当前没有把 image 的 `result / compare` 纳入主线。

### 8.2 历史文档仍保留旧阶段推导

这不是代码问题，而是资料管理问题。当前已经通过 `history/` 隔离，但历史文档本身内容没有全部重写。

### 8.3 compare 主线已闭环，剩余属于增强项

当前 compare 阶段的主线语义、角色配置、pairwise judge、结果消费与“基于评估重写”入口都已经打通。

后续如果继续演进，主要属于增强项而不是 compare 阶段未完成：

- 更稳定的多候选角色判定策略
- 基于整份评估结果的更强通用智能重写

## 9. 当前推荐阅读顺序

1. 本文
2. [manual-acceptance.md](./manual-acceptance.md)
3. [real-api-samples/review-summary.md](./real-api-samples/review-summary.md)
4. `real-api-samples/*/rendered-messages.md`
5. `history/` 里的旧文档，仅在需要追溯时阅读
