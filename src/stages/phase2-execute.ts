import path from "node:path";

import pLimit from "p-limit";

import { ARTIFACT_FILES, PHASE_STATUS_FILES } from "../core/constants.js";
import { isChineseDocument } from "../core/document-language.js";
import { loadRepoConfig, readWorkspaceFile, writeWorkspaceFile } from "../core/fs-utils.js";
import { resolveArtifactPath, resolveOutputRoot } from "../core/paths.js";
import { serializePhaseState } from "../core/serialization.js";
import type { CodeExplorerConfig, PhaseState, TaskContext, TaskExecutionResult, TaskPlan, TaskSummaryResult, WaveName } from "../core/types.js";
import { buildTaskPrompts } from "../prompts/task-prompts.js";
import { resolveRunner } from "../runners/index.js";

const WAVE_SEQUENCE: WaveName[] = ["WAVE_1", "WAVE_2", "WAVE_3"];
const MAX_SYMBOLS_PER_FILE = 4;
const MAX_FLOW_HINTS = 5;

interface FileInsight {
  path: string;
  role: string;
  keyElements: string[];
  flowHints: string[];
  designHints: string[];
  evidenceSnippet: string;
}

export async function runPhase2(
  repoPath: string,
  wavePlans: Record<WaveName, TaskPlan[]>,
  configOverrides?: Partial<CodeExplorerConfig>,
): Promise<TaskExecutionResult[]> {
  const config = await loadRepoConfig(repoPath, configOverrides);
  const outputRoot = resolveOutputRoot(repoPath, config.outputDir);
  const runner = await resolveRunner(config.runnerMode);

  if (!runner && config.runnerMode !== "auto") {
    throw new Error(`执行器模式 ${config.runnerMode} 不可用。`);
  }

  const results: TaskExecutionResult[] = [];
  const runningState: PhaseState = {
    phase: "phase_2_execute",
    status: "running",
    inputRefs: [
      resolveArtifactPath(repoPath, "wave1", config.outputDir),
      resolveArtifactPath(repoPath, "wave2", config.outputDir),
      resolveArtifactPath(repoPath, "wave3", config.outputDir),
    ],
    outputRefs: [path.join(outputRoot, ARTIFACT_FILES.analysisDir)],
    startedAt: new Date().toISOString(),
    errors: [],
    runner: runner?.mode ?? "none",
  };

  await writeWorkspaceFile(path.join(outputRoot, PHASE_STATUS_FILES.phase2), `${serializePhaseState(runningState)}\n`);

  try {
    const effectiveConcurrency = runner?.mode === "teams" ? 1 : config.concurrency;
    const limit = pLimit(effectiveConcurrency);
    for (const wave of WAVE_SEQUENCE) {
      const tasks = wavePlans[wave];
      const waveResults = await Promise.all(
        tasks.map((task) => limit(() => executeTask(repoPath, outputRoot, config.outputDir, config.docLanguage, task, runner?.mode))),
      );
      results.push(...waveResults);
      const failures = waveResults.filter((item) => item.status === "failed");
      if (failures.length > 0) {
        throw new Error(`${wave} 存在失败任务: ${failures.map((item) => item.taskId).join(", ")}`);
      }
    }

    await writeWorkspaceFile(
      path.join(outputRoot, PHASE_STATUS_FILES.phase2),
      `${serializePhaseState({
        ...runningState,
        status: "completed",
        finishedAt: new Date().toISOString(),
      })}\n`,
    );

    return results;
  } catch (error) {
    await writeWorkspaceFile(
      path.join(outputRoot, PHASE_STATUS_FILES.phase2),
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

async function executeTask(
  repoPath: string,
  outputRoot: string,
  outputDirname: string,
  docLanguage: CodeExplorerConfig["docLanguage"],
  task: TaskPlan,
  preferredRunner: "teams" | "sdk" | undefined,
): Promise<TaskExecutionResult> {
  const outputPath = path.join(repoPath, task.output_path);
  const logPath = path.join(repoPath, outputDirname, "planning", "analysis", "TASK_RUN_LOG.md");
  let attempts = 0;
  let lastError: string | undefined;
  let actualRunner: "teams" | "sdk" | "heuristic" = preferredRunner ?? "heuristic";
  let lastNote: string | undefined;

  while (attempts < 2) {
    attempts += 1;

    try {
      const context = await buildTaskContext(repoPath, docLanguage, outputDirname, task);
      const summary = await generateTaskSummary(context, preferredRunner);
      actualRunner = summary.runner;
      lastNote = summary.note;
      await writeWorkspaceFile(outputPath, summary.content);
      await appendTaskLog(logPath, task, attempts, preferredRunner, actualRunner, lastNote);
      return {
        taskId: task.task_id,
        status: "completed",
        outputPath: path.relative(outputRoot, outputPath).replace(/\\/g, "/"),
        attempts,
        runner: actualRunner,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  const failedContent = renderFailedSummary(task, lastError ?? "未知错误");
  await writeWorkspaceFile(outputPath, failedContent);
  await appendTaskLog(logPath, task, attempts, preferredRunner, "heuristic", lastError);

  return {
    taskId: task.task_id,
    status: "failed",
    outputPath: path.relative(outputRoot, outputPath).replace(/\\/g, "/"),
    attempts,
    runner: "heuristic",
    error: lastError,
  };
}

async function buildTaskContext(
  repoPath: string,
  docLanguage: CodeExplorerConfig["docLanguage"],
  outputDirname: string,
  task: TaskPlan,
): Promise<TaskContext> {
  const fileContents = await Promise.all(
    task.scope_files.map(async (relativePath) => ({
      path: relativePath,
      content: trimForPrompt(await readWorkspaceFile(repoPath, relativePath)),
    })),
  );

  const dependencySummaries = await readDependencySummaries(repoPath, outputDirname, task.wave);

  return {
    repoPath,
    task,
    docLanguage,
    fileContents,
    dependencySummaries,
  };
}

async function generateTaskSummary(
  context: TaskContext,
  preferredRunner: "teams" | "sdk" | undefined,
): Promise<TaskSummaryResult> {
  if (preferredRunner) {
    const runner = await resolveRunner(preferredRunner);
    if (runner) {
      const prompts = buildTaskPrompts(context.task, context.docLanguage);
      try {
        const result = await runner.run(prompts, context);
        if (result.trim()) {
          return {
            content: result.endsWith("\n") ? result : `${result}\n`,
            runner: preferredRunner,
          };
        }
      } catch {
        return {
          content: renderHeuristicSummary(context),
          runner: "heuristic",
          note: `Runner ${preferredRunner} 失败，已回退到启发式摘要。`,
        };
      }
    }
  }

  return {
    content: renderHeuristicSummary(context),
    runner: "heuristic",
    note: preferredRunner ? `Runner ${preferredRunner} 不可用，已回退到启发式摘要。` : "未配置外部 Runner，使用启发式摘要。",
  };
}

async function readDependencySummaries(
  repoPath: string,
  outputDirname: string,
  wave: WaveName,
): Promise<Array<{ path: string; content: string }>> {
  if (wave === "WAVE_1") {
    return [];
  }

  const targetWaves = wave === "WAVE_2" ? ["wave_1_"] : ["wave_1_", "wave_2_"];
  const analysisDir = resolveArtifactPath(repoPath, "analysisDir", outputDirname);
  const fs = await import("node:fs/promises");
  const entries = await fs.readdir(analysisDir, { withFileTypes: true }).catch(() => []);
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith("_SUMMARY.md"));

  const matched = files.filter((entry) => targetWaves.some((prefix) => entry.name.startsWith(prefix)));
  return Promise.all(
    matched.map(async (entry) => {
      const absolutePath = path.join(analysisDir, entry.name);
      return {
        path: entry.name,
        content: await fs.readFile(absolutePath, "utf8"),
      };
    }),
  );
}

function renderHeuristicSummary(context: TaskContext): string {
  const zh = isChineseDocument(context.docLanguage);
  const insights = context.fileContents.map((file) => buildFileInsight(file.path, file.content, zh));
  const evidenceLines = insights.map((insight) => {
    const elements = insight.keyElements.length > 0 ? insight.keyElements.join("、") : zh ? "暂无可提取符号" : "no extracted symbols";
    return zh
      ? `- \`${insight.path}\`：${insight.role}；关键元素：${elements}；证据：${insight.evidenceSnippet}`
      : `- \`${insight.path}\`: ${insight.role}; key elements: ${elements}; evidence: ${insight.evidenceSnippet}`;
  });

  const dependencyLines =
    context.dependencySummaries.length === 0
      ? [zh ? "- 暂无前置摘要。" : "- No prerequisite summaries."]
      : context.dependencySummaries.map(({ path }) => (zh ? `- 可参考前置摘要：${path}` : `- Review prerequisite summary: ${path}`));

  const flowLines = buildFlowLines(context, insights, zh);
  const designLines = buildDesignLines(context, insights, zh);
  const highlightLines = buildHighlightLines(context, insights, zh);
  const nextReadLines = buildNextReadLines(context, insights, zh);
  const nextRead = context.task.recommended_prerequisites.length > 0 ? context.task.recommended_prerequisites.join("、") : context.task.scope_files[0];

  return [
    zh ? `> 学习单元：${context.task.title}` : `> Teaching Unit: ${context.task.title}`,
    zh ? `> 单元：${context.task.teaching_unit}` : `> Unit: ${context.task.teaching_unit}`,
    zh ? `> 类型：${context.task.teaching_unit_kind}` : `> Kind: ${context.task.teaching_unit_kind}`,
    "",
    zh ? `# 这个模块解决的问题` : `# Problem This Module Solves`,
    ``,
    zh
      ? `${context.task.title} 属于“${context.task.teaching_unit}”教学单元，目标是 ${context.task.goal}`
      : `${context.task.title} belongs to the "${context.task.teaching_unit}" teaching unit. Goal: ${context.task.goal}`,
    zh
      ? `它之所以重要，是因为 ${context.task.why_this_matters}`
      : `It matters because ${context.task.why_this_matters}`,
    ``,
    zh ? `# 阅读前你需要知道什么` : `# What You Need Before Reading`,
    ``,
    zh
      ? `- 推荐前置知识：${context.task.recommended_prerequisites.length > 0 ? context.task.recommended_prerequisites.join("、") : "无硬性前置知识"}`
      : `- Recommended prerequisites: ${context.task.recommended_prerequisites.length > 0 ? context.task.recommended_prerequisites.join(", ") : "No strict prerequisites"}`,
    zh ? `- 为什么现在阅读：${context.task.why_this_order}` : `- Why now: ${context.task.why_this_order}`,
    ``,
    zh ? `# 核心对象与职责` : `# Core Objects And Responsibilities`,
    ``,
    ...evidenceLines,
    zh ? `- 阅读时先抓职责分工，再对照源码确认细节，不要反过来从文件名硬记实现。` : `- Start from responsibilities, then confirm details in code instead of memorizing filenames.`,
    ``,
    zh ? `# 一条关键执行路径` : `# One Critical Execution Path`,
    ``,
    ...flowLines,
    ...dependencyLines,
    zh
      ? `- 如果要进一步验证流程，请优先回到这些文件查看实际实现：${context.task.scope_files.slice(0, 3).join("、")}`
      : `- To validate the flow, inspect these files first: ${context.task.scope_files.slice(0, 3).join(", ")}`,
    ``,
    zh ? `# 设计取舍与原因` : `# Design Choices And Why`,
    ``,
    ...designLines,
    ``,
    zh ? `# 容易误解的点` : `# Common Misunderstandings`,
    ``,
    zh ? `- 不要把这一单元误解成若干独立文件；真正需要抓住的是它回答了哪些关键问题。` : `- Do not treat this unit as isolated files; focus on the questions it answers.`,
    zh ? `- 当前结果更适合作为带读提纲，关键判断仍应回到源码证据上确认。` : `- Treat this as a guided reading outline; confirm important judgments against source evidence.`,
    ``,
    zh ? `# 值得注意的亮点` : `# Worth Noticing`,
    ``,
    ...highlightLines,
    ``,
    zh ? `# 建议继续阅读` : `# What To Read Next`,
    ``,
    zh ? `- 下一步建议阅读：${nextRead}` : `- Read next: ${nextRead}`,
    ...nextReadLines,
  ].join("\n");
}

function renderFailedSummary(task: TaskPlan, errorMessage: string): string {
  return [
    "# 执行失败",
    "",
    `- 任务：${task.title}`,
    `- task_id：${task.task_id}`,
    `- 错误：${errorMessage}`,
    "",
    "请检查 Runner 配置、网络访问和 API 凭据后重新执行。",
  ].join("\n");
}

function trimForPrompt(content: string): string {
  const maxLength = 12000;
  if (content.length <= maxLength) {
    return content;
  }

  return `${content.slice(0, maxLength)}\n\n/* truncated */`;
}

async function appendTaskLog(
  logPath: string,
  task: TaskPlan,
  attempts: number,
  requestedRunner: "teams" | "sdk" | undefined,
  actualRunner: "teams" | "sdk" | "heuristic",
  note?: string,
): Promise<void> {
  const existing = (await import("node:fs/promises")).readFile(logPath, "utf8").catch(() => "");
  const prefix = (await existing).trim();
  const content = [
    prefix,
    `- ${new Date().toISOString()} task=${task.task_id} requested=${requestedRunner ?? "none"} actual=${actualRunner} attempts=${attempts}${
      note ? ` note=${note}` : ""
    }`,
  ]
    .filter(Boolean)
    .join("\n");
  await writeWorkspaceFile(logPath, `${content}\n`);
}

function buildFileInsight(filePath: string, content: string, zh: boolean): FileInsight {
  const commands = extractMatches(content, /\.command\("([^"]+)"\)/g);
  const exportedFunctions = extractMatches(content, /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g);
  const exportedClasses = extractMatches(content, /export\s+class\s+([A-Za-z0-9_]+)/g);
  const exportedConsts = extractMatches(content, /export\s+const\s+([A-Za-z0-9_]+)/g);
  const configKeys = filePath.endsWith(".json") ? extractJsonKeys(content) : [];
  const callTargets = extractMatches(content, /\b(runPhase[0-4]|resolveRunner|verifyDocs|serializePhaseState|buildTaskPlans|buildHighlightsMarkdown|buildArchitectureMarkdown|writeWorkspaceFile)\b/g);
  const keyElements = [...commands, ...exportedFunctions, ...exportedClasses, ...exportedConsts, ...configKeys]
    .filter(Boolean)
    .slice(0, MAX_SYMBOLS_PER_FILE);

  return {
    path: filePath,
    role: inferFileRole(filePath, content, zh),
    keyElements,
    flowHints: inferFlowHints(filePath, content, commands, callTargets, zh),
    designHints: inferDesignHints(filePath, content, zh),
    evidenceSnippet: selectEvidenceSnippet(content, commands, exportedFunctions, exportedClasses, exportedConsts, configKeys, callTargets, zh),
  };
}

function inferFileRole(filePath: string, content: string, zh: boolean): string {
  const normalized = filePath.toLowerCase();

  if (normalized.includes("cli/") || /\.command\(/.test(content)) {
    return zh ? "命令入口，负责接收用户参数并分派工作流" : "Command entry that receives user arguments and dispatches the workflow";
  }

  if (normalized.includes("config") || filePath.endsWith(".json")) {
    return zh ? "配置与边界定义，决定分析范围和运行模式" : "Configuration and boundary definition for scope and execution mode";
  }

  if (normalized.includes("plan")) {
    return zh ? "任务规划器，把索引条目切成教学单元和波次任务" : "Planner that turns index entries into teaching units and waves";
  }

  if (normalized.includes("phase") || /runPhase[0-4]/.test(content)) {
    return zh ? "阶段编排逻辑，负责推进状态和连接上下游" : "Phase orchestration that advances state and wires stages together";
  }

  if (normalized.includes("runner") || /resolveRunner/.test(content)) {
    return zh ? "执行器适配层，负责 Claude 调用、回退和会话隔离" : "Runner adapter for Claude calls, fallback, and fresh-session isolation";
  }

  if (normalized.includes("report") || normalized.includes("verify") || normalized.includes("doc")) {
    return zh ? "文档装配与质量校验，负责把中间结果变成学习文档" : "Documentation assembly and quality verification for learner-facing output";
  }

  if (normalized.includes("parser") || normalized.includes("map")) {
    return zh ? "索引与结构提取逻辑，负责把源码转成可规划的骨架" : "Indexing and structure extraction that turns source into a plannable skeleton";
  }

  return zh ? "支撑模块，补足当前教学单元需要的上下文" : "Supporting module that fills in context for the teaching unit";
}

function inferFlowHints(
  filePath: string,
  content: string,
  commands: string[],
  callTargets: string[],
  zh: boolean,
): string[] {
  const hints: string[] = [];

  if (commands.length > 0) {
    hints.push(
      zh
        ? `\`${filePath}\` 定义命令 ${commands.join("、")}，是用户进入工作流的入口。`
        : `\`${filePath}\` defines commands ${commands.join(", ")}, which form the entry into the workflow.`,
    );
  }

  if (/runPhase0/.test(content) && /runPhase4/.test(content)) {
    hints.push(
      zh
        ? `当前单元串起了阶段 0 到阶段 4，说明入口会依次完成索引、规划、执行、聚合和发布。`
        : `This unit stitches phase 0 through phase 4 together, so the entry runs indexing, planning, execution, synthesis, and publishing in order.`,
    );
  }

  if (/pLimit|Promise\.all/.test(content)) {
    hints.push(
      zh
        ? `当前实现允许同波次任务并发执行，但通过波次顺序控制形成 barrier，避免上层任务读到未完成的前置摘要。`
        : `The implementation runs tasks concurrently within a wave but uses wave order as a barrier so later tasks never read incomplete prerequisite summaries.`,
    );
  }

  if (/serializePhaseState|PHASE_/.test(content)) {
    hints.push(
      zh
        ? `状态会被序列化到 XML 文件中，这让工作流可以恢复、排错，并对阶段边界保持可观察性。`
        : `State is serialized into XML files, which makes the workflow resumable, debuggable, and observable across phase boundaries.`,
    );
  }

  if (/verifyDocs|buildVerifyReport/.test(content)) {
    hints.push(
      zh
        ? `最终发布不是简单写 Markdown，而是紧接着做链接、Mermaid 和教学质量校验，保证交付物可读。`
        : `Publishing is not just writing Markdown; it immediately validates links, Mermaid, and teaching quality so the deliverable stays usable.`,
    );
  }

  if (/resolveRunner|runnerMode/.test(content) || callTargets.includes("resolveRunner")) {
    hints.push(
      zh
        ? `执行阶段会优先尝试外部 Runner，不可用时再回退到本地启发式摘要。`
        : `Execution first attempts an external runner and falls back to heuristic summaries only when the runner is unavailable.`,
    );
  }

  if (hints.length === 0) {
    hints.push(
      zh
        ? `可以把这部分理解成“输入上下文 -> 教学单元处理 -> 写回状态或文档”的一段中继链路。`
        : `You can read this as a relay in the form of input context -> teaching-unit processing -> state or document output.`,
    );
  }

  return [...new Set(hints)].slice(0, MAX_FLOW_HINTS);
}

function inferDesignHints(filePath: string, content: string, zh: boolean): string[] {
  const hints: string[] = [];

  if (/serializePhaseState|PHASE_/.test(content)) {
    hints.push(
      zh
        ? "这里把阶段状态显式落盘，而不是只保存在内存里，换来的是恢复能力和调试透明度。"
        : "Stage state is written to disk instead of living only in memory, trading some complexity for recoverability and debugging transparency.",
    );
  }

  if (/resolveRunner|runnerMode|teams|sdk/.test(content)) {
    hints.push(
      zh
        ? "这里没有把模型调用写死在单一路径上，而是保留 teams、sdk 和启发式回退三层策略。"
        : "The model call path is not hard-coded; it preserves three layers: teams, sdk, and heuristic fallback.",
    );
  }

  if (/verifyDocs|qualityErrors|placeholderErrors/.test(content)) {
    hints.push(
      zh
        ? "交付阶段把质量校验纳入主流程，而不是在发布后额外补救，这能提前拦住教学型废文档。"
        : "Quality checks are part of the main delivery flow rather than an afterthought, which blocks weak teaching documents before publication.",
    );
  }

  if (/teaching_unit|learning_order|why_this_matters/.test(content)) {
    hints.push(
      zh
        ? "任务模型里显式保存学习顺序、重要性和前置知识，说明系统在设计上优先考虑阅读体验。"
        : "The task model stores learning order, importance, and prerequisites explicitly, showing the system is designed for reading experience, not just execution.",
    );
  }

  if (hints.length === 0) {
    hints.push(
      zh
        ? `从当前证据看，这一单元的取舍重点是把“${path.basename(filePath)}”所处层级讲清楚，而不是追求局部技巧展示。`
        : `The main trade-off here is making the layer around "${path.basename(filePath)}" understandable, rather than showcasing local coding tricks.`,
    );
  }

  return [...new Set(hints)].slice(0, 3);
}

function selectEvidenceSnippet(
  content: string,
  commands: string[],
  exportedFunctions: string[],
  exportedClasses: string[],
  exportedConsts: string[],
  configKeys: string[],
  callTargets: string[],
  zh: boolean,
): string {
  const anchors = [...commands, ...exportedFunctions, ...exportedClasses, ...exportedConsts, ...configKeys, ...callTargets];
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const line =
    lines.find((candidate) => anchors.some((anchor) => candidate.includes(anchor))) ??
    lines.find((candidate) => candidate.startsWith("export ") || candidate.startsWith("async function")) ??
    lines[0];

  return line ? line.slice(0, 180) : zh ? "无明显声明" : "no obvious declaration";
}

function buildFlowLines(context: TaskContext, insights: FileInsight[], zh: boolean): string[] {
  const lines = insights.flatMap((insight) => insight.flowHints);
  if (lines.length === 0) {
    return [
      zh
        ? `- 当前证据不足以恢复更细的调用链，建议优先核对 ${context.task.scope_files[0]}。`
        : `- The current evidence is not enough to reconstruct a deeper flow. Verify ${context.task.scope_files[0]} first.`,
    ];
  }

  return [...new Set(lines)].slice(0, MAX_FLOW_HINTS).map((line) => `- ${line}`);
}

function buildDesignLines(context: TaskContext, insights: FileInsight[], zh: boolean): string[] {
  const hints = [...new Set(insights.flatMap((insight) => insight.designHints))].slice(0, 3);
  return [
    ...hints.map((hint) => `- ${hint}`),
    zh
      ? `- 这部分被安排在 ${context.task.wave}，是因为它直接服务于“${context.task.teaching_unit}”的阅读顺序，而不是因为文件碰巧放在一起。`
      : `- This belongs to ${context.task.wave} because it serves the reading order for "${context.task.teaching_unit}", not because the files merely sit together.`,
  ];
}

function buildHighlightLines(context: TaskContext, insights: FileInsight[], zh: boolean): string[] {
  const joinedPaths = context.task.scope_files.join(" ");
  const highlights: string[] = [];

  if (/serialization|PHASE_|state/i.test(joinedPaths) || insights.some((insight) => insight.designHints.some((hint) => hint.includes("状态") || hint.includes("State")))) {
    highlights.push(
      zh
        ? "把阶段状态写入 XML 是这个项目的一个明显亮点：它让长流程分析具备恢复性，而不是一次性黑盒运行。"
        : "Persisting phase state into XML is a clear highlight: it makes long analyses recoverable instead of a one-shot black box.",
    );
  }

  if (/runner|prompt|execute|phase2/i.test(joinedPaths)) {
    highlights.push(
      zh
        ? "执行层不是简单调用模型，而是显式处理 fresh context、Runner 选择和失败回退，这直接影响可用性。"
        : "The execution layer does more than call a model; it handles fresh context, runner selection, and fallback explicitly, which directly affects usability.",
    );
  }

  if (/report|verify|publish|docs/i.test(joinedPaths)) {
    highlights.push(
      zh
        ? "文档发布阶段把教学质量校验内建进流程，这使“能生成”与“值得读”之间建立了硬约束。"
        : "The publishing phase bakes teaching-quality checks into the flow, creating a hard constraint between 'can generate' and 'worth reading'.",
    );
  }

  if (highlights.length === 0) {
    highlights.push(
      zh
        ? `这一单元最值得注意的是：它把“${context.task.teaching_unit}”从零散源码整理成可跟读的结构，是主学习路径的重要支点。`
        : `The main highlight of this unit is that it turns "${context.task.teaching_unit}" from scattered source into a teachable structure that supports the main learning path.`,
    );
  }

  return [...new Set(highlights)].slice(0, 2).map((line) => `- ${line}`);
}

function buildNextReadLines(context: TaskContext, insights: FileInsight[], zh: boolean): string[] {
  const relatedFiles = insights
    .map((insight) => insight.path)
    .filter((filePath) => filePath.startsWith("src/"))
    .slice(0, 2);

  const lines: string[] = [];
  if (context.task.recommended_prerequisites.length > 0) {
    lines.push(
      zh
        ? `- 如果前置知识还不稳，先回看：${context.task.recommended_prerequisites.join("、")}。`
        : `- If the prerequisites are not solid yet, revisit: ${context.task.recommended_prerequisites.join(", ")}.`,
    );
  }

  if (relatedFiles.length > 0) {
    lines.push(
      zh
        ? `- 想继续顺着源码深挖，可优先对照：${relatedFiles.join("、")}。`
        : `- To go deeper in source, inspect: ${relatedFiles.join(", ")}.`,
    );
  }

  lines.push(
    zh
      ? `- 如果要继续跟主线，请优先阅读与当前单元相邻的任务摘要，而不是随机打开文件。`
      : `- To stay on the main storyline, read adjacent task summaries instead of random files.`,
  );
  return lines;
}

function extractMatches(content: string, expression: RegExp): string[] {
  return [...content.matchAll(expression)].map((match) => match[1]).filter(Boolean);
}

function extractJsonKeys(content: string): string[] {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return Object.keys(parsed).slice(0, MAX_SYMBOLS_PER_FILE);
  } catch {
    return [];
  }
}
