import path from "node:path";

import pLimit from "p-limit";

import { ARTIFACT_FILES, PHASE_STATUS_FILES } from "../core/constants.js";
import { loadRepoConfig, readWorkspaceFile, writeWorkspaceFile } from "../core/fs-utils.js";
import { resolveArtifactPath, resolveOutputRoot } from "../core/paths.js";
import { serializePhaseState } from "../core/serialization.js";
import type { CodeExplorerConfig, PhaseState, TaskContext, TaskExecutionResult, TaskPlan, TaskSummaryResult, WaveName } from "../core/types.js";
import { buildTaskPrompts } from "../prompts/task-prompts.js";
import { resolveRunner } from "../runners/index.js";

const WAVE_SEQUENCE: WaveName[] = ["WAVE_1", "WAVE_2", "WAVE_3"];

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
        tasks.map((task) => limit(() => executeTask(repoPath, outputRoot, config.outputDir, task, runner?.mode))),
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
      const context = await buildTaskContext(repoPath, task);
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

async function buildTaskContext(repoPath: string, task: TaskPlan): Promise<TaskContext> {
  const fileContents = await Promise.all(
    task.scope_files.map(async (relativePath) => ({
      path: relativePath,
      content: trimForPrompt(await readWorkspaceFile(repoPath, relativePath)),
    })),
  );

  const dependencySummaries = await readDependencySummaries(repoPath, task.wave);

  return {
    repoPath,
    task,
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
      const prompts = buildTaskPrompts(context.task);
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

async function readDependencySummaries(repoPath: string, wave: WaveName): Promise<Array<{ path: string; content: string }>> {
  if (wave === "WAVE_1") {
    return [];
  }

  const targetWaves = wave === "WAVE_2" ? ["wave_1_"] : ["wave_1_", "wave_2_"];
  const analysisDir = resolveArtifactPath(repoPath, "analysisDir");
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
  const symbolLines = context.fileContents.map(({ path, content }) => {
    const preview = content
      .split(/\r?\n/)
      .slice(0, 12)
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" ");
    return `- ${path}：${preview.slice(0, 180) || "无明显声明"}`;
  });

  const dependencyLines =
    context.dependencySummaries.length === 0
      ? ["- 无前置摘要"]
      : context.dependencySummaries.map(({ path }) => `- 参考前置摘要：${path}`);

  return [
    `# 模块定位`,
    ``,
    `- 任务：${context.task.title}`,
    `- 目标：${context.task.goal}`,
    `- 覆盖文件数：${context.task.scope_files.length}`,
    ``,
    `# 关键结构`,
    ``,
    ...symbolLines,
    ``,
    `# 调用关系`,
    ``,
    ...dependencyLines,
    `- 当前任务输出基于文件预览和基础上下文推断，建议结合源码继续阅读。`,
    ``,
    `# 学习建议`,
    ``,
    `- 先阅读 ${context.task.scope_files[0]} 以建立局部上下文。`,
    `- 再对照相关依赖摘要理解该模块在整体链路中的位置。`,
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
