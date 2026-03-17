# .claude-plugin

该目录存放 Claude Code 插件元数据。

## 当前文件

- `plugin.json`
  - 插件名称、版本、描述、作者信息

## 用途

Claude Code 通过该目录识别插件的基础信息。当前仓库的主要行为定义仍然位于：

- `commands/`
- `agents/`
- `skills/`
- `templates/`

`.claude-plugin/` 只负责声明插件身份，不承担工作流逻辑。

## 本地调试

推荐通过以下方式加载当前仓库：

```powershell
claude --plugin-dir <code-explorer-repo-path>
```

例如：

```powershell
claude --plugin-dir E:\Project\code-explorer
```

加载后，可在 Claude Code 中直接使用 `/code-explorer` 系列命令。
