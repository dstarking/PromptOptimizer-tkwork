# 分析 / 评估 / 对比评估重构设计总览

> 本文档描述 **下一阶段重构设计目标**，不是当前代码事实记录。
> 当前代码现状请优先参考：
> - `current-analysis-feature-map.md`
> - `findings.md`
> - `progress.md`

## 1. 本轮设计的核心目标

这一阶段不再只是修正旧 `compare` 的语义，而是要建立一套更稳定的评估体系：

1. 明确区分：
   - 左侧 `分析`
   - 右侧单结果 `评估`
   - 右侧多结果 `对比评估`
2. 统一“当前工作区提示词才是可修改目标”的原则。
3. 重构输入协议，去掉公共输入重复，支持未来多测试能力。
4. 彻底重写评估类模板，统一采用结构化系统提示词框架。
5. 为三类任务分别定义不同的评分维度，不再共用一套 rubric。
6. 把 `聚焦内容（focus）` 升级为所有分析 / 评估任务的最高优先级输入。

## 2. 先明确三类任务的语义

### 2.1 分析 Analysis

分析作用在左侧工作区，评估对象是“提示词设计本身”。

特点：

- 不依赖右侧测试输出。
- 只看工作区当前可编辑对象及其设计态上下文。
- 目标是判断提示词是否清晰、完整、可执行、稳健。
- patchPlan 只允许修改当前工作区提示词。

### 2.2 单结果评估 Single Result Evaluation

单结果评估作用在右侧单个测试结果上，评估对象是“一次执行快照”。

特点：

- 依赖输入、提示词和输出。
- 不关心该结果来自 original / optimized 还是某个版本身份。
- 关注的是“这个提示词在这次执行中表现如何”。
- patchPlan 仍然只尝试修改当前工作区提示词，而不是某个历史版本。

### 2.3 对比评估 Compare Evaluation

对比评估作用在右侧多个测试快照上，评估对象是“一组执行证据”。

特点：

- 至少需要 2 个快照。
- 核心不是“哪一列赢了”，而是“哪些规律值得吸收到当前工作区提示词中”。
- patchPlan 的唯一目标仍然是当前工作区提示词。
- 如果多组证据无法可靠映射到当前工作区提示词，必须返回空 patchPlan。

## 3. 设计原则

### 3.1 当前工作区才是唯一 patch target

这条规则对三类任务全部成立：

- 可以引用原始提示词、历史版本、测试快照作为证据。
- 但 patchPlan 只能针对当前工作区提示词生成。
- 如果当前工作区为空，应该直接阻止相关操作，而不是回退到其他 prompt。

### 3.2 左侧只看设计态，右侧只看执行态

左侧分析：

- 只看工作区 prompt 和设计态上下文。
- 不读取右侧测试文本、变量值、测试输出。

右侧评估：

- 只看测试输入、执行 prompt、执行输出及相关执行上下文。
- 不应误把右侧执行态输入当成左侧设计态上下文。

### 3.3 评估不是版本关系推断

评估功能不应假设：

- 某列一定代表“原始”
- 某列一定代表“优化后”
- 当前工作区一定对应被测试的某个版本

正确理解是：

- 测试快照只是证据。
- 当前工作区只是可修改目标。
- 两者不要求一一对应。

## 4. 新的输入模型：从“字段堆叠”改为“三层结构”

当前最值得统一的，不是再调 `result / compare` 的字段名，而是把输入拆成三个层次：

1. `target`：当前工作区中可被修改的对象
2. `testCases`：公共测试用例
3. `snapshots`：每一次真实执行快照

### 4.1 目标对象 Target

```ts
export interface EvaluationTarget {
  mode: {
    functionMode: 'basic' | 'pro' | 'image'
    subMode: string
  }
  workspacePrompt: string
  referencePrompt?: string
  designContext?: DesignContext
}
```

含义：

- `workspacePrompt`：唯一可修改对象
- `referencePrompt`：可选参考，如 v0 或工作区进入分析前的原始内容
- `designContext`：只用于左侧分析的设计态上下文

### 4.2 公共测试用例 TestCases

```ts
export interface TestCase {
  id: string
  label?: string
  input: TestCaseInput
  sharedSettings?: SharedExecutionSettings
}
```

含义：

- 表达“这次我们到底在测什么”
- 适合承载公共测试文本、变量输入、会话输入、图像输入
- 多个 snapshot 可以共用同一个 testCase

### 4.3 执行快照 Snapshots

```ts
export interface ExecutionSnapshot {
  id: string
  label: string
  testCaseId: string
  promptRef: PromptRef
  promptText: string
  output: string
  reasoning?: string
  modelKey?: string
  settingsOverride?: Partial<SharedExecutionSettings>
  executionInput?: {
    label: string
    content: string
    summary?: string
  }
}
```

含义：

- 表达“这一次真实执行时，模型看到了什么、输出了什么”
- `promptText` 是实际执行 prompt
- `executionInput` 只放“与 testCase 公共输入不同、或需要额外表达的执行态证据”

### 4.4 统一后的请求形态

分析：

```ts
export interface AnalysisRequest {
  type: 'analysis'
  target: EvaluationTarget
  iterateRequirement?: string
  focus?: FocusBrief
}
```

右侧评估：

```ts
export interface ExecutionEvaluationRequest {
  type: 'execution-evaluation'
  view: 'single' | 'compare'
  target: EvaluationTarget
  testCases: TestCase[]
  snapshots: ExecutionSnapshot[]
  focus?: FocusBrief
  compareHints?: CompareAnalysisHints
}
```

## 5. 为什么这种结构更适合未来多测试

多测试能力的关键不是“支持更多 variant”，而是支持：

- 多个测试用例
- 每个测试用例下可有多个快照
- 多个快照之间可能只是模型不同，也可能只是 prompt 版本不同

这套结构下：

- 共同的测试内容只在 `testCases` 里出现一次
- 每个 snapshot 只表达自己独有的信息
- 单结果评估和对比评估共用同一套协议，只是 `snapshots.length` 不同

## 6. `focus` 的设计地位：最高优先级输入

## 6.1 `focus` 不是备注，是任务切换器

当用户填写聚焦内容时，它不只是“补充说明”，而是改变本次任务的主目标。

因此：

- 无 `focus`：执行默认分析 / 评估任务
- 有 `focus`：执行“用户优先问题驱动”的定向分析 / 评估任务

### 6.2 统一建模建议

```ts
export interface FocusBrief {
  content: string
  source: 'user' | 'system'
  priority: 'highest'
}
```

### 6.3 统一规则

只要存在 `focus`，就必须满足：

1. `summary` 必须先回应 `focus`
2. `improvements` 至少 1 条直接回应 `focus`
3. `patchPlan` 若非空，至少 1 条直接回应 `focus`
4. 默认 rubric 仍需完成，但不能盖过 `focus`
5. 若当前证据不足以支持 `focus` 指向的问题，必须明确说明

## 7. compare 的一个重要子场景：同提示词跨模型对比

## 7.1 场景定义

当满足以下条件时：

- 测试输入相同
- 执行 prompt 相同或语义等价
- 模型不同
- 输出不同

应视为：

- “同一提示词在不同模型下的理解差异对比”

### 7.2 这个场景的核心目标

重点不应只放在“哪个模型更强”，而应分析：

- 为什么同一个 prompt 会被不同模型理解成不同结果
- 哪些表达对强模型足够，但对弱模型不够清晰
- 是否存在这些问题：
  - 目标表达不够显式
  - 约束不够前置
  - 歧义词太多
  - 结构层级不清楚
  - 输出格式要求不够刚性
  - 缺少示例

### 7.3 这不是新的任务类型

它仍属于 compare evaluation，但需要额外的分析提示。

建议通过 `compareHints` 显式建模：

```ts
export interface CompareAnalysisHints {
  sameTestCaseAcrossSnapshots: boolean
  samePromptAcrossSnapshots: boolean
  crossModelComparison: boolean
}
```

必要时可以再加：

```ts
export interface SnapshotComparisonGroup {
  groupId: string
  basis: 'same-prompt-same-input-cross-model' | 'same-input-cross-prompt'
  snapshotIds: string[]
}
```

## 8. 4 个模式在新模型下的映射方式

### 8.1 basic-user / basic-system

左侧分析：

- `target.workspacePrompt`
- 无执行态测试输入

右侧评估：

- `TestCase.input = { kind: 'text', text }`
- snapshot 持有：
  - `promptText`
  - `output`
  - `modelKey`

### 8.2 context-user

左侧分析：

- `target.designContext = variable-design`
- 只带变量结构，不带变量值

右侧评估：

- `TestCase.input = { kind: 'variables', values }`
- snapshot 可额外带：
  - `executionInput.content = 渲染后的实际输入`
  - `executionInput.summary = 变量值摘要`

### 8.3 context-system

左侧分析：

- `target.designContext = conversation-design`
- 带目标消息与对话结构

右侧评估：

- `TestCase.input = { kind: 'conversation', messages, tools? }`
- snapshot 可带：
  - `executionInput.content = 当前列真正发送给模型的对话快照`

### 8.4 image

左侧分析：

- `target.workspacePrompt`
- 必要时加 image 设计态上下文

右侧评估（未来）：

- `TestCase.input = { kind: 'image', text?, imageIds? }`
- snapshot 持有生成结果摘要

## 9. 实现分层建议

### 9.1 core

目标：

- 把当前分裂的 `prompt-only / prompt-iterate / result / compare` 输入协议，重构成更稳定的任务模型
- 保留 UI 语义，但让底层协议更统一

建议：

- 新增 `AnalysisRequest`
- 新增 `ExecutionEvaluationRequest`
- 保留 `view = single | compare`
- 新增 `FocusBrief`
- 新增 `CompareAnalysisHints`

### 9.2 UI 组包层

目标：

- 不再让各 workspace 维护一套 `resultTargets + comparePayload` 的拼装习惯

建议：

- 每个 workspace 只负责实现：
  - `buildAnalysisTarget()`
  - `buildExecutionEvaluationRequest(view)`

### 9.3 模板层

目标：

- 不再把模板写成“散的说明文”
- 统一改为结构化 system prompt

建议：

- `analysis` 1 套主模板
- `execution-single` 1 套主模板
- `execution-compare` 1 套主模板
- 各模式差异通过 context 注入
- `focus` 和跨模型 compare 通过模板条件块切换

### 9.4 UI 文案层

建议统一：

- 左侧：`分析`
- 右侧单列：`结果评估`
- 右侧多列：`对比评估`
- `focus` 输入框文案应更明确表达“优先问题”，而不是弱语义备注

## 10. 本轮设计最重要的收敛结论

一句话总结：

- 下一阶段重构的关键，不是继续修补旧 compare，而是把分析 / 单结果评估 / 对比评估正式建成三类不同任务：共享“当前工作区才是 patch target”的原则，但拥有不同的输入边界、不同的评分 rubric，以及统一但可条件分支的结构化评估模板。
