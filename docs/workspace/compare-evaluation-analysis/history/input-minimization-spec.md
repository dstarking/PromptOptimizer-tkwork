# 分析 / 评估输入最小化与去重规范

> 本文档用于收敛一个核心约束：
> 在一次 LLM 请求中，同一份长内容应尽量只出现一次。
>
> 这里的“长内容”包括但不限于：
> - 原始提示词
> - 当前工作区提示词
> - 历史版本提示词
> - 变量值
> - 测试文本
> - 会话上下文
> - 大段 JSON / 结构化上下文

## 1. 为什么需要这份规范

当前分析 / 评估链路已经完成语义重构，但还存在一个独立问题：

- 某些请求仍可能携带多份相近或重复的大块文本
- 即使语义上没有错误，也会带来 token 浪费与注意力分散
- 对于左侧分析尤其明显：一旦同时出现“原始提示词 + 当前工作区提示词”，模型很容易把任务理解成“对比阅读”，而不是“分析当前工作区”

因此需要补上一条更强的设计原则：

## 2. 总原则

### 2.1 单次请求中的硬约束

1. 同一份长内容，在一次请求里最多出现一次。
2. 如果某类信息不是当前任务的直接证据，就不要发送。
3. 如果某类信息只是辅助理解，应优先传“短摘要”，而不是原文全文。
4. 左侧分析只看设计态信息，右侧评估只看执行态证据。

### 2.2 任务优先级规则

#### 分析 `prompt-only / prompt-iterate`

- 核心目标：分析当前工作区提示词设计质量
- 唯一主对象：当前工作区提示词
- 不应被原始提示词、右侧测试输入、右侧输出分散注意力

#### 单结果评估 `result`

- 核心目标：评估一次执行快照本身
- 唯一证据：测试输入、执行提示词、执行输出
- 不应再额外注入当前工作区提示词全文

#### 对比评估 `compare`

- 核心目标：比较多个执行快照，提炼可迁移规律
- 唯一证据：公共测试输入、各快照自己的执行提示词与输出
- 公共输入只能出现一次，不应在每个快照里重复展开

## 3. 左侧分析的最小输入规则

### 3.1 `basic/user` 与 `basic/system`

默认只发送：

1. `workspacePrompt`
2. `focus`，如果有

默认不发送：

1. `referencePrompt`
2. “工作区来源说明”“是否已保存版本”等 UI 状态信息
3. 右侧测试文本
4. 右侧变量值
5. 右侧测试输出

原因：

- 左侧分析的任务是“分析当前工作区提示词”，不是“比较当前与原始提示词”
- 当原始提示词和工作区提示词都很长时，同时出现会严重分散注意力
- UI 来源说明通常不构成提示词设计语义的一部分

### 3.2 `pro/variable`

默认只发送：

1. `workspacePrompt`
2. `focus`，如果有

按需可发送的最小设计态上下文：

1. 变量名列表
2. 变量语义说明
3. 变量之间的关系说明

默认不发送：

1. 变量实际测试值
2. 渲染后的 resolved prompt
3. 某次右侧测试时填写的变量输入

建议格式：

```md
## 当前工作区变量提示词
...

## 变量结构说明
- 风格: 诗歌风格
- 主题: 诗歌主题
```

不建议格式：

```md
## 变量上下文
风格=中文古典
主题=一大段很长的业务输入
```

原因：

- 左侧分析分析的是模板设计，不是某次实例化执行
- 长变量值会把设计分析污染成样例分析

当前已落地验证：

- `basic-user` / `basic-system` 已完成最小输入收敛
- `pro/variable prompt-only` 已完成最小结构上下文收敛
- 对应真实请求样例可见：
  - `real-api-samples/pro-variable-prompt-only`
  - `real-api-samples/pro-variable-prompt-only-current`
  - `real-api-samples/pro-variable-prompt-only-minimal`

### 3.3 `pro/multi`

默认只发送：

1. 当前工作区目标消息 / 当前工作区提示词
2. `focus`，如果有

按需可发送的最小设计态上下文：

1. 被分析消息的角色
2. 与该消息直接相邻、直接相关的极短会话上下文
3. 使用显式位置标记，指出当前工作区提示词在会话中的位置

默认不发送：

1. 完整长会话全文
2. 右侧测试时的整段对话输入
3. 某次测试输出

原因：

- 多消息模式左侧分析仍然是设计分析，不是执行复盘
- 完整会话很容易成为请求中最大的 token 消耗源

推荐格式：

当选中 `system` 消息时：

```md
## 当前工作区上下文消息提示词
你是一个诗人

## 会话上下文
目标消息角色: system
- system: 【当前工作区要优化的提示词】
- user: 请你写一首关于{{主题}}的诗。
```

当选中 `user` 消息时：

```md
## 当前工作区上下文消息提示词
请你写一首关于{{主题}}的诗。

## 会话上下文
目标消息角色: user
- system: 你是一个诗人
- user: 【当前工作区要优化的提示词】
```

不推荐格式：

```md
## 会话摘要
这是一个诗歌创作场景，system 负责定义角色，user 负责提出写诗需求...
```

也不推荐：

```md
## 完整会话 JSON
{
  "targetMessage": ...,
  "conversationMessages": [...]
}
```

原因：

- `pro/multi` 左侧分析仍然是设计分析，不是执行复盘
- 模型真正需要的是“当前工作区提示词在会话里的位置关系”，而不是泛化摘要
- 显式位置标记比“相关会话摘要”更稳定，也更便于长提示词场景下控制 token
- 完整 transcript 或 JSON 很容易成为请求中最大的 token 消耗源

真实对照补充：

- `real-api-samples/pro-multi-prompt-only-current`
  - 当前实现会重复带入 `workspacePrompt / referencePrompt / targetMessage.content / conversationMessages`
- `real-api-samples/pro-multi-prompt-only-minimal`
  - 对照旧最小化尝试，主要用于证明减少重复输入不会明显损伤分析能力
- `real-api-samples/pro-multi-prompt-only-system-selected`
  - 使用最简单的双消息示例，并显式标记当前工作区提示词在 `system` 位置
- `real-api-samples/pro-multi-prompt-only-user-selected`
  - 使用最简单的双消息示例，并显式标记当前工作区提示词在 `user` 位置

目前真实返回对照显示：

- 两者 `overall` 都是 `70`
- 但最小化版本耗时明显更短，请求更聚焦

因此，`pro/multi prompt-only` 的推荐最终形态不是“泛摘要”，而是“最少量、带位置引用的会话上下文”。

当前已落地：

- `pro/multi prompt-only` 左侧分析现在默认不再发送 `referencePrompt`
- 当前 `designContext` 已收敛为：
  - 目标消息角色
  - 会话中的明确位置引用
  - 与目标消息直接相关的最少量上下文消息
- 最终态真实样例可见：
  - `real-api-samples/pro-multi-prompt-only`
  - `real-api-samples/pro-multi-prompt-only-system-selected`
  - `real-api-samples/pro-multi-prompt-only-user-selected`

### 3.4 `image/*`

当前仍按左侧分析处理，建议遵守同样规则：

- 只发送当前工作区图像提示词
- 设计意图只发简短摘要
- 不重复发送参考提示词全文

## 4. 右侧单结果评估的最小输入规则

### 4.1 统一原则

右侧单结果评估只发送这一次执行所必需的证据：

1. `testCase.input`
2. `snapshot.promptText`
3. `snapshot.output`
4. `snapshot.executionInput`，仅当其不同于公共测试输入且确有必要
5. `focus`，如果有

默认不发送：

1. `target.workspacePrompt` 全文
2. `target.referencePrompt` 全文
3. 其他版本提示词全文
4. 与本次执行无关的变量值或上下文

### 4.2 `basic/user` / `basic/system`

推荐结构：

```md
## 测试用例输入
...

## 执行快照 A
### 执行提示词
...

### 输出
...
```

不应额外再出现：

```md
## 当前工作区提示词
...

## 参考提示词
...
```

原因：

- 这会把“结果评估”重新污染成“对工作区的先验判断”
- 尤其当当前工作区并不是本次执行提示词时，模型会被误导

### 4.3 `pro/variable`

右侧 `result` 时，变量值是执行证据的一部分，因此可以发送，但应只出现一次。

推荐：

- 放在 `testCase.input`
- 或放在 `snapshot.executionInput`
- 但二者只能选一个，不要重复

不推荐：

- 既在公共测试输入里写变量值
- 又在执行快照里再写一遍渲染后输入
- 又在系统 / 用户提示词其他位置再写一次当前工作区提示词

### 4.4 `pro/multi`

右侧 `result` 时，会话片段也是执行证据的一部分，因此可以发送，但必须控制长度。

推荐：

- 公共用户输入进 `testCase.input`
- 确有必要的附加会话状态进 `snapshot.executionInput`

不推荐：

- 把完整长会话同时塞进 `testCase.input` 和 `executionInput`

## 5. 右侧对比评估的最小输入规则

### 5.1 公共输入上提

凡是多个快照共享的信息，应上提到 `testCases[]`，只出现一次。

包括：

1. 测试文本
2. 变量输入
3. 共享设置摘要
4. 共享会话输入

### 5.2 快照只保留独有证据

每个 `snapshot` 只保留自己的：

1. `promptText`
2. `output`
3. `reasoning`，如果有
4. `modelKey`
5. `versionLabel`
6. `executionInput`，仅当该输入是该快照独有信息

### 5.3 默认不发送的内容

1. `workspacePrompt` 全文
2. `referencePrompt` 全文
3. 每个快照重复展开的公共测试输入
4. 每个快照重复展开的长变量值
5. 每个快照重复展开的渲染后完整输入

### 5.4 `basic/user` / `basic/system`

推荐结构：

```md
## 公共测试用例（1）
### 测试用例 测试内容
#### 输入
...

## 执行快照（2）
### 快照 A
#### 执行提示词
...
#### 输出
...

### 快照 B
#### 执行提示词
...
#### 输出
...
```

不应再出现：

```md
## 当前工作区提示词
...
```

因为 compare 的评分证据应是多快照本身，而不是工作区全文。

### 5.5 `pro/variable`

推荐：

- 变量值只在公共测试输入块出现一次
- 每个快照只放模板提示词 / 执行提示词与输出

不推荐：

- 在快照里再重复写“变量: 风格=..., 主题=...”
- 再重复写一遍“渲染后的完整输入”

因为变量和提示词都可能很长，重复一次成本就会快速放大。

### 5.6 `pro/multi`

推荐：

- 共享用户问题、共享前置消息摘要放在公共测试输入
- 某个快照独有的附加上下文再放在 `executionInput`

不推荐：

- 每个快照都重复带整段会话 transcript

## 6. 关于 `referencePrompt` 的最终策略

为避免行为复杂化，建议先采用简单稳定规则：

1. 左侧分析默认不发送 `referencePrompt`
2. 右侧单结果评估默认不发送 `referencePrompt`
3. 右侧对比评估默认不发送 `referencePrompt`

如果未来确实需要保留“原始意图”的辅助价值，建议不要做“长度阈值判断”这种隐式策略，而是显式设计成另一种任务模式，例如：

- 普通分析：只看当前工作区
- 对照分析：工作区 + 原始意图摘要

在当前阶段，不建议：

- “短 prompt 时带 reference，长 prompt 时不带”

原因：

- 行为不稳定
- 用户难以预期
- 后续维护成本高

## 7. 关于 `designContext` 的最终策略

`designContext` 只应保留真正服务于“设计语义理解”的内容。

允许：

1. 变量结构说明
2. 会话角色说明
3. 图像风格目标摘要
4. 非执行态的简短背景约束

不允许：

1. 工作区来源说明
2. “来自原始区域复制”
3. “尚未保存版本”
4. 右侧测试文本
5. 右侧变量实际值
6. 右侧输出摘要

## 8. 推荐的最终默认策略

### 8.1 左侧分析

- 只发 `workspacePrompt`
- 有 `focus` 就加 `focus`
- 默认不发 `referencePrompt`
- 默认不发 `designContext`
- 如必须发 `designContext`，只允许极短摘要，且不得包含执行态证据

### 8.2 单结果评估

- 只发 `testCase.input`
- 只发当前 `snapshot.promptText`
- 只发当前 `snapshot.output`
- 可选发当前 `snapshot.executionInput`
- 有 `focus` 就加 `focus`
- 不额外发 `workspacePrompt`

### 8.3 对比评估

- 公共输入只发一次
- 每个快照只发自己的 prompt / output / reasoning
- 有 `focus` 就加 `focus`
- 不额外发 `workspacePrompt`
- 不重复发变量值、渲染后输入、公共会话文本

## 9. 这份规范对当前代码收敛的直接含义

如果按这份规范继续收敛，当前最优先的方向应是：

1. `basic/user prompt-only`
   - 去掉默认 `referencePrompt`
   - 去掉默认 `designContext`
2. 其余 `prompt-only`
   - 仅保留最小设计态上下文
3. `result / compare`
   - 持续检查是否仍有重复注入长内容
4. 所有模式
   - 把“同一长内容只出现一次”当作协议层约束，而不是模板层偶然结果
