# ImageModelEditModal 一体化界面改进方案

## 设计原则

### 1. 保持一致性
- 与文本模型管理界面的设计风格保持一致
- 遵循相同的表单布局和交互模式
- 统一的操作流程和用户体验

### 2. 信息分组而非分步
- 将相关配置项进行逻辑分组
- 使用视觉分隔（分割线、卡片）而非步骤导航
- 所有信息在一个滚动界面中呈现

### 3. 智能交互
- 根据选择动态显示相关配置项
- 提供实时验证和反馈
- 支持快速测试和预览

## 新界面结构

```vue
<template>
  <NModal preset="card" :title="isEditing ? '编辑图像模型' : '添加图像模型'">
    <NScrollbar style="max-height: 75vh;">
      <!-- 1. 基本信息区域 -->
      <NSpace vertical :size="16">
        <NFormItem label="模型名称" required>
          <NInput v-model:value="formData.name" placeholder="为模型起一个容易识别的名称" />
        </NFormItem>

        <NFormItem label="启用状态">
          <NCheckbox v-model:checked="formData.enabled">启用此模型</NCheckbox>
        </NFormItem>
      </NSpace>

      <!-- 2. 提供商配置区域 -->
      <NDivider style="margin: 24px 0;" />
      <NH4 style="margin: 0 0 16px 0;">提供商配置</NH4>

      <NSpace vertical :size="16">
        <NFormItem label="图像提供商" required>
          <NSelect
            v-model:value="formData.providerId"
            :options="providerOptions"
            placeholder="选择图像生成服务提供商"
            @update:value="onProviderChange"
          />
        </NFormItem>

        <!-- 提供商信息展示 -->
        <NAlert v-if="selectedProvider" type="info">
          {{ selectedProvider.description }}
        </NAlert>

        <!-- 动态连接配置 -->
        <div v-for="field in connectionFields" :key="field.name">
          <NFormItem :label="t(field.labelKey)" :required="field.required">
            <NInput
              v-if="field.type === 'string'"
              v-model:value="formData.connectionConfig[field.name]"
              :type="field.name.toLowerCase().includes('key') ? 'password' : 'text'"
              :placeholder="field.placeholder"
            />
            <NInputNumber
              v-else-if="field.type === 'number'"
              v-model:value="formData.connectionConfig[field.name]"
              :placeholder="field.placeholder"
            />
          </NFormItem>
        </div>

        <!-- 连接测试 -->
        <NSpace align="center">
          <NButton
            @click="testConnection"
            :loading="isTestingConnection"
            :disabled="!canTestConnection"
            secondary
            type="info"
          >
            测试连接
          </NButton>
          <NTag v-if="connectionStatus" :type="connectionStatus.type">
            {{ t(connectionStatus.messageKey) }}
          </NTag>
        </NSpace>
      </NSpace>

      <!-- 3. 模型选择区域 -->
      <NDivider style="margin: 24px 0;" />
      <NH4 style="margin: 0 0 16px 0;">模型配置</NH4>

      <NSpace vertical :size="16">
        <NFormItem label="图像模型" required>
          <NSpace align="center">
            <NSelect
              v-model:value="formData.modelId"
              :options="modelOptions"
              :loading="isLoadingModels"
              placeholder="选择或输入模型名称"
              style="flex: 1;"
              clearable
              filterable
              tag
            />
            <NButton
              @click="refreshModels"
              :loading="isLoadingModels"
              :disabled="!canRefreshModels"
              circle
              secondary
            >
              <template #icon>
                <svg><!-- 刷新图标 --></svg>
              </template>
            </NButton>
          </NSpace>
        </NFormItem>

        <!-- 模型状态信息 -->
        <NAlert v-if="modelLoadingStatus" :type="modelLoadingStatus.type">
          {{ t(modelLoadingStatus.messageKey) }}
          <template v-if="modelLoadingStatus.count">
            (共 {{ modelLoadingStatus.count }} 个模型)
          </template>
        </NAlert>

        <!-- 选中模型的能力展示 -->
        <NCard v-if="selectedModel" size="small">
          <template #header>
            <NSpace align="center">
              <NIcon size="18"><LightBulbIcon /></NIcon>
              <span>模型能力</span>
            </NSpace>
          </template>

          <NSpace wrap style="margin-bottom: 12px;">
            <NTag v-if="selectedModel.capabilities?.text2image" type="success">文生图</NTag>
            <NTag v-if="selectedModel.capabilities?.image2image" type="info">图生图</NTag>
            <NTag v-if="selectedModel.capabilities?.multiImage" type="warning">多图像</NTag>
            <NTag v-if="selectedModel.capabilities?.highResolution" type="primary">高分辨率</NTag>
          </NSpace>

          <NText depth="2" style="font-size: 14px;">
            {{ selectedModel.description }}
          </NText>
        </NCard>
      </NSpace>

      <!-- 4. 参数配置区域（可折叠） -->
      <NDivider style="margin: 24px 0;" />
      <NCollapse>
        <NCollapseItem title="高级参数配置" name="advanced">
          <template #header-extra>
            <NText depth="3" style="font-size: 12px;">
              可选，用于覆盖默认模型参数
            </NText>
          </template>

          <NSpace vertical :size="16">
            <!-- 参数快速添加 -->
            <NSpace align="center">
              <NText strong>添加参数：</NText>
              <NSelect
                v-model:value="selectedNewParamId"
                :options="availableParameterOptions"
                placeholder="选择预定义参数"
                style="width: 200px;"
                @update:value="handleQuickAddParam"
              />
              <NButton @click="addCustomParameter" dashed>
                + 自定义参数
              </NButton>
            </NSpace>

            <!-- 已配置的参数列表 -->
            <div v-for="(value, paramName) in formData.paramOverrides" :key="paramName">
              <NFormItem :label="getParameterLabel(paramName)">
                <template #label-extra>
                  <NButton @click="removeParameter(paramName)" size="tiny" quaternary circle>
                    <template #icon>×</template>
                  </NButton>
                </template>

                <!-- 根据参数类型渲染不同输入组件 -->
                <NInputNumber
                  v-if="getParameterType(paramName) === 'number'"
                  v-model:value="formData.paramOverrides[paramName]"
                  :min="getParameterMin(paramName)"
                  :max="getParameterMax(paramName)"
                  :step="getParameterStep(paramName)"
                />
                <NSlider
                  v-else-if="getParameterType(paramName) === 'slider'"
                  v-model:value="formData.paramOverrides[paramName]"
                  :min="getParameterMin(paramName)"
                  :max="getParameterMax(paramName)"
                  :step="getParameterStep(paramName)"
                  :marks="getParameterMarks(paramName)"
                />
                <NSelect
                  v-else-if="getParameterType(paramName) === 'select'"
                  v-model:value="formData.paramOverrides[paramName]"
                  :options="getParameterOptions(paramName)"
                />
                <NInput
                  v-else
                  v-model:value="formData.paramOverrides[paramName]"
                  :placeholder="getParameterPlaceholder(paramName)"
                />

                <template #feedback>
                  <NText depth="3" style="font-size: 12px;">
                    {{ getParameterDescription(paramName) }}
                  </NText>
                </template>
              </NFormItem>
            </div>
          </NSpace>
        </NCollapseItem>
      </NCollapse>
    </NScrollbar>

    <!-- 操作按钮 -->
    <template #action>
      <NSpace justify="end">
        <NButton @click="close">取消</NButton>
        <NButton type="primary" @click="save" :loading="isSaving" :disabled="!canSave">
          {{ isEditing ? '更新' : '保存' }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
```

## 关键改进点

### 1. 结构优化
- **去除步骤导航**：移除 `NSteps` 组件和步骤切换逻辑
- **逻辑分组**：使用分割线和标题将相关配置分组
- **单页展示**：所有配置项在一个可滚动页面中

### 2. 交互优化
- **智能显示**：根据提供商选择动态显示连接配置
- **实时反馈**：连接测试、模型加载状态实时显示
- **快速操作**：支持模型快速选择和参数快速添加

### 3. 用户体验提升
- **可折叠区域**：高级参数使用折叠面板，减少界面复杂度
- **智能默认**：提供合理的默认值和占位符
- **操作提示**：关键操作提供清晰的提示和帮助信息

### 4. 一致性保证
- **布局统一**：与文本模型管理界面保持一致的布局风格
- **交互统一**：相同的操作逻辑和反馈机制
- **样式统一**：使用相同的组件和样式系统

## 技术实现要点

### 1. 响应式布局
```typescript
// 根据提供商选择动态计算连接字段
const connectionFields = computed(() => {
  if (!selectedProvider.value) return []
  return generateConnectionFields(selectedProvider.value.connectionSchema)
})

// 智能表单验证
const canSave = computed(() => {
  return formData.value.name &&
         formData.value.providerId &&
         formData.value.modelId &&
         validateConnectionConfig()
})
```

### 2. 动态表单生成
```typescript
// 根据提供商 schema 动态生成表单字段
const generateConnectionFields = (schema: ConnectionSchema) => {
  const fields = []
  schema.required?.forEach(fieldName => {
    fields.push({
      name: fieldName,
      required: true,
      type: schema.fieldTypes[fieldName],
      labelKey: `image.connection.${fieldName}`,
      placeholder: t(`image.connection.${fieldName}Placeholder`)
    })
  })
  // ... 处理可选字段
  return fields
}
```

### 3. 参数管理优化
```typescript
// 参数快速添加
const handleQuickAddParam = (paramId: string) => {
  if (!paramId || paramId === 'custom') return

  const paramDef = availableParameters.value.find(p => p.id === paramId)
  if (paramDef) {
    formData.value.paramOverrides[paramDef.name] = paramDef.defaultValue
  }
}

// 自定义参数添加
const addCustomParameter = () => {
  // 打开自定义参数输入对话框
  showCustomParamDialog.value = true
}
```

## 迁移计划

### 阶段1：界面重构
1. 移除步骤导航相关代码
2. 重新布局表单结构
3. 实现动态字段显示逻辑

### 阶段2：交互优化
1. 优化连接测试体验
2. 改进模型选择和加载流程
3. 完善参数配置界面

### 阶段3：体验细化
1. 添加操作提示和帮助
2. 优化错误处理和反馈
3. 完善响应式布局

这种一体化设计将显著提升用户体验，使图像模型配置变得更加高效和直观。