# Memory MCP Server

Servidor MCP para guardar, buscar y organizar memorias en Markdown con soporte para proyectos, favoritos, archivado, estadísticas y exportación.

## Qué hace

- Guarda memorias en archivos Markdown con front matter.
- Permite buscar por texto, tags, categoría, prioridad y estado.
- Organiza memorias por proyecto.
- Expone estadísticas y configuración como recursos MCP.
- Exporta contenido a formatos adicionales mediante herramientas específicas.

## Requisitos

- Node.js 18 o superior
- pnpm 10+

## Instalación

```bash
pnpm install
pnpm run build
```

Para desarrollo puedes usar:

```bash
pnpm run start:tsx
```

## Ejecución

```bash
pnpm run start
```

## Configuración MCP

Usa una ruta absoluta local a tu copia del proyecto. No compartas archivos de configuración con rutas reales si vas a publicar el repositorio.

### Opción 1: `npx` + `tsx`

```json
{
  "mcpServers": {
    "MemoryServer": {
      "command": "npx",
      "args": ["-y", "tsx", "<RUTA_ABSOLUTA>/src/index.ts"],
      "env": {},
      "type": "stdio"
    }
  }
}
```

### Opción 2: `pnpm` + `tsx`

```json
{
  "mcpServers": {
    "MemoryServer": {
      "command": "pnpm",
      "args": ["--dir", "<RUTA_ABSOLUTA>", "exec", "tsx", "src/index.ts"],
      "env": {},
      "type": "stdio"
    }
  }
}
```

### Opción 3: código compilado

```json
{
  "mcpServers": {
    "MemoryServer": {
      "command": "node",
      "args": ["<RUTA_ABSOLUTA>/dist/index.js"],
      "env": {},
      "type": "stdio"
    }
  }
}
```

## Scripts

- `pnpm run build`: compila TypeScript.
- `pnpm run start`: ejecuta el build compilado.
- `pnpm run start:tsx`: ejecuta desde fuente con `tsx`.
- `pnpm run dev`: modo watch.
- `pnpm run demo`: demo y pruebas de exportación.
- `pnpm run clean`: borra `dist/`.

## Estructura

```text
src/
├── index.ts
├── index_improved.ts
├── interfaces/
├── tools/
└── utils/
```

En tiempo de ejecución se crean estos directorios de datos:

- `src/memories/`
- `src/projects/`
- `src/config/`
- `src/backups/`
- `memory_exports/`

## Seguridad

- No subas archivos de configuración con rutas locales reales.
- No publiques exportaciones generadas que contengan contenido de memorias.
- Mantén fuera del repositorio los datos de proyecto y backups generados por el servidor.

## Notas

El repositorio incluye utilidades y pruebas para desarrollo. Si vas a distribuirlo, revisa primero cualquier archivo generado o de exportación antes de compartirlo.