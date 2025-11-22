@echo off
setlocal enabledelayedexpansion

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

REM Change to that directory
cd /d "%SCRIPT_DIR%"

REM Check if we're in the unpacked directory or need to go there
if exist "Browser Manager.exe" (
    start "" "Browser Manager.exe"
) else if exist "win-unpacked\Browser Manager.exe" (
    cd win-unpacked
    start "" "Browser Manager.exe"
) else (
    echo Error: Could not find "Browser Manager.exe"
    echo Please make sure you extracted the ZIP file correctly.
    pause
)
