import { chromium, firefox } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

const PLUGINS_DIR = path.join(process.cwd(), 'plugins');

console.log('插件目录:', PLUGINS_DIR);

async function getExtensionPaths() {
  try {
    const entries = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });
    const extensions = [];
    
    // 加载 Chrome 插件（只要目录中有 manifest.json 就是有效的扩展）
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const manifestPath = path.join(PLUGINS_DIR, entry.name, 'manifest.json');
        try {
          await fs.stat(manifestPath);
          extensions.push(path.join(PLUGINS_DIR, entry.name));
          console.log(`✓ 已加载 Chrome 扩展: ${entry.name}`);
        } catch {
          // 不是有效的扩展目录，跳过
        }
      }
    }
    
    return extensions;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('⚠ 插件目录不存在');
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

  // 处理 Firefox 扩展：复制 xpi 文件到 Firefox 扩展目录
  if (browserType === 'firefox') {
    const firefoxExtDir = path.join(profilePath, 'extensions');
    try {
      await fs.mkdir(firefoxExtDir, { recursive: true });
      const xpiPath = path.join(PLUGINS_DIR, 'my-fingerprint-firefox.xpi');
      const targetXpi = path.join(firefoxExtDir, 'my-fingerprint@browser.xpi');
      try {
        await fs.stat(xpiPath);
        await fs.copyFile(xpiPath, targetXpi);
        console.log('✓ Firefox 扩展已安装');
      } catch {
        console.log('⚠ Firefox 扩展文件未找到');
      }
    } catch (error) {
      console.error('处理 Firefox 扩展失败:', error.message);
    }
  }

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
