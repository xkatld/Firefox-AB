import path from "node:path";
import fs from "fs-extra";
import { AppConfig } from "./types";

const rootDir = process.cwd();

export const paths = {
  baseProfilesDir:
    process.env.FAB_PROFILE_BASE ?? path.join(rootDir, "profiles"),
  frozenProfilesDir:
    process.env.FAB_FROZEN_BASE ?? path.join(rootDir, "profiles", "_frozen"),
  dataDir: process.env.FAB_DATA_DIR ?? path.join(rootDir, "data"),
};

export const dbPath = process.env.FAB_DB_PATH ?? path.join(paths.dataDir, "profiles.json");
export const configPath =
  process.env.FAB_CONFIG_PATH ?? path.join(paths.dataDir, "app.config.json");

const defaultConfig: AppConfig = {
  firefoxPath: process.env.FAB_FIREFOX_PATH,
  extensionsRoot: process.env.FAB_EXTENSIONS_ROOT,
  defaultArgs: ["-no-remote"],
  env: {},
};

export async function ensureProjectScaffolding() {
  await Promise.all([
    fs.ensureDir(paths.baseProfilesDir),
    fs.ensureDir(paths.frozenProfilesDir),
    fs.ensureDir(paths.dataDir),
  ]);
}

export async function readConfig(): Promise<AppConfig> {
  await ensureProjectScaffolding();
  const exists = await fs.pathExists(configPath);
  if (!exists) {
    await fs.writeJson(configPath, defaultConfig, { spaces: 2 });
    return { ...defaultConfig };
  }

  const content = await fs.readJson(configPath);
  return {
    ...defaultConfig,
    ...(content as AppConfig),
  };
}

export async function updateConfig(patch: Partial<AppConfig>): Promise<AppConfig> {
  const current = await readConfig();
  const next = {
    ...current,
    ...patch,
  } satisfies AppConfig;
  await fs.writeJson(configPath, next, { spaces: 2 });
  return next;
}

export async function resolveFirefoxPath(): Promise<string> {
  const config = await readConfig();
  if (config.firefoxPath) {
    return config.firefoxPath;
  }

  const fallbackCandidates = [
    process.env.FAB_FIREFOX_PATH,
    process.platform === "win32"
      ? "C:/Program Files/Mozilla Firefox/firefox.exe"
      : undefined,
    "firefox",
  ].filter(Boolean) as string[];

  return fallbackCandidates[0]!;
}
