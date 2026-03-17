---
name: code-explorer-workspace
description: Maintain the .code-explorer workspace consistently. Use this skill when creating or updating index files, phase state XML, wave plans, research notes, or final learning documents for the code-explorer workflow.
---

# Code Explorer Workspace

该技能定义 `code-explorer` 的工作区目录结构和状态文件约定。

## 工作区目录

所有产物都写入目标仓库根目录下的 `.code-explorer/`：

```text
.code-explorer/
├─ INDEX_MAP.xml
├─ research/
│  ├─ PROJECT_BRIEF.md
│  └─ READING_ORDER.md
├─ planning/
│  ├─ WAVE_1_PLANS.xml
│  ├─ WAVE_2_PLANS.xml
│  ├─ WAVE_3_PLANS.xml
│  └─ analysis/
│     └─ <task_id>_SUMMARY.md
├─ docs/
│  ├─ README.md
│  ├─ START_HERE.md
│  ├─ INDEX.md
│  ├─ CORE_CONCEPTS.md
│  ├─ SYSTEM_ARCHITECTURE.md
│  ├─ HIGHLIGHTS.md
│  ├─ LEARNING_PATH_BEGINNER.md
│  ├─ LEARNING_PATH_ADVANCED.md
│  ├─ GLOSSARY.md
│  ├─ VERIFY_REPORT.md
│  └─ modules/
└─ state/
   ├─ PHASE_0_MAP_STATUS.xml
   ├─ PHASE_1_PLAN_STATUS.xml
   ├─ PHASE_2_WAVE_STATUS.xml
   ├─ PHASE_3_SYNTHESIS_STATUS.xml
   └─ PHASE_4_PUBLISH_STATUS.xml
```

## 阶段状态文件

每个阶段状态 XML 都必须包含这些字段：

- `phase`
- `status`
- `inputRefs`
- `outputRefs`
- `startedAt`
- `finishedAt`
- `errors`
- `resumeToken`
- `runner`

### 状态值

- `pending`
- `running`
- `completed`
- `failed`
- `skipped`

## 任务计划文件

波次计划 XML 中每个任务至少包含：

- `task_id`
- `wave`
- `title`
- `goal`
- `scope_files`
- `depends_on`
- `required_summaries`
- `agent_role`
- `output_path`
- `acceptance_checks`

## 重要规则

1. 阶段切换前必须先更新状态文件
2. 失败时也必须写状态文件
3. 文档和状态要相互对应，不能只写文档不写状态
4. 不要把业务源码写进 `.code-explorer/`

## docs 总索引架构

`docs/INDEX.md` 是整个文档库的总导航入口，必须承担“一键跳转”的职责。

建议至少包含以下区块：

- 按学习目标看
- 按系统层次看
- 按关键链路看
- 按源码位置看
- 按阅读路径看
- 模块文档入口
- 关键亮点入口

`docs/README.md` 应该是面向读者的首页，但它不是完整索引。完整跳转中心必须是 `docs/INDEX.md`。

## 文档导航规则

1. 所有顶层文档都要链接到 `INDEX.md`
2. 所有模块文档都要能返回 `../INDEX.md`
3. `START_HERE.md`、`LEARNING_PATH_BEGINNER.md`、`LEARNING_PATH_ADVANCED.md` 都应显式指向具体模块文档
4. `HIGHLIGHTS.md` 与 `SYSTEM_ARCHITECTURE.md` 中引用的模块，应该尽量提供对应文档链接

## 长文目录规则

如果文档已经成为长文，必须在开头引言后增加“目录”。

推荐适用对象：

- `SYSTEM_ARCHITECTURE.md`
- `HIGHLIGHTS.md`
- `CORE_CONCEPTS.md`
- `LEARNING_PATH_BEGINNER.md`
- `LEARNING_PATH_ADVANCED.md`
- 长模块文档
