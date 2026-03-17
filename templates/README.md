# Templates

该目录存放 `code-explorer` 的模板资产。  
This directory stores template assets for `code-explorer`.

## 目录结构 | Directory Structure

- `docs/`：Markdown 文档模板与规则 / Markdown templates and rules
- `xml/`：状态与计划 XML 模板 / XML templates for state and planning

## 设计目标 | Design Goals

模板不替 Claude 写内容，而是约束输出骨架和硬性字段。  
Templates do not write content for Claude; they enforce output skeletons and required fields.

它们用于避免以下问题：  
They help avoid:

- 目录转录 / directory-only transcription
- 文件罗列 / file listing without explanation
- 空泛套话 / generic statements
- 缺少代码证据 / claims without code evidence

## 模板分类 | Template Categories

### `docs/`

- 面向学习者的 Markdown 模板 / Learner-facing Markdown templates
- `*.template.md`：结构骨架 / Structure skeletons
- `*.rules.md`：质量门禁与填充要求 / Quality gates and fill-in requirements

### `xml/`

- 面向流程状态的 XML 模板 / Workflow-state XML templates
- 保证状态文件与计划文件字段一致 / Keep state/plan schema consistent

## 使用原则 | Usage Principles

1. 生成文档前先选择对应模板。  
   Select the corresponding template before generating content.
2. 先满足结构，再补充内容深度。  
   Satisfy structure first, then improve depth.
3. 优先遵循 rules 文件中的硬约束。  
   Follow hard constraints in rules files first.

## 扩展建议 | Extension Guidance

若要提升输出质量，建议优先调整模板，再调整 agent 文案。  
To improve output quality, tune templates first, then agent prompts.

优先级建议：  
Suggested priority:

1. `module.template.md`
2. `architecture.template.md`
3. `highlights.template.md`
4. `index.template.md`
5. `verify-report.template.md`

## 课程化模板支持 | Course-style Template Support

`docs/` 额外提供：  
`docs/` additionally provides:

- `course-overview.template.md`
  - 用于生成 `COURSE_OVERVIEW.md` / For `COURSE_OVERVIEW.md`
  - 覆盖学习阶段、心智模型与聚焦机制 / Covers stage, mental model, and focus mechanism
