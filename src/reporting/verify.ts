import path from "node:path";

import { parse } from "@comper/mermaid-parser";

import { readTextIfExists } from "../core/fs-utils.js";

export interface VerifyResult {
  valid: boolean;
  linkErrors: string[];
  mermaidErrors: string[];
  placeholderErrors: string[];
  qualityErrors: string[];
}

export async function verifyDocs(docsRoot: string): Promise<VerifyResult> {
  const fs = await import("node:fs/promises");
  const entries = await fs.readdir(docsRoot, { recursive: true, withFileTypes: true });
  const markdownFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(entry.parentPath, entry.name));

  const linkErrors: string[] = [];
  const mermaidErrors: string[] = [];
  const placeholderErrors: string[] = [];
  const qualityErrors: string[] = [];

  for (const filePath of markdownFiles) {
    const content = (await readTextIfExists(filePath)) ?? "";
    const links = [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
    for (const link of links) {
      if (link.startsWith("http://") || link.startsWith("https://") || link.startsWith("#")) {
        continue;
      }

      const absolutePath = path.resolve(path.dirname(filePath), link);
      const linked = await readTextIfExists(absolutePath);
      if (linked === undefined) {
        linkErrors.push(`${path.basename(filePath)} -> ${link}`);
      }
    }

    const mermaidBlocks = [...content.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)].map((match) => match[1]);
    for (const block of mermaidBlocks) {
      const result = await parse(block);
      if (!result.valid) {
        mermaidErrors.push(`${path.basename(filePath)} 中存在无效 Mermaid 图`);
      }
    }

    if (/\{\{[^}]+\}\}|TODO|TBD/.test(content)) {
      placeholderErrors.push(`${path.basename(filePath)} 存在未解析占位符`);
    }

    if (/基于文件预览和基础上下文推断|当前结果来自启发式摘要|file-by-file list/.test(content)) {
      qualityErrors.push(`${path.basename(filePath)} 仍然包含降级或列举式措辞`);
    }

    if (path.basename(filePath).startsWith("wave_")) {
      const requiredSections = ["这个模块解决的问题", "阅读前你需要知道什么", "核心对象与职责", "一条关键执行路径", "设计取舍与原因", "建议继续阅读"];
      const missing = requiredSections.filter((section) => !content.includes(`# ${section}`) && !content.includes(`# ${translateSection(section)}`));
      if (missing.length > 0) {
        qualityErrors.push(`${path.basename(filePath)} 缺少教学章节: ${missing.join("、")}`);
      }

      if (!/`[^`]+(?:\/|\.[A-Za-z0-9]+)/.test(content)) {
        qualityErrors.push(`${path.basename(filePath)} 缺少明确的源码证据路径`);
      }
    }

    if (path.basename(filePath) === "HIGHLIGHTS.md") {
      const highlightCount = (content.match(/^### /gm) ?? []).length;
      if (highlightCount < 2) {
        qualityErrors.push("HIGHLIGHTS.md 少于 2 个明确亮点");
      }

      if (!content.includes("源码落点") && !content.includes("Source anchors")) {
        qualityErrors.push("HIGHLIGHTS.md 缺少源码落点说明");
      }
    }
  }

  return {
    valid: linkErrors.length === 0 && mermaidErrors.length === 0 && placeholderErrors.length === 0 && qualityErrors.length === 0,
    linkErrors,
    mermaidErrors,
    placeholderErrors,
    qualityErrors,
  };
}

function translateSection(section: string): string {
  const mapping: Record<string, string> = {
    "这个模块解决的问题": "Problem This Module Solves",
    "阅读前你需要知道什么": "What You Need Before Reading",
    "核心对象与职责": "Core Objects And Responsibilities",
    "一条关键执行路径": "One Critical Execution Path",
    "设计取舍与原因": "Design Choices And Why",
    "建议继续阅读": "What To Read Next",
  };

  return mapping[section] ?? section;
}
