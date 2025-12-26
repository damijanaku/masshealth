@echo off 
color 0D 
title Frontend - Device Tunnel 
echo [FRONTEND] Changing to masshealth-exercise directory... 
cd masshealth-exercise 
echo [FRONTEND] Installing npm packages... 
call npm install 
echo [FRONTEND] Updating API configuration with IP: 164.8.207.213 
powershell -Command "(Get-Content api.ts) -replace 'const baseURL = \"http://[0-9.]+:[0-9]+\"', 'const baseURL = \"http://164.8.207.213:8000\"' | Set-Content api.ts" 
echo [FRONTEND] Updating backend ALLOWED_HOSTS... 
cd ..\backend\core 
powershell -Command "$content = Get-Content settings.py; $lineNum = 0; $newContent = @(); foreach($line in $content) { $lineNum++; if($lineNum -eq 33) { $newContent += \"    '164.8.207.213',\" } else { $newContent += $line } }; $newContent | Set-Content settings.py" 
echo [FRONTEND] Returning to masshealth-exercise... 
cd ..\..\masshealth-exercise 
echo [FRONTEND] Starting Expo with tunnel... 
echo NOTE: Scan the QR code with Expo Go app on your device 
npx expo start --tunnel 
echo. 
echo Expo stopped or failed to start. 
pause 
del "%~f0" & exit 
