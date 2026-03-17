#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-$HOME/.claude/plugins/code-explorer}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

required_paths=(
  ".claude-plugin"
  "commands"
  "agents"
  "skills"
  "templates"
  "hooks"
  "scripts"
  "README.md"
  "PLUGIN_STRUCTURE.md"
  "CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md"
)

echo "准备安装 code-explorer Claude Code 插件..."
echo "源目录: $REPO_ROOT"
echo "目标目录: $TARGET_DIR"

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"

for relative_path in "${required_paths[@]}"; do
  source_path="$REPO_ROOT/$relative_path"
  if [[ ! -e "$source_path" ]]; then
    echo "缺少安装所需路径: $relative_path" >&2
    exit 1
  fi
  cp -R "$source_path" "$TARGET_DIR/$relative_path"
done

echo
echo "安装完成。"
echo "推荐通过以下命令加载插件："
echo "claude --plugin-dir \"$TARGET_DIR\""

if command -v claude >/dev/null 2>&1; then
  echo
  echo "开始执行安装后自检..."
  claude --plugin-dir "$TARGET_DIR" -p "列出当前 code-explorer 插件可用的 slash commands 名称，每行一个。"
else
  echo
  echo "未检测到 claude 命令，跳过安装后自检。"
fi
