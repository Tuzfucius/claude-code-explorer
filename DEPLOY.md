# 部署说明 | Deployment Guide

本文档说明如何把 `code-explorer` 部署给其他 Claude Code 用户。  
This document explains how to deploy `code-explorer` for other Claude Code users.

## 推荐发布基线 | Recommended Release Baseline

当前仓库默认发布基线应为稳定主干分支。发布前先确认当前分支：  
Use a stable mainline branch as release baseline. Check the current branch before publishing:

```powershell
git branch --show-current
```

## 方式一：直接安装当前仓库 | Option 1: Install from Current Repository

### Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

覆盖已安装版本：  
To overwrite existing installation:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -Force
```

### macOS / Linux

```bash
bash ./scripts/install.sh
```

默认安装位置 / Default install paths:

- Windows: `%USERPROFILE%\.claude\plugins\code-explorer`
- macOS / Linux: `~/.claude/plugins/code-explorer`

安装后加载插件：  
Load plugin after install:

```powershell
claude --plugin-dir "$HOME\.claude\plugins\code-explorer"
```

## 方式二：压缩包分发 | Option 2: Distribute as Archive

给非 Git 用户分发时，建议打包以下内容：  
For users unfamiliar with Git, package these paths:

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

解压后执行安装脚本：  
After extraction, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

## 安装后自检 | Post-install Self Check

```powershell
claude --plugin-dir "<安装目录>" -p "列出当前 code-explorer 插件可用的 slash commands 名称，每行一个。"
```

如果输出包含以下命令，说明安装成功：  
Installation is successful if output includes:

- `code-explorer:code-explorer`
- `code-explorer:code-explorer-quick-tour`
- `code-explorer:code-explorer-deep-course`
- `code-explorer:code-explorer-status`
- `code-explorer:code-explorer-verify`

## 对外说明建议 | External Communication Checklist

建议对外文档保持三步：  
Keep public deployment docs in three steps:

1. 下载或克隆仓库 / Download or clone the repository
2. 运行安装脚本 / Run installation script
3. 执行自检命令 / Run verification command
