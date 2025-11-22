import { chromium, firefox } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');

async function getExtensionPaths() {
  try {
    const entries = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });
    const extensions = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        extensions.push(path.join(PLUGINS_DIR, entry.name));
      }
    }
    
    return extensions;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function launchBrowser(profilePath, browserType = 'chromium') {
  if (!profilePath) {
    throw new Error('配置路径是必需的');
  }

  if (!['chromium', 'firefox'].includes(browserType)) {
    throw new Error(`不支持的浏览器类型: ${browserType}。支持: chromium, firefox`);
  }

  try {
    await fs.mkdir(profilePath, { recursive: true });
  } catch (error) {
    throw new Error(`创建配置目录失败: ${error.message}`);
  }

  const extensions = await getExtensionPaths();
  let context;

  try {
    if (browserType === 'chromium') {
      const launchArgs = [
        '--disable-blink-features=AutomationControlled',
        '-disable-extensions-except=' + extensions.join(','),
        '--load-extension=' + extensions.join(',')
      ].filter(arg => !arg.includes('=,') && !arg.includes(',-'));

      context = await chromium.launchPersistentContext(profilePath, {
        headless: false,
        args: launchArgs,
        locale: 'zh-CN',
      });
    } else if (browserType === 'firefox') {
      context = await firefox.launchPersistentContext(profilePath, {
        headless: false,
        locale: 'zh-CN',
      });
    }

    const page = await context.newPage();
    await page.goto('about:blank');

    return { context, page, browserType };
  } catch (error) {
    throw new Error(`启动浏览器失败: ${error.message}`);
  }
}

export async function closeBrowser(context) {
  try {
    if (context) {
      await context.close();
    }
  } catch (error) {
    throw new Error(`Failed to close browser: ${error.message}`);
  }
}
