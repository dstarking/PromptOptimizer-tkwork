# 进展日志

## 会话：2026-03-19

### 需求收口（已完成）

- 明确本次需求不是“再做一个独立的 prompt optimizer studio”。
- 明确要把 SPO 风格的“朝目标自动对齐”能力，嵌入现有测试区工作流。
- 明确 V1 优先做“一轮自动迭代”，而不是多轮 autonomous loop。
- 明确自动配置项收敛为：
  - `目标模型`
  - `参考模型`

### 方案收敛（已完成）

- 确认复用现有多槽位测试区，而不是新建页面。
- 确认自动生成 4 槽位预设：
  - `目标模型 / workspace`
  - `目标模型 / 上一版本`
  - `参考模型 / workspace`
  - `参考模型 / 上一版本`
- 确认优化对象始终是 `目标模型 / workspace`。
- 确认 `workspace` 代表当前工作区草稿，“上一版本”代表当前轮次之前的最近稳定版本。
- 确认 `v-last` 与“基线”都不够精确，文档改用“上一版本（previous version）”。
- 确认首期实现范围切换为 `basic-system`，聚焦系统提示词优化。
- 确认测试输入只用于暴露系统提示词行为，不得成为样例特化规则来源。

### 文档产出（已完成）

- 新增工作区设计目录：`docs/workspace/test-area-auto-iterate-one-round/`
- 新增架构文档：`docs/architecture/test-area-auto-iterate-one-round.md`
- 文档重点覆盖：
  - 交互入口
  - 4 槽位预设
  - 一轮执行编排
  - 目标锚点提取
  - 模型上下文构造
  - 防过拟合规则

### 当前状态

- 设计已收口，尚未开始代码实现。

## 会话：2026-03-19（结构化对比评估补充）

### 新增设计决策（已完成）

- 明确 compare evaluation 不应直接依赖 `SPO` 配置，而应依赖一组中性的结构化 compare 角色语义。
- 明确 compare evaluation 需要分为：
  - `Generic Compare`
  - `Structured Compare`
- 明确 `Structured Compare` 的角色模型为：
  - `target`
  - `baseline`
  - `reference`
  - `referenceBaseline`
  - `replica`
  - `auxiliary`
- 明确“根据整份评估结果自动重写 prompt”应作为通用能力服务于所有评估面板，而不是仅服务于自动优化。

### 文档产出（已完成）

- 新增架构补充：
  - `docs/architecture/structured-compare-and-evaluation-rewrite.md`

### 当前状态

- compare evaluation 的增强方向已收口为：
  - 结构化 compare
  - 评估结果驱动的通用智能重写
- 自动迭代的正式实现尚未按该设计落地。
- `SPO` 的后续职责被明确收敛为“上层编排”，不再承载 compare 与 rewrite 的底层智能。

## 会话：2026-03-19（薄 SPO UI 与停止规则补充）

### 新增设计决策（已完成）

- 明确 `SPO` 不增加专属 judge LLM 调用，继续复用 compare evaluation 的判断结果。
- 明确 `SPO` 的停止条件应优先依赖 compare evaluation 输出的通用 stop signals，而不是额外再做一层文本判断。
- 明确 `SPO` 主界面不新建页面，而是以：
  - 顶部 `SPO` 按钮
  - 测试区 `SPO` 运行卡 / 结果卡
  - 右侧 `SPO` 详情抽屉
  的方式嵌入现有测试区。
- 明确多轮过程中要区分：
  - `最后执行轮`
  - `最终采用轮`

### 文档产出（已完成）

- 新增架构补充：
  - `docs/architecture/spo-thin-loop-ui-and-stop-rules.md`

### 当前状态

- compare evaluation 的设计边界进一步清晰：
  - 负责 structured compare、stop signals、通用智能重写
- `SPO` 的设计边界进一步清晰：
  - 负责按钮、弹窗、循环、停止、结果展示

## 会话：2026-03-19（实施拆分补充）

### 新增设计决策（已完成）

- 明确 compare stop signals 第一阶段建议先落在 `EvaluationResponse.metadata`，避免大范围破坏现有消费方。
- 明确 structured compare config 与 `SPO` config 应分离：
  - 前者属于 compare 通用能力
  - 后者属于 `SPO` 薄编排层
- 明确 `SPO` 的运行中状态不应全部持久化到 session，应与可恢复配置拆开。
- 明确 `BasicSystemWorkspace.vue` 应只保留最小接线职责，复杂 UI 与循环逻辑应拆出。

### 文档产出（已完成）

- 新增实施拆分文档：
  - `docs/workspace/test-area-auto-iterate-one-round/implementation-split-compare-stop-signals-and-spo.md`

### 当前状态

- 下一步已经可以按模块推进实现：
  - compare types / payload / signals
  - evaluation panel 通用增强
  - session 状态扩展
  - `SPO` UI 壳层
  - `SPO` loop controller

## 会话：2026-03-19（文档整理与口径统一）

### 新增整理结论（已完成）

- 确认当前仓库里只有文档设计，先前偏离最新方案的 `SPO` 小 demo 已经回滚。
- 确认 compare evaluation 的“当前已实现行为”和“下一阶段目标设计”必须分开描述，避免把设计稿写成现状。
- 确认 `acceptedRound` 的依据应来自“复测后的 structured compare 结果”，而不是 `SPO` 自己额外发明 judge。
- 确认推荐落地顺序统一为：
  - compare types / signals
  - 评估面板通用增强 + rewrite from evaluation
  - structured compare config
  - `SPO` UI 壳层
  - `SPO` loop controller
- 确认 `teacher model` 术语在当前设计中统一收敛为 `reference model`；较早的一轮方案文档只保留必要的历史说明。

### 文档更新（已完成）

- 更新目录说明与当前状态：
  - `docs/workspace/test-area-auto-iterate-one-round/README.md`
  - `docs/workspace/test-area-auto-iterate-one-round/task_plan.md`
  - `docs/workspace/test-area-auto-iterate-one-round/progress.md`
- 更新 compare 当前规范与下一阶段设计边界：
  - `docs/workspace/compare-evaluation-analysis/current-spec.md`
  - `docs/architecture/structured-compare-and-evaluation-rewrite.md`
- 更新 `SPO` 停止规则与 accepted round 依据：
  - `docs/architecture/structured-compare-and-evaluation-rewrite.md`
  - `docs/architecture/spo-thin-loop-ui-and-stop-rules.md`

### 当前状态

- 文档口径已基本统一。
- compare evaluation 与薄 `SPO` 的边界更清晰。
- 代码实现仍待按更新后的设计重新推进。
