# Windows 安装和运行指南

## 快速开始

1. **下载并解压**
   - 下载 `Browser-Manager-Windows.zip`
   - 使用 Windows 自带的解压工具或 7-Zip 解压到一个文件夹
   - **重要**：保持完整的文件夹结构，所有 .dll 文件必须和 exe 在同一目录

2. **运行方式（三选一）**

   **方式A：运行启动脚本（推荐）**
   - 双击 `start.bat` 文件
   
   **方式B：直接运行 exe**
   - 进入解压后的文件夹
   - 双击 `Browser Manager.exe`
   
   **方式C：命令行运行**
   ```cmd
   cd 解压文件夹路径
   "Browser Manager.exe"
   ```

## 常见问题

### 问题：找不到 ffmpeg.dll

**解决方案**：
1. 确保您解压了完整的 ZIP 文件
2. 检查解压后的文件夹中是否有这些文件：
   - Browser Manager.exe
   - ffmpeg.dll
   - libEGL.dll
   - libGLESv2.dll
   - d3dcompiler_47.dll
   - 其他 .dll 和 .pak 文件

3. 如果缺少文件，重新下载并解压 ZIP

### 问题：程序启动后闪退

1. 在命令行中运行 exe，查看具体错误信息：
   ```cmd
   "Browser Manager.exe"
   ```

2. 检查是否有其他缺失的依赖

### 问题：防火墙或杀毒软件阻止

- 将应用添加到防火墙白名单
- 如果杀毒软件阻止，可以选择信任该应用

## 文件结构

解压后应该看到这样的结构：

```
Browser-Manager-Windows/
├── Browser Manager.exe         (主程序)
├── start.bat                   (启动脚本)
├── ffmpeg.dll                  (必需)
├── libEGL.dll                  (必需)
├── libGLESv2.dll               (必需)
├── d3dcompiler_47.dll          (必需)
├── vk_swiftshader.dll          (必需)
├── vulkan-1.dll                (必需)
├── resources.pak               (必需)
├── chrome_*.pak                (必需)
├── v8_context_snapshot.bin     (必需)
├── snapshot_blob.bin           (必需)
├── icudtl.dat                  (必需)
├── LICENSES.chromium.html      
├── LICENSE.electron.txt        
├── locales/                    (目录)
└── resources/                  (目录)
```

**重要**：不能删除任何 .dll 或 .pak 文件，否则程序无法运行。

## 使用应用

### GUI 界面
启动后会看到 Browser Manager 主窗口：
- 创建新 Profile
- 查看所有 Profile 列表
- 打开任意 Profile 使用独立浏览器
- 删除不需要的 Profile

### CLI 命令行

如果需要通过命令行使用，需要在项目目录中运行：

```cmd
npm run cli create myprofile
npm run cli list
npm run cli open myprofile
npm run cli delete myprofile
```

## 卸载

直接删除解压的文件夹即可，无需额外操作。
