#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

async function testPNGExport() {
  console.log('🧪 Probando exportación a PNG...');
  
  const memoryId = 'memory_1757801332284_85kamevci';
  const outputPath = path.join(process.cwd(), 'memory_exports', 'png');
  
  try {
    const input = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'export_memory_png',
        arguments: {
          id: memoryId,
          outputPath: outputPath,
          fileName: 'direct_test_png',
          theme: 'light',
          includeMetadata: true,
          width: 1200
        }
      }
    };

    console.log('📤 Enviando solicitud PNG al servidor MCP...');
    
    const { stdout, stderr } = await execAsync(
      `echo '${JSON.stringify(input)}' | timeout 60s node dist/index.js`,
      {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10,
      }
    );

    console.log('📥 Salida del servidor (stderr):', stderr);
    
    const lines = stdout.trim().split('\n');
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        console.log('✅ Respuesta PNG:', JSON.stringify(response, null, 2));
        
        if (response.result && response.result.content) {
          const message = response.result.content[0]?.text;
          console.log('📄 Mensaje PNG:', message);
          
          if (message && message.includes('✅')) {
            console.log('🎉 ¡Exportación PNG exitosa!');
            return true;
          }
        }
        break;
      } catch (e) {
        // Continue
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Error en exportación PNG:', error.message);
    return false;
  }
}

testPNGExport();