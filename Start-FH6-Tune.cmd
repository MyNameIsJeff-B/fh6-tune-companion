@echo off
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is niet gevonden. Installeer Node.js en probeer opnieuw.
  pause
  exit /b 1
)

start "FH6 Tune Companion" /min node "%~dp0serve.mjs"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:4318"
