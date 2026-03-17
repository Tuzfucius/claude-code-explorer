# code-explorer

`code-explorer` 是一个面向 Claude Code 的原生插件，用于把陌生代码仓库整理成一套适合人类学习的文档库。

它的目标不是生成简单摘要，而是围绕“这个项目解决什么问题、核心链路如何运作、为什么这样设计、先从哪里开始读”输出结构化学习材料。插件通过 slash commands、专用 agents、skills 和模板体系，在目标仓库内维护 `.code-explorer/` 工作区，并生成多份教学型文档。

## 核心能力

- 采用严格的五阶段工作流组织仓库分析
- 用多角色 agent 分工完成调研、规划、讲解、架构提炼、写作和审稿
- 用 XML 状态文件维护阶段流转，便于恢复和检查
- 用模板约束文档结构，减少“罗列式”输出
- 在关键节点强制插入源码片段，并要求给出具体解释
- 为长文档生成目录、总索引和文末回链，提升可读性

## 工作流概览

`code-explorer` 采用五个阶段：

1. 映射与索引：生成仓库骨架索引 `INDEX_MAP.xml`
2. 全局调研与计划：识别主链路、亮点与阅读顺序，拆分三波教学任务
3. 波次执行：按任务生成模块讲解和主链路分析
4. 架构与亮点提炼：生成系统架构文档与亮点文档
5. 组装交付与校验：输出完整 docs，并进行教学质量审查

所有产物统一写入目标仓库根目录下的 `.code-explorer/`。

## 插件命令

当前提供以下 slash commands：

- `/code-explorer [repoPath]`
  - 运行标准五阶段工作流
- `/code-explorer-quick-tour [repoPath]`
  - 生成轻量导览版文档，适合先看整体轮廓
- `/code-explorer-deep-course [repoPath]`
  - 生成完整的课程式学习文档库
- `/code-explorer-status [repoPath]`
  - 检查 `.code-explorer/` 当前阶段状态
- `/code-explorer-verify [repoPath]`
  - 审查已有文档的结构、证据和教学质量

## 专用 Agents

- `scout`
  - 全局调研，判断项目目标、主逻辑目录、亮点与推荐阅读顺序
- `orchestrator`
  - 把调研结果转成问题驱动的教学任务
- `module-analyst`
  - 讲解模块职责、边界和设计意图
- `flow-analyst`
  - 追踪主链路、状态流转和跨模块协作
- `architect`
  - 汇总系统架构与项目亮点
- `writer`
  - 重写为适合学习的文档集
- `reviewer`
  - 审查教学质量，指出需要重写的问题

## Skills 与模板

插件使用两个核心技能：

- [skills/code-explorer-workspace/SKILL.md](./skills/code-explorer-workspace/SKILL.md)
  - 统一 `.code-explorer/` 工作区结构和 XML 状态文件规范
- [skills/code-explorer-output-style/SKILL.md](./skills/code-explorer-output-style/SKILL.md)
  - 统一教学型文档的输出标准

模板位于 [templates/README.md](./templates/README.md)，包括：

- 文档模板
  - [templates/docs/module.template.md](./templates/docs/module.template.md)
  - [templates/docs/architecture.template.md](./templates/docs/architecture.template.md)
  - [templates/docs/highlights.template.md](./templates/docs/highlights.template.md)
  - [templates/docs/index.template.md](./templates/docs/index.template.md)
  - [templates/docs/readme.template.md](./templates/docs/readme.template.md)
  - [templates/docs/start-here.template.md](./templates/docs/start-here.template.md)
  - [templates/docs/learning-path.template.md](./templates/docs/learning-path.template.md)
  - [templates/docs/verify-report.template.md](./templates/docs/verify-report.template.md)
  - [templates/docs/research-brief.template.md](./templates/docs/research-brief.template.md)
- XML 模板
  - [templates/xml/index-map.template.xml](./templates/xml/index-map.template.xml)
  - [templates/xml/phase-status.template.xml](./templates/xml/phase-status.template.xml)
  - [templates/xml/wave-plan.template.xml](./templates/xml/wave-plan.template.xml)

## 生成结果

典型输出目录如下：

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

## 使用方式

### 1. 本地加载插件

在 Claude Code 环境中使用本仓库作为插件目录：

```powershell
claude --plugin-dir <code-explorer-repo-path>
```

例如：

```powershell
claude --plugin-dir E:\Project\code-explorer
```

### 2. 在目标仓库中调用命令

进入 Claude Code 后，在目标仓库里直接使用：

```text
/code-explorer .
```

常见用法：

```text
/code-explorer-quick-tour .
/code-explorer-deep-course .
/code-explorer-status .
/code-explorer-verify .
```

### 3. 推荐阅读顺序

如果你只是第一次接触一个仓库，建议按以下顺序使用：

1. `/code-explorer-quick-tour .`
2. 阅读 `.code-explorer/docs/START_HERE.md`
3. 阅读 `.code-explorer/docs/HIGHLIGHTS.md`
4. 再运行 `/code-explorer-deep-course .`
5. 最后用 `/code-explorer-verify .` 检查文档质量

## 仓库结构

与 GitHub 使用最相关的目录如下：

- [.claude-plugin/README.md](./.claude-plugin/README.md)
  - 插件元数据说明
- [PLUGIN_STRUCTURE.md](./PLUGIN_STRUCTURE.md)
  - 目录结构和自动发现约束
- [commands](./commands)
  - slash commands 定义
- [agents](./agents)
  - 专用 agent 定义
- [skills](./skills)
  - 工作区和文档规范技能
- [templates/README.md](./templates/README.md)
  - 模板总览
- [hooks/README.md](./hooks/README.md)
  - hooks 设计说明
- [scripts/README.md](./scripts/README.md)
  - 可选辅助脚本说明
- [CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md](./CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md)
  - 当前插件化设计方案

## 设计原则

- Claude 主导理解与写作，插件负责组织流程
- 先讲问题，再讲结构，再讲流程，再讲设计原因
- 关键结论必须有源码证据
- 模板只约束结构，不替代实际分析
- 输出必须服务于“学习”而不是“罗列”

## 当前边界

当前项目已经完全迁移为 Claude Code 原生插件，不再维护旧版本地 CLI 作为主执行路径。

这也意味着：

- 本仓库不是通用 npm CLI 工具
- 主工作流依赖 Claude Code 的 commands、agents 和 skills 机制
- 文档质量高度依赖 Claude 在执行时是否按模板和规则运行

## 开发与调试

如果要继续扩展本仓库，建议优先修改以下位置：

- `commands/`
  - 调整工作流编排
- `agents/`
  - 调整角色边界和输出职责
- `skills/`
  - 调整统一规范
- `templates/`
  - 调整文档骨架和 XML 结构

更新后建议至少做两项检查：

1. 本地加载检查

```powershell
claude --plugin-dir .
```

2. 命令识别检查

```powershell
claude --plugin-dir . -p "列出当前 code-explorer 插件可用的 slash commands 名称，每行一个。"
```

## 相关文档

- [PLUGIN_STRUCTURE.md](./PLUGIN_STRUCTURE.md)
- [templates/README.md](./templates/README.md)
- [CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md](./CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md)
