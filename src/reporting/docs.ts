import path from "node:path";

import type { FileIndexEntry, IndexMap, TaskExecutionResult, TaskPlan, WaveName } from "../core/types.js";

export function buildHighlightsMarkdown(
  wavePlans: Record<WaveName, TaskPlan[]>,
  results: TaskExecutionResult[],
  summaries: Array<{ fileName: string; content: string }>,
): string {
  const successCount = results.filter((item) => item.status === "completed").length;
  const keyModules = pickKeyModules(wavePlans);
  const keywords = extractKeywords(summaries.map((item) => item.content).join("\n"));

  return [
    "# HIGHLIGHTS",
    "",
    "## 核心设计模式",
    "",
    `- 工作流按 ${Object.keys(wavePlans).length} 个波次推进，先基础结构后业务链路再入口交互，降低跨模块理解成本。`,
    `- 当前分析共完成 ${successCount} 个原子任务，摘要结果按任务粒度沉淀，便于后续聚合与增量重跑。`,
    ...keyModules.map((module) => `- 重点模块：${module}`),
    "",
    "## 扩展点",
    "",
    "- 可新增语言适配器扩展阶段 0 的 AST 解析覆盖范围。",
    "- 可切换 Teams Runner / SDK Runner，并在不可用时回退到本地启发式摘要。",
    "- 文档发布层与校验层分离，后续可增补 HTML 或站点化输出。",
    "",
    "## 性能与工程技巧",
    "",
    "- 阶段 0 只抽取骨架，不消费大模型上下文。",
    "- 阶段 2 通过波次屏障与并发限制控制上下文隔离和资源占用。",
    "- 文档校验在本地完成，避免因 Mermaid 语法或坏链接把问题带到交付阶段。",
    "",
    "## 学习建议",
    "",
    "- 先阅读 `INDEX.md` 和 `SYSTEM_ARCHITECTURE.md` 建立全局地图。",
    "- 再按 `LEARNING_PATH.md` 依次阅读 WAVE_1、WAVE_2、WAVE_3 模块报告。",
    keywords.length > 0 ? `- 关注这些高频关键词：${keywords.join("、")}` : "- 当前摘要关键词较分散，建议直接按模块目录阅读。",
    "",
    "## 阅读优先级",
    "",
    ...Object.entries(wavePlans).flatMap(([wave, tasks]) => tasks.slice(0, 3).map((task) => `- ${wave}: ${task.title}`)),
    "",
  ].join("\n");
}

export function buildArchitectureMarkdown(
  indexMap: IndexMap,
  wavePlans: Record<WaveName, TaskPlan[]>,
  summaries: Array<{ fileName: string; content: string }>,
): string {
  const directories = groupByTopDirectory(indexMap.entries);
  const componentLines = [
    "flowchart LR",
    ...Object.keys(directories).map((dir) => `  ${toNodeId(dir)}["${dir}"]`),
    ...buildWaveEdges(wavePlans),
  ];

  const sequenceLines = [
    "sequenceDiagram",
    "  participant Reader as 学习者",
    "  participant Entry as 入口层",
    "  participant Logic as 核心逻辑",
    "  participant Data as 数据与配置",
    "  Reader->>Entry: 从文档或命令入口进入系统",
    "  Entry->>Logic: 调度核心流程与模块协作",
    "  Logic->>Data: 读取配置、数据结构与基础能力",
    "  Data-->>Logic: 返回结构与依赖结果",
    "  Logic-->>Entry: 聚合输出",
    "  Entry-->>Reader: 呈现功能与学习路径",
  ];

  return [
    "# SYSTEM_ARCHITECTURE",
    "",
    "## 总览",
    "",
    `- 目录节点数：${Object.keys(directories).length}`,
    `- 摘要文件数：${summaries.length}`,
    `- 分析波次：${Object.keys(wavePlans).join(" -> ")}`,
    "",
    "## 组件视图",
    "",
    "```mermaid",
    ...componentLines,
    "```",
    "",
    "## 关键流程",
    "",
    "```mermaid",
    ...sequenceLines,
    "```",
    "",
  ].join("\n");
}

export function buildDocsReadme(): string {
  return [
    "# 项目分析与学习文档",
    "",
    "- [总索引](./INDEX.md)",
    "- [系统架构](./SYSTEM_ARCHITECTURE.md)",
    "- [亮点提炼](./HIGHLIGHTS.md)",
    "- [学习路径](./LEARNING_PATH.md)",
    "- [术语表](./GLOSSARY.md)",
    "- [校验报告](./VERIFY_REPORT.md)",
    "",
    "建议先从系统架构和学习路径开始，再深入各模块报告。",
  ].join("\n");
}

export function buildDocsIndex(
  wavePlans: Record<WaveName, TaskPlan[]>,
  indexMap: IndexMap,
  moduleFiles: Array<{ fileName: string; title: string }>,
): string {
  const directoryGroups = groupByTopDirectory(indexMap.entries);

  return [
    "# INDEX",
    "",
    "## 按主题",
    "",
    ...Object.entries(wavePlans).flatMap(([wave, tasks]) => [
      `### ${wave}`,
      ...tasks.map((task) => `- [${task.title}](./modules/${task.task_id}.md)`),
      "",
    ]),
    "## 按目录",
    "",
    ...Object.entries(directoryGroups).flatMap(([dir, entries]) => [
      `### ${dir}`,
      ...entries.slice(0, 8).map((entry) => `- \`${entry.path}\``),
      "",
    ]),
    "## 按学习路径",
    "",
    ...moduleFiles.map((file, index) => `- 第 ${index + 1} 步：[${file.title}](./modules/${file.fileName})`),
    "",
  ].join("\n");
}

export function buildLearningPath(wavePlans: Record<WaveName, TaskPlan[]>): string {
  return [
    "# LEARNING_PATH",
    "",
    "## 推荐顺序",
    "",
    "1. 阅读 `SYSTEM_ARCHITECTURE.md` 建立整体心智模型。",
    ...Object.entries(wavePlans).flatMap(([wave, tasks]) =>
      tasks.map((task, index) => `${index + 2}. ${wave}: [${task.title}](./modules/${task.task_id}.md)`),
    ),
    "",
    "## 阅读提示",
    "",
    "- WAVE_1 适合先理解配置、类型、模型和共享抽象。",
    "- WAVE_2 聚焦核心链路和内部协作。",
    "- WAVE_3 适合最后阅读入口、交互与对外集成。",
  ].join("\n");
}

export function buildGlossary(indexMap: IndexMap): string {
  const collected = new Map<string, string[]>();

  for (const entry of indexMap.entries) {
    for (const symbol of entry.symbols.slice(0, 8)) {
      const existing = collected.get(symbol.name) ?? [];
      existing.push(entry.path);
      collected.set(symbol.name, existing);
    }
  }

  const lines = [...collected.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([name, locations]) => `- \`${name}\`：${locations.slice(0, 3).join("，")}`);

  return [
    "# GLOSSARY",
    "",
    lines.length > 0 ? lines.join("\n") : "- 当前索引尚未提取到可用术语。",
    "",
  ].join("\n");
}

export function buildVerifyReport(report: {
  valid: boolean;
  linkErrors: string[];
  mermaidErrors: string[];
  placeholderErrors: string[];
}): string {
  return [
    "# VERIFY_REPORT",
    "",
    `- 总体状态：${report.valid ? "通过" : "失败"}`,
    `- 链接错误数：${report.linkErrors.length}`,
    `- Mermaid 错误数：${report.mermaidErrors.length}`,
    `- 占位符错误数：${report.placeholderErrors.length}`,
    "",
    "## 详情",
    "",
    ...formatReportSection("链接错误", report.linkErrors),
    ...formatReportSection("Mermaid 错误", report.mermaidErrors),
    ...formatReportSection("占位符错误", report.placeholderErrors),
  ].join("\n");
}

function formatReportSection(title: string, lines: string[]): string[] {
  if (lines.length === 0) {
    return [`### ${title}`, "", "- 无", ""];
  }

  return [`### ${title}`, "", ...lines.map((line) => `- ${line}`), ""];
}

function pickKeyModules(wavePlans: Record<WaveName, TaskPlan[]>): string[] {
  return Object.values(wavePlans)
    .flat()
    .slice(0, 5)
    .map((task) => task.title);
}

function extractKeywords(content: string): string[] {
  const keywords = ["parser", "runner", "workflow", "state", "config", "summary", "xml", "mermaid", "task"];
  return keywords.filter((keyword) => content.toLowerCase().includes(keyword)).slice(0, 6);
}

function groupByTopDirectory(entries: FileIndexEntry[]): Record<string, FileIndexEntry[]> {
  const grouped: Record<string, FileIndexEntry[]> = {};
  for (const entry of entries) {
    const [topLevel = "root"] = entry.path.split("/");
    grouped[topLevel] ??= [];
    grouped[topLevel].push(entry);
  }
  return grouped;
}

function buildWaveEdges(wavePlans: Record<WaveName, TaskPlan[]>): string[] {
  const wave1 = wavePlans.WAVE_1.map((task) => toNodeId(task.task_id));
  const wave2 = wavePlans.WAVE_2.map((task) => toNodeId(task.task_id));
  const wave3 = wavePlans.WAVE_3.map((task) => toNodeId(task.task_id));
  const lines = [
    ...wavePlans.WAVE_1.map((task) => `  ${toNodeId(task.task_id)}["${task.title}"]`),
    ...wavePlans.WAVE_2.map((task) => `  ${toNodeId(task.task_id)}["${task.title}"]`),
    ...wavePlans.WAVE_3.map((task) => `  ${toNodeId(task.task_id)}["${task.title}"]`),
  ];

  for (const source of wave1) {
    for (const target of wave2) {
      lines.push(`  ${source} --> ${target}`);
    }
  }

  for (const source of wave2) {
    for (const target of wave3) {
      lines.push(`  ${source} --> ${target}`);
    }
  }

  return lines;
}

function toNodeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_]/g, "_");
}

