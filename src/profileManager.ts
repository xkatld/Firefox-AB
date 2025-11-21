import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "fs-extra";
import tar from "tar";
import {
  ensureProjectScaffolding,
  paths,
  readConfig,
  resolveFirefoxPath,
} from "./config";
import {
  deleteProfile,
  listProfiles,
  replaceProfiles,
  upsertProfile,
} from "./store";
import {
  CloneProfileOptions,
  CreateProfileOptions,
  ImportProfileOptions,
  LaunchProfileOptions,
  ProfileKind,
  ProfileRecord,
} from "./types";

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .trim() || "profile"
  );
}

function now() {
  return new Date().toISOString();
}

async function getProfileOrThrow(profileId: string): Promise<ProfileRecord> {
  const profiles = await listProfiles();
  const profile = profiles.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(`未找到 profile: ${profileId}`);
  }
  return profile;
}

async function ensureSourcePathFromProfile(profileId: string): Promise<string> {
  const profile = await getProfileOrThrow(profileId);
  if (profile.status !== "active") {
    throw new Error(`Profile ${profileId} 处于冻结状态，请先解冻后再复制`);
  }
  const exists = await fs.pathExists(profile.path);
  if (!exists) {
    throw new Error(`Profile 路径不存在: ${profile.path}`);
  }
  return profile.path;
}

async function copyProfileSkeleton(sourceDir: string, targetDir: string) {
  await fs.ensureDir(targetDir);
  await fs.emptyDir(targetDir);
  await fs.copy(sourceDir, targetDir, {
    overwrite: true,
    errorOnExist: false,
    dereference: true,
  });
}

async function generateProfilePath(name: string, seed?: string): Promise<string> {
  await ensureProjectScaffolding();
  const safeName = slugify(name);
  const source = seed ?? randomUUID();
  const dirName = `${safeName}-${source.slice(0, 6)}`;
  return path.join(paths.baseProfilesDir, dirName);
}

export async function createProfile(options: CreateProfileOptions): Promise<ProfileRecord> {
  await ensureProjectScaffolding();
  const recordId = randomUUID();
  const profilePath = await generateProfilePath(options.name, recordId);

  const sourcePath = options.copyFromProfileId
    ? await ensureSourcePathFromProfile(options.copyFromProfileId)
    : options.copyFromPath
    ? path.resolve(options.copyFromPath)
    : undefined;

  if (sourcePath) {
    const exists = await fs.pathExists(sourcePath);
    if (!exists) {
      throw new Error(`指定的模板路径不存在: ${sourcePath}`);
    }
    await copyProfileSkeleton(sourcePath, profilePath);
  } else {
    await fs.ensureDir(profilePath);
  }

  const timestamp = now();
  const record: ProfileRecord = {
    id: recordId,
    name: options.name,
    label: options.label,
    tags: options.tags ?? [],
    kind: "other",
    extensions: [],
    path: profilePath,
    status: "active",
    platform: process.platform,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await upsertProfile(record);
  return record;
}

export async function importProfile(options: ImportProfileOptions): Promise<ProfileRecord> {
  await ensureProjectScaffolding();
  const sourcePath = path.resolve(options.sourcePath);
  const exists = await fs.pathExists(sourcePath);
  if (!exists) {
    throw new Error(`无法导入，不存在的路径: ${sourcePath}`);
  }

  let targetPath = sourcePath;
  if (options.copy) {
    targetPath = await generateProfilePath(options.name);
    await copyProfileSkeleton(sourcePath, targetPath);
  }

  const timestamp = now();
  const record: ProfileRecord = {
    id: randomUUID(),
    name: options.name,
    label: options.label,
    tags: options.tags ?? [],
    kind: "other",
    extensions: [],
    path: targetPath,
    status: "active",
    platform: process.platform,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await upsertProfile(record);
  return record;
}

export async function cloneProfile(options: CloneProfileOptions): Promise<ProfileRecord> {
  return createProfile({
    name: options.name,
    label: options.label,
    tags: options.tags,
    copyFromProfileId: options.sourceProfileId,
  });
}

export async function listProfileSummaries(): Promise<ProfileRecord[]> {
  const profiles = await listProfiles();
  return profiles.sort((a, b) => a.name.localeCompare(b.name));
}

export async function removeProfile(profileId: string): Promise<void> {
  const profile = await getProfileOrThrow(profileId);
  if (profile.status === "active") {
    await fs.remove(profile.path);
  } else {
    const archive = profile.archivePath ?? profile.path;
    if (archive) {
      await fs.remove(archive);
    }
  }
  await deleteProfile(profileId);
}

function buildArchivePath(profile: ProfileRecord) {
  const dirName = path.basename(profile.path);
  return path.join(paths.frozenProfilesDir, `${dirName}-${profile.id}.tar.gz`);
}

export async function freezeProfile(profileId: string): Promise<ProfileRecord> {
  await ensureProjectScaffolding();
  const profile = await getProfileOrThrow(profileId);
  if (profile.status === "frozen") {
    return profile;
  }

  const exists = await fs.pathExists(profile.path);
  if (!exists) {
    throw new Error(`Profile 目录不存在: ${profile.path}`);
  }

  const archivePath = buildArchivePath(profile);
  await fs.ensureDir(paths.frozenProfilesDir);
  await tar.c(
    {
      gzip: true,
      file: archivePath,
      cwd: path.dirname(profile.path),
      portable: true,
    },
    [path.basename(profile.path)]
  );
  await fs.remove(profile.path);

  const updated: ProfileRecord = {
    ...profile,
    status: "frozen",
    archivePath,
    updatedAt: now(),
  };
  await upsertProfile(updated);
  return updated;
}

export async function thawProfile(profileId: string): Promise<ProfileRecord> {
  await ensureProjectScaffolding();
  const profile = await getProfileOrThrow(profileId);
  if (profile.status === "active") {
    return profile;
  }

  const archivePath = profile.archivePath ?? buildArchivePath(profile);
  const exists = await fs.pathExists(archivePath);
  if (!exists) {
    throw new Error(`找不到冻结包: ${archivePath}`);
  }

  const parentDir = path.dirname(profile.path);
  await fs.ensureDir(parentDir);
  await tar.x({ file: archivePath, cwd: parentDir });
  await fs.remove(archivePath);

  const updated: ProfileRecord = {
    ...profile,
    status: "active",
    archivePath: undefined,
    updatedAt: now(),
  };
  await upsertProfile(updated);
  return updated;
}

export async function tagProfile(profileId: string, tags: string[]): Promise<ProfileRecord> {
  const profile = await getProfileOrThrow(profileId);
  const updated: ProfileRecord = {
    ...profile,
    tags,
    updatedAt: now(),
  };
  await upsertProfile(updated);
  return updated;
}

export async function setProfileKind(
  profileId: string,
  kind: ProfileKind
): Promise<ProfileRecord> {
  const profile = await getProfileOrThrow(profileId);
  const updated: ProfileRecord = {
    ...profile,
    kind,
    updatedAt: now(),
  };
  await upsertProfile(updated);
  return updated;
}

export async function setProfileExtensions(
  profileId: string,
  extensions: string[]
): Promise<ProfileRecord> {
  const profile = await getProfileOrThrow(profileId);
  const normalized = Array.from(new Set(extensions.map((item) => item.trim()).filter(Boolean)));
  const updated: ProfileRecord = {
    ...profile,
    extensions: normalized,
    updatedAt: now(),
  };
  await upsertProfile(updated);
  return updated;
}

export async function renameProfile(profileId: string, name: string): Promise<ProfileRecord> {
  const profile = await getProfileOrThrow(profileId);
  const updated: ProfileRecord = {
    ...profile,
    name,
    updatedAt: now(),
  };
  await upsertProfile(updated);
  return updated;
}

async function copyExtensionItem(source: string, target: string) {
  const stats = await fs.stat(source);
  if (stats.isDirectory()) {
    await fs.copy(source, target, { overwrite: true, dereference: true });
  } else {
    await fs.ensureDir(path.dirname(target));
    await fs.copyFile(source, target);
  }
}

export async function syncProfileExtensions(profileId: string): Promise<void> {
  const profile = await getProfileOrThrow(profileId);
  if (!profile.extensions.length) {
    console.log(`Profile ${profileId} 未配置扩展，跳过同步`);
    return;
  }

  const config = await readConfig();
  const root = config.extensionsRoot;
  if (!root) {
    throw new Error("未设置 extensionsRoot，请运行 config set --extensions-root <path>");
  }

  const exists = await fs.pathExists(root);
  if (!exists) {
    throw new Error(`扩展仓库不存在: ${root}`);
  }

  const targetDir = path.join(profile.path, "extensions");
  await fs.ensureDir(targetDir);
  await fs.emptyDir(targetDir);

  for (const extName of profile.extensions) {
    const source = path.join(root, extName);
    const sourceExists = await fs.pathExists(source);
    if (!sourceExists) {
      throw new Error(`扩展 ${extName} 不存在于仓库 ${root}`);
    }
    const target = path.join(targetDir, path.basename(source));
    await copyExtensionItem(source, target);
  }
}

export async function launchProfile(
  profileId: string,
  options: LaunchProfileOptions = {}
): Promise<number> {
  const profile = await getProfileOrThrow(profileId);
  if (profile.status !== "active") {
    throw new Error(`Profile ${profileId} 已冻结，需先解冻后才能启动`);
  }

  const dirExists = await fs.pathExists(profile.path);
  if (!dirExists) {
    throw new Error(`Profile 目录缺失: ${profile.path}`);
  }

  const config = await readConfig();
  const firefoxPath = config.firefoxPath ?? (await resolveFirefoxPath());
  const args = ["-profile", profile.path, ...config.defaultArgs, ...(options.extraArgs ?? [])];
  const env = { ...process.env, ...config.env };

  return new Promise((resolve, reject) => {
    const child = spawn(firefoxPath, args, {
      stdio: "inherit",
      env,
    });
    child.on("error", (error) => reject(error));
    child.on("exit", (code) => resolve(code ?? 0));
  });
}

export async function resetStore(): Promise<void> {
  await replaceProfiles([]);
}

export async function getProfile(profileId: string): Promise<ProfileRecord> {
  return getProfileOrThrow(profileId);
}
