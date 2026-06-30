@echo off
title SnapPro - GO LIVE
cd /d "%~dp0"
echo Clearing old processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1
timeout /t 2 /nobreak >nul
if exist cf.log del cf.log
echo Starting game server...
start "SnapPro Server" cmd /k "node server.mjs"
timeout /t 3 /nobreak >nul
echo Opening public link (Cloudflare)...
start "SnapPro Public Link" cmd /k "cloudflared.exe tunnel --url http://localhost:3000 --no-autoupdate > cf.log 2>&1"
echo.
echo Getting your public link, please wait...
:wait
timeout /t 2 /nobreak >nul
if not exist cf.log goto wait
findstr /C:"trycloudflare.com" cf.log >nul 2>&1
if errorlevel 1 goto wait

rem --- extract the https://*.trycloudflare.com URL from the log line ---
rem the banner line is:  ...INF |  https://xxx.trycloudflare.com   |
rem so split on the literal pipe, then take the first space-token of that field
set "URL="
for /f "tokens=2 delims=|" %%a in ('findstr /C:"https://" cf.log') do (
  for /f "tokens=1" %%b in ("%%a") do set "URL=%%b"
)

echo %URL%> LIVE-URL.txt
echo.
echo Generating matching QR code...
curl -s -o "SnapPro-LIVE-QR.png" "https://api.qrserver.com/v1/create-qr-code/?size=620x620&margin=24&data=%URL%"

echo.
echo ==================================================================
echo   YOUR LIVE LINK -- open on your phone / send to Jordan:
echo.
echo      %URL%
echo.
echo   QR saved to: %~dp0SnapPro-LIVE-QR.png  (opening now)
echo   On this PC:  http://localhost:3000/
echo   Keep ALL windows open and the PC awake.
echo ==================================================================
echo.
start "" "SnapPro-LIVE-QR.png"
start "" "%URL%"
pause
