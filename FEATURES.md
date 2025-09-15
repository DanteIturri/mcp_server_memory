# MCP Memory Server - Funcionalidades Completas

## 📋 Resumen
El MCP Memory Server v2.0.0 es un servidor completo de gestión de memorias con soporte para organización por proyectos. Permite crear, leer, actualizar y eliminar memorias en formato Markdown, así como gestionar proyectos para organizar las memorias.

## 🛠️ Herramientas de Memoria

### 1. `create_memory`
Crea una nueva memoria en formato Markdown.

**Parámetros:**
- `title` (requerido): Título de la memoria
- `content` (requerido): Contenido en formato Markdown
- `tags`: Array de etiquetas para categorización
- `priority`: Nivel de prioridad (low, medium, high)
- `category`: Categoría para organización
- `projectId`: ID del proyecto asociado
- `favorite`: Marcar como favorito

**Ejemplo:**
```json
{
  "title": "Reunión de Planificación",
  "content": "# Reunión del 14 de Septiembre\n\n## Puntos clave:\n- Implementar gestión de proyectos\n- Mejorar interfaz de usuario",
  "tags": ["reunión", "planificación"],
  "priority": "high",
  "category": "trabajo",
  "projectId": "proyecto-123",
  "favorite": true
}
```

### 2. `read_memory`
Lee una memoria específica por su ID.

**Parámetros:**
- `id` (requerido): ID de la memoria a leer

### 3. `list_memories`
Lista todas las memorias con filtros opcionales.

**Parámetros:**
- `tags`: Filtrar por etiquetas específicas
- `category`: Filtrar por categoría
- `priority`: Filtrar por prioridad
- `archived`: Filtrar por estado archivado
- `favorite`: Filtrar solo favoritos
- `limit`: Número máximo de resultados

### 4. `update_memory`
Actualiza una memoria existente.

**Parámetros:**
- `id` (requerido): ID de la memoria a actualizar
- `title`: Nuevo título
- `content`: Nuevo contenido
- `tags`: Nuevas etiquetas
- `priority`: Nueva prioridad
- `category`: Nueva categoría
- `projectId`: Nuevo ID de proyecto asociado
- `favorite`: Estado de favorito
- `archived`: Estado de archivado

### 5. `delete_memory`
Elimina una memoria por su ID.

**Parámetros:**
- `id` (requerido): ID de la memoria a eliminar

### 6. `search_memories`
Búsqueda avanzada en las memorias.

**Parámetros:**
- `query` (requerido): Consulta de búsqueda
- `tags`: Filtrar por etiquetas
- `category`: Filtrar por categoría
- `priority`: Filtrar por prioridad
- `archived`: Incluir memorias archivadas
- `favorite`: Filtrar solo favoritos
- `limit`: Máximo de resultados

### 7. `archive_memory`
Cambia el estado de archivado de una memoria.

**Parámetros:**
- `id` (requerido): ID de la memoria
- `archived` (requerido): Estado de archivado

### 8. `toggle_favorite`
Alterna el estado de favorito de una memoria.

**Parámetros:**
- `id` (requerido): ID de la memoria

### 9. `get_memory_stats`
Obtiene estadísticas completas de las memorias.

### 10. `backup_memories`
Crea una copia de seguridad de todas las memorias.

**Parámetros:**
- `includeConfig`: Incluir configuración en el backup

## 🗂️ Herramientas de Gestión de Proyectos

### 11. `create_project`
Crea un nuevo proyecto para organizar memorias.

**Parámetros:**
- `name` (requerido): Nombre del proyecto
- `description` (requerido): Descripción del proyecto
- `color`: Color hexadecimal (por defecto: #007ACC)
- `icon`: Emoji o icono (por defecto: 📂)

**Ejemplo:**
```json
{
  "name": "Desarrollo MCP Server",
  "description": "Proyecto para el desarrollo del servidor de memorias MCP",
  "color": "#007ACC",
  "icon": "🚀"
}
```

### 12. `list_projects`
Lista todos los proyectos con estadísticas.

**Parámetros:**
- `archived`: Filtrar por estado archivado (por defecto: false)
- `limit`: Número máximo de resultados (por defecto: 50)

### 13. `read_project`
Lee los detalles completos de un proyecto.

**Parámetros:**
- `id` (requerido): ID del proyecto

### 14. `update_project`
Actualiza un proyecto existente.

**Parámetros:**
- `id` (requerido): ID del proyecto a actualizar
- `name`: Nuevo nombre
- `description`: Nueva descripción
- `color`: Nuevo color
- `icon`: Nuevo icono
- `archived`: Estado de archivado

### 15. `delete_project`
Elimina un proyecto y desvincula todas sus memorias.

**Parámetros:**
- `id` (requerido): ID del proyecto
- `confirm` (requerido): Confirmación de eliminación (true)

### 16. `list_memories_by_project`
Lista todas las memorias asociadas a un proyecto específico.

**Parámetros:**
- `projectId` (requerido): ID del proyecto
- `limit`: Número máximo de resultados (por defecto: 50)
- `archived`: Incluir memorias archivadas (por defecto: false)
- `favorite`: Filtrar solo favoritos

## 🔗 Vinculación Memoria-Proyecto

### Funcionalidades de Vinculación:
1. **Crear memoria con proyecto**: Al crear una memoria, se puede especificar `projectId` para vincularla automáticamente
2. **Actualizar vinculación**: Cambiar el `projectId` de una memoria existente actualiza automáticamente las listas de ambos proyectos
3. **Eliminación inteligente**: Al eliminar un proyecto, todas las memorias se desvinculan automáticamente
4. **Listado por proyecto**: Ver todas las memorias de un proyecto específico con filtros avanzados

## 📁 Estructura de Archivos

### Memorias
- Formato: Markdown con front matter YAML
- Ubicación: `dist/memories/`
- Nomenclatura: `{ID}.md`

### Proyectos
- Formato: JSON
- Ubicación: `dist/projects/`
- Nomenclatura: `{ID}.json`

### Configuración
- Ubicación: `dist/config/`
- Archivo: `config.json`

### Backups
- Ubicación: `dist/backups/`
- Formato: ZIP con timestamp

## 🚀 Características Técnicas

### TypeScript
- Tipado fuerte con interfaces completas
- Soporte para Memory y Project interfaces
- Manejo de errores robusto

### Almacenamiento
- Sistema de archivos para persistencia
- Front matter YAML para metadatos
- JSON para proyectos

### Configuración
- Límite configurable de memorias
- Límite de búsqueda personalizable
- Configuración de directorios

### Funcionalidades Avanzadas
- Búsqueda de texto completo
- Filtrado múltiple
- Estadísticas detalladas
- Sistema de backup
- Gestión de proyectos completa
- Vinculación automática memoria-proyecto

## 🔧 Instalación y Uso

1. **Instalación de dependencias:**
   ```bash
   npm install
   ```

2. **Compilación:**
   ```bash
   npm run build
   ```

3. **Ejecución:**
   ```bash
   npm start
   ```

4. **Desarrollo:**
   ```bash
   npm run dev
   ```

## 📊 Ejemplo de Uso Completo

```bash
# 1. Crear un proyecto
create_project({
  "name": "Proyecto Web",
  "description": "Desarrollo de aplicación web",
  "color": "#FF6B6B",
  "icon": "🌐"
})

# 2. Crear memoria vinculada al proyecto
create_memory({
  "title": "Análisis de Requisitos",
  "content": "## Requisitos Funcionales\n\n- Login de usuarios\n- Dashboard administrativo",
  "tags": ["análisis", "requisitos"],
  "priority": "high",
  "category": "desarrollo",
  "projectId": "id-del-proyecto-creado"
})

# 3. Listar memorias del proyecto
list_memories_by_project({
  "projectId": "id-del-proyecto-creado"
})
```

## 🎯 Casos de Uso

1. **Gestión de Proyectos**: Organizar memorias por proyectos específicos
2. **Documentación**: Crear y mantener documentación técnica
3. **Notas de Reuniones**: Guardar y organizar actas de reuniones
4. **Base de Conocimiento**: Construir una base de conocimiento personal o empresarial
5. **Investigación**: Organizar notas de investigación por temas
6. **Desarrollo**: Documentar procesos de desarrollo y decisiones técnicas

El MCP Memory Server v2.0.0 proporciona una solución completa para la gestión de memorias con organización por proyectos, ideal para desarrolladores, investigadores y profesionales que necesitan un sistema robusto de gestión de conocimiento.