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
