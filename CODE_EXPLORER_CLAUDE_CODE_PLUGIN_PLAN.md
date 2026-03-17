# Code Explorer 原生 Claude Code 插件方案

## 当前结论

`code-explorer` 不再保留旧版本地 CLI / TypeScript runtime 作为主实现。

当前方向已经明确收敛为：

- 完全采用 Claude Code 原生插件结构
- 所有工作流通过 slash commands、agents、skills 组织
- 状态文件与学习文档直接由 Claude 在仓库内维护
- 不再依赖外部 `code-explorer run` 这类命令作为核心执行路径

## 为什么放弃旧逻辑

旧版设计的问题不在“五阶段”本身，而在执行方式：

1. 它把 Claude 退化成模板填充器
2. 它把任务上下文切得过碎，破坏全局理解
3. 它过度依赖本地脚本拼接和聚合
4. 它让最终文档更像流水线产物，而不是教学材料

这些问题会直接导致文档：

- 列举化
- 泛化
- 重复
- 缺少亮点
- 缺少“为什么”

## 当前保留的核心思想

保留的不是旧实现，而是旧目标：

1. 五阶段工作流
2. `.code-explorer/` 工作区
3. XML 状态文件流转
4. 面向学习者的多文档交付

## 当前插件结构

```text
code-explorer/
├─ .claude-plugin/
│  ├─ plugin.json
│  └─ README.md
├─ commands/
│  ├─ code-explorer.md
│  ├─ code-explorer-quick-tour.md
│  ├─ code-explorer-deep-course.md
│  ├─ code-explorer-status.md
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
│  ├─ code-explorer-workspace/
│  │  └─ SKILL.md
│  └─ code-explorer-output-style/
│     └─ SKILL.md
├─ hooks/
│  └─ README.md
├─ scripts/
│  └─ README.md
└─ README.md
```

## 当前工作流分工

### commands

负责拉起工作流：

- `/code-explorer`
- `/code-explorer-quick-tour`
- `/code-explorer-deep-course`
- `/code-explorer-status`
- `/code-explorer-verify`

### agents

负责专业分工：

- `scout`：全局调研
- `orchestrator`：问题驱动的任务规划
- `module-analyst`：模块讲解
- `flow-analyst`：主链路追踪
- `architect`：架构与亮点提炼
- `writer`：文档重写
- `reviewer`：质量审稿

### skills

负责统一约束：

- `code-explorer-workspace`：工作区目录和 XML 状态文件写法
- `code-explorer-output-style`：教学型输出风格

## 五阶段现在如何实现

### 阶段 0：映射与索引

由主 command 直接在 Claude Code 中执行：

- 读取 `.gitignore`
- 浏览仓库结构
- 写入 `INDEX_MAP.xml`
- 写入 `PHASE_0_MAP_STATUS.xml`

### 阶段 1：调研与规划

通过 `scout` 和 `orchestrator` 完成：

- 先生成 `PROJECT_BRIEF.md`
- 再生成三波任务 XML

### 阶段 2：波次执行

通过 `module-analyst` 与 `flow-analyst` 分波次完成：

- 每个任务一个干净 agent 上下文
- 写入独立 `*_SUMMARY.md`

### 阶段 3：架构与亮点

通过 `architect` 完成：

- `SYSTEM_ARCHITECTURE.md`
- `HIGHLIGHTS.md`

### 阶段 4：交付与校验

通过 `writer` 与 `reviewer` 完成：

- 首页、索引、学习路径、术语表
- 质量报告

## 当前设计原则

1. Claude 主导理解与写作
2. commands 负责编排
3. agents 负责分工
4. skills 负责约束
5. 不再引入本地 runtime 作为前提

## 本地测试方式

```powershell
claude --plugin-dir E:\Project\code-explorer
```

进入后可直接调用：

```text
/code-explorer .
/code-explorer-quick-tour .
/code-explorer-deep-course .
/code-explorer-status .
/code-explorer-verify .
```

## 后续重点

后续优化不再是“补 CLI 功能”，而是：

1. 提高 command 的编排质量
2. 优化 agents 的职责边界
3. 收紧教学文档输出规范
4. 增加更强的文档审稿与重写策略

这才是 `code-explorer` 的长期方向。
