#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

async function testMCPServer() {
  console.log('🚀 Iniciando servidor MCP Memory...\n');
  
  const serverPath = path.join(__dirname, 'dist', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
  });

  // Enviar solicitud para listar herramientas
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  };

  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Esperar respuesta
  server.stdout.on('data', (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.id === 1) {
        console.log('📋 Herramientas disponibles:');
        response.result.tools.forEach((tool, index) => {
          if (tool.name.includes('project')) {
            console.log(`${index + 1}. 📁 ${tool.name} - ${tool.description}`);
          }
        });
        
        // Ahora listar proyectos
        setTimeout(() => {
          const listProjectsRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
              name: 'list_projects',
              arguments: {}
            }
          };
          
          server.stdin.write(JSON.stringify(listProjectsRequest) + '\n');
        }, 100);
      } else if (response.id === 2) {
        console.log('\n🗂️ Proyectos encontrados:');
        console.log(response.result.content[0].text);
        server.kill();
      }
    } catch (error) {
      console.error('Error parsing response:', error);
    }
  });

  server.stderr.on('data', (data) => {
    console.error('Error:', data.toString());
  });

  server.on('close', (code) => {
    console.log('\n✅ Servidor MCP cerrado');
    process.exit(0);
  });

  // Timeout de seguridad
  setTimeout(() => {
    server.kill();
    console.log('\n⏰ Timeout - cerrando servidor');
    process.exit(1);
  }, 5000);
}

testMCPServer().catch(console.error);