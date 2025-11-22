# 快速开始

## 一键发布到 GitHub

### 第一次设置
1. 将代码推送到 GitHub
2. 确保仓库启用了 Actions 权限

### 发布应用
1. 打开项目 GitHub 主页
2. 进入 **Actions** 标签
3. 点击左侧 **Build and Release**
4. 点击 **Run workflow** 按钮
5. 等待编译完成（约 15-20 分钟）
6. 自动发布到 **Releases** 页面

### 下载编译结果
**Windows**:
- `Browser Manager Setup-*.exe` - NSIS 安装程序
- `Browser Manager-portable.exe` - 便携版 exe

**Linux**:
- `Browser Manager-*.AppImage` - AppImage 格式（推荐）
- `browser-manager-*.zip` - ZIP 压缩包

---

## 本地开发

### 前置要求
- Node.js 24+ （[安装说明](#安装-nodejs)）
- npm 11+

### 安装 Node.js

如果未安装 Node.js 24+，使用 nvm 安装：

```bash
# 下载并安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# 重新加载 shell 配置
. "$HOME/.nvm/nvm.sh"

# 安装 Node.js 24
nvm install 24

# 验证版本
node -v  # 应该显示 v24.11.1 或更高
npm -v   # 应该显示 11.6.2 或更高
```

### 安装依赖（包括浏览器）
```bash
npm install
```

**重要**: `npm install` 会自动运行 postinstall 脚本，下载 Chromium 和 Firefox 浏览器（约 300MB）。  
浏览器将缓存到 `~/.cache/ms-playwright/`，首次会花 2-5 分钟。

### 运行 GUI
```bash
npm start
```

### 运行 CLI
```bash
npm run cli create myprofile
npm run cli list
npm run cli open myprofile
npm run cli delete myprofile
```

### 本地编译

**Linux**
```bash
npm run build
```

**Windows（需要 wine）**
```bash
npm run build:win
```

**所有平台**
```bash
npm run build:all
```

编译输出在 `dist/` 目录中。

---

## 项目结构

```
Browser-Manager/
├── src/
│   ├── cli.js           CLI 入口
│   ├── manager.js       Profile 管理
│   ├── launcher.js      浏览器启动
│   └── gui/
│       ├── main.js      Electron 主进程
│       ├── preload.js   IPC 预加载
│       ├── renderer.js  GUI 逻辑
│       └── index.html   GUI 界面
├── profiles/            Profile 数据目录
├── plugins/             浏览器扩展目录
├── .github/workflows/   GitHub Actions
├── package.json
└── dist/                编译输出
```

---

## 功能

✅ 创建多个独立浏览器 Profile  
✅ 支持 Chrome 和 Firefox 两种浏览器  
✅ 每个 Profile 独立数据（Cookies、LocalStorage 等）  
✅ 内置 My Fingerprint 指纹识别保护（Chrome + Firefox）  
✅ CLI 和 GUI 双界面  
✅ Windows 和 Linux 支持  
✅ 自动下载并缓存浏览器（首次 npm install）  

---

## 用户使用流程

### 对于最终用户（下载编译版本）

1. **下载应用**
   - Windows: 下载 `Browser-Manager-Windows-v1.0.0.zip`（113MB）
   - Linux: 下载 `Browser Manager-1.0.0.AppImage`（107MB）

2. **首次启动**
   - 打开应用
   - 如果浏览器未安装，会自动下载（需要网络连接）
   - 下载时间：2-5 分钟（一次性）

3. **使用应用**
   - 创建浏览器 Profile（Chrome 或 Firefox）
   - 浏览器自动启动，指纹识别保护默认启用
   - 完全隐私的独立浏览环境

### 对于开发者（本地编译）

1. **npm install** → 自动下载浏览器
2. **npm start** → 启动 GUI
3. **npm run build:all** → 编译所有平台

---

## 自动发布流程

GitHub Actions 工作流自动：
1. 检出代码
2. 编译 Linux 版本（AppImage + ZIP）
3. 编译 Windows 版本（使用 wine）
4. 创建 GitHub Release
5. 上传所有编译文件

查看详细说明：[RELEASE_GUIDE.md](RELEASE_GUIDE.md)

---

## 故障排查

### 编译失败
- 查看 Actions 日志
- 确保代码在 main 分支
- 尝试本地编译测试

### 文件缺失
- 检查 dist 目录
- 查看编译日志中的输出路径

### 权限问题
- 确保启用了 Actions
- 检查 GITHUB_TOKEN 权限

---

## 许可证

MIT
