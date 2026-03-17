# code-explorer

`code-explorer` 已重建为 Claude Code 原生插件。

它的目标是在 Claude Code 内部直接完成一个严格五阶段的教学型仓库学习工作流，而不是依赖外部 CLI 或本地 runtime。插件通过 slash commands、专用 agents 和 skills，把陌生代码仓库整理成适合人类学习的多文档资料库。

## 当前设计

核心原则：

1. 完全采用 Claude Code 原生插件结构
2. 用 commands 驱动工作流
3. 用 agents 分工完成调研、规划、讲解、架构提炼、写作和审稿
4. 用 skills 统一状态文件和教学输出规范
5. 所有产物写入目标仓库的 `.code-explorer/`

## 插件结构

- [.claude-plugin/README.md](./.claude-plugin/README.md)：插件元数据
- [PLUGIN_STRUCTURE.md](./PLUGIN_STRUCTURE.md)：插件目录结构与自动发现约束
- [hooks/README.md](./hooks/README.md)：hooks 设计说明
- [scripts/README.md](./scripts/README.md)：可选辅助脚本说明
- [CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md](./CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md)：迁移与设计方案

## 本地加载

```powershell
claude --plugin-dir E:\Project\code-explorer
```

进入 Claude Code 后可使用：

```text
/code-explorer .
/code-explorer-quick-tour .
/code-explorer-deep-course .
/code-explorer-status .
/code-explorer-verify .
```

## 五阶段目标

1. 映射与索引
2. 全局调研与任务规划
3. 波次执行
4. 架构与亮点提炼
5. 交付与校验

这些阶段全部由 Claude Code 原生工作流组织，不再依赖旧版 TypeScript CLI。
