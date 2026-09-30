# 上下文编辑器重构 - 需求文档

## 介绍

本规范定义了基于"主面板轻量管理 + 全屏编辑器深度管理"分工模式的上下文编辑器架构重构需求。通过分析ConversationManager.vue.backup和ConversationMessageEditor.vue的现有功能实现，确定需要保留的核心功能并重新分配到合适的组件中。

重构目标：
1. 移除ConversationMessageEditor和ConversationSection组件
2. 简化ConversationManager，保留轻量管理功能
3. 增强ContextEditor，承载所有复杂功能
4. 实现双向绑定的数据同步

## 与产品愿景的一致性

此重构支持提供直观AI提示词优化工具的核心产品愿景：
- 主界面保持简洁，专注核心工作流
- 复杂功能集中在专门界面，提供完整体验
- 数据实时同步，减少操作复杂度

## 功能分析和分配

### 从ConversationManager.vue.backup学到的功能
**已有功能：**
- ✅ 紧凑型头部标题和统计信息
- ✅ 变量统计（已用/缺失）和工具统计
- ✅ 快速模板下拉菜单
- ✅ 导入导出功能（带格式支持）
- ✅ 同步到测试功能（已移除需求）
- ✅ 折叠展开功能
- ✅ 使用ConversationMessageEditor进行列表展示
- ✅ 集成的添加消息功能

**需要重新分配：**
- 模板功能 → 移至ContextEditor
- 导入导出功能 → 移至ContextEditor
- 基础统计和编辑 → 保留在ConversationManager

### 从ConversationMessageEditor.vue学到的功能
**已有功能：**
- ✅ 紧凑行式布局
- ✅ 消息头部信息（序号、角色、变量统计）
- ✅ 预览切换功能
- ✅ 移动和删除操作
- ✅ 全屏编辑模态框
- ✅ 动态行数计算
- ✅ 变量检测和缺失提示
- ✅ 变量高亮预览

**需要整合：**
- 基础编辑功能 → 整合到ConversationManager内联编辑
- 全屏编辑模态框 → 移除（由ContextEditor替代）
- 预览功能 → 移至ContextEditor

### 当前ContextEditor已有的功能
**已有功能：**
- ✅ 模态框界面
- ✅ 标签页架构（消息编辑/工具管理）
- ✅ 完整的消息编辑功能
- ✅ 变量预览和替换
- ✅ 统计信息显示
- ✅ 可访问性支持

**缺失但需要添加：**
- ❌ 导入导出功能
- ❌ 模板选择和应用

## 需求

### 需求1：移除冗余组件

**用户故事：** 作为开发者，我希望移除冗余组件，这样代码库更简洁易维护。

#### 验收标准

1. 当完成重构后，系统应该不再包含ConversationMessageEditor组件
2. 当完成重构后，系统应该不再包含ConversationSection组件
3. 当检查导入导出时，系统应该不再导出这些移除的组件
4. 当检查使用时，所有对这些组件的引用都应该被替换

### 需求2：ConversationManager轻量化改造

**用户故事：** 作为用户，我希望主面板简洁高效，提供基础的消息管理功能。

#### 验收标准

1. 当查看标题区域时，ConversationManager应该显示紧凑的标题、消息数、变量数、缺失变量数统计
2. 当有消息时，ConversationManager应该显示简洁的消息列表，包含角色和内容预览
3. 当编辑消息时，ConversationManager应该提供内联的角色选择和文本输入
4. 当管理消息时，ConversationManager应该支持添加、删除、重新排序
5. 当空间不足时，ConversationManager应该支持折叠功能
6. 当需要高级功能时，ConversationManager应该提供"打开编辑器"按钮

### 需求3：移除重复的复杂功能

**用户故事：** 作为用户，我希望复杂功能不在主面板出现，避免界面混乱。

#### 验收标准

1. 当完成重构后，ConversationManager应该不包含快速模板下拉菜单
2. 当完成重构后，ConversationManager应该不包含导入导出按钮
3. 当完成重构后，ConversationManager应该不包含同步到测试功能
4. 当需要这些功能时，用户应该通过打开ContextEditor来访问

### 需求4：ContextEditor功能增强

**用户故事：** 作为用户，我希望在ContextEditor中获得所有复杂的上下文管理功能。

#### 验收标准

1. 当打开ContextEditor时，系统应该保持现有的标签页架构（消息编辑/工具管理）
2. 当需要模板时，ContextEditor应该提供完整的模板选择、预览和应用功能
3. 当需要导入导出时，ContextEditor应该提供多格式支持的导入导出功能
4. 当编辑消息时，ContextEditor应该提供完整的编辑、预览、变量高亮功能
5. 当处理变量时，ContextEditor应该集成变量管理功能

### 需求5：双向绑定数据同步

**用户故事：** 作为用户，我希望ConversationManager和ContextEditor之间数据实时同步，无需手动保存。

#### 验收标准

1. 当在ConversationManager修改消息时，如果ContextEditor同时打开，应该立即看到变化
2. 当在ContextEditor修改消息时，ConversationManager应该立即反映变化
3. 当在ContextEditor导入数据时，ConversationManager应该立即显示新数据
4. 当关闭ContextEditor时，不需要保存确认，所有修改都已实时生效
5. 当组件通信时，应该通过共享的响应式数据状态，而非事件传递

### 需求6：变量管理集成优化

**用户故事：** 作为用户，我希望变量功能在两个组件中合理分工。

#### 验收标准

1. 当在ConversationManager中时，系统应该显示变量统计和缺失变量警告
2. 当点击缺失变量时，ConversationManager应该发出createVariable事件
3. 当需要深度变量管理时，用户应该在ContextEditor中进行批量操作
4. 当变量更新时，两个组件都应该自动刷新相关统计和显示

### 需求7：保持现有成熟功能

**用户故事：** 作为用户，我希望重构不会丢失现有的成熟功能。

#### 验收标准

1. 当查看ContextEditor时，系统应该保持现有的可访问性支持
2. 当使用响应式功能时，系统应该保持现有的多设备适配
3. 当进行性能优化时，系统应该保持现有的渲染性能
4. 当处理用户交互时，系统应该保持现有的键盘导航和快捷键支持

## 技术实现要点

### ConversationManager简化重点
- 移除模板、导入导出、同步功能的UI元素
- 保留统计信息显示和基础消息管理
- 集成ConversationMessageEditor的基础编辑功能到内联编辑
- 保持折叠、打开高级编辑器等导航功能

### ContextEditor增强重点  
- 添加从ConversationManager.backup移植的模板选择功能
- 添加从ConversationManager.backup移植的导入导出功能
- 保持现有的标签页架构和编辑功能
- 确保与ConversationManager的数据双向绑定

### 数据绑定架构
- 使用Vue的响应式系统实现共享状态
- 两个组件操作同一数据源
- 通过v-model和computed实现双向同步
- 避免复杂的事件传递和数据拷贝

## 组件API设计

### ConversationManager Props
```typescript
interface ConversationManagerProps {
  // 双向绑定数据
  messages: ConversationMessage[]
  availableVariables?: Record<string, string>
  
  // 功能函数
  scanVariables?: (content: string) => string[]
  
  // UI控制
  size?: 'small' | 'medium' | 'large'
  collapsible?: boolean
  readonly?: boolean
  title?: string
}
```

### ConversationManager Emits  
```typescript
interface ConversationManagerEmits {
  'update:messages': [messages: ConversationMessage[]]
  'openContextEditor': []
  'createVariable': [name: string]
  'openVariableManager': [variableName?: string]
}
```

### ContextEditor增强功能
- 保持现有Props和Emits结构
- 添加模板管理相关方法
- 添加导入导出相关方法
- 确保与ConversationManager的数据绑定

## 非功能性需求

### 代码质量
- 清晰的组件职责分工
- 最小化组件间依赖
- 保持现有的代码质量标准

### 性能要求
- 保持现有的渲染性能
- 使用Vue响应式系统的性能优化
- 避免不必要的重渲染

### 用户体验
- 保持现有的交互体验
- 数据同步要及时自然
- 界面切换要流畅

### 兼容性
- 保持现有的浏览器兼容性
- 保持现有的可访问性支持
- 保持现有的响应式设计