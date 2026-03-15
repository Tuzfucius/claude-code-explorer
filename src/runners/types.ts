import type { TaskContext } from "../core/types.js";

export interface RunnerRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface AgentRunner {
  readonly mode: "teams" | "sdk";
  isAvailable(): Promise<boolean>;
  run(request: RunnerRequest, context: TaskContext): Promise<string>;
}

