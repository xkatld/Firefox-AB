import { chromium } from 'playwright';
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

export async function launchBrowser(profilePath) {
  if (!profilePath) {
    throw new Error('Profile path is required');
  }

  try {
    await fs.mkdir(profilePath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create profile directory: ${error.message}`);
  }

  const extensions = await getExtensionPaths();

  const launchArgs = [
    '--disable-blink-features=AutomationControlled',
    '-disable-extensions-except=' + extensions.join(','),
    '--load-extension=' + extensions.join(',')
  ].filter(arg => !arg.includes('=,') && !arg.includes(',-'));

  try {
    const context = await chromium.launchPersistentContext(profilePath, {
      headless: false,
      args: launchArgs,
      locale: 'en-US',
    });

    const page = await context.newPage();
    await page.goto('about:blank');

    return { context, page };
  } catch (error) {
    throw new Error(`Failed to launch browser: ${error.message}`);
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
