#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

async function testDirectExport() {
  console.log('🧪 Probando exportación directa...');
  
  const memoryId = 'memory_1757801332284_85kamevci';
  const outputPath = path.join(process.cwd(), 'memory_exports', 'pdf');
  
  try {
    // Crear la entrada JSON-RPC para el servidor MCP
    const input = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'export_memory_pdf',
        arguments: {
          id: memoryId,
          outputPath: outputPath,
          fileName: 'direct_test',
          theme: 'professional',
          includeMetadata: true
        }
      }
    };

    console.log('📤 Enviando solicitud al servidor MCP...');
    console.log('Input:', JSON.stringify(input, null, 2));
    
    // Ejecutar el servidor con timeout más largo
    const { stdout, stderr } = await execAsync(
      `echo '${JSON.stringify(input)}' | timeout 120s node dist/index.js`,
      {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      }
    );

    console.log('📥 Salida del servidor (stderr):', stderr);
    
    // Buscar respuesta JSON válida en stdout
    const lines = stdout.trim().split('\n');
    console.log('📋 Líneas de salida:', lines.length);
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        console.log('✅ Respuesta JSON válida encontrada:');
        console.log(JSON.stringify(response, null, 2));
        
        if (response.result && response.result.content) {
          const message = response.result.content[0]?.text;
          console.log('📄 Mensaje:', message);
          
          if (message && message.includes('✅')) {
            console.log('🎉 ¡Exportación exitosa!');
            return true;
          } else if (message && message.includes('❌')) {
            console.log('❌ Error en exportación:', message);
            return false;
          }
        }
        break;
      } catch (e) {
        // No es JSON válido, continuar
      }
    }
    
    console.log('❌ No se encontró respuesta JSON válida');
    return false;
    
  } catch (error) {
    console.error('❌ Error en exportación directa:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('⏰ La operación agotó el tiempo límite. Esto puede ser normal en la primera ejecución mientras Puppeteer descarga Chromium.');
    }
    
    return false;
  }
}

testDirectExport();