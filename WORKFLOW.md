# GitHub Actions 工作流说明

## 完整流程图

```
┌─────────────────────────────────────────────────────────┐
│  手动触发：点击 "Run workflow" 按钮                      │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────▼──────────────────────┐
        │  Build Job (matrix - 并行)      │
        └──────────┬─────────────┬────────┘
                   │             │
          ┌────────▼──┐    ┌────▼────────┐
          │            │    │             │
          │Ubuntu      │    │Windows      │
          │Linux       │    │Build        │
          │AppImage    │    │NSIS exe     │
          │ZIP         │    │Portable exe │
          │            │    │             │
          │5-7 min     │    │8-10 min     │
          │            │    │             │
          └────┬───────┘    └────┬────────┘
               │                 │
           Uploads           Uploads
           linux-builds      windows-builds
               │                 │
               └────────┬────────┘
                        │
             ┌──────────▼──────────────┐
             │  Release Job            │
             │  (等待两个构建完成)     │
             └──────────┬──────────────┘
                        │
             ┌──────────▼──────────────┐
             │ 下载所有 artifacts      │
             │ 创建 GitHub Release     │
             │ 上传编译文件到 Release  │
             │ 添加发布说明           │
             └──────────┬──────────────┘
                        │
             ┌──────────▼──────────────┐
             │ 完成！                  │
             │ 用户可下载发布版本      │
             └────────────────────────┘
```

## 工作流中的任务详情

### 1. Build 任务 (并行执行)

#### Linux Build
```
Ubuntu Latest (并行执行)
    ↓
检出代码
    ↓
安装 Node.js 18
    ↓
npm install
    ↓
npm run build:linux
    ↓
生成:
  - Browser Manager-1.0.0.AppImage (102 MB - Linux 直接运行)
  - browser-manager-1.0.0.zip (97 MB - Linux 压缩包)
    ↓
上传 artifacts (linux-builds)
    ↓
耗时：5-7 分钟
```

### Windows Build
```
Windows Latest (并行执行)
    ↓
检出代码
    ↓
安装 Node.js 18
    ↓
npm install
    ↓
npm run build:win
    ↓
生成:
  - Browser Manager Setup-1.0.0.exe (NSIS 安装程序)
  - Browser Manager-portable.exe (便携版)
    ↓
上传 artifacts (windows-builds)
    ↓
耗时：8-10 分钟
```

### 2. Release 任务 (sequential)

```
等待 Build 任务完成
    ↓
下载 linux-builds artifacts
    ↓
下载 windows-builds artifacts
    ↓
整合所有文件到 release-files 目录
    ↓
创建 GitHub Release
  - Tag: v{run_number}
  - 名称: Release {run_number}
  - 草稿: 否
  - 预发布: 否
    ↓
上传所有文件到 Release
    ↓
添加发布说明 (Markdown)
    ↓
完成！
```

## 环境变量

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `CSC_IDENTITY_AUTO_DISCOVERY` | `false` | 禁用自动代码签名 |
| `GITHUB_TOKEN` | (自动) | 创建 Release 的权限 |

## 时间预计

| 步骤 | 预计时间 | 备注 |
|------|----------|------|
| 检出代码 | 1-2 分钟 | Linux 和 Windows 并行 |
| 安装依赖 | 2-3 分钟 | 各平台独立安装 |
| Linux 编译 | 5-7 分钟 | AppImage + ZIP |
| Windows 编译 | 8-10 分钟 | NSIS + Portable exe |
| 等待构建完成 | (最大时间) | 取两个构建的最长时间 |
| 创建 Release | 1-2 分钟 | 顺序执行 |
| **总计** | **约 15-18 分钟** | 并行构建时间优化 |

## 输出文件

### Linux Build (Ubuntu Latest)
```
dist/
├── Browser Manager-1.0.0.AppImage      (102 MB - 可直接运行)
└── browser-manager-1.0.0.zip           (97 MB - 压缩包)
```

### Windows Build (Windows Latest)
```
dist/
├── Browser Manager Setup-1.0.0.exe     (约 150 MB - NSIS 安装程序)
└── Browser Manager-portable.exe        (约 169 MB - 便携版 exe)
```

## 监控和日志

### 查看进度
1. GitHub 项目 → Actions 选项卡
2. 点击正在运行的工作流
3. 查看两个并行的构建 job（ubuntu-linux 和 windows）
4. 点击 job 查看详细日志
5. 所有构建完成后，会自动执行 release job

### 常见日志输出

**Linux 构建成功**:
```
✓ packaging       platform=linux arch=x64
✓ building        target=AppImage
✓ building        target=zip
✓ uploading artifacts: linux-builds
```

**Windows 构建成功**:
```
✓ packaging       platform=win32 arch=x64
✓ building        target=nsis
✓ building        target=portable
✓ uploading artifacts: windows-builds
```

**成功的发布**:
```
✓ Release created
✓ 4 files uploaded
```

## 自定义工作流

### 修改矩阵

编辑 `.github/workflows/release.yml` 的 `matrix.include`:

```yaml
matrix:
  include:
    - os: ubuntu-latest
      platform: linux
      build_cmd: npm run build
      # ... 其他配置
    
    - os: ubuntu-latest
      platform: windows
      build_cmd: npm run build:win
      # ... 其他配置
    
    # 添加新的平台
    - os: macos-latest
      platform: macos
      build_cmd: npm run build:mac
      # ... 其他配置
```

### 修改发布说明

编辑 `release.yml` 中的 `body` 字段:

```yaml
body: |
  # 自定义发布说明
  ## 新功能
  - 功能 1
  - 功能 2
```

### 修改版本标签

修改 `tag_name` 字段:

```yaml
tag_name: release-${{ github.run_number }}
```

## 故障排查

### 编译失败

**问题**: Build job 失败
**解决**:
1. 查看 job 的详细日志
2. 通常是依赖问题或代码错误
3. 修复后重新运行工作流

### Release 不被创建

**问题**: Build 成功但 Release 没有创建
**解决**:
1. 检查 GITHUB_TOKEN 权限
2. 确保仓库设置允许创建 Release
3. 查看 release job 的日志

### 文件上传失败

**问题**: Release 创建但文件不完整
**解决**:
1. 检查 artifacts 是否成功上传
2. 验证文件路径是否正确
3. 检查文件大小限制

## 触发工作流

### 手动触发 (UI)
1. GitHub 项目主页
2. Actions → Build and Release
3. Run workflow

### 通过 GitHub CLI
```bash
gh workflow run release.yml
```

### 未来可能的自动触发 (需修改)
- 当推送到 main 分支时
- 当创建 git tag 时
- 定时触发

## 成功标志

工作流完成后应该看到:
✓ 所有 build jobs 成功 (绿色)
✓ release job 成功 (绿色)
✓ GitHub Releases 页面显示新版本
✓ 所有文件都可下载

## 相关文件

- 工作流配置: `.github/workflows/release.yml`
- 发布指南: `RELEASE_GUIDE.md`
- 快速开始: `QUICK_START.md`
- Windows 安装: `WINDOWS_SETUP.md`
- 构建指令: `BUILD_INSTRUCTIONS.md`
