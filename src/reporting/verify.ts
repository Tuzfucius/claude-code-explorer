import path from "node:path";

import { parse } from "@comper/mermaid-parser";

import { readTextIfExists } from "../core/fs-utils.js";

export interface VerifyResult {
  valid: boolean;
  linkErrors: string[];
  mermaidErrors: string[];
  placeholderErrors: string[];
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
  }

  return {
    valid: linkErrors.length === 0 && mermaidErrors.length === 0 && placeholderErrors.length === 0,
    linkErrors,
    mermaidErrors,
    placeholderErrors,
  };
}
