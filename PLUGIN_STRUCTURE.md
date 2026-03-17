# Plugin Structure

该文档说明 `code-explorer` 的 Claude Code 原生插件结构。  
This document describes the Claude Code native plugin structure of `code-explorer`.

## 目录说明 | Directory Overview

- `.claude-plugin/`：插件元数据 / Plugin metadata
- `commands/`：slash commands 入口 / Command entrypoints
- `agents/`：专用子智能体 / Specialized sub-agents
- `skills/`：工作区与输出规范 / Workspace and output standards
- `templates/`：教学文档与 XML 模板 / Teaching docs and XML templates
- `hooks/`：hooks 设计说明 / Hook design notes
- `scripts/`：辅助脚本 / Helper scripts

## 顶层结构示意 | Top-level Layout

```text
code-explorer/
├─ .claude-plugin/
├─ commands/
├─ agents/
├─ skills/
├─ templates/
├─ hooks/
├─ scripts/
├─ README.md
├─ PLUGIN_STRUCTURE.md
└─ CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md
```

## 各目录职责 | Responsibilities by Directory

- `.claude-plugin/`：声明插件身份 / Plugin identity metadata
- `commands/`：定义工作流入口 / Workflow entry commands
- `agents/`：定义多角色协作 / Multi-agent collaboration roles
- `skills/`：定义规范与流程契约 / Standards and workflow contracts
- `templates/`：约束输出结构 / Output structure constraints
- `hooks/`：保留 hook 设计，不强制启用 / Hook design retained, not enforced
- `scripts/`：安装与辅助操作 / Installation and helper operations

## 说明文档放置策略 | Documentation Placement Strategy

不在 `agents/`、`commands/`、`skills/` 目录放普通 README，原因是 Claude Code 会自动扫描这些目录中的 Markdown 文件。  
Regular READMEs are avoided inside `agents/`, `commands/`, and `skills/` because Claude Code auto-discovers Markdown files in these directories.

## 为什么模板独立在 `templates/` | Why Templates Stay in `templates/`

`templates/` 内文件是写作骨架，不是可执行插件实体。  
Files in `templates/` are writing skeletons, not executable plugin entities.

独立存放的收益 / Benefits:

1. 保持自动发现目录纯净 / Keep auto-discovery directories clean
2. 为 `module-analyst`、`architect`、`writer` 提供统一骨架 / Provide shared skeletons for core agents
3. 让 `reviewer` 可按规则检查缺项 / Enable rule-based completeness checks

## GitHub 阅读建议 | Suggested Reading Order on GitHub

1. `README.md`
2. `PLUGIN_STRUCTURE.md`
3. `templates/README.md`
4. `CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md`
