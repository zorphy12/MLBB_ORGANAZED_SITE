@echo off
title HighLevel Login Portal
cd /d "%~dp0"

echo ========================================
echo    HIGHLEVEL SECURE LOGIN PORTAL
echo ========================================
echo.
echo Launching login page...

if exist "index.html" (
    start "" "index.html"
    echo.
    echo ✓ Login portal opened in your browser
    echo.
    echo Credentials:
    echo   Username: HighLevel123
    echo   Password: HighLevel123
    echo.
    echo The page will redirect to MLbb-Organazed.html
    echo upon successful login.
    echo.
    echo This window will close in 5 seconds...
    timeout /t 5 /nobreak > nul
    exit
) else (
    echo.
    echo ERROR: index.html not found!
    echo.
    echo Required files must be in the same folder:
    echo   - index.html
    echo   - index.css
    echo   - index.js
    echo   - MLbb-Organazed.html
    echo.
    echo Press any key to exit...
    pause > nul
    exit
)