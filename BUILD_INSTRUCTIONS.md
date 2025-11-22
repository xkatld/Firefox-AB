# 构建说明

## 快速开始

### Windows 用户
1. 下载 `dist/Browser-Manager-Windows.zip`
2. 解压文件
3. 运行 `Browser Manager.exe`

### Linux 用户
1. 下载 `dist/Browser Manager-1.0.0.AppImage`
2. 赋予执行权限：`chmod +x "Browser Manager-1.0.0.AppImage"`
3. 运行：`./Browser\ Manager-1.0.0.AppImage`

## 构建说明

### Linux 环境

```bash
npm run build
```

输出文件：
- `dist/Browser Manager-1.0.0.AppImage` - Linux AppImage（可直接运行）
- `dist/browser-manager-1.0.0.zip` - Linux zip 分发包
- `dist/Browser-Manager-Windows.zip` - Windows exe 及依赖

### Windows 环境

在 Windows 上运行以下命令生成 NSIS 安装程序：

```bash
npm run build:win
```

输出文件：
- `dist/Browser Manager Setup-1.0.0.exe` - NSIS 安装程序
- `dist/Browser Manager-portable.exe` - 便携可执行文件

### 构建所有平台

```bash
npm run build:all
```

## CLI 使用

不论在哪个平台，都可以使用 CLI 工具：

```bash
npm run cli create myprofile
npm run cli list
npm run cli open myprofile
npm run cli delete myprofile
```

或者直接：

```bash
node src/cli.js create myprofile
node src/cli.js list
node src/cli.js open myprofile
node src/cli.js delete myprofile
```
