import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import { existsSync, mkdirSync } from 'fs';

const DB_DIR = path.join(os.homedir(), '.browser-manager');
const DB_PATH = path.join(DB_DIR, 'data.db');

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
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
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT 'blue',
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
  CREATE INDEX IF NOT EXISTS idx_profiles_group_id ON profiles(group_id);
  CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
`);

export function createProfile(profileData) {
  const stmt = db.prepare(`
    INSERT INTO profiles (
      name, browser_type, enable_fingerprint, group_id, notes, starred,
      proxy_server, proxy_username, proxy_password, start_url, custom_args,
      fingerprint, created_at, last_used, use_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return stmt.run(
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
  );
}

export function listProfiles() {
  const stmt = db.prepare('SELECT * FROM profiles ORDER BY starred DESC, name ASC');
  const rows = stmt.all();
  
  return rows.map(row => ({
    name: row.name,
    browserType: row.browser_type,
    enableFingerprint: row.enable_fingerprint === 1,
    group: row.group_id ? String(row.group_id) : '',
    notes: row.notes || '',
    starred: row.starred === 1,
    proxy: row.proxy_server ? {
      server: row.proxy_server,
      username: row.proxy_username,
      password: row.proxy_password
    } : null,
    startUrl: row.start_url || '',
    customArgs: row.custom_args || '',
    fingerprint: row.fingerprint ? JSON.parse(row.fingerprint) : null,
    createdAt: row.created_at,
    lastUsed: row.last_used,
    useCount: row.use_count
  }));
}

export function getProfile(name) {
  const stmt = db.prepare('SELECT * FROM profiles WHERE name = ?');
  const row = stmt.get(name);
  
  if (!row) return null;
  
  return {
    name: row.name,
    browserType: row.browser_type,
    enableFingerprint: row.enable_fingerprint === 1,
    group: row.group_id ? String(row.group_id) : '',
    notes: row.notes || '',
    starred: row.starred === 1,
    proxy: row.proxy_server ? {
      server: row.proxy_server,
      username: row.proxy_username,
      password: row.proxy_password
    } : null,
    startUrl: row.start_url || '',
    customArgs: row.custom_args || '',
    fingerprint: row.fingerprint ? JSON.parse(row.fingerprint) : null,
    createdAt: row.created_at,
    lastUsed: row.last_used,
    useCount: row.use_count
  };
}

export function updateProfile(name, updates) {
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
  const stmt = db.prepare(`UPDATE profiles SET ${fields.join(', ')} WHERE name = ?`);
  stmt.run(...values);
}

export function renameProfile(oldName, newName) {
  const stmt = db.prepare('UPDATE profiles SET name = ? WHERE name = ?');
  stmt.run(newName, oldName);
}

export function deleteProfile(name) {
  const stmt = db.prepare('DELETE FROM profiles WHERE name = ?');
  stmt.run(name);
}

export function updateProfileUsage(name) {
  const stmt = db.prepare(`
    UPDATE profiles 
    SET last_used = ?, use_count = use_count + 1 
    WHERE name = ?
  `);
  stmt.run(new Date().toISOString(), name);
}

export function createGroup(groupData) {
  const stmt = db.prepare(`
    INSERT INTO groups (name, color, created_at)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(groupData.name, groupData.color, groupData.createdAt);
  return { id: String(result.lastInsertRowid), ...groupData };
}

export function listGroups() {
  const stmt = db.prepare('SELECT * FROM groups ORDER BY name ASC');
  const rows = stmt.all();
  
  return rows.map(row => ({
    id: String(row.id),
    name: row.name,
    color: row.color,
    createdAt: row.created_at
  }));
}

export function updateGroup(id, updates) {
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
  const stmt = db.prepare(`UPDATE groups SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
}

export function deleteGroup(id) {
  const stmt = db.prepare('UPDATE profiles SET group_id = NULL WHERE group_id = ?');
  stmt.run(parseInt(id));
  
  const deleteStmt = db.prepare('DELETE FROM groups WHERE id = ?');
  deleteStmt.run(parseInt(id));
}

export function batchDeleteProfiles(names) {
  const results = [];
  const stmt = db.prepare('DELETE FROM profiles WHERE name = ?');
  
  for (const name of names) {
    try {
      stmt.run(name);
      results.push({ name, success: true });
    } catch (error) {
      results.push({ name, success: false, error: error.message });
    }
  }
  
  return results;
}

export default db;
