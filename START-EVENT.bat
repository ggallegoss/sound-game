@echo off
title SnapPro Sound-in-Film Game - EVENT MODE - keep this window open
cd /d "%~dp0"
echo.
echo   ================================================================
echo    SnapPro Sound-in-Film Game  -  EVENT MODE
echo   ================================================================
echo    Scan QR      : http://192.168.1.50:3000/   (SnapPro-EVENT-QR.png)
echo    Admin (booth): http://192.168.1.50:3000/admin?key=snappro-admin
echo    Local check  : http://localhost:3000/
echo   ----------------------------------------------------------------
echo    1. Join the event Wi-Fi (SSID SnapPro-Game) FIRST.
echo    2. Run SET-STATIC-IP.bat (as admin) so this laptop = 192.168.1.50
echo    3. This window must stay OPEN the whole event.
echo    4. Export leads from /admin before closing.
echo   ================================================================
echo.
echo   Clearing any stuck server...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul
echo   Confirming this laptop is 192.168.1.50 ...
ipconfig | findstr /C:"192.168.1.50" >nul && (echo   [OK] IP is 192.168.1.50) || (echo   [!!] IP is NOT 192.168.1.50 - run SET-STATIC-IP.bat as admin, or the QR will not work.)
echo.
echo   Starting server... keep this window open.
echo.
node server.mjs
echo.
echo   Server stopped. Press any key to close.
pause >nul
