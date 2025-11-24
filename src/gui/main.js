import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { createProfile, listProfiles, removeProfile, getProfilePath, updateProfile, renameProfile, regenerateFingerprint, createGroup, listGroups, updateGroup, deleteGroup, exportProfile, importProfile, batchDeleteProfiles } from '../manager.js';
import { launchBrowser, closeBrowser } from '../launcher.js';
import { checkBrowsersInstalled } from '../browser-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 在应用准备好时设置浏览器路径
// 获取应用根目录
function getAppRoot() {
  const appPath = app.getAppPath();
  // appPath 在打包时是 resources/app，在开发时是项目根目录
  if (appPath.includes('resources')) {
    // 打包环境：resources/app -> 往上两级到达应用根目录
    return path.join(appPath, '..', '..');
  } else {
    // 开发环境：直接返回项目根目录
    return appPath;
  }
}

const appRoot = getAppRoot();
const browsersPath = path.join(appRoot, 'browsers');
process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;

console.log('\n========== Electron Main Process ==========');
console.log('App Root:', appRoot);
console.log('Browsers Path:', browsersPath);
console.log('Browsers Exist:', existsSync(browsersPath));
console.log('==========================================\n');

let mainWindow;
let browserProcesses = {};

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.cjs');
  const indexPath = path.join(__dirname, 'index.html');
  
  console.log('\n========== 应用启动 ==========');
  console.log('预加载脚本:', preloadPath);
  console.log('HTML 文件:', indexPath);
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    center: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    }
  });

  mainWindow.maximize();

  mainWindow.webContents.on('console-message', (level, message, line, sourceId) => {
    console.log(`[Renderer] ${message}`);
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('渲染进程崩溃!');
  });

  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('预加载脚本加载失败:', preloadPath, error);
  });

  mainWindow.loadFile(indexPath);
  console.log('========== 应用已加载 ==========\n');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle('list-profiles', async () => {
  try {
    return await listProfiles();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('create-profile', async (event, name, options) => {
  try {
    const profilePath = await createProfile(name, options);
    return { success: true, path: profilePath };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('delete-profile', async (event, name) => {
  try {
    await removeProfile(name);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('check-browsers', async () => {
  try {
    const status = checkBrowsersInstalled();
    return { success: true, ...status };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('open-profile', async (event, name) => {
  try {
    if (browserProcesses[name]) {
      return { error: '该配置已经在运行中' };
    }
    const profilePath = getProfilePath(name);
    const { context } = await launchBrowser(profilePath, name);
    browserProcesses[name] = context;
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('close-profile', async (event, name) => {
  try {
    if (browserProcesses[name]) {
      await closeBrowser(browserProcesses[name]);
      delete browserProcesses[name];
    }
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('get-running-profiles', async () => {
  try {
    return { success: true, profiles: Object.keys(browserProcesses) };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('update-profile', async (event, name, updates) => {
  try {
    await updateProfile(name, updates);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('rename-profile', async (event, oldName, newName) => {
  try {
    if (browserProcesses[oldName]) {
      return { error: '请先关闭该配置再重命名' };
    }
    await renameProfile(oldName, newName);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('regenerate-fingerprint', async (event, name) => {
  try {
    const fingerprint = await regenerateFingerprint(name);
    return { success: true, fingerprint };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('create-group', async (event, name, color) => {
  try {
    const group = await createGroup(name, color);
    return { success: true, group };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('list-groups', async () => {
  try {
    const groups = await listGroups();
    return { success: true, groups };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('update-group', async (event, id, updates) => {
  try {
    const group = await updateGroup(id, updates);
    return { success: true, group };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('delete-group', async (event, id) => {
  try {
    await deleteGroup(id);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('export-profile', async (event, name) => {
  try {
    const config = await exportProfile(name);
    return { success: true, config };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('import-profile', async (event, name, config) => {
  try {
    const profilePath = await importProfile(name, config);
    return { success: true, path: profilePath };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('batch-delete-profiles', async (event, names) => {
  try {
    const results = await batchDeleteProfiles(names);
    return { success: true, results };
  } catch (error) {
    return { error: error.message };
  }
});

app.on('before-quit', async () => {
  for (const [name, context] of Object.entries(browserProcesses)) {
    try {
      await closeBrowser(context);
    } catch (error) {
      console.error(`Failed to close browser for ${name}:`, error);
    }
  }
});
