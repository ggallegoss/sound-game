@echo off
REM ============================================================
REM  Revert the Wi-Fi adapter back to automatic (DHCP).
REM  Run this AFTER the event to restore normal internet.
REM  Run as Administrator.
REM ============================================================
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo  [!] Right-click and "Run as administrator".
  pause
  exit /b
)
set ADAPTER=Wi-Fi
echo Restoring %ADAPTER% to automatic (DHCP) ...
netsh interface ip set address name="%ADAPTER%" dhcp
netsh interface ip set dns     name="%ADAPTER%" dhcp
echo  Done. Wi-Fi is back to automatic.
pause
