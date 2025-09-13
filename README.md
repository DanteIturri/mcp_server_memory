# Memory MCP Server v2.0 🧠

Un servidor MCP (Model Context Protocol) avanzado para gestionar memorias en archivos Markdown con funcionalidades de búsqueda, organización, respaldo automático y más.

## 🚀 Características

### ✨ Funcionalidades Principales
- **Gestión completa de memorias**: Crear, leer, actualizar y eliminar
- **Búsqueda avanzada**: Búsqueda por contenido, tags, categorías y metadatos
- **Organización**: Categorías, prioridades, etiquetas y proyectos
- **Favoritos y archivado**: Marca memorias importantes y archiva las obsoletas
- **Estadísticas detalladas**: Métricas completas del uso de memorias
- **Respaldos automáticos**: Sistema de backups con timestamp
- **Búsqueda de similitud**: Encuentra memorias relacionadas automáticamente
- **Sugerencias de tags**: Extracción automática de palabras clave
- **Exportación**: Múltiples formatos (JSON, CSV, Markdown)

### 📊 Metadatos Enriquecidos
Cada memoria incluye:
- ID único generado automáticamente
- Título y contenido
- Tags personalizables
- Prioridad (baja, media, alta)
- Categoría de organización
- Vinculación a proyectos
- Estado de favorito
- Estado de archivado
- Timestamps de creación y actualización
- Tamaño automático del contenido

## 🛠️ Instalación y Configuración

### Instalación Rápida
```bash
# Ejecutar script de instalación
./install.sh

# O manualmente:
pnpm install
pnpm run build
```

### Configuración MCP

Para usar el servidor con el protocolo MCP, agrega una de estas configuraciones a tu archivo de configuración MCP:

#### 1. Con npx + tsx (Recomendado)
```json
{
  "mcpServers": {
    "MemoryServer": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/ruta/completa/mcp_server_memory/src/index.ts"
      ],
      "env": {},
      "type": "stdio"
    }
  }
}
```

#### 2. Con pnpm + tsx (Más rápido)
```json
{
  "mcpServers": {
    "MemoryServer": {
      "command": "pnpm",
      "args": [
        "--dir",
        "/ruta/completa/mcp_server_memory",
        "exec",
        "tsx",
        "src/index.ts"
      ],
      "env": {},
      "type": "stdio"
    }
  }
}
```

#### 3. Con código compilado (Más estable)
```json
{
  "mcpServers": {
    "MemoryServer": {
      "command": "node",
      "args": [
        "/ruta/completa/mcp_server_memory/dist/index.js"
      ],
      "env": {},
      "type": "stdio"
    }
  }
}
```

**Nota:** Reemplaza `/ruta/completa/mcp_server_memory` con la ruta absoluta a tu proyecto.

### Scripts Disponibles
```bash
pnpm run build        # Compilar TypeScript
pnpm run start        # Ejecutar versión compilada
pnpm run start:tsx    # Ejecutar con tsx (desarrollo)
pnpm run dev          # Modo desarrollo con watch
pnpm run demo         # Ver documentación y ejemplos
pnpm run clean        # Limpiar archivos compilados
```

### Configuración
El servidor se configura automáticamente con valores por defecto. Puedes personalizar la configuración editando `src/config/settings.json`:

```json
{
  "maxMemories": 10000,
  "autoBackup": true,
  "backupInterval": 24,
  "searchLimit": 100
}
```

## 📚 Herramientas Disponibles

### 1. `create_memory`
Crea una nueva memoria con metadatos completos.

**Parámetros:**
- `title` (requerido): Título de la memoria
- `content` (requerido): Contenido en formato Markdown
- `tags` (opcional): Array de etiquetas
- `priority` (opcional): low | medium | high
- `category` (opcional): Categoría de organización
- `projectId` (opcional): ID del proyecto asociado
- `favorite` (opcional): Marcar como favorito

**Ejemplo:**
```json
{
  "title": "Notas sobre TypeScript",
  "content": "# TypeScript\n\nTypeScript es un superset de JavaScript...",
  "tags": ["typescript", "programming", "javascript"],
  "priority": "high",
  "category": "development",
  "favorite": true
}
```

### 2. `read_memory`
Lee una memoria específica por ID.

**Parámetros:**
- `id` (requerido): ID de la memoria

### 3. `list_memories`
Lista memorias con filtros avanzados.

**Parámetros:**
- `tags` (opcional): Filtrar por etiquetas
- `category` (opcional): Filtrar por categoría
- `priority` (opcional): Filtrar por prioridad
- `archived` (opcional): Incluir archivadas
- `favorite` (opcional): Solo favoritas
- `limit` (opcional): Número máximo de resultados
- `sortBy` (opcional): Campo de ordenamiento
- `sortOrder` (opcional): Orden ascendente o descendente

### 4. `update_memory`
Actualiza una memoria existente.

**Parámetros:**
- `id` (requerido): ID de la memoria
- Cualquier campo de la memoria para actualizar

### 5. `delete_memory`
Elimina una memoria permanentemente.

**Parámetros:**
- `id` (requerido): ID de la memoria
- `confirm` (requerido): true para confirmar eliminación

### 6. `search_memories`
Búsqueda avanzada con texto completo.

**Parámetros:**
- `query` (requerido): Término de búsqueda
- Filtros opcionales similares a `list_memories`
- `highlightMatch`: Resaltar términos en resultados

### 7. `get_memory_stats`
Obtiene estadísticas completas del sistema.

**Parámetros:**
- `detailed` (opcional): Incluir desglose detallado

### 8. `backup_memories`
Crea un respaldo completo de las memorias.

**Parámetros:**
- `includeConfig` (opcional): Incluir configuración
- `compress` (opcional): Comprimir archivos
- `description` (opcional): Descripción del respaldo

### 9. `toggle_favorite`
Alterna el estado de favorito de una memoria.

**Parámetros:**
- `id` (requerido): ID de la memoria

### 10. `archive_memory`
Archiva o desarchivar una memoria.

**Parámetros:**
- `id` (requerido): ID de la memoria
- `archived` (requerido): Estado de archivado

### 11. `find_similar_memories`
Encuentra memorias similares basándose en contenido y tags.

**Parámetros:**
- `id` (requerido): ID de la memoria de referencia
- `limit` (opcional): Número máximo de resultados
- `threshold` (opcional): Umbral mínimo de similitud

### 12. `suggest_tags`
Sugiere etiquetas basándose en el contenido.

**Parámetros:**
- `content` (requerido): Contenido a analizar
- `maxSuggestions` (opcional): Número máximo de sugerencias

### 13. `export_memories`
Exporta memorias en varios formatos.

**Parámetros:**
- `format` (opcional): json | csv | markdown
- `filter` (opcional): Filtros a aplicar
- `includeContent` (opcional): Incluir contenido completo

## 🗂️ Recursos Disponibles

### 1. `memory://stats`
Proporciona estadísticas detalladas en formato JSON.

### 2. `memory://config`
Muestra la configuración actual del servidor.

## 📁 Estructura de Archivos

```
src/
├── index.ts                 # Servidor principal
├── index_improved.ts        # Versión mejorada del servidor
├── interfaces/
│   ├── index.ts            # Exportaciones de interfaces
│   ├── memories.ts         # Interfaces de memorias
│   └── proyect.ts          # Interfaces de proyectos
├── tools/
│   └── memory.tools.ts     # Definiciones de herramientas
└── utils/
    └── memory.utils.ts     # Utilidades y helpers

memories/                   # Archivos de memorias (.md)
config/                    # Configuración del servidor
backups/                   # Respaldos automáticos
```

## 🔧 Formato de Memorias

Las memorias se almacenan como archivos Markdown con frontmatter YAML:

```markdown
---
id: memory_1699123456789_abc123def
title: Mi Memoria de Ejemplo
tags: [ejemplo, prueba, documentación]
created: 2023-11-04T10:30:00.000Z
updated: 2023-11-04T15:45:00.000Z
priority: medium
category: general
projectId: 
archived: false
favorite: true
size: 245
---

# Contenido de la Memoria

Este es el contenido en **Markdown** de la memoria.

- Lista de elementos
- Otro elemento

```javascript
const codigo = "también funciona";
```
```

## 🚀 Mejoras Implementadas

### Respecto a la Versión Original:

1. **Metadatos Enriquecidos**: Prioridades, categorías, favoritos, archivado
2. **Búsqueda Avanzada**: Filtros múltiples y búsqueda de similitud
3. **Sistema de Recursos**: Acceso a estadísticas y configuración via MCP
4. **Respaldos Automáticos**: Sistema completo de backup con timestamps
5. **Validación Robusta**: Validaciones de entrada y manejo de errores
6. **Utilidades Avanzadas**: Extracción de palabras clave, similitud, formateo
7. **Configuración Flexible**: Sistema de configuración persistente
8. **Estadísticas Detalladas**: Métricas completas de uso
9. **Exportación Múltiple**: Soporte para JSON, CSV y Markdown
10. **Interfaz Mejorada**: Mensajes con iconos y formato mejorado
11. **Herramientas Especializadas**: Toggle de favoritos, archivado, sugerencias
12. **Organización por Proyectos**: Vinculación de memorias a proyectos
13. **Límites Configurables**: Control de límites y quotas
14. **Ordenamiento Avanzado**: Múltiples opciones de ordenamiento
15. **Gestión de Directorios**: Creación automática de estructura de carpetas

## 📈 Próximas Mejoras Sugeridas

1. **Base de Datos**: Migrar a SQLite para mejor rendimiento
2. **Índices de Búsqueda**: Implementar índices Lucene o similar
3. **API REST**: Endpoint HTTP adicional
4. **Sincronización**: Soporte para múltiples instancias
5. **Plugins**: Sistema de extensiones
6. **Templates**: Plantillas predefinidas para memorias
7. **Markdown Extensions**: Soporte para diagramas, math, etc.
8. **Attachments**: Soporte para archivos adjuntos
9. **Colaboración**: Compartir memorias entre usuarios
10. **AI Integration**: Sugerencias automáticas con IA

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue antes de realizar cambios mayores.

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.