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
- `templates/`
  - 教学文档模板与 XML 状态模板
- `hooks/`
  - 当前仅保留 hooks 设计说明，未启用强制 hooks
- `scripts/`
  - 预留可选辅助脚本

## 为什么不在 agents / commands / skills 目录里放 README

Claude Code 会自动扫描这些目录中的 Markdown 文件。

如果把普通说明文档也放进去，说明文档可能被误识别成 agent 或 command。为避免误触发，目录说明集中写在根目录的本文件中。

## 为什么模板单独放在 templates 目录

`templates/` 中的 Markdown 和 XML 文件是写作骨架，不是可执行的 command、agent 或 skill。

如果把这些模板直接放进 `commands/`、`agents/` 或 `skills/`，它们可能被 Claude Code 错误加载。单独使用 `templates/` 有三个作用：

1. 保持自动发现目录纯净
2. 为 `module-analyst`、`architect`、`writer` 等角色提供统一骨架
3. 让 `reviewer` 能按模板检查结构缺项，而不是只做自由判断
