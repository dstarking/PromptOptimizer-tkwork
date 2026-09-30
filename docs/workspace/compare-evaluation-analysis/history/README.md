# history

> 这里存放的是本任务在推进过程中的阶段性资料。
> 它们保留是为了追溯，不再作为当前实现的直接依据。

## 当前用途

- 回看为什么当时会这样设计
- 追溯某个阶段的判断、分歧和修正过程
- 查找早期推导过但后来被收敛掉的方案

## 不适合直接拿来判断当前事实的内容

这些文档里可能仍出现：

- `original / optimized`
- `A/B only`
- `workspacePrompt + variants[]`
- `resolvedPrompt`
- compare 默认继续带 `## 当前工作区提示词`

如果你要判断“现在代码到底怎么发请求”，请回到：

- [../current-spec.md](../current-spec.md)
- [../manual-acceptance.md](../manual-acceptance.md)
- [../real-api-samples/](../real-api-samples/)

## 文件说明

- `task_plan.md`
  任务定义原稿。
- `findings.md`
  中期结论与偏差分析。
- `progress.md`
  详细过程记录与阶段验证。
- `current-analysis-feature-map.md`
  入口与模式地图，仍有参考价值，但 payload 细节不再是最新权威。
- `evaluation-redesign-overview.md`
  中期重构总览设计稿。
- `evaluation-prompt-rubric-spec.md`
  模板与评分规范设计稿。
- `input-minimization-spec.md`
  输入最小化设计稿。
- `overall-reframing.md`
  早期整体重构梳理。
