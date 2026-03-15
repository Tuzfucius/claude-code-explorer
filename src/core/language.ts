import path from "node:path";

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".py": "python",
  ".java": "java",
  ".go": "go",
  ".rs": "rust",
  ".json": "json",
  ".yml": "yaml",
  ".yaml": "yaml",
  ".toml": "toml",
  ".xml": "xml",
  ".md": "markdown",
};

const MANIFEST_NAMES = new Set([
  "package.json",
  "pnpm-workspace.yaml",
  "pyproject.toml",
  "requirements.txt",
  "pom.xml",
  "build.gradle",
  "settings.gradle",
  "Cargo.toml",
  "go.mod",
  "go.work",
  "Makefile",
  "README.md",
]);

export function detectLanguage(filePath: string): string {
  const baseName = path.basename(filePath);
  if (MANIFEST_NAMES.has(baseName)) {
    return "manifest";
  }

  return LANGUAGE_BY_EXTENSION[path.extname(filePath).toLowerCase()] ?? "unknown";
}

export function isManifestFile(filePath: string): boolean {
  return detectLanguage(filePath) === "manifest";
}

export function isAstCandidate(language: string): boolean {
  return ["typescript", "javascript", "python", "java", "go", "rust"].includes(language);
}

