#!/bin/bash
# GitHub Actions CI/CD 诊断脚本

echo "=== Browser Manager - 构建环境诊断 ==="
echo ""
echo "时间: $(date)"
echo ""

# 系统信息
echo "=== 系统信息 ==="
uname -a
echo ""

# 磁盘空间
echo "=== 磁盘空间 ==="
df -h
echo ""

# 内存信息
echo "=== 内存信息 ==="
if command -v free &> /dev/null; then
    free -h
else
    echo "无法获取内存信息（free 命令不可用）"
fi
echo ""

# Node.js 和 npm
echo "=== Node.js 和 npm ==="
node --version
npm --version
npm cache verify 2>/dev/null || echo "npm cache verify 不可用"
echo ""

# npm 全局包
echo "=== npm 全局包 ==="
npm list -g --depth=0 | head -20
echo ""

# 项目依赖大小
echo "=== 项目依赖信息 ==="
if [ -d "node_modules" ]; then
    echo "node_modules 大小:"
    du -sh node_modules
    echo ""
    echo "node_modules 中的大型包 (top 10):"
    du -sh node_modules/* | sort -rh | head -10
else
    echo "node_modules 目录不存在"
fi
echo ""

# 构建工具
echo "=== 构建工具 ==="
echo "git version: $(git --version)"
echo "make version: $(make --version 2>&1 | head -1 || echo '不可用')"
echo ""

# 平台特定信息
echo "=== 平台特定信息 ==="
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "平台: Linux"
    echo "发行版: $(lsb_release -d 2>/dev/null || echo '无法获取')"
    echo "wine: $(which wine || echo '未安装')"
elif [[ "$OSTYPE" == "win32" ]] || [[ "$OSTYPE" == "msys" ]]; then
    echo "平台: Windows"
    echo "Visual C++: $(where cl.exe 2>/dev/null || echo '未安装')"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "平台: macOS"
    echo "Xcode: $(xcode-select -p 2>/dev/null || echo '未安装')"
else
    echo "平台: 未知 ($OSTYPE)"
fi
echo ""

# 环境变量
echo "=== 相关环境变量 ==="
echo "PATH 长度: ${#PATH}"
echo "NODE_PATH: ${NODE_PATH:-'(未设置)'}"
echo "npm 配置:"
npm config list | grep -E "cache|prefix|registry" || echo "无输出"
echo ""

# 构建检查
echo "=== 构建环境检查 ==="
if [ -f "package.json" ]; then
    echo "✓ package.json 存在"
    echo "  项目名称: $(grep -o '"name": "[^"]*"' package.json | cut -d'"' -f4)"
    echo "  版本: $(grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4)"
else
    echo "✗ package.json 不存在"
fi

if [ -d "src" ]; then
    echo "✓ src 目录存在"
else
    echo "✗ src 目录不存在"
fi

if [ -f ".github/workflows/release.yml" ]; then
    echo "✓ GitHub Actions 工作流存在"
else
    echo "✗ GitHub Actions 工作流不存在"
fi
echo ""

# 诊断建议
echo "=== 诊断建议 ==="
# 检查磁盘空间
AVAILABLE=$(df / | tail -1 | awk '{print $4}')
if [ "$AVAILABLE" -lt 1048576 ]; then  # 小于 1GB
    echo "⚠ 警告: 可用磁盘空间少于 1GB (当前: $(numfmt --to=iec-i --suffix=B $((AVAILABLE*1024)) 2>/dev/null || echo "$AVAILABLE KB"))"
    echo "  解决方案: 清空不需要的文件，或在 GitHub Actions 中自动清理"
fi

# 检查内存
if command -v free &> /dev/null; then
    AVAILABLE_MEM=$(free -b | awk 'NR==2 {print $7}')
    if [ "$AVAILABLE_MEM" -lt 536870912 ]; then  # 小于 512MB
        echo "⚠ 警告: 可用内存少于 512MB"
        echo "  解决方案: 关闭其他应用，或提高系统内存"
    fi
fi

# 检查 npm 缓存
NPM_CACHE_SIZE=$(du -sh ~/.npm 2>/dev/null | cut -f1)
echo "ℹ npm 缓存大小: ${NPM_CACHE_SIZE:-'无法计算'}"

echo ""
echo "=== 诊断完成 ==="
