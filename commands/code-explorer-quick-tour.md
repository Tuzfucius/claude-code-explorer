---
description: 用最小步骤生成当前仓库的教学型快速导览文档
argument-hint: [repoPath=.]
---

# Code Explorer Quick Tour

该命令用于快速理解一个陌生仓库，优先输出“项目在做什么、架构怎么分层、最值得学什么”。

执行要求：

1. 加载：
   - `skills/code-explorer-workspace/SKILL.md`
   - `skills/code-explorer-output-style/SKILL.md`
   - `skills/code-explorer-teaching-playbook/SKILL.md`
   - 写文档前优先参考 `templates/docs/` 下对应模板
2. 只执行轻量版本的阶段 0、阶段 1、阶段 3、阶段 4
3. 必须至少调用：
   - 一个 `scout`
   - 一个 `architect`
   - 一个 `writer`
4. 输出最少包含：
   - `.code-explorer/docs/README.md`
   - `.code-explorer/docs/COURSE_OVERVIEW.md`
   - `.code-explorer/docs/START_HERE.md`
   - `.code-explorer/docs/SYSTEM_ARCHITECTURE.md`
   - `.code-explorer/docs/HIGHLIGHTS.md`
   - `.code-explorer/docs/VERIFY_REPORT.md`

汇报时优先告诉用户：

- 项目最值得先看哪里
- 两个最有特色的设计
- 如果只有 30 分钟，应该按什么顺序读
