# 自动发布指南

## GitHub Actions 自动编译和发布

本项目配置了 GitHub Actions 工作流，支持一键自动编译和发布到 GitHub Releases。

## 使用方法

### 第一次设置

1. 将代码推送到 GitHub
2. 进入项目主页
3. 点击 **Actions** 选项卡
4. 在左侧找到 **Build and Release** 工作流

### 手动触发发布

1. 打开项目的 GitHub 主页
2. 进入 **Actions** 选项卡
3. 点击左侧的 **Build and Release** 工作流
4. 点击 **Run workflow** 按钮
5. 可以选择输入版本号（可选），或者留空使用自动版本
6. 点击 **Run workflow** 开始编译

### 自动编译过程

工作流会执行以下步骤：

#### 在 Linux 上编译：
- 编译 AppImage（Linux 直接运行格式）
- 编译 ZIP 分发包（Linux）

#### 在同一 Linux 环境中编译 Windows 版本：
- 使用 Wine 和 electron-builder
- 编译 Windows exe 及所有依赖
- 生成 Browser-Manager-Windows.zip

### 查看编译进度

1. 在 Actions 页面可以看到正在运行的工作流
2. 点击可以查看详细的编译日志
3. 编译过程通常需要 10-15 分钟

### 发布完成

编译完成后，工作流会自动：
- 创建新的 GitHub Release
- 上传编译好的文件到 Release
- 添加发布说明

### 下载编译结果

1. 进入项目主页
2. 点击右侧的 **Releases**
3. 找到最新的 Release
4. 下载需要的文件：
   - Windows: `Browser-Manager-Windows.zip`
   - Linux: `Browser Manager-1.0.0.AppImage` 或 `browser-manager-1.0.0.zip`

## 工作流文件

工作流配置文件位于：`.github/workflows/release.yml`

配置的任务：
- **build**: 编译任务（Linux 和 Windows 版本）
- **release**: 创建 GitHub Release 并上传文件

## 环境变量

工作流会自动设置：
- `CSC_IDENTITY_AUTO_DISCOVERY=false` - 禁用代码签名（用于无签名构建）

## 故障排查

### 编译失败

1. 查看 Actions 页面的详细日志
2. 检查错误信息
3. 修复问题后重新运行工作流

### 找不到文件

如果上传的文件不完整，检查：
1. 编译步骤是否成功
2. 文件路径是否正确
3. 文件是否在 dist 目录中

## 高级配置

### 修改版本号

编辑 `package.json` 中的 `version` 字段，然后提交并触发工作流。

### 修改 Release 说明

编辑 `.github/workflows/release.yml` 中的 `body` 部分。

### 添加更多平台

在 `.github/workflows/release.yml` 的 `matrix.include` 中添加新的编译配置。

## 手动编译（本地）

如果需要本地编译而不使用 GitHub Actions：

### Linux
```bash
npm run build
```

### Windows（在 Linux 上使用 Wine）
```bash
npm run build:win
```

### 所有平台
```bash
npm run build:all
```

编译结果在 `dist/` 目录中。
