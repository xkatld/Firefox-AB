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
5. 等待编译完成（约 10-15 分钟）
6. 自动发布到 **Releases** 页面

### 下载编译结果
- Windows: `Browser-Manager-Windows.zip`
- Linux: `Browser Manager-1.0.0.AppImage`

---

## 本地开发

### 安装依赖
```bash
npm install
```

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
✅ 每个 Profile 独立数据（Cookies、LocalStorage 等）  
✅ 支持加载 Chromium 扩展  
✅ CLI 和 GUI 双界面  
✅ Windows 和 Linux 支持  

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

## 支持

遇到问题？查看 [WINDOWS_SETUP.md](WINDOWS_SETUP.md) 或 [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)
