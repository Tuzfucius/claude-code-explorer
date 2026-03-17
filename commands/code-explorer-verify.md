---
description: 只审查已有学习文档的结构、证据和教学质量
argument-hint: [repoPath=.]
---

# Code Explorer Verify

该命令不重新分析源码，只检查 `.code-explorer/docs/` 中的现有文档是否真正可用于学习。

执行要求：

1. 读取核心文档：
   - `README.md`
   - `START_HERE.md`
   - `INDEX.md`
   - `SYSTEM_ARCHITECTURE.md`
   - `HIGHLIGHTS.md`
   - `LEARNING_PATH_BEGINNER.md`
   - `LEARNING_PATH_ADVANCED.md`
2. 启动 `reviewer` agent 审查教学质量
3. 在 `.code-explorer/docs/VERIFY_REPORT.md` 中写明：
   - 是否存在列举式写法
   - 是否缺少主链路
   - 是否缺少设计原因
   - 是否缺少亮点证据
   - 是否缺少关键代码块
   - 长文档是否缺少目录
   - 文末是否缺少返回总索引链接
   - `INDEX.md` 是否承担总索引职责
   - 哪些文档应优先重写
4. 审查时优先参考 `templates/docs/*.rules.md` 与 `templates/docs/*.template.md`，按模板缺失项给出问题

最终向用户汇报最高优先级的 1 到 3 个问题。
