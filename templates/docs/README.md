# Docs Templates

该目录存放教学型 Markdown 文档模板。

用途分工如下：

- `module.template.md`：模块/教学单元文档骨架
- `architecture.template.md`：系统架构文档骨架
- `highlights.template.md`：亮点与创新点文档骨架
- `index.template.md`：总索引文档骨架
- `readme.template.md`：文档库首页骨架
- `start-here.template.md`：快速入门文档骨架
- `learning-path.template.md`：学习路径文档骨架
- `verify-report.template.md`：审查报告骨架
- `research-brief.template.md`：全局调研摘要骨架
- `*.rules.md`：对应模板的硬性约束与质量要求

这些模板位于 `templates/docs/`，而不是 `commands/`、`agents/`、`skills/`，目的是避免被 Claude Code 的自动发现机制误识别为插件实体。
