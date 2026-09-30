# 从提示词库导入图像提示词并对比模型

这个示例演示一条完整的图像提示词工作流：从提示词库选择一个可复用模板，导入到 Optimizer，修改少量核心变量，用智能填充补齐剩余变量，最后用两个图像模型对比生成效果。

示例使用提示词库中的[复古纪念邮票海报](https://garden.always200.com/prompts/vintage-commemorative-postage-stamp-poster)，导入码为 `ZH-NB-151`。

## 1. 在提示词库选择模板

打开提示词详情页后，可以先查看提示词说明、示例图和导入码。这个模板适合把节气、城市、角色生日、产品发布或纪念事件做成竖版收藏级邮票海报。

在页面右侧有两种入口：

- 点击“在优化工具中打开”，直接跳转到 Optimizer Web 界面。
- 复制导入码 `ZH-NB-151`，稍后在 Optimizer 中手动导入。

![提示词库中的复古纪念邮票海报](../../assets/images/nb151-yoimiya-flow/garden-postage-stamp-prompt-detail.png)

## 2. 在 Optimizer 中导入

进入 Optimizer 的文生图工作区。如果没有从提示词库页面直接跳转，也可以点击右侧工具栏的花朵标志，选择“导入花园提示词”。

![从右侧花朵入口导入提示词](../../assets/images/nb151-yoimiya-flow/optimizer-flower-import-entry.png)

在弹窗中粘贴导入码 `ZH-NB-151`，点击“导入”。

![粘贴导入码](../../assets/images/nb151-yoimiya-flow/optimizer-import-code-dialog.png)

导入完成后，Optimizer 会保留模板正文，并识别出 `title`、`commemoration`、`date`、`subject`、`palette`、`denomination`、`tagline` 这 7 个变量。模板自带的示例值也会一起带入，方便直接改写。

![导入后的模板变量](../../assets/images/nb151-yoimiya-flow/optimizer-imported-template-variables.png)

## 3. 修改核心变量

变量可以直接逐项修改。这个例子保留邮票海报的结构，只把核心主题改成“立夏 + 原神的宵宫”：

| 变量 | 示例值 |
| --- | --- |
| `title` | 立夏 |
| `commemoration` | 二十四节气·立夏纪念 |
| `date` | 2026 / 05 / 05 |
| `subject` | 原神的宵宫 |

其余变量可以手动填写，也可以先留空，交给智能填充补齐。

![修改核心变量](../../assets/images/nb151-yoimiya-flow/optimizer-edited-core-variables.png)

## 4. 用智能填充补齐细节

点击“智能填充变量值”后，Optimizer 会根据已有变量生成剩余字段。确认弹窗会展示生成值、生成理由和置信度，可以选择性应用。

本例中，智能填充补全了配色、面值编号和纪念短句，让它们与“立夏”和“宵宫”的视觉主题保持一致。

![预览智能填充结果](../../assets/images/nb151-yoimiya-flow/optimizer-smart-fill-preview.png)

应用后可以继续微调变量。例如最终生成使用了：

| 变量 | 示例值 |
| --- | --- |
| `palette` | 暖金、翠竹绿、浅米纸色 |
| `denomination` | 120分 纪念邮资 编号:2026-4 |
| `tagline` | 夏木已成阴，烟花映长空 |

## 5. 选择模型并生成对比

变量确认后，在测试区选择要对比的图像模型。本例中：

- A 列：`gpt-image-2`
- B 列：`Doubao Seedream 5.0 Lite`

点击生成后，可以直接并排比较两个模型对同一提示词的理解。A 列更接近完整的复古邮票海报，齿孔、邮戳、面值、日期块和标题层级更稳定；B 列更像明亮的角色插画邮票卡片，画面轻盈但整体收藏海报感弱一些。

![模型生成结果对比](../../assets/images/nb151-yoimiya-flow/model-comparison-results.png)

## 6. 查看最终效果

如果某一列结果更接近目标，可以下载或继续围绕它微调变量。下面是本次 `gpt-image-2` 生成的最终效果图。

![gpt-image-2 生成的立夏宵宫纪念邮票](../../assets/images/nb151-yoimiya-flow/gpt-image2-final-stamp-result.png)

## 这个示例适合验证什么

- 提示词库模板能否顺畅导入到文生图工作区。
- 变量结构是否能保留，并支持直接改写或智能填充。
- 同一提示词在不同图像模型上的版式、文字、主体识别和细节差异。
- 图像提示词是否能把输出稳定约束在“复古纪念邮票海报”这个目标上。

## 相关页面

- [文生图工作区](../image/text2image-workspace.md)
- [变量智能填充](../auxiliary/smart-fill.md)
- [提示词库](../basic/prompt-garden.md)
- [模型选择与测试策略](../user/model-testing-strategy.md)
