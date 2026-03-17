# code-explorer

`code-explorer` 是一个面向 Claude Code 的原生插件，用于把陌生代码仓库整理成可教学、可检索、可审查的文档库。  
`code-explorer` is a Claude Code native plugin that transforms unfamiliar repositories into a teachable, searchable, and reviewable documentation workspace.

## 项目目标 | Project Goals

- 不是做“摘要生成器”，而是输出结构化学习材料。  
  Not a plain summarizer; it generates structured learning materials.
- 关注四个问题：项目解决什么问题、核心链路如何运作、为什么这样设计、如何开始阅读。  
  Focus on four questions: what problem is solved, how the core flow works, why the design exists, and where to start reading.
- 在目标仓库中维护 `.code-explorer/` 工作区，沉淀多份教学文档。  
  Maintain a `.code-explorer/` workspace in the target repo and produce a set of learning docs.

## 核心能力 | Core Capabilities

- 五阶段工作流（映射、计划、执行、提炼、交付）  
  Five-phase workflow (map, plan, execute, synthesize, publish)
- 多角色 agents 分工协作（调研、编排、讲解、架构提炼、写作、审稿）  
  Multi-agent collaboration (research, orchestration, explanation, architecture synthesis, writing, review)
- XML 状态文件驱动阶段流转与恢复  
  XML state files for phase transitions and resumability
- 模板 + 规则约束输出结构与质量门禁  
  Templates + rules as structure and quality gates
- 强制关键源码证据与解释，避免空泛结论  
  Enforced code evidence and explanations to avoid generic claims

## 工作流概览 | Workflow Overview

1. 映射与索引（Phase 0）  
   Mapping & Indexing
2. 全局调研与计划（Phase 1）  
   Research & Planning
3. 波次执行（Phase 2）  
   Wave Execution
4. 架构与亮点提炼（Phase 3）  
   Architecture & Highlights Synthesis
5. 组装交付与校验（Phase 4）  
   Publishing & Verification

教学增强特征（Phase 1-4）/ Teaching Enhancements (Phase 1-4):

- 递进课程 Progressive course framing
- 心智模型优先 Mental-model-first explanation
- 单机制聚焦 One-core-mechanism focus

## 插件命令 | Slash Commands

- `/code-explorer [repoPath]`：标准五阶段流程  
  Standard 5-phase workflow
- `/code-explorer-quick-tour [repoPath]`：轻量导览  
  Lightweight quick tour
- `/code-explorer-deep-course [repoPath]`：完整课程化文档  
  Full course-style documentation
- `/code-explorer-status [repoPath]`：查看当前状态  
  Inspect current workflow status
- `/code-explorer-verify [repoPath]`：校验文档质量  
  Verify document quality

## 目录架构 | Repository Architecture

- `.claude-plugin/`：插件元数据 / Plugin metadata
- `commands/`：命令入口 / Slash-command entry points
- `agents/`：专用角色 / Specialized agents
- `skills/`：工作区与输出规范 / Workspace and output conventions
- `templates/`：文档与 XML 模板 / Document and XML templates
- `scripts/`：安装脚本 / Installation scripts
- `hooks/`：hooks 设计说明 / Hook design notes

详见 [PLUGIN_STRUCTURE.md](./PLUGIN_STRUCTURE.md)。

## 模板体系 | Template System

模板位于 [templates/README.md](./templates/README.md)，分为：

- Docs templates（Markdown 输出骨架）
- XML templates（状态与计划骨架）
- Rules files（硬约束与审查标准）

## 生成结果示例 | Example Output

```text
.code-explorer/
├─ INDEX_MAP.xml
├─ research/
├─ planning/
├─ docs/
└─ state/
```

详细示例见原工作流输出约定。  
For detailed output examples, follow the workflow output conventions.

## 安装与使用 | Setup and Usage

### 1) 安装 | Install

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

macOS / Linux:

```bash
bash ./scripts/install.sh
```

### 2) 加载插件 | Load Plugin

```powershell
claude --plugin-dir <code-explorer-repo-path>
```

### 3) 在目标仓库执行 | Run in Target Repository

```text
/code-explorer .
/code-explorer-quick-tour .
/code-explorer-deep-course .
/code-explorer-status .
/code-explorer-verify .
```

## 相关文档 | Related Documents

- [DEPLOY.md](./DEPLOY.md)
- [PLUGIN_STRUCTURE.md](./PLUGIN_STRUCTURE.md)
- [templates/README.md](./templates/README.md)
- [CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md](./CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md)

## 设计原则 | Design Principles

- Claude 主导理解与写作，插件负责流程组织。  
  Claude leads understanding and writing; the plugin organizes workflow.
- 结论必须有源码证据。  
  Conclusions must be backed by source evidence.
- 模板约束结构，不替代真实分析。  
  Templates constrain structure, not real analysis.
