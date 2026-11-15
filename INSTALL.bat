@echo off
rem ===========================================================================
rem  INSTALLER: uBlock Origin Lite Enhanced (portable)
rem  - Downloads/releases: just run this file
rem  - Installs to %LOCALAPPDATA%\uBOLite-Enhanced
rem  - Creates Start Menu + Desktop shortcuts
rem ===========================================================================
setlocal EnableDelayedExpansion

set "TARGET=%LOCALAPPDATA%\uBOLite-Enhanced"
set "REPO=https://github.com/%~1/archive/refs/heads/main.zip"
if "%~1"=="" set "REPO=https://github.com/diedmanz/ublock-mv3-build/archive/refs/heads/main.zip"

echo ============================================================
echo  uBlock Origin Lite Enhanced - Installer
echo ============================================================
echo.
echo Target folder: %TARGET%
echo.

if exist "%TARGET%" (
    echo [i] Found existing installation. Updating...
    rmdir /s /q "%TARGET%" 2>nul
)

echo [i] Downloading source...
powershell -NoProfile -Command ^
    "try { Invoke-WebRequest -Uri '%REPO%' -OutFile '%TEMP%\ubolite-src.zip' } ^
     catch { Write-Error 'Download failed: $_'; exit 1 }" || (
    echo [ERROR] Cannot download. Check the repository URL.
    echo         Edit this file and change YOUR-USERNAME/YOUR-REPO
    pause
    exit /b 1
)

echo [i] Extracting...
powershell -NoProfile -Command ^
    "Expand-Archive -Path '%TEMP%\ubolite-src.zip' -DestinationPath '%TARGET%' -Force" || (
    echo [ERROR] Extract failed.
    pause
    exit /b 1
)

rem Find the extracted folder (github adds -main suffix)
for /d %%i in ("%TARGET%\*") do set "SRC=%%i"
if not defined SRC (
    echo [ERROR] Extracted folder not found.
    pause
    exit /b 1
)

echo [i] Building extension (requires Node.js + Python + jq)...
echo [i] If this fails, install: Node.js (LTS), Python 3.11+, jq (choco install jq)
cd /d "%SRC%"
if not exist "tools\make-mv3.sh" (
    echo [ERROR] Source structure not as expected.
    pause
    exit /b 1
)

rem Quick check for prerequisites
where node >nul 2>nul || (echo [WARN] Node.js not in PATH & goto :skipbuild)
where python >nul 2>nul || (echo [WARN] Python not in PATH & goto :skipbuild)
where jq >nul 2>nul || (echo [WARN] jq not in PATH & goto :skipbuild)

bash tools/make-mv3.sh chromium
if errorlevel 1 (
    echo [WARN] Build failed. You can still use the pre-built version below.
    goto :skipbuild
)

:skipbuild
echo [i] Preparing portable runtime...
mkdir "%TARGET%\runtime" 2>nul
xcopy /E /I /Y /Q "%SRC%\dist\build\uBOLite.chromium" "%TARGET%\runtime\uBOLite_adhider" 2>nul
if not exist "%TARGET%\runtime\uBOLite_adhider\manifest.json" (
    echo [i] No fresh build found. Downloading pre-built release...
    powershell -NoProfile -Command ^
        "try { Invoke-WebRequest -Uri 'https://github.com/%~1/releases/latest/download/uBOLite_adhider.zip' -OutFile '%TEMP%\prebuilt.zip'; ^
               Expand-Archive -Path '%TEMP%\prebuilt.zip' -DestinationPath '%TARGET%\runtime' -Force } ^
         catch { Write-Host 'Pre-built not available: $_' }"
)

rem Copy Chrome for Testing (portable)
echo [i] Downloading Chrome for Testing...
powershell -NoProfile -Command ^
    "try { ^
        $url = 'https://storage.googleapis.com/chrome-for-testing-public/156.0.8078.47/win64/chrome-win64.zip'; ^
        Invoke-WebRequest -Uri $url -OutFile '%TEMP%\cft.zip'; ^
        Expand-Archive -Path '%TEMP%\cft.zip' -DestinationPath '%TARGET%' -Force; ^
        Move-Item '%TARGET%\chrome-win64' '%TARGET%\cft-chrome' -Force; ^
     } catch { Write-Host 'CFT download failed: $_' }"

rem Copy config + launcher scripts
copy /Y "%SRC%\uBOL-config.json" "%TARGET%\" 2>nul
copy /Y "%SRC%\filter-lists.txt" "%TARGET%\" 2>nul
copy /Y "%SRC%\README-PORTABLE.md" "%TARGET%\" 2>nul
copy /Y "%SRC%\Compute-ExtensionId.ps1" "%TARGET%\" 2>nul

rem Create the portable launcher
(
echo @echo off
echo rem ===========================================================================
echo rem  uBlock Origin Lite Enhanced - Portable Launcher
echo rem ===========================================================================
echo setlocal
echo.
echo set "ROOT=%%~dp0"
echo set "EXT=%%ROOT%%runtime\uBOLite_adhider"
echo set "PROFILE=%%ROOT%%profile"
echo set "CHROME=%%ROOT%%cft-chrome\chrome.exe"
echo.
echo if not exist "%%CHROME%%" (
echo     echo [ERROR] Chrome for Testing not found.
echo     echo         Run this installer again, or download manually from:
echo     echo         https://storage.googleapis.com/chrome-for-testing-public/156.0.8078.47/win64/chrome-win64.zip
echo     pause
echo     exit /b 1
echo )
echo if not exist "%%EXT%%\manifest.json" (
echo     echo [ERROR] Extension not found at %%EXT%%
echo     pause
echo     exit /b 1
echo )
echo if not exist "%%PROFILE%%" mkdir "%%PROFILE%%" ^>nul 2^>^&1
echo.
echo rem --- compute extension id (Chrome algorithm: SHA-256 of path as UTF-16LE) ---
echo for /f "usebackq delims=" %%%%i in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%%ROOT%%Compute-ExtensionId.ps1" -Path "%%EXT%%" 2^>nul`) do set "EXTID=%%%%i"
echo if not defined EXTID (
echo     echo [ERROR] Cannot compute extension ID.
echo     pause
echo     exit /b 1
echo )
echo.
echo echo [i] Starting uBOLite Enhanced...
echo echo [i] Extension ID: %%EXTID%%
echo.
echo start "" "%%CHROME%%" ^
echo     --user-data-dir="%%PROFILE%%" ^
echo     --profile-directory=Default ^
echo     --load-extension="%%EXT%%" ^
echo     --disable-extensions-except="%%EXT%%" ^
echo     --no-first-run ^
echo     --no-default-browser-check
echo.
echo timeout /t 5 /nobreak ^>nul
echo start "" "chrome-extension://%%EXTID%%/register.html"
echo.
echo endlocal
) > "%TARGET%\Start-uBOLite-Enhanced.cmd"

rem Create shortcuts
echo [i] Creating shortcuts...
powershell -NoProfile -Command ^
    "$ws = New-Object -ComObject WScript.Shell; ^
     $s = $ws.CreateShortcut('%USERPROFILE%\Desktop\uBlock Origin Lite Enhanced.lnk'); ^
     $s.TargetPath = '%TARGET%\Start-uBOLite-Enhanced.cmd'; ^
     $s.WorkingDirectory = '%TARGET%'; ^
     $s.IconLocation = '%TARGET%\cft-chrome\chrome.exe,0'; ^
     $s.Description = 'uBlock Origin Lite Enhanced - Ad-free browsing for Thai streaming sites'; ^
     $s.Save(); ^
     $s2 = $ws.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\uBlock Origin Lite Enhanced.lnk'); ^
     $s2.TargetPath = '%TARGET%\Start-uBOLite-Enhanced.cmd'; ^
     $s2.WorkingDirectory = '%TARGET%'; ^
     $s2.IconLocation = '%TARGET%\cft-chrome\chrome.exe,0'; ^
     $s2.Save()"

echo.
echo ============================================================
echo  INSTALL COMPLETE
echo ============================================================
echo.
echo Installed to: %TARGET%
echo.
echo Next time, just double-click:
echo   - Desktop shortcut: "uBlock Origin Lite Enhanced"
echo   - Or run: %TARGET%\Start-uBOLite-Enhanced.cmd
echo.
echo First run will ask: "Allow User Scripts" -> click ALLOW (one time only)
echo.
pause