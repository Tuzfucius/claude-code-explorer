export const DEFAULT_OUTPUT_DIRNAME = ".code-explorer";
export const DEFAULT_CONFIG_FILE = "code-explorer.config.json";
export const DEFAULT_CONCURRENCY = 4;
export const DEFAULT_MAX_FILES_PER_TASK = 10;
export const DEFAULT_MAX_LOGICAL_LINES_PER_TASK = 2000;

export const PHASE_STATUS_FILES = {
  phase0: "state/PHASE_0_MAP_STATUS.xml",
  phase1: "state/PHASE_1_PLAN_STATUS.xml",
  phase2: "state/PHASE_2_WAVE_STATUS.xml",
  phase3: "state/PHASE_3_SYNTHESIS_STATUS.xml",
  phase4: "state/PHASE_4_PUBLISH_STATUS.xml",
} as const;

export const ARTIFACT_FILES = {
  indexMap: "INDEX_MAP.xml",
  wave1: "planning/WAVE_1_PLANS.xml",
  wave2: "planning/WAVE_2_PLANS.xml",
  wave3: "planning/WAVE_3_PLANS.xml",
  analysisDir: "planning/analysis",
  docsDir: "docs",
  docsReadme: "docs/README.md",
  docsIndex: "docs/INDEX.md",
  highlights: "docs/HIGHLIGHTS.md",
  architecture: "docs/SYSTEM_ARCHITECTURE.md",
  learningPath: "docs/LEARNING_PATH.md",
  glossary: "docs/GLOSSARY.md",
  verifyReport: "docs/VERIFY_REPORT.md",
} as const;

export const DEFAULT_EXCLUDES = [
  ".git/**",
  "node_modules/**",
  "dist/**",
  "build/**",
  "coverage/**",
  ".next/**",
  ".turbo/**",
  "*.min.js",
  "*.lock",
  "*.png",
  "*.jpg",
  "*.jpeg",
  "*.gif",
  "*.mp4",
  "*.zip",
  "*.tar",
  "*.gz",
  "*.exe",
  "*.dll",
  "*.so",
  "*.dylib",
] as const;

export const SUPPORTED_AST_LANGUAGES = ["typescript", "javascript", "python", "java", "go", "rust"] as const;
