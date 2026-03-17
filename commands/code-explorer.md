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
- `skills/code-explorer-teaching-playbook/SKILL.md`

在写入任何 `.md` 或 `.xml` 产物前，优先读取 `templates/` 中对应模板，按模板骨架组织内容与字段。

目标仓库默认是当前目录；如果用户传入路径，则使用传入路径。

## 复杂度分流

开始前先快速判断仓库复杂度：

- 简单仓库：代码文件不多、单入口、单服务、目录层次浅
- 中等仓库：有多个核心目录或明显分层，但主链路仍然集中
- 复杂仓库：多包/多服务/多入口，或存在明显的异步协作与扩展层

如果是简单仓库，必须启用紧凑模式：

- 阶段 1 只启动 1 个 `scout`
- 阶段 2 总任务数控制在 2 到 4 个
- 阶段 4 只生成最必要文档：`README.md`、`START_HERE.md`、`INDEX.md`、`SYSTEM_ARCHITECTURE.md`、`HIGHLIGHTS.md`、`VERIFY_REPORT.md`
- 只有在确有价值时才补 `CORE_CONCEPTS.md`、学习路径和 `COURSE_OVERVIEW.md`
- 目标是在 10 分钟左右给出第一版，而不是机械跑满所有材料

如果是中等仓库，保持标准模式；如果是复杂仓库，再展开完整模式。

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
   - 优先参考 `templates/xml/index-map.template.xml`
5. 更新 `PHASE_0_MAP_STATUS.xml` 为 `completed`

## 阶段 1：全局调研与计划

1. 写入 `PHASE_1_PLAN_STATUS.xml`，状态为 `running`
2. 并行启动 2 到 3 个 `scout` agents，分别关注：
   - 项目目标与入口
   - 主链路与架构层次
   - 项目特色与值得学习的设计
   - 简单仓库降为 1 个 `scout`
3. 汇总为：
   - `.code-explorer/research/PROJECT_BRIEF.md`
   - `.code-explorer/research/READING_ORDER.md`
4. 启动 `orchestrator` agent：
   - 读取 `INDEX_MAP.xml` 和 research 文档
   - 生成问题驱动的教学任务，而不是目录驱动任务
   - 每个任务补充学习阶段、理解框架和当前聚焦
   - 对简单仓库禁止把同一主题拆成过多任务
5. 写入：
   - `.code-explorer/planning/WAVE_1_PLANS.xml`
   - `.code-explorer/planning/WAVE_2_PLANS.xml`
   - `.code-explorer/planning/WAVE_3_PLANS.xml`
   - 优先参考 `templates/xml/wave-plan.template.xml`
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
   - 简单仓库优先减少 agent 数量，能合并的任务不要拆开
4. 每个任务完成后写入：
   - `.code-explorer/planning/analysis/<task_id>_SUMMARY.md`
   - 每篇 summary 在关键节点必须插入代码块，并给出具体解析
   - 写 summary 前优先参考 `templates/docs/module.template.md` 和 `templates/docs/module.rules.md`
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
   - 生成前优先参考 `templates/docs/architecture.*` 与 `templates/docs/highlights.*`
4. `SYSTEM_ARCHITECTURE.md` 必须包含 Mermaid 组件图与时序图
5. `HIGHLIGHTS.md` 至少给出两个明确亮点
6. 更新 `PHASE_3_SYNTHESIS_STATUS.xml` 为 `completed`

## 阶段 4：组装交付与校验

1. 写入 `PHASE_4_PUBLISH_STATUS.xml`，状态为 `running`
2. 启动 `writer` agent，生成：
   - `.code-explorer/docs/README.md`
   - `.code-explorer/docs/COURSE_OVERVIEW.md`
   - `.code-explorer/docs/START_HERE.md`
   - `.code-explorer/docs/INDEX.md`
   - `.code-explorer/docs/CORE_CONCEPTS.md`
   - `.code-explorer/docs/LEARNING_PATH_BEGINNER.md`
   - `.code-explorer/docs/LEARNING_PATH_ADVANCED.md`
   - `.code-explorer/docs/GLOSSARY.md`
   - 生成前优先参考 `templates/docs/readme.template.md`、`templates/docs/course-overview.template.md`、`templates/docs/index.template.md`、`templates/docs/start-here.template.md`、`templates/docs/learning-path.template.md`
3. `writer` 生成文档时，必须遵守以下规范：
   - 长文档加入目录
   - 整个 docs 以 `INDEX.md` 作为总索引中心
   - 每篇文档末尾加入返回总索引链接
   - 在关键机制解释处保留必要代码块与详细解析
   - 删除没有信息增量的教学废话
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
5. 明确课程总览对应的学习阶段划分
