# 发现与决策

## 需求摘要

- 目标不是做一个新的通用 SPO 平台，而是把“朝目标自动迭代”的能力融入现有提示词优化工作流。
- 用户希望充分复用当前测试区的多槽位能力，用真实执行结果驱动自动改写，而不是只基于静态目标描述做推断。
- V1 只做一轮：
  - 建立上一版本对照
  - 分析差异
  - 改写 `workspace`
  - 重新测试
- 自动目标不是抽象的“我要更好”，而是非常具体的：
  - 目标槽位：`目标模型 / workspace`
  - 参考槽位：`目标模型 / 上一版本`、`参考模型 / workspace`、`参考模型 / 上一版本`
- 首期范围切到 `basic-system`，优化对象是系统提示词。
- 测试输入仅用于暴露系统提示词在执行时的行为差异，不应反向固化为提示词里的样例特化规则。

## 代码/结构发现

- 当前 `basic-system` 已经不是单纯 A/B。
  - `packages/ui/src/stores/session/useBasicSystemSession.ts`
    - 已有 `TestVariantId = 'a' | 'b' | 'c' | 'd'`
    - 已有 `TestColumnCount = 2 | 3 | 4`
    - 已有 `testVariants: TestVariantConfig[]`
- 当前测试区已具备多槽位主控能力。
  - `packages/ui/src/components/basic-mode/BasicSystemWorkspace.vue`
    - 已有 `testColumnCountModel`
    - 已有 `activeVariantIds`
    - 已有 per-slot 的版本/模型选择
    - 已有 `runAllVariants`
    - 已有 system 模式必填的 `testContent`
- 当前对比评估的数据结构天然适合承载多槽位证据。
  - `packages/ui/src/composables/prompt/compareEvaluation.ts`
    - 以 `testCases + snapshots + compareHints` 组织执行证据
    - 支持同一测试输入下的多输出对比
- 旧的 `testVariantState.ts` 仍保留 A/B 语义，但它已经不是 `basic-system` 当前测试区的主编排层。

## 目标锚点如何获得

本期不要求用户额外填写“目标说明/硬约束”。目标锚点由以下 4 类信息共同生成：

1. `目标槽位`
   - 用户在弹窗中指定 `目标模型`
   - 系统默认把 `目标模型 / workspace` 作为唯一优化对象
2. `提示词内显式约束`
   - 从当前 `workspace` 提示词中抽取角色、任务边界、输出格式、禁忌项、工具使用规则等
3. `上一版本参考`
   - 来自 `目标模型 / 上一版本` 与 `参考模型 / 上一版本`
   - 用来判断哪些能力是上一版已经稳定拥有的，不能在本轮迭代里丢失
4. `跨模型差异证据`
   - 来自 `参考模型 / workspace` 与 `目标模型 / workspace` 的真实输出差异
   - 用来识别“同一提示词下，参考模型已经体现而目标模型尚未稳定体现”的能力

换句话说，本设计里的“意图识别”不是独立的意图分类器，而是一次面向当前测试证据的目标锚点提取。

这里的“上一版本”是产品术语，不是新的版本类型：

- UI 内部仍然会落成实际的 `v0` 或 `vN`
- 它强调的是“当前工作区在本轮迭代之前的那个版本”
- 如果后续要加入不随轮次变化的参照物，应单独命名为“固定基线”，不要与“上一版本”混用

## 模型上下文构造（核心结论）

自动迭代不应只把“4 份输出”直接拼给模型，而应构造成一个结构化上下文包：

- 任务元信息
  - 当前轮次、目标模型、参考模型、目标槽位
- 提示词上下文
  - 当前 `workspace` 提示词
  - 上一版本提示词
  - 可选 `v0` 作为原始参考
- 测试输入上下文
  - 当前测试区输入内容
  - 相关设置摘要
  - 需要显式标注“测试输入仅作为执行场景，不是可直接抽取进系统提示词的规则来源”
- 执行证据
  - 4 个槽位的 prompt/version/model/output/reasoning 快照
- 差异总结
  - `目标/workspace` 相比 `目标/上一版本` 的提升/退化
  - `目标/workspace` 相比 `参考/workspace` 的欠缺项
  - `参考/workspace` 相比 `参考/上一版本` 的参考侧增益项
- 约束与护栏
  - 只允许修改 `workspace`
  - 不允许引入明显依赖当前样例输入的硬编码规则
  - 若证据不足，应返回“不建议改写”

这比“给模型一个目标再让它自由改”更接近我们项目的定位，因为它建立在真实执行证据上。

## 技术决策

| 决策 | 理由 |
| --- | --- |
| 自动迭代入口放在测试区顶部 | 保持“先测试、再判断、再改写”的心智模型，不引入新页面 |
| V1 配置只暴露 `目标模型` 和 `参考模型` | 降低上手成本，避免把功能做成复杂实验编排器 |
| 自动生成 4 槽位预设 | 复用现有多槽位能力，同时天然具备目标对比、参考对比、版本回归三条证据线 |
| 使用“上一版本”替代 `v-last` 作为产品术语 | 这里要表达的是“当前轮次之前的那个版本”，它会随着自动迭代推进而变化，不适合叫基线 |
| 一轮内只改写 `workspace`，不自动保存版本 | 降低错误传播风险，保留人工确认环节 |
| 成功标准必须包含“回归未恶化”而不只是“当前样例更好” | 防止测试样例驱动的过拟合 |

## 防过拟合规则（V1）

- `目标模型 / workspace` 必须相对 `目标模型 / 上一版本` 有明确改进，至少不能出现关键能力退化。
- `参考模型 / workspace` 不应相对 `参考模型 / 上一版本` 出现明显退化。
- 改写理由必须能够抽象成“结构性改进”，例如：
  - 指令顺序更明确
  - 约束边界更清晰
  - 输出结构更稳定
  - 异常场景覆盖更完整
- 若建议依赖当前测试输入中的具体名词、变量值、字面样例，系统应将其归为疑似过拟合信号并拒绝采纳。
- 对 `basic-system` 而言，自动改写只能调整系统层规则，不得把测试输入中的具体实体、字段值、案例文案上升为长期系统规则。

## 可能的实现触点

- `packages/ui/src/components/basic-mode/BasicSystemWorkspace.vue`
  - 新增自动迭代按钮、配置弹窗、回合执行入口
- `packages/ui/src/stores/session/useBasicSystemSession.ts`
  - 视需要持久化自动迭代配置与最近一次预设
- `packages/ui/src/composables/prompt/compareEvaluation.ts`
  - 复用 `snapshot` 证据组织方式，避免重新定义执行证据格式
- 新增独立编排层（建议）
  - 如 `packages/ui/src/composables/prompt/autoIterateOneRound.ts`
  - 负责预设生成、证据整形、模型调用、回写工作区与复测

## 资源

- 多槽位 session：`packages/ui/src/stores/session/useBasicSystemSession.ts`
- 多槽位测试区：`packages/ui/src/components/basic-mode/BasicSystemWorkspace.vue`
- 对比评估证据构造：`packages/ui/src/composables/prompt/compareEvaluation.ts`
- 旧 A/B 状态工具：`packages/ui/src/composables/prompt/testVariantState.ts`
- 架构设计：`docs/architecture/test-area-auto-iterate-one-round.md`

## Structured Compare 与 SPO 边界补充

### 为什么不能把三组关键判断直接做成 SPO 私有逻辑

前面收敛出的三组关键判断：

- `target/workspace vs target/previous`
- `target/workspace vs reference/workspace`
- `reference/workspace vs reference/previous`

确实很适合自动优化，但它们依赖的并不是 `SPO` 这个功能名本身，而是更底层的“结构化 compare 角色”。

也就是说，它们依赖的是：

- 谁是当前要优化的 `target`
- 谁是它的 `baseline`
- 谁是可学习对象 `reference`
- 谁是 `referenceBaseline`

而不是依赖：

- 是否打开了自动迭代弹窗
- 是否走了 `targetModel + referenceModel` 的专用入口

因此，这部分能力更适合下沉为 compare evaluation 的通用增强，而不是让 `SPO` 自己维护一套平行 judge 逻辑。

### Generic Compare 与 Structured Compare 的分界

为了控制变更范围，同时不牺牲 compare 的表达力，比较合理的做法是把 compare evaluation 分为两种模式：

1. `Generic Compare`
   - 适用于任意自由组合测试
   - 不要求存在 `workspace`
   - 不要求指定 `target`
   - 延续当前更通用的 compare 行为
2. `Structured Compare`
   - 至少存在一个 `workspace`
   - 围绕一个明确的 `target` 做分析
   - 可以在内部做更强的 pairwise blind judge 与 synthesis

这样可以避免把“围绕工作区做定向优化”的能力硬塞给所有 compare，同时也避免 `SPO` 自己长出一套不可复用的 compare 内核。

### target 的识别与配置方式

为了让 compare evaluation 可以服务于更多场景，`target` 不应只来源于 `SPO` 配置。

比较稳妥的规则是：

1. 如果没有任何 `workspace` 槽位
   - 不进入 `Structured Compare`
   - 回退到 `Generic Compare`
2. 如果只有一个 `workspace` 槽位
   - 自动将其视为 `target`
3. 如果有多个 `workspace` 槽位
   - 在首次 compare 时弹窗让用户选择 `target`
   - 后续将结果持久化，并在 UI 上显示角色标记

一旦 `target` 明确，其余槽位就可以根据“是否同模型 / 是否同 prompt / 是否是历史版本 / 是否是重复执行”自动推断为：

- `baseline`
- `reference`
- `referenceBaseline`
- `replica`
- `auxiliary`

这里的角色是中性的 compare 语义，不直接暴露 `reference` 这样的业务词汇，因此更容易复用到普通 compare、稳定性判断和未来的自动优化编排中。

### “根据整份评估结果智能重写”应是通用能力

这次自动迭代的实现已经证明：

- 原始证据可以很长
- 直接把所有 prompt / input / output 全量塞给 rewrite 模型，成本高且容易失焦
- compare evaluation 结果本身就是一层高价值压缩与过滤

因此，更合理的设计不是让 `SPO` 独占“智能改写”，而是让所有评估面板未来都具备一个通用动作：

- 读取整份评估结果
- 对建议做二次过滤
- 拒绝样例特化和过拟合信号
- 在保留硬约束的前提下重写当前工作区 prompt

这样一来：

- compare evaluation 的收益可以被更多入口复用
- `SPO` 只需要负责编排 `test -> compare -> rewrite -> retest`
- 变更范围更清晰，也更符合“尽量增强评估层，自动优化只做薄封装”的方向

## 薄 SPO 设计补充

### 为什么 SPO 不应再加一层专属 judge

当我们开始讨论：

- “改进空间很小是否可以停”
- “和参考模型基本一致是否可以停”
- “是否已经没有必要继续迭代”

最自然的想法，是让 `SPO` 再额外发一个专属 LLM 请求做 stop judge。

但这会带来两个问题：

1. `SPO` 会重新长出一套自己的判断内核
2. compare evaluation 与 `SPO` 的边界会再次变脏

因此，这些判断更适合被收敛为 compare evaluation 的通用 stop signals，再由 `SPO` 消费。

### stop signals 应属于 compare evaluation 的通用增强

`SPO` 真正需要的是一组机器可消费的判断信号，例如：

- 当前相对上一轮是 `improved / flat / regressed`
- 当前与参考模型差距是 `major / minor / none`
- 当前改进空间是 `high / medium / low / none`
- 当前过拟合风险是 `low / medium / high`
- 系统建议 `continue / stop / review`

这些信号不仅 `SPO` 可以用，未来：

- compare 详情面板
- 评估结果驱动重写
- 其他自动化工作流

也都可以消费，因此应放在 compare evaluation 层。

### 薄 SPO 的 UI 应以“嵌入测试区”为原则

`SPO` 最终的展示不应是一个新的实验台，而应在现有测试区内最小增量地完成：

- 顶部一个 `SPO` 按钮
- 测试区内一张 `SPO` 运行卡 / 结果卡
- 右侧一个 `SPO` 详情抽屉

核心证据仍然由现有 4 槽测试结果承载。

### 必须区分“最后执行轮”和“最终采用轮”

多轮 `SPO` 下，一个很重要的发现是：

- 最后一轮不一定是最好的
- 后续轮可能开始回归或过拟合

因此系统必须显式维护一个“最终采用轮”的概念。

也就是说：

- `workspace` 应尽量保留当前已接受的最佳轮
- 后续回归轮不能直接覆盖最佳结果
- 最终 UI 必须明确告诉用户：
  - 停在第几轮
  - 实际采用第几轮
