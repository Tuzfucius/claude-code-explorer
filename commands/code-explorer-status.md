---
description: 查看当前 .code-explorer 工作区的阶段状态与关键产物
argument-hint: [repoPath=.]
---

# Code Explorer Status

检查目标仓库下 `.code-explorer/` 的当前状态。

执行步骤：

1. 读取：
   - `.code-explorer/state/PHASE_0_MAP_STATUS.xml`
   - `.code-explorer/state/PHASE_1_PLAN_STATUS.xml`
   - `.code-explorer/state/PHASE_2_WAVE_STATUS.xml`
   - `.code-explorer/state/PHASE_3_SYNTHESIS_STATUS.xml`
   - `.code-explorer/state/PHASE_4_PUBLISH_STATUS.xml`
2. 检查关键产物是否存在：
   - `INDEX_MAP.xml`
   - `PROJECT_BRIEF.md`
   - `WAVE_1_PLANS.xml`
   - `SYSTEM_ARCHITECTURE.md`
   - `HIGHLIGHTS.md`
   - `VERIFY_REPORT.md`
3. 用简洁结构汇报：
   - 每阶段状态
   - 缺失产物
   - 推荐下一步

如果工作区不存在，不要报错，直接说明尚未初始化。
