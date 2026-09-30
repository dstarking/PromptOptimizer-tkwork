# 实施拆分：Compare Stop Signals 与薄 SPO

## 1. 目标

本文件把当前设计进一步下沉为可实施拆分，重点回答三个问题：

1. compare evaluation 需要补哪些结构化字段
2. `SPO` 运行态和持久化状态分别存什么
3. `BasicSystemWorkspace` 里具体要增加哪些 UI 组件和交互点

目标不是直接给出最终代码，而是为后续实现提供一份“按模块切分、可并行推进、边界清晰”的任务蓝图。

## 2. 总体拆分原则

### 2.1 compare evaluation 先增强，再做 SPO

推荐顺序：

1. compare evaluation 增加 structured compare 所需 hints
2. compare evaluation 增加 stop signals
3. 通用 `rewrite from evaluation` 能力落地
4. `SPO` 再作为薄编排层接入

原因：

- `SPO` 不应自己发明判断逻辑
- `SPO` 应尽量只消费 compare 的结构化结果
- `SPO` 越薄，未来越容易扩展到多模式、多入口

### 2.2 会话持久化与运行态分离

有些状态应该持久化到 session，有些则不应持久化。

建议原则：

- 持久化：
  - 用户配置
  - 角色配置
  - 最后一次结果摘要
- 不持久化：
  - 当前流式中间状态
  - 正在运行中的 abort controller
  - 每一步 token 流

### 2.3 UI 不堆逻辑

推荐：

- 把 loop orchestration 抽到 composable
- 把 modal / card / drawer 拆成独立组件
- `BasicSystemWorkspace.vue` 只做连接层

## 3. Compare Evaluation：类型层改动

当前基础类型在：

- `packages/core/src/services/evaluation/types.ts`

当前 `CompareAnalysisHints` 仍只有偏通用的布尔信息：

- `hasSharedTestCases`
- `hasSamePromptSnapshots`
- `hasCrossModelComparison`

要支持 structured compare 和 stop signals，建议分两步演进。

## 3.1 第一步：扩展 CompareAnalysisHints

建议增加结构化 compare 角色信息：

```ts
export type StructuredCompareRole =
  | 'target'
  | 'baseline'
  | 'reference'
  | 'referenceBaseline'
  | 'replica'
  | 'auxiliary'

export interface CompareAnalysisHints {
  hasSharedTestCases?: boolean
  hasSamePromptSnapshots?: boolean
  hasCrossModelComparison?: boolean

  mode?: 'generic' | 'structured'
  snapshotRoles?: Record<string, StructuredCompareRole>
}
```

这样做的好处：

- 不引入新的 request 类型
- 不破坏现有 compare 协议
- 允许 structured compare 作为 compare 的增强模式接入

## 3.2 第二步：扩展 EvaluationResponse.metadata

不建议先直接修改顶层 `EvaluationResponse` 的主字段结构。

建议先把 stop signals 放进 `metadata`，例如：

```ts
export interface CompareStopSignals {
  targetVsBaseline?: 'improved' | 'flat' | 'regressed'
  targetVsReferenceGap?: 'none' | 'minor' | 'major'
  improvementHeadroom?: 'none' | 'low' | 'medium' | 'high'
  overfitRisk?: 'low' | 'medium' | 'high'
  stopRecommendation?: 'continue' | 'stop' | 'review'
  stopReasons?: string[]
}

export interface EvaluationResponse {
  // 现有字段保持不变
  metadata?: {
    model?: string
    timestamp?: number
    duration?: number
    compareStopSignals?: CompareStopSignals
  }
}
```

这样是最稳妥的第一步：

- 现有使用 `summary / improvements / patchPlan / score` 的地方几乎不用动
- 新能力可以逐步接入
- `SPO` 和结果面板可以开始消费 stop signals

## 4. Compare Evaluation：构造层改动

当前 compare payload 构造在：

- `packages/ui/src/composables/prompt/compareEvaluation.ts`

建议拆成两层：

### 4.1 通用层

继续保留：

- `buildCompareEvaluationPayload`

职责：

- 规范化 testCases
- 规范化 snapshots
- 生成最基础的 compareHints

### 4.2 结构化增强层

建议新增：

- `packages/ui/src/composables/prompt/structuredCompareConfig.ts`
- `packages/ui/src/composables/prompt/buildStructuredCompareHints.ts`

职责：

- 维护 target / baseline / reference 等角色配置
- 将测试槽位映射为 `snapshotRoles`
- 产出 `CompareAnalysisHints.mode = 'structured'`

这样 `compareEvaluation.ts` 继续保持中性，而 structured compare 配置逻辑单独存在。

## 5. Compare Evaluation：结果消费层改动

当前 compare 结果的主要消费位置包括：

- `packages/ui/src/composables/prompt/useEvaluationHandler.ts`
- `packages/ui/src/components/evaluation/EvaluationPanel.vue`
- `packages/ui/src/components/basic-mode/BasicSystemWorkspace.vue`

建议改动如下。

## 5.1 useEvaluationHandler

建议扩展 compare 结果暴露能力：

- 增加 `compareStopSignals` 的 computed
- 增加是否适合智能重写的 computed
- 增加是否建议停止的 computed

好处：

- `BasicSystemWorkspace` 不必直接解析 `metadata`
- 未来其他页面也能统一消费

## 5.2 EvaluationPanel

建议新增两类能力：

1. `智能重写` 按钮
2. 结构化 stop signals 展示区

stop signals 展示不必太复杂，建议只显示：

- 当前是进步 / 持平 / 回归
- 与参考差距：大 / 小 / 无
- 改进空间：高 / 中 / 低 / 无
- 过拟合风险：低 / 中 / 高

这样既便于人理解，也能验证 stop signals 是否输出稳定。

## 6. SPO：状态拆分

## 6.1 应持久化到 session 的状态

建议在：

- `packages/ui/src/stores/session/useBasicSystemSession.ts`

增加以下持久化字段。

### A. `structuredCompareConfig`

用于 compare evaluation 的通用配置，而不是 SPO 私有配置。

```ts
interface StructuredCompareConfig {
  targetVariantId: TestVariantId | null
  snapshotRoles: Partial<Record<TestVariantId, StructuredCompareRole>>
  updatedAt: number
}
```

用途：

- compare 角色配置复用
- 多次 compare 不重复弹窗
- SPO 只是其中一个预填来源

### B. `spoConfig`

```ts
interface SpoConfig {
  targetModelKey: string
  referenceModelKey: string
  maxRounds: number
  stopMode: 'round-only' | 'smart' | 'custom'
  rewriteModelKey: string
  customStopConfig?: {
    minScoreDelta?: number
    plateauPatience?: number
    stopWhenGapSmall?: boolean
    stopWhenHeadroomLow?: boolean
    stopOnRegression?: boolean
  }
}
```

用途：

- 记住用户上一次的 `SPO` 配置
- 方便快速复跑

### C. `spoLastRunSummary`

```ts
interface SpoLastRunSummary {
  status: 'completed' | 'stopped' | 'failed'
  currentRound: number
  acceptedRound: number | null
  bestScore: number | null
  stopReason: string | null
  overview: string
  updatedAt: number
}
```

用途：

- 页面重开后仍能显示最近一次结果卡

## 6.2 不应持久化、只在运行时存在的状态

建议放在新的 composable 中，不进入 session：

- `isSpoRunning`
- `currentStage`
- `abortRequested`
- `roundRecords`
- `currentRoundCompareResult`
- `currentRoundRewriteDraft`
- `currentRoundRetestResult`

原因：

- 这些状态高度临时
- 一旦刷新页面，恢复运行中循环的价值很低
- 持久化会明显增加 session 复杂度

## 7. SPO：建议新增 composable

建议新增：

- `packages/ui/src/composables/prompt/useSpoLoopController.ts`

职责：

- 管理 `SPO` 配置
- 预设 4 槽位
- 应用 structured compare config
- 执行多轮 loop
- 决定 stop / accept / continue
- 产出 UI 所需的运行态摘要

建议它只接收依赖，不直接耦合模板/服务定位细节，例如：

```ts
useSpoLoopController({
  session,
  evaluationHandler,
  runVariantsBatch,
  buildRewriteInstruction,
  promptService,
  saveSession,
})
```

这样 `BasicSystemWorkspace.vue` 只负责把现有能力装配进去。

## 8. SPO：BasicSystemWorkspace 的 UI 拆分

当前 `BasicSystemWorkspace.vue` 已经非常大，不建议再继续内联 `SPO` UI。

推荐新增以下组件：

## 8.1 `SpoConfigModal.vue`

建议路径：

- `packages/ui/src/components/testing/SpoConfigModal.vue`

职责：

- 编辑 `spoConfig`
- 预览 4 槽位预设
- 预览 structured compare 角色
- 启动 `SPO`

## 8.2 `SpoRunCard.vue`

建议路径：

- `packages/ui/src/components/testing/SpoRunCard.vue`

职责：

- 显示运行中进度
- 显示当前阶段
- 显示当前轮次
- 显示当前风险提示
- 提供 `查看详情 / 立即停止`

## 8.3 `SpoResultCard.vue`

建议路径：

- `packages/ui/src/components/testing/SpoResultCard.vue`

职责：

- 显示最终状态
- 显示最终采用轮次
- 显示停止原因
- 提供 `查看详情 / 保存版本 / 继续 1 轮 / 重新运行`

## 8.4 `SpoRunDrawer.vue`

建议路径：

- `packages/ui/src/components/testing/SpoRunDrawer.vue`

职责：

- 显示运行概览
- 显示每轮历史
- 显示选中轮次详情

## 8.5 `VariantRoleBadge.vue`

建议路径：

- `packages/ui/src/components/testing/VariantRoleBadge.vue`

职责：

- 在测试槽位头部展示：
  - `Target`
  - `Baseline`
  - `Reference`
  - `Reference Baseline`

这也能服务于非 SPO 的 structured compare 场景。

## 9. BasicSystemWorkspace：最小接入点

在 `packages/ui/src/components/basic-mode/BasicSystemWorkspace.vue` 中，建议只增加以下接入点：

### 9.1 顶部按钮区

- 新增 `SPO` 按钮
- 点击打开 `SpoConfigModal`

### 9.2 compare 卡片下方

根据状态显示：

- 运行中：`SpoRunCard`
- 结束后：`SpoResultCard`

### 9.3 测试槽位头部

- 为每个 variant 增加 `VariantRoleBadge`

### 9.4 页面底部/根节点

- 挂载 `SpoRunDrawer`

这样 `BasicSystemWorkspace` 不直接承担复杂循环逻辑，只承担“把已有能力装配到 UI”。

## 10. 推荐文件改动清单

## 10.1 compare evaluation 通用增强

- `packages/core/src/services/evaluation/types.ts`
  - 增加 `StructuredCompareRole`
  - 增加 `CompareStopSignals`
  - 扩展 `CompareAnalysisHints`
  - 在 `EvaluationResponse.metadata` 中增加 `compareStopSignals`

- `packages/ui/src/composables/prompt/compareEvaluation.ts`
  - 支持 structured compare hints 的组装

- `packages/ui/src/composables/prompt/useEvaluationHandler.ts`
  - 对外暴露 `compareStopSignals`

- `packages/ui/src/components/evaluation/EvaluationPanel.vue`
  - 增加 stop signals 展示
  - 增加 `智能重写` 按钮

## 10.2 structured compare 配置层

- `packages/ui/src/composables/prompt/structuredCompareConfig.ts`
  - 配置类型
  - 角色推断
  - 角色校验

- `packages/ui/src/composables/prompt/buildStructuredCompareHints.ts`
  - 将 UI 角色配置映射为 compare hints

## 10.3 SPO 编排层

- `packages/ui/src/composables/prompt/useSpoLoopController.ts`
  - 多轮编排
  - 停止策略
  - 最佳轮接受策略

## 10.4 session 层

- `packages/ui/src/stores/session/useBasicSystemSession.ts`
  - 持久化 structured compare config
  - 持久化 spo config
  - 持久化 spo last run summary

## 10.5 UI 组件层

- `packages/ui/src/components/testing/SpoConfigModal.vue`
- `packages/ui/src/components/testing/SpoRunCard.vue`
- `packages/ui/src/components/testing/SpoResultCard.vue`
- `packages/ui/src/components/testing/SpoRunDrawer.vue`
- `packages/ui/src/components/testing/VariantRoleBadge.vue`

## 11. 推荐实施阶段

### Phase A：compare signals

先做：

- `types.ts`
- `compareEvaluation.ts`
- `useEvaluationHandler.ts`

目标：

- structured compare hints 可以传下去
- stop signals 可以稳定被 UI 消费

### Phase B：评估面板通用增强

再做：

- `EvaluationPanel.vue`
- 通用 `rewrite from evaluation`

目标：

- 先让 compare 自己变得“更可用、更可验证”

### Phase C：session 与 structured compare 配置

再做：

- `useBasicSystemSession.ts`
- `structuredCompareConfig.ts`

目标：

- compare 角色和 `SPO` 配置有可复用的状态承载

### Phase D：SPO UI 壳层

再做：

- `SpoConfigModal.vue`
- `SpoRunCard.vue`
- `SpoResultCard.vue`
- `SpoRunDrawer.vue`
- `VariantRoleBadge.vue`

目标：

- UI 先落壳，不急着一次性做完完整 loop

### Phase E：SPO loop controller

最后做：

- `useSpoLoopController.ts`
- `BasicSystemWorkspace.vue` 接线

目标：

- 多轮 loop 真正跑通

## 12. 风险与注意点

### 12.1 不要让 session 过重

建议不要把完整每轮详细 compare 结果都持久化进 session。

优先持久化：

- 配置
- 结果摘要
- 最终采用轮次

### 12.2 不要让 EvaluationResponse 直接大改

建议 stop signals 先进入 `metadata`，避免波及所有消费方。

### 12.3 不要在 BasicSystemWorkspace 再塞更多内联状态

当前文件已经足够大，后续新增逻辑应尽量拆到 composable 和独立组件中。

## 13. 结论

如果按最小风险实施，最合理的技术路径是：

1. 先增强 compare evaluation 的 machine-readable outputs
2. 再落通用 rewrite from evaluation
3. 再引入 structured compare config
4. 最后做薄 `SPO` 的 loop 与 UI 壳

这样能最大化复用现有能力，同时把复杂度控制在最小范围内。
