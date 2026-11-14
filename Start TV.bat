@echo off
rem Double-click to run the simulator full screen in TV mode on Windows, with sound.
rem Opens on the main display: make the TV your main display, or duplicate the screens.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\serve.ps1" -Tv
