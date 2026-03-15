import type { RunnerMode } from "../core/types.js";
import type { AgentRunner } from "./types.js";
import { SdkRunner } from "./sdk-runner.js";
import { TeamsRunner } from "./teams-runner.js";

export async function resolveRunner(mode: RunnerMode): Promise<AgentRunner | undefined> {
  if (process.env.CODE_EXPLORER_DISABLE_EXTERNAL_RUNNERS === "1") {
    return undefined;
  }

  const candidates: AgentRunner[] =
    mode === "teams" ? [new TeamsRunner()] : mode === "sdk" ? [new SdkRunner()] : [new TeamsRunner(), new SdkRunner()];

  for (const candidate of candidates) {
    if (await candidate.isAvailable()) {
      return candidate;
    }
  }

  return undefined;
}
