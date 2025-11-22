#!/usr/bin/env node

import { program } from 'commander';
import { createProfile, listProfiles, removeProfile, getProfilePath } from './manager.js';
import { launchBrowser, closeBrowser } from './launcher.js';

program
  .name('bm')
  .description('浏览器账号管理器')
  .version('1.0.0');

program
  .command('create <name>')
  .description('创建新的配置')
  .action(async (name) => {
    try {
      const profilePath = await createProfile(name);
      console.log(`配置 "${name}" 创建成功，路径: ${profilePath}`);
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
  .command('open <name>')
  .description('在浏览器中打开配置')
  .action(async (name) => {
    try {
      const profilePath = getProfilePath(name);
      console.log(`正在打开配置 "${name}"...`);
      const { context } = await launchBrowser(profilePath);
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
