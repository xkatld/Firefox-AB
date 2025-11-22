# GitHub Actions 工作流说明

## 完整流程图

```
┌─────────────────────────────────────────────────────────┐
│  手动触发：点击 "Run workflow" 按钮                      │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Build Job (matrix) │
        └──────────┬──────────┘
                   │
        ┌──────────┴──────────────┬──────────────┐
        │                         │              │
   ┌────▼────┐            ┌──────▼────┐   ┌────▼────┐
   │          │            │           │   │          │
   │          │            │           │   │          │
   │Ubuntu    │            │Ubuntu     │   │Ubuntu    │
   │Linux     │            │Windows    │   │...       │
   │Build     │            │Build      │   │(future)  │
   │          │            │           │   │          │
   └────┬─────┘            └──────┬────┘   └────┬─────┘
        │                         │             │
    Uploads                   Uploads       Uploads
    Artifacts                 Artifacts     Artifacts
        │                         │             │
        └──────────┬──────────────┴─────────────┘
                   │
        ┌──────────▼──────────────┐
        │  Release Job            │
        │  (等待所有 builds 完成)  │
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
Ubuntu Latest
    ↓
检出代码
    ↓
安装 Node.js 18
    ↓
安装系统依赖 (wine for Windows build)
    ↓
npm install
    ↓
npm run build
    ↓
生成:
  - Browser Manager-1.0.0.AppImage (Linux 直接运行)
  - browser-manager-1.0.0.zip (Linux 压缩包)
    ↓
上传 artifacts (linux-builds)
```

#### Windows Build (on Linux with Wine)
```
Ubuntu Latest
    ↓
检出代码
    ↓
安装 Node.js 18
    ↓
安装系统依赖 (wine for cross-compilation)
    ↓
npm install
    ↓
npm run build:win
    ↓
生成:
  - Browser-Manager-Windows.zip
    包含: Browser Manager.exe + 所有 DLL
    ↓
上传 artifacts (windows-builds)
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

| 步骤 | 预计时间 |
|------|----------|
| 检出代码 | 1-2 分钟 |
| 安装依赖 | 2-3 分钟 |
| Linux 编译 | 4-5 分钟 |
| Windows 编译 | 5-7 分钟 |
| 创建 Release | 1-2 分钟 |
| **总计** | **13-19 分钟** |

## 输出文件

### Linux Build
```
dist/
├── Browser Manager-1.0.0.AppImage      (102 MB)
└── browser-manager-1.0.0.zip           (97 MB)
```

### Windows Build
```
dist/
└── Browser-Manager-Windows.zip         (105 MB)
    └── 包含所有依赖:
        ├── Browser Manager.exe         (169 MB)
        ├── ffmpeg.dll
        ├── libEGL.dll
        ├── libGLESv2.dll
        ├── d3dcompiler_47.dll
        ├── 其他 DLL 和资源文件...
```

## 监控和日志

### 查看进度
1. GitHub 项目 → Actions 选项卡
2. 点击正在运行的工作流
3. 查看每个 job 的状态
4. 点击 job 查看详细日志

### 常见日志输出

**成功的构建**:
```
✓ packaging       platform=linux arch=x64
✓ building        target=AppImage
✓ building        target=zip
```

**成功的发布**:
```
✓ Release created
✓ 3 files uploaded
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
