import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.join(__dirname, '..', 'profiles');

export async function createProfile(name) {
  if (!name || name.trim() === '') {
    throw new Error('Profile name cannot be empty');
  }

  const profilePath = path.join(PROFILES_DIR, name);
  
  try {
    await fs.mkdir(PROFILES_DIR, { recursive: true });
    await fs.mkdir(profilePath, { recursive: false });
    return profilePath;
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error(`Profile "${name}" already exists`);
    }
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
        profiles.push({
          name: entry.name,
          path: path.join(PROFILES_DIR, entry.name)
        });
      }
    }
    
    return profiles.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function removeProfile(name) {
  if (!name || name.trim() === '') {
    throw new Error('Profile name cannot be empty');
  }

  const profilePath = path.join(PROFILES_DIR, name);
  
  try {
    await fs.rm(profilePath, { recursive: true, force: true });
  } catch (error) {
    throw new Error(`Failed to delete profile "${name}": ${error.message}`);
  }
}

export function getProfilePath(name) {
  return path.join(PROFILES_DIR, name);
}
