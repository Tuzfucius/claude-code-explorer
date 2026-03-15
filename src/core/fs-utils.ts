import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

import fg from "fast-glob";
import ignore from "ignore";

import { DEFAULT_CONFIG_FILE, DEFAULT_EXCLUDES } from "./constants.js";
import { createDefaultConfig } from "./config.js";
import type { CodeExplorerConfig } from "./types.js";

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(targetPath: string): Promise<void> {
  await mkdir(targetPath, { recursive: true });
}

export async function readTextIfExists(targetPath: string): Promise<string | undefined> {
  if (!(await pathExists(targetPath))) {
    return undefined;
  }

  return readFile(targetPath, "utf8");
}

export async function loadRepoConfig(repoPath: string, overrides?: Partial<CodeExplorerConfig>): Promise<CodeExplorerConfig> {
  const configPath = path.join(repoPath, DEFAULT_CONFIG_FILE);
  const baseConfig = createDefaultConfig();
  const explicitOverrides = compactConfigOverrides(overrides);

  if (!(await pathExists(configPath))) {
    return {
      ...baseConfig,
      ...explicitOverrides,
      include: explicitOverrides.include ?? baseConfig.include,
      exclude: explicitOverrides.exclude ?? baseConfig.exclude,
      languageAdapters: explicitOverrides.languageAdapters ?? baseConfig.languageAdapters,
    };
  }

  const raw = await readFile(configPath, "utf8");
  const parsed = JSON.parse(raw) as Partial<CodeExplorerConfig>;

  return {
    ...baseConfig,
    ...parsed,
    ...explicitOverrides,
    include: parsed.include ?? baseConfig.include,
    exclude: parsed.exclude ?? baseConfig.exclude,
    languageAdapters: parsed.languageAdapters ?? baseConfig.languageAdapters,
  };
}

export async function listRepoFiles(repoPath: string, config: CodeExplorerConfig): Promise<string[]> {
  const ig = ignore();
  ig.add(DEFAULT_EXCLUDES);
  ig.add(config.exclude);
  ig.add(`${config.outputDir}/**`);

  const gitignorePath = path.join(repoPath, ".gitignore");
  const gitignoreContent = await readTextIfExists(gitignorePath);
  if (gitignoreContent) {
    ig.add(gitignoreContent);
  }

  const files = await fg(config.include, {
    cwd: repoPath,
    onlyFiles: true,
    dot: true,
    absolute: false,
    unique: true,
    followSymbolicLinks: false,
  });

  return files
    .map((filePath) => filePath.replace(/\\/g, "/"))
    .filter((filePath) => !ig.ignores(filePath));
}

export async function readWorkspaceFile(repoPath: string, relativePath: string): Promise<string> {
  return readFile(path.join(repoPath, relativePath), "utf8");
}

export async function writeWorkspaceFile(targetPath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(targetPath));
  await writeFile(targetPath, content, "utf8");
}

export async function listImmediateChildren(targetPath: string): Promise<string[]> {
  const items = await readdir(targetPath);
  return items.sort((left, right) => left.localeCompare(right));
}

function compactConfigOverrides(overrides?: Partial<CodeExplorerConfig>): Partial<CodeExplorerConfig> {
  if (!overrides) {
    return {};
  }

  return Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== undefined)) as Partial<CodeExplorerConfig>;
}
