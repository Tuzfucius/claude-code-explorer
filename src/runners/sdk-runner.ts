import Anthropic from "@anthropic-ai/sdk";

import type { TaskContext } from "../core/types.js";
import type { AgentRunner, RunnerRequest } from "./types.js";

export class SdkRunner implements AgentRunner {
  readonly mode = "sdk" as const;
  private readonly client?: Anthropic;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
    this.client = apiKey ? new Anthropic({ apiKey }) : undefined;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.client);
  }

  async run(request: RunnerRequest, context: TaskContext): Promise<string> {
    if (!this.client) {
      throw new Error("未设置 ANTHROPIC_API_KEY，无法使用 SDK Runner。");
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      system: request.systemPrompt,
      messages: [
        {
          role: "user",
          content: `${request.userPrompt}\n\n# 任务上下文\n${buildContextBlock(context)}`,
        },
      ],
    });

    return response.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n")
      .trim();
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

