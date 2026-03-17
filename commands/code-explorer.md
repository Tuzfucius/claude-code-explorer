---
description: 运行 code-explorer 原生五阶段教学型仓库学习工作流
argument-hint: [repoPath=.]
---

# Code Explorer

你正在运行 `code-explorer` 的主工作流。目标不是列举文件，而是把陌生仓库转成适合第一次阅读者学习的文档库。

优先使用以下能力：

- `Read / Glob / Grep / LS`：理解仓库
- `Write / Edit`：维护 `.code-explorer/` 状态与文档
- `Agent`：调用专门的 `scout / orchestrator / module-analyst / flow-analyst / architect / writer / reviewer`

在执行前，先加载以下技能：

- `skills/code-explorer-workspace/SKILL.md`
- `skills/code-explorer-output-style/SKILL.md`

目标仓库默认是当前目录；如果用户传入路径，则使用传入路径。

## 阶段 0：映射与索引

1. 确保存在这些目录：
   - `.code-explorer/state`
   - `.code-explorer/research`
   - `.code-explorer/planning`
   - `.code-explorer/planning/analysis`
   - `.code-explorer/docs`
   - `.code-explorer/docs/modules`
2. 写入 `PHASE_0_MAP_STATUS.xml`，状态为 `running`
3. 自行读取：
   - `.gitignore`
   - 入口文件
   - manifest / config 文件
   - 关键源码目录
4. 生成 `.code-explorer/INDEX_MAP.xml`
   - 只包含文件树、类名、函数签名、入参出参、导入导出、配置摘要
   - 不写业务解释
5. 更新 `PHASE_0_MAP_STATUS.xml` 为 `completed`

## 阶段 1：全局调研与计划

1. 写入 `PHASE_1_PLAN_STATUS.xml`，状态为 `running`
2. 并行启动 2 到 3 个 `scout` agents，分别关注：
   - 项目目标与入口
   - 主链路与架构层次
   - 项目特色与值得学习的设计
3. 汇总为：
   - `.code-explorer/research/PROJECT_BRIEF.md`
   - `.code-explorer/research/READING_ORDER.md`
4. 启动 `orchestrator` agent：
   - 读取 `INDEX_MAP.xml` 和 research 文档
   - 生成问题驱动的教学任务，而不是目录驱动任务
5. 写入：
   - `.code-explorer/planning/WAVE_1_PLANS.xml`
   - `.code-explorer/planning/WAVE_2_PLANS.xml`
   - `.code-explorer/planning/WAVE_3_PLANS.xml`
6. 更新 `PHASE_1_PLAN_STATUS.xml` 为 `completed`

## 阶段 2：波次执行

1. 写入 `PHASE_2_WAVE_STATUS.xml`，状态为 `running`
2. 按波次执行任务：
   - `WAVE_1`：基础概念与入口
   - `WAVE_2`：主链路与调度
   - `WAVE_3`：交付、亮点、扩展点
3. 每个任务开启一个新的 agent 上下文：
   - 结构/概念类任务使用 `module-analyst`
   - 流程/链路类任务使用 `flow-analyst`
4. 每个任务完成后写入：
   - `.code-explorer/planning/analysis/<task_id>_SUMMARY.md`
5. 波次之间必须有 barrier；下一波次读取上一波次 summary 作为前置材料
6. 更新 `PHASE_2_WAVE_STATUS.xml` 为 `completed`

## 阶段 3：架构与亮点提炼

1. 写入 `PHASE_3_SYNTHESIS_STATUS.xml`，状态为 `running`
2. 启动 `architect` agent：
   - 读取所有 summary
   - 必要时回看关键源码证据
3. 生成：
   - `.code-explorer/docs/SYSTEM_ARCHITECTURE.md`
   - `.code-explorer/docs/HIGHLIGHTS.md`
4. `SYSTEM_ARCHITECTURE.md` 必须包含 Mermaid 组件图与时序图
5. `HIGHLIGHTS.md` 至少给出两个明确亮点
6. 更新 `PHASE_3_SYNTHESIS_STATUS.xml` 为 `completed`

## 阶段 4：组装交付与校验

1. 写入 `PHASE_4_PUBLISH_STATUS.xml`，状态为 `running`
2. 启动 `writer` agent，生成：
   - `.code-explorer/docs/README.md`
   - `.code-explorer/docs/START_HERE.md`
   - `.code-explorer/docs/INDEX.md`
   - `.code-explorer/docs/CORE_CONCEPTS.md`
   - `.code-explorer/docs/LEARNING_PATH_BEGINNER.md`
   - `.code-explorer/docs/LEARNING_PATH_ADVANCED.md`
   - `.code-explorer/docs/GLOSSARY.md`
3. 启动 `reviewer` agent 审查教学质量
4. 写入：
   - `.code-explorer/docs/VERIFY_REPORT.md`
5. 更新 `PHASE_4_PUBLISH_STATUS.xml` 为 `completed` 或 `failed`

## 最终汇报

完成后必须：

1. 汇报当前完成到哪个阶段
2. 指出最应该先读的三份文档
3. 总结两个最值得学习的设计
4. 如果存在失败或需要重写的文档，直接指出
