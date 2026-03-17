# XML Templates

该目录存放 `code-explorer` 工作流使用的 XML 模板。  
This directory stores XML templates used by the `code-explorer` workflow.

## 模板用途 | Template Purposes

- `index-map.template.xml`：阶段 0 仓库索引骨架 / Phase-0 repository index skeleton
- `phase-status.template.xml`：阶段状态文件骨架 / Per-phase status skeleton
- `wave-plan.template.xml`：波次任务计划骨架 / Wave task-plan skeleton
- `xml.rules.md`：字段、结构与命名规范 / Field, structure, and naming rules

## 使用目标 | Usage Objective

统一状态流转结构，避免不同命令或 agent 自定义字段造成恢复与校验失败。  
Standardize workflow state structure to prevent restore/verification failure caused by custom schema variants.
