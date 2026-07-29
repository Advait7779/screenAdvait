$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ApiDirectory = Join-Path $ProjectRoot 'services\api'
$ApiEntryPoint = Join-Path $ApiDirectory 'dist\src\main.js'
$ApiHealthUrl = 'http://127.0.0.1:5000/api/v1/health'
$AppDirectory = Join-Path $ProjectRoot 'apps\desktop'
$PackagedExe = Join-Path $AppDirectory 'release\win-unpacked\ScreenAdvait Enterprise Desktop.exe'
$LocalElectron = Join-Path $AppDirectory 'node_modules\.bin\electron.CMD'

function Test-ScreenAdvaitApi {
    try {
        $response = Invoke-RestMethod -Uri $ApiHealthUrl -TimeoutSec 2
        return $response.status -eq 'ok'
    }
    catch {
        return $false
    }
}

if (-not (Test-ScreenAdvaitApi)) {
    if (-not (Test-Path -LiteralPath $ApiEntryPoint)) {
        Add-Type -AssemblyName PresentationFramework
        [System.Windows.MessageBox]::Show(
            'The ScreenAdvait API has not been built. Run the platform build before opening the desktop client.',
            'ScreenAdvait could not start',
            'OK',
            'Error'
        ) | Out-Null
        exit 1
    }

    $NodeExecutable = (Get-Command node -ErrorAction Stop).Source
    $ApiOutputLog = Join-Path $ApiDirectory 'api-runtime.log'
    $ApiErrorLog = Join-Path $ApiDirectory 'api-runtime-error.log'
    Start-Process `
        -FilePath $NodeExecutable `
        -ArgumentList @('dist/src/main.js') `
        -WorkingDirectory $ApiDirectory `
        -WindowStyle Hidden `
        -RedirectStandardOutput $ApiOutputLog `
        -RedirectStandardError $ApiErrorLog | Out-Null

    $apiReady = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 500
        if (Test-ScreenAdvaitApi) {
            $apiReady = $true
            break
        }
    }

    if (-not $apiReady) {
        Add-Type -AssemblyName PresentationFramework
        [System.Windows.MessageBox]::Show(
            "The ScreenAdvait API could not start. Review:`n$ApiErrorLog",
            'ScreenAdvait could not start',
            'OK',
            'Error'
        ) | Out-Null
        exit 1
    }
}

if (Test-Path -LiteralPath $LocalElectron) {
    Start-Process -FilePath $LocalElectron -ArgumentList '.' -WorkingDirectory $AppDirectory -WindowStyle Normal
    exit 0
}

if (Test-Path -LiteralPath $PackagedExe) {
    Start-Process -FilePath $PackagedExe -WorkingDirectory $AppDirectory -WindowStyle Normal
    exit 0
}

Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show(
    'The ScreenAdvait desktop executable is missing. Build the desktop application and try again.',
    'ScreenAdvait could not start',
    'OK',
    'Error'
) | Out-Null
exit 1
