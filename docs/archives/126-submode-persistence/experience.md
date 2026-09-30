# 子模式持久化 - 经验总结

## 💡 核心经验

### 1. 状态隔离的重要性

**关键洞察（来自用户）**:
> "基础模式也应该有自己的存储，这个也应该分开...因为这两个功能模式本质上控制的是不同的，只是当前他们的子模式碰巧都叫 系统/用户提示词优化而已。"

**经验总结**:
- ✅ **名称相同 ≠ 状态共享**: 即使子模式名称相同（如都叫"系统/用户"），也应该独立存储
- ✅ **功能模式是第一维度**: 不同的功能模式代表不同的使用场景
- ✅ **用户心智模型**: 用户期望每个功能模式"记住"自己上次的选择

**反模式**:
```typescript
// ❌ 错误: 共享状态
const selectedOptimizationMode = ref<'system' | 'user'>('system')

// 基础模式和上下文模式都使用同一个变量
// 导致切换功能模式时状态混乱
```

**最佳实践**:
```typescript
// ✅ 正确: 完全独立的状态
const { basicSubMode } = useBasicSubMode(services)
const { proSubMode } = useProSubMode(services)

// 各自独立存储，互不影响
```

---

### 2. 单例模式的正确使用

**问题背景**: Composable可能被多次调用，如何确保状态唯一？

**解决方案**:
```typescript
let singleton: {
  mode: Ref<SubModeType>
  initialized: boolean
  initializing: Promise<void> | null
} | null = null

export function useSubMode(services: Ref<AppServices | null>) {
  if (!singleton) {
    singleton = { 
      mode: ref<SubModeType>('default'), 
      initialized: false, 
      initializing: null 
    }
  }
  // ...
}
```

**关键点**:
1. **模块级变量**: `singleton` 在模块作用域，确保全局唯一
2. **惰性初始化**: 首次调用时创建
3. **状态共享**: 后续调用返回同一个状态引用

**常见陷阱**:
```typescript
// ❌ 错误: 每次调用都创建新状态
export function useSubMode() {
  const mode = ref('default')  // 每次都是新的！
  // ...
}
```

---

### 3. 异步初始化的防抖处理

**问题**: 如果多个组件同时调用 `ensureInitialized()`，会导致重复读取存储。

**解决方案**:
```typescript
const ensureInitialized = async () => {
  // 第一层防护：已初始化
  if (singleton!.initialized) return
  
  // 第二层防护：正在初始化（防抖）
  if (singleton!.initializing) {
    await singleton!.initializing
    return
  }
  
  // 记录初始化Promise
  singleton!.initializing = (async () => {
    try {
      // 实际初始化逻辑
    } finally {
      singleton!.initialized = true
      singleton!.initializing = null
    }
  })()
  
  await singleton!.initializing
}
```

**关键机制**:
1. **双重检查**: `initialized` + `initializing`
2. **Promise共享**: 多个调用者等待同一个Promise
3. **finally保证**: 无论成功失败都清理状态

---

### 4. 只读状态暴露模式

**为什么需要只读?**
- 防止外部直接修改状态
- 强制通过setter进行更新（便于持久化）
- 更好的代码可维护性

**实现方式**:
```typescript
import { readonly } from 'vue'

return {
  // ✅ 只读: 外部不能直接修改
  basicSubMode: readonly(singleton.mode) as Ref<BasicSubMode>,
  
  // ✅ 修改器: 通过setter更新并持久化
  setBasicSubMode: async (mode: BasicSubMode) => {
    singleton!.mode.value = mode
    await setPreference(STORAGE_KEY, mode)
  }
}
```

**避免的陷阱**:
```typescript
// ❌ 错误: 直接暴露可写状态
return {
  basicSubMode: singleton.mode,  // 外部可以直接修改！
  // ...
}

// 导致问题:
basicSubMode.value = 'user'  // 修改了状态但没有持久化！
```

---

### 5. 跨组件通信策略

**场景**: 导航栏的选择器在 App.vue，但 ImageWorkspace 内部需要知道切换事件。

**方案对比**:

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| Props传递 | 简单直接 | 组件耦合高 | 父子组件 |
| Provide/Inject | 解耦 | 需要共同父组件 | 深层嵌套 |
| 自定义事件 | 完全解耦 | 需要手动管理 | 跨层级通信 |
| Composable共享 | 类型安全 | 需要单例模式 | 全局状态 |

**本项目选择**:
- **导航栏→App.vue**: Composable共享状态
- **App.vue→ImageWorkspace**: 自定义事件

**自定义事件实现**:
```typescript
// 发送端（App.vue）
window.dispatchEvent(new CustomEvent("image-submode-changed", { 
  detail: { mode } 
}))

// 接收端（ImageWorkspace.vue）
const handleImageSubModeChanged = (e: CustomEvent) => {
  const { mode } = e.detail
  if (mode && mode !== imageMode.value) {
    handleImageModeChange(mode)
  }
}

onMounted(() => {
  window.addEventListener("image-submode-changed", handleImageSubModeChanged as EventListener)
})

onBeforeUnmount(() => {
  window.removeEventListener("image-submode-changed", handleImageSubModeChanged as EventListener)
})
```

---

### 6. 双层状态同步问题

**问题发现**: 图像模式刷新后文件上传按钮不显示

**原因分析**:
```
导航栏层 (App.vue + useImageSubMode)
  ✅ 从 UI_SETTINGS_KEYS.IMAGE_SUB_MODE 恢复
  ✅ 导航栏显示正确
  
组件内部层 (ImageWorkspace + useImageWorkspace)
  ❌ 没有从存储恢复
  ❌ 始终使用硬编码默认值 'text2image'
  ❌ v-if="imageMode === 'image2image'" 永远为 false
```

**解决方案**: 两层都从同一个存储键恢复
```typescript
// useImageWorkspace.ts
const restoreSelections = async () => {
  // ... 其他恢复 ...
  
  // ✅ 从全局存储恢复
  const savedImageMode = await getPreference(
    UI_SETTINGS_KEYS.IMAGE_SUB_MODE,  // 与导航栏使用同一个键！
    "text2image",
  )
  if (savedImageMode === "text2image" || savedImageMode === "image2image") {
    state.imageMode = savedImageMode
  }
}
```

**经验教训**:
- ✅ **统一数据源**: 所有层级都从同一个存储键读取
- ✅ **初始化检查**: 确保所有使用状态的地方都正确初始化
- ✅ **日志追踪**: 在初始化和切换时输出日志，便于发现问题

---

### 7. 向后兼容策略

**挑战**: 现有代码大量使用 `selectedOptimizationMode` 和 `contextMode`

**策略**: 保留旧变量，与新Composable同步

```typescript
// 新状态
const { basicSubMode, setBasicSubMode } = useBasicSubMode(services)
const { proSubMode, setProSubMode } = useProSubMode(services)

// 旧变量（保留兼容）
const selectedOptimizationMode = ref<OptimizationMode>("system")

// 切换时同步
const handleBasicSubModeChange = async (mode: OptimizationMode) => {
  await setBasicSubMode(mode as BasicSubMode)
  selectedOptimizationMode.value = mode  // ✅ 同步旧变量
}
```

**优点**:
1. 降低重构风险
2. 平滑升级
3. 避免大范围改动

**长期计划**:
- 逐步迁移使用处到新API
- 最终废弃旧变量

---

## 🎯 设计模式总结

### 1. 单例模式 (Singleton Pattern)
**用途**: 确保全局唯一状态  
**实现**: 模块级变量 + 惰性初始化

### 2. 代理模式 (Proxy Pattern)
**用途**: 控制状态访问  
**实现**: readonly() 包装 + setter方法

### 3. 观察者模式 (Observer Pattern)
**用途**: 跨组件通信  
**实现**: 自定义事件 + addEventListener

### 4. 策略模式 (Strategy Pattern)
**用途**: 根据功能模式选择不同处理  
**实现**: if-else分支 + 独立的Composable

---

## 🚫 常见陷阱

### 陷阱1: 忘记初始化
```typescript
// ❌ 错误
const { basicSubMode, setBasicSubMode } = useBasicSubMode(services)
setBasicSubMode('user')  // 可能在初始化前调用！

// ✅ 正确
const { basicSubMode, setBasicSubMode, ensureInitialized } = useBasicSubMode(services)
await ensureInitialized()  // 先初始化
await setBasicSubMode('user')
```

### 陷阱2: 直接修改只读状态
```typescript
// ❌ 错误
basicSubMode.value = 'user'  // TypeScript会报错！

// ✅ 正确
await setBasicSubMode('user')
```

### 陷阱3: 忘记清理事件监听
```typescript
// ❌ 错误: 只注册不清理
onMounted(() => {
  window.addEventListener("event", handler)
})

// ✅ 正确: 清理避免内存泄漏
onMounted(() => {
  window.addEventListener("event", handler)
})
onBeforeUnmount(() => {
  window.removeEventListener("event", handler)
})
```

### 陷阱4: 状态类型混淆
```typescript
// ❌ 错误: 类型混用
const mode: ProSubMode = basicSubMode.value  // 类型不匹配！

// ✅ 正确: 类型转换
const mode = basicSubMode.value as OptimizationMode
```

---

## 📊 性能考虑

### 1. 初始化性能
- ✅ **异步加载**: 不阻塞应用启动
- ✅ **防抖机制**: 避免重复读取
- ✅ **单次读取**: localStorage读取很快，无需缓存

### 2. 切换性能
- ✅ **响应式更新**: Vue自动处理，几乎无开销
- ✅ **局部更新**: 只更新相关组件
- ✅ **异步持久化**: 不阻塞UI

### 3. 内存占用
- ✅ **单例模式**: 只有一个状态实例
- ✅ **轻量数据**: 只存储字符串值
- ✅ **事件清理**: 避免内存泄漏

---

## 🧪 测试经验

### 测试策略
1. **单元测试**: Composable的核心逻辑
2. **集成测试**: App.vue的初始化和切换
3. **手动测试**: 实际使用场景验证

### 关键测试场景
1. ✅ 首次使用（无存储数据）
2. ✅ 刷新页面后状态保持
3. ✅ 功能模式切换时各自恢复
4. ✅ 独立性验证（基础/上下文不互相影响）
5. ✅ 历史记录恢复
6. ✅ 收藏恢复

### 调试技巧
1. **日志输出**: 每个关键操作都输出日志
2. **localStorage检查**: 浏览器开发工具查看存储
3. **响应式追踪**: Vue DevTools查看状态变化

---

## 📝 文档化经验

### 1. 渐进式文档
- **v1.0**: 初始设计（仅上下文模式）
- **v2.0**: 添加基础模式
- **v3.0**: 添加图像模式
- **v4.0**: 完成并归档

### 2. 记录决策
- 用户的关键洞察要高亮
- 技术决策要说明理由
- 遇到的问题要记录原因和解决方案

### 3. 代码示例
- 提供完整的代码片段
- 标注关键行
- 对比正确和错误的写法

---

## 🎓 可复用经验

### 适用场景
本架构适用于以下场景:
1. **多模式应用**: 有多个独立的功能模式
2. **状态持久化**: 需要记住用户选择
3. **全局状态**: 需要在多个组件间共享
4. **类型安全**: TypeScript项目

### 扩展建议
添加新功能模式时:
1. 在 `storage-keys.ts` 添加存储键
2. 在 `types.ts` 定义类型
3. 创建对应的 `useXxxSubMode.ts`
4. 在 App.vue 中集成
5. 添加测试验证

---

## 💡 关键建议

### 给开发者
1. ✅ **状态隔离优于共享**: 默认独立存储，除非有明确的共享需求
2. ✅ **单例模式解决重复**: 需要全局状态时使用单例模式
3. ✅ **异步初始化**: 避免阻塞应用启动
4. ✅ **只读状态**: 防止意外修改，强制通过setter
5. ✅ **完善日志**: 便于调试和问题排查

### 给架构师
1. ✅ **用户心智模型第一**: 技术实现要符合用户直觉
2. ✅ **向后兼容**: 重构时保留旧接口，平滑升级
3. ✅ **防御式编程**: 完善的错误处理和回退机制
4. ✅ **文档跟进**: 及时记录设计决策和演进过程

---

## 🔮 未来改进

### 短期（已完成）
- ✅ 三种模式全部独立持久化
- ✅ 统一的导航栏UI
- ✅ 修复图像模式初始化问题

### 中期（待讨论）
- 🔄 废弃 `selectedOptimizationMode` 变量
- 🔄 统一 `contextMode` 和 `proSubMode`
- 🔄 术语统一（OptimizationMode → SubMode）

### 长期（可选）
- 💡 支持更多功能模式
- 💡 子模式配置化（通过配置文件定义）
- 💡 更细粒度的持久化控制

---

**文档版本**: v1.0  
**最后更新**: 2025-10-22  
**贡献者**: Claude & 用户
