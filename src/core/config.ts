import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  DEFAULT_CONCURRENCY,
  DEFAULT_CONFIG_FILE,
  DEFAULT_EXCLUDES,
  DEFAULT_MAX_FILES_PER_TASK,
  DEFAULT_OUTPUT_DIRNAME,
  SUPPORTED_AST_LANGUAGES,
} from "./constants.js";
import type { CodeExplorerConfig } from "./types.js";

export function createDefaultConfig(): CodeExplorerConfig {
  return {
    include: ["**/*"],
    exclude: [...DEFAULT_EXCLUDES],
    runnerMode: "auto",
    concurrency: DEFAULT_CONCURRENCY,
    languageAdapters: [...SUPPORTED_AST_LANGUAGES],
    outputDir: DEFAULT_OUTPUT_DIRNAME,
    docLanguage: "zh-CN",
    maxFilesPerTask: DEFAULT_MAX_FILES_PER_TASK,
  };
}

export async function writeDefaultConfig(rootDir: string): Promise<string> {
  const configPath = path.join(rootDir, DEFAULT_CONFIG_FILE);
  const config = createDefaultConfig();

  await mkdir(rootDir, { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  return configPath;
}

