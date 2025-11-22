import { chromium, firefox } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const PLUGINS_DIR = path.join(os.homedir(), '.browser-manager', 'plugins');

console.log('插件目录:', PLUGINS_DIR);

async function getExtensionPaths() {
  try {
    const entries = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });
    const extensions = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        extensions.push(path.join(PLUGINS_DIR, entry.name));
      }
    }
    
    if (extensions.length > 0) {
      console.log(`✓ 已加载 ${extensions.length} 个扩展`);
    }
    return extensions;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('⚠ 插件目录不存在，跳过加载扩展');
      return [];
    }
    console.error('获取扩展失败:', error.message);
    return [];
  }
}

export async function launchBrowser(profilePath, browserType = 'chromium') {
  if (!profilePath) {
    throw new Error('配置路径是必需的');
  }

  if (!['chromium', 'firefox'].includes(browserType)) {
    throw new Error(`不支持的浏览器类型: ${browserType}。支持: chromium, firefox`);
  }

  console.log(`启动浏览器: ${browserType}, 配置路径: ${profilePath}`);

  try {
    await fs.mkdir(profilePath, { recursive: true });
    console.log(`✓ 配置目录已就绪: ${profilePath}`);
  } catch (error) {
    console.error(`配置目录处理失败:`, error.message);
    throw new Error(`配置目录处理失败: ${error.message}`);
  }

  const extensions = await getExtensionPaths();

  const launchArgs = [
    '--disable-blink-features=AutomationControlled',
    '-disable-extensions-except=' + extensions.join(','),
    '--load-extension=' + extensions.join(',')
  ].filter(arg => !arg.includes('=,') && !arg.includes(',-'));

  let context;
  try {
    if (browserType === 'chromium') {
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

    console.log(`✓ 浏览器启动成功: ${browserType}`);
    return { context, page, browserType };
  } catch (error) {
    console.error(`启动浏览器失败:`, error.message);
    throw new Error(`启动浏览器失败: ${error.message}`);
  }
}

export async function closeBrowser(context) {
  try {
    if (context) {
      await context.close();
      console.log('✓ 浏览器已关闭');
    }
  } catch (error) {
    console.error(`关闭浏览器失败:`, error.message);
    throw new Error(`关闭浏览器失败: ${error.message}`);
  }
}
