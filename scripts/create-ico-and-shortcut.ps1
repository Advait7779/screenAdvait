Add-Type -AssemblyName System.Drawing

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$pngPath = Join-Path $ProjectRoot "apps\desktop\public\logo.png"
$icoPath = Join-Path $ProjectRoot "apps\desktop\public\icon.ico"

# Convert PNG to ICO
$bmp = [System.Drawing.Bitmap]::FromFile($pngPath)
$thumb = $bmp.GetThumbnailImage(128, 128, $null, [IntPtr]::Zero)
$hIcon = ([System.Drawing.Bitmap]$thumb).GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$fs = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$bmp.Dispose()
$thumb.Dispose()

Write-Host "ICO icon created at $icoPath"

# Update Windows Desktop Shortcut
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
$PackagedExe = Join-Path $ProjectRoot 'apps\desktop\release\win-unpacked\ScreenAdvait Enterprise Desktop.exe'
$Launcher = Join-Path $PSScriptRoot 'launch-desktop.ps1'
$Shortcut.TargetPath = (Get-Command powershell.exe).Source
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Launcher`""
$Shortcut.WorkingDirectory = Join-Path $ProjectRoot 'apps\desktop'
$Shortcut.IconLocation = if (Test-Path -LiteralPath $PackagedExe) { "$PackagedExe,0" } else { "$icoPath,0" }
$Shortcut.Description = 'ScreenAdvait Enterprise Desktop Platform'
$Shortcut.Save()

Write-Host "Shortcut icon updated at $ShortcutPath"
