# 132-architecture-migration-and-session-persistence-plans - 架构迁移与 Session 持久化规划归档

## 概述
本归档收录一组阶段性的分析与规划文档，主题集中在：
- Workspace / Session 架构如何进一步统一到 `Store + Operations`
- Session 持久化问题的排查与修复思路

这些文档对理解当时的技术判断和问题背景仍有价值，但它们属于历史过程记录，不再适合作为 `docs/workspace` 下的活跃工作入口。

## 状态
✅ 已归档（历史规划与分析资料）

## 文档清单

- [x] **architecture-migration-guide.md**
  - 长期架构路线图
  - 目标是统一 Session Store 与 Workspace 到 `Store + Operations`
  - 明确 Phase 1 到 Phase 5 的渐进式迁移思路

- [x] **architecture-migration-analysis.md**
  - 对迁移指南的详细解读与现实可行性分析
  - 重点说明为什么这份路线图更适合作为长期方向，而不是立即执行的任务单

- [x] **PLAN-session-persistence-fix.md**
  - 一次 Session 持久化问题的排查与修复计划
  - 保留问题现象、错误尝试、调试路径和验收标准

## 为什么归档

- 这批文档主要描述的是“当时如何分析”和“原本打算怎么推进”，不是当前事实架构说明。
- 当前项目的活跃设计与实现入口已经转移到更具体的架构文档、测试文档和实际代码中。
- 继续放在 `docs/workspace` 会和正在推进的专题混在一起，增加识别成本。

## 使用建议

- 如果要了解当时为什么提出 `Store + Operations` 方向，可以先看 `architecture-migration-guide.md`。
- 如果要理解这份指南为什么没有被原样执行，可以再看 `architecture-migration-analysis.md`。
- 如果要追查某次 Session 持久化问题的上下文，可查看 `PLAN-session-persistence-fix.md`。

## 相关文档

- [129-session-store-single-source-refactor](../129-session-store-single-source-refactor/) - 已落地的 Session Store 单一真源重构
- [docs/architecture/test-area-version-model-selection.md](../../architecture/test-area-version-model-selection.md) - 当前仍然有效的正式架构文档示例

