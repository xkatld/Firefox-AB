import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProfile, listProfiles, removeProfile, getProfilePath } from '../manager.js';
import { launchBrowser, closeBrowser } from '../launcher.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow;
let browserProcesses = {};

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  const indexPath = path.join(__dirname, 'index.html');
  
  console.log('Loading app...');
  console.log('Preload path:', preloadPath);
  console.log('Index path:', indexPath);
  
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false,
    }
  });

  mainWindow.webContents.on('console-message', (level, message, line, sourceId) => {
    console.log(`[${sourceId}:${line}] ${message}`);
  });

  mainWindow.loadFile(indexPath);

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

ipcMain.handle('create-profile', async (event, name) => {
  try {
    const profilePath = await createProfile(name);
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

ipcMain.handle('open-profile', async (event, name) => {
  try {
    const profilePath = getProfilePath(name);
    const { context } = await launchBrowser(profilePath);
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

app.on('before-quit', async () => {
  for (const [name, context] of Object.entries(browserProcesses)) {
    try {
      await closeBrowser(context);
    } catch (error) {
      console.error(`Failed to close browser for ${name}:`, error);
    }
  }
});
