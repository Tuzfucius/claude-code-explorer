import path from "node:path";

import { ARTIFACT_FILES, PHASE_STATUS_FILES } from "../core/constants.js";
import { loadRepoConfig, readTextIfExists, writeWorkspaceFile } from "../core/fs-utils.js";
import { resolveArtifactPath, resolveOutputRoot } from "../core/paths.js";
import { serializePhaseState } from "../core/serialization.js";
import type { IndexMap, PhaseState, TaskPlan, WaveName } from "../core/types.js";
import {
  buildDocsIndex,
  buildDocsReadme,
  buildGlossary,
  buildLearningPath,
  buildVerifyReport,
} from "../reporting/docs.js";
import { verifyDocs, type VerifyResult } from "../reporting/verify.js";

export async function runPhase4(
  repoPath: string,
  indexMap: IndexMap,
  wavePlans: Record<WaveName, TaskPlan[]>,
): Promise<VerifyResult> {
  const config = await loadRepoConfig(repoPath);
  const outputRoot = resolveOutputRoot(repoPath, config.outputDir);
  const docsRoot = resolveArtifactPath(repoPath, "docsDir", config.outputDir);
  const runningState: PhaseState = {
    phase: "phase_4_publish",
    status: "running",
    inputRefs: [
      resolveArtifactPath(repoPath, "indexMap", config.outputDir),
      resolveArtifactPath(repoPath, "highlights", config.outputDir),
      resolveArtifactPath(repoPath, "architecture", config.outputDir),
      resolveArtifactPath(repoPath, "analysisDir", config.outputDir),
    ],
    outputRefs: [
      resolveArtifactPath(repoPath, "docsReadme", config.outputDir),
      resolveArtifactPath(repoPath, "docsIndex", config.outputDir),
      resolveArtifactPath(repoPath, "learningPath", config.outputDir),
      resolveArtifactPath(repoPath, "glossary", config.outputDir),
      resolveArtifactPath(repoPath, "verifyReport", config.outputDir),
    ],
    startedAt: new Date().toISOString(),
    errors: [],
    runner: "none",
  };

  await writeWorkspaceFile(path.join(outputRoot, PHASE_STATUS_FILES.phase4), `${serializePhaseState(runningState)}\n`);

  try {
    const moduleFiles = await publishModuleSummaries(repoPath, docsRoot);
    await writeWorkspaceFile(resolveArtifactPath(repoPath, "docsReadme", config.outputDir), `${buildDocsReadme()}\n`);
    await writeWorkspaceFile(
      resolveArtifactPath(repoPath, "docsIndex", config.outputDir),
      `${buildDocsIndex(wavePlans, indexMap, moduleFiles)}\n`,
    );
    await writeWorkspaceFile(resolveArtifactPath(repoPath, "learningPath", config.outputDir), `${buildLearningPath(wavePlans)}\n`);
    await writeWorkspaceFile(resolveArtifactPath(repoPath, "glossary", config.outputDir), `${buildGlossary(indexMap)}\n`);
    await writeWorkspaceFile(
      resolveArtifactPath(repoPath, "verifyReport", config.outputDir),
      `${buildVerifyReport({ valid: true, linkErrors: [], mermaidErrors: [], placeholderErrors: [] })}\n`,
    );

    const verifyResult = await verifyDocs(docsRoot);
    await writeWorkspaceFile(resolveArtifactPath(repoPath, "verifyReport", config.outputDir), `${buildVerifyReport(verifyResult)}\n`);

    await writeWorkspaceFile(
      path.join(outputRoot, PHASE_STATUS_FILES.phase4),
      `${serializePhaseState({
        ...runningState,
        status: verifyResult.valid ? "completed" : "failed",
        finishedAt: new Date().toISOString(),
        errors: [
          ...verifyResult.linkErrors,
          ...verifyResult.mermaidErrors,
          ...verifyResult.placeholderErrors,
        ],
      })}\n`,
    );

    return verifyResult;
  } catch (error) {
    await writeWorkspaceFile(
      path.join(outputRoot, PHASE_STATUS_FILES.phase4),
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

async function publishModuleSummaries(
  repoPath: string,
  docsRoot: string,
): Promise<Array<{ fileName: string; title: string }>> {
  const analysisDir = resolveArtifactPath(repoPath, "analysisDir");
  const fs = await import("node:fs/promises");
  const entries = await fs.readdir(analysisDir, { withFileTypes: true }).catch(() => []);
  const summaries = entries.filter((entry) => entry.isFile() && entry.name.endsWith("_SUMMARY.md"));
  const published: Array<{ fileName: string; title: string }> = [];

  for (const summary of summaries) {
    const sourcePath = path.join(analysisDir, summary.name);
    const content = (await readTextIfExists(sourcePath)) ?? "";
    const fileName = summary.name.replace("_SUMMARY", "");
    const title = content
      .split(/\r?\n/)
      .find((line) => line.startsWith("- 任务："))
      ?.replace("- 任务：", "")
      .trim() ?? summary.name;

    await writeWorkspaceFile(path.join(docsRoot, "modules", fileName), content);
    published.push({ fileName, title });
  }

  return published.sort((left, right) => left.fileName.localeCompare(right.fileName));
}
