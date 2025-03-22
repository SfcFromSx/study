@echo off
echo Starting Space Quiz Shooter...

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% == 0 (
    echo Starting Node.js server on port 8080...
    node server.js
) else (
    echo Node.js not found. Opening the game directly in the default browser...
    start index.html
) 