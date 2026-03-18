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

echo "Preparing code-explorer Claude Code plugin..."
echo "Source repo: $REPO_ROOT"
echo "Target dir : $TARGET_DIR"

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"

for relative_path in "${required_paths[@]}"; do
  source_path="$REPO_ROOT/$relative_path"
  if [[ ! -e "$source_path" ]]; then
    echo "Missing required path: $relative_path" >&2
    exit 1
  fi
  cp -R "$source_path" "$TARGET_DIR/$relative_path"
done

echo
echo "Install complete."
echo "Load the plugin with:"
echo "claude --plugin-dir \"$TARGET_DIR\""

if command -v claude >/dev/null 2>&1; then
  echo
  echo "Running post-install smoke test..."
  claude --plugin-dir "$TARGET_DIR" -p "List the available code-explorer slash commands, one per line."
else
  echo
  echo "claude command was not found. Skipping post-install smoke test."
fi
