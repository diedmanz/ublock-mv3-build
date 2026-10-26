@echo off
rem ===========================================================================
rem  Ad-blocking browser (uBlock Origin Lite - enhanced build)
rem  - portable: uses the folder this script lives in, no fixed drive letters
rem  - starts Chrome for Testing with the unpacked extension
rem  - opens the extension's register.html so the scriptlets are registered
rem    (Chrome only exposes the userScripts API to extensions that have the
rem     "Allow User Scripts" permission; see README-PORTABLE.md)
rem ===========================================================================
setlocal

set "ROOT=%~dp0"
set "EXT=%ROOT%uBOLite_adhider"
set "PROFILE=%ROOT%profile-lite"
set "CHROME=%ROOT%cft-chrome\chrome.exe"

if not exist "%CHROME%" (
    echo [ERROR] Chrome for Testing not found: "%CHROME%"
    echo         Copy the whole folder to the other machine, including cft-chrome.
    pause
    exit /b 1
)
if not exist "%EXT%" (
    echo [ERROR] Extension folder not found: "%EXT%"
    pause
    exit /b 1
)
if not exist "%PROFILE%" mkdir "%PROFILE%" >nul 2>&1

rem --- compute the extension id from its path (same algorithm as Chrome) ---
set "EXTID="
for /f "usebackq delims=" %%i in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%Compute-ExtensionId.ps1" -Path "%EXT%" 2^>nul`) do set "EXTID=%%i"
if not defined EXTID (
    echo [ERROR] Cannot resolve the extension path.
    pause
    exit /b 1
)

echo [i] extension path : %EXT%
echo [i] extension id   : %EXTID%
echo [i] profile        : %PROFILE%

start "" "%CHROME%" ^
    --user-data-dir="%PROFILE%" ^
    --profile-directory=Default ^
    --load-extension="%EXT%" ^
    --disable-extensions-except="%EXT%" ^
    --no-first-run ^
    --no-default-browser-check

rem --- give the extension a moment to start, then register the scriptlets ---
timeout /t 7 /nobreak >nul
start "" "chrome-extension://%EXTID%/register.html"

endlocal
exit
