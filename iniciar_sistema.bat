@echo off
echo ========================================================
echo        INICIANDO SISTEMA DE CLINICA EN RED LOCAL
echo ========================================================
echo.

echo [1/2] Iniciando Servidor Backend (NestJS)...
start "Backend Clinica" cmd /k "cd backend && npm run start"

echo [2/2] Iniciando Interfaz Frontend (Vite) en red local...
start "Frontend Clinica" cmd /k "cd frontend && npm run dev -- --host"

echo.
echo Sistema iniciado correctamente en ventanas separadas.
echo Por favor, no cierres las dos nuevas ventanas negras que se abrieron.
echo.
pause
