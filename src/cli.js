#!/usr/bin/env node

import { program } from 'commander';
import { createProfile, listProfiles, removeProfile, getProfilePath } from './manager.js';
import { launchBrowser, closeBrowser } from './launcher.js';

program
  .name('bm')
  .description('Browser Account Manager')
  .version('1.0.0');

program
  .command('create <name>')
  .description('Create a new profile')
  .action(async (name) => {
    try {
      const profilePath = await createProfile(name);
      console.log(`Profile "${name}" created successfully at ${profilePath}`);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all profiles')
  .action(async () => {
    try {
      const profiles = await listProfiles();
      if (profiles.length === 0) {
        console.log('No profiles found');
        return;
      }
      console.log('\nAvailable Profiles:');
      console.log('-------------------');
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.name}`);
        console.log(`   Path: ${profile.path}`);
      });
      console.log('');
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('delete <name>')
  .description('Delete a profile')
  .action(async (name) => {
    try {
      await removeProfile(name);
      console.log(`Profile "${name}" deleted successfully`);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('open <name>')
  .description('Open a profile in browser')
  .action(async (name) => {
    try {
      const profilePath = getProfilePath(name);
      console.log(`Opening profile "${name}"...`);
      const { context } = await launchBrowser(profilePath);
      console.log(`Browser launched successfully. Press Ctrl+C to close.`);
      
      process.on('SIGINT', async () => {
        console.log('\nClosing browser...');
        await closeBrowser(context);
        process.exit(0);
      });
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
