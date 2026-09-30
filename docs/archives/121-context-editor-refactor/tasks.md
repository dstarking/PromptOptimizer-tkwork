# 上下文编辑器重构 - 任务分解（工程优化版）

## 阶段1：ConversationManager轻量化确认与增强

### 1.1 现状分析和API对齐

- [x] 1.1.1 确认ConversationManager当前状态
  - File: packages/ui/src/components/ConversationManager.vue
  - 确认现版已无快速模板/导入导出/同步到测试UI元素
  - 确认当前已实现v-model + update:messages的双向绑定
  - 分析现有功能与需求设计的对齐程度
  - Purpose: 明确当前基线，避免不必要的修改
  - _Leverage: 现有ConversationManager.vue实现_
  - _Requirements: 需求2_

- [x] 1.1.2 更新ConversationManager的类型定义
  - File: packages/ui/src/types/components.ts
  - 明确类型与默认值策略：将scanVariables/replaceVariables/isPredefinedVariable改为可选
  - 统一maxHeight为number类型，避免字符串拼接错误
  - 审查使用maxHeight参与运算的地方，确保px拼接逻辑正确
  - 确保类型定义与实际API使用一致
  - Purpose: 规范API接口，解决类型与实现一致性问题
  - _Leverage: 现有types/components.ts_
  - _Requirements: API设计规范_

### 1.2 ConversationManager功能增强

- [x] 1.2.1 确认轻量化UI设计已到位
  - File: packages/ui/src/components/ConversationManager.vue
  - 确认现版已无模板/导入导出/同步到测试UI元素
  - 制定未来开发规范：不要在Manager中重新添加这些复杂功能入口
  - 验证当前UI符合轻量化设计要求
  - Purpose: 维护轻量化架构设计
  - _Leverage: 现有简化后的UI结构_
  - _Requirements: 需求2, 需求3_

- [x] 1.2.2 增强内联编辑体验（轻量化边界）
  - File: packages/ui/src/components/ConversationManager.vue
  - 优先使用NInput.autosize({ minRows, maxRows })满足80%场景
  - 增强缺失变量的行内提示：保持克制（小tag + hover详情），避免过度复杂
  - 必要时再补充精细动态行数优化，避免复杂化
  - 优化角色选择和文本输入的交互体验
  - Purpose: 提升基础编辑功能的用户体验，保持轻量化
  - _Leverage: NInput.autosize + ConversationMessageEditor.vue的编辑逻辑参考_
  - _Requirements: 需求2_

- [x] 1.2.3 保持现有数据绑定模式
  - File: packages/ui/src/components/ConversationManager.vue
  - 保持当前的v-model + update:messages模式
  - 确认props和events的正确性
  - 不要改为直接操作父级ref
  - Purpose: 维护Vue最佳实践的数据流模式
  - _Leverage: 现有的数据绑定实现_
  - _Requirements: 需求5_

### 1.3 函数默认值实现

- [x] 1.3.1 为功能函数提供合理的默认实现
  - File: packages/ui/src/components/ConversationManager.vue
  - 使用withDefaults为可选props提供默认实现：
    - scanVariables: 默认返回空数组
    - replaceVariables: 默认内容透传
    - isPredefinedVariable: 默认返回false
  - 确保默认实现与类型定义一致（可选类型 + withDefaults）
  - Purpose: 解决类型与实现一致性，提供函数props的降级支持
  - _Leverage: 现有变量处理逻辑_
  - _Requirements: API设计规范_

### 1.4 测试更新

- [x] 1.4.1 更新ConversationManager单元测试
  - File: packages/ui/tests/unit/components/ConversationManager.spec.ts
  - 更新测试用例以匹配当前API
  - 添加默认函数实现的测试
  - 验证增强的内联编辑功能
  - Purpose: 确保功能的正确性和稳定性
  - _Leverage: 现有测试框架_
  - _Requirements: 需求2_

## 阶段2：ContextEditor功能迁移与增强

### 2.1 父级传参配置（提前进行，便于联调）

- [x] 2.1.1 更新父组件向ContextEditor传递optimizationMode
  - File: packages/web/src/App.vue (和其他使用ContextEditor的地方)
  - 在ContextEditor调用处添加optimizationMode参数
  - 确保参数从父级正确传递到ContextEditor
  - Purpose: 为模板筛选功能提前建立完整链路，便于后续开发联调
  - _Leverage: 现有的父级状态管理_
  - _Requirements: 需求4_

### 2.2 模板管理功能迁移

- [x] 2.2.1 分析backup组件的模板管理实现
  - File: packages/ui/src/components/ConversationManager.vue.backup
  - 提取quickTemplateManager的使用方式
  - 分析模板选择、预览、应用的UI和逻辑
  - 理解按optimizationMode和语言分类的实现
  - Purpose: 准备模板功能的迁移工作
  - _Leverage: ConversationManager.vue.backup:420-469行的模板功能_
  - _Requirements: 需求4_

- [x] 2.2.2 在ContextEditor中实现模板管理
  - File: packages/ui/src/components/ContextEditor.vue
  - 添加模板管理功能区域（可作为新标签页）
  - 实现模板列表显示和分类
  - 实现模板预览和应用功能
  - 利用前面配置的optimizationMode参数进行筛选
  - Purpose: 将模板功能迁移到ContextEditor，完整打通链路
  - _Leverage: 现有ContextEditor标签页架构 + optimizationMode参数_
  - _Requirements: 需求4_

- [x] 2.2.3 添加optimizationMode参数支持到ContextEditor
  - File: packages/ui/src/components/ContextEditor.vue
  - 在Props中添加optimizationMode?: 'system' | 'user'
  - 根据模式过滤和分类显示模板
  - 确保模板筛选的正确性
  - Purpose: 实现基于模式的模板分类
  - _Leverage: 现有模板分类逻辑 + 前面配置的父级传参_
  - _Requirements: API设计规范_

### 2.3 导入导出功能迁移

- [x] 2.3.1 分析现有useContextEditor的导入导出能力
  - File: packages/ui/src/composables/useContextEditor.ts
  - 确认smartImport/convertFromOpenAI/convertFromLangFuse/convertFromConversation方法
  - 确认importFromFile/exportToFile文件操作方法
  - 理解现有错误处理和校验机制
  - Purpose: 了解可复用的现有导入导出能力
  - _Leverage: useContextEditor composable的现有实现_
  - _Requirements: 需求4_

- [x] 2.3.2 在ContextEditor中实现导入导出功能
  - File: packages/ui/src/components/ContextEditor.vue
  - 在底部操作栏或新区域添加导入导出入口
  - 复用useContextEditor的现有方法：smartImport/convertFromOpenAI/convertFromLangFuse/convertFromConversation
  - 复用importFromFile/exportToFile进行文件操作
  - 明确优先级：先支持JSON/OpenAI/LangFuse/Conversation；CSV/TXT排期后续（不阻塞主流程）
  - Purpose: 将导入导出功能迁移到ContextEditor，复用现有逻辑
  - _Leverage: useContextEditor composable的现有实现_
  - _Requirements: 需求4_

### 2.4 ContextEditor数据同步对齐

- [x] 2.4.1 确保ContextEditor的实时状态同步
  - File: packages/ui/src/components/ContextEditor.vue
  - 保持"编辑即emit update:state → 父级更新共享ref → Manager实时反映"的同步模式
  - 确保ContextEditor及时emit update:state事件
  - 验证父级能正确接收并更新optimizationContext
  - 验证ConversationManager通过v-model能看到变化
  - Purpose: 完善两组件间的数据同步机制，保持现有架构
  - _Leverage: 现有的父级状态管理机制_
  - _Requirements: 需求5_

### 2.5 ContextEditor功能测试

- [x] 2.5.1 为新增功能编写测试
  - File: packages/ui/tests/unit/components/ContextEditor.spec.ts
  - 为模板管理功能编写测试用例
  - 为导入导出功能编写测试用例（复用useContextEditor的测试模式）
  - 为optimizationMode参数传递编写测试
  - Purpose: 确保迁移功能的稳定性
  - _Leverage: 现有测试工具和useContextEditor测试参考_
  - _Requirements: 需求4_

## 阶段3：集成验证与优化

### 3.1 数据同步完整性验证

- [x] 3.1.1 验证Manager和Editor的数据同步
  - File: packages/ui/tests/integration/context-editor-sync.spec.ts
  - 测试ConversationManager修改数据，ContextEditor实时反映
  - 测试ContextEditor修改数据，ConversationManager实时反映
  - 测试模板应用、导入导出对数据同步的影响
  - 验证"编辑即emit → 父级更新 → 实时反映"的完整链路
  - Purpose: 验证双向数据同步的正确性
  - _Leverage: 现有父级状态管理和v-model机制_
  - _Requirements: 需求5_

### 3.2 变量管理协作优化

- [x] 3.2.1 优化变量管理的跨组件协作
  - File: packages/ui/src/components/ConversationManager.vue & ContextEditor.vue
  - 确保两组件使用一致的变量处理函数
  - 优化缺失变量提示和快速创建流程
  - 验证变量管理器的事件通信正确性
  - Purpose: 完善变量管理的用户体验
  - _Leverage: 现有变量管理系统_
  - _Requirements: 需求6_

### 3.3 性能优化

- [-] 3.3.1 优化组件渲染和数据处理性能
  - File: 相关组件文件
  - 使用shallowRef等优化大数据渲染
  - 添加防抖处理避免频繁更新
  - 优化模板和导入导出的懒加载
  - Purpose: 确保重构后的性能表现
  - _Leverage: Vue 3性能优化技术_
  - _Requirements: 性能考虑_

### 3.4 端到端验证

- [x] 3.4.1 完整用户流程测试
  - File: packages/ui/tests/e2e/context-editor-refactor.spec.ts
  - 测试轻量管理到深度编辑的完整流程
  - 测试模板选择和应用的用户体验
  - 测试导入导出和格式转换功能（JSON/OpenAI/LangFuse/Conversation）
  - 测试变量管理的跨组件协作
  - Purpose: 验证整个重构系统的用户体验
  - _Leverage: E2E测试工具_
  - _Requirements: 所有需求_

## 阶段4：废弃组件清理

### 4.1 功能完整性最终确认

- [x] 4.1.1 对比验证功能完整性
  - File: 创建功能对比验证清单
  - 对比新系统与原有backup组件的功能完整性
  - 确认没有功能丢失或体验降级
  - 记录验证结果和任何需要修正的问题
  - Purpose: 确保清理前所有功能都已正确迁移
  - _Leverage: 需求文档和原有组件_
  - _Requirements: 所有需求_

### 4.2 清理废弃文件和引用

- [ ] 4.2.1 删除ConversationMessageEditor.vue和ConversationSection.vue
  - File: packages/ui/src/components/ConversationMessageEditor.vue & ConversationSection.vue
  - 确认所有功能已迁移后删除这两个组件文件
  - 删除相关的单元测试文件
  - Purpose: 清理废弃的组件文件
  - _Leverage: 版本控制系统_
  - _Requirements: 需求1_

- [ ] 4.2.2 更新组件导出配置
  - File: packages/ui/src/index.ts
  - 从导出列表中移除ConversationMessageEditor和ConversationSection
  - 更新类型导出配置
  - Purpose: 清理对外API接口
  - _Leverage: 现有导出配置_
  - _Requirements: 需求1_

### 4.3 清理测试和引用

- [ ] 4.3.1 清理测试中的废弃组件引用
  - File: 相关测试文件
  - 移除测试中对ConversationSection的mock
  - 修正任何对废弃组件的引用
  - Purpose: 清理测试环境中的废弃引用
  - _Leverage: 测试框架_
  - _Requirements: 需求1_

- [ ] 4.3.2 更新Web App中的无效props和事件
  - File: packages/web/src/App.vue
  - 移除ConversationManager的无效props（optimization-mode、compact-mode）
  - 移除无效事件绑定（@create-variable等）
  - Purpose: 清理父级组件中的废弃API调用
  - _Leverage: packages/web/src/App.vue:155行附近_
  - _Requirements: API清理_

### 4.4 最终验证

- [ ] 4.4.1 执行完整回归测试
  - File: 运行完整测试套件
  - 执行所有单元测试，确保100%通过
  - 执行集成测试和E2E测试
  - 修复发现的任何问题
  - Purpose: 确保清理后系统的完整稳定性
  - _Leverage: 完整测试框架_
  - _Requirements: 所有需求_

- [ ] 4.4.2 更新相关文档
  - File: 相关开发文档
  - 更新组件使用文档，移除废弃组件说明
  - 更新API文档，反映新的接口设计
  - 记录重构经验和最佳实践
  - Purpose: 保持文档与代码同步
  - _Leverage: 现有文档系统_
  - _Requirements: 文档维护_

## 关键检查点和验收标准

### 阶段1完成检查
- [ ] ConversationManager现状确认完成，无不必要的修改
- [ ] 类型定义与默认值实现一致性解决（可选类型 + withDefaults）
- [ ] maxHeight类型统一为number，px拼接逻辑正确
- [ ] 内联编辑增强保持轻量化边界（NInput.autosize优先）
- [ ] 数据绑定保持Vue最佳实践

### 阶段2完成检查
- [ ] optimizationMode参数传递链路提前建立
- [ ] 模板管理功能成功迁移到ContextEditor，联调完整
- [ ] 导入导出功能完整迁移，复用useContextEditor现有能力
- [ ] 优先格式（JSON/OpenAI/LangFuse/Conversation）全部支持
- [ ] ContextEditor的状态同步机制正常工作

### 阶段3完成检查
- [ ] Manager和Editor的数据双向同步完全正常
- [ ] 变量管理跨组件协作体验良好
- [ ] 系统性能达到预期要求
- [ ] 端到端用户流程测试全部通过

### 阶段4完成检查
- [ ] 功能完整性验证通过，无功能丢失
- [ ] 废弃组件和引用完全清理
- [ ] 回归测试全部通过
- [ ] 相关文档更新完成

## 工程优化要点

### 类型与实现一致性策略
```typescript
// 推荐：可选类型 + withDefaults
interface Props {
  scanVariables?: (content: string) => string[]
}

const props = withDefaults(defineProps<Props>(), {
  scanVariables: () => []
})
```

### maxHeight处理策略
```typescript
// 统一为number类型，组件内部拼接px
interface Props {
  maxHeight?: number  // 而不是 number | string
}

// 组件内部
const style = computed(() => ({
  maxHeight: props.maxHeight ? `${props.maxHeight}px` : undefined
}))
```

### 轻量化边界控制
```vue
<!-- 优先使用NInput自带能力 -->
<NInput 
  :autosize="{ minRows: 1, maxRows: 3 }" 
  @update:value="handleUpdate"
/>

<!-- 缺失变量提示保持克制 -->
<NTag v-if="missingCount > 0" size="small" type="warning">
  缺失: {{ missingCount }}
</NTag>
```

### 任务时序优化
- 2.1.1 提前配置optimizationMode传参
- 2.2.2 依赖2.1.1的参数进行模板联调
- 避免开发时链路不完整的问题

这些都是非常务实的工程优化建议，避免了常见的类型不一致、字符串拼接错误、开发联调困难等问题。