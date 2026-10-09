# Windows 商品卡增强功能：2.12.0

## 一、问题根因与范围

原商品卡只有三个英文输出，不能在桌面端采集 1688 商品事实、选定 SKU 或生成经程序校验的视频时间轴。本次仅增强 Windows Electron 入口；Web 的三项输出和原提示词不变。

真实 Electron 冒烟还发现：1688 CDN 返回 `image/webp`，而共享图片准备流程只接受 JPG/PNG。桌面入口增加 WebP → PNG 的无损像素格式适配，再复用现有压缩、确认和多模态输入；没有扩大 Web 上传格式。

发布流程原先要求 macOS/Linux/扩展产物，且桌面默认更新源仍指向上游。本次只构建 Windows x64 NSIS，保留 `.blockmap` 和 `latest.yml` 自动更新元数据，更新源指向本仓库。版本说明与 CHANGELOG 同步为 2.12.0。

## 二、实际文件清单

| 文件 | 状态及用途 |
| --- | --- |
| `packages/core/src/services/product-import/types.ts` | 新增商品、SKU、图片与来源证据类型；不把展示组合 ID 当作供应商真实 SKU ID。 |
| `packages/core/src/services/product-import/normalize.ts` | 新增 URL 校验和真实 DOM 组合归一化、图片关联、缺失与冲突提示。 |
| `packages/core/src/services/product-import/video.ts` | 新增五档时长、最多 10 秒分段、结构化输出、连续时间轴与图片引用校验。 |
| `packages/core/src/services/product-compliance/index.ts` | 新增独立辅助规则，检查夸大/医疗宣称、供应商信息和品牌授权。 |
| `packages/core/src/index.ts` | 导出新增类型和服务。 |
| `packages/core/package.json` | 将新商品合同测试纳入 Core 门禁。 |
| `packages/core/tests/unit/product/product-card.spec.ts` | 新增 URL、SKU、五档时长、引用和合规测试。 |
| `packages/desktop/services/browserskill/product-import.js` | 新增受控主进程采集与 CDN 下载；参数数组、独立 session、取消/超时、来源与大小限制。 |
| `packages/desktop/services/browserskill/product-import.test.js` | 新增会话清理、取消、超时、环境、非法 URL 和采集失败测试。 |
| `packages/desktop/services/browserskill/p0-variants.fixture.json` | 新增真实双维商品的脱敏 DOM 快照测试素材。 |
| `packages/desktop/main.js` | 注册受控商品采集 IPC。 |
| `packages/desktop/preload.js` | 仅 Windows 暴露有限 productImport 能力。 |
| `packages/desktop/package.json` | 纳入采集模块、Windows NSIS 构建、桌面测试、版本和正确发布仓库。 |
| `packages/ui/src/components/tiktok-mode/TikTokProductCardDesktop.vue` | 新增桌面工作区：采集、原始快照核对、选 SKU、确认事实、匹配图片、时长、四块结果、编辑复核、导出/收藏/v2 历史。历史为按钮跳转，不占用输入区。 |
| `packages/ui/src/components/tiktok-mode/TikTokProductCardWorkspace.vue` | 根据真实 preload 能力进入增强分支；Web 和旧 v1 历史仍使用原分支。 |
| `packages/ui/src/services/tiktok-product-card-desktop-prompt.ts` | 新增新加坡宠物用品专用提示词，SEO 相关性、痛点描述、保真主图与视频提示词；不伪称实时热词。 |
| `packages/ui/src/services/tiktok-product-card-desktop-images.ts` | 新增桌面专用 WebP 无损转 PNG，并限制源字节和转换像素分配。 |
| `packages/ui/src/utils/tiktok-product-card-history.ts` | 新增独立 v2 存储键和合并读取；Web 不读取桌面 v2。 |
| `packages/ui/src/types/electron.d.ts` | 新增有限桥接接口类型。 |
| `packages/ui/src/i18n/locales/en-US/tiktok-product-card.ts` | 增加桌面增强文案。 |
| `packages/ui/src/i18n/locales/zh-CN/tiktok-product-card.ts` | 增加简体中文桌面标签、限制与操作提示。 |
| `packages/ui/src/i18n/locales/zh-TW/tiktok-product-card.ts` | 增加繁体中文同形翻译。 |
| `packages/ui/tests/unit/services/tiktok-product-card-desktop.spec.ts` | 新增提示词、Web 兼容、五档时长与 WebP 适配测试。 |
| `packages/ui/tests/unit/components/TikTokProductCardDesktop.spec.ts` | 新增真实组件的 SKU/事实门禁、时长传递、视频单次修复、品牌清空和历史恢复测试。 |
| `scripts/desktop-ipc-handlers.test.mjs` | 更新跨文件 IPC 检查与仅 Windows 发布断言，保留检查强度。 |
| `.github/workflows/release.yml` | 删除其他平台/扩展发布任务及其产物校验；保留测试、双语说明、Windows 构建和正式发布。 |
| `package.json` | 同步版本并把桌面测试加入提交门禁。 |
| `packages/extension/public/manifest.json` | 仅同步版本元数据，不构建或发布扩展。 |
| `CHANGELOG.md` | 新增 2.12.0 首条和双语说明链接。 |
| `releases/v2.12.0.en.md` | 新增英文版本说明和限制。 |
| `releases/v2.12.0.zh-CN.md` | 新增中文版本说明和限制。 |
| `docs/desktop-product-card-windows.md` | 本交付与使用文档。 |

## 三、验证结果

Windows 真实浏览器：BrowserSkill CLI/扩展 0.3.2，Chrome 154；使用已连接实例，串行独立会话采集，结束后未留下采集会话。

| 1688 商品 ID | 实际 SKU 数 | 展示图片数 | 实际下载一张图片 |
| --- | ---: | ---: | --- |
| 875760500354 | 9 | 14 | WebP，118,282 字节 |
| 1036519325516 | 13 | 18 | WebP，85,754 字节 |
| 1080800490623 | 12（六颜色、两规格） | 11 | WebP，109,400 字节 |

双维商品包装参数疑似全部为 1，已提示人工核实。真实供应商 SKU ID、原始图片及完整详情图库均未确认，不能把展示组合或副本称为原始数据。

验证命令：

```powershell
# 本机默认 pnpm 为 11；仓库要求 10.6.1，实际用 pnpm dlx pnpm@10.6.1 执行。
pnpm test:gate
pnpm test:gate:e2e
pnpm -F @prompt-optimizer/core typecheck
pnpm -F @prompt-optimizer/ui typecheck
pnpm -F @prompt-optimizer/web typecheck
node scripts/release-notes.js check v2.12.0
pnpm build:desktop:ci
```

提交门禁覆盖仓库检查、Core、UI、桌面；Web UI smoke 与 VCR replay 覆盖原有基础/上下文/图像工作区。测试没有删除或关闭类型检查。

最终 `test:gate`：仓库 54、Core 48、UI 971、桌面 44，共 1,117 项通过（另有既有 UI 1 项 todo 和 1 个跳过文件）。`test:gate:e2e`：UI smoke 1、gate replay 12，共 13 项通过。Core/UI/Web 类型检查、双语版本说明校验及 Windows NSIS 构建通过。

隔离数据目录的真实 Electron 冒烟通过：真实 preload → 主进程 IPC → 双维商品采集 → 界面选择 SKU → 自动下载匹配 WebP → 无损转 PNG 并导入 → 历史按钮跳转。测试过程没有接触原用户配置，也未终止共享 BrowserSkill daemon；所有采集 session 已释放。此处为已构建页面与实际主进程的运行验证，不等同于安装/升级生命周期验收。

额外运行 Core 全量测试发现一项基线模型迁移测试失败：`packages/core/tests/integration/model/migration.integration.test.ts:295` 查找不在当前适配器列表中的 `gpt-5.6-sol`。该测试和相关模型实现均与基线相同，未扩展修改范围；因此不能称 Core 全量测试全部通过。

实际 LLM 生成质量未验证：本机隔离配置中没有可用模型凭据。标题、描述与主图输出合同、视频时长、一次视频修复、编辑合规复核及历史恢复由测试验证，不等同于真实模型质量验收。

## 四、Windows 使用步骤

1. 安装本版本 Windows x64 `.exe`。本版本无签名证书，可能出现 Windows SmartScreen 提示；先核对下载来源和校验值。
2. 独立安装 BrowserSkill CLI 与扩展，Chrome 登录 1688。CLI 默认路径为 `%USERPROFILE%\.local\bin\bsk.exe`；本版本仅支持该路径。
3. 复用现有 daemon；若未启动，在单独 PowerShell 终端执行 `& "$env:USERPROFILE\.local\bin\bsk.exe" daemon start --foreground`。应用不会重启共享 daemon 或自动绕过登录/验证码。
4. 打开 TikTok 商品卡，检查连接并选择浏览器实例，填写 1688 商品链接后采集。失败时根据提示人工登录/确认，再重试；也可以清空后手动输入并上传图片。
5. 展开原始采集快照与证据，核对标题、属性、SKU、包装与缺失项。选择目标 SKU、修正事实并勾选确认；查看品牌授权风险。
6. 导入匹配图片或手动上传原图（最多 9 张，支持 Ctrl+V）；展示图不是已验证原图。切换 SKU 会清空旧参考图和结果，避免混配。
7. 在原模型管理体系配置多模态文本模型，选择 10/15/20/25/30 秒；默认 10 秒。
8. 生成四项英文内容，逐块或全部复制、导出 Markdown、保存收藏。人工编辑后辅助合规提示实时更新。正式上架前仍需人工审核。
9. 右上角历史按钮打开独立历史页面。v2 恢复视频、时长、SKU 与报告；历史不保存图片，重新生成须重新上传。v1 仍按旧页面读取。

## 五、影响、风险与回滚

- Web 提示词和原三项输出未改变；BrowserSkill 仅由 Windows preload 受控 IPC 调用。保持 `contextIsolation: true`、`nodeIntegration: false`。
- 原图/详情未证实、无 SKU 和不可售组合、长时间页面结构稳定性、安装/升级与共享 daemon 重启的完整生命周期尚未验收。采用有明确中断的半自动流程，不承诺无人值守。
- 合规检查是有限规则，不是官方许可；没有命中不代表没有风险。SEO 词是相关性推荐，非已验证实时热词。
- 不生成实际图片/视频，不自动上架，不批量采集，不抓取热词榜单，不读取 Cookie/Token。
- 升级前建议通过现有数据管理导出备份。回滚可安装旧版；保留 v1 历史和新的独立 v2 数据键，不删除用户数据。建议先对选定 SKU 的真实模型结果人工验收，再用于发布。
