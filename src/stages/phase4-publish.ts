import path from "node:path";

import { ARTIFACT_FILES, PHASE_STATUS_FILES } from "../core/constants.js";
import { loadRepoConfig, readTextIfExists, writeWorkspaceFile } from "../core/fs-utils.js";
import { resolveArtifactPath, resolveOutputRoot } from "../core/paths.js";
import { serializePhaseState } from "../core/serialization.js";
import type { CodeExplorerConfig, IndexMap, PhaseState, TaskPlan, WaveName } from "../core/types.js";
import {
  buildCoreConceptsMarkdown,
  buildDocsIndex,
  buildDocsReadme,
  buildGlossary,
  buildLearningPath,
  buildStartHereMarkdown,
  buildVerifyReport,
} from "../reporting/docs.js";
import { verifyDocs, type VerifyResult } from "../reporting/verify.js";

export async function runPhase4(
  repoPath: string,
  indexMap: IndexMap,
  wavePlans: Record<WaveName, TaskPlan[]>,
  configOverrides?: Partial<CodeExplorerConfig>,
): Promise<VerifyResult> {
  const config = await loadRepoConfig(repoPath, configOverrides);
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
      resolveArtifactPath(repoPath, "docsStartHere", config.outputDir),
      resolveArtifactPath(repoPath, "docsIndex", config.outputDir),
      resolveArtifactPath(repoPath, "coreConcepts", config.outputDir),
      resolveArtifactPath(repoPath, "learningPath", config.outputDir),
      resolveArtifactPath(repoPath, "learningPathBeginner", config.outputDir),
      resolveArtifactPath(repoPath, "learningPathAdvanced", config.outputDir),
      resolveArtifactPath(repoPath, "glossary", config.outputDir),
      resolveArtifactPath(repoPath, "verifyReport", config.outputDir),
    ],
    startedAt: new Date().toISOString(),
    errors: [],
    runner: "none",
  };

  await writeWorkspaceFile(path.join(outputRoot, PHASE_STATUS_FILES.phase4), `${serializePhaseState(runningState)}\n`);

  try {
    const moduleFiles = await publishModuleSummaries(repoPath, docsRoot, configOverrides);
    await writeWorkspaceFile(resolveArtifactPath(repoPath, "docsReadme", config.outputDir), `${buildDocsReadme(config.docLanguage)}\n`);
    await writeWorkspaceFile(
      resolveArtifactPath(repoPath, "docsStartHere", config.outputDir),
      `${buildStartHereMarkdown(wavePlans, config.docLanguage)}\n`,
    );
    await writeWorkspaceFile(
      resolveArtifactPath(repoPath, "docsIndex", config.outputDir),
      `${buildDocsIndex(wavePlans, indexMap, moduleFiles, config.docLanguage)}\n`,
    );
    await writeWorkspaceFile(
      resolveArtifactPath(repoPath, "coreConcepts", config.outputDir),
      `${buildCoreConceptsMarkdown(indexMap, config.docLanguage)}\n`,
    );
    await writeWorkspaceFile(
      resolveArtifactPath(repoPath, "learningPath", config.outputDir),
      `${buildLearningPath(wavePlans, config.docLanguage, "beginner")}\n`,
    );
    await writeWorkspaceFile(
      resolveArtifactPath(repoPath, "learningPathBeginner", config.outputDir),
      `${buildLearningPath(wavePlans, config.docLanguage, "beginner")}\n`,
    );
    await writeWorkspaceFile(
      resolveArtifactPath(repoPath, "learningPathAdvanced", config.outputDir),
      `${buildLearningPath(wavePlans, config.docLanguage, "advanced")}\n`,
    );
    await writeWorkspaceFile(resolveArtifactPath(repoPath, "glossary", config.outputDir), `${buildGlossary(indexMap, config.docLanguage)}\n`);
    await writeWorkspaceFile(
      resolveArtifactPath(repoPath, "verifyReport", config.outputDir),
      `${buildVerifyReport({ valid: true, linkErrors: [], mermaidErrors: [], placeholderErrors: [], qualityErrors: [] }, config.docLanguage)}\n`,
    );

    const verifyResult = await verifyDocs(docsRoot);
    await writeWorkspaceFile(
      resolveArtifactPath(repoPath, "verifyReport", config.outputDir),
      `${buildVerifyReport(verifyResult, config.docLanguage)}\n`,
    );

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
          ...verifyResult.qualityErrors,
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
  configOverrides?: Partial<CodeExplorerConfig>,
): Promise<Array<{ fileName: string; title: string; kind: TaskPlan["teaching_unit_kind"]; unit: string }>> {
  const config = await loadRepoConfig(repoPath, configOverrides);
  const analysisDir = resolveArtifactPath(repoPath, "analysisDir", config.outputDir);
  const fs = await import("node:fs/promises");
  const entries = await fs.readdir(analysisDir, { withFileTypes: true }).catch(() => []);
  const summaries = entries.filter((entry) => entry.isFile() && entry.name.endsWith("_SUMMARY.md"));
  const published: Array<{ fileName: string; title: string; kind: TaskPlan["teaching_unit_kind"]; unit: string }> = [];

  for (const summary of summaries) {
    const sourcePath = path.join(analysisDir, summary.name);
    const content = (await readTextIfExists(sourcePath)) ?? "";
    const fileName = summary.name.replace("_SUMMARY", "");
    const title = content
      .split(/\r?\n/)
      .find((line) => line.startsWith("> 学习单元：") || line.startsWith("> Teaching Unit:"))
      ?.replace("> 学习单元：", "")
      .replace("> Teaching Unit:", "")
      .trim() ?? summary.name;
    const kind = content.includes("> 类型：supporting") || content.includes("> Kind: supporting") ? "supporting" : "core";
    const unit =
      content
        .split(/\r?\n/)
        .find((line) => line.startsWith("> 单元：") || line.startsWith("> Unit:"))
        ?.replace("> 单元：", "")
        .replace("> Unit:", "")
        .trim() ?? title;

    await writeWorkspaceFile(path.join(docsRoot, "modules", fileName), content);
    published.push({ fileName, title, kind, unit });
  }

  return published.sort((left, right) => left.fileName.localeCompare(right.fileName));
}
