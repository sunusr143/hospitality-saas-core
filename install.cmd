@echo off
setlocal
node scripts\install-local.mjs
exit /b %errorlevel%
