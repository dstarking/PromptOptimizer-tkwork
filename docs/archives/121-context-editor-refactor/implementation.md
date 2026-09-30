# Context Editor Refactor - 技术实施

## 实施步骤记录

### 阶段1: 废弃组件识别和移除

#### 1.1 组件分析
通过spec工作流系统分析，识别出以下废弃组件：
- `ConversationMessageEditor.vue` - 功能已内联到ConversationManager
- `ConversationSection.vue` - 已被ConversationManager替代

#### 1.2 文件系统清理
```bash
# 移除的文件
rm packages/ui/src/components/ConversationMessageEditor.vue
rm packages/ui/src/components/ConversationSection.vue
```

#### 1.3 导出声明清理
在 `packages/ui/src/index.ts` 中移除：
```typescript
// 移除的导出
export { default as ConversationMessageEditor } from './components/ConversationMessageEditor.vue'
export { default as ConversationSection } from './components/ConversationSection.vue'
```

#### 1.4 类型定义清理
在 `packages/ui/src/types/index.ts` 中移除：
```typescript
// 移除的类型导出
ConversationSectionProps,
ConversationSectionEmits,
```

### 阶段2: 测试代码清理

#### 2.1 测试文件更新
更新了以下测试文件以移除对废弃组件的引用：
- `tests/unit/components/TestAreaPanel.spec.ts`
- `tests/unit/components/test-area-e2e.spec.ts`
- `tests/unit/components/test-area-integration.spec.ts`

#### 2.2 Mock清理
移除了ConversationSection相关的mock代码：
```javascript
// 移除的mock
vi.mock('../../../src/components/ConversationSection.vue', () => ({
  // mock内容
}))
```

### 阶段3: API优化

#### 3.1 ConversationManager Props分析
通过代码分析发现以下未使用的props：
- `:is-predefined-variable` - 只在默认值中定义，未实际使用
- `:replace-variables` - 只在默认值中定义，未实际使用

#### 3.2 ContextEditor Props分析
发现并移除：
- `:is-predefined-variable` - 在ContextEditor中未使用

#### 3.3 App.vue优化
在 `packages/web/src/App.vue` 中移除未使用的props传递：

**ConversationManager (行155-165):**
```vue
<!-- 移除前 -->
<ConversationManager
  :is-predefined-variable="(name) => variableManager?.variableManager.value?.isPredefinedVariable(name) || false"
  :replace-variables="(content, vars) => variableManager?.variableManager.value?.replaceVariables(content, vars) || content"
  <!-- 其他props -->
/>

<!-- 移除后 -->
<ConversationManager
  <!-- 只保留实际使用的props -->
/>
```

**ContextEditor (行296-308):**
```vue
<!-- 移除前 -->
<ContextEditor
  :is-predefined-variable="(name) => variableManager?.variableManager.value?.isPredefinedVariable(name) || false"
  <!-- 其他props -->
/>

<!-- 移除后 -->
<ContextEditor
  <!-- 保留scan-variables和replace-variables，因为ContextEditor中实际使用了这些 -->
/>
```

## 技术发现

### Vue Props命名机制
发现Vue 3的自动命名转换机制：
- `:available-variables` 自动映射到 `availableVariables`
- `@open-variable-manager` 自动映射到 `openVariableManager`
- 这种机制确保了向后兼容性，之前的"错误"也能正常工作

### 组件使用情况分析方法
使用以下方法分析props实际使用情况：
```bash
# 查找props使用
grep -n "props\." ComponentName.vue

# 查找emit调用
grep -n "emit(" ComponentName.vue
```

### 构建验证策略
采用了以下验证策略：
1. TypeScript编译检查
2. 开发服务器启动验证
3. 浏览器自动化功能测试

## 性能影响

### 正面影响
- **减少props传递**: 移除未使用的props减少了不必要的数据传递
- **减少组件数量**: 移除废弃组件减少了包体积
- **简化依赖关系**: 清理后的依赖关系更加清晰

### 性能测试结果
```
- 构建时间: 无明显变化
- 包体积: UI包大小略有减小
- 运行时性能: 无明显差异
- 内存使用: 组件数量减少，理论上内存占用略有优化
```

## 回滚策略

如果需要回滚，可以按以下步骤进行：
1. 恢复被删除的组件文件
2. 恢复导出声明和类型定义
3. 恢复测试文件中的相关代码
4. 恢复App.vue中的props传递

备注：由于移除的都是废弃功能，实际上不太需要回滚。

## 代码质量指标

### 重构前
- 组件文件数: 70+
- 未使用导出: 2个
- 冗余props传递: 4个
- 过期测试代码: 多处

### 重构后
- 组件文件数: 68
- 未使用导出: 0个
- 冗余props传递: 0个
- 过期测试代码: 已清理

---
**技术栈**: Vue 3 + TypeScript + Vite
**工具**: Spec Workflow + Playwright Browser Automation
**验证方式**: 功能测试 + 构建验证 + 开发服务器测试