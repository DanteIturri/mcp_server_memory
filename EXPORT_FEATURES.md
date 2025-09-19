# Funcionalidades de Exportación PDF y PNG - Memory MCP Server

## 📄 Descripción

Se han agregado nuevas herramientas poderosas para exportar memorias en formatos **PDF** y **PNG** con alta calidad y personalización visual.

## 🚀 Nuevas Herramientas Disponibles

### 1. `export_memory_pdf`
Exporta una memoria específica a formato PDF con estilos profesionales.

**Parámetros:**
- `id` (requerido): ID de la memoria a exportar
- `outputPath` (requerido): Directorio donde guardar el PDF
- `fileName` (opcional): Nombre personalizado del archivo (sin extensión)
- `theme` (opcional): Tema visual (`light`, `dark`, `professional`)
- `includeMetadata` (opcional): Incluir metadatos de la memoria

**Ejemplo:**
```json
{
  "name": "export_memory_pdf",
  "arguments": {
    "id": "memory_1757801332284_85kamevci",
    "outputPath": "/ruta/a/exportaciones",
    "fileName": "mi_memoria",
    "theme": "professional",
    "includeMetadata": true
  }
}
```

### 2. `export_memory_png`
Exporta una memoria específica a formato PNG como imagen de alta calidad.

**Parámetros:**
- `id` (requerido): ID de la memoria a exportar
- `outputPath` (requerido): Directorio donde guardar el PNG
- `fileName` (opcional): Nombre personalizado del archivo (sin extensión)
- `theme` (opcional): Tema visual (`light`, `dark`, `professional`)
- `includeMetadata` (opcional): Incluir metadatos de la memoria
- `width` (opcional): Ancho en píxeles (por defecto: 1200)
- `height` (opcional): Alto en píxeles (automático si no se especifica)

**Ejemplo:**
```json
{
  "name": "export_memory_png",
  "arguments": {
    "id": "memory_1757801332284_85kamevci",
    "outputPath": "/ruta/a/exportaciones",
    "fileName": "mi_memoria",
    "theme": "light",
    "includeMetadata": true,
    "width": 1200
  }
}
```

## 🎨 Temas Disponibles

### 📄 Professional
- Diseño profesional y formal
- Tipografía serif para el cuerpo
- Colores azules y grises
- Ideal para documentos oficiales

### ☀️ Light
- Tema claro y limpio
- Fondo blanco, texto oscuro
- Diseño minimalista
- Perfecto para lectura diaria

### 🌙 Dark
- Tema oscuro para ambientes con poca luz
- Fondo oscuro, texto claro
- Reduce fatiga visual
- Ideal para trabajo nocturno

## 📋 Características de los Metadatos

Cuando `includeMetadata` está habilitado, se incluye:

- **ID de la memoria**
- **Categoría**
- **Prioridad** (con indicadores visuales)
- **Fechas** de creación y última actualización
- **Tamaño** en caracteres
- **Proyecto asociado** (si existe)
- **Etiquetas** con estilos coloridos
- **Estado** (favorito, archivado)

## 🛠️ Tecnologías Utilizadas

- **Puppeteer**: Para renderizado de PDF y PNG de alta calidad
- **Marked**: Para conversión de Markdown a HTML
- **CSS personalizado**: Para cada tema visual
- **Node.js**: Para procesamiento backend

## 📁 Estructura de Archivos Exportados

Los archivos exportados siguen este patrón de nomenclatura:
```
{fileName}_{memoryId}_{timestamp}.{extension}
```

Ejemplo:
```
mi_memoria_memory_1757801332284_85kamevci_2025-09-19T17-35-03.pdf
```

## 🎯 Casos de Uso

### 📄 PDFs
- Documentos oficiales
- Reportes profesionales
- Archivos para impresión
- Compartir con clientes

### 🖼️ PNGs
- Compartir en redes sociales
- Incluir en presentaciones
- Vista previa rápida
- Capturas de pantalla de contenido

## ⚙️ Configuración

### Instalación de Dependencias
```bash
pnpm add puppeteer @types/marked marked
```

### Permisos de Puppeteer
```bash
pnpm approve-builds
```

## 🧪 Pruebas y Demostración

### Ejecutar Pruebas
```bash
# Prueba básica de conversión
node test-simple.mjs

# Prueba de exportación PDF
node test-direct.mjs

# Prueba de exportación PNG
node test-png.mjs

# Demostración completa
node demo-export.mjs
```

### Resultados Esperados
- **PDFs**: ~100KB por archivo
- **PNGs**: ~500KB por archivo
- **Tiempo de procesamiento**: 2-10 segundos por archivo

## 📊 Rendimiento

- **Primera ejecución**: Más lenta (descarga de Chromium)
- **Ejecuciones posteriores**: Rápidas (2-5 segundos)
- **Memoria utilizada**: ~50-100MB durante procesamiento
- **CPU**: Intensivo durante renderizado

## 🔒 Consideraciones de Seguridad

- Los archivos se generan en directorios locales especificados
- No se envían datos a servicios externos
- Chromium se ejecuta en modo sandbox por defecto
- Validación de rutas de archivos para prevenir ataques

## 🐛 Resolución de Problemas

### Error: "no such file or directory"
- Verificar que el ID de la memoria existe
- Asegurar que los directorios de salida existen

### Timeout en primera ejecución
- Normal: Puppeteer descarga Chromium (~100MB)
- Esperar hasta 2 minutos en la primera ejecución

### Error de permisos
- Ejecutar `pnpm approve-builds`
- Verificar permisos de escritura en directorio de salida

## 🔮 Futuras Mejoras

- [ ] Plantillas personalizadas
- [ ] Exportación por lotes
- [ ] Compresión de archivos
- [ ] Watermarks personalizados
- [ ] Exportación a otros formatos (DOCX, etc.)
- [ ] API de configuración de estilos

## 📝 Notas de Desarrollo

- Código modular en `src/utils/pdf.utils.ts`
- Estilos CSS separados por tema
- Manejo robusto de errores
- Validación de parámetros de entrada
- Nombres de archivo únicos para evitar conflictos