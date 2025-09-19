import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';

// Función simple para probar la conversión de markdown a HTML
async function testMarkdownToHTML() {
  console.log('🧪 Probando conversión Markdown a HTML...');
  
  try {
    // Leer una memoria existente
    const memoryPath = '/home/dante/Documentos/mcp_server_memory/src/memories/memory_1757801332284_85kamevci.md';
    const content = await fs.readFile(memoryPath, 'utf-8');
    
    console.log('✅ Memoria leída exitosamente');
    
    // Parsear el contenido markdown (simplificado)
    const lines = content.split('\n');
    let inFrontMatter = false;
    let frontMatterEnd = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        if (!inFrontMatter) {
          inFrontMatter = true;
        } else {
          frontMatterEnd = i;
          break;
        }
      }
    }
    
    const markdownContent = lines.slice(frontMatterEnd + 1).join('\n');
    console.log('✅ Contenido Markdown extraído');
    
    // Convertir a HTML
    const htmlContent = await marked(markdownContent);
    console.log('✅ Conversión a HTML exitosa');
    
    // Crear HTML completo
    const fullHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Memoria Exportada</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      margin: 40px;
      color: #333;
    }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #2980b9; margin-top: 30px; }
    code { background-color: #f8f9fa; padding: 2px 6px; border-radius: 3px; }
    pre { background-color: #f8f9fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; padding-left: 16px; margin-left: 0; font-style: italic; }
  </style>
</head>
<body>
  ${htmlContent}
  <hr>
  <p style="text-align: center; color: #666; font-size: 12px;">
    Exportado el ${new Date().toLocaleString('es-ES')} • Memory MCP Server
  </p>
</body>
</html>
    `;
    
    // Guardar HTML para verificar
    const outputDir = '/home/dante/Documentos/mcp_server_memory/memory_exports';
    await fs.mkdir(outputDir, { recursive: true });
    
    const htmlPath = path.join(outputDir, 'test_memory.html');
    await fs.writeFile(htmlPath, fullHtml, 'utf-8');
    
    console.log(`✅ Archivo HTML generado: ${htmlPath}`);
    console.log('🎉 ¡Prueba de conversión exitosa!');
    
    return htmlPath;
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testMarkdownToHTML();