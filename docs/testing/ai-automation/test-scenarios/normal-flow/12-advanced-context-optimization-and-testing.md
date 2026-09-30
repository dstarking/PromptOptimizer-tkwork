# 变量/上下文/工具的完整优化与测试流程（Normal Flow）

## 📖 测试概述
在“高级模式”下，将变量（全局+上下文覆盖）、上下文消息（system/user）与工具（function tools）一起参与优化与测试，验证端到端链路：
- 数据准备（变量/上下文/工具）
- 启用高级模式并执行优化（system 与/或 user 模式）
- 执行测试（Compare 模式、工具调用展示）
- 预览与缺失统计一致性、导出数据完整性

## 🎯 测试目标
- 高级模式下优化请求包含 variables/messages/tools
- Compare 测试可运行，结果展示稳定
- 若发生工具调用，在 TestAreaPanel 正确展示/记录
- 变量替换与缺失统计一致，context 覆盖优先生效
- 导出数据包含 tools 与变量元数据

## 📋 前置条件
- [ ] 应用正常运行，已完成模型配置（可用的测试模型）
- [ ] 允许网络访问（执行真实优化/测试）
- [ ] 已了解“系统提示词优化”与“用户提示词优化”的差异

---

## 🔧 测试步骤

### 步骤1：准备全局变量（VariableManager）
**AI执行指导：**
- 打开全局变量管理器（VariableManager），新增：
  - `name = GlobalName`
  - `scene = 全局场景`
- 记录当前全局变量数量

**预期结果：**
- 变量列表中出现 `name`、`scene`

**验证点：**
- [ ] 变量计数正确，新增变量持久

---

### 步骤2：准备上下文（ContextEditor → 消息）
**AI执行指导：**
- 在对话管理中添加消息并“打开编辑器”进入 ContextEditor：
  - system: `你是一个专业助手，称谓={{name}}，角色={{role}}`
  - user: `请在 {{scene}} 下完成 {{task}}，并提供步骤`
- 在变量页新增上下文覆盖：
  - `name = Alice`（使其覆盖全局值 `GlobalName`）
  - `role = 系统助手`
  - `task = 高级流程验证`

**预期结果：**
- 变量统计至少 3 项
- 预览时 `name` 使用上下文覆盖（Alice）而非全局（GlobalName）

**验证点：**
- [ ] 缺失变量为 0（`name/role/scene/task` 均有来源：scene 来自全局）
- [ ] 预览替换无 `{{…}}` 残留

---

### 步骤3：准备工具（ContextEditor → 工具管理）
**AI执行指导：**
- 在工具页新增工具定义：
```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "Get current weather for a location",
    "parameters": {
      "type": "object",
      "properties": {
        "location": { "type": "string" },
        "unit": { "type": "string", "enum": ["celsius", "fahrenheit"], "default": "celsius" }
      },
      "required": ["location"]
    }
  }
}
```
- 关闭编辑器返回对话管理区域，检查工具数量徽章（tools.count）

**预期结果：**
- 工具列表出现 `get_weather`
- 顶部徽章显示工具数量 = 1

**验证点：**
- [ ] 工具 JSON 保存无报错
- [ ] 工具数量显示正确

---

### 步骤4：启用高级模式并执行“优化”
**AI执行指导：**
- 打开“高级模式”开关（Advanced Mode）
- 选择一个优化模板（system 或 user 模式皆可；建议先用 system 模式）
- 点击“优化”
- 使用 `browser_console_messages` 抓取日志关键字：
  - `[App] Optimizing with advanced context:` 或
  - `[usePromptOptimizer] Starting optimization with advanced context:`

**预期结果：**
- 控制台出现“advanced context”日志，包含 variables/messages/tools 的简要统计
- 优化结束后，右侧显示优化结果（若 Compare 模式开启则作为“优化结果”区域）

**验证点：**
- [ ] 出现上述日志（说明已携带高级上下文）
- [ ] 优化结果区域渲染稳定，无错误弹窗

---

### 步骤5：执行“测试”（Compare 模式）
**AI执行指导：**
- 在 TestAreaPanel 输入测试内容（system 模式下作为用户输入；user 模式可为空或自定义）
- 点击“开始测试”，先运行“原始”，再运行“优化”
- 若有工具调用：控制台会打印 `test tool call received`，或面板中出现“工具调用”列表（ToolCallDisplay）

**预期结果：**
- 两侧（或单列）结果区域更新，无异常
- 若模型触发工具调用，面板显示工具调用项

**验证点：**
- [ ] 测试启动与完成日志存在（如 `[App] original/optimized test completed`）
- [ ]（可选）展示工具调用列表或出现 `test tool call received` 日志

---

### 步骤6：一致性与替换校验
**AI执行指导：**
- 检查预览/缺失统计与测试时变量替换一致：
  - `name` 应为 Alice（上下文覆盖优先）
  - `scene` 应来自全局（GlobalName 未被用于场景）
  - 不应出现任何预定义变量名的覆盖项（如 `currentPrompt`）

**预期结果：**
- finalVars 合并策略生效：`final = global ∪ contextOverrides`，且剔除预定义名
- 预览、缺失统计、测试结果中的变量替换一致

**验证点：**
- [ ] ContextEditor 统计与实际替换一致
- [ ] 无预定义键覆盖项被保存

---

### 步骤7：导出校验（标准格式）
**AI执行指导：**
- 在 ContextEditor 中打开“导出”，选择“标准格式”
- 执行“复制到剪贴板”或“导出到文件”，解析 JSON：
  - `messages` 为数组
  - `metadata.variables` 含 `name/role/task/scene`
  - `tools[0].function.name === 'get_weather'`

**预期结果：**
- 导出结构完整，后续可用于导入

**验证点：**
- [ ] `messages.length >= 2`
- [ ] `metadata.variables` 包含本次配置
- [ ] `tools` 数组存在且含 `get_weather`

---

## 🧪 诊断建议（失败时）
- 未出现“advanced context”日志：确认已开启高级模式，且存在非空的 messages/variables/tools
- 测试无输出：检查模型可用性、网络与控制台错误
- 工具调用不展示：不强制要求触发；关注有无相关日志
- 变量优先级错误：检查全局与上下文覆盖是否同名，确认覆盖优先

---

## ✅ 成功标准
- 高级模式优化与测试可用且稳定
- variables/messages/tools 全链路生效
- 预览/缺失统计/测试替换一致
- 导出结构完整（含 tools 与变量元数据）

