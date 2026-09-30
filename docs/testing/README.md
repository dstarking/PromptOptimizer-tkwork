# 测试运行指南

本项目的测试入口已收缩为三层：

- `pnpm test`
  只跑单元测试，适合日常开发的快速反馈。
- `pnpm test:gate`
  运行 core/ui 的门禁测试，不含 Playwright E2E，适合提交前快速检查。
- `pnpm test:gate:full`
  在 `test:gate` 基础上追加关键 E2E 白名单，适合提交前或 CI。

## 常用命令

```bash
# 日常开发：快速反馈
pnpm test

# 提交前快速门禁：core/ui，不含 E2E
pnpm test:gate

# 提交前 / CI：门禁 + 关键 E2E
pnpm test:gate:full

# 关键 E2E 白名单
pnpm test:e2e:gate

# 扩展 E2E（analysis / optimize / compare 等长链路）
pnpm test:e2e:extended

# 显式跑完整 Playwright 套件（较重）
pnpm test:e2e

# 重新录制指定 fixture（必须显式传 spec 或 grep）
pnpm test:e2e:record -- tests/e2e/test/image-image2image-generate.spec.ts
```

## VCR

- E2E VCR 入口：`tests/e2e/fixtures.ts`
- 说明文档：`tests/e2e/e2e-vcr-guide.md`
- `pnpm test:e2e:record` 不再默认录整套测试，避免无意义地重录大量 fixtures。

## UI 错误门禁

- Vitest（UI 包）：`packages/ui/tests/utils/error-detection.ts`
- Playwright（E2E）：`tests/e2e/fixtures.ts`
