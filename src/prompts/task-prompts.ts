import { isChineseDocument } from "../core/document-language.js";
import type { DocumentLanguage, TaskPlan, WaveName } from "../core/types.js";

export function buildTaskPrompts(task: TaskPlan, docLanguage: DocumentLanguage): { systemPrompt: string; userPrompt: string } {
  const zh = isChineseDocument(docLanguage);
  return {
    systemPrompt: buildSystemPrompt(task.wave, zh),
    userPrompt: [
      zh ? "你正在为 code-explorer 生成带教学性质的模块讲解文档。" : "You are writing a teaching-oriented module walkthrough for code-explorer.",
      zh ? `任务标题：${task.title}` : `Task title: ${task.title}`,
      zh ? `教学单元：${task.teaching_unit}` : `Teaching unit: ${task.teaching_unit}`,
      zh ? `任务目标：${task.goal}` : `Goal: ${task.goal}`,
      zh ? `为什么重要：${task.why_this_matters}` : `Why it matters: ${task.why_this_matters}`,
      zh ? `为什么现在阅读：${task.why_this_order}` : `Why read it now: ${task.why_this_order}`,
      zh ? `关键问题：${task.key_questions.join("；")}` : `Key questions: ${task.key_questions.join("; ")}`,
      zh
        ? `前置知识：${task.recommended_prerequisites.length > 0 ? task.recommended_prerequisites.join("、") : "无"}`
        : `Prerequisites: ${task.recommended_prerequisites.length > 0 ? task.recommended_prerequisites.join(", ") : "None"}`,
      zh ? `波次：${task.wave}` : `Wave: ${task.wave}`,
      zh ? `验收要求：${task.acceptance_checks.join("；")}` : `Acceptance checks: ${task.acceptance_checks.join("; ")}`,
      "",
      zh ? "请输出 Markdown，必须包含以下一级标题：" : "Output Markdown with the following level-1 headings:",
      zh ? "> 学习单元：..." : "> Teaching Unit: ...",
      zh ? "> 单元：..." : "> Unit: ...",
      zh ? "> 类型：core 或 supporting" : "> Kind: core or supporting",
      zh ? "# 这个模块解决的问题" : "# Problem This Module Solves",
      zh ? "# 阅读前你需要知道什么" : "# What You Need Before Reading",
      zh ? "# 核心对象与职责" : "# Core Objects And Responsibilities",
      zh ? "# 一条关键执行路径" : "# One Critical Execution Path",
      zh ? "# 设计取舍与原因" : "# Design Choices And Why",
      zh ? "# 容易误解的点" : "# Common Misunderstandings",
      zh ? "# 值得注意的亮点" : "# Worth Noticing",
      zh ? "# 建议继续阅读" : "# What To Read Next",
      "",
      zh ? "要求：" : "Requirements:",
      zh ? "- 你是在给第一次接触该项目的人写带读文档，不是在写文件摘要。" : "- Write for a first-time reader, not as a file inventory.",
      zh ? "- 先讲问题，再讲结构，再讲流程，再讲设计原因。" : "- Explain problem, then structure, then flow, then design rationale.",
      zh ? "- 只根据提供的文件与前置摘要输出，不要编造不存在的实现。" : "- Use only provided files and prerequisite summaries. Do not invent behavior.",
      zh ? "- 必须引用具体文件作为证据，但正文不能退化成逐文件罗列。" : "- Cite concrete files as evidence, but do not turn the answer into a file-by-file list.",
      zh ? "- 如果信息不足，要明确指出缺口，并说明最值得补读的文件。" : "- If information is insufficient, say so and point to the most important missing file.",
    ].join("\n"),
  };
}

function buildSystemPrompt(wave: WaveName, zh: boolean): string {
  if (wave === "WAVE_1") {
    return zh
      ? "你是教学型 Data Agent，专注于把基础数据结构、配置和共享抽象讲清楚，让读者建立概念地图。"
      : "You are a teaching-oriented Data Agent focused on making foundational types, configuration, and shared abstractions understandable.";
  }

  if (wave === "WAVE_2") {
    return zh
      ? "你是教学型 Flow Agent，专注于把关键业务链路、控制流和模块协作讲成一条能跟下来的主线。"
      : "You are a teaching-oriented Flow Agent focused on turning control flow and collaboration into a clear, followable storyline.";
  }

  return zh
    ? "你是教学型 Architect Agent，专注于总结入口层、对外接口、扩展点与值得学习的亮点。"
    : "You are a teaching-oriented Architect Agent focused on entry points, integrations, extension points, and learning-worthy highlights.";
}
