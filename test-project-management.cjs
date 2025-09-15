#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

async function testProjectManagement() {
  console.log('🚀 Probando gestión de proyectos via MCP...\n');
  
  const serverPath = path.join(__dirname, 'dist', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
  });

  let requestId = 1;

  function sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: requestId++,
      method,
      params
    };
    
    console.log(`📤 Enviando: ${method}`);
    server.stdin.write(JSON.stringify(request) + '\n');
    return requestId - 1;
  }

  function sendToolCall(toolName, args = {}) {
    return sendRequest('tools/call', {
      name: toolName,
      arguments: args
    });
  }

  // Manejar respuestas
  server.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    
    lines.forEach(line => {
      if (line.startsWith('[') || line.startsWith('🚀') || line.startsWith('📁')) {
        return; // Ignorar logs del servidor
      }
      
      try {
        const response = JSON.parse(line);
        
        if (response.result) {
          if (response.id === 1) {
            // Respuesta de tools/list
            const projectTools = response.result.tools.filter(t => t.name.includes('project'));
            console.log(`\n✅ Herramientas de proyectos encontradas: ${projectTools.length}`);
            projectTools.forEach(tool => {
              console.log(`   - ${tool.name}: ${tool.description}`);
            });
            
            // Ahora listar proyectos
            setTimeout(() => sendToolCall('list_projects'), 200);
            
          } else if (response.id === 2) {
            // Respuesta de list_projects
            console.log('\n📁 LISTADO DE PROYECTOS VIA MCP:');
            console.log('=' .repeat(50));
            console.log(response.result.content[0].text);
            
            // Crear un proyecto de prueba
            setTimeout(() => {
              sendToolCall('create_project', {
                name: 'Proyecto de Prueba MCP',
                description: 'Proyecto creado directamente via herramientas MCP',
                color: '#FF6B6B',
                icon: '🧪'
              });
            }, 200);
            
          } else if (response.id === 3) {
            // Respuesta de create_project
            console.log('\n✅ PROYECTO CREADO VIA MCP:');
            console.log(response.result.content[0].text);
            
            // Listar proyectos nuevamente
            setTimeout(() => sendToolCall('list_projects'), 200);
            
          } else if (response.id === 4) {
            // Segunda lista de proyectos
            console.log('\n📁 LISTADO ACTUALIZADO:');
            console.log('=' .repeat(50));
            console.log(response.result.content[0].text);
            
            console.log('\n🎉 ¡Prueba de gestión de proyectos completada exitosamente!');
            server.kill();
          }
        } else if (response.error) {
          console.error(`❌ Error en solicitud ${response.id}:`, response.error);
        }
      } catch (error) {
        // Ignorar líneas que no son JSON válido
      }
    });
  });

  server.stderr.on('data', (data) => {
    const output = data.toString();
    if (!output.includes('dotenv') && !output.includes('Memory MCP Server')) {
      console.error('Error:', output);
    }
  });

  server.on('close', (code) => {
    console.log('\n✅ Servidor MCP cerrado');
    process.exit(0);
  });

  // Iniciar con listado de herramientas
  setTimeout(() => sendRequest('tools/list'), 1000);

  // Timeout de seguridad
  setTimeout(() => {
    server.kill();
    console.log('\n⏰ Timeout - cerrando servidor');
    process.exit(1);
  }, 10000);
}

testProjectManagement().catch(console.error);