# 国际化约定

本仓库采用英文优先的国际化治理策略，目标是在不影响团队中文协作的前提下，让产品运行时文案、异常提示和默认入口保持英文主导并可持续维护。

## 基本规则

- 英文是 source locale，所有新增翻译键以 `en-US` 为基准。
- 根 `README.md` 保持英文默认入口，中文说明放在 `README.zh-CN.md`。
- 开发文档可以继续使用中文。
- 注释允许保留中文，但新增或修改时优先写英文。

## 运行时代码约束

- 普通运行时代码中不允许新增中文用户可见文案。
- UI 文案必须优先走 i18n key。
- Core 层优先抛出结构化错误（`code + params`），不要把最终展示文案硬编码在业务逻辑里。
- 非 UI 的内部错误和日志如果不做国际化，一律使用英文。

## 允许保留中文的目录

以下目录允许保留中文内容资产：

- `docs/**`
- `mkdocs/**`
- `packages/ui/src/i18n/**`
- `packages/core/src/services/template/default-templates/**`
- `packages/ui/src/docs/**`
- `packages/ui/src/examples/**`
- 测试目录及其夹具

如需新增允许目录，请同步更新中文扫描脚本中的 allowlist。

## Locale 结构要求

- locale 文件按领域拆分维护，不再使用单一超大文件直接编辑。
- 所有语言包必须与 `en-US` 保持完全一致的 key 结构。
- locale parity 校验和非法中文扫描属于 CI 阻断项。

## 默认语言策略

- 无用户偏好设置时，应用默认语言为 `en-US`。
- 已保存偏好设置的用户保持原有行为。
- 非法或未知 locale 一律回退到 `en-US`。
