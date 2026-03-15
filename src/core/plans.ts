import path from "node:path";

import type { FileIndexEntry, TaskPlan, TeachingUnitKind, WaveName } from "./types.js";
import { DEFAULT_MAX_LOGICAL_LINES_PER_TASK } from "./constants.js";

interface TeachingBlueprint {
  id: string;
  wave: WaveName;
  unit: string;
  kind: TeachingUnitKind;
  learningOrder: number;
  titlePrefix: string;
  goal: string;
  whyThisMatters: string;
  whyThisOrder: string;
  keyQuestions: string[];
  recommendedPrerequisites: string[];
}

const BLUEPRINTS: TeachingBlueprint[] = [
  {
    id: "orientation",
    wave: "WAVE_1",
    unit: "项目入口与配置",
    kind: "core",
    learningOrder: 10,
    titlePrefix: "项目入口与配置",
    goal: "解释项目如何启动、配置如何生效，以及读者需要先建立的全局背景。",
    whyThisMatters: "读者先搞清入口、配置和运行边界，后续阅读才不会迷路。",
    whyThisOrder: "这是所有后续模块的前置知识，决定项目的启动方式和整体边界。",
    keyQuestions: ["项目从哪里启动？", "关键配置项有哪些？", "代码分析从哪里开始最有效？"],
    recommendedPrerequisites: [],
  },
  {
    id: "domain-foundation",
    wave: "WAVE_1",
    unit: "核心数据结构与共享抽象",
    kind: "core",
    learningOrder: 20,
    titlePrefix: "核心数据结构与共享抽象",
    goal: "梳理项目中的核心类型、状态对象、配置载体和公共抽象。",
    whyThisMatters: "这些对象定义了系统内部如何表达问题，是理解流程前必须掌握的词汇表。",
    whyThisOrder: "先理解数据和抽象，再看流程，读者才能知道每一步到底在处理什么。",
    keyQuestions: ["系统的核心概念有哪些？", "关键状态如何表示？", "模块之间共享了哪些抽象？"],
    recommendedPrerequisites: ["项目入口与配置"],
  },
  {
    id: "analysis-engine",
    wave: "WAVE_2",
    unit: "主分析链路",
    kind: "core",
    learningOrder: 30,
    titlePrefix: "主分析链路",
    goal: "讲清项目如何从输入仓库出发，完成索引、规划和阶段推进。",
    whyThisMatters: "这是项目最值得学习的主流程，直接决定系统如何把源码转成结构化知识。",
    whyThisOrder: "在理解数据结构之后，再看主链路，读者才能把概念和行为连起来。",
    keyQuestions: ["系统怎样把源码变成分析任务？", "阶段之间如何流转状态？", "主链路的关键转折点是什么？"],
    recommendedPrerequisites: ["项目入口与配置", "核心数据结构与共享抽象"],
  },
  {
    id: "execution-infra",
    wave: "WAVE_2",
    unit: "执行调度与基础设施",
    kind: "core",
    learningOrder: 40,
    titlePrefix: "执行调度与基础设施",
    goal: "解释并行调度、Runner 选择、提示词拼装和故障回退机制。",
    whyThisMatters: "这部分体现了系统如何把设计想法落实成可执行、可恢复的工程方案。",
    whyThisOrder: "主链路读完后，再看调度和基础设施，能帮助读者理解系统为何稳定可运行。",
    keyQuestions: ["任务如何被调度？", "何时走 Claude，何时回退？", "系统如何保证执行可恢复？"],
    recommendedPrerequisites: ["主分析链路", "核心数据结构与共享抽象"],
  },
  {
    id: "delivery",
    wave: "WAVE_3",
    unit: "教学文档装配与交付",
    kind: "core",
    learningOrder: 50,
    titlePrefix: "教学文档装配与交付",
    goal: "说明系统如何把中间摘要转成面向学习者的最终文档库。",
    whyThisMatters: "最终交付形态决定这套系统是否真正具有教学价值，而不是停留在技术日志。",
    whyThisOrder: "先理解如何分析，再看如何教会别人，能更好理解产品目标的闭环。",
    keyQuestions: ["摘要怎样被聚合为教学文档？", "系统如何提炼亮点和架构？", "最终交付如何保证可读性？"],
    recommendedPrerequisites: ["主分析链路", "执行调度与基础设施"],
  },
  {
    id: "extension",
    wave: "WAVE_3",
    unit: "入口层、扩展点与辅助材料",
    kind: "supporting",
    learningOrder: 60,
    titlePrefix: "入口层、扩展点与辅助材料",
    goal: "补充说明命令入口、测试、示例、脚手架和外部集成材料的作用。",
    whyThisMatters: "这部分不是主链路本身，但决定项目如何被使用、验证和扩展。",
    whyThisOrder: "读者先掌握核心，再回头看辅助材料，才能区分主逻辑和支撑逻辑。",
    keyQuestions: ["有哪些辅助材料值得补充阅读？", "项目如何被验证？", "扩展点在哪里？"],
    recommendedPrerequisites: ["教学文档装配与交付"],
  },
];

const SUPPORTING_PATTERNS = [
  ".claude/",
  ".spec-workflow/",
  "test/",
  "tests/",
  "fixture",
  "fixtures/",
  "example",
  "examples/",
  "sample",
  "samples/",
  "__tests__",
];

const ORIENTATION_PATTERNS = [
  "package.json",
  "pyproject.toml",
  "pom.xml",
  "cargo.toml",
  "go.mod",
  "tsconfig",
  "vite.config",
  "webpack",
  "rollup",
  "main.",
  "app.",
  "index.",
  "cli/",
  "cmd/",
  "config",
  "readme",
];

const DOMAIN_PATTERNS = ["types", "model", "entity", "schema", "constant", "state", "dto", "shared", "base"];
const ANALYSIS_PATTERNS = ["parser", "analy", "plan", "index", "map", "stage", "pipeline", "workflow", "engine"];
const EXECUTION_PATTERNS = ["runner", "executor", "prompt", "queue", "dispatch", "schedule", "worker", "client"];
const DELIVERY_PATTERNS = ["report", "render", "publish", "write", "doc", "highlight", "architecture", "verify"];

export function buildTaskPlans(
  entries: FileIndexEntry[],
  maxFilesPerTask: number,
  outputDirname = ".code-explorer",
): Record<WaveName, TaskPlan[]> {
  const grouped = new Map<string, { blueprint: TeachingBlueprint; entries: FileIndexEntry[] }>();

  for (const entry of entries) {
    const blueprint = classifyBlueprint(entry);
    const groupingKey = `${blueprint.id}:${deriveModuleLabel(entry.path, blueprint.id)}`;
    const bucket = grouped.get(groupingKey);
    if (bucket) {
      bucket.entries.push(entry);
      continue;
    }

    grouped.set(groupingKey, {
      blueprint,
      entries: [entry],
    });
  }

  const wavePlans: Record<WaveName, TaskPlan[]> = {
    WAVE_1: [],
    WAVE_2: [],
    WAVE_3: [],
  };

  for (const { blueprint, entries: groupedEntries } of [...grouped.values()].sort(sortGroupedEntries)) {
    const chunks = chunkEntries(groupedEntries, maxFilesPerTask);
    for (const chunk of chunks) {
      wavePlans[blueprint.wave].push(createTaskFromChunk(blueprint, wavePlans[blueprint.wave].length + 1, chunk, outputDirname));
    }
  }

  for (const wave of Object.keys(wavePlans) as WaveName[]) {
    wavePlans[wave].sort((left, right) => left.learning_order - right.learning_order || left.title.localeCompare(right.title));
  }

  return wavePlans;
}

function classifyBlueprint(entry: FileIndexEntry): TeachingBlueprint {
  const normalized = entry.path.toLowerCase();

  if (SUPPORTING_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return blueprintById("extension");
  }

  if (DELIVERY_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return blueprintById("delivery");
  }

  if (EXECUTION_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return blueprintById("execution-infra");
  }

  if (ANALYSIS_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return blueprintById("analysis-engine");
  }

  if (
    DOMAIN_PATTERNS.some((pattern) => normalized.includes(pattern)) ||
    entry.symbols.some((symbol) => ["class", "interface", "type"].includes(symbol.kind))
  ) {
    return blueprintById("domain-foundation");
  }

  if (ORIENTATION_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return blueprintById("orientation");
  }

  if (entry.imports.length > entry.exports.length) {
    return blueprintById("analysis-engine");
  }

  return blueprintById("delivery");
}

function blueprintById(id: string): TeachingBlueprint {
  const found = BLUEPRINTS.find((blueprint) => blueprint.id === id);
  if (!found) {
    throw new Error(`未知教学单元蓝图: ${id}`);
  }

  return found;
}

function deriveModuleLabel(filePath: string, blueprintId: string): string {
  const parts = filePath.split("/");
  if (parts.length <= 1) {
    return "root";
  }

  if (blueprintId === "extension" && parts.length >= 2) {
    return parts.slice(0, Math.min(parts.length - 1, 3)).join("/");
  }

  if (parts[0] === "src" && parts.length >= 3) {
    return `${parts[0]}/${parts[1]}`;
  }

  return parts.slice(0, parts.length - 1).join("/") || "root";
}

function estimateLogicalLines(summary?: string): number {
  if (!summary) {
    return 0;
  }

  return summary.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
}

function chunkEntries(entries: FileIndexEntry[], maxFilesPerTask: number): FileIndexEntry[][] {
  const sorted = [...entries].sort((left, right) => left.path.localeCompare(right.path));
  const chunks: FileIndexEntry[][] = [];
  let current: FileIndexEntry[] = [];
  let estimatedLines = 0;

  for (const entry of sorted) {
    const nextLines = estimateLogicalLines(entry.summary);
    const shouldSplit = current.length >= maxFilesPerTask || estimatedLines + nextLines > DEFAULT_MAX_LOGICAL_LINES_PER_TASK;
    if (current.length > 0 && shouldSplit) {
      chunks.push(current);
      current = [];
      estimatedLines = 0;
    }

    current.push(entry);
    estimatedLines += nextLines;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

function createTaskFromChunk(
  blueprint: TeachingBlueprint,
  sequence: number,
  chunk: FileIndexEntry[],
  outputDirname: string,
): TaskPlan {
  const moduleLabel = deriveModuleLabel(chunk[0].path, blueprint.id);
  const taskId = `${blueprint.wave.toLowerCase()}_${String(sequence).padStart(2, "0")}`;
  const label = moduleLabel === "root" ? "根目录" : moduleLabel;
  const dependsOn =
    blueprint.wave === "WAVE_1" ? [] : blueprint.wave === "WAVE_2" ? ["WAVE_1"] : ["WAVE_1", "WAVE_2"];
  const requiredSummaries =
    blueprint.wave === "WAVE_1" ? [] : blueprint.wave === "WAVE_2" ? ["WAVE_1:*"] : ["WAVE_1:*", "WAVE_2:*"];

  return {
    task_id: taskId,
    wave: blueprint.wave,
    title: `${blueprint.titlePrefix} - ${label}`,
    goal: blueprint.goal,
    teaching_unit: blueprint.unit,
    teaching_unit_kind: blueprint.kind,
    learning_order: blueprint.learningOrder + sequence,
    why_this_matters: blueprint.whyThisMatters,
    why_this_order: blueprint.whyThisOrder,
    key_questions: blueprint.keyQuestions,
    recommended_prerequisites: blueprint.recommendedPrerequisites,
    scope_files: chunk.map((entry) => entry.path),
    depends_on: dependsOn,
    required_summaries: requiredSummaries,
    agent_role: blueprint.wave === "WAVE_2" ? "flow-agent" : "data-agent",
    output_path: `${outputDirname}/planning/analysis/${taskId}_SUMMARY.md`,
    acceptance_checks: [
      "先解释模块要解决的问题，再解释结构和流程",
      "必须指出设计取舍、关键证据和容易误解的点",
      "结尾给出下一步阅读建议，而不是只罗列文件",
    ],
  };
}

function sortGroupedEntries(
  left: { blueprint: TeachingBlueprint; entries: FileIndexEntry[] },
  right: { blueprint: TeachingBlueprint; entries: FileIndexEntry[] },
): number {
  return (
    left.blueprint.learningOrder - right.blueprint.learningOrder ||
    left.blueprint.unit.localeCompare(right.blueprint.unit) ||
    left.entries[0].path.localeCompare(right.entries[0].path)
  );
}
