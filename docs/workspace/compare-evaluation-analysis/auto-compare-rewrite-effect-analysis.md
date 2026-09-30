# 自动对比评估优化链路效果分析

> 基于 `2026-03-22` 这一轮真实 calibration 产物整理。
> 分析对象是当前 compare 阶段与“评估后智能改写”链路的实际表现，不包含后续多轮 SPO 自动迭代。

## 1. 这份文档要回答什么

我们当前已经把自动优化拆成了这条链路：

1. 执行测试
2. 结构化对比评估
3. 压缩评估证据
4. 基于评估进行智能改写

这份文档主要回答三个问题：

- 当前 compare 本身的判断质量如何
- 当前 rewrite 是否真的能根据 compare 结果做出有价值的 prompt 改写
- 这条链路距离“可放心自动多轮迭代”还有多远

## 2. 结论先说

当前链路已经具备了明显的实用价值，但更适合做“保守纠错型优化”，还不适合直接承担“强自动增益型优化”。

更具体地说：

- compare 已经达到“可作为自动优化上游判断器”的水平
- rewrite 已经达到“能修坏改动、能回收过拟合、能恢复 contract”的水平
- 整条链路尚未达到“可以放心多轮自动迭代”的水平

## 3. 本轮真实证据范围

本轮主要看了 1 个 live case 和 5 个跨主题 synthetic case：

- `live-basic-system-boundary-control`
- `synthetic-medical-latent-trigger-overfit`
- `synthetic-ecommerce-schema-no-model-worship`
- `synthetic-legal-flat-not-unclear`
- `synthetic-teaching-overfit-regression`
- `synthetic-hiring-replica-semantic-instability`

总览见：

- `structured-compare-calibration/latest/summary.md`

其中 synthetic case 的命中情况为：

- 医疗分诊 latent overfit：`3/5`
- 电商 schema / contract：`6/6`
- 法务 flat vs unclear：`3/3`
- 教学 overfit regression：`6/6`
- 招聘 replica instability：`4/4`

## 4. 当前已经验证到的能力

### 4.1 compare 能稳定识别“硬问题”

当前 compare 最可靠的能力，是识别那些有明确结构语义的问题：

- schema / contract 漂移
- output boundary 漂移
- 样例贴合型过拟合
- `flat` 与 `unclear` 的区分
- 单次收益与 replica 稳定性的区分

这意味着 compare 不再只是“泛泛说哪个好一点”，而是已经能承担自动化流程中的“风险门控”职责。

### 4.2 rewrite 能把明显坏改动拉回安全区

当前 rewrite 的最好表现，不是把 prompt 优化得多惊艳，而是它已经能：

- 恢复被 workspace 改坏的 schema / contract
- 删除明显针对单一样例的硬编码规则
- 把 prompt 拉回更通用、更稳的结构

这类能力对于后续 SPO 很关键，因为它意味着自动优化链路至少具备“不会一路越改越歪”的基础。

### 4.3 live case 说明系统已经有“不过度乱改”的倾向

在真实 `basic-system` live case 中，compare 给出的结论是：

- `targetVsBaseline = improved`
- `targetVsReferenceGap = none`
- `stopRecommendation = review`

而 rewrite 基本保持了当前 workspace prompt 的核心结构，没有凭空做大幅重写。

这说明当前 rewrite 至少有一定保守性，不会在已经比较好的 prompt 上随意做大动作。

## 5. 典型正向案例

### 5.1 电商 schema case：已经具备“先修硬伤，再吸收优点”的能力

对应样本：

- `structured-compare-calibration/latest/synthetic-ecommerce-schema-no-model-worship/summary.md`

这里的关键点是：

- target/workspace 改坏了字段名和顶层结构
- teacher/workspace 的文案表达更好看
- compare 仍然优先判定 schema / contract 回退

更重要的是 rewrite 的行为：

- 没有继续保留坏 contract
- 先恢复 `title / selling_points / cautions`
- 再吸收 teacher 那些更概括、更有卖点的表达策略

这说明当前链路已经不是“谁写得更像大模型就跟谁学”，而是已经具备了较强的结构优先级。

### 5.2 教学 case：已经能识别“像样例答案”不等于“更好的 prompt”

对应样本：

- `structured-compare-calibration/latest/synthetic-teaching-overfit-regression/summary.md`

这里的 target/workspace 做的是很多自动优化系统最容易犯的错：

- 为当前题目写一个很像“正确答案”的口诀
- 但丢掉了通用原理
- 结果在当前样例上更顺口，在泛化上却更差

compare 在这里给出了比较准确的判断：

- `targetVsBaseline = regressed`
- `overfitRisk = high`
- `referenceBaseline = unsupported`

rewrite 最终也把 prompt 改回了“先讲通用原理，再讲题目”的结构。

这说明当前链路在“反过拟合纠偏”上已经具备较好的实战价值。

### 5.3 招聘 case：compare 已能识别“单次赢了，但不稳定”

对应样本：

- `structured-compare-calibration/latest/synthetic-hiring-replica-semantic-instability/summary.md`

这里的关键点是：

- target/workspace 比 previous 更结构化
- 单次输出看起来更好
- 但 replica 给出了不同的 `recommendation`

compare 能正确识别：

- `targetVsBaseline = improved`
- `targetReplica = unstable`
- `stopRecommendation = review`

这说明 compare 已经不会把“单次跑得好”直接当成“稳定改进”。

这是后续做自动迭代时非常重要的一道安全阀。

## 6. 当前最明显的不足

### 6.1 rewrite 仍然更擅长“修格式”，不擅长“修决策边界”

在招聘 instability case 里，compare 已经知道问题本质是：

- recommendation 的语义决策不稳定

但 rewrite 产出的新 prompt 更偏向加强：

- JSON 结构约束
- 字段枚举值
- 分析必须具体

这些改动不是错，但它们更像是在修“格式一致性”，不是在修“为什么同一份证据会从 `hold` 漂到 `hire`”。

也就是说：

- compare 已经能发现语义级稳定性问题
- rewrite 还不太会针对这种问题做深层修复

### 6.2 flat 场景下，rewrite 还缺少足够克制的 no-op 策略

补充说明：

- 这份分析完成后，代码里已经补上了第一版 `rewriteGuidance` gating
- 当前规则会让 `flat + no-gap` 更倾向于 `skip`
- 以及让 `improved + no-gap + low-headroom` 更倾向于 `minor-rewrite`

所以下面这段问题描述，主要代表“本轮真实 calibration 暴露出来的原始问题”，而不是当前代码仍然完全没有处理。

在法务 case 中，compare 的判断是比较理想的：

- `targetVsBaseline = flat`
- `targetVsReferenceGap = none`

这说明当前 workspace prompt 其实没有明显需要继续改的地方。

但 rewrite 仍然生成了一版“更简洁、更可操作、避免特定词过拟合”的新 prompt。

这个结果不算错，但它暴露出一个问题：

- 当前系统还不太会在“其实没必要改”时选择少改或不改

如果后面直接把这条链路接到多轮自动迭代中，这种轻微但持续的无效改写，会慢慢把 prompt 推向不必要的复杂化。

### 6.3 当前还没有完成“改写后再验证”的闭环证明

现在已经证明了两件事：

- compare 的判断经常是合理的
- rewrite 的输出方向经常是合理的

但还没有完整证明第三件事：

- rewrite 之后重新执行测试，结果是否真的更好

也就是说，当前还主要证明了“它会提出像样的修改”，尚未完全证明“它会稳定带来实测收益”。

这也是为什么当前更适合把它看成“自动辅助优化器”，而不是“自动闭环优化器”。

## 7. 医疗 case 带来的重要新认知

对应样本：

- `structured-compare-calibration/latest/synthetic-medical-latent-trigger-overfit/summary.md`

这个 case 原本更像是想测试：

- “看起来有样例收益，但其实过拟合风险很高”

但当前 compare 实际给出的结论更强：

- `targetVsBaseline = regressed`
- `overfitRisk = high`
- `stopRecommendation = review`

这说明在医疗这类高风险主题里，当前 compare 会显著更保守。

这个现象我认为总体是正向的，原因有两点：

- 它没有被“当前样例上更像对题作答”骗过去
- 它开始表现出一定领域风险敏感性

这也意味着我们的 calibration 样本已经不再只是验证“提示词会不会跑通”，而是真的能测出 judge / synthesis 的边界风格。

## 8. 当前适合做什么，不适合做什么

### 8.1 当前已经适合

- 作为 compare 阶段的自动判断器
- 自动识别明显回退
- 自动识别 schema / contract 漂移
- 自动识别样例过拟合
- 自动把 workspace prompt 拉回更稳、更通用的版本

### 8.2 当前还不适合

- 直接做多轮无人值守自动迭代
- 遇到 `flat` 场景时持续自动改写
- 依赖当前 rewrite 去修复杂的语义级稳定性问题
- 在没有复测闭环的情况下宣称“自动优化成功”

## 9. 对下一阶段实现的建议

### 9.1 优先补 rewrite gating

状态更新：

- 这一项已经落地了第一版
- 当前是保守规则，不是最终形态
- 后续重点应从“有没有 gating”转向“gating 是否足够细、是否与 UI / SPO 编排联动”

建议增加“是否值得改写”的显式门控逻辑。

一个比较合适的第一版规则是：

- 当 `targetVsBaseline = flat`
- 且 `targetVsReferenceGap = none`
- 且 `improvementHeadroom` 不是 `high`

则默认不自动改写，或至少进入“建议不改写”的保守分支。

这能减少 flat case 下的无效扰动。

### 9.2 为 instability 单独设计 rewrite 策略

状态更新：

- 这一项已经落地第一版专项指令
- 当前通过 `rewriteGuidance.focusAreas / priorityMoves` 把 instability 传给 rewrite
- 现在 rewrite 至少会被明确要求去补“判定标准 / tie-break / 保守默认规则”

当前 instability 已经能被 compare 看见，但 rewrite 还不会针对性修复。

后续应明确让 rewrite 学会根据 instability 去补：

- recommendation / decision 的判定优先级
- tie-break 规则
- 证据不足时的默认落点
- 关键字段之间的约束关系

否则它会一直停留在“加强格式约束”的浅层修补。

### 9.3 把“改写后复测”纳入正式验收

真正的自动优化效果，不应该只看 compare 和 rewrite 的文字质量。

后续一旦进入 SPO 或一轮自动迭代，应该把以下链路作为正式验收对象：

1. 先执行测试
2. compare
3. rewrite
4. 用 rewrite 结果重新执行测试
5. 再 compare 一次

只有做到这一步，我们才能更有把握地回答：

- 这条链路到底是在产生真实收益
- 还是只是在生成听起来合理的“优化建议”

## 10. 最后一句判断

如果只问一句“当前自动对比评估优化效果怎么样”，我的判断是：

它已经成功跨过了“只能演示”的阶段，进入了“可以作为真实优化系统基础能力”的阶段；
但距离“稳定可靠的自动多轮优化器”，还差 rewrite gating、instability 定向改写，以及改写后复测闭环这三块关键能力。
