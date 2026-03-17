# hooks

当前插件暂不启用强制 hooks。

原因：

- `code-explorer` 的核心流程已经由 slash commands 和 agents 显式组织
- 在没有充分验证前，不希望通过自动 hooks 干扰普通 Claude Code 会话

后续如需增加 hooks，优先考虑：

- `SessionStart`：提示如何使用 `/code-explorer`
- `SubagentStop`：提醒维护阶段状态文件
- `Stop`：在文档未校验时阻止过早结束
