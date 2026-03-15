import path from "node:path";

import { ARTIFACT_FILES, PHASE_STATUS_FILES } from "../core/constants.js";
import { buildTaskPlans } from "../core/plans.js";
import { resolveOutputRoot } from "../core/paths.js";
import { serializePhaseState, serializeWavePlans } from "../core/serialization.js";
import type { IndexMap, PhaseState } from "../core/types.js";
import { loadRepoConfig, writeWorkspaceFile } from "../core/fs-utils.js";

export async function runPhase1(repoPath: string, indexMap: IndexMap): Promise<void> {
  const config = await loadRepoConfig(repoPath);
  const outputRoot = resolveOutputRoot(repoPath, config.outputDir);

  const runningState: PhaseState = {
    phase: "phase_1_plan",
    status: "running",
    inputRefs: [path.join(outputRoot, ARTIFACT_FILES.indexMap)],
    outputRefs: [
      path.join(outputRoot, ARTIFACT_FILES.wave1),
      path.join(outputRoot, ARTIFACT_FILES.wave2),
      path.join(outputRoot, ARTIFACT_FILES.wave3),
    ],
    startedAt: new Date().toISOString(),
    errors: [],
    runner: "none",
  };

  await writeWorkspaceFile(path.join(outputRoot, PHASE_STATUS_FILES.phase1), `${serializePhaseState(runningState)}\n`);

  try {
    const taskPlans = buildTaskPlans(indexMap.entries, config.maxFilesPerTask);

    await writeWorkspaceFile(path.join(outputRoot, ARTIFACT_FILES.wave1), `${serializeWavePlans("WAVE_1", taskPlans.WAVE_1)}\n`);
    await writeWorkspaceFile(path.join(outputRoot, ARTIFACT_FILES.wave2), `${serializeWavePlans("WAVE_2", taskPlans.WAVE_2)}\n`);
    await writeWorkspaceFile(path.join(outputRoot, ARTIFACT_FILES.wave3), `${serializeWavePlans("WAVE_3", taskPlans.WAVE_3)}\n`);

    await writeWorkspaceFile(
      path.join(outputRoot, PHASE_STATUS_FILES.phase1),
      `${serializePhaseState({
        ...runningState,
        status: "completed",
        finishedAt: new Date().toISOString(),
      })}\n`,
    );
  } catch (error) {
    await writeWorkspaceFile(
      path.join(outputRoot, PHASE_STATUS_FILES.phase1),
      `${serializePhaseState({
        ...runningState,
        status: "failed",
        finishedAt: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : String(error)],
      })}\n`,
    );
    throw error;
  }
}
