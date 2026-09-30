# 131-testing-redesign - 测试方案重新设计

## 概述

本目录归档了“测试方案重新设计”这一轮工作的过程文档。

这一轮工作的核心目标是：

- 把 UI 控制台错误、未捕获异常纳入自动化门禁
- 为 LLM 相关测试建立 VCR 录制 / 回放基础设施
- 将测试体系收敛成可在本地与 CI 稳定执行的 fast gate / full gate

## 状态

已完成并归档。

当前面向日常使用的正式入口请优先参考：

- `docs/testing/README.md`
- `docs/testing/vcr-usage-guide.md`

本目录主要保留：

- 设计目标与架构拆分
- 技术选型依据
- 分阶段实施过程与验证记录

## 归档内容

- `architecture.md`
  测试分层、UI 错误门禁、VCR、fast/full gate 的总体设计说明。
- `findings.md`
  Vitest / Playwright / MSW / VCR 等方案的调研与取舍依据。
- `progress.md`
  Phase 1 到 Phase 5 的推进记录、验证结果与当时的执行证据。
- `task_plan.md`
  任务拆分与阶段计划原稿。
- `phase4-补充计划.md`
  当时未完成测试用例的补充计划，保留作为历史上下文。

## 关键结论

- “测试是否通过”的标准不应只看覆盖率，还应包括 UI 错误门禁。
- LLM 相关测试必须支持 replay，避免 CI 依赖真实 API 和偶发网络状态。
- 测试体系最终应同时服务于：
  - pre-commit 的快速门禁
  - CI 的完整回归
  - 本地按需录制真实 fixtures

## 使用建议

- 如果你想知道“现在怎么跑测试”，看 `docs/testing/`。
- 如果你想知道“为什么测试体系是这样设计的”，看本归档目录。
