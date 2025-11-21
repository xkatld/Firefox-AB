#!/usr/bin/env node
import path from "node:path";
import { Command } from "commander";
import {
  cloneProfile,
  createProfile,
  freezeProfile,
  getProfile,
  importProfile,
  launchProfile,
  listProfileSummaries,
  removeProfile,
  renameProfile,
  setProfileExtensions,
  setProfileKind,
  tagProfile,
  thawProfile,
  syncProfileExtensions,
} from "./profileManager";
import { ensureProjectScaffolding, readConfig, updateConfig } from "./config";
import { AppConfig, CreateProfileOptions, ProfileKind } from "./types";

const program = new Command();
program
  .name("firefox-ab")
  .description("Firefox 多 profile 管理 CLI")
  .version("0.2.0");

const splitComma = (value?: string) =>
  value
    ? value
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const splitArgs = (value?: string) =>
  value
    ? value
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const parseKeyValuePairs = (input?: string) => {
  const result: Record<string, string> = {};
  if (!input) return result;
  for (const chunk of input.split(/[,，\s]+/)) {
    if (!chunk) continue;
    const [key, ...rest] = chunk.split("=");
    if (!key) continue;
    result[key.trim()] = rest.join("=").trim();
  }
  return result;
};

program
  .command("init")
  .description("初始化必要目录")
  .action(async () => {
    await ensureProjectScaffolding();
    console.log("初始化完成");
  });

program
  .command("list")
  .description("列出所有 profile")
  .option("--json", "以 JSON 输出")
  .action(async (options: { json?: boolean }) => {
    const profiles = await listProfileSummaries();
    if (!profiles.length) {
      console.log("暂无 profile，使用 create 命令创建一个。");
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(profiles, null, 2));
      return;
    }

    console.table(
      profiles.map((item) => ({
        id: item.id,
        name: item.name,
        label: item.label ?? "",
        status: item.status,
        kind: item.kind,
        tags: item.tags.join(","),
        extensions: item.extensions.join(","),
        platform: item.platform,
        path: item.path,
        archive: item.archivePath ?? "",
      }))
    );
  });

program
  .command("create <name>")
  .description("创建新的 profile，并生成独立目录")
  .option("-l, --label <label>", "可选标签")
  .option("-t, --tags <tags>", "逗号分隔标签")
  .option("--copy-from <profileId>", "基于已有 profile 复制")
  .option("--from-path <path>", "使用指定目录作为模板")
  .action(async (
    name: string,
    options: {
      label?: string;
      tags?: string;
      copyFrom?: string;
      fromPath?: string;
    }
  ) => {
    const payload: CreateProfileOptions = {
      name,
      tags: splitComma(options.tags),
    };
    if (options.label) payload.label = options.label;
    if (options.copyFrom) payload.copyFromProfileId = options.copyFrom;
    if (options.fromPath) payload.copyFromPath = options.fromPath;
    const record = await createProfile(payload);
    console.log("创建成功:", record);
  });

program
  .command("import <sourcePath> <name>")
  .description("导入现有 profile，默认直接引用原目录")
  .option("-c, --copy", "复制一份到受控目录")
  .option("-l, --label <label>")
  .option("-t, --tags <tags>")
  .action(async (sourcePath: string, name: string, options: { copy?: boolean; label?: string; tags?: string }) => {
    const record = await importProfile({
      name,
      sourcePath,
      copy: Boolean(options.copy),
      label: options.label,
      tags: splitComma(options.tags),
    });
    console.log("导入成功:", record);
  });

program
  .command("clone <sourceId> <name>")
  .description("克隆现有 profile（需处于活动状态）")
  .option("-l, --label <label>")
  .option("-t, --tags <tags>")
  .action(async (sourceId: string, name: string, options: { label?: string; tags?: string }) => {
    const record = await cloneProfile({
      sourceProfileId: sourceId,
      name,
      label: options.label,
      tags: splitComma(options.tags),
    });
    console.log("克隆成功:", record);
  });

program
  .command("freeze <id>")
  .description("冻结 profile：打包到冻结目录")
  .action(async (id: string) => {
    const updated = await freezeProfile(id);
    console.log(`已冻结 ${updated.name} -> ${updated.archivePath}`);
  });

program
  .command("thaw <id>")
  .description("解冻 profile：解压回活动目录")
  .action(async (id: string) => {
    const updated = await thawProfile(id);
    console.log(`已解冻 ${updated.name}`);
  });

program
  .command("remove <id>")
  .description("删除 profile 及其目录")
  .action(async (id: string) => {
    await removeProfile(id);
    console.log(`已删除 ${id}`);
  });

program
  .command("tag <id> <tags>")
  .description("覆盖设置 profile 标签，逗号分隔")
  .action(async (id: string, tags: string) => {
    const updated = await tagProfile(id, splitComma(tags));
    console.log("标签已更新:", updated.tags);
  });

program
  .command("rename <id> <name>")
  .description("重命名 profile")
  .action(async (id: string, name: string) => {
    const updated = await renameProfile(id, name);
    console.log(`已重命名为 ${updated.name}`);
  });

program
  .command("mark <id>")
  .description("设置 profile 类型: register|long-term|temp|other")
  .option("--kind <kind>", "profile 类型")
  .action(async (id: string, options: { kind?: ProfileKind }) => {
    const kind = options.kind ?? "other";
    const allowed: ProfileKind[] = ["register", "long-term", "temp", "other"];
    if (!allowed.includes(kind)) {
      throw new Error(`kind 必须为 ${allowed.join("/")}`);
    }
    const updated = await setProfileKind(id, kind);
    console.log(`Profile ${id} 类型已设为 ${updated.kind}`);
  });

const extensionCommand = program.command("extensions").description("管理 profile 扩展");

extensionCommand
  .command("show <id>")
  .description("查看扩展配置")
  .action(async (id: string) => {
    const profile = await getProfile(id);
    console.log(profile.extensions.join(", "));
  });

extensionCommand
  .command("set <id> <items>")
  .description("设置扩展列表，逗号或空格分隔")
  .action(async (id: string, items: string) => {
    const extensions = splitArgs(items);
    const updated = await setProfileExtensions(id, extensions);
    console.log(`扩展已更新: ${updated.extensions.join(",")}`);
  });

extensionCommand
  .command("clear <id>")
  .description("清空扩展配置")
  .action(async (id: string) => {
    const updated = await setProfileExtensions(id, []);
    console.log(`扩展已清空: ${updated.id}`);
  });

extensionCommand
  .command("sync <id>")
  .description("将配置的扩展复制到 profile 目录")
  .action(async (id: string) => {
    await syncProfileExtensions(id);
    console.log(`扩展已同步到 ${id}`);
  });

program
  .command("info <id>")
  .description("查看 profile 详情")
  .action(async (id: string) => {
    const profile = await getProfile(id);
    console.log(JSON.stringify(profile, null, 2));
  });

program
  .command("launch <id>")
  .description("使用当前 profile 启动 Firefox")
  .option("--args <args>", "额外传给 Firefox 的参数，逗号或空格分隔")
  .action(async (id: string, options: { args?: string }) => {
    const exitCode = await launchProfile(id, {
      extraArgs: splitArgs(options.args),
    });
    console.log(`Firefox 已退出，代码 ${exitCode}`);
  });

const configCommand = program.command("config").description("查看或更新启动配置");

configCommand
  .command("show")
  .description("查看当前配置")
  .action(async () => {
    const config = await readConfig();
    console.log(JSON.stringify(config, null, 2));
  });

configCommand
  .command("set")
  .description("更新配置项")
  .option("--firefox <path>", "Firefox 可执行文件路径")
  .option("--extensions-root <path>", "共享扩展仓库路径")
  .option("--default-args <args>", "默认参数，逗号或空格分隔")
  .option("--env <pairs>", "设置额外环境变量: KEY=VALUE，多个用逗号/空格分隔")
  .option("--clear-env", "清空 env 配置")
  .action(
    async (options: {
      firefox?: string;
      extensionsRoot?: string;
      defaultArgs?: string;
      env?: string;
      clearEnv?: boolean;
    }) => {
      const patch: Partial<AppConfig> = {};
      if (options.firefox) {
        patch.firefoxPath = path.resolve(options.firefox);
      }
      if (options.extensionsRoot) {
        patch.extensionsRoot = path.resolve(options.extensionsRoot);
      }
      if (options.defaultArgs !== undefined) {
        patch.defaultArgs = splitArgs(options.defaultArgs);
      }

      if (options.clearEnv) {
        patch.env = {};
      } else if (options.env) {
        const current = await readConfig();
        patch.env = { ...current.env, ...parseKeyValuePairs(options.env) };
      }

      if (!Object.keys(patch).length) {
        console.log("未提供任何可更新的字段");
        return;
      }

      const updated = await updateConfig(patch);
      console.log("配置已更新:");
      console.log(JSON.stringify(updated, null, 2));
    }
  );

program.parseAsync(process.argv).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
