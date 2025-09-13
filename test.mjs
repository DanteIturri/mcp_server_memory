#!/usr/bin/env node

/**
 * Documentación y ejemplos para el Memory MCP Server
 */

function showDocumentation() {
  console.log('� Memory MCP Server v2.0 - Documentación\n');

  console.log('📝 Ejemplos de uso con mensajes MCP:\n');
  
  console.log('1. 🆕 Crear una memoria:');
  const createExample = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'create_memory',
      arguments: {
        title: 'Memoria de Prueba',
        content: '# Mi Primera Memoria\n\nEsta es una memoria de prueba con **texto en negrita**.',
        tags: ['prueba', 'ejemplo'],
        priority: 'high',
        category: 'testing',
        favorite: true
      }
    }
  };
  console.log(JSON.stringify(createExample, null, 2));
  console.log('\n');

  console.log('2. 📋 Listar memorias:');
  const listExample = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'list_memories',
      arguments: {
        limit: 10,
        category: 'testing',
        favorite: true
      }
    }
  };
  console.log(JSON.stringify(listExample, null, 2));
  console.log('\n');

  console.log('3. 🔍 Buscar memorias:');
  const searchExample = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'search_memories',
      arguments: {
        query: 'texto negrita',
        highlightMatch: true,
        limit: 5
      }
    }
  };
  console.log(JSON.stringify(searchExample, null, 2));
  console.log('\n');

  console.log('� Herramientas disponibles:');
  const tools = [
    'create_memory - Crear una nueva memoria',
    'read_memory - Leer una memoria específica', 
    'list_memories - Listar memorias con filtros',
    'update_memory - Actualizar una memoria existente',
    'delete_memory - Eliminar una memoria',
    'search_memories - Búsqueda avanzada',
    'get_memory_stats - Obtener estadísticas',
    'backup_memories - Crear respaldo',
    'toggle_favorite - Alternar favorito',
    'archive_memory - Archivar/desarchivar',
    'find_similar_memories - Encontrar similares',
    'suggest_tags - Sugerir etiquetas',
    'export_memories - Exportar memorias'
  ];

  tools.forEach(tool => console.log(`  • ${tool}`));
  
  console.log('\n� Recursos disponibles:');
  console.log('  • memory://stats - Estadísticas del sistema');
  console.log('  • memory://config - Configuración actual');

  console.log('\n🚀 Para iniciar el servidor:');
  console.log('  pnpm run start');
  console.log('  # o directamente:');
  console.log('  node dist/index.js');

  console.log('\n📁 Estructura de archivos generada:');
  console.log('  memories/     - Archivos .md con las memorias');
  console.log('  config/       - Configuración del servidor');
  console.log('  backups/      - Respaldos automáticos');

  console.log('\n✅ El Memory MCP Server está listo para usar!');
}

showDocumentation();