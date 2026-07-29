param(
  [string]$ComposeFile = "docker/docker-compose.production.yml",
  [int]$KeepDays = 14
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backupRoot = Join-Path $projectRoot ".backups"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveName = "screenadvait-$timestamp.dump"
$archivePath = Join-Path $backupRoot $archiveName
$containerPath = "/tmp/$archiveName"

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

docker compose -f (Join-Path $projectRoot $ComposeFile) exec -T postgres `
  pg_dump -U screenadvait -d screenadvait -Fc -f $containerPath
if ($LASTEXITCODE -ne 0) { throw "PostgreSQL backup failed." }

docker cp "screenadvait-postgres:$containerPath" $archivePath
if ($LASTEXITCODE -ne 0) { throw "Could not copy the PostgreSQL backup from the container." }

docker compose -f (Join-Path $projectRoot $ComposeFile) exec -T postgres `
  rm -f $containerPath

$resolvedBackupRoot = (Resolve-Path $backupRoot).Path
Get-ChildItem -LiteralPath $resolvedBackupRoot -Filter "screenadvait-*.dump" -File |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } |
  ForEach-Object {
    if ($_.FullName.StartsWith($resolvedBackupRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      Remove-Item -LiteralPath $_.FullName -Force
    }
  }

Write-Host "Backup created: $archivePath"
