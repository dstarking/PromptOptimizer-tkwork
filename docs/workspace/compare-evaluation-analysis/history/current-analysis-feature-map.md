# 当前“分析 / 评估 / 对比评估”功能现状地图

> 本文档只描述 **当前代码实现事实**。
> 已按 2026-03-16 的工作区代码重新核对。
> 如果后续代码与本文冲突，应以代码为准，并同步更新本文。
> 2026-03-17 补充说明：本文中的“功能入口 / 语义分层 / 模式差异”仍可视为当前事实；但涉及 compare payload、`workspacePrompt + variants[]`、`resolvedPrompt`、或旧阶段字段名的细节段落，可能保留了阶段性推导痕迹。若与 `real-api-samples/*/rendered-messages.json` 冲突，应优先以真实样例和 [builders.ts](/C:/Users/15588/.codex/worktrees/a89a/prompt-optimizer/packages/core/src/services/template/default-templates/evaluation/builders.ts) 为准。

## 1. 先记住这 4 句话

1. 左侧没有输出的是 **分析**。
2. 右侧单个输出的是 **评估**。
3. 右侧多个输出一起比的是 **对比评估**。
4. image 模式目前只有左侧分析，右侧结果评估 / 对比评估还没有完整主链路。

## 2. 当前 core 真正支持的评估类型

当前 `packages/core/src/services/evaluation/types.ts` 里的 `EvaluationType` 已经是：

| 类型 | 当前语义 | 是否依赖输出 |
| --- | --- | --- |
| `prompt-only` | 左侧提示词分析 | 否 |
| `prompt-iterate` | 左侧带迭代要求的提示词分析 | 否 |
| `result` | 右侧单结果评估 | 是 |
| `compare` | 右侧多结果对比评估 | 是 |

这意味着：

- 已经没有 `original` / `optimized` 这两个评估类型。
- 右侧单列评估统一走 `result`。
- compare 已经不是旧的 `originalPrompt + optimizedPrompt + originalTestResult + optimizedTestResult` 协议。

## 3. 当前 core 请求结构

### 3.1 左侧分析

```ts
type PromptAnalysisRequest =
  | {
      type: 'prompt-only'
      originalPrompt?: string
      optimizedPrompt: string
      proContext?: ProEvaluationContext
    }
  | {
      type: 'prompt-iterate'
      originalPrompt?: string
      optimizedPrompt: string
      iterateRequirement: string
      proContext?: ProEvaluationContext
    }
```

关键点：

- 不带测试输出。
- `originalPrompt` 只是可选参考；如果和当前提示词相同，UI 会主动压掉。

### 3.2 右侧单结果评估

```ts
interface ResultEvaluationRequest {
  type: 'result'
  prompt: string
  testResult: string
  testContent?: string
  resultLabel?: string
  proContext?: ProEvaluationContext
}
```

关键点：

- 当前单结果评估已经是 **按 `variantId` 分桶** 的。
- 它关心的是“这一个测试结果”，而不是“这是 original 还是 optimized”。

### 3.3 右侧对比评估

```ts
interface CompareEvaluationRequest {
  type: 'compare'
  workspacePrompt?: string
  variants: CompareEvaluationVariant[]
  proContext?: ProEvaluationContext
}

interface CompareEvaluationVariant {
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

关键点：

- compare 已经支持 `variants[]`。
- 但当前还是一个 **简化版 compare 协议**。
- 更彻底的 `inputs[] + variants[]` 去重模型，目前还没有落地。

## 4. 4 个文本 workspace 的入口总表

| 工作区 | 左侧输入区分析按钮 | 左侧 PromptPanel 分析按钮 | 右侧单结果评估 | 顶部对比评估 | 当前输入边界结论 |
| --- | --- | --- | --- | --- | --- |
| `basic-user` | 有 | 有 | 有，覆盖所有 active variants | 有，`>= 2` 个 ready variants 即可 | 左侧不吃右侧测试文本；右侧评估/对比评估吃测试文本 |
| `basic-system` | 有 | 有 | 有，覆盖所有 active variants | 有，`>= 2` 个 ready variants 即可 | 同上 |
| `context-user` | 有 | 有 | 有，覆盖所有 active variants | 有，`>= 2` 个 ready variants 即可 | 左侧只看变量结构；右侧单结果评估已按 variant 单独构造变量上下文；右侧 compare 已带每列渲染后输入快照 |
| `context-system` | 无单独输入区分析按钮 | 有 | 有，覆盖所有 active variants | 有，`>= 2` 个 ready variants 即可 | 左侧分析会带会话上下文；右侧单结果评估已按 variant 单独构造会话上下文；compare 已带 `Conversation Snapshot` |

## 5. 以 `basic-user` 为例，按钮分别在哪，输入分别是什么

这是最容易把“分析”和“评估”混在一起的模式，所以单独拆开。

### 5.1 左上输入卡片里的“分析”

位置：

- `BasicUserWorkspace.vue` 顶部 `InputPanelUI`

行为：

- 读取左上输入框当前内容。
- 先把当前输入同步到左侧工作区。
- 收起输入区后触发 `prompt-only`。

输入：

- `analysisOptimizedPrompt = 当前左侧工作区提示词`
- `analysisOriginalPrompt = 当前原始输入`
- 不带 `testContent`
- 不带输出

语义：

- 这是“分析当前提示词本身”。
- 不是“分析测试结果”。

### 5.2 左侧 PromptPanel 顶部的“分析”

位置：

- `PromptPanel.vue`

行为：

- 直接调用注入的 `evaluation.evaluatePromptOnly()` / `evaluation.evaluatePromptIterate()`。
- 如果当前版本带 `iterationNote`，走 `prompt-iterate`；否则走 `prompt-only`。

输入：

- `originalPrompt = PromptPanel 当前展示的原始参考`
- `optimizedPrompt = PromptPanel 当前展示的工作区版本`
- `iterateRequirement` 仅在 `prompt-iterate` 时存在
- 不带 `testContent`
- 不带输出

语义：

- 这是“分析当前工作区版本”。
- 它和左上输入卡片分析不是同一个入口。

### 5.3 右侧单列“评估该结果”

位置：

- 每一个 active result column 的 `EvaluationScoreBadge` / `FocusAnalyzeButton`

行为：

- 当前列只要有输出，就可以触发 `result`。
- 不再只限 A/B。

输入：

- `prompt = 该列当前实际选中的版本文本（workspace / v0 / vN）`
- `testContent = 右侧测试文本`
- `testResult = 该列输出`
- `resultLabel = A/B/C/D`

语义：

- 这是“结合输入和输出评估当前这次结果”。
- 它不再携带 original/optimized 的领域语义。

### 5.4 右侧顶部“对比评估”

位置：

- 右侧测试区顶部工具栏

显示条件：

- 当前 active variants 中
- 至少 2 个 variant 已有结果
- 且这些结果不是 stale

输入：

- `workspacePrompt = 左侧当前工作区提示词`
- `variants[]`
- 每个 variant 带：
  - 当前列实际选中的 prompt
  - 当前列输出
  - 当前列模型
  - 当前列版本标签
  - `input = 右侧测试文本`

语义：

- 这是“基于多个测试快照，对左侧当前工作区提示词做对比评估”。
- patchPlan 统一尝试作用到左侧工作区，而不是作用到某个测试列版本。
- 如果某列选的是 `workspace` 但当前工作区为空，UI 会直接阻止测试并报错。

## 6. 每个文本 workspace 现在分别带什么输入

### 6.1 `basic-user`

左侧分析：

- 只看左侧 prompt。
- 不吃右侧测试文本。

右侧结果评估：

- `prompt + testContent + output`

右侧对比评估：

- `workspacePrompt + variants[]`
- 每个 variant 额外带统一的 `testContent` 作为 `input`

### 6.2 `basic-system`

与 `basic-user` 结构相同，只是 prompt 语义变成 system prompt。

左侧分析：

- 只看左侧 system prompt。
- 不吃右侧测试文本。

右侧结果评估：

- `system prompt + testContent + output`

右侧对比评估：

- `workspacePrompt + variants[]`
- 每个 variant 可带 `testContent` 作为 `input`

### 6.3 `context-user`

这是这次改造里最关键、也最需要谨慎理解的一个模式。

左侧分析：

- Workspace 会单独构造 `analysisContext`
- 当前是：

```ts
{
  variables: buildUsedVariables(usedVarNames, { includeValues: false }),
  rawPrompt: currentWorkspacePrompt,
}
```

也就是：

- 只带变量结构
- 不带变量实例值
- 不带右侧测试变量内容

这条边界已经按目标纠正了。

右侧结果评估：

- 当前 `resultTargets` 会按 `variantId` 提供：
  - `prompt`
  - `output`
  - `label`
- `proContext`

当前单结果评估用的 `proContext` 已经改成按当前列动态构造：

```ts
{
  variables: buildUsedVariables(usedVarNames, {
    includeValues: true,
    predefinedOverrides: {
      currentPrompt: rawPrompt,
      userQuestion: rawPrompt
    }
  }),
  rawPrompt,
  resolvedPrompt: buildPromptExecutionContext(rawPrompt, executionVariables).renderedContent
}
```

这里要特别注意：

- 右侧评估确实会吃变量值，这在语义上是对的。
- 现在右侧单结果评估已经不再复用 A/B 的共享变量上下文。
- 它看到的是“当前列 prompt + 当前列输出 + 当前列变量渲染结果”。

右侧对比评估：

- compare 已经按 active variants 收集 `variants[]`
- 当前 `context-user` 的 compare payload 已经会给每个 variant 带：
  - `input.label = Rendered Content`
  - `input.content = 当前列真正发送给模型的渲染后输入`
  - `input.summary = 当前列变量值摘要`

所以当前状态应理解为：

- “分析不再吃变量值”已经完成
- “变量模式右侧评估已脱离 original/optimized”已经完成
- “变量模式右侧单结果评估按 variant 取上下文”已经完成
- “变量模式右侧 compare 已显式带执行态输入快照”也已经完成
- 剩余主要是 compare 结构仍然是 `workspacePrompt + variants[]`，还没继续演进到 `inputs[] + variants[]`

### 6.4 `context-system`

左侧分析：

- 没有单独输入区分析按钮
- 只有 `PromptPanel` 顶部分析
- 分析会带会话上下文 `proContext`

当前 `proContext` 会包含：

- `targetMessage`
- `conversationMessages`

这类上下文本身属于设计态输入的一部分，所以左侧分析带它是合理的。

右侧结果评估：

- `resultTargets` 当前会按 `variantId` 提供：
  - 当前 variant 的目标消息 prompt
  - 当前 variant 输出
- 当前 variant 的 `proContext`

同样要注意：

- 单结果评估的 `proContext` 现在会按当前列：
  - 单独取该列目标消息内容
  - 单独重建 `conversationMessages`
- 因此右侧单结果评估已经不再复用 A/B 的共享会话上下文

右侧对比评估：

- compare payload 已经比 `context-user` 更完整
- 每个 variant 会带：
  - prompt
  - output
  - modelKey
  - versionLabel
  - `input = Conversation Snapshot`
  - 如果有工具，还会把 tools 一起拼进 input content

因此当前 `context-system` 的 compare 比 result 更接近目标结构。

## 7. 右侧测试文本 / 变量输入，当前到底只在哪些地方有效

### 7.1 `basic-user` / `basic-system` 的测试文本

当前结论很明确：

- 左侧分析不使用右侧测试文本。
- 右侧结果评估和对比评估会使用右侧测试文本。

所以：

- 它只在“测试”和“评估”语义下有意义。
- 对左侧分析不应产生影响。

### 7.2 `context-user` 的测试变量值

当前结论也明确：

- 左侧分析不再使用右侧测试变量值。
- 右侧执行、结果评估、对比评估才需要它们。

但实现上要分两层理解：

- 语义边界已经纠正了
- 单结果评估上下文也已经按 variant 纠正了
- compare 现在也已经显式携带每列执行态 `input`
- 剩余主要是 compare 结构还没有继续演进到 `inputs[] + variants[]`

### 7.3 `context-system` 的右侧变量/会话输入

这里要区分两类东西：

- 会话结构本身：属于设计态上下文，左侧分析带它合理
- 右侧测试区临时变量值：属于执行态输入，更适合右侧评估

当前实现基本符合这条边界；单结果评估的 per-variant 会话上下文也已经独立，后续如果还要继续收紧，重点会落在 compare 协议是否继续去 shared-context 化。

## 8. 当前已经完成的事

1. 评估类型已经改成 `result / compare / prompt-only / prompt-iterate`。
2. 文本 workspace 的右侧单结果评估已经覆盖所有 active variants。
3. compare 已经支持任意 `>= 2` 个 ready variants，不再只限 A/B 或 2 列模式。
4. basic 两个 workspace 的 compare 已经显式把测试文本作为 variant input 带入。
5. `context-user` 左侧分析已经纠正为“只看变量结构，不看变量值”。
6. `context-user` / `context-system` 的右侧单结果评估都已经按 variant 单独构造 `proContext`。
7. compare 模板已经从“原始 vs 优化后”语言切到“多快照证据”的语言。

## 9. 当前仍然存在的偏差 / 未完成项

1. compare 结构目前仍然是 `workspacePrompt + variants[]`；这属于可选的后续规范化项，不再作为当前主链路 blocker。
2. image 模式目前只有左侧 `prompt-only` 分析模板，没有右侧 `result` / `compare` 模板与接线。
3. 一些共享测试面板内部仍保留 `COMPARE_BASELINE_VARIANT_ID` / `COMPARE_CANDIDATE_VARIANT_ID` 这样的旧常量做 tool-call 分桶，这属于后续可清理的内部残留，不影响当前对外语义。

## 10. 一句话版本

当前文本 workspace 的主语义已经基本收拢成：

- 左侧分析只看工作区设计态对象
- 右侧单结果评估看某个 variant 的实际输出
- 右侧对比评估看多个 ready variants 的快照

当前真正还没完全收干净的，主要是：

- compare 协议还没有继续演进到 `inputs[] + variants[]`，但这已降级为可选后续优化
- image 右侧评估链路还没补齐
