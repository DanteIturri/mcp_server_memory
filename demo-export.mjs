#!/usr/bin/env node
/**
 * Script de demostración de las funcionalidades de exportación PDF y PNG
 * del Memory MCP Server
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

class MCPExportDemo {
  constructor() {
    this.baseDir = process.cwd();
    this.exportDir = path.join(this.baseDir, 'memory_exports');
  }

  async callMCPTool(toolName, args) {
    const input = {
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 1000),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    try {
      const { stdout, stderr } = await execAsync(
        `echo '${JSON.stringify(input)}' | timeout 60s node dist/index.js`,
        {
          cwd: this.baseDir,
          maxBuffer: 1024 * 1024 * 10,
        }
      );

      // Buscar respuesta JSON válida
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          return response;
        } catch (e) {
          continue;
        }
      }
      throw new Error('No se recibió respuesta JSON válida');
    } catch (error) {
      throw new Error(`Error llamando a ${toolName}: ${error.message}`);
    }
  }

  async listMemories() {
    console.log('📋 Obteniendo lista de memorias...');
    try {
      const response = await this.callMCPTool('list_memories', { limit: 3 });
      if (response.result?.content?.[0]?.text) {
        console.log('✅ Memorias disponibles:');
        console.log(response.result.content[0].text.substring(0, 300) + '...');
      }
      return true;
    } catch (error) {
      console.error('❌ Error listando memorias:', error.message);
      return false;
    }
  }

  async exportToPDF(memoryId, theme = 'professional') {
    console.log(`\n📄 Exportando memoria a PDF (tema: ${theme})...`);
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `demo_${theme}_${timestamp}`;
      
      const response = await this.callMCPTool('export_memory_pdf', {
        id: memoryId,
        outputPath: path.join(this.exportDir, 'pdf'),
        fileName: fileName,
        theme: theme,
        includeMetadata: true
      });

      if (response.result?.content?.[0]?.text?.includes('✅')) {
        console.log('✅ PDF exportado exitosamente');
        console.log(response.result.content[0].text);
        return true;
      } else {
        console.log('❌ Error en exportación PDF:', response.result?.content?.[0]?.text);
        return false;
      }
    } catch (error) {
      console.error('❌ Error exportando PDF:', error.message);
      return false;
    }
  }

  async exportToPNG(memoryId, theme = 'light', width = 1200) {
    console.log(`\n🖼️ Exportando memoria a PNG (tema: ${theme}, ancho: ${width}px)...`);
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `demo_${theme}_${width}w_${timestamp}`;
      
      const response = await this.callMCPTool('export_memory_png', {
        id: memoryId,
        outputPath: path.join(this.exportDir, 'png'),
        fileName: fileName,
        theme: theme,
        includeMetadata: true,
        width: width
      });

      if (response.result?.content?.[0]?.text?.includes('✅')) {
        console.log('✅ PNG exportado exitosamente');
        console.log(response.result.content[0].text);
        return true;
      } else {
        console.log('❌ Error en exportación PNG:', response.result?.content?.[0]?.text);
        return false;
      }
    } catch (error) {
      console.error('❌ Error exportando PNG:', error.message);
      return false;
    }
  }

  async showExportedFiles() {
    console.log('\n📁 Archivos exportados:');
    
    try {
      const pdfFiles = await fs.readdir(path.join(this.exportDir, 'pdf'));
      const pngFiles = await fs.readdir(path.join(this.exportDir, 'png'));
      
      console.log('\n📄 PDFs generados:');
      for (const file of pdfFiles.filter(f => f.startsWith('demo_'))) {
        const stats = await fs.stat(path.join(this.exportDir, 'pdf', file));
        console.log(`  - ${file} (${Math.round(stats.size / 1024)}KB)`);
      }
      
      console.log('\n🖼️ PNGs generados:');
      for (const file of pngFiles.filter(f => f.startsWith('demo_'))) {
        const stats = await fs.stat(path.join(this.exportDir, 'png', file));
        console.log(`  - ${file} (${Math.round(stats.size / 1024)}KB)`);
      }
      
    } catch (error) {
      console.error('❌ Error listando archivos:', error.message);
    }
  }

  async runDemo() {
    console.log('🚀 === DEMOSTRACIÓN DE EXPORTACIÓN MEMORY MCP SERVER ===\n');
    
    // Asegurar directorios
    await fs.mkdir(path.join(this.exportDir, 'pdf'), { recursive: true });
    await fs.mkdir(path.join(this.exportDir, 'png'), { recursive: true });

    const memoryId = 'memory_1757801332284_85kamevci';
    
    // 1. Listar memorias
    await this.listMemories();
    
    // 2. Exportar PDFs con diferentes temas
    console.log('\n=== EXPORTACIÓN PDF ===');
    await this.exportToPDF(memoryId, 'professional');
    await this.exportToPDF(memoryId, 'light');
    await this.exportToPDF(memoryId, 'dark');
    
    // 3. Exportar PNGs con diferentes configuraciones
    console.log('\n=== EXPORTACIÓN PNG ===');
    await this.exportToPNG(memoryId, 'light', 1200);
    await this.exportToPNG(memoryId, 'dark', 800);
    await this.exportToPNG(memoryId, 'professional', 1600);
    
    // 4. Mostrar resumen
    await this.showExportedFiles();
    
    console.log('\n🎉 ¡Demostración completada!');
    console.log(`📁 Todos los archivos están en: ${this.exportDir}`);
    console.log('\n✨ Características disponibles:');
    console.log('  • Exportación a PDF con 3 temas (light, dark, professional)');
    console.log('  • Exportación a PNG con dimensiones personalizables');
    console.log('  • Inclusión opcional de metadatos');
    console.log('  • Nombres de archivo únicos con timestamp');
    console.log('  • Estilos CSS optimizados para cada formato');
  }
}

// Ejecutar demostración
const demo = new MCPExportDemo();
demo.runDemo().catch(console.error);