# 部署说明

本文档说明如何把 `code-explorer` 部署给其他 Claude Code 用户。

## 推荐发布基线

从现在开始，`main` 应作为默认发布分支。

在本地开发或打包前，优先确认：

```powershell
git branch --show-current
```

如果输出不是 `main`，先切回正确分支再发布。

## 方式一：直接安装当前仓库

### Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

如需覆盖已安装版本：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -Force
```

### macOS / Linux

```bash
bash ./scripts/install.sh
```

默认会安装到：

- Windows: `%USERPROFILE%\.claude\plugins\code-explorer`
- macOS / Linux: `~/.claude/plugins/code-explorer`

安装完成后，推荐用以下命令加载：

```powershell
claude --plugin-dir "$HOME\.claude\plugins\code-explorer"
```

## 方式二：作为压缩包分发

如果要给不熟悉 Git 的用户分发，建议直接打包以下内容：

- `.claude-plugin/`
- `commands/`
- `agents/`
- `skills/`
- `templates/`
- `hooks/`
- `scripts/`
- `README.md`
- `PLUGIN_STRUCTURE.md`
- `CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md`

解压后执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

## 安装后自检

安装脚本会自动尝试运行以下检查：

```powershell
claude --plugin-dir "<安装目录>" -p "列出当前 code-explorer 插件可用的 slash commands 名称，每行一个。"
```

如果输出中包含以下命令，说明安装成功：

- `code-explorer:code-explorer`
- `code-explorer:code-explorer-quick-tour`
- `code-explorer:code-explorer-deep-course`
- `code-explorer:code-explorer-status`
- `code-explorer:code-explorer-verify`

## 对外说明建议

对外发布时，部署说明尽量只保留三步：

1. 下载或克隆仓库
2. 运行安装脚本
3. 执行自检命令
