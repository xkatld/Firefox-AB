# GitHub Actions 调试指南

## 构建被取消时的快速排查

### 症状
构建日志显示 `Error: The operation was canceled` 且没有明确的错误信息。

### 第一步：检查日志

1. **查看构建进度**
   ```
   GitHub 主页 → Actions → Build and Release → [失败的 run]
   ```

2. **识别在哪一步被取消**
   - 查看日志中最后显示的步骤
   - 记下具体的日志位置

3. **检查这些日志步骤**

#### 常见取消位置

| 位置 | 原因 | 排查方法 |
|------|------|---------|
| AppImage 构建中 | 磁盘/内存 | 检查 "Check disk space" 日志 |
| ZIP 压缩中 | 磁盘/内存 | 检查磁盘空间输出 |
| 上传 artifacts | 网络/超时 | 查看上传步骤日志 |
| 下载 artifacts | 网络/文件不存在 | 查看 "Verify downloads" 日志 |

### 第二步：解读诊断信息

#### 检查磁盘空间

日志中查找：
```
=== Disk space ===
Filesystem     Size  Used Avail Use% Mounted on
/dev/root       84G   20G   64G  24% /
```

**判断标准**:
- ✓ 可用 > 10GB：正常
- ⚠ 可用 5-10GB：可能有问题
- ✗ 可用 < 5GB：几乎肯定有问题

#### 检查上传状态

日志中查找：
```
=== Build outputs in dist/ ===
```

应该显示：
```
-rw-r--r--  1 root root  102M ... Browser Manager-1.0.0.AppImage
-rw-r--r--  1 root root   97M ... browser-manager-1.0.0.zip
```

如果缺少文件，说明构建不完整。

#### 检查下载状态

日志中查找：
```
=== Linux builds download status: success ===
=== Windows builds download status: success ===
```

- `success`：下载成功
- `failure`：下载失败（可能是构建失败）
- `skipped`：这个平台的构建被跳过

### 第三步：决定下一步操作

#### 情况 1：磁盘空间问题

GitHub Actions 环境有约 30GB 可用空间。如果发现磁盘满：

```bash
重新运行工作流
GitHub Actions 会自动清理旧 artifacts
```

#### 情况 2：构建不完整

说明代码有问题。检查：
1. 本地能否成功构建？
   ```bash
   npm run build:linux  # Linux
   npm run build:win    # Windows
   ```
2. 有没有新的错误信息？

#### 情况 3：上传失败

可能是网络问题。解决方法：

```
1. 重新运行工作流（GitHub Actions 界面）
2. 或使用 GitHub CLI：
   gh workflow run release.yml
```

#### 情况 4：下载失败

说明某个平台的构建失败了。检查：
1. 该平台的构建日志
2. 是否有构建错误信息

### 重新运行工作流

#### 在 GitHub 界面中

1. 进入 GitHub 项目主页
2. 点击 **Actions** 标签
3. 点击左侧的 **Build and Release**
4. 找到失败的 run（显示红色 ✗）
5. 点击 **Re-run all jobs** 或 **Re-run failed jobs**
6. 等待重新构建

#### 使用 GitHub CLI

```bash
# 列出最近的工作流运行
gh run list --workflow=release.yml --limit=5

# 重新运行最后一次失败
gh run rerun <run-id>

# 查看实时日志
gh run view <run-id> --log
```

### 查看完整日志

#### 方法 1：直接在网站查看

1. Actions → Build and Release → [run]
2. 点击 **build (ubuntu-latest)** 或 **build (windows-latest)**
3. 展开每个步骤查看详细输出

#### 方法 2：下载日志

1. 进入 Actions 页面
2. 右上角点击 **...**
3. 选择 **Download all logs**

#### 方法 3：使用 GitHub CLI

```bash
# 下载完整日志
gh run view <run-id> --log > run-log.txt

# 查看特定步骤的日志
gh run view <run-id> --log | grep "build application" -A 50
```

## 常见问题排查表

| 问题 | 检查项 | 解决方案 |
|------|--------|---------|
| 被取消但无错误 | 磁盘空间 | 重新运行 |
| AppImage 失败 | Linux 日志 | 检查代码错误 |
| Windows exe 失败 | Windows 日志 | 检查代码错误 |
| 发布失败 | Download 状态 | 检查构建输出 |
| 网络中断 | 下载 URL | 重新运行 |

## 诊断脚本

在本地运行以验证构建环境：

```bash
./diagnose.sh
```

这会输出：
- 系统信息
- 磁盘和内存使用情况
- Node.js/npm 版本
- 依赖包大小
- 项目结构检查

## 进阶：调试 electron-builder

如果问题与 electron-builder 有关：

```bash
# 本地调试
DEBUG=electron-builder npm run build:linux

# 查看 electron-builder 配置
DEBUG=* npm run build:linux 2>&1 | head -100
```

## 获取帮助

如果以上步骤都不能解决问题：

1. **收集完整信息**
   - 完整构建日志（复制或下载）
   - `./diagnose.sh` 的输出
   - 本地构建测试的结果

2. **创建 Issue**
   - 项目 GitHub 页面 → Issues → New Issue
   - 标题：`[CI/CD] Build canceled with error: ...`
   - 内容：附加上面收集的信息

3. **参考资源**
   - [GitHub Actions 文档](https://docs.github.com/en/actions)
   - [electron-builder 文档](https://www.electron.build)
   - [CI_TROUBLESHOOTING.md](CI_TROUBLESHOOTING.md)
