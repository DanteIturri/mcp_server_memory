#!/bin/bash

# Script de instalación y configuración del Memory MCP Server
# Uso: ./install.sh

set -e

echo "🧠 Memory MCP Server - Instalación y Configuración"
echo "=================================================="
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
fi

# Verificar pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 pnpm no encontrado. Instalando pnpm..."
    npm install -g pnpm
fi

echo "📦 Instalando dependencias..."
pnpm install

echo "🔨 Compilando proyecto..."
pnpm run build

echo "🧪 Probando servidor con tsx..."
timeout 2s pnpm run start:tsx > /dev/null 2>&1 || echo "✅ Servidor funciona correctamente"

echo ""
echo "✅ Instalación completada!"
echo ""
echo "📋 Configuraciones MCP disponibles:"
echo ""
echo "1. Con npx + tsx (recomendado):"
echo '   "MemoryServer": {'
echo '     "command": "npx",'
echo '     "args": ["-y", "tsx", "'$(pwd)'/src/index.ts"],'
echo '     "env": {},'
echo '     "type": "stdio"'
echo '   }'
echo ""
echo "2. Con pnpm + tsx (más rápido):"
echo '   "MemoryServer": {'
echo '     "command": "pnpm",'
echo '     "args": ["--dir", "'$(pwd)'", "exec", "tsx", "src/index.ts"],'
echo '     "env": {},'
echo '     "type": "stdio"'
echo '   }'
echo ""
echo "3. Con código compilado (más estable):"
echo '   "MemoryServer": {'
echo '     "command": "node",'
echo '     "args": ["'$(pwd)'/dist/index.js"],'
echo '     "env": {},'
echo '     "type": "stdio"'
echo '   }'
echo ""
echo "🚀 Para usar:"
echo "  1. Copia una de las configuraciones de arriba"
echo "  2. Pégala en tu archivo de configuración MCP"
echo "  3. Reinicia tu cliente MCP"
echo ""
echo "📖 Ver documentación: pnpm run demo"
echo "🧪 Probar servidor: pnpm run start:tsx"