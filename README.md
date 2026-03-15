# code-explorer

`code-explorer` 是一个面向 Claude Code 的本地 CLI，用于对全新代码仓库执行五阶段分析流程，生成可学习、可导航的 Markdown 文档库。

## 当前范围

- `init`：生成默认配置与 Claude Code 集成文件
- `run`：执行五阶段工作流
- `status`：读取状态文件并展示进度
- `verify`：校验最终文档、链接与 Mermaid 语法

## 开发

```bash
npm install
npm run build
npm test
```

## 输出目录

运行时会将中间状态和最终文档写入目标仓库下的 `.code-explorer/` 目录，不会修改目标仓库业务源码。

