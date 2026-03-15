import path from "node:path";

import { DEFAULT_CONFIG_FILE } from "./constants.js";
import { createDefaultConfig } from "./config.js";
import { pathExists, writeWorkspaceFile } from "./fs-utils.js";

export async function initializeWorkspace(rootDir: string): Promise<string[]> {
  const created: string[] = [];
  const configPath = path.join(rootDir, DEFAULT_CONFIG_FILE);

  if (!(await pathExists(configPath))) {
    await writeWorkspaceFile(configPath, `${JSON.stringify(createDefaultConfig(), null, 2)}\n`);
    created.push(configPath);
  }

  for (const [relativePath, content] of Object.entries(buildClaudeFiles())) {
    const absolutePath = path.join(rootDir, relativePath);
    await writeWorkspaceFile(absolutePath, `${content}\n`);
    created.push(absolutePath);
  }

  return created;
}

function buildClaudeFiles(): Record<string, string> {
  return {
    ".claude/commands/code-explorer.md": [
      "---",
      "allowed-tools: Bash(code-explorer:*), Bash(npx tsx:*), Read(*), Glob(*)",
      "argument-hint: [repoPath=. ] [--runner teams|sdk|auto] [--concurrency N]",
      "description: 运行 code-explorer 五阶段代码仓库分析",
      "---",
      "",
      "在当前项目中执行 code-explorer 工作流。",
      "",
      "## 执行",
      "",
      "- 运行分析命令：!`code-explorer run $ARGUMENTS`",
      "- 如果用户没有传参，提示其改用 `/code-explorer . --runner teams` 或 `/code-explorer . --runner auto`。",
      "",
      "## 汇报要求",
      "",
      "- 读取并汇报 @.code-explorer/docs/README.md",
      "- 读取并汇报 @.code-explorer/docs/INDEX.md",
      "- 读取并汇报 @.code-explorer/docs/VERIFY_REPORT.md",
      "- 明确说明是否真的生成了学习文档、是否通过校验、关键文档入口在哪里。",
    ].join("\n"),
    ".claude/agents/orchestrator.md": buildAgentDoc("Orchestrator", "负责阶段 1 的全局调研、仓库类型判断和任务拆分。"),
    ".claude/agents/data-agent.md": buildAgentDoc("Data Agent", "负责基础结构、模型、配置和共享抽象的阅读与总结。"),
    ".claude/agents/flow-agent.md": buildAgentDoc("Flow Agent", "负责业务调用链、流程控制和模块协作关系的总结。"),
    ".claude/agents/architect.md": buildAgentDoc("Architect", "只读取微观摘要，提炼全局运行原理与系统亮点。"),
    ".claude/agents/writer.md": buildAgentDoc("Writer", "负责将索引、摘要与亮点整合为可导航文档库。"),
  };
}

function buildAgentDoc(name: string, responsibility: string): string {
  return [
    `# ${name}`,
    "",
    responsibility,
    "",
    "输出要求：",
    "- 使用简体中文。",
    "- 明确写出职责、边界、关键结构和学习建议。",
    "- 信息不足时直接标注，不要编造实现。",
  ].join("\n");
}
