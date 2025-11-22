import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const PROFILES_DIR = path.join(os.homedir(), '.browser-manager', 'profiles');

console.log('配置目录:', PROFILES_DIR);

export async function createProfile(name, browserType = 'chromium') {
  if (!name || name.trim() === '') {
    throw new Error('配置名称不能为空');
  }

  if (!['chromium', 'firefox'].includes(browserType)) {
    throw new Error(`不支持的浏览器类型: ${browserType}。支持: chromium, firefox`);
  }

  const profilePath = path.join(PROFILES_DIR, name);
  const metaPath = path.join(profilePath, 'meta.json');
  
  try {
    await fs.mkdir(PROFILES_DIR, { recursive: true });
    await fs.mkdir(profilePath, { recursive: false });
    
    const meta = {
      name,
      browserType,
      createdAt: new Date().toISOString(),
    };
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
    
    console.log(`✓ 配置 "${name}" 创建成功`);
    return profilePath;
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error(`配置 "${name}" 已存在`);
    }
    console.error(`创建配置失败:`, error.message);
    throw error;
  }
}

export async function listProfiles() {
  try {
    await fs.mkdir(PROFILES_DIR, { recursive: true });
    const entries = await fs.readdir(PROFILES_DIR, { withFileTypes: true });
    const profiles = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const profilePath = path.join(PROFILES_DIR, entry.name);
        const metaPath = path.join(profilePath, 'meta.json');
        
        let browserType = 'chromium';
        try {
          const meta = await fs.readFile(metaPath, 'utf-8');
          const metaData = JSON.parse(meta);
          browserType = metaData.browserType || 'chromium';
        } catch {
          // 旧版本或缺少 meta.json，默认为 chromium
        }
        
        profiles.push({
          name: entry.name,
          path: profilePath,
          browserType
        });
      }
    }
    
    console.log(`✓ 已加载 ${profiles.length} 个配置`);
    return profiles.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('加载配置失败:', error.message);
    throw error;
  }
}

export async function removeProfile(name) {
  if (!name || name.trim() === '') {
    throw new Error('配置名称不能为空');
  }

  const profilePath = path.join(PROFILES_DIR, name);
  
  try {
    await fs.rm(profilePath, { recursive: true, force: true });
    console.log(`✓ 配置 "${name}" 删除成功`);
  } catch (error) {
    console.error(`删除配置失败:`, error.message);
    throw new Error(`删除配置 "${name}" 失败: ${error.message}`);
  }
}

export function getProfilePath(name) {
  return path.join(PROFILES_DIR, name);
}
