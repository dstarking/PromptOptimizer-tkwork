# CSP安全模板处理 - 实现细节

## 🔧 核心实现

### 1. CSP安全处理器实现

#### 基本变量替换
```typescript
static processContent(content: string, context: TemplateContext): string {
  let result = content;
  
  // 使用正则表达式替换所有{{variable}}模式
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const trimmedName = variableName.trim();
    const value = context[trimmedName];
    
    // 返回值或空字符串（避免undefined）
    return value !== undefined ? String(value) : '';
  });
  
  return result;
}
```

#### 环境检测逻辑
```typescript
static isExtensionEnvironment(): boolean {
  try {
    // 1. 排除Node.js环境
    if (typeof window === 'undefined') {
      return false;
    }
    
    // 2. 排除Electron环境（多重检测）
    if (typeof window !== 'undefined') {
      try {
        if (typeof (window as any).require !== 'undefined' || 
            typeof (window as any).electronAPI !== 'undefined' ||
            typeof (window as any).electron !== 'undefined') {
          return false; // Electron环境
        }
        
        if (typeof navigator !== 'undefined' && 
            navigator.userAgent && 
            navigator.userAgent.includes('Electron')) {
          return false; // Electron环境
        }
      } catch (e) {
        // 检测失败时继续，不影响其他平台
      }
    }
    
    // 3. 检查Chrome扩展API
    if (typeof chrome !== 'undefined' && 
        typeof chrome.runtime !== 'undefined' && 
        typeof chrome.runtime.getManifest === 'function') {
      
      // 4. 验证manifest有效性
      try {
        const manifest = chrome.runtime.getManifest();
        return !!(manifest && typeof manifest.manifest_version !== 'undefined');
      } catch (manifestError) {
        return false;
      }
    }
    
    return false;
  } catch (error) {
    // 任何错误都返回false，确保其他平台正常工作
    return false;
  }
}
```

### 2. 主处理器集成

#### 自动环境切换
```typescript
// Advanced template: use template technology for variable substitution
if (Array.isArray(template.content)) {
  // 检查是否在浏览器扩展环境中
  if (CSPSafeTemplateProcessor.isExtensionEnvironment()) {
    return template.content.map(msg => {
      // 验证模板内容
      CSPSafeTemplateProcessor.validateTemplate(msg.content);
      
      return {
        role: msg.role,
        content: CSPSafeTemplateProcessor.processContent(msg.content, context)
      };
    });
  } else {
    // 使用完整Handlebars功能
    return template.content.map(msg => ({
      role: msg.role,
      content: Handlebars.compile(msg.content, { noEscape: true })(context)
    }));
  }
}
```

## 🧪 测试实现

### 1. 环境检测测试

#### Node.js环境测试
```typescript
it('should return false in Node.js environment (no window)', () => {
  // 不设置window对象，模拟Node.js环境
  expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(false);
});
```

#### 浏览器扩展环境测试
```typescript
it('should return true for valid browser extension', () => {
  // 模拟浏览器环境
  (global as any).window = {};
  (global as any).navigator = { userAgent: 'Chrome' };
  
  (global as any).chrome = {
    runtime: {
      getManifest: vi.fn(() => ({ manifest_version: 3, name: 'Test Extension' }))
    }
  };
  
  expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(true);
});
```

#### Electron环境排除测试
```typescript
it('should return false when window.require exists (Electron)', () => {
  (global as any).window = { require: vi.fn() };
  (global as any).navigator = { userAgent: 'Chrome' };
  (global as any).chrome = {
    runtime: {
      getManifest: vi.fn(() => ({ manifest_version: 3, name: 'Test' }))
    }
  };
  
  expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(false);
});
```

### 2. 变量替换测试

#### 基本功能测试
```typescript
it('should replace simple variables', () => {
  const content = 'Hello {{name}}!';
  const context: TemplateContext = { name: 'World' };
  
  const result = CSPSafeTemplateProcessor.processContent(content, context);
  expect(result).toBe('Hello World!');
});
```

#### 预定义变量测试
```typescript
it('should handle predefined template variables', () => {
  const content = 'Original: {{originalPrompt}}, Last: {{lastOptimizedPrompt}}, Input: {{iterateInput}}';
  const context: TemplateContext = {
    originalPrompt: 'Write a story',
    lastOptimizedPrompt: 'Write a creative story about space',
    iterateInput: 'Make it more dramatic'
  };
  
  const result = CSPSafeTemplateProcessor.processContent(content, context);
  expect(result).toBe('Original: Write a story, Last: Write a creative story about space, Input: Make it more dramatic');
});
```

## 🔍 关键技术点

### 1. 正则表达式设计
- **模式**: `/\{\{([^}]+)\}\}/g`
- **特点**: 匹配双大括号内的任意非右括号字符
- **优势**: 简单高效，支持空格处理

### 2. 错误处理策略
- **原则**: 任何检测错误都不影响其他平台功能
- **实现**: 多层try-catch保护
- **效果**: 确保向后兼容和稳定性

### 3. 类型安全
- **接口**: 复用现有`TemplateContext`接口
- **转换**: `String(value)`确保类型安全
- **默认值**: 未定义变量返回空字符串

### 4. 性能优化
- **缓存**: 环境检测结果可考虑缓存（未实现）
- **正则**: 使用全局匹配提高效率
- **内存**: 避免创建不必要的对象

## 📊 性能对比

| 功能 | Handlebars | CSP安全处理器 | 性能差异 |
|------|------------|---------------|----------|
| 基本变量替换 | ✅ | ✅ | CSP更快 |
| 条件语句 | ✅ | ❌ | - |
| 循环语句 | ✅ | ❌ | - |
| 部分模板 | ✅ | ❌ | - |
| 内存占用 | 较高 | 较低 | CSP更优 |
| 启动时间 | 较慢 | 较快 | CSP更优 |

## 🚀 扩展性设计

### 1. 新增变量支持
```typescript
// 在TemplateContext中添加新字段即可自动支持
export interface TemplateContext {
  // 现有字段...
  
  // 新增字段 - 自动支持
  userLanguage?: string;
  modelName?: string;
  timestamp?: string;
}
```

### 2. 功能扩展点
- **自定义函数**: 可在正则替换中添加函数调用支持
- **条件简化**: 可添加简单的条件替换逻辑
- **格式化**: 可添加基本的值格式化功能

### 3. 配置化支持
```typescript
// 未来可考虑的配置选项
interface CSPProcessorConfig {
  enableWarnings: boolean;
  customVariablePattern?: RegExp;
  defaultValue?: string;
}
```

## 🔧 调试支持

### 1. 警告机制
```typescript
static validateTemplate(content: string): void {
  const unsupportedPatterns = [
    /\{\{#if\s/,     // 条件语句
    /\{\{#each\s/,   // 循环语句
    // ... 其他模式
  ];

  for (const pattern of unsupportedPatterns) {
    if (pattern.test(content)) {
      console.warn('Template contains unsupported Handlebars features...');
      break;
    }
  }
}
```

### 2. 调试信息
- **环境检测**: 可添加详细的检测日志
- **变量替换**: 可记录替换过程
- **错误追踪**: 详细的错误上下文信息

---

**💡 实现要点**: 
1. 安全第一 - 任何错误都不影响其他平台
2. 简单有效 - 专注核心功能，避免过度设计
3. 扩展友好 - 为未来功能扩展预留空间

## 🔄 最终实现演进（2025-08-29）

### 从复杂实现到简单实现的转变

**原实现特点**:
- 环境检测逻辑复杂（多重验证、异常处理）
- 双处理器架构（CSP vs Handlebars）
- 分支处理逻辑（if-else环境判断）

**最终实现**:
```typescript
// 极简实现 - 统一使用Mustache
static processTemplate(template: Template, context: TemplateContext): Message[] {
  return template.content.map(msg => ({
    role: msg.role,
    content: Mustache.render(msg.content, context)  // 单一处理路径
  }));
}
```

**简化效果**:
- 📉 **代码行数**: 从200+行环境检测简化为1行模板处理
- 🔧 **维护复杂度**: 消除所有环境特定逻辑
- 🎯 **性能提升**: 无分支判断，直接处理
- 🛡️ **错误减少**: 统一处理路径，减少出错点

**架构演进启示**:
1. **实现复杂度**往往反映了**技术选型问题**
2. **最好的代码**是**不需要写的代码**
3. **架构简化**比**功能完善**更重要

**对未来开发的指导**:
- 复杂的兼容性实现通常暗示需要重新评估技术栈
- 环境差异处理应该是例外，而非常规
- 统一的解决方案总是比分化的解决方案更优

这次迁移将复杂的环境适配实现转变为简单的统一实现，是**Less is More**设计理念的完美体现。
