@echo off
title SnapPro Game - FRESH EVENT START (erases previous plays)
cd /d "%~dp0"
echo.
echo   ============================================================
echo     FRESH EVENT START
echo   ============================================================
echo.
echo   This ERASES all previous plays and RESTARTS the prize clock
echo   so the 7 Amazon Alexas pace evenly across the next 4 hours
echo   (6-10pm) starting RIGHT NOW.
echo.
echo   ^>^> Run this ONCE, the moment you open to attendees. ^<^<
echo.
echo   Do NOT run it again during the event (that would wipe leads).
echo   To restart mid-event WITHOUT losing data, use START-GAME.bat.
echo.
echo   Press any key to start fresh now, or close this window to cancel.
pause >nul
echo.
echo   Clearing any stuck server...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul
echo   Resetting plays and prize schedule...
if exist "data\state.json" del /f /q "data\state.json"
echo.
echo   Starting the game (clock starts now)...
echo   Player : http://localhost:3000/
echo   Admin  : http://localhost:3000/admin?key=snappro-admin
echo.
echo   Keep this window OPEN for the whole event.
echo.
node server.mjs
echo.
echo   Server stopped. Press any key to close.
pause >nul
