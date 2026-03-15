import path from "node:path";

import { ARTIFACT_FILES, PHASE_STATUS_FILES } from "../core/constants.js";
import { ensureDir, listRepoFiles, loadRepoConfig, writeWorkspaceFile } from "../core/fs-utils.js";
import { detectLanguage, isAstCandidate, isManifestFile } from "../core/language.js";
import { resolveOutputRoot } from "../core/paths.js";
import { serializeIndexMap, serializePhaseState } from "../core/serialization.js";
import type { IndexMap, PhaseState } from "../core/types.js";
import { summarizeManifest, parseHeuristically } from "../parsers/heuristic.js";
import { parseWithTreeSitter } from "../parsers/tree-sitter.js";

export async function runPhase0(repoPath: string): Promise<IndexMap> {
  const config = await loadRepoConfig(repoPath);
  const outputRoot = resolveOutputRoot(repoPath, config.outputDir);
  await ensureDir(outputRoot);

  const runningState: PhaseState = {
    phase: "phase_0_map",
    status: "running",
    inputRefs: [repoPath],
    outputRefs: [path.join(outputRoot, ARTIFACT_FILES.indexMap)],
    startedAt: new Date().toISOString(),
    errors: [],
    runner: "none",
  };

  await writeWorkspaceFile(path.join(outputRoot, PHASE_STATUS_FILES.phase0), `${serializePhaseState(runningState)}\n`);

  try {
    const files = await listRepoFiles(repoPath, config);
    const manifests = [];
    const entries = [];

    for (const relativePath of files) {
      const language = detectLanguage(relativePath);
      if (isManifestFile(relativePath)) {
        manifests.push(await summarizeManifest(repoPath, relativePath));
        continue;
      }

      const entry =
        isAstCandidate(language) && config.languageAdapters.includes(language)
          ? ((await parseWithTreeSitter(repoPath, relativePath, language)) ?? (await parseHeuristically(repoPath, relativePath, language)))
          : await parseHeuristically(repoPath, relativePath, language);

      entries.push(entry);
    }

    const indexMap: IndexMap = {
      generatedAt: new Date().toISOString(),
      rootPath: repoPath,
      entries,
      manifests,
    };

    await writeWorkspaceFile(path.join(outputRoot, ARTIFACT_FILES.indexMap), `${serializeIndexMap(indexMap)}\n`);
    await writeWorkspaceFile(
      path.join(outputRoot, PHASE_STATUS_FILES.phase0),
      `${serializePhaseState({
        ...runningState,
        status: "completed",
        finishedAt: new Date().toISOString(),
      })}\n`,
    );

    return indexMap;
  } catch (error) {
    await writeWorkspaceFile(
      path.join(outputRoot, PHASE_STATUS_FILES.phase0),
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

