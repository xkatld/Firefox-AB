# 浏览器账户管理器

一个轻量级的多浏览器 Profile 管理工具，支持 Chrome 和 Firefox，内置指纹识别保护，完全离线使用。

## 功能特性

✅ **多浏览器支持** - Chrome 和 Firefox  
✅ **独立 Profile** - 每个账户完全隔离数据  
✅ **指纹识别保护** - 内置 My Fingerprint 扩展  
✅ **完全离线** - 所有浏览器内置，无需网络  
✅ **图形界面** - 轻松管理多个 Profile  
✅ **跨平台** - Windows 和 Linux 支持  

## 安装

### 下载应用

**Windows / Linux**: 从 [Releases](https://github.com/your-repo/releases) 下载最新版本（~400MB）

- Windows: `Browser-Manager-Windows-v1.0.0.zip`
- Linux: `Browser Manager-1.0.0.AppImage`

### 运行

**Windows**:
1. 解压 ZIP 文件
2. 打开 `Browser Manager.exe`

**Linux**:
1. 运行 `chmod +x "Browser Manager-1.0.0.AppImage"`
2. 双击运行，或命令行执行：`./Browser\ Manager-1.0.0.AppImage`

### 开发环境

#### 前置要求
- Node.js 24+ （[安装 NVM](https://github.com/nvm-sh/nvm)）

#### 安装依赖
```bash
pnpm install
```

#### 运行

**启动 GUI**:
```bash
pnpm start
```

## 使用说明

### GUI 界面

1. **打开应用** → 显示现有 Profile 列表
2. **创建 Profile** → 选择 Chrome 或 Firefox → 输入名称
3. **启动浏览器** → 点击 Profile 卡片 → 浏览器自动启动
4. **删除 Profile** → 点击删除按钮



## 构建与发布

应用通过 GitHub Actions 自动构建，生成的文件可在 Releases 中下载。

## 项目结构

```
.
├── src/
│   ├── manager.js          Profile 管理器
│   ├── launcher.js         浏览器启动器
│   └── gui/
│       ├── main.js         Electron 主进程
│       ├── renderer.js     UI 逻辑
│       └── index.html      UI 界面
├── plugins/                浏览器扩展目录
├── .github/workflows/      CI/CD 工作流
│   └── build.yml           GitHub Actions 构建配置
├── build-with-browsers.js  构建脚本
├── package.json
└── README.md
```

## 配置

### 浏览器数据存储

Profile 数据存储在：`~/.browser-manager/profiles/<name>/`

每个 Profile 包含：
- 浏览器缓存、Cookies、LocalStorage
- 扩展数据和设置
- 完全独立的浏览器会话

### 扩展

指纹识别扩展 (My Fingerprint v2.6.3) 自动启用：
- **Chrome**: 通过启动参数加载
- **Firefox**: 自动复制到 Profile 的扩展目录

## 故障排查

### 浏览器无法启动

确保 pnpm install 已完成（首次会下载浏览器到 `~/.cache/ms-playwright/`）

### Profile 无法创建

检查 `~/.browser-manager/` 目录权限：
```bash
chmod -R 755 ~/.browser-manager
```

### Linux 上缺少依赖库

部分 Linux 发行版可能缺少浏览器依赖：
```bash
# Debian/Ubuntu
sudo apt-get install libnss3 libxss1 libasound2

# Fedora
sudo dnf install nss libXss
```

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
