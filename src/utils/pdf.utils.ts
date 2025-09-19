import { marked } from 'marked';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { Memory } from '../interfaces/index.js';

export interface PDFExportOptions {
  theme?: 'light' | 'dark' | 'professional';
  includeMetadata?: boolean;
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export class PDFExporter {
  private static getThemeCSS(theme: string): string {
    const baseCSS = `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 40px;
        font-size: 14px;
      }
      
      h1 {
        color: #1a1a1a;
        border-bottom: 2px solid #e1e4e8;
        padding-bottom: 10px;
        margin-bottom: 20px;
        font-size: 28px;
      }
      
      h2 {
        color: #2c3e50;
        margin-top: 30px;
        margin-bottom: 15px;
        font-size: 22px;
      }
      
      h3 {
        color: #34495e;
        margin-top: 25px;
        margin-bottom: 12px;
        font-size: 18px;
      }
      
      p {
        margin-bottom: 16px;
        text-align: justify;
      }
      
      code {
        background-color: rgba(175, 184, 193, 0.2);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 85%;
      }
      
      pre {
        background-color: #f6f8fa;
        border-radius: 6px;
        padding: 16px;
        overflow: auto;
        line-height: 1.45;
        margin-bottom: 16px;
      }
      
      pre code {
        background-color: transparent;
        padding: 0;
      }
      
      blockquote {
        border-left: 4px solid #dfe2e5;
        padding-left: 16px;
        margin-left: 0;
        color: #6a737d;
        font-style: italic;
      }
      
      ul, ol {
        margin-bottom: 16px;
        padding-left: 20px;
      }
      
      li {
        margin-bottom: 4px;
      }
      
      table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 16px;
      }
      
      th, td {
        border: 1px solid #dfe2e5;
        padding: 8px 12px;
        text-align: left;
      }
      
      th {
        background-color: #f6f8fa;
        font-weight: 600;
      }
      
      .metadata {
        background-color: #f8f9fa;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 24px;
        font-size: 13px;
      }
      
      .metadata-title {
        font-weight: 600;
        color: #24292e;
        margin-bottom: 12px;
        font-size: 16px;
      }
      
      .metadata-item {
        margin-bottom: 6px;
        display: flex;
        align-items: center;
      }
      
      .metadata-label {
        font-weight: 500;
        color: #586069;
        min-width: 100px;
        margin-right: 8px;
      }
      
      .metadata-value {
        color: #24292e;
      }
      
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
      }
      
      .tag {
        background-color: #0366d6;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
      }
      
      .priority-high { background-color: #d73a49; }
      .priority-medium { background-color: #f66a0a; }
      .priority-low { background-color: #28a745; }
      
      .status-indicators {
        margin-top: 8px;
      }
      
      .status-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        margin-right: 6px;
      }
      
      .favorite { background-color: #ffd700; color: #333; }
      .archived { background-color: #6c757d; color: white; }
    `;

    const themeSpecific = {
      light: `
        body { background-color: #ffffff; color: #24292e; }
        .metadata { background-color: #f8f9fa; border-color: #e1e4e8; }
      `,
      dark: `
        body { background-color: #0d1117; color: #c9d1d9; }
        h1 { color: #f0f6fc; border-bottom-color: #30363d; }
        h2 { color: #7c8ea7; }
        h3 { color: #8b949e; }
        pre { background-color: #161b22; }
        code { background-color: rgba(110, 118, 129, 0.4); }
        blockquote { border-left-color: #30363d; color: #8b949e; }
        .metadata { background-color: #161b22; border-color: #30363d; }
        .metadata-title { color: #f0f6fc; }
        .metadata-label { color: #8b949e; }
        .metadata-value { color: #c9d1d9; }
        th { background-color: #161b22; }
        th, td { border-color: #30363d; }
      `,
      professional: `
        body { 
          background-color: #ffffff; 
          color: #2c3e50; 
          font-family: 'Times New Roman', Times, serif;
        }
        h1 { 
          color: #1a252f; 
          border-bottom: 3px solid #3498db;
          font-family: 'Arial', sans-serif;
        }
        h2 { color: #2980b9; font-family: 'Arial', sans-serif; }
        h3 { color: #34495e; font-family: 'Arial', sans-serif; }
        .metadata { 
          background-color: #ecf0f1; 
          border: 2px solid #bdc3c7;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metadata-title { color: #2c3e50; font-family: 'Arial', sans-serif; }
        pre { background-color: #f8f9fa; border: 1px solid #dee2e6; }
      `
    };

    return baseCSS + (themeSpecific[theme as keyof typeof themeSpecific] || themeSpecific.light);
  }

  private static formatMetadata(memory: Memory): string {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const priorityClass = `priority-${memory.priority || 'medium'}`;
    const statusIndicators = [];
    
    if (memory.favorite) statusIndicators.push('<span class="status-badge favorite">⭐ Favorito</span>');
    if (memory.archived) statusIndicators.push('<span class="status-badge archived">📦 Archivado</span>');

    const tags = memory.tags?.map(tag => `<span class="tag">${tag}</span>`).join('') || '';

    return `
      <div class="metadata">
        <div class="metadata-title">📋 Información de la Memoria</div>
        <div class="metadata-item">
          <span class="metadata-label">🆔 ID:</span>
          <span class="metadata-value">${memory.id}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">📁 Categoría:</span>
          <span class="metadata-value">${memory.category || 'General'}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">⚡ Prioridad:</span>
          <span class="metadata-value"><span class="tag ${priorityClass}">${memory.priority || 'medium'}</span></span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">📅 Creado:</span>
          <span class="metadata-value">${formatDate(memory.createdAt)}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">🔄 Actualizado:</span>
          <span class="metadata-value">${formatDate(memory.updatedAt)}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">📏 Tamaño:</span>
          <span class="metadata-value">${memory.size || 0} caracteres</span>
        </div>
        ${memory.projectId ? `
        <div class="metadata-item">
          <span class="metadata-label">📂 Proyecto:</span>
          <span class="metadata-value">${memory.projectId}</span>
        </div>
        ` : ''}
        ${memory.tags && memory.tags.length > 0 ? `
        <div class="metadata-item">
          <span class="metadata-label">🏷️ Etiquetas:</span>
          <div class="tags">${tags}</div>
        </div>
        ` : ''}
        ${statusIndicators.length > 0 ? `
        <div class="status-indicators">
          ${statusIndicators.join('')}
        </div>
        ` : ''}
      </div>
    `;
  }

  static async exportMemoryToPDF(
    memory: Memory, 
    outputPath: string, 
    fileName: string,
    options: PDFExportOptions = {}
  ): Promise<string> {
    const {
      theme = 'professional',
      includeMetadata = true,
      format = 'A4',
      margin = {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    } = options;

    try {
      // Asegurar que el directorio de salida existe
      await fs.mkdir(outputPath, { recursive: true });

      // Convertir markdown a HTML
      const markdownContent = includeMetadata 
        ? this.formatMetadata(memory) + '\n\n' + memory.content
        : memory.content;

      const htmlContent = await marked(markdownContent);
      
      // Crear el HTML completo con estilos
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${memory.title}</title>
          <style>
            ${this.getThemeCSS(theme)}
            
            @media print {
              body { margin: 0; }
              .metadata { page-break-inside: avoid; }
              h1, h2, h3 { page-break-after: avoid; }
              pre, blockquote { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>${memory.title}</h1>
          ${htmlContent}
          
          <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #dee2e6; padding-top: 20px;">
            Exportado el ${new Date().toLocaleString('es-ES')} • Memory MCP Server
          </div>
        </body>
        </html>
      `;

      // Generar PDF con Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

      const fullFileName = `${fileName}.pdf`;
      const fullPath = path.join(outputPath, fullFileName);

      await page.pdf({
        path: fullPath,
        format: format as any,
        margin,
        printBackground: true,
        preferCSSPageSize: true,
      });

      await browser.close();

      return fullPath;
    } catch (error) {
      throw new Error(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async exportMemoryToPNG(
    memory: Memory, 
    outputPath: string, 
    fileName: string,
    options: {
      theme?: 'light' | 'dark' | 'professional';
      includeMetadata?: boolean;
      width?: number;
      height?: number;
    } = {}
  ): Promise<string> {
    const {
      theme = 'light',
      includeMetadata = true,
      width = 1200,
      height
    } = options;

    try {
      // Asegurar que el directorio de salida existe
      await fs.mkdir(outputPath, { recursive: true });

      // Convertir markdown a HTML
      const markdownContent = includeMetadata 
        ? this.formatMetadata(memory) + '\n\n' + memory.content
        : memory.content;

      const htmlContent = await marked(markdownContent);
      
      // Crear el HTML completo con estilos optimizados para imagen
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${memory.title}</title>
          <style>
            ${this.getThemeCSS(theme)}
            
            body {
              max-width: ${width - 80}px;
              margin: 0 auto;
              padding: 40px;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <h1>${memory.title}</h1>
          ${htmlContent}
          
          <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #dee2e6; padding-top: 20px;">
            Exportado el ${new Date().toLocaleString('es-ES')} • Memory MCP Server
          </div>
        </body>
        </html>
      `;

      // Generar imagen con Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setViewport({ width, height: height || 800, deviceScaleFactor: 2 });
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

      // Si no se especifica altura, calcular automáticamente
      let screenshotOptions: any = {
        type: 'png',
        fullPage: !height,
      };

      if (height) {
        screenshotOptions.clip = {
          x: 0,
          y: 0,
          width,
          height
        };
      }

      const fullFileName = `${fileName}.png`;
      const fullPath = path.join(outputPath, fullFileName);

      screenshotOptions.path = fullPath;
      
      await page.screenshot(screenshotOptions);
      await browser.close();

      return fullPath;
    } catch (error) {
      throw new Error(`Error generating PNG: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}