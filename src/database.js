import initSqlJs from 'sql.js';
import path from 'path';
import os from 'os';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const DB_DIR = path.join(os.homedir(), '.browser-manager');
const DB_PATH = path.join(DB_DIR, 'data.db');

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

let db = null;
let SQL = null;

async function initDatabase() {
  if (db) return db;
  
  SQL = await initSqlJs();
  
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      browser_type TEXT NOT NULL,
      enable_fingerprint INTEGER DEFAULT 1,
      group_id INTEGER,
      notes TEXT,
      starred INTEGER DEFAULT 0,
      proxy_server TEXT,
      proxy_username TEXT,
      proxy_password TEXT,
      start_url TEXT,
      custom_args TEXT,
      fingerprint TEXT,
      created_at TEXT NOT NULL,
      last_used TEXT,
      use_count INTEGER DEFAULT 0
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT 'blue',
      created_at TEXT NOT NULL
    )
  `);
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_profiles_group_id ON profiles(group_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name)`);
  
  saveDatabase();
  
  return db;
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

export async function createProfile(profileData) {
  const database = await initDatabase();
  
  database.run(`
    INSERT INTO profiles (
      name, browser_type, enable_fingerprint, group_id, notes, starred,
      proxy_server, proxy_username, proxy_password, start_url, custom_args,
      fingerprint, created_at, last_used, use_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    profileData.name,
    profileData.browserType,
    profileData.enableFingerprint ? 1 : 0,
    profileData.groupId || null,
    profileData.notes || null,
    profileData.starred ? 1 : 0,
    profileData.proxyServer || null,
    profileData.proxyUsername || null,
    profileData.proxyPassword || null,
    profileData.startUrl || null,
    profileData.customArgs || null,
    profileData.fingerprint || null,
    profileData.createdAt,
    null,
    0
  ]);
  
  saveDatabase();
}

export async function listProfiles() {
  const database = await initDatabase();
  
  const result = database.exec('SELECT * FROM profiles ORDER BY starred DESC, name ASC');
  
  if (!result.length || !result[0].values.length) {
    return [];
  }
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    
    return {
      name: obj.name,
      browserType: obj.browser_type,
      enableFingerprint: obj.enable_fingerprint === 1,
      group: obj.group_id ? String(obj.group_id) : '',
      notes: obj.notes || '',
      starred: obj.starred === 1,
      proxy: obj.proxy_server ? {
        server: obj.proxy_server,
        username: obj.proxy_username,
        password: obj.proxy_password
      } : null,
      startUrl: obj.start_url || '',
      customArgs: obj.custom_args || '',
      fingerprint: obj.fingerprint ? JSON.parse(obj.fingerprint) : null,
      createdAt: obj.created_at,
      lastUsed: obj.last_used,
      useCount: obj.use_count
    };
  });
}

export async function getProfile(name) {
  const database = await initDatabase();
  
  const result = database.exec('SELECT * FROM profiles WHERE name = ?', [name]);
  
  if (!result.length || !result[0].values.length) {
    return null;
  }
  
  const columns = result[0].columns;
  const row = result[0].values[0];
  
  const obj = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  
  return {
    name: obj.name,
    browserType: obj.browser_type,
    enableFingerprint: obj.enable_fingerprint === 1,
    group: obj.group_id ? String(obj.group_id) : '',
    notes: obj.notes || '',
    starred: obj.starred === 1,
    proxy: obj.proxy_server ? {
      server: obj.proxy_server,
      username: obj.proxy_username,
      password: obj.proxy_password
    } : null,
    startUrl: obj.start_url || '',
    customArgs: obj.custom_args || '',
    fingerprint: obj.fingerprint ? JSON.parse(obj.fingerprint) : null,
    createdAt: obj.created_at,
    lastUsed: obj.last_used,
    useCount: obj.use_count
  };
}

export async function updateProfile(name, updates) {
  const database = await initDatabase();
  
  const fields = [];
  const values = [];
  
  if (updates.group !== undefined) {
    fields.push('group_id = ?');
    values.push(updates.group ? parseInt(updates.group) : null);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }
  if (updates.starred !== undefined) {
    fields.push('starred = ?');
    values.push(updates.starred ? 1 : 0);
  }
  if (updates.proxy !== undefined) {
    fields.push('proxy_server = ?', 'proxy_username = ?', 'proxy_password = ?');
    values.push(
      updates.proxy?.server || null,
      updates.proxy?.username || null,
      updates.proxy?.password || null
    );
  }
  if (updates.startUrl !== undefined) {
    fields.push('start_url = ?');
    values.push(updates.startUrl);
  }
  if (updates.customArgs !== undefined) {
    fields.push('custom_args = ?');
    values.push(updates.customArgs);
  }
  if (updates.fingerprint !== undefined) {
    fields.push('fingerprint = ?');
    values.push(updates.fingerprint ? JSON.stringify(updates.fingerprint) : null);
  }
  
  if (fields.length === 0) return;
  
  values.push(name);
  database.run(`UPDATE profiles SET ${fields.join(', ')} WHERE name = ?`, values);
  saveDatabase();
}

export async function renameProfile(oldName, newName) {
  const database = await initDatabase();
  database.run('UPDATE profiles SET name = ? WHERE name = ?', [newName, oldName]);
  saveDatabase();
}

export async function deleteProfile(name) {
  const database = await initDatabase();
  database.run('DELETE FROM profiles WHERE name = ?', [name]);
  saveDatabase();
}

export async function updateProfileUsage(name) {
  const database = await initDatabase();
  database.run(`
    UPDATE profiles 
    SET last_used = ?, use_count = use_count + 1 
    WHERE name = ?
  `, [new Date().toISOString(), name]);
  saveDatabase();
}

export async function createGroup(groupData) {
  const database = await initDatabase();
  
  database.run(`
    INSERT INTO groups (name, color, created_at)
    VALUES (?, ?, ?)
  `, [groupData.name, groupData.color, groupData.createdAt]);
  
  saveDatabase();
  
  const result = database.exec('SELECT last_insert_rowid() as id');
  const id = result[0].values[0][0];
  
  return { id: String(id), ...groupData };
}

export async function listGroups() {
  const database = await initDatabase();
  
  const result = database.exec('SELECT * FROM groups ORDER BY name ASC');
  
  if (!result.length || !result[0].values.length) {
    return [];
  }
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    
    return {
      id: String(obj.id),
      name: obj.name,
      color: obj.color,
      createdAt: obj.created_at
    };
  });
}

export async function updateGroup(id, updates) {
  const database = await initDatabase();
  
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }
  
  if (fields.length === 0) return;
  
  values.push(parseInt(id));
  database.run(`UPDATE groups SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export async function deleteGroup(id) {
  const database = await initDatabase();
  
  database.run('UPDATE profiles SET group_id = NULL WHERE group_id = ?', [parseInt(id)]);
  database.run('DELETE FROM groups WHERE id = ?', [parseInt(id)]);
  saveDatabase();
}

export async function batchDeleteProfiles(names) {
  const database = await initDatabase();
  const results = [];
  
  for (const name of names) {
    try {
      database.run('DELETE FROM profiles WHERE name = ?', [name]);
      results.push({ name, success: true });
    } catch (error) {
      results.push({ name, success: false, error: error.message });
    }
  }
  
  saveDatabase();
  return results;
}

export { initDatabase, saveDatabase };
