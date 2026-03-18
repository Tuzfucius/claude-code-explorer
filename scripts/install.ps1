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

Write-Host "Preparing code-explorer Claude Code plugin..." -ForegroundColor Cyan
Write-Host "Source repo: $repoRoot"
Write-Host "Target dir : $TargetDir"

if ((Test-Path $TargetDir) -and -not $Force) {
  throw "Target directory already exists. Use -Force to overwrite it."
}

if (Test-Path $TargetDir) {
  Remove-Item -Recurse -Force $TargetDir
}

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

foreach ($relativePath in $requiredPaths) {
  $sourcePath = Join-Path $repoRoot $relativePath
  if (-not (Test-Path $sourcePath)) {
    throw "Missing required path: $relativePath"
  }

  $destinationPath = Join-Path $TargetDir $relativePath
  $destinationParent = Split-Path -Parent $destinationPath
  if ($destinationParent) {
    New-Item -ItemType Directory -Force -Path $destinationParent | Out-Null
  }

  Copy-Item -Recurse -Force $sourcePath $destinationPath
}

Write-Host ""
Write-Host "Install complete." -ForegroundColor Green
Write-Host "Load the plugin with:"
Write-Host "claude --plugin-dir `"$TargetDir`""

if (-not $SkipSmokeTest) {
  $claude = Get-Command claude -ErrorAction SilentlyContinue
  if ($null -eq $claude) {
    Write-Warning "claude command was not found. Skipping post-install smoke test."
    exit 0
  }

  Write-Host ""
  Write-Host "Running post-install smoke test..." -ForegroundColor Cyan
  $output = & claude --plugin-dir $TargetDir -p "List the available code-explorer slash commands, one per line."
  Write-Host $output
}
