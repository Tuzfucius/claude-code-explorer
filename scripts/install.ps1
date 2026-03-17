param(
  [string]$TargetDir = "$HOME\.claude\plugins\code-explorer",
  [switch]$Force,
  [switch]$SkipSmokeTest
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir

$requiredPaths = @(
  ".claude-plugin",
  "commands",
  "agents",
  "skills",
  "templates",
  "hooks",
  "scripts",
  "README.md",
  "PLUGIN_STRUCTURE.md",
  "CODE_EXPLORER_CLAUDE_CODE_PLUGIN_PLAN.md"
)

Write-Host "准备安装 code-explorer Claude Code 插件..." -ForegroundColor Cyan
Write-Host "源目录: $repoRoot"
Write-Host "目标目录: $TargetDir"

if ((Test-Path $TargetDir) -and -not $Force) {
  throw "目标目录已存在。若要覆盖安装，请追加 -Force。"
}

if (Test-Path $TargetDir) {
  Remove-Item -Recurse -Force $TargetDir
}

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

foreach ($relativePath in $requiredPaths) {
  $sourcePath = Join-Path $repoRoot $relativePath
  if (-not (Test-Path $sourcePath)) {
    throw "缺少安装所需路径: $relativePath"
  }

  $destinationPath = Join-Path $TargetDir $relativePath
  $destinationParent = Split-Path -Parent $destinationPath
  if ($destinationParent) {
    New-Item -ItemType Directory -Force -Path $destinationParent | Out-Null
  }

  Copy-Item -Recurse -Force $sourcePath $destinationPath
}

Write-Host ""
Write-Host "安装完成。" -ForegroundColor Green
Write-Host "推荐通过以下命令加载插件："
Write-Host "claude --plugin-dir `"$TargetDir`""

if (-not $SkipSmokeTest) {
  $claude = Get-Command claude -ErrorAction SilentlyContinue
  if ($null -eq $claude) {
    Write-Warning "未检测到 claude 命令，跳过安装后自检。"
    exit 0
  }

  Write-Host ""
  Write-Host "开始执行安装后自检..." -ForegroundColor Cyan
  $output = & claude --plugin-dir $TargetDir -p "列出当前 code-explorer 插件可用的 slash commands 名称，每行一个。"
  Write-Host $output
}
