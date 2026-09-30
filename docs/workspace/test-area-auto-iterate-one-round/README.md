# 工作区：测试区自动迭代一轮

> 本目录记录“复用现有多槽位测试区，为目标模型引入一轮自动提示词迭代”的设计与过程。
> 本期不新建独立的 SPO/实验页面，而是在现有测试区内增加自动迭代入口与四槽位预设。
>
> 说明：目录名保留了最初的“一轮自动迭代”提法，但目录内容已经扩展为三部分：
> 1. 一轮自动迭代的早期方案
> 2. compare evaluation 的通用增强
> 3. 薄 `SPO` 的上层封装设计

## 快速入口

- 任务计划：`./task_plan.md`
- 发现与决策：`./findings.md`
- 进展日志：`./progress.md`
- 结构化对比评估与通用智能重写：`docs/architecture/structured-compare-and-evaluation-rewrite.md`
- 薄 SPO：UI、交互与停止规则：`docs/architecture/spo-thin-loop-ui-and-stop-rules.md`
- 实施拆分：Compare Stop Signals 与薄 SPO：`./implementation-split-compare-stop-signals-and-spo.md`

## 相关文档

- 架构设计：`docs/architecture/test-area-auto-iterate-one-round.md`
- 架构补充：`docs/architecture/structured-compare-and-evaluation-rewrite.md`
- SPO 架构补充：`docs/architecture/spo-thin-loop-ui-and-stop-rules.md`
- 对比评估现状：`docs/workspace/compare-evaluation-analysis/current-spec.md`
- 现有测试区版本/模型选择设计：`docs/architecture/test-area-version-model-selection.md`

## 当前范围

- `basic-system` 优先
- 自动迭代仅做一轮
- 仅改写 `workspace` 提示词，不自动保存历史版本
- 通过 `目标模型 + 参考模型` 自动生成 4 槽位测试预设
- 四槽位中的历史参考统一称为“上一版本（previous version）”，不再使用 `v-last`
- 下一阶段的 `SPO` 设计以“薄编排层”为目标，重点是多轮循环、停止条件和结果展示，而不是新增 judge 能力
- compare evaluation 的增强方向是：
  - `Generic Compare`
  - `Structured Compare`
  - 通用 `rewrite from evaluation`
  - 通用 machine-readable `stop signals`

## 当前实现状态

- 当前仓库中，这一主题仍处于“文档设计完成、代码待按新方案重新落地”的状态。
- 此前曾尝试过一版自动迭代 demo，但因为与最新的“compare 通用增强 + 薄 SPO”边界不一致，已经回滚。
- 因此，本目录中的“已完成”主要指设计收口，不代表当前主干代码里已经存在可用实现。
- 当前正式设计稿统一放在 `docs/architecture/`，本目录只保留任务计划、过程记录和拆分说明，避免同主题双份文档继续漂移。

## 阅读建议

- 如果你要看“当前已实现行为”，优先阅读：
  - `docs/workspace/compare-evaluation-analysis/current-spec.md`
- 如果你要看“下一阶段 compare 应如何升级”，优先阅读：
  - `docs/architecture/structured-compare-and-evaluation-rewrite.md`
- 如果你要看“下一阶段 SPO 应如何保持很薄”，优先阅读：
  - `docs/architecture/spo-thin-loop-ui-and-stop-rules.md`
- 如果你要看“推荐落地顺序”，优先阅读：
  - `./implementation-split-compare-stop-signals-and-spo.md`

## 归档规则

- 任务完成后，将本目录归档到：`docs/archives/<id>-test-area-auto-iterate-one-round/`
