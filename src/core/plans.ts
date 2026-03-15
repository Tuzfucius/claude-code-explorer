import path from "node:path";

import type { FileIndexEntry, TaskPlan, WaveName } from "./types.js";
import { DEFAULT_MAX_LOGICAL_LINES_PER_TASK } from "./constants.js";

const KEYWORD_TO_WAVE: Array<{ matchers: string[]; wave: WaveName }> = [
  { matchers: ["model", "entity", "schema", "dto", "types", "config", "base", "shared"], wave: "WAVE_1" },
  { matchers: ["service", "domain", "core", "repository", "usecase", "workflow", "manager"], wave: "WAVE_2" },
  { matchers: ["controller", "route", "api", "handler", "view", "component", "page", "main", "cmd", "app"], wave: "WAVE_3" },
];

export function classifyWave(entry: FileIndexEntry): WaveName {
  const normalized = entry.path.toLowerCase();
  const matched = KEYWORD_TO_WAVE.find(({ matchers }) => matchers.some((matcher) => normalized.includes(matcher)));

  if (matched) {
    return matched.wave;
  }

  if (entry.symbols.some((symbol) => symbol.kind === "class" || symbol.kind === "interface" || symbol.kind === "type")) {
    return "WAVE_1";
  }

  if (entry.imports.length > entry.exports.length) {
    return "WAVE_2";
  }

  return "WAVE_3";
}

export function estimateLogicalLines(summary?: string): number {
  if (!summary) {
    return 0;
  }

  return summary.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
}

export function buildTaskPlans(
  entries: FileIndexEntry[],
  maxFilesPerTask: number,
  outputDirname = ".code-explorer",
): Record<WaveName, TaskPlan[]> {
  const groupedByWave = {
    WAVE_1: [] as FileIndexEntry[],
    WAVE_2: [] as FileIndexEntry[],
    WAVE_3: [] as FileIndexEntry[],
  };

  for (const entry of entries) {
    groupedByWave[classifyWave(entry)].push(entry);
  }

  return {
    WAVE_1: chunkWave("WAVE_1", groupedByWave.WAVE_1, maxFilesPerTask, outputDirname),
    WAVE_2: chunkWave("WAVE_2", groupedByWave.WAVE_2, maxFilesPerTask, outputDirname),
    WAVE_3: chunkWave("WAVE_3", groupedByWave.WAVE_3, maxFilesPerTask, outputDirname),
  };
}

function chunkWave(wave: WaveName, entries: FileIndexEntry[], maxFilesPerTask: number, outputDirname: string): TaskPlan[] {
  const sorted = [...entries].sort((left, right) => left.path.localeCompare(right.path));
  const tasks: TaskPlan[] = [];
  let chunk: FileIndexEntry[] = [];
  let estimatedLines = 0;

  for (const entry of sorted) {
    const nextLines = estimateLogicalLines(entry.summary);
    const wouldOverflowFiles = chunk.length >= maxFilesPerTask;
    const wouldOverflowLines = estimatedLines + nextLines > DEFAULT_MAX_LOGICAL_LINES_PER_TASK;
    const pathChanged = chunk.length > 0 && path.dirname(chunk[0].path) !== path.dirname(entry.path);

    if (chunk.length > 0 && (wouldOverflowFiles || wouldOverflowLines || pathChanged)) {
      tasks.push(createTaskFromChunk(wave, tasks.length + 1, chunk, outputDirname));
      chunk = [];
      estimatedLines = 0;
    }

    chunk.push(entry);
    estimatedLines += nextLines;
  }

  if (chunk.length > 0) {
    tasks.push(createTaskFromChunk(wave, tasks.length + 1, chunk, outputDirname));
  }

  return tasks;
}

function createTaskFromChunk(wave: WaveName, sequence: number, chunk: FileIndexEntry[], outputDirname: string): TaskPlan {
  const taskId = `${wave.toLowerCase()}_${String(sequence).padStart(2, "0")}`;
  const title = `${wave} ${path.dirname(chunk[0].path) === "." ? "root" : path.dirname(chunk[0].path)} 模块分析`;
  const dependsOn = wave === "WAVE_1" ? [] : wave === "WAVE_2" ? ["WAVE_1"] : ["WAVE_1", "WAVE_2"];

  return {
    task_id: taskId,
    wave,
    title,
    goal: createGoal(wave),
    scope_files: chunk.map((entry) => entry.path),
    depends_on: dependsOn,
    required_summaries: wave === "WAVE_1" ? [] : [`${wave === "WAVE_2" ? "WAVE_1" : "WAVE_2"}:*`],
    agent_role: wave === "WAVE_2" ? "flow-agent" : "data-agent",
    output_path: `${outputDirname}/planning/analysis/${taskId}_SUMMARY.md`,
    acceptance_checks: [
      "说明模块职责与边界",
      "列出关键类型、函数和调用链",
      "指出学习该模块前需要预读的上下文",
    ],
  };
}

function createGoal(wave: WaveName): string {
  if (wave === "WAVE_1") {
    return "梳理基础数据结构、配置与公共抽象。";
  }

  if (wave === "WAVE_2") {
    return "解释核心业务逻辑、调用链与模块协作。";
  }

  return "总结入口层、交互层、集成点与亮点候选。";
}
