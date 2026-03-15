import path from "node:path";

import { ARTIFACT_FILES, PHASE_STATUS_FILES } from "../core/constants.js";
import { loadRepoConfig, readTextIfExists, writeWorkspaceFile } from "../core/fs-utils.js";
import { resolveArtifactPath, resolveOutputRoot } from "../core/paths.js";
import { serializePhaseState } from "../core/serialization.js";
import type { CodeExplorerConfig, IndexMap, PhaseState, TaskExecutionResult, TaskPlan, WaveName } from "../core/types.js";
import { buildArchitectureMarkdown, buildHighlightsMarkdown } from "../reporting/docs.js";

export async function runPhase3(
  repoPath: string,
  indexMap: IndexMap,
  wavePlans: Record<WaveName, TaskPlan[]>,
  results: TaskExecutionResult[],
  configOverrides?: Partial<CodeExplorerConfig>,
): Promise<void> {
  const config = await loadRepoConfig(repoPath, configOverrides);
  const outputRoot = resolveOutputRoot(repoPath, config.outputDir);
  const runningState: PhaseState = {
    phase: "phase_3_synthesis",
    status: "running",
    inputRefs: [resolveArtifactPath(repoPath, "analysisDir", config.outputDir)],
    outputRefs: [resolveArtifactPath(repoPath, "highlights", config.outputDir), resolveArtifactPath(repoPath, "architecture", config.outputDir)],
    startedAt: new Date().toISOString(),
    errors: [],
    runner: "none",
  };

  await writeWorkspaceFile(path.join(outputRoot, PHASE_STATUS_FILES.phase3), `${serializePhaseState(runningState)}\n`);

  try {
    const summaries = await readSummaries(resolveArtifactPath(repoPath, "analysisDir", config.outputDir));
    await writeWorkspaceFile(
      resolveArtifactPath(repoPath, "highlights", config.outputDir),
      `${buildHighlightsMarkdown(wavePlans, results, summaries)}\n`,
    );
    await writeWorkspaceFile(
      resolveArtifactPath(repoPath, "architecture", config.outputDir),
      `${buildArchitectureMarkdown(indexMap, wavePlans, summaries)}\n`,
    );

    await writeWorkspaceFile(
      path.join(outputRoot, PHASE_STATUS_FILES.phase3),
      `${serializePhaseState({
        ...runningState,
        status: "completed",
        finishedAt: new Date().toISOString(),
      })}\n`,
    );
  } catch (error) {
    await writeWorkspaceFile(
      path.join(outputRoot, PHASE_STATUS_FILES.phase3),
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

async function readSummaries(analysisDir: string): Promise<Array<{ fileName: string; content: string }>> {
  const fs = await import("node:fs/promises");
  const entries = await fs.readdir(analysisDir, { withFileTypes: true }).catch(() => []);
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith("_SUMMARY.md"));
  const summaries = await Promise.all(
    files.map(async (entry) => ({
      fileName: entry.name,
      content: (await readTextIfExists(path.join(analysisDir, entry.name))) ?? "",
    })),
  );

  return summaries.sort((left, right) => left.fileName.localeCompare(right.fileName));
}
