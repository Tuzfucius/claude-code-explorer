# Docs Templates

该目录存放教学型 Markdown 文档模板。  
This directory contains teaching-oriented Markdown document templates.

## 模板清单 | Template Catalog

- `module.template.md`：模块/教学单元骨架 / Module or lesson unit skeleton
- `architecture.template.md`：系统架构骨架 / System architecture skeleton
- `highlights.template.md`：亮点与创新点骨架 / Highlights and innovations skeleton
- `index.template.md`：总索引骨架 / Global index skeleton
- `readme.template.md`：文档首页骨架 / Docs homepage skeleton
- `start-here.template.md`：快速入门骨架 / Quick-start skeleton
- `learning-path.template.md`：学习路径骨架 / Learning path skeleton
- `verify-report.template.md`：审查报告骨架 / Verification report skeleton
- `research-brief.template.md`：全局调研摘要骨架 / Research brief skeleton
- `course-overview.template.md`：课程总览骨架 / Course overview skeleton
- `*.rules.md`：对应模板的硬性约束 / Hard constraints per template

## 设计约束 | Design Constraints

这些模板放在 `templates/docs/`，而不是 `commands/`、`agents/`、`skills/`，用于避免被自动发现机制误识别为插件实体。  
These templates stay in `templates/docs/` (not in `commands/`, `agents/`, or `skills/`) to avoid accidental auto-discovery as plugin entities.

## 中英文输出建议 | Bilingual Output Recommendation

如果目标读者包含中文和英文使用者，建议在文档中采用“中文主叙述 + 英文术语或摘要”结构。  
If your audience includes both Chinese and English readers, use “Chinese main narrative + English terms or summaries”.
