# Browser Manager

**命令行浏览器配置管理工具**

支持 Chromium 和 Firefox 的独立配置管理，内置指纹保护和代理配置

---

## 简介

Browser Manager 是一款基于 Playwright 的命令行工具，帮助你管理多个独立的浏览器配置。每个配置拥有完全隔离的数据存储，支持指纹伪装和代理设置，适合需要多账号管理、隐私保护的场景。

## 核心功能

- **多配置管理** - 创建、编辑、分组管理多个浏览器配置
- **完全隔离** - 每个配置独立存储 Cookies、缓存、Session
- **指纹保护** - Canvas、WebGL、音频指纹随机化
- **代理配置** - 支持 HTTP/HTTPS/SOCKS5 代理及认证
- **双浏览器** - 同时支持 Chromium 和 Firefox
- **交互界面** - 友好的命令行交互菜单

## 安装

```bash
git clone https://github.com/user/Firefox-AB.git
cd Firefox-AB
pnpm install
pnpm start
```

环境要求: Node.js 18+ 和 pnpm

## 使用

运行 `pnpm start` 进入交互式菜单：

```
╔══════════════════════════════════════╗
║   浏览器配置管理器 v1.0.0          ║
╚══════════════════════════════════════╝

? 请选择操作:
  📋 查看所有配置
  ➕ 创建新配置
  ▶️  打开配置
  🗑️  删除配置
  ✏️  编辑配置
  📝 重命名配置
  ⭐ 星标管理
  📁 分组管理
  🔄 重新生成指纹
  📤 导出配置
  📥 导入配置
  🗂️  批量操作
  🔴 关闭浏览器
  ❌ 退出
```

所有操作通过交互式菜单完成，无需记忆命令。

## 指纹保护

启用指纹保护后，会自动随机化以下浏览器特征：

- Canvas 渲染指纹
- WebGL 渲染器和供应商
- 音频上下文指纹
- 字体列表
- User-Agent
- 屏幕分辨率
- 时区和语言

## 数据存储

配置文件存储在 `~/.browser-manager/`:

```
~/.browser-manager/
├── data.db                    # SQLite 数据库
└── profiles/
    ├── profile1/             # 配置1的浏览器数据
    └── profile2/             # 配置2的浏览器数据
```

每个配置的浏览器数据完全独立，互不影响。

## 技术架构

- **Playwright** - 浏览器控制和自动化
- **Inquirer** - 命令行交互界面
- **sql.js** - 轻量级数据存储
- **Chalk** - 终端颜色输出

## 开发

```bash
pnpm install
pnpm start
```

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
