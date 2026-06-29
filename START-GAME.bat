@echo off
title SnapPro Sound Game Server - keep this window open
cd /d "%~dp0"
echo.
echo   Clearing any stuck server...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul
echo.
echo   Starting the SnapPro Sound-in-Film game...
echo   Player : http://localhost:3000/
echo   Admin  : http://localhost:3000/admin?key=snappro-admin
echo   Tuner  : http://localhost:3000/wheel-tune.html
echo.
echo   Keep this window OPEN while you use the game.
echo   Close it (or press Ctrl+C) to stop the server.
echo.
node server.mjs
echo.
echo   Server stopped. Press any key to close.
pause >nul
