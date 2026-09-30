# 130-test-area-version-model-selection - 测试区版本/模型选择

## 概述

本目录归档了“测试区版本/模型选择”这一轮改造的过程文档。

本期实现重点是：

- 先在 `basic-user` 中落地
- 将旧 `latest` 语义收口为 `workspace / v0 / vN`
- 支持按测试结果面板分别选择版本和模型
- 让 compare 测试与后续对比评估建立更稳定的输入边界

## 状态

已完成并归档。

当前正式设计与当前行为说明请优先参考：

- `docs/architecture/test-area-version-model-selection.md`
- `docs/workspace/compare-evaluation-analysis/current-spec.md`

## 归档内容

- `task_plan.md`
  任务拆分、阶段目标与验收范围。
- `findings.md`
  需求摘要、代码结构发现与关键技术决策。
- `progress.md`
  分阶段推进记录与验证结果。

## 关键结论

- `workspace` 表示当前工作区内容，不再表示“历史链最新版本”。
- `v0` 表示原始提示词；`v1..vn` 表示历史链版本。
- 面板级版本/模型选择应持久化在 session 中，而不是临时 UI 状态。
- 当前主题的“过程记录”已经下沉归档，后续如需继续演进，应直接更新正式架构文档，而不是在 `docs/workspace/` 中继续堆叠同主题过程稿。
