# =============================================================
# dev-start.ps1 — Levanta el entorno de desarrollo completo
# Uso: .\dev-start.ps1
# =============================================================

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     GotaGota — Entorno de Desarrollo     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Docker
Write-Host "▶ Verificando Docker..." -ForegroundColor Yellow
try {
    $null = docker info 2>&1
    Write-Host "  ✅ Docker disponible" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker no está corriendo. Abre Docker Desktop primero." -ForegroundColor Red
    exit 1
}

# 2. Levantar MongoDB + Mongo Express con docker-compose.dev.yml
Write-Host ""
Write-Host "▶ Levantando MongoDB (Docker)..." -ForegroundColor Yellow
docker compose -f "$root\docker-compose.dev.yml" up -d
Write-Host "  ✅ MongoDB corriendo en localhost:27017" -ForegroundColor Green
Write-Host "  ✅ Mongo Express disponible en http://localhost:8081 (admin/admin123)" -ForegroundColor Green

# 3. Instalar dependencias backend si no existen
Write-Host ""
Write-Host "▶ Verificando dependencias backend..." -ForegroundColor Yellow
if (-Not (Test-Path "$root\backend\node_modules")) {
    Write-Host "  📦 Instalando dependencias backend..." -ForegroundColor Cyan
    Push-Location "$root\backend"
    npm install
    Pop-Location
}
Write-Host "  ✅ Dependencias backend OK" -ForegroundColor Green

# 4. Instalar dependencias frontend si no existen
Write-Host ""
Write-Host "▶ Verificando dependencias frontend..." -ForegroundColor Yellow
if (-Not (Test-Path "$root\frontend\node_modules")) {
    Write-Host "  📦 Instalando dependencias frontend..." -ForegroundColor Cyan
    Push-Location "$root\frontend"
    npm install
    Pop-Location
}
Write-Host "  ✅ Dependencias frontend OK" -ForegroundColor Green

# 5. Arrancar Backend en nueva ventana
Write-Host ""
Write-Host "▶ Arrancando Backend (puerto 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev" -WindowStyle Normal

# 6. Arrancar Frontend en nueva ventana
Write-Host ""
Write-Host "▶ Arrancando Frontend Next.js (puerto 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev" -WindowStyle Normal

# 7. Resumen
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 Todo levantado! URLs de desarrollo:" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:      http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API:   http://localhost:4000" -ForegroundColor White
Write-Host "  Health check:  http://localhost:4000/health" -ForegroundColor White
Write-Host "  Mongo Express: http://localhost:8081" -ForegroundColor White
Write-Host "                 (usuario: admin / admin123)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Para detener MongoDB: docker compose -f docker-compose.dev.yml down" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
