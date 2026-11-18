@echo off
setlocal enabledelayedexpansion
title Descompactador de Assets - Google Flow
cd /d "%~dp0"

echo ===================================================
echo   Google Flow Asset Studio - Descompactador Rapido
echo ===================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js nao foi encontrado no sistema.
    echo Por favor, instale o Node.js em https://nodejs.org
    echo.
    pause
    exit /b 1
)

if exist "%~dp0unpack-bundle.cjs" (
    node "%~dp0unpack-bundle.cjs" "%~dp0" %*
    goto :fim
)

if exist "%~dp0unpack-bundle.js" (
    node "%~dp0unpack-bundle.js" "%~dp0" %*
    goto :fim
)

if exist "%~dp0scripts\unpack-bundle.cjs" (
    node "%~dp0scripts\unpack-bundle.cjs" "%~dp0" %*
    goto :fim
)

if exist "%~dp0scripts\unpack-bundle.js" (
    node "%~dp0scripts\unpack-bundle.js" "%~dp0" %*
    goto :fim
)

echo [ERRO] Arquivo unpack-bundle.cjs nao encontrado na pasta:
echo        %~dp0
echo.
echo Certifique-se de que unpack.bat e unpack-bundle.cjs estejam juntos na mesma pasta.

:fim
echo.
pause
