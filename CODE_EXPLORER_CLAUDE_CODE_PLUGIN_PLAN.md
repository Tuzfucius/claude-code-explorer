# Code Explorer Claude Code 插件化方案

## 文档目的

这份文档保留最初的五阶段教学型代码仓库分析思路，并把它调整为更适合 Claude Code 原生运行的插件方案。目标不是继续把 `code-explorer` 作为一个独立 CLI 外挂在 Claude 外部，而是把它深度植入 Claude Code 的插件体系，让 Claude 自己调用 commands、agents、skills、hooks 和 teams 来执行完整工作流。

## 为什么保留原始五阶段思路

原始方案的方向仍然是正确的，原因有三点：

1. 它把“索引、规划、执行、提炼、交付”明确拆开，适合长链路状态恢复。
2. 它要求中间产物落盘，适合大仓库分析、断点续跑和多人协作。
3. 它把最终目标定义为“教学文档”，而不是普通技术摘要。

真正有问题的不是五阶段设计本身，而是之前的执行方式过于偏向本地脚本，把 Claude 变成了模板填充器，没有充分利用 Claude Code 原生的探索、协作和上下文组织能力。

## 当前方向的修正原则

后续实现应遵循以下原则：

1. 脚本负责索引、状态管理、缓存、校验。
2. Claude 负责研究、阅读、规划、讲解、提炼和重写。
3. 插件入口应是 Claude Code slash command，而不是单独让用户记忆外部 CLI。
4. 多子智能体应优先通过 Claude Code 的 agents / teams 能力来组织，而不是仅靠循环调用 `claude -p`。
5. 产物仍然写入目标仓库 `.code-explorer/`，保持可恢复和可审计。

## 参考依据

### 官方文档

- Claude Code Overview: <https://code.claude.com/docs/zh-CN/overview>
- 官方文档中与插件相关的能力包括：
  - `commands`
  - `agents`
  - `skills`
  - `hooks`
  - `mcpServers`
  - `--plugin-dir` 本地加载
  - plugin marketplace 分发

### 本地参考源码

- `E:\GitHubProject\claude-code-main\plugins\README.md`
- `E:\GitHubProject\claude-code-main\plugins\feature-dev\README.md`
- `E:\GitHubProject\claude-code-main\plugins\feature-dev\commands\feature-dev.md`
- `E:\GitHubProject\claude-code-main\plugins\feature-dev\agents\code-explorer.md`
- `E:\GitHubProject\claude-code-main\.claude-plugin\marketplace.json`

从这些文件可以确认，Claude Code 官方推荐的插件形态本身就是“slash command 拉起阶段化工作流 + 多 agents 协作 + 必要时补充 hooks / MCP / skills”。

## 插件化后的目标形态

`code-explorer` 后续应同时具备两层形态：

1. `Claude Code Plugin`
   - 面向最终用户的主入口
   - 通过 `/code-explorer` 等命令调用
   - 内含 commands、agents、skills、plugin metadata

2. `Node.js Runtime`
   - 作为插件内部的本地执行引擎
   - 负责阶段 0 索引、状态文件、XML/Markdown 落盘、校验
   - 给 Claude agents 提供稳定的本地产物和恢复能力

两层关系应当是：

- Claude Code plugin 负责“怎么思考、怎么协作、怎么阅读仓库”
- Node runtime 负责“怎么落盘、怎么恢复、怎么校验”

## 推荐插件目录结构

后续建议把当前仓库调整为同时兼容 Claude Code plugin 结构：

```text
code-explorer/
├─ .claude-plugin/
│  └─ plugin.json
├─ commands/
│  ├─ code-explorer.md
│  ├─ code-explorer-quick-tour.md
│  ├─ code-explorer-deep-course.md
│  └─ code-explorer-verify.md
├─ agents/
│  ├─ scout.md
│  ├─ orchestrator.md
│  ├─ module-analyst.md
│  ├─ flow-analyst.md
│  ├─ architect.md
│  ├─ writer.md
│  └─ reviewer.md
├─ skills/
│  └─ code-explorer-output-style/
│     └─ SKILL.md
├─ hooks/
│  ├─ hooks.json
│  └─ session-start.sh
├─ src/
├─ bin/
├─ README.md
└─ CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md
```

## 推荐 slash commands

### 1. `/code-explorer`

主入口命令。适合用户直接说：

- “分析当前仓库并生成学习文档”
- “用教学方式讲清这个项目”

职责：

1. 初始化 `.code-explorer/` 目录
2. 调用阶段 0 索引
3. 启动 `scout` 和 `orchestrator`
4. 决定执行 `quick-tour` 还是 `deep-course`
5. 最后汇报关键入口文档

### 2. `/code-explorer:quick-tour`

面向“先看特色、先看亮点”的轻量流程。

职责：

1. Claude 直接探索仓库
2. 只生成：
   - `README.md`
   - `START_HERE.md`
   - `SYSTEM_ARCHITECTURE.md`
   - `HIGHLIGHTS.md`
3. 强调快速入门和项目特色

### 3. `/code-explorer:deep-course`

面向“完整教学文档库”的全流程版本。

职责：

1. 完整执行 0 到 4 阶段
2. 调用多 agents 分波次协作
3. 生成模块文档、学习路径、术语表、总索引

### 4. `/code-explorer:verify`

只做文档质量审查，不重新分析源码。

职责：

1. 校验链接、Mermaid、占位符
2. 校验教学质量
3. 给出是否需要重写某些文档

## 推荐 agents 设计

### 1. `scout`

职责：

1. 先不写文档，先理解仓库。
2. 识别：
   - 项目目标
   - 主入口
   - 关键链路
   - 最有特色的两个设计
   - 哪些目录是主逻辑，哪些只是辅助材料

输出：

- `.code-explorer/research/PROJECT_BRIEF.md`
- `.code-explorer/research/READING_ORDER.md`

### 2. `orchestrator`

职责：

1. 读取 `INDEX_MAP.xml` 和 `PROJECT_BRIEF.md`
2. 把“路径切块”改成“问题切块”
3. 生成教学单元任务，而不是目录任务

输出：

- `WAVE_1_PLANS.xml`
- `WAVE_2_PLANS.xml`
- `WAVE_3_PLANS.xml`

### 3. `module-analyst`

职责：

1. 阅读某一教学单元相关源码
2. 输出“讲问题、讲对象、讲设计”的模块文档
3. 默认面向第一次接触项目的读者

### 4. `flow-analyst`

职责：

1. 专门追主链路
2. 强调入口、状态流转、调用链、关键转折点
3. 给出“从用户动作到最终产物”的过程说明

### 5. `architect`

职责：

1. 从全局上总结系统
2. 提炼运行原理
3. 提炼亮点与创新点
4. 生成 Mermaid 架构图和时序图

### 6. `writer`

职责：

1. 重写模块文档，去掉重复
2. 调整学习顺序
3. 保证最终产物是“教学文档”，不是分析日志

### 7. `reviewer`

职责：

1. 专门检查文档是否真的适合人类学习
2. 找出：
   - 空话
   - 目录罗列
   - 没有源码证据的亮点
   - 没有解释“为什么”

## 五阶段在插件模式下的重新定义

### 阶段 0：Map Codebase

仍由脚本执行。

职责：

1. 解析 `.gitignore`
2. 过滤无效文件
3. 生成 `INDEX_MAP.xml`

这个阶段不应交给 Claude。

### 阶段 1：Research & Plan

这里应改为“Claude 主导，脚本辅助”。

新流程：

1. `scout` 用 Claude Code 原生工具探索仓库
2. `orchestrator` 基于 `INDEX_MAP.xml + scout 结论` 规划波次任务

关键改动：

- 任务切分以“要回答的问题”为中心
- 不再主要按目录命名

### 阶段 2：Wave Execution

这里仍然保留波次机制，但执行方式要改变：

1. 每个任务由 Claude Code agent 执行
2. agent 拥有原生 `Read / Glob / Grep` 能力
3. 允许 agent 自己决定补读哪些文件

关键改动：

- 不再把任务上下文压缩成固定 prompt 字符串后 `claude -p`
- 改成由 agent 在 Claude Code 会话里自己探索

### 阶段 3：Synthesis & Highlights

不能只靠本地模板聚合。

新要求：

1. `architect` 重新读取关键摘要和关键源码证据
2. 必须明确写出至少两个项目亮点
3. 每个亮点要包含：
   - 亮点是什么
   - 证据在哪
   - 它解决了什么问题
   - 比常见写法好在哪里

### 阶段 4：Verify & Publish

这里应该保留 Writer + Reviewer 双重角色：

1. `writer` 负责重写成适合学习的文档库
2. `reviewer` 负责质量门禁
3. 本地脚本负责：
   - 链接校验
   - Mermaid 校验
   - 占位符校验
   - 教学结构校验

## 为什么要深度植入 Claude Code，而不是继续做单独 CLI

主要原因如下：

### 1. Claude Code 天生适合做仓库探索

它有现成的：

- slash command
- subagents
- teams
- 工具权限控制
- 项目级上下文

这比我们自己在 CLI 里拼 prompt 更自然。

### 2. 插件能复用官方工作流范式

`feature-dev` 已经证明了这种模式有效：

1. 命令拉起流程
2. agents 分工
3. 用户在 Claude 会话中直接参与

`code-explorer` 应该复用这个范式。

### 3. 更适合教学场景

教学文档不是流水线字符串拼装，而是持续解释、反复组织、不断重写的过程。Claude Code plugin 更适合把这件事做成连续对话式工作流。

## 当前实现与目标形态的主要差距

### 差距 1：当前 `teams` 只是 `claude -p`

这不是真正的 Claude Code plugin 调度。

### 差距 2：当前 slash command 只是包装 CLI

它能运行，但不是“Claude 主导分析”。

### 差距 3：当前阶段 3/4 仍然太依赖本地模板拼接

这会削弱亮点提炼和教学表达。

### 差距 4：当前任务切分仍偏目录导向

这不利于教学阅读。

## 推荐的实施顺序

### 第一步：插件目录落地

在当前仓库内正式建立：

- `.claude-plugin/plugin.json`
- `commands/`
- `agents/`
- `skills/`

并让 `code-explorer` 能用 `claude --plugin-dir` 直接本地加载测试。

### 第二步：保留现有脚本内核

保留当前已经完成的：

- 阶段 0 索引
- XML 状态文件
- 文档校验
- 恢复能力

这些不需要推翻。

### 第三步：把阶段 1/2 改成 Claude 原生代理工作流

重点替换：

- 任务规划逻辑
- 调用 Claude 的方式
- 任务上下文构造方式

### 第四步：把阶段 3/4 改成真正的 Architect / Writer / Reviewer 协作

这一步决定文档质量上限。

### 第五步：支持 marketplace 分发

等本地 `--plugin-dir` 工作稳定后，再考虑：

- 补齐 `plugin.json`
- README
- 安装说明
- 进入 marketplace 或团队私有分发

## 预期最终使用方式

### 本地开发测试

```powershell
claude --plugin-dir E:\Project\code-explorer
```

进入会话后直接使用：

```text
/code-explorer .
/code-explorer:quick-tour .
/code-explorer:deep-course .
/code-explorer:verify .
```

### 目标用户体验

用户只需要在 Claude Code 中说：

```text
/code-explorer .
```

随后 Claude 会：

1. 建立索引
2. 研究仓库
3. 调用子 agent 分析
4. 提炼架构和亮点
5. 输出一套适合学习的文档库

## 结论

后续方向不是放弃原始五阶段设计，而是把它改造成 Claude Code 原生插件工作流。

保留的部分：

- 五阶段流程
- XML / Markdown 状态流转
- `.code-explorer/` 产物目录
- 教学文档目标

需要替换的部分：

- 外部 CLI 主导的 Claude 调用方式
- 目录驱动任务切分
- 本地模板式聚合

正确的终局形态应当是：

“Claude Code plugin 负责思考和协作，Node runtime 负责落盘和校验。”
