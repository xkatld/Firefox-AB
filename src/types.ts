export type ProfileStatus = "active" | "frozen";
export type ProfileKind = "register" | "long-term" | "temp" | "other";

export interface ProfileRecord {
  id: string;
  name: string;
  label?: string | undefined;
  tags: string[];
  kind: ProfileKind;
  extensions: string[];
  /** profile 目录在活动状态下的绝对路径 */
  path: string;
  /** 冻结后对应的压缩包路径 */
  archivePath?: string | undefined;
  status: ProfileStatus;
  platform: NodeJS.Platform;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileStoreShape {
  profiles: ProfileRecord[];
}

export interface CreateProfileOptions {
  name: string;
  label?: string | undefined;
  tags?: string[] | undefined;
  copyFromProfileId?: string | undefined;
  copyFromPath?: string | undefined;
}

export interface ImportProfileOptions {
  name: string;
  sourcePath: string;
  copy?: boolean | undefined;
  label?: string | undefined;
  tags?: string[] | undefined;
}

export interface CloneProfileOptions {
  sourceProfileId: string;
  name: string;
  label?: string | undefined;
  tags?: string[] | undefined;
}

export interface LaunchProfileOptions {
  extraArgs?: string[] | undefined;
}

export interface AppConfig {
  firefoxPath?: string | undefined;
  extensionsRoot?: string | undefined;
  defaultArgs: string[];
  env: Record<string, string>;
}
