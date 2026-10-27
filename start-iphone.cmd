@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 24 from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)
node -e "if (Number(process.versions.node.split('.')[0]) !== 24) process.exit(1)"
if errorlevel 1 (
  echo This project requires Node.js 24. Install it from https://nodejs.org/
  pause
  exit /b 1
)
echo Installing project dependencies...
call npm ci
if errorlevel 1 (
  echo Installation failed. See the error above.
  pause
  exit /b 1
)
echo.
echo Install Expo Go on your iPhone and connect it to the same Wi-Fi as this PC.
echo Scan the QR code below with the iPhone Camera app.
echo Keep this window open while using the app.
call npm start -- --lan
pause
