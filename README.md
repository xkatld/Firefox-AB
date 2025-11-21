# Firefox-AB

一个面向个人使用的 Firefox 多实例指纹浏览器管理器，核心目标是让每个账号拥有独立、可冻结/解冻的浏览器数据目录，同时提供轻量的界面/脚本来启动指定 profile。

## 平台与约束
- Windows 11（便携运行，支持 EFS/BitLocker 或受密码保护的压缩包）
- Debian 12/13 + XFCE4（使用 Firejail + OverlayFS/btrfs snapshot 等隔离手段）
- 仅手动操作，无自动化脚本需求；Playwright 仅用于以可控方式拉起 Firefox。

## 推荐技术栈
| 组件 | 方案 |
| --- | --- |
| 核心浏览器 | Firefox ESR/Portable（共用安装，profile 独立） |
| Profile 管理后台 | Node.js + TypeScript 服务 / CLI，存储于 SQLite/JSON |
| UI 壳层 | Tauri（Rust）或 Electron（Node）实现 profile 选择、标签、冻结按钮 |
| 隔离与冻结 | Win11：EFS/BitLocker/7z 加密包；Debian：Firejail + OverlayFS/snapshots |
| 插件管理 | 指纹插件、Cookie 插件存放共享仓库，启动 profile 时复制到其 extensions 目录 |

## 开发流程（高层）
1. **Profile 基础**：解析 `profiles.ini`、实现创建/复制/删除 profile 目录，记录元数据（标签、扩展、状态）。
2. **隔离策略**：Windows 侧打包/解包 profile，Linux 侧编写 Firejail+OverlayFS 启动脚本确保命名空间隔离。
3. **管理服务**：实现 Node/Tauri 服务，提供 CLI/API（如 `list`, `create`, `freeze`, `launch`）。
4. **界面与体验**：加入桌面 UI，支持一键打开 Firefox、标记长期账号、联动插件复制。
5. **测试与打包**：验证多 profile 互不污染、冻结/恢复一致性，最后打包为 Windows 绿色包与 Debian AppImage/DEB。

## 当前进度
- [ ] README 规划
- [ ] Node.js Profile 管理器脚手架
- [ ] CLI 基础能力（列出/创建/冻结占位）
- [ ] 平台隔离脚本
- [ ] UI 壳层