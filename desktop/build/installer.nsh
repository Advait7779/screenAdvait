!macro customInit
  nsExec::Exec `taskkill /F /IM "ScreenAdvait Enterprise Desktop.exe"`
!macroend

!macro customInstall
  nsExec::Exec `taskkill /F /IM "ScreenAdvait Enterprise Desktop.exe"`
!macroend
