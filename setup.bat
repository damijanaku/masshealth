@echo off
setlocal enabledelayedexpansion
color 0A
title MassHealth Development Setup - Main Menu

:menu
cls
echo ========================================
echo    MassHealth Development Setup
echo ========================================
echo.
echo 1. Backend Terminal
echo 2. Frontend Terminal - Device Tunnel
echo 3. Frontend Terminal - Emulator
echo 4. Run MQTT Docker
echo 5. Exit
echo.
set /p choice="Select an option (1-5): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend_tunnel
if "%choice%"=="3" goto frontend_emulator
if "%choice%"=="4" goto mqtt_docker
if "%choice%"=="5" goto exit
if /i "%choice%"=="q" goto exit

echo Invalid option. Please try again.
timeout /t 2 >nul
goto menu

:backend
echo.
echo Starting Backend Setup...
echo.
set /p device_type="Use Emulator or Physical Device? (e/p): "

if /i "%device_type%"=="e" (
    set SERVER_CMD=python manage.py runserver
) else (
    set SERVER_CMD=python manage.py runserver 0.0.0.0:8000
)

REM Create a temporary batch file for backend
echo @echo off > temp_backend.bat
echo color 0B >> temp_backend.bat
echo title Backend Server >> temp_backend.bat
echo echo [BACKEND] Creating virtual environment... >> temp_backend.bat
echo python -m venv venv >> temp_backend.bat
echo echo [BACKEND] Activating virtual environment... >> temp_backend.bat
echo call venv\Scripts\activate >> temp_backend.bat
echo echo [BACKEND] Upgrading pip... >> temp_backend.bat
echo python -m pip install --upgrade pip >> temp_backend.bat
echo echo [BACKEND] Installing requirements... >> temp_backend.bat
echo pip install -r requirements.txt >> temp_backend.bat
echo echo [BACKEND] Changing to backend directory... >> temp_backend.bat
echo cd backend >> temp_backend.bat
echo echo [BACKEND] Running migrations... >> temp_backend.bat
echo python manage.py migrate >> temp_backend.bat
echo echo [BACKEND] Populating muscle groups... >> temp_backend.bat
echo python manage.py populate_muscle_groups >> temp_backend.bat
echo echo [BACKEND] Populating workouts... >> temp_backend.bat
echo python manage.py populate_workouts >> temp_backend.bat
echo echo [BACKEND] Pulling from Supabase... >> temp_backend.bat
echo python manage.py pull_from_supabase --full >> temp_backend.bat
echo echo [BACKEND] Syncing to Supabase... >> temp_backend.bat
echo python manage.py sync_to_supabase --full >> temp_backend.bat
echo echo. >> temp_backend.bat
echo echo [BACKEND] Starting Django server... >> temp_backend.bat
echo %SERVER_CMD% >> temp_backend.bat
echo echo. >> temp_backend.bat
echo echo Server stopped or failed to start. >> temp_backend.bat
echo pause >> temp_backend.bat
echo del "%%~f0" ^& exit >> temp_backend.bat

start cmd /c temp_backend.bat

echo.
echo Backend terminal opened in new window!
echo.
pause
goto menu

:frontend_tunnel
echo.
echo Starting Frontend Setup with Device Tunnel...
echo.

REM Extract IP address from ipconfig
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP_RAW=%%a
    REM Trim leading spaces
    for /f "tokens=* delims= " %%b in ("!IP_RAW!") do set LOCAL_IP=%%b
    goto :ip_found
)

:ip_found
echo Detected IP Address: %LOCAL_IP%
echo.

REM Create a temporary batch file for frontend tunnel
echo @echo off > temp_frontend_tunnel.bat
echo color 0D >> temp_frontend_tunnel.bat
echo title Frontend - Device Tunnel >> temp_frontend_tunnel.bat
echo echo [FRONTEND] Changing to masshealth-exercise directory... >> temp_frontend_tunnel.bat
echo cd masshealth-exercise >> temp_frontend_tunnel.bat
echo echo [FRONTEND] Installing npm packages... >> temp_frontend_tunnel.bat
echo call npm install >> temp_frontend_tunnel.bat
echo echo [FRONTEND] Updating API configuration with IP: %LOCAL_IP% >> temp_frontend_tunnel.bat
echo powershell -Command "(Get-Content api.ts) -replace 'const baseURL = \"http://[0-9.]+:[0-9]+\"', 'const baseURL = \"http://%LOCAL_IP%:8000\"' | Set-Content api.ts" >> temp_frontend_tunnel.bat
echo echo [FRONTEND] Updating backend ALLOWED_HOSTS... >> temp_frontend_tunnel.bat
echo cd ..\backend\core >> temp_frontend_tunnel.bat
echo powershell -Command "$content = Get-Content settings.py; $lineNum = 0; $newContent = @(); foreach($line in $content) { $lineNum++; if($lineNum -eq 33) { $newContent += \"    '%LOCAL_IP%',\" } else { $newContent += $line } }; $newContent | Set-Content settings.py" >> temp_frontend_tunnel.bat
echo echo [FRONTEND] Returning to masshealth-exercise... >> temp_frontend_tunnel.bat
echo cd ..\..\masshealth-exercise >> temp_frontend_tunnel.bat
echo echo [FRONTEND] Starting Expo with tunnel... >> temp_frontend_tunnel.bat
echo echo NOTE: Scan the QR code with Expo Go app on your device >> temp_frontend_tunnel.bat
echo npx expo start --tunnel >> temp_frontend_tunnel.bat
echo echo. >> temp_frontend_tunnel.bat
echo echo Expo stopped or failed to start. >> temp_frontend_tunnel.bat
echo pause >> temp_frontend_tunnel.bat
echo del "%%~f0" ^& exit >> temp_frontend_tunnel.bat

start cmd /c temp_frontend_tunnel.bat

echo.
echo Frontend tunnel terminal opened in new window!
echo.
pause
goto menu

:frontend_emulator
echo.
echo Starting Frontend Setup for Emulator...
echo.

REM Create a temporary batch file for frontend emulator
echo @echo off > temp_frontend_emulator.bat
echo color 0E >> temp_frontend_emulator.bat
echo title Frontend - Emulator >> temp_frontend_emulator.bat
echo echo [FRONTEND] Changing to masshealth-exercise directory... >> temp_frontend_emulator.bat
echo cd masshealth-exercise >> temp_frontend_emulator.bat
echo echo [FRONTEND] Installing npm packages... >> temp_frontend_emulator.bat
echo call npm install >> temp_frontend_emulator.bat
echo echo [FRONTEND] Updating API configuration for emulator... >> temp_frontend_emulator.bat
echo powershell -Command "(Get-Content api.ts) -replace 'const baseURL = \"http://[0-9.]+:[0-9]+\"', 'const baseURL = \"http://10.0.2.2:8000\"' | Set-Content api.ts" >> temp_frontend_emulator.bat
echo echo [FRONTEND] Starting Expo on Android emulator... >> temp_frontend_emulator.bat
echo npx expo run:android --device >> temp_frontend_emulator.bat
echo echo. >> temp_frontend_emulator.bat
echo echo Expo stopped or failed to start. >> temp_frontend_emulator.bat
echo pause >> temp_frontend_emulator.bat
echo del "%%~f0" ^& exit >> temp_frontend_emulator.bat

start cmd /c temp_frontend_emulator.bat

echo.
echo Frontend emulator terminal opened in new window!
echo.
pause
goto menu

:mqtt_docker
echo.
echo Starting MQTT Docker Setup...
echo.

REM Create a temporary batch file for MQTT
echo @echo off > temp_mqtt.bat
echo color 0C >> temp_mqtt.bat
echo title MQTT Docker >> temp_mqtt.bat
echo echo [MQTT] Changing to mosquitto directory... >> temp_mqtt.bat
echo cd extras\mosquitto >> temp_mqtt.bat
echo echo [MQTT] Checking for data and log folders... >> temp_mqtt.bat
echo if not exist data mkdir data >> temp_mqtt.bat
echo if not exist log mkdir log >> temp_mqtt.bat
echo echo [MQTT] Returning to extras directory... >> temp_mqtt.bat
echo cd ..\ >> temp_mqtt.bat
echo echo [MQTT] Starting Docker Compose... >> temp_mqtt.bat
echo docker compose up -d >> temp_mqtt.bat
echo echo. >> temp_mqtt.bat
echo echo [MQTT] MQTT Broker is now running! >> temp_mqtt.bat
echo echo. >> temp_mqtt.bat
echo pause >> temp_mqtt.bat
echo del "%%~f0" ^& exit >> temp_mqtt.bat

start cmd /c temp_mqtt.bat

echo.
echo MQTT Docker started in new window!
echo.
pause
goto menu

:exit
echo.
echo Exiting setup script. Goodbye!
timeout /t 2 >nul
exit /b 0