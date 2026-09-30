# 发现与结论：compare-evaluation-analysis

> 本文档已经按 2026-03-14 当前代码重写。
> 2026-03-16 补充：测试区版本来源已统一为 `workspace / v0 / vN`，`latest` 仅保留为旧 session 迁移输入。
> 它不再把“旧实现问题”和“未来方案”混在一起，而是拆成：
> 1. 当前已经落地的结构
> 2. 仍然存在的真实偏差
> 3. 后续如果继续推进，最值得做的下一层改造

## 1. 当前结论

这轮重构的大方向已经基本成立：

- 左侧是 **分析**
- 右侧单列是 **评估**
- 右侧多列是 **对比评估**

对应到代码层面：

- `EvaluationType` 已经收成 `result / compare / prompt-only / prompt-iterate`
- 文本 workspace 的单结果评估已经按 `variantId` 工作
- compare 已经改成 `workspacePrompt? + variants[]`
- compare 模板也已经不再把 A/B 强行解释成 original/optimized

所以，最核心的语义纠偏已经完成了。

## 1.1 不要把当前问题继续复杂化

这里需要刻意做一个收口判断：

- 当前暴露出来的问题已经分成两层
- 第一层是主语义是否正确
- 第二层是实现是否已经在所有模式、所有变体上做到完全精确

当前代码状态更适合这样理解：

- **第一层已经基本完成**
  - 左侧分析 vs 右侧评估 vs 右侧对比评估 的语义已经拆开
  - 文本 workspace 的主结构已经按 `result / compare / prompt-*` 跑起来
- **第二层还没有完全完成**
  - compare 还没有继续演进到 `inputs[] + variants[]` 去重模型
  - image 右侧评估链路还没补齐

所以现在不应该把问题表述成：

- “这轮任务越来越复杂，还没理顺”

而应表述成：

- “这轮主任务已经理顺，当前剩下的是后续精度修正项和扩展项”

这条判断很重要，因为它直接决定后面的工作策略：

- 不再把所有残留都并入这轮主任务
- 先承认文本 workspace 主语义已经基本落地
- 再决定要不要继续做 compare 输入建模收口与 image 扩展
- 其中 compare 去重建模当前已明确降级为“可选后续优化”

## 2. 已经落地的结构

### 2.1 core 侧真实接口

当前 core 里的核心请求结构已经是：

```ts
export type EvaluationType =
  | 'result'
  | 'compare'
  | 'prompt-only'
  | 'prompt-iterate'

export interface ResultEvaluationRequest extends EvaluationRequestBase {
  type: 'result'
  prompt: string
  testResult: string
  testContent?: string
  resultLabel?: string
}

export interface CompareEvaluationRequest extends EvaluationRequestBase {
  type: 'compare'
  workspacePrompt?: string
  variants: CompareEvaluationVariant[]
}

export interface CompareEvaluationVariant {
  id: string
  label: string
  prompt: string
  output: string
  reasoning?: string
  modelKey?: string
  versionLabel?: string
  input?: {
    label: string
    content: string
    summary?: string
  }
}
```

这说明：

- 单结果评估已经是“一个结果快照”的建模。
- compare 已经不是旧二元协议。
- 但 compare 目前还是一个“简化的多 variant 协议”；是否继续演进到 `inputs[] + variants[]` 去重模型，已不再视为当前 blocker。

### 2.2 UI 侧真实分层

当前 `useEvaluationHandler` 已经把三类输入拆开了：

```ts
interface UseEvaluationHandlerOptions {
  analysisOriginalPrompt?: Ref<string> | ComputedRef<string>
  analysisOptimizedPrompt: Ref<string> | ComputedRef<string>
  analysisContext?: Ref<ProEvaluationContext | undefined> | ComputedRef<...>

  resultTargets?: Ref<Record<string, ResultEvaluationTarget>> | ComputedRef<...>
  comparePayload?: Ref<CompareEvaluationPayload | null> | ComputedRef<...>

  proContext?: Ref<ProEvaluationContext | undefined> | ComputedRef<...>
}
```

这层拆分的意义是：

- 左侧分析已经可以单独收口输入边界
- 右侧结果评估已经按 `variantId` 获取目标
- 右侧 compare 已经走统一的 `comparePayload`

### 2.3 文本 workspace 的完成度

当前 4 个文本 workspace 的主链路都已经切到了新语义：

- `basic-user`
- `basic-system`
- `context-user`
- `context-system`

共同点：

- 右侧单结果评估都已覆盖所有 active variants
- compare 都已支持当前 active variants 中任意 `>= 2` 个 ready variants
- compare 按钮不再只在 2 列 A/B 模式下出现

## 3. 这轮已经真正解决了什么

### 3.1 旧的 `original / optimized` 评估语义已经被拿掉

这件事不是文案层面的改名，而是实际接线已经改了：

- core 类型变了
- result 模板变了
- compare 模板变了
- workspace 接线变了

### 3.2 左侧分析和右侧评估的边界已经被拉开

尤其是 `context-user`：

- 左侧分析现在单独走 `analysisContext`
- 只带变量结构
- 不再默认带变量实例值

这是本轮最重要的输入边界修正之一。

### 3.3 compare 已经真正开始围绕“测试快照”而不是“版本身份”

当前 compare payload 里，每个 variant 已经会带：

- `id`
- `label`
- `prompt`
- `output`
- `reasoning?`
- `modelKey?`
- `versionLabel?`
- `input?`

这已经足够让 compare 模板不再把问题理解成“优化前后对比”。

## 4. 当前仍然存在的真实偏差

这部分是目前最值得在文档里明确写出来的，不然很容易误以为这轮已经完全收口。

### 4.1 `context-user` 的 compare 已补上 per-variant input snapshot

当前 `ContextUserWorkspace.vue` 中：

- 左侧分析用的是 `analysisProContext`
- 这部分已经正确，只带变量结构

右侧单结果评估现在已经会按当前列构造 `proContext`：

```ts
{
  rawPrompt,
  resolvedPrompt,
  variables: buildUsedVariables(..., {
    includeValues: true,
    predefinedOverrides: { currentPrompt: rawPrompt, userQuestion: rawPrompt }
  })
}
```

右侧 compare 现在也会给每个 variant 明确带：

当前 `context-user` compare payload 会带：

- prompt
- output
- reasoning
- modelKey
- versionLabel
- input
  - `label = Rendered Content`
  - `content = 当前列渲染后输入`
  - `summary = 当前列变量值摘要`

这说明当前 `context-user` compare 的真实状态已经变成：

- 已经摆脱了 old compare 协议
- 单结果评估也已经按 variant 取上下文
- 现在也已经像 `basic-*` / `context-system` 那样，把执行态输入快照明确表达出来
- 剩余主要是 compare 结构本身还不是更彻底的 `inputs[] + variants[]`

### 4.2 `context-system` 的单结果评估上下文已经补齐，compare 相对更完整

`context-system` 现在的状态更接近目标结构：

- 单结果评估会按当前列单独构造：
  - `targetMessage`
  - `conversationMessages`
- compare payload 也会给每个 variant 带 `Conversation Snapshot`

所以它当前更像是：

- 单结果评估链路已经到位
- compare 也已经具备较完整的执行态输入表达

### 4.3 image 模式仍然只停留在左侧分析

当前 image 模式：

- 有左侧分析入口
- `useEvaluationHandler` 只被用来处理 `prompt-only`
- core 模板目录下也只有 image 的 `evaluation-prompt-only`

所以现在不应该把 image 写成“只是还差一点 compare”。

更准确的说法是：

- image 右侧结果评估 / 对比评估主链路都还没有完成

### 4.4 还有一些内部残留还没清干净

例如：

- `ConversationTestPanel.vue`
- `ContextUserTestPanel.vue`
- `TestAreaPanel.vue`

内部 tool-call 分桶仍在使用：

- `COMPARE_BASELINE_VARIANT_ID`
- `COMPARE_CANDIDATE_VARIANT_ID`

这不影响当前主语义，但说明“内部彻底去旧 compare 化”还没完全做完。

另外：

- `usePromptTester.ts`
- `useConversationTester.ts`
- `useContextUserTester.ts`

这些旧测试 helper 仍然在仓库里，虽然当前文本 workspace 主链路已经不再依赖它们。

## 5. 当前文档最应该怎么理解

如果后续模型或开发者要快速判断“现在代码到了哪一步”，建议按下面这套口径理解：

### 已完成

- 语义分层已经完成第一阶段
- core 请求已经不再围绕 original/optimized
- 文本 workspace 已经具备 variant 化的 result / compare 能力
- 左侧分析输入边界已经开始收口

### 未完成

- compare 还没有演进到 `inputs[] + variants[]` 去重模型
- image 右侧评估链路还没补齐
- 一些旧 compare internal naming 仍残留在共享组件和旧 helper 中

## 6. 如果继续推进，最值得做的下一层改造

这里不再写大而全的终局方案，而只写当前代码基础上最自然的下一步。

在进入这些下一步之前，建议先明确一个判断标准：

- **文本 workspace 主语义重构** 可以视为当前阶段已基本完成
- 下面这些工作不应再被包装成“否则本轮不成立”
- 它们更适合被视为“下一阶段增强”

### 第 1 优先级：补齐 image 右侧评估链路或明确继续排除

目标：

- image 有多列测试 UI
- 但没有完整的右侧评估链路

后续最好二选一：

1. 正式补 image 的 `result` / `compare` 模板和接线
2. 或者在产品和文档里明确写成“image 当前只支持左侧分析”

### 第 2 优先级：清理内部旧 compare 残留

这包括：

- shared panel 内部的 compare baseline/candidate 常量
- 旧 tester helper
- 一些只剩兼容意义的旧命名

这一步不是当前功能正确性的 blocker，但能减少后续维护成本。

## 7. 下一步工作的收敛建议

如果按“不继续复杂化当前任务”的原则，下一步工作建议按下面顺序推进：

### 7.1 先停在文档与任务边界收口

目标：

- 明确告诉后续开发者：文本 workspace 的主语义重构已经基本完成
- `pro` 精度问题与 image 扩展不是这轮 blocker

这是为了避免后续工作继续失焦。

### 7.2 如果要继续做代码，优先决定 compare 是否继续走去重模型

原因：

- 这是当前文本主链路里最真实、最具体的剩余结构问题
- 它比清理命名残留更影响 compare 评估质量
- 它比 image 扩展更贴近当前主任务脉络

建议拆成两个小步：

1. 先确认是否真的需要去重共享输入
2. 再决定 compare 是否进一步演进成 `inputs[] + variants[]`

### 7.3 image 暂时单独立项，不混入当前文本主线

原因：

- image 不是“差最后一点”
- 它实际上缺的是一整段右侧评估能力
- 和文本主链路的剩余工作不是同一种量级

### 7.4 内部旧 compare 残留最后清

像这些内容：

- `COMPARE_BASELINE_VARIANT_ID`
- `COMPARE_CANDIDATE_VARIANT_ID`
- 旧 tester helper

更适合作为“收尾清理”，而不是下一步第一优先级。

### 第 3 优先级：如果确实有收益，再决定 compare 是否继续去重建模

目标：

- 去重共享输入
- 明确输入引用关系
- 降低 token 重复

但当前这一步已经明确不是主线 blocker，更适合作为后续精修项。

## 8. 当前最简洁的任务判断

如果要把现在的状态收成一句话，可以直接写：

- 文本 workspace 的“分析 / 评估 / 对比评估”主语义已经基本重构完成，测试区版本来源也已统一到 `workspace / v0 / vN`；当前主线剩余问题主要是 image 模式右侧评估链路缺失，compare 去重建模属于可选后续优化。
