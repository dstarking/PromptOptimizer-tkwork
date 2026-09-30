# Compare 阶段手动测试操作手册

> 这份文档是“按步骤点击”的操作版。
> 目标不是覆盖所有历史验收点，而是帮助你手动验证这次 compare 阶段改造的核心功能是否真的可用。

## 1. 适用范围

本手册优先验证：

- `basic-system`
- compare evaluation
- structured compare 结果展示
- compare role config
- 基于评估结果的智能改写
- stale 旧结果可查看但不可重跑

如果这条主链通过，说明本次 compare 阶段的主干能力已经基本可接受。

## 2. 启动方式

在项目根目录执行：

```powershell
pnpm dev:fresh
```

启动后打开本地 Web 页面。

建议：

- 用无痕窗口或新浏览器 profile
- 如果你想同时看模型请求，可打开 DevTools 的 Network

## 3. 建议测试数据

### 3.1 system prompt

左侧原始提示词建议填这个：

```text
你是一个客服助手。回答用户问题时：
1. 先判断问题类型。
2. 给出简洁且有帮助的回复。
3. 不要编造物流状态。
4. 不要输出与问题无关的建议。
```

### 3.2 测试输入

右侧测试内容建议填这个：

```text
用户说：订单一周还没发货，我很着急。
```

这个案例的好处是：

- 容易看出回复结构是否更清晰
- 容易看出边界是否滑移
- 容易比较“是否过度编造物流状态”

## 4. 手测主流程

---

## 4.1 基础链路：先优化，再测试

目标：

- 验证工作区能正常产生新版本
- 验证测试区两列都能跑出结果

步骤：

1. 进入 `basic-system` 模式。
2. 左侧填入上面的 system prompt。
3. 点击优化，等待生成工作区版本。
4. 确认版本区已经显示 `v1`。
5. 右侧测试区把列数切到 `2`。
6. 在测试输入框里填入上面的测试输入。
7. 点击 `Run All`。

通过标准：

- 原始列和工作区列都有非空输出
- 页面没有报错
- 当前工作区版本仍可见

如果失败，优先记录：

- 是否某一列没有输出
- 是否点击 `Run All` 后没有任何反应
- 是否出现模型请求错误或工作区版本异常丢失

---

## 4.2 Compare 评估：生成分数与详情

目标：

- 验证 compare evaluation 真正能跑通
- 验证右侧顶部 compare 分数能出现

步骤：

1. 完成 `4.1` 的流程。
2. 在测试区顶部点击 compare 的评估按钮。
3. 等待 compare 分数徽章出现。
4. 点击 compare 分数徽章，打开详情抽屉。

通过标准：

- compare 分数徽章出现
- 能打开详情抽屉
- 抽屉内不是空白，也不是旧式简单总结

重点观察：

- 是否能看到 compare 的整体 summary
- 是否能继续展开看更细的信息

---

## 4.3 Structured Compare：检查结构化产物

目标：

- 验证当前 compare 结果不是旧的 generic compare 退化输出
- 验证 pairwise judge + synthesis 的产物已经进入 UI

步骤：

1. 完成 `4.2`。
2. 在 compare 详情抽屉里，依次检查这些区块是否出现：
   - `Compare Decision`
   - `Compare Metadata`
   - `Compare Insights`
   - `Pairwise Judgements`

通过标准：

- 以上 4 个区块都可见
- `Compare Metadata` 里能看到 `Mode`
- `Mode` 显示为 `Structured` 或 `结构化`

进一步检查：

- `Snapshot Roles` 里是否出现角色信息，例如：
  - `Target`
  - `Baseline`
  - `Reference`
  - 有时还有 `Reference Baseline` / `Replica`
- `Stop Signals` 是否至少出现以下字段中的一部分：
  - `targetVsBaseline`
  - `targetVsReferenceGap`
  - `improvementHeadroom`
  - `overfitRisk`
  - `stopRecommendation`
- `Pairwise Judgements` 是否是按 pair 展示，而不是一段散文式总结

如果这里通过，可以基本认为：

- structured compare 已经生效
- pairwise judge 结果已被保留下来
- synthesis 结果和派生 metadata 已经进入 UI

---

## 4.4 智能改写：从 compare 结果生成新版本

目标：

- 验证“根据评估结果智能改写工作区提示词”这条链路可用

步骤：

1. 保持 compare 详情抽屉打开。
2. 点击 `智能改写` / `Rewrite From Evaluation` 按钮。
3. 回到工作区区域，观察版本标签。

通过标准：

- 会生成一个新版本
- 版本号从 `v1` 变成 `v2`，或继续递增
- 新版本内容非空
- 新版本不是原文完全不变

建议再补做一步：

4. 再次点击测试区 `Run All`，观察新版本输出是否也能正常生成。

补充通过标准：

- 新版本能参与测试
- 不会因为智能改写后的版本而导致测试区失效

---

## 4.5 角色配置弹窗：多 workspace 场景下选择 target

目标：

- 验证当 compare 中 workspace 槽位不止一个时，不会盲猜 target
- 验证手动角色配置能真正影响 structured compare

建议场景：

- 至少 3 个槽位
- 至少 2 个槽位是 workspace prompt
- 模型可相同也可不同

步骤：

1. 把测试区配置成一个“workspace 不唯一”的场景。
2. 点击 compare 评估。
3. 如果弹出 compare role config 弹窗，继续以下步骤：
   - 为一个槽位指定 `target`
   - 为另一个槽位指定 `baseline`
   - 如果有教师模型槽位，指定 `reference`
   - 如果有教师模型旧版本槽位，指定 `referenceBaseline`
4. 点击确认。
5. 再次完成 compare。
6. 打开 compare 详情。

通过标准：

- 弹窗能正常出现
- 可以手动分配角色
- 重新 compare 后，`Snapshot Roles` 和你刚刚选的角色一致
- `Mode` 仍然是 `Structured`

如果没有弹窗，也可以手动点测试区里的 compare 配置按钮进入同样的弹窗。

---

## 4.6 Stale 结果：旧结果保留，但不可误重跑

目标：

- 验证 compare / result 在输入条件变化后仍可查看历史结果
- 但不会继续拿旧条件偷偷重跑

步骤：

1. 先完成一轮单结果评估和 compare 评估。
2. 保留已有输出不动。
3. 把右侧测试输入清空，或者改成完全不同的内容。
4. 观察已有分数徽章。
5. 点击旧分数徽章，查看详情。
6. 再尝试寻找 `re-evaluate` / 重新评估入口。

通过标准：

- 旧分数徽章仍然存在
- 徽章应表现为 stale 状态
- 旧详情仍能打开
- 重新评估入口应被禁用，不能继续发请求

这里最重要的是：

- “可查看” 和 “可重跑” 必须被区分开

---

## 4.7 空白差异不应导致 structured compare 退化

目标：

- 验证这次修复的 prompt 归一化逻辑
- 避免只因为换行/空格不同，就让 structured compare 退回 generic

建议做法：

1. 准备两个几乎相同的 prompt。
2. 只改空白格式，不改语义：
   - 一个多空行
   - 一个多缩进
   - 或一个单行，一个多行
3. 把它们放进可 compare 的槽位场景里。
4. 再次执行 compare。

通过标准：

- `Mode` 仍然是 `Structured`
- 角色仍能被合理识别
- 不会因为纯空白差异直接退回 generic

---

## 5. 推荐你实际记录的验收结果

建议你按下面格式记一份最小结果：

```text
[通过/失败] 4.1 基础链路
[通过/失败] 4.2 Compare 评估
[通过/失败] 4.3 Structured Compare 展示
[通过/失败] 4.4 智能改写生成新版本
[通过/失败] 4.5 角色配置弹窗
[通过/失败] 4.6 Stale 旧结果
[通过/失败] 4.7 空白差异不退化
```

如果失败，建议只补这三项：

```text
模块：
步骤：
实际现象：
预期现象：
```

例如：

```text
模块：basic-system / compare
步骤：点击 compare 评估后打开详情
实际现象：没有 Compare Insights，只有普通 summary
预期现象：应出现 structured compare 的 metadata / insights / pairwise judgements
```

## 6. 最低通过标准

如果你时间有限，至少验证这 5 条：

1. `basic-system` 两列测试可正常运行。
2. compare 评估后详情里能看到 `Structured`。
3. 详情里有 `Compare Decision / Metadata / Insights / Pairwise Judgements`。
4. 点击智能改写后能生成新版本。
5. 修改测试输入后，旧结果仍可看，但不能直接重跑。

只要这 5 条都过，我会认为这次 compare 阶段已经具备提交价值。
