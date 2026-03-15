---
allowed-tools: Bash(code-explorer:*), Bash(npx tsx:*), Read(*), Glob(*)
argument-hint: [repoPath=. ] [--runner teams|sdk|auto] [--concurrency N]
description: 运行 code-explorer 五阶段代码仓库分析
---

在当前项目中执行 code-explorer 工作流。

## 执行

- 运行分析命令：!`code-explorer run $ARGUMENTS`
- 如果用户没有传参，提示其改用 `/code-explorer . --runner teams` 或 `/code-explorer . --runner auto`。

## 汇报要求

- 读取并汇报 @.code-explorer/docs/README.md
- 读取并汇报 @.code-explorer/docs/INDEX.md
- 读取并汇报 @.code-explorer/docs/VERIFY_REPORT.md
- 明确说明是否真的生成了学习文档、是否通过校验、关键文档入口在哪里。
