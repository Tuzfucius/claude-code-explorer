# Plugin Structure

该文档说明 `code-explorer` 当前的 Claude Code 原生插件结构。

## 目录说明

- `.claude-plugin/`
  - 插件元数据
- `commands/`
  - slash commands
- `agents/`
  - 专用子智能体
- `skills/`
  - 工作区和教学输出规范
- `hooks/`
  - 当前仅保留 hooks 设计说明，未启用强制 hooks
- `scripts/`
  - 预留可选辅助脚本

## 为什么不在 agents / commands / skills 目录里放 README

Claude Code 会自动扫描这些目录中的 Markdown 文件。

如果把普通说明文档也放进去，说明文档可能被误识别成 agent 或 command。为避免误触发，目录说明集中写在根目录的本文件中。
