import path from "node:path";

import { readWorkspaceFile } from "../core/fs-utils.js";
import type { FileIndexEntry, FileSymbol } from "../core/types.js";

const FUNCTION_PATTERNS = [
  /function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/g,
  /def\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/g,
  /fn\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/g,
  /func\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/g,
];

const CLASS_PATTERNS = [
  /class\s+([A-Za-z0-9_]+)/g,
  /interface\s+([A-Za-z0-9_]+)/g,
  /struct\s+([A-Za-z0-9_]+)/g,
  /enum\s+([A-Za-z0-9_]+)/g,
];

export async function parseHeuristically(repoPath: string, relativePath: string, language: string): Promise<FileIndexEntry> {
  const source = await readWorkspaceFile(repoPath, relativePath);
  const symbols: FileSymbol[] = [];
  const imports = extractByPattern(source, /^(import|from|use|require|include)\b.+$/gm);
  const exports = extractByPattern(source, /^(export|module\.exports|pub)\b.+$/gm);

  for (const pattern of FUNCTION_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      symbols.push({
        kind: "function",
        name: match[1],
        signature: `${match[1]}(${match[2] ?? ""})`,
        parameters: splitSignature(match[2] ?? ""),
        confidence: "low",
        source: "heuristic",
      });
    }
  }

  for (const pattern of CLASS_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      symbols.push({
        kind: pattern.source.startsWith("interface") ? "interface" : "class",
        name: match[1],
        signature: match[0],
        confidence: "low",
        source: "heuristic",
      });
    }
  }

  return {
    path: relativePath,
    language,
    size: Buffer.byteLength(source, "utf8"),
    imports,
    exports,
    symbols,
    summary: buildWeakSummary(relativePath, source),
    source: "heuristic",
    confidence: "low",
  };
}

export async function summarizeManifest(repoPath: string, relativePath: string): Promise<FileIndexEntry> {
  const source = await readWorkspaceFile(repoPath, relativePath);
  const basename = path.basename(relativePath);
  const summary = buildManifestSummary(basename, source);

  return {
    path: relativePath,
    language: "manifest",
    size: Buffer.byteLength(source, "utf8"),
    imports: [],
    exports: [],
    symbols: [
      {
        kind: "config",
        name: basename,
        signature: summary,
        confidence: "medium",
        source: "heuristic",
      },
    ],
    summary,
    source: "heuristic",
    confidence: "medium",
  };
}

function buildWeakSummary(relativePath: string, source: string): string {
  const lines = source.split(/\r?\n/).slice(0, 20).join("\n");
  return `文件: ${relativePath}\n预览:\n${lines}`;
}

function buildManifestSummary(fileName: string, source: string): string {
  if (fileName === "package.json") {
    try {
      const pkg = JSON.parse(source) as {
        name?: string;
        scripts?: Record<string, string>;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      return `package=${pkg.name ?? "unknown"}; scripts=${Object.keys(pkg.scripts ?? {}).length}; deps=${Object.keys(
        pkg.dependencies ?? {},
      ).length}; devDeps=${Object.keys(pkg.devDependencies ?? {}).length}`;
    } catch {
      return "package.json 解析失败";
    }
  }

  const firstLines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6)
    .join("; ");

  return `${fileName}: ${firstLines}`;
}

function extractByPattern(source: string, pattern: RegExp): string[] {
  return [...source.matchAll(pattern)].map((match) => match[0].trim());
}

function splitSignature(signature: string): string[] {
  return signature
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

