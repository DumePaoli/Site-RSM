@echo off
REM RSM Shop — Dev mode Windows (Node.js)
REM Backend: http://localhost:3000  Frontend: http://localhost:5174

cd /d "%~dp0"

if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo [OK] .env cree. Editez-le avec vos cles avant de continuer.
    notepad .env
)

echo [rsm-shop] Installation des dependances serveur...
call npm install

echo [rsm-shop] Demarrage du backend (port 3000)...
start "RSM-Backend" cmd /k "node server.js"

echo [rsm-shop] Installation des dependances frontend...
cd frontend
call npm install --silent

echo [rsm-shop] Demarrage du frontend (port 5174)...
start "RSM-Frontend" cmd /k "npm run dev"

echo.
echo   Backend  -^> http://localhost:3000
echo   Frontend -^> http://localhost:5174
echo   Admin    -^> http://localhost:5174/admin
echo.
echo Fermer les deux fenetres de commande pour arreter.
pause
