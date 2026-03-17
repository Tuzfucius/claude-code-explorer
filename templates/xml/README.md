# XML Templates

该目录存放 `code-explorer` 工作流使用的 XML 模板。

用途分工如下：

- `index-map.template.xml`：阶段 0 的仓库索引骨架
- `phase-status.template.xml`：各阶段状态文件骨架
- `wave-plan.template.xml`：波次任务计划骨架
- `xml.rules.md`：XML 结构约束、字段要求与命名规范

这些模板用于统一状态流转结构，避免不同命令或 agent 各自定义字段，导致恢复与校验失效。
