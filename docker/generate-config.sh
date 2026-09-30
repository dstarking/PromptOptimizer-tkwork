#!/bin/sh

# 配置文件路径
CONFIG_FILE="/usr/share/nginx/html/config.js"

echo "========================================="
echo "开始生成运行时配置文件..."
echo "目标文件: $CONFIG_FILE"
echo "========================================="

# 检查目标目录是否存在
TARGET_DIR=$(dirname "$CONFIG_FILE")
if [ ! -d "$TARGET_DIR" ]; then
    echo "ERROR: 目标目录不存在: $TARGET_DIR"
    mkdir -p "$TARGET_DIR" || echo "ERROR: 无法创建目录"
fi

# 构建包含全部 VITE_* 变量的运行时配置（同时注入带前缀与不带前缀的键）
CONFIG_BODY=""
COUNT=0

# 显示所有VITE_*环境变量用于调试
echo "扫描VITE_*环境变量..."
env | grep '^VITE_' || echo "未找到任何VITE_*变量"
echo "========================================="

# 遍历所有以 VITE_ 开头的环境变量
for var in $(env | grep '^VITE_[A-Za-z0-9_]*=' | cut -d= -f1 | sort); do
  value=$(printenv "$var" 2>/dev/null)
  if [ -n "$value" ]; then
    # 去除 VITE_ 前缀得到无前缀键名
    no_prefix_key=$(echo "$var" | sed 's/^VITE_//')
    # 简单转义（反斜杠与双引号）
    escaped_value=$(printf '%s' "$value" | sed 's/\\/\\\\/g; s/"/\\"/g')

    # 追加属性：无前缀副本 与 带前缀副本
    if [ -n "$CONFIG_BODY" ]; then
      CONFIG_BODY="${CONFIG_BODY},
"
    fi
    CONFIG_BODY="${CONFIG_BODY}  ${no_prefix_key}: \"${escaped_value}\",
  ${var}: \"${escaped_value}\""

    COUNT=$((COUNT + 1))
    echo "Found VITE var: $var"
  fi
done

# 生成配置文件（运行时在浏览器环境可读）
cat > "$CONFIG_FILE" << EOF
// 此文件由容器启动时生成，用于在运行时向前端注入环境变量
// 同时提供带前缀与不带前缀的两个副本，方便不同读取策略
window.runtime_config = Object.assign({}, (window.runtime_config || {}), {
${CONFIG_BODY}
});
console.log("运行时配置已加载，共注入 ${COUNT} 个 VITE_* 变量（双份键）");
EOF

echo "========================================="
echo "配置文件已生成: $CONFIG_FILE"
echo "已注入 VITE_* 变量数量: $COUNT"
echo "========================================="

# 验证文件是否成功生成
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ 配置文件生成成功"
    echo "文件大小: $(wc -c < "$CONFIG_FILE") bytes"
    echo "前10行内容:"
    head -n 10 "$CONFIG_FILE"
else
    echo "❌ ERROR: 配置文件生成失败!"
    exit 1
fi

echo "========================================="
