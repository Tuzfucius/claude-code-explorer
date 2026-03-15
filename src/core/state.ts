import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { PhaseState } from "./types.js";
import { buildXml } from "./xml.js";

export async function writePhaseState(statePath: string, state: PhaseState): Promise<void> {
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, `${buildXml("phase_state", state as unknown as Record<string, unknown>)}\n`, "utf8");
}
