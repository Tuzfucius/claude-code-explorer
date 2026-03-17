# hooks

该目录当前只保留 hooks 设计说明，不包含已启用的 hooks 实现。

## 当前策略

`code-explorer` 目前不默认启用强制 hooks，原因如下：

- 主流程已经由 slash commands 和 agents 显式组织
- 现阶段优先保证工作流可控，不希望用自动 hooks 干扰普通 Claude Code 会话
- 在文档结构、状态流转和审稿规则稳定前，过早引入 hooks 会增加调试复杂度

## 未来适合接入的 hooks

- `SessionStart`
  - 提示当前仓库可使用 `/code-explorer` 系列命令
- `SubagentStop`
  - 提醒更新阶段状态文件或 summary
- `Stop`
  - 在文档尚未校验时提醒继续执行 `/code-explorer-verify`

## 设计原则

- hooks 只能强化现有工作流，不能替代主命令
- hooks 应优先做提醒和校验，不应隐式修改大量内容
- 在引入真正实现前，先明确触发时机、影响范围和回退策略
