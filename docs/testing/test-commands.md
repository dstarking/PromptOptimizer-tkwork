# 测试命令说明

## 命令分层

```bash
# 日常开发：只跑单元测试
pnpm test

# 单元测试
pnpm test:unit
pnpm test:fast

# 提交前快速门禁：core/ui，不含 Playwright
pnpm test:gate

# 提交前 / CI：门禁 + 关键 E2E 白名单
pnpm test:gate:full

# 关键 E2E 白名单
pnpm test:e2e:gate

# 扩展 E2E（analysis / optimize / compare 等长链路）
pnpm test:e2e:extended

# legacy alias：等同于 test:e2e:extended
pnpm test:e2e:smart

# 显式跑完整 Playwright 套件
pnpm test:e2e

# Replay extended 套件
pnpm test:e2e:replay

# 录制指定 fixture，必须显式传目标
pnpm test:e2e:record -- tests/e2e/test/image-image2image-generate.spec.ts
```

## 当前建议用法

### 日常开发

```bash
pnpm test
pnpm lint
```

### 提交前

```bash
pnpm test:gate
pnpm test:e2e:gate
```

### 需要集中回归长链路时

```bash
pnpm test:e2e:extended
```

### 只有在 fixture 契约真的变化时才录制

```bash
pnpm test:e2e:record -- tests/e2e/analysis/image-image2image.spec.ts
```

## 为什么这样分层

- `pnpm test`
  保持足够快，避免把脆弱的 Playwright/VCR 长链路挂到每次开发反馈上。
- `pnpm test:e2e:gate`
  只保留最关键、最稳定的 happy path，覆盖主路由、基础文本优化和文生图生成。
- `pnpm test:e2e:extended`
  承接 analysis / optimize / compare，以及当前仍较脆弱的单图生图/多图持久化用例。
- `pnpm test:e2e`
  仍保留完整 Playwright 入口，供手动全量回归使用。

## 录制策略

- `pnpm test:e2e:record` 不再允许默认录整套测试。
- 录制时必须显式给出 spec 路径或筛选条件，避免无意义地重录大量 fixtures。
- 如果只是想验证现有 fixture，优先使用 replay 或 gate / extended 套件。

## 相关文档

- [测试运行指南](./README.md)
- [E2E VCR 指南](../../tests/e2e/e2e-vcr-guide.md)
