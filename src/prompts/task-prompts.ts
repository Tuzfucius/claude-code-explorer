import type { TaskPlan, WaveName } from "../core/types.js";

export function buildTaskPrompts(task: TaskPlan): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: buildSystemPrompt(task.wave),
    userPrompt: [
      `你正在为 code-explorer 生成微观模块报告。`,
      `任务标题：${task.title}`,
      `任务目标：${task.goal}`,
      `波次：${task.wave}`,
      `验收要求：${task.acceptance_checks.join("；")}`,
      "",
      "请输出 Markdown，必须包含以下一级标题：",
      "# 模块定位",
      "# 关键结构",
      "# 调用关系",
      "# 学习建议",
      "",
      "要求：",
      "- 只根据提供的文件与前置摘要输出，不要编造不存在的实现。",
      "- 优先解释职责、边界、入口、关键类型和调用链。",
      "- 若信息不足，明确标注“信息不足”。",
    ].join("\n"),
  };
}

function buildSystemPrompt(wave: WaveName): string {
  if (wave === "WAVE_1") {
    return "你是 Data Agent，专注于解释基础数据结构、配置和公共抽象。";
  }

  if (wave === "WAVE_2") {
    return "你是 Flow Agent，专注于解释业务调用链、控制流和模块协作。";
  }

  return "你是 Data Agent，专注于总结入口层、交互层与集成点，为亮点提炼做准备。";
}

