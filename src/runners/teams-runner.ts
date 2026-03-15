import { execFileText } from "../core/process.js";
import type { TaskContext } from "../core/types.js";
import type { AgentRunner, RunnerRequest } from "./types.js";

export class TeamsRunner implements AgentRunner {
  readonly mode = "teams" as const;

  async isAvailable(): Promise<boolean> {
    try {
      await execFileText("claude", ["--version"], process.cwd(), 5000);
      return true;
    } catch {
      return false;
    }
  }

  async run(request: RunnerRequest, context: TaskContext): Promise<string> {
    const prompt = `${request.userPrompt}\n\n# 任务上下文\n${buildContextBlock(context)}`;
    const { stdout } = await execFileText(
      "claude",
      ["-p", prompt, "--append-system-prompt", request.systemPrompt],
      context.repoPath,
      180000,
    );
    return stdout.trim();
  }
}

function buildContextBlock(context: TaskContext): string {
  const files = context.fileContents
    .map(({ path, content }) => `## FILE ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join("\n\n");
  const summaries = context.dependencySummaries
    .map(({ path, content }) => `## SUMMARY ${path}\n${content}`)
    .join("\n\n");

  return [files, summaries].filter(Boolean).join("\n\n");
}
