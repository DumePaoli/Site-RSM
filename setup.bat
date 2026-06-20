@echo off
REM RSM Shop — Premier lancement Windows
REM Copie .env.example vers .env et ouvre dans le Bloc-notes

cd /d "%~dp0backend"

if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo [OK] Fichier .env cree depuis .env.example
    echo [!] Ouvrez .env dans un editeur et remplissez vos cles Stripe, PayPal, SMTP, Discord
    notepad .env
) else (
    echo [OK] .env existe deja
)

echo.
echo Lancez maintenant : dev.bat
pause
