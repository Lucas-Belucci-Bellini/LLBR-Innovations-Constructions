@echo off
title LLBR Innovations / Constructions - Dev Server
echo.
echo  LLBR Innovations / Constructions
echo  Iniciando servidor de desenvolvimento...
echo.
if not exist node_modules (
  echo  Instalando dependencias npm...
  npm install
  echo.
)
npm run dev
pause
