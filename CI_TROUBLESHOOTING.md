# GitHub Actions 构建故障排查

## 常见问题和解决方案

### 1. 构建被取消 (Build canceled)

**症状**: 构建过程中突然停止，日志显示 "The operation was canceled"

**可能原因**:
- GitHub Actions 超时（默认 6 小时，我们设置为 60 分钟）
- 磁盘空间不足
- 内存不足
- 网络中断
- 手动取消

**排查步骤**:
1. 查看 Actions 日志中的 "Check disk space" 步骤输出
2. 查看 "Collect logs on failure" 步骤的诊断信息
3. 检查是否有内存或磁盘的错误
4. 重新运行工作流

### 2. Linux 构建超时

**症状**: AppImage 或 ZIP 构建花费超过 10 分钟

**原因分析**:
- 首次运行需要下载 Electron 二进制文件（~100 MB）
- 网络连接较慢
- GitHub Actions runner 负载过高

**解决方案**:
1. 重新运行工作流（GitHub Actions 会缓存 npm 包和 Electron）
2. 等待 10-15 分钟让构建完成

### 3. Windows 构建失败

**症状**: Windows runner 上构建失败

**常见错误**:
- 代码签名失败（已修复，使用 null 配置）
- 缺少 Visual C++ 运行库
- UAC 权限问题

**排查方法**:
1. 查看详细的构建日志
2. 确保 package.json 中的 Windows 配置正确
3. 检查是否需要安装构建工具

### 4. 发布失败 (Release not created)

**症状**: 构建成功但未创建 GitHub Release

**原因分析**:
- 没有 GITHUB_TOKEN 权限
- artifacts 上传失败
- release job 条件不满足

**检查清单**:
1. ✓ 两个构建 job 都成功完成
2. ✓ artifacts 正确上传
3. ✓ Release 权限已启用
4. ✓ 没有手动取消

### 5. 文件大小异常

**症状**: 输出文件明显过大或过小

**预期文件大小**:
| 文件 | 大小 | 范围 |
|------|------|------|
| Linux AppImage | 102 MB | 95-110 MB |
| Linux ZIP | 97 MB | 90-105 MB |
| Windows NSIS | 150 MB | 140-160 MB |
| Windows Portable | 169 MB | 160-180 MB |

**异常处理**:
- 如果文件过大：检查是否包含不必要的依赖
- 如果文件过小：可能构建不完整

## 调试技巧

### 查看详细日志

1. 进入 GitHub Actions 页面
2. 点击运行中的工作流
3. 点击 "build (ubuntu-latest)" 或 "build (windows-latest)"
4. 展开每个步骤查看输出

### 常见日志位置

```
✓ Building...              - 构建进行中
✓ downloading URL...       - 正在下载依赖
✓ packaging platform=...   - 打包开始
✓ building target=...      - 生成目标文件
✓ uploading artifacts      - 上传构建产物
```

### 识别错误

**磁盘空间错误示例**:
```
Error: No space left on device
df: /: read-only file system
```

**内存错误示例**:
```
fatal error: call stack size exceeded
JavaScript heap out of memory
```

**网络错误示例**:
```
Error: connect ECONNREFUSED
Error: socket hang up
```

## 日志收集

工作流在失败时会自动收集以下诊断信息：

```bash
# 磁盘使用情况
df -h

# 内存使用情况
free -h

# 运行中的进程
ps aux | grep -E 'electron|node'
```

这些信息出现在 "Collect logs on failure" 步骤中。

## 手动重试

如果构建因暂时性问题（网络、超时）失败：

1. 打开项目 GitHub 主页
2. Actions → Build and Release
3. 找到失败的 run
4. 点击 "Re-run all jobs" 或 "Re-run failed jobs"
5. 等待重新构建

## 性能优化建议

### 减少构建时间

1. **使用缓存**:
   - npm 包会自动缓存
   - Electron 二进制文件会缓存
   - 首次构建会较慢（10-15 分钟）

2. **跳过不必要的步骤**:
   - 只编译需要的平台
   - 删除不需要的依赖

3. **并行构建**:
   - 当前已使用 matrix 并行构建
   - Linux 和 Windows 同时进行

### 磁盘空间管理

- 每个构建产物约 100-200 MB
- GitHub Actions 环境约有 30 GB 可用空间
- artifacts 设置 1 天保留期以节省空间

## 联系支持

如果问题持续存在：

1. 检查本地是否能成功构建
2. 查看 [WORKFLOW.md](WORKFLOW.md) 了解工作流详情
3. 查看 GitHub Actions [官方文档](https://docs.github.com/en/actions)
4. 在项目 Issues 中报告问题（包含完整日志）

## 快速参考

| 问题 | 快速解决 |
|------|---------|
| 构建超时 | 重新运行（会使用缓存，更快） |
| 磁盘满 | GitHub 会自动清理；重新运行 |
| 发布失败 | 检查 GITHUB_TOKEN 权限 |
| 网络问题 | 重新运行（通常是瞬时问题） |
| Windows 失败 | 检查代码是否有语法错误 |
| Linux 失败 | 检查依赖是否正确安装 |
