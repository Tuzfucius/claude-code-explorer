import type { DocumentLanguage, FileIndexEntry, IndexMap, TaskExecutionResult, TaskPlan, TeachingUnitKind, WaveName } from "../core/types.js";
import { isChineseDocument } from "../core/document-language.js";

interface SummaryDigest {
  fileName: string;
  title: string;
  sectionContent: Record<string, string>;
  fullContent: string;
}

const HIGHLIGHT_UNIT_PRIORITY = [
  "主分析链路",
  "执行调度与基础设施",
  "教学文档装配与交付",
  "核心数据结构与共享抽象",
  "项目入口与配置",
];

export function buildHighlightsMarkdown(
  wavePlans: Record<WaveName, TaskPlan[]>,
  results: TaskExecutionResult[],
  summaries: Array<{ fileName: string; content: string }>,
  docLanguage: DocumentLanguage,
): string {
  const zh = isChineseDocument(docLanguage);
  const digests = summaries.map((summary) => parseSummary(summary.fileName, summary.content));
  const completed = results.filter((item) => item.status === "completed");
  const innovationCandidates = extractInnovationCandidates(digests, wavePlans);
  const selected = innovationCandidates.slice(0, 3);

  return [
    zh ? "# HIGHLIGHTS" : "# HIGHLIGHTS",
    "",
    zh ? "## 为什么这个项目值得学习" : "## Why This Project Is Worth Studying",
    "",
    zh
      ? `- 当前分析完成了 ${completed.length} 个教学单元，这些单元覆盖“入口配置 -> 主分析链路 -> 执行基础设施 -> 文档交付”的完整闭环。`
      : `- The analysis completed ${completed.length} teaching units covering entry configuration, the main analysis flow, execution infrastructure, and document delivery.`,
    zh
      ? `- 这个项目不是单纯的代码解析器，而是把“分析”和“教学交付”合并成一个系统。`
      : `- This project is not just a code parser; it combines analysis with teaching-oriented delivery.`,
    "",
    zh ? "## 核心亮点与创新点" : "## Core Highlights And Innovations",
    "",
    ...selected.flatMap((item, index) => formatHighlight(index + 1, item, zh)),
    zh ? "## 读者最应该先学什么" : "## What Readers Should Study First",
    "",
    ...buildPriorityList(wavePlans, zh),
    "",
    zh ? "## 不要错过的设计取舍" : "## Design Trade-offs Worth Noticing",
    "",
    ...(selected.length > 0
      ? selected.map((item) =>
          zh
            ? `- ${item.label}：这不是“为了复杂而复杂”，而是在可恢复性、可扩展性和教学可读性之间做取舍。`
            : `- ${item.label}: this is a deliberate trade-off between recoverability, extensibility, and learnability.`,
        )
      : [zh ? "- 当前还没有足够强的亮点证据，建议补充更高质量的阶段 2 摘要。" : "- Not enough highlight evidence yet; improve phase-2 summaries first."]),
    "",
  ].join("\n");
}

export function buildArchitectureMarkdown(
  indexMap: IndexMap,
  wavePlans: Record<WaveName, TaskPlan[]>,
  summaries: Array<{ fileName: string; content: string }>,
  docLanguage: DocumentLanguage,
): string {
  const zh = isChineseDocument(docLanguage);
  const digests = summaries.map((summary) => parseSummary(summary.fileName, summary.content));
  const coreTasks = getCoreTasksInOrder(wavePlans);
  const componentLines = [
    "flowchart LR",
    '  Entry["入口与配置"]',
    '  Data["核心数据结构"]',
    '  Analyze["主分析链路"]',
    '  Execute["执行调度与 Runner"]',
    '  Publish["文档装配与校验"]',
    "  Entry --> Data",
    "  Data --> Analyze",
    "  Analyze --> Execute",
    "  Execute --> Publish",
  ];
  const sequenceLines = [
    "sequenceDiagram",
    "  participant User as Reader",
    "  participant CLI as Entry",
    "  participant Planner as Analysis",
    "  participant Runner as Execution",
    "  participant Publisher as Publish",
    "  User->>CLI: 触发仓库分析",
    "  CLI->>Planner: 建立索引并生成教学任务",
    "  Planner->>Runner: 按波次执行模块分析",
    "  Runner->>Publisher: 汇总模块讲解与亮点",
    "  Publisher-->>User: 输出学习文档库",
  ];

  return [
    "# SYSTEM_ARCHITECTURE",
    "",
    zh ? "## 这个系统整体在做什么" : "## What This System Does Overall",
    "",
    zh
      ? "这套系统把一个陌生仓库转成可学习的教学文档库。核心不是“列出文件”，而是回答：项目解决什么问题、内部如何协作、从哪里开始学最有效。"
      : "This system turns an unfamiliar repository into a teachable documentation library. The core goal is not listing files, but explaining what the project solves, how it collaborates internally, and where to start learning.",
    "",
    zh ? "## 系统分层" : "## System Layers",
    "",
    ...coreTasks.map((task) =>
      zh
        ? `- ${task.teaching_unit}：${task.goal}`
        : `- ${task.teaching_unit}: ${task.goal}`,
    ),
    "",
    zh ? "## 组件视图" : "## Component View",
    "",
    "```mermaid",
    ...componentLines,
    "```",
    "",
    zh ? "## 主执行链路" : "## Main Execution Flow",
    "",
    "```mermaid",
    ...sequenceLines,
    "```",
    "",
    zh ? "## 从教学角度应该怎么读" : "## How To Read It As A Learner",
    "",
    ...buildArchitectureReadingHints(indexMap, digests, zh),
    "",
  ].join("\n");
}

export function buildDocsReadme(docLanguage: DocumentLanguage): string {
  const zh = isChineseDocument(docLanguage);
  return [
    zh ? "# 项目分析与学习文档" : "# Project Analysis And Learning Docs",
    "",
    zh
      ? "这套文档的目标不是保存分析日志，而是帮助第一次接触该项目的人快速建立正确的心智模型。"
      : "These documents are not analysis logs; they are meant to help a first-time reader build the right mental model quickly.",
    "",
    `- [${zh ? "先从这里开始" : "Start Here"}](./START_HERE.md)`,
    `- [${zh ? "系统架构" : "System Architecture"}](./SYSTEM_ARCHITECTURE.md)`,
    `- [${zh ? "核心概念" : "Core Concepts"}](./CORE_CONCEPTS.md)`,
    `- [${zh ? "初学者路径" : "Beginner Path"}](./LEARNING_PATH_BEGINNER.md)`,
    `- [${zh ? "深入路径" : "Advanced Path"}](./LEARNING_PATH_ADVANCED.md)`,
    `- [${zh ? "亮点提炼" : "Highlights"}](./HIGHLIGHTS.md)`,
    `- [${zh ? "总索引" : "Index"}](./INDEX.md)`,
    `- [${zh ? "术语表" : "Glossary"}](./GLOSSARY.md)`,
    `- [${zh ? "校验报告" : "Verify Report"}](./VERIFY_REPORT.md)`,
    "",
  ].join("\n");
}

export function buildStartHereMarkdown(
  wavePlans: Record<WaveName, TaskPlan[]>,
  docLanguage: DocumentLanguage,
): string {
  const zh = isChineseDocument(docLanguage);
  const coreTasks = getDistinctCoreTasksByUnit(wavePlans).slice(0, 4);
  return [
    zh ? "# START_HERE" : "# START_HERE",
    "",
    zh ? "## 30 分钟快速建立全局认识" : "## Build A Global Picture In 30 Minutes",
    "",
    ...(zh
      ? [
          "1. 先读 `SYSTEM_ARCHITECTURE.md`，确认这个项目整体在做什么。",
          "2. 再读 `CORE_CONCEPTS.md`，记住核心概念和术语。",
          "3. 只挑 2 到 4 个核心模块文档阅读，不要一上来遍历全部文件。",
        ]
      : [
          "1. Read `SYSTEM_ARCHITECTURE.md` first to understand what the project does overall.",
          "2. Read `CORE_CONCEPTS.md` next to learn the core concepts and vocabulary.",
          "3. Only read 2 to 4 core module docs at first; do not traverse every file immediately.",
        ]),
    "",
    zh ? "## 建议优先看的单元" : "## Teaching Units To Read First",
    "",
    ...coreTasks.map((task, index) =>
      zh
        ? `${index + 1}. [${task.title}](./modules/${task.task_id}.md)：${task.why_this_matters}`
        : `${index + 1}. [${task.title}](./modules/${task.task_id}.md): ${task.why_this_matters}`,
    ),
    "",
  ].join("\n");
}

export function buildDocsIndex(
  wavePlans: Record<WaveName, TaskPlan[]>,
  indexMap: IndexMap,
  moduleFiles: Array<{ fileName: string; title: string; kind: TeachingUnitKind; unit: string }>,
  docLanguage: DocumentLanguage,
): string {
  const zh = isChineseDocument(docLanguage);
  const coreModules = moduleFiles.filter((item) => item.kind === "core");
  const supportingModules = moduleFiles.filter((item) => item.kind === "supporting");
  const topDirectories = groupByTopDirectory(indexMap.entries);

  return [
    "# INDEX",
    "",
    zh ? "## 按学习目标看" : "## Browse By Learning Goal",
    "",
    ...getDistinctCoreTasksByUnit(wavePlans).map((task) =>
      zh
        ? `- [${task.title}](./modules/${task.task_id}.md)：${task.goal}`
        : `- [${task.title}](./modules/${task.task_id}.md): ${task.goal}`,
    ),
    "",
    zh ? "## 按关键链路看" : "## Browse By Critical Flow",
    "",
    ...buildFlowIndex(wavePlans, zh),
    "",
    zh ? "## 按系统层次看" : "## Browse By System Layer",
    "",
    ...buildLayerIndex(coreModules, zh),
    "",
    zh ? "## 按源码位置看" : "## Browse By Source Location",
    "",
    ...Object.entries(topDirectories).flatMap(([dir, entries]) => [
      `### ${dir}`,
      ...(zh
        ? entries.slice(0, 5).map((entry) => `- \`${entry.path}\`：${buildEntryHint(entry)}`)
        : entries.slice(0, 5).map((entry) => `- \`${entry.path}\`: ${buildEntryHint(entry)}`)),
      "",
    ]),
    zh ? "## 补充材料" : "## Supporting Material",
    "",
    ...(supportingModules.length > 0
      ? supportingModules.map((task) => `- [${task.title}](./modules/${task.fileName})`)
      : [zh ? "- 无" : "- None"]),
    "",
  ].join("\n");
}

export function buildCoreConceptsMarkdown(indexMap: IndexMap, docLanguage: DocumentLanguage): string {
  const zh = isChineseDocument(docLanguage);
  const concepts = collectConcepts(indexMap);
  return [
    zh ? "# CORE_CONCEPTS" : "# CORE_CONCEPTS",
    "",
    zh
      ? "这些概念是阅读主链路时最容易反复遇到的术语。先记住它们，再读模块文档会更轻松。"
      : "These are the concepts you will repeatedly see in the main storyline. Learn them first to make module docs easier to follow.",
    "",
    ...concepts.map((concept) =>
      zh
        ? `- \`${concept.name}\`：常见于 ${concept.locations.join("、")}`
        : `- \`${concept.name}\`: often appears in ${concept.locations.join(", ")}`,
    ),
    "",
  ].join("\n");
}

export function buildLearningPath(wavePlans: Record<WaveName, TaskPlan[]>, docLanguage: DocumentLanguage, audience: "beginner" | "advanced"): string {
  const zh = isChineseDocument(docLanguage);
  const tasks = audience === "beginner" ? getCoreTasksInOrder(wavePlans) : getAllTasksInOrder(wavePlans);
  const title = audience === "beginner" ? (zh ? "# LEARNING_PATH_BEGINNER" : "# LEARNING_PATH_BEGINNER") : zh ? "# LEARNING_PATH_ADVANCED" : "# LEARNING_PATH_ADVANCED";

  return [
    title,
    "",
    ...(audience === "beginner"
      ? [zh ? "适合第一次接触该项目的读者。" : "Best for a first-time reader."]
      : [zh ? "适合已经理解主链路、准备深入实现细节的读者。" : "Best for readers who already understand the main flow and want implementation depth."]),
    "",
    ...tasks.map((task, index) =>
      zh
        ? `${index + 1}. [${task.title}](./modules/${task.task_id}.md)：${task.why_this_order}`
        : `${index + 1}. [${task.title}](./modules/${task.task_id}.md): ${task.why_this_order}`,
    ),
    "",
  ].join("\n");
}

export function buildGlossary(indexMap: IndexMap, docLanguage: DocumentLanguage): string {
  const zh = isChineseDocument(docLanguage);
  const concepts = collectConcepts(indexMap);
  return [
    zh ? "# GLOSSARY" : "# GLOSSARY",
    "",
    ...(concepts.length > 0
      ? concepts.map((concept) =>
          zh
            ? `- \`${concept.name}\`：出现于 ${concept.locations.join("、")}`
            : `- \`${concept.name}\`: appears in ${concept.locations.join(", ")}`,
        )
      : [zh ? "- 当前索引尚未提取到可用术语。" : "- No useful concepts extracted from the index yet."]),
    "",
  ].join("\n");
}

export function buildVerifyReport(
  report: {
    valid: boolean;
    linkErrors: string[];
    mermaidErrors: string[];
    placeholderErrors: string[];
    qualityErrors: string[];
  },
  docLanguage: DocumentLanguage,
): string {
  const zh = isChineseDocument(docLanguage);
  return [
    zh ? "# VERIFY_REPORT" : "# VERIFY_REPORT",
    "",
    `- ${zh ? "总体状态" : "Overall status"}：${report.valid ? (zh ? "通过" : "passed") : zh ? "失败" : "failed"}`,
    `- ${zh ? "链接错误数" : "Link errors"}：${report.linkErrors.length}`,
    `- ${zh ? "Mermaid 错误数" : "Mermaid errors"}：${report.mermaidErrors.length}`,
    `- ${zh ? "占位符错误数" : "Placeholder errors"}：${report.placeholderErrors.length}`,
    `- ${zh ? "教学质量错误数" : "Teaching quality errors"}：${report.qualityErrors.length}`,
    "",
    zh ? "## 详情" : "## Details",
    "",
    ...formatReportSection(zh ? "链接错误" : "Link Errors", report.linkErrors),
    ...formatReportSection(zh ? "Mermaid 错误" : "Mermaid Errors", report.mermaidErrors),
    ...formatReportSection(zh ? "占位符错误" : "Placeholder Errors", report.placeholderErrors),
    ...formatReportSection(zh ? "教学质量错误" : "Teaching Quality Errors", report.qualityErrors),
  ].join("\n");
}

function formatReportSection(title: string, lines: string[]): string[] {
  if (lines.length === 0) {
    return [`### ${title}`, "", "- 无", ""];
  }

  return [`### ${title}`, "", ...lines.map((line) => `- ${line}`), ""];
}

export function parseSummary(fileName: string, content: string): SummaryDigest {
  const sections: Record<string, string> = {};
  const matches = [...content.matchAll(/^# (.+)\r?\n([\s\S]*?)(?=^# |\Z)/gm)];
  for (const match of matches) {
    sections[match[1].trim()] = match[2].trim();
  }

  const title =
    content
      .split(/\r?\n/)
      .find((line) => line.startsWith("> 学习单元：") || line.startsWith("> Teaching Unit:"))
      ?.replace("> 学习单元：", "")
      .replace("> Teaching Unit:", "")
      .trim() ?? fileName;

  return {
    fileName,
    title,
    sectionContent: sections,
    fullContent: content,
  };
}

function extractInnovationCandidates(digests: SummaryDigest[], wavePlans: Record<WaveName, TaskPlan[]>) {
  const taskMap = new Map(getAllTasksInOrder(wavePlans).map((task) => [task.task_id, task]));
  const candidates = digests.map((digest) => {
    const taskId = digest.fileName.replace("_SUMMARY.md", "");
    const task = taskMap.get(taskId);
    const worthNoticing = digest.sectionContent["值得注意的亮点"] || digest.sectionContent["Worth Noticing"] || "";
    const designChoice = digest.sectionContent["设计取舍与原因"] || digest.sectionContent["Design Choices And Why"] || "";
    const coreObjects = digest.sectionContent["核心对象与职责"] || digest.sectionContent["Core Objects And Responsibilities"] || "";
    return {
      task,
      label: task?.title ?? digest.title,
      evidence: extractBestEvidence(worthNoticing, coreObjects, designChoice, digest.fullContent),
      value:
        designChoice ||
        task?.why_this_matters ||
        "该模块在当前仓库中承担关键教学职责。",
      sourcePaths: task?.scope_files.slice(0, 3) ?? [],
    };
  });

  const seenUnits = new Set<string>();
  const sorted = candidates.sort((left, right) => compareHighlightCandidates(left.task, right.task));
  return sorted.filter((candidate) => {
    const unit = candidate.task?.teaching_unit ?? candidate.label;
    if (seenUnits.has(unit)) {
      return false;
    }
    seenUnits.add(unit);
    return candidate.task?.teaching_unit_kind !== "supporting";
  });
}

function formatHighlight(
  index: number,
  item: { label: string; evidence: string; value: string; sourcePaths?: string[] },
  zh: boolean,
): string[] {
  const evidencePaths = [...new Set([...(item.sourcePaths ?? []), ...extractEvidencePaths(item.evidence)])].slice(0, 3);
  return [
    `### ${zh ? `亮点 ${index}` : `Highlight ${index}`}: ${item.label}`,
    "",
    zh ? `- 亮点定义：${item.label}` : `- Highlight: ${item.label}`,
    zh ? `- 证据：${trimParagraph(item.evidence)}` : `- Evidence: ${trimParagraph(item.evidence)}`,
    zh ? `- 价值：${trimParagraph(item.value)}` : `- Value: ${trimParagraph(item.value)}`,
    zh
      ? `- 源码落点：${evidencePaths.length > 0 ? evidencePaths.join("、") : "请结合对应模块文档中的证据文件回看"}`
      : `- Source anchors: ${evidencePaths.length > 0 ? evidencePaths.join(", ") : "Review the evidence files in the related module doc."}`,
    zh ? `- 学习建议：优先结合对应模块文档和系统架构图一起阅读。` : `- Study tip: read it together with the related module doc and architecture diagram.`,
    "",
  ];
}

function buildPriorityList(wavePlans: Record<WaveName, TaskPlan[]>, zh: boolean): string[] {
  return getDistinctCoreTasksByUnit(wavePlans)
    .slice(0, 5)
    .map((task) =>
      zh
        ? `- [${task.title}](./modules/${task.task_id}.md)：${task.why_this_matters}`
        : `- [${task.title}](./modules/${task.task_id}.md): ${task.why_this_matters}`,
    );
}

function buildArchitectureReadingHints(indexMap: IndexMap, digests: SummaryDigest[], zh: boolean): string[] {
  const topDirs = Object.keys(groupByTopDirectory(indexMap.entries)).slice(0, 5);
  const hints = [
    zh ? `- 先抓住这些高密度目录：${topDirs.join("、")}` : `- Start with these high-density directories: ${topDirs.join(", ")}`,
    zh
      ? `- 模块摘要数量为 ${digests.length}，阅读时优先按学习单元跳转，而不是按文件夹遍历。`
      : `- There are ${digests.length} module summaries; prefer teaching-unit order over directory traversal.`,
  ];
  return hints;
}

function buildFlowIndex(wavePlans: Record<WaveName, TaskPlan[]>, zh: boolean): string[] {
  return getDistinctCoreTasksByUnit(wavePlans).map((task, index) =>
    zh
      ? `${index + 1}. [${task.title}](./modules/${task.task_id}.md)`
      : `${index + 1}. [${task.title}](./modules/${task.task_id}.md)`,
  );
}

function buildLayerIndex(moduleFiles: Array<{ fileName: string; title: string; kind: TeachingUnitKind; unit: string }>, zh: boolean): string[] {
  const grouped = new Map<string, Array<{ fileName: string; title: string }>>();
  for (const file of moduleFiles) {
    const bucket = grouped.get(file.unit) ?? [];
    bucket.push({ fileName: file.fileName, title: file.title });
    grouped.set(file.unit, bucket);
  }

  return [...grouped.entries()].flatMap(([unit, files]) => [
    `### ${unit}`,
    ...files.map((file) => `- [${file.title}](./modules/${file.fileName})`),
    "",
  ]);
}

function collectConcepts(indexMap: IndexMap): Array<{ name: string; locations: string[] }> {
  const collected = new Map<string, string[]>();
  for (const entry of indexMap.entries) {
    for (const symbol of entry.symbols.slice(0, 8)) {
      const existing = collected.get(symbol.name) ?? [];
      existing.push(entry.path);
      collected.set(symbol.name, [...new Set(existing)].slice(0, 3));
    }
  }

  return [...collected.entries()]
    .map(([name, locations]) => ({ name, locations }))
    .sort((left, right) => left.name.localeCompare(right.name))
    .slice(0, 30);
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

function getCoreTasksInOrder(wavePlans: Record<WaveName, TaskPlan[]>): TaskPlan[] {
  return getAllTasksInOrder(wavePlans).filter((task) => task.teaching_unit_kind === "core");
}

function getDistinctCoreTasksByUnit(wavePlans: Record<WaveName, TaskPlan[]>): TaskPlan[] {
  const grouped = new Map<string, TaskPlan[]>();
  for (const task of getCoreTasksInOrder(wavePlans)) {
    const bucket = grouped.get(task.teaching_unit) ?? [];
    bucket.push(task);
    grouped.set(task.teaching_unit, bucket);
  }

  return [...grouped.values()]
    .map((tasks) =>
      [...tasks].sort((left, right) => representativeScore(right) - representativeScore(left) || left.learning_order - right.learning_order)[0],
    )
    .sort((left, right) => left.learning_order - right.learning_order);
}

function getAllTasksInOrder(wavePlans: Record<WaveName, TaskPlan[]>): TaskPlan[] {
  return Object.values(wavePlans)
    .flat()
    .sort((left, right) => left.learning_order - right.learning_order || left.task_id.localeCompare(right.task_id));
}

function trimParagraph(content: string): string {
  return content.replace(/\s+/g, " ").slice(0, 240);
}

function compareHighlightCandidates(left?: TaskPlan, right?: TaskPlan): number {
  const leftPriority = highlightUnitPriority(left?.teaching_unit);
  const rightPriority = highlightUnitPriority(right?.teaching_unit);
  return leftPriority - rightPriority || representativeScore(right) - representativeScore(left) || (left?.learning_order ?? 999) - (right?.learning_order ?? 999);
}

function highlightUnitPriority(unit?: string): number {
  const index = HIGHLIGHT_UNIT_PRIORITY.indexOf(unit ?? "");
  return index === -1 ? 999 : index;
}

function extractBestEvidence(...parts: string[]): string {
  for (const part of parts) {
    const line = part
      .split(/\r?\n/)
      .map((item) => item.trim())
      .find((item) => item.startsWith("- ") || item.includes("证据：") || item.includes("Evidence:"));
    if (line) {
      return line.replace(/^- /, "");
    }
  }

  return parts.find((part) => part.trim().length > 0)?.slice(0, 240) ?? "";
}

function extractEvidencePaths(content: string): string[] {
  return [
    ...new Set(
      [...content.matchAll(/`([^`]+)`/g)]
        .map((match) => match[1])
        .filter((value) => value.includes("/") || /\.[A-Za-z0-9]+$/.test(value)),
    ),
  ].slice(0, 3);
}

function buildEntryHint(entry: FileIndexEntry): string {
  if (entry.symbols.length > 0) {
    return `代表符号：${entry.symbols
      .slice(0, 3)
      .map((symbol) => symbol.name)
      .join("、")}`;
  }

  if (entry.exports.length > 0) {
    return `导出：${entry.exports.slice(0, 3).join("、")}`;
  }

  if (entry.imports.length > 0) {
    return `依赖：${entry.imports.slice(0, 3).join("、")}`;
  }

  return "建议结合对应模块文档理解职责";
}

function representativeScore(task?: TaskPlan): number {
  if (!task) {
    return 0;
  }

  const joined = [task.title, ...task.scope_files].join(" ").toLowerCase();

  if (joined.includes("src/stages")) {
    return 100;
  }

  if (joined.includes("src/reporting")) {
    return 95;
  }

  if (joined.includes("src/runners")) {
    return 92;
  }

  if (joined.includes("src/core")) {
    return 90;
  }

  if (joined.includes("src/cli")) {
    return 85;
  }

  if (joined.includes("src/parsers")) {
    return 82;
  }

  if (joined.includes("src/prompts")) {
    return 78;
  }

  if (joined.includes("src/")) {
    return 72;
  }

  if (joined.includes("bin/")) {
    return 40;
  }

  return 10;
}
