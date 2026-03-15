export type RunnerMode = "auto" | "teams" | "sdk";
export type PhaseStatus = "pending" | "running" | "completed" | "failed" | "skipped";
export type WaveName = "WAVE_1" | "WAVE_2" | "WAVE_3";
export type AgentRole = "orchestrator" | "data-agent" | "flow-agent" | "architect" | "writer";

export interface CodeExplorerConfig {
  include: string[];
  exclude: string[];
  runnerMode: RunnerMode;
  concurrency: number;
  languageAdapters: string[];
  outputDir: string;
  docLanguage: "zh-CN";
  maxFilesPerTask: number;
}

export interface PhaseState {
  phase: string;
  status: PhaseStatus;
  inputRefs: string[];
  outputRefs: string[];
  startedAt?: string;
  finishedAt?: string;
  errors: string[];
  resumeToken?: string;
  runner: RunnerMode | "none";
}

export interface FileSymbol {
  kind: "class" | "function" | "method" | "interface" | "type" | "module" | "config" | "unknown";
  name: string;
  signature?: string;
  parameters?: string[];
  returns?: string;
  confidence: "high" | "medium" | "low";
  source: "ast" | "heuristic";
}

export interface FileIndexEntry {
  path: string;
  language: string;
  size: number;
  imports: string[];
  exports: string[];
  symbols: FileSymbol[];
  summary?: string;
  source: "ast" | "heuristic";
  confidence: "high" | "medium" | "low";
}

export interface IndexMap {
  generatedAt: string;
  rootPath: string;
  entries: FileIndexEntry[];
  manifests: FileIndexEntry[];
}

export interface TaskPlan {
  task_id: string;
  wave: WaveName;
  title: string;
  goal: string;
  scope_files: string[];
  depends_on: string[];
  required_summaries: string[];
  agent_role: AgentRole;
  output_path: string;
  acceptance_checks: string[];
}

export interface WavePlan {
  wave: WaveName;
  tasks: TaskPlan[];
}

