import fs from "fs-extra";
import { dbPath } from "./config";
import { ProfileRecord, ProfileStoreShape } from "./types";

const defaultStore: ProfileStoreShape = { profiles: [] };

function normalize(record: ProfileRecord): ProfileRecord {
  return {
    ...record,
    tags: record.tags ?? [],
    extensions: record.extensions ?? [],
    kind: record.kind ?? "other",
  };
}

async function readStore(): Promise<ProfileStoreShape> {
  const exists = await fs.pathExists(dbPath);
  if (!exists) {
    return defaultStore;
  }

  const content = await fs.readFile(dbPath, "utf-8");
  try {
    const parsed = JSON.parse(content) as ProfileStoreShape;
    return parsed;
  } catch (error) {
    throw new Error(`无法解析存储文件 ${dbPath}: ${(error as Error).message}`);
  }
}

async function writeStore(store: ProfileStoreShape): Promise<void> {
  await fs.writeJson(dbPath, store, { spaces: 2 });
}

export async function listProfiles(): Promise<ProfileRecord[]> {
  const store = await readStore();
  return store.profiles.map(normalize);
}

export async function upsertProfile(record: ProfileRecord): Promise<void> {
  const store = await readStore();
  const index = store.profiles.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    store.profiles[index] = record;
  } else {
    store.profiles.push(record);
  }
  await writeStore(store);
}

export async function deleteProfile(profileId: string): Promise<void> {
  const store = await readStore();
  const next = store.profiles.filter((item) => item.id !== profileId);
  if (next.length === store.profiles.length) {
    throw new Error(`未找到 profile: ${profileId}`);
  }
  await writeStore({ profiles: next });
}

export async function replaceProfiles(records: ProfileRecord[]): Promise<void> {
  await writeStore({ profiles: records });
}
