@echo off
REM ============================================================
REM  SnapPro Sound-in-Film Game - LOCK LAPTOP TO 192.168.1.50
REM  Run this ONCE at the booth, AFTER joining the event router
REM  (SSID "SnapPro-Game").  MUST be run as Administrator.
REM  This makes the QR (http://192.168.1.50:3000) always valid.
REM ============================================================
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo  [!] Right-click this file and choose "Run as administrator".
  echo.
  pause
  exit /b
)
set ADAPTER=Wi-Fi
echo Setting %ADAPTER% to static 192.168.1.50 ...
netsh interface ip set address name="%ADAPTER%" static 192.168.1.50 255.255.255.0 192.168.1.1
netsh interface ip set dns     name="%ADAPTER%" static 1.1.1.1
netsh interface ip add  dns    name="%ADAPTER%" 8.8.8.8 index=2
echo.
echo  Done. This laptop is now 192.168.1.50
echo  Verify below (look for IPv4 Address 192.168.1.50):
echo.
ipconfig | findstr /C:"IPv4"
echo.
echo  If the event router hands out a DIFFERENT subnet (e.g. 192.168.0.x),
echo  either set the router LAN to 192.168.1.1, or tell Claude to re-lock the QR.
echo.
pause
