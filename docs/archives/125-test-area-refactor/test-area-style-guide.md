# 测试区域组件样式规范

本文档定义测试区域重构组件的统一样式规范，确保与Naive UI设计系统和左侧优化区域的视觉一致性。

## 基础样式原则

### 1. 间距系统 (Spacing System)

- **主要间距**: `NSpace vertical :size="16"` - 用于组件间的主要分隔
- **次要间距**: `NSpace vertical :size="8"` - 用于组件内部元素的分隔  
- **紧密间距**: `NFlex :size="12"` - 用于按钮组或相关控件
- **最小间距**: `NFlex :size="8"` - 用于密集布局的元素

### 2. 文本样式 (Typography)

```vue
<!-- 主标题 (18px, 深度1) -->
<NText :depth="1" style="font-size: 18px; font-weight: 500;">主标题</NText>

<!-- 副标题/标签 (14px, 深度2) -->
<NText :depth="2" style="font-size: 14px; font-weight: 500;">标签文本</NText>

<!-- 帮助文本 (12px, 深度3) -->
<NText :depth="3" style="font-size: 12px;">帮助说明</NText>

<!-- 卡片标题 (16px, 加粗) -->
<NText style="font-size: 16px; font-weight: 600;">卡片标题</NText>
```

### 3. 布局系统 (Layout System)

#### NFlex 布局
```vue
<!-- 水平布局 -->
<NFlex justify="space-between" align="center" :wrap="false">

<!-- 垂直布局 -->
<NFlex vertical :style="{ height: '100%' }">

<!-- 按钮组布局 -->
<NFlex align="center" :size="8">
```

#### NGrid 响应式布局
```vue
<NGrid :cols="24" :x-gap="12" responsive="screen">
  <NGridItem :span="8" :xs="24" :sm="8">
    <!-- 内容 -->
  </NGridItem>
</NGrid>
```

### 4. 高度管理 (Height Management)

```vue
<!-- 固定高度容器 -->
:style="{ height: '100%' }"

<!-- 弹性收缩控制 -->
:style="{ flexShrink: 0 }"

<!-- 填充剩余空间 -->
:style="{ flex: 1, minHeight: 0 }"
```

## 组件特定规范

### TestInputSection
- 使用 `NSpace vertical :size="8"` 作为主容器
- 标题使用 `depth="2"`, `14px`, `font-weight: 500`
- 帮助文本使用 `depth="3"`, `12px`
- 全屏按钮样式：`type="tertiary"`, `size="small"`, `ghost`, `round`

### TestControlBar  
- 基于 `NGrid :cols="24" :x-gap="12"` 响应式布局
- 标签文本遵循副标题规范
- 按钮间距使用 `:size="8"`
- 主要按钮 `type="primary"`，次要按钮 `type="default"`

### ConversationSection
- 使用 `NCard size="small"` 作为容器
- 折叠状态通过 `NCollapse` 管理
- 最大高度通过 props 配置，避免硬编码

### TestResultSection
- 对比模式使用 `NFlex` 水平布局，间距 `gap: 12px`
- 卡片标题使用 `16px`, `font-weight: 600`
- 单一模式占满容器高度

### TestAreaPanel
- 根容器使用 `NFlex vertical`
- 边距统一使用 `marginBottom: '16px'`
- 避免所有Tailwind CSS类，纯Naive UI实现

## 禁止项 (Forbidden Practices)

### ❌ 硬编码像素值
```vue
<!-- 错误 -->
<div style="height: 200px; margin-bottom: 20px;">

<!-- 正确 -->
<div :style="{ marginBottom: '16px' }">
```

### ❌ Tailwind CSS类
```vue
<!-- 错误 -->
<div class="flex flex-col h-full mb-4">

<!-- 正确 -->
<NFlex vertical :style="{ height: '100%', marginBottom: '16px' }">
```

### ❌ 原生HTML元素布局
```vue
<!-- 错误 -->
<div class="grid grid-cols-2 gap-4">

<!-- 正确 -->
<NGrid :cols="2" :x-gap="16">
```

## 响应式断点

遵循Naive UI响应式系统：
- `xs`: < 576px (手机)
- `sm`: 576px (小屏幕)  
- `md`: 768px (平板)
- `lg`: 992px (桌面)
- `xl`: 1200px (大屏幕)
- `xxl`: 1600px (超大屏幕)

## 主题兼容性

所有组件必须兼容：
- 亮色主题 / 暗色主题
- Naive UI主题变量系统
- 动态主题切换

## 验证清单

组件样式验证清单：
- [ ] 无硬编码像素值
- [ ] 无Tailwind CSS类
- [ ] 使用Naive UI spacing系统
- [ ] 文本样式符合规范
- [ ] 响应式布局正确
- [ ] 主题兼容性测试通过
- [ ] 与左侧优化区域视觉一致