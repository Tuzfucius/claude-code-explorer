import { Command } from "commander";

import { createDefaultConfig, writeDefaultConfig } from "../core/config.js";

export function createProgram(): Command {
  const program = new Command();

  program.name("code-explorer").description("面向 Claude Code 的代码仓库学习工作流 CLI");

  program
    .command("init")
    .description("初始化默认配置")
    .option("--cwd <path>", "写入配置的目录", process.cwd())
    .action(async (options: { cwd: string }) => {
      const configPath = await writeDefaultConfig(options.cwd);
      process.stdout.write(`已生成配置: ${configPath}\n`);
    });

  program
    .command("run")
    .description("执行五阶段分析流程")
    .argument("<repoPath>", "目标仓库路径")
    .option("--resume", "从已有状态继续")
    .option("--concurrency <number>", "并发度")
    .option("--runner <mode>", "执行器模式：teams|sdk|auto", "auto")
    .action(async (repoPath: string) => {
      process.stdout.write(`工作流入口已就绪，待后续阶段实现: ${repoPath}\n`);
    });

  program
    .command("status")
    .description("查看状态文件摘要")
    .argument("<repoPath>", "目标仓库路径")
    .action(async (repoPath: string) => {
      process.stdout.write(`状态查询入口已就绪: ${repoPath}\n`);
    });

  program
    .command("verify")
    .description("校验文档产物")
    .argument("<repoPath>", "目标仓库路径")
    .action(async (repoPath: string) => {
      process.stdout.write(`校验入口已就绪: ${repoPath}\n`);
    });

  program.addHelpText("after", `\n默认配置示例:\n${JSON.stringify(createDefaultConfig(), null, 2)}`);

  return program;
}

export async function runCli(argv = process.argv): Promise<void> {
  await createProgram().parseAsync(argv);
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  runCli().catch((error: unknown) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
