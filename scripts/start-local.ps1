param(
    [ValidateSet('Production', 'Development')][string]$Mode = 'Production',
    [switch]$Rebuild,
    [int]$Port = 3002
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $projectRoot 'apps\web'
$runtimeRoot = Join-Path $webRoot '.next\standalone'
$runtimeWeb = Join-Path $runtimeRoot 'apps\web'
$serverFile = Join-Path $runtimeWeb 'server.js'
Set-Location -LiteralPath $projectRoot
if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) {
    throw "Port $Port is already in use. Close the existing server or specify -Port."
}
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) { throw 'Bun is required. Install Bun first.' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js is required. Install Node.js first.' }
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules'))) {
    bun install --frozen-lockfile --backend=copy
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}
if (-not (Test-Path -LiteralPath (Join-Path $webRoot '.env.local'))) {
    Copy-Item -LiteralPath (Join-Path $webRoot '.env.example') -Destination (Join-Path $webRoot '.env.local')
}
Set-Location -LiteralPath $webRoot
if ($Mode -eq 'Development') {
    bun run dev -- -p $Port --hostname 127.0.0.1
    exit $LASTEXITCODE
}
if ($Rebuild -or -not (Test-Path -LiteralPath $serverFile)) {
    bun run build
    if ($LASTEXITCODE -ne 0) { throw 'Build failed. Server was not started.' }
}
Copy-Item -LiteralPath (Join-Path $webRoot 'public') -Destination $runtimeWeb -Recurse -Force
Copy-Item -LiteralPath (Join-Path $webRoot '.next\static') -Destination (Join-Path $runtimeWeb '.next') -Recurse -Force
$env:PORT = "$Port"
$env:HOSTNAME = '127.0.0.1'
$env:NODE_ENV = 'production'
$env:NEXT_TELEMETRY_DISABLED = '1'
Write-Host "Editing Desk: http://localhost:$Port/projects"
node --env-file=.env.local $serverFile
exit $LASTEXITCODE
