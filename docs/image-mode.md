# 图像模式（Image Mode）

图像模式提供文生图（T2I）与图生图（I2I，单张本地图片）能力，输出统一为 base64（默认 image/png），生成多张时串行执行。

## 功能范围
- 文生图：仅文本提示词
- 图生图：单张本地图片 + 文本提示词（仅 png/jpeg，≤10MB）
- 输出：base64（默认 image/png）
- 生成张数：1~4（串行，不并发）
- 暂不支持：多图融合、组图、mask/局部编辑、upscale、历史记录、图像模板

## 内置图像模型与环境变量
- Gemini（image-gemini）
  - provider: `gemini`
  - defaultModel: `gemini-2.5-flash-image-preview`
  - apiKey: 复用 `VITE_GEMINI_API_KEY`
- Seedream（image-seedream）
  - provider: `seedream`
  - defaultModel: `doubao-seedream-4-0-250828`
  - apiKey: 读取 `VITE_SEEDREAM_API_KEY` | `VITE_ARK_API_KEY`（或 `process.env.ARK_API_KEY`）
- Seedream 5.0 Lite（image-seedream-50-lite）
  - provider: `seedream`
  - defaultModel: `doubao-seedream-5-0-260128`
  - apiKey: 复用 `VITE_SEEDREAM_API_KEY` | `VITE_ARK_API_KEY`（或 `process.env.ARK_API_KEY`）

> 提示：配置好以上环境变量后，内置图像模型将自动注入并按需启用。

## 使用方法（Web）
1. 顶部导航“高级模式”改为下拉：选择“图像模式”。
2. 左侧输入提示词；可选择本地图片（图生图）；设置生成张数（1~4）。
3. 选择图像模型（来自图像模型管理器）。
4. 点击“生成”，右侧显示单图 base64 预览，支持下载与复制。

## 模型管理
- 模型管理器新增标签页：“文本模型｜图像模型”。
- 图像模型页支持：新增、编辑、启用/禁用、删除。
- 连通性测试：当前版本在图像页暂不提供（后续可考虑快速小图验证）。

## 校验与限制
- 本地图片：仅 `image/png` 或 `image/jpeg`；大小 ≤ 10MB（前端与后端均有校验）。
- count：1~4，串行执行。
- Seedream 请求固定关闭组图（`sequential_image_generation='disabled'`），返回 `b64_json`。

## 开发说明
- 核心层：`ImageService` + 适配器（Gemini/Seedream/OpenAI），适配器注册表按 provider 路由。
- UI：`ImageWorkspace.vue` 为图像模式工作区；通过 `useImageGeneration` 调用 `ImageService`。
- 代理与网络：现在仅支持直接访问模型提供商，如在浏览器环境遇到跨域限制，请改用桌面版或自行配置反向代理。
