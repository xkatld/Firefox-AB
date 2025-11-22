#!/usr/bin/env node

import { program } from 'commander';
import { createProfile, listProfiles, removeProfile, getProfilePath } from './manager.js';
import { launchBrowser, closeBrowser } from './launcher.js';

program
  .name('bm')
  .description('浏览器账号管理器')
  .version('1.0.0');

program
  .command('create <name> [browserType]')
  .description('创建新的配置')
  .action(async (name, browserType = 'chromium') => {
    try {
      const validTypes = ['chromium', 'firefox'];
      if (!validTypes.includes(browserType)) {
        throw new Error(`不支持的浏览器类型: ${browserType}。支持: ${validTypes.join(', ')}`);
      }
      const profilePath = await createProfile(name, browserType);
      const typeLabel = browserType === 'firefox' ? '火狐' : '谷歌';
      console.log(`配置 "${name}" (${typeLabel}) 创建成功，路径: ${profilePath}`);
    } catch (error) {
      console.error(`错误: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('列出所有配置')
  .action(async () => {
    try {
      const profiles = await listProfiles();
      if (profiles.length === 0) {
        console.log('未找到配置');
        return;
      }
      console.log('\n可用的配置:');
      console.log('-----------');
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.name}`);
        console.log(`   路径: ${profile.path}`);
      });
      console.log('');
    } catch (error) {
      console.error(`错误: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('delete <name>')
  .description('删除配置')
  .action(async (name) => {
    try {
      await removeProfile(name);
      console.log(`配置 "${name}" 删除成功`);
    } catch (error) {
      console.error(`错误: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('open <name> [browserType]')
  .description('在浏览器中打开配置')
  .action(async (name, browserType) => {
    try {
      let type = browserType || 'chromium';
      
      if (browserType && !['chromium', 'firefox'].includes(browserType)) {
        throw new Error(`不支持的浏览器类型: ${browserType}。支持: chromium, firefox`);
      }
      
      const profilePath = getProfilePath(name);
      const typeLabel = type === 'firefox' ? '火狐' : '谷歌';
      console.log(`正在打开配置 "${name}" (${typeLabel})...`);
      const { context } = await launchBrowser(profilePath, type);
      console.log(`浏览器启动成功，按 Ctrl+C 关闭。`);
      
      process.on('SIGINT', async () => {
        console.log('\n正在关闭浏览器...');
        await closeBrowser(context);
        process.exit(0);
      });
    } catch (error) {
      console.error(`错误: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
