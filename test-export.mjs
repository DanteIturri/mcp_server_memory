import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

const TEST_MEMORY_ID = 'memory_1757801332284_85kamevci'; // Usar una memoria existente
const EXPORT_DIR = path.join(process.cwd(), 'memory_exports');

async function testPDFExport() {
  console.log('🧪 Probando exportación a PDF...');
  
  try {
    const input = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'export_memory_pdf',
        arguments: {
          id: TEST_MEMORY_ID,
          outputPath: path.join(EXPORT_DIR, 'pdf'),
          fileName: 'test_memory',
          theme: 'professional',
          includeMetadata: true
        }
      }
    });

    console.log('📤 Enviando solicitud de exportación PDF...');
    const { stdout, stderr } = await execAsync(`echo '${input}' | node dist/index.js`, {
      cwd: process.cwd(),
      timeout: 30000
    });

    // Filtrar las líneas de stdout que son JSON válido
    const lines = stdout.trim().split('\n');
    const jsonLine = lines.find(line => {
      try {
        JSON.parse(line);
        return true;
      } catch {
        return false;
      }
    });

    if (jsonLine) {
      const response = JSON.parse(jsonLine);
      console.log('✅ Respuesta de exportación PDF:', response.result?.content?.[0]?.text || 'Respuesta exitosa');

      // Verificar que el archivo se creó
      const pdfFiles = await fs.readdir(path.join(EXPORT_DIR, 'pdf'));
      const pdfFile = pdfFiles.find(file => file.includes('test_memory') && file.endsWith('.pdf'));
      
      if (pdfFile) {
        console.log(`✅ Archivo PDF creado: ${pdfFile}`);
        const stats = await fs.stat(path.join(EXPORT_DIR, 'pdf', pdfFile));
        console.log(`📏 Tamaño del archivo: ${stats.size} bytes`);
      } else {
        console.log('❌ No se encontró el archivo PDF generado');
      }
    } else {
      console.log('❌ No se recibió respuesta JSON válida');
      console.log('Stdout completo:', stdout);
    }

  } catch (error) {
    console.error('❌ Error en prueba PDF:', error.message);
  }
}

async function testPNGExport() {
  console.log('\n🧪 Probando exportación a PNG...');
  
  try {
    const input = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'export_memory_png',
        arguments: {
          id: TEST_MEMORY_ID,
          outputPath: path.join(EXPORT_DIR, 'png'),
          fileName: 'test_memory',
          theme: 'light',
          includeMetadata: true,
          width: 1200
        }
      }
    });

    console.log('📤 Enviando solicitud de exportación PNG...');
    const { stdout, stderr } = await execAsync(`echo '${input}' | node dist/index.js`, {
      cwd: process.cwd(),
      timeout: 30000
    });

    // Filtrar las líneas de stdout que son JSON válido
    const lines = stdout.trim().split('\n');
    const jsonLine = lines.find(line => {
      try {
        JSON.parse(line);
        return true;
      } catch {
        return false;
      }
    });

    if (jsonLine) {
      const response = JSON.parse(jsonLine);
      console.log('✅ Respuesta de exportación PNG:', response.result?.content?.[0]?.text || 'Respuesta exitosa');

      // Verificar que el archivo se creó
      const pngFiles = await fs.readdir(path.join(EXPORT_DIR, 'png'));
      const pngFile = pngFiles.find(file => file.includes('test_memory') && file.endsWith('.png'));
      
      if (pngFile) {
        console.log(`✅ Archivo PNG creado: ${pngFile}`);
        const stats = await fs.stat(path.join(EXPORT_DIR, 'png', pngFile));
        console.log(`📏 Tamaño del archivo: ${stats.size} bytes`);
      } else {
        console.log('❌ No se encontró el archivo PNG generado');
      }
    } else {
      console.log('❌ No se recibió respuesta JSON válida');
      console.log('Stdout completo:', stdout);
    }

  } catch (error) {
    console.error('❌ Error en prueba PNG:', error.message);
  }
}

async function listAvailableMemories() {
  console.log('📋 Listando memorias disponibles...');
  
  try {
    const input = JSON.stringify({
      jsonrpc: '2.0',
      id: 0,
      method: 'tools/call',
      params: {
        name: 'list_memories',
        arguments: {
          limit: 5
        }
      }
    });

    const { stdout } = await execAsync(`echo '${input}' | node dist/index.js`, {
      cwd: process.cwd(),
      timeout: 10000
    });

    // Filtrar las líneas de stdout que son JSON válido
    const lines = stdout.trim().split('\n');
    const jsonLine = lines.find(line => {
      try {
        JSON.parse(line);
        return true;
      } catch {
        return false;
      }
    });

    if (jsonLine) {
      const response = JSON.parse(jsonLine);
      console.log('📝 Memorias disponibles encontradas');
    } else {
      console.log('❌ No se pudo obtener lista de memorias');
    }

  } catch (error) {
    console.error('❌ Error listando memorias:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de exportación...\n');

  try {
    // Asegurar que existen los directorios
    await fs.mkdir(path.join(EXPORT_DIR, 'pdf'), { recursive: true });
    await fs.mkdir(path.join(EXPORT_DIR, 'png'), { recursive: true });

    await listAvailableMemories();
    await testPDFExport();
    await testPNGExport();

    console.log('\n✅ Pruebas completadas! Verifica los archivos en:');
    console.log(`📁 PDFs: ${path.join(EXPORT_DIR, 'pdf')}`);
    console.log(`📁 PNGs: ${path.join(EXPORT_DIR, 'png')}`);

  } catch (error) {
    console.error('❌ Error general en las pruebas:', error);
  }
}

runTests().catch(console.error);