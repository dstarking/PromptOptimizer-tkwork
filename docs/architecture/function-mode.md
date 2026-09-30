# 全局功能模式（Function Mode）与上下文模板

本文档说明全局功能模式（basic/pro）与六类模板类型的关系，以及历史记录与存储键的联动策略。

## 功能模式（Function Mode）

- 偏好键：`app:settings:ui:function-mode`
- 取值：`'basic' | 'pro'`（默认 `'basic'`，首次运行自动持久化为 `'basic'`）
- 目的：统一驱动模板下拉选择、历史复用等行为（类似主题/语言的全局来源）。

## 模板类型映射（6 类）

- 基础（basic）：
  - 系统优化：`optimize`
  - 用户优化：`userOptimize`
  - 迭代优化：`iterate`
- 专业（pro）：
  - 上下文-系统优化：`contextSystemOptimize`
  - 上下文-用户优化：`contextUserOptimize`
  - 上下文-迭代优化：`contextIterate`

> 页面（如 App.vue）会根据当前 `function-mode` 与系统/用户/迭代家族，自动选择对应的模板类型；无需新增本地开关。

## 模板管理器分类

模板管理器独立于功能模式，提供 6 类模板的全量管理：
- `optimize` / `userOptimize` / `iterate`
- `contextSystemOptimize` / `contextUserOptimize` / `contextIterate`

在相应分类内新建/复制模板时，其 `metadata.templateType` 将被设置为该分类对应类型。

## 模板选择持久化（键位）

为确保模式切换后的“记忆”体验，基础/专业两种模式下的选择分开保存：

- 基础：
  - 系统：`app:selected-optimize-template`
  - 用户：`app:selected-user-optimize-template`
  - 迭代：`app:selected-iterate-template`
- 专业（上下文）：
  - 系统：`app:selected-context-system-optimize-template`
  - 用户：`app:selected-context-user-optimize-template`
  - 迭代：`app:selected-context-iterate-template`

切换 `function-mode` 时，系统将读取对应键，若不存在则回退到该类型列表的第一项并写回保存。

## 历史记录

- 类型：扩展为 6 类，与模板类型一致（另含 `test`）。
- 新建链：
  - `function-mode='pro'` 或选择了 `context*` 模板 → 记录为 `contextSystemOptimize`/`contextUserOptimize`。
  - 否则记录为基础类型 `optimize`/`userOptimize`；
  - 迭代版本始终为 `iterate`（保持与根类型一致的家族）。
- 复用链：
  - 根记录类型为 `context*` → 自动切换 `function-mode='pro'`；
  - 根记录类型为基础 → 自动切换 `function-mode='basic'`；
  - 同时根据根类型切换 `system/user` 优化模式。

## 回退策略

当请求 `context*` 类型但没有可用模板时：
- 下拉列表为空并引导用户在模板管理器添加模板；
- 服务层默认模板查找会从 `context*` 回退到对应基础类型，保证流程不中断。

## 兼容性

- 默认 `function-mode` 为 `'basic'`，向后兼容旧版本；
- 如存在历史布尔“高级模式”，可一次性迁移为 `function-mode`：`true → 'pro'`、`false → 'basic'`（实现层可选）。

