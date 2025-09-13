import { Memory } from '../interfaces/index.js';

export class MemoryUtils {
  /**
   * Valida que una memoria tenga todos los campos requeridos
   */
  static validateMemory(memory: Partial<Memory>): string[] {
    const errors: string[] = [];
    
    if (!memory.title || memory.title.trim() === '') {
      errors.push('Title is required');
    }
    
    if (!memory.content || memory.content.trim() === '') {
      errors.push('Content is required');
    }
    
    if (memory.tags && !Array.isArray(memory.tags)) {
      errors.push('Tags must be an array');
    }
    
    if (memory.priority && !['low', 'medium', 'high'].includes(memory.priority)) {
      errors.push('Priority must be low, medium, or high');
    }
    
    return errors;
  }

  /**
   * Limpia y normaliza tags
   */
  static normalizeTags(tags: string[]): string[] {
    return tags
      .filter(tag => tag && tag.trim() !== '')
      .map(tag => tag.trim().toLowerCase())
      .filter((tag, index, arr) => arr.indexOf(tag) === index); // Eliminar duplicados
  }

  /**
   * Extrae palabras clave del contenido para sugerir tags
   */
  static extractKeywords(content: string, minLength = 3, maxResults = 10): string[] {
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= minLength)
      .filter(word => !this.isStopWord(word));

    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxResults)
      .map(([word]) => word);
  }

  /**
   * Lista de palabras vacías comunes en español e inglés
   */
  private static isStopWord(word: string): boolean {
    const stopWords = [
      // Español
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le',
      'da', 'su', 'por', 'son', 'con', 'para', 'como', 'las', 'del', 'los', 'una', 'hay',
      'pero', 'sus', 'fue', 'todo', 'sobre', 'muy', 'ser', 'han', 'me', 'si', 'sin', 'o',
      'ya', 'tiene', 'más', 'esto', 'nos', 'ni', 'cuando', 'él', 'entre', 'mismo', 'solo',
      'desde', 'hasta', 'donde', 'porque', 'aunque', 'también', 'otros', 'otra', 'mismo',
      
      // Inglés
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this',
      'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ];
    
    return stopWords.includes(word);
  }

  /**
   * Calcula la similitud entre dos memorias basándose en tags y contenido
   */
  static calculateSimilarity(memory1: Memory, memory2: Memory): number {
    // Similitud por tags (peso 40%)
    const tagSimilarity = this.calculateTagSimilarity(memory1.tags, memory2.tags);
    
    // Similitud por categoría (peso 20%)
    const categorySimilarity = memory1.category === memory2.category ? 1 : 0;
    
    // Similitud por contenido (peso 40%)
    const contentSimilarity = this.calculateContentSimilarity(memory1.content, memory2.content);
    
    return (tagSimilarity * 0.4) + (categorySimilarity * 0.2) + (contentSimilarity * 0.4);
  }

  private static calculateTagSimilarity(tags1: string[], tags2: string[]): number {
    if (tags1.length === 0 && tags2.length === 0) return 1;
    if (tags1.length === 0 || tags2.length === 0) return 0;
    
    const set1 = new Set(tags1.map(tag => tag.toLowerCase()));
    const set2 = new Set(tags2.map(tag => tag.toLowerCase()));
    
    const intersection = new Set([...set1].filter(tag => set2.has(tag)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private static calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = this.extractKeywords(content1, 3, 50);
    const words2 = this.extractKeywords(content2, 3, 50);
    
    return this.calculateTagSimilarity(words1, words2);
  }

  /**
   * Genera un resumen automático del contenido
   */
  static generateSummary(content: string, maxLength = 200): string {
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
    
    if (sentences.length === 0) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }
    
    // Tomar las primeras oraciones hasta alcanzar el límite
    let summary = '';
    for (const sentence of sentences) {
      if (summary.length + sentence.length + 1 > maxLength) break;
      summary += sentence + '. ';
    }
    
    return summary.trim() || content.substring(0, maxLength) + '...';
  }

  /**
   * Formatea el tamaño en bytes a formato legible
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Formatea una fecha de forma amigable
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    
    return `${Math.floor(diffDays / 365)} years ago`;
  }
}