#!/usr/bin/env node

import { Command } from "commander";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { createDefaultConfig } from "../core/config.js";
import { readTextIfExists } from "../core/fs-utils.js";
import { initializeWorkspace } from "../core/init.js";
import { resolveOutputRoot, resolveStatusPath } from "../core/paths.js";
import { parsePhaseState } from "../core/serialization.js";
import type { CodeExplorerConfig } from "../core/types.js";
import { runPhase0 } from "../stages/phase0-map.js";
import { runPhase1 } from "../stages/phase1-plan.js";
import { runPhase2 } from "../stages/phase2-execute.js";
import { runPhase3 } from "../stages/phase3-synthesis.js";
import { runPhase4 } from "../stages/phase4-publish.js";
import { verifyDocs } from "../reporting/verify.js";

export function createProgram(): Command {
  const program = new Command();

  program.name("code-explorer").description("面向 Claude Code 的代码仓库学习工作流 CLI");

  program
    .command("init")
    .description("初始化默认配置")
    .option("--cwd <path>", "写入配置的目录", process.cwd())
    .action(async (options: { cwd: string }) => {
      const created = await initializeWorkspace(path.resolve(options.cwd));
      process.stdout.write(`已生成 ${created.length} 个初始化文件\n`);
    });

  program
    .command("run")
    .description("执行五阶段分析流程")
    .argument("<repoPath>", "目标仓库路径")
    .option("--resume", "从已有状态继续")
    .option("--concurrency <number>", "并发度")
    .option("--runner <mode>", "执行器模式：teams|sdk|auto", "auto")
    .action(async (repoPath: string, options: { concurrency?: string; runner?: CodeExplorerConfig["runnerMode"] }) => {
      const absoluteRepoPath = path.resolve(repoPath);
      const configOverrides: Partial<CodeExplorerConfig> = {
        runnerMode: options.runner ?? "auto",
        concurrency: options.concurrency ? Number(options.concurrency) : undefined,
      };
      const indexMap = await runPhase0(absoluteRepoPath, configOverrides);
      const wavePlans = await runPhase1(absoluteRepoPath, indexMap, configOverrides);
      const results = await runPhase2(absoluteRepoPath, wavePlans, configOverrides);
      await runPhase3(absoluteRepoPath, indexMap, wavePlans, results, configOverrides);
      const verifyResult = await runPhase4(absoluteRepoPath, indexMap, wavePlans, configOverrides);
      process.stdout.write(
        `已完成阶段 0-4，产物目录: ${resolveOutputRoot(absoluteRepoPath)}，校验${verifyResult.valid ? "通过" : "失败"}\n`,
      );
    });

  program
    .command("status")
    .description("查看状态文件摘要")
    .argument("<repoPath>", "目标仓库路径")
    .action(async (repoPath: string) => {
      const absoluteRepoPath = path.resolve(repoPath);
      const targets = ["phase0", "phase1", "phase2", "phase3", "phase4"] as const;
      for (const key of targets) {
        const content = await readTextIfExists(resolveStatusPath(absoluteRepoPath, key));
        if (!content) {
          process.stdout.write(`${key}: 未生成\n`);
          continue;
        }

        const state = parsePhaseState(content);
        process.stdout.write(`${key}: ${state.status}\n`);
      }
    });

  program
    .command("verify")
    .description("校验文档产物")
    .argument("<repoPath>", "目标仓库路径")
    .action(async (repoPath: string) => {
      const absoluteRepoPath = path.resolve(repoPath);
      const result = await verifyDocs(path.join(resolveOutputRoot(absoluteRepoPath), "docs"));
      process.stdout.write(`校验${result.valid ? "通过" : "失败"}\n`);
    });

  program.addHelpText("after", `\n默认配置示例:\n${JSON.stringify(createDefaultConfig(), null, 2)}`);

  return program;
}

export async function runCli(argv = process.argv): Promise<void> {
  await createProgram().parseAsync(argv);
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined;

if (entryUrl === import.meta.url) {
  runCli().catch((error: unknown) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
