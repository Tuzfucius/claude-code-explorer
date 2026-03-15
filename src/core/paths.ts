import path from "node:path";

import { ARTIFACT_FILES, DEFAULT_OUTPUT_DIRNAME, PHASE_STATUS_FILES } from "./constants.js";

export function resolveOutputRoot(repoPath: string, outputDir = DEFAULT_OUTPUT_DIRNAME): string {
  return path.join(repoPath, outputDir);
}

export function resolveStatusPath(repoPath: string, key: keyof typeof PHASE_STATUS_FILES, outputDir?: string): string {
  return path.join(resolveOutputRoot(repoPath, outputDir), PHASE_STATUS_FILES[key]);
}

export function resolveArtifactPath(repoPath: string, key: keyof typeof ARTIFACT_FILES, outputDir?: string): string {
  return path.join(resolveOutputRoot(repoPath, outputDir), ARTIFACT_FILES[key]);
}

