$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
if (-not $DesktopPath -or -not (Test-Path -LiteralPath $DesktopPath)) {
    $DesktopPath = @(
        (Join-Path $env:OneDrive 'Desktop' -ErrorAction SilentlyContinue),
        (Join-Path $env:USERPROFILE 'Desktop' -ErrorAction SilentlyContinue)
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
}
if (-not $DesktopPath) {
    throw 'The Windows Desktop folder could not be located.'
}
$ShortcutPath = Join-Path -Path $DesktopPath -ChildPath 'ScreenAdvait Desktop.lnk'
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PackagedExe = Join-Path $ProjectRoot 'apps\desktop\release\win-unpacked\ScreenAdvait Enterprise Desktop.exe'
$Launcher = Join-Path $PSScriptRoot 'launch-desktop.ps1'
$Shortcut.TargetPath = (Get-Command powershell.exe).Source
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Launcher`""
$Shortcut.WorkingDirectory = Join-Path $ProjectRoot 'apps\desktop'
$Shortcut.IconLocation = if (Test-Path -LiteralPath $PackagedExe) { "$PackagedExe,0" } else { 'shell32.dll,41' }
$Shortcut.Description = 'ScreenAdvait Enterprise Desktop Platform'
$Shortcut.Save()
Write-Host "Shortcut created at $ShortcutPath"
