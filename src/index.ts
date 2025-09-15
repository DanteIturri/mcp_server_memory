import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { Memory, MemorySearchOptions, MemoryStats, Project, ProjectStats } from './interfaces/index.js';

import { config } from 'dotenv';
config();
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios donde se guardarán las memorias y configuraciones
const MEMORIES_DIR = path.join(__dirname, 'memories');
const PROJECTS_DIR = path.join(__dirname, 'projects');
const CONFIG_DIR = path.join(__dirname, 'config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'settings.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

interface ServerConfig {
  maxMemories: number;
  autoBackup: boolean;
  backupInterval: number; // en horas
  searchLimit: number;
}

class MemoryServer {
  private server: Server;
  private config: ServerConfig;

  constructor() {
    this.config = {
      maxMemories: 10000,
      autoBackup: true,
      backupInterval: 24,
      searchLimit: 100
    };

    this.server = new Server(
      {
        name: 'memory-server',
        version: '2.0.0',
        description: 'Servidor MCP avanzado para gestión de memorias markdown con búsqueda, organización y respaldo automático',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );
    this.setupToolsHandlers();
    this.setupResourcesHandlers();
    this.setupErrorHandling();
    this.initializeConfig();
  }

  private async initializeConfig(): Promise<void> {
    try {
      await this.ensureConfigDir();
      const configContent = await fs.readFile(CONFIG_FILE, 'utf-8');
      this.config = { ...this.config, ...JSON.parse(configContent) };
    } catch {
      // Usar configuración por defecto si no existe archivo
      await this.saveConfig();
    }
  }

  private async saveConfig(): Promise<void> {
    await this.ensureConfigDir();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
  }

  private async ensureConfigDir(): Promise<void> {
    try {
      await fs.access(CONFIG_DIR);
    } catch {
      await fs.mkdir(CONFIG_DIR, { recursive: true });
    }
  }

  private async ensureMemoriesDir(): Promise<void> {
    try {
      await fs.access(MEMORIES_DIR);
    } catch {
      await fs.mkdir(MEMORIES_DIR, { recursive: true });
    }
  }

  private async ensureProjectsDir(): Promise<void> {
    try {
      await fs.access(PROJECTS_DIR);
    } catch {
      await fs.mkdir(PROJECTS_DIR, { recursive: true });
    }
  }

  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.access(BACKUP_DIR);
    } catch {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
  }

  private generateMemoryId(): string {
    return `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMemoryFilePath(id: string): string {
    return path.join(MEMORIES_DIR, `${id}.md`);
  }

  private getProjectFilePath(id: string): string {
    return path.join(PROJECTS_DIR, `${id}.json`);
  }

  private formatMemoryAsMarkdown(memory: Memory): string {
    const frontMatter = `---
id: ${memory.id}
title: ${memory.title}
tags: [${memory.tags.join(', ')}]
created: ${memory.createdAt}
updated: ${memory.updatedAt}
priority: ${memory.priority || 'medium'}
category: ${memory.category || 'general'}
projectId: ${memory.projectId || ''}
archived: ${memory.archived || false}
favorite: ${memory.favorite || false}
size: ${memory.content.length}
---

`;
    return frontMatter + memory.content;
  }

  private parseMarkdownMemory(content: string): Memory {
    const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontMatterRegex);

    if (!match) {
      throw new Error('Invalid memory format - missing front matter');
    }

    const frontMatter = match[1];
    const bodyContent = match[2].trim();

    const metadata: any = {};
    frontMatter.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        if (key.trim() === 'tags') {
          metadata[key.trim()] = value.replace(/[\[\]]/g, '').split(',').map(tag => tag.trim());
        } else if (key.trim() === 'archived' || key.trim() === 'favorite') {
          metadata[key.trim()] = value === 'true';
        } else if (key.trim() === 'size') {
          metadata[key.trim()] = parseInt(value) || 0;
        } else {
          metadata[key.trim()] = value;
        }
      }
    });

    return {
      id: metadata.id,
      title: metadata.title,
      content: bodyContent,
      tags: metadata.tags || [],
      createdAt: metadata.created,
      updatedAt: metadata.updated,
      priority: metadata.priority || 'medium',
      category: metadata.category || 'general',
      projectId: metadata.projectId || undefined,
      archived: metadata.archived || false,
      favorite: metadata.favorite || false,
      size: bodyContent.length,
    };
  }

  private async saveProject(project: Project): Promise<void> {
    const filePath = this.getProjectFilePath(project.id);
    await fs.writeFile(filePath, JSON.stringify(project, null, 2), 'utf-8');
  }

  private async loadProject(id: string): Promise<Project> {
    const filePath = this.getProjectFilePath(id);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as Project;
  }

  private async updateMemoryProjectLink(memoryId: string, oldProjectId?: string, newProjectId?: string): Promise<void> {
    // Actualizar el proyecto anterior (remover memoria)
    if (oldProjectId) {
      try {
        const oldProject = await this.loadProject(oldProjectId);
        oldProject.memories = oldProject.memories.filter(id => id !== memoryId);
        oldProject.updatedAt = new Date().toISOString();
        await this.saveProject(oldProject);
      } catch (error) {
        console.warn(`Could not update old project ${oldProjectId}:`, error);
      }
    }

    // Actualizar el nuevo proyecto (añadir memoria)
    if (newProjectId) {
      try {
        const newProject = await this.loadProject(newProjectId);
        if (!newProject.memories.includes(memoryId)) {
          newProject.memories.push(memoryId);
          newProject.updatedAt = new Date().toISOString();
          await this.saveProject(newProject);
        }
      } catch (error) {
        console.warn(`Could not update new project ${newProjectId}:`, error);
      }
    }
  }

  private async getMemoryStats(): Promise<MemoryStats> {
    try {
      const files = await fs.readdir(MEMORIES_DIR);
      const memoryFiles = files.filter(file => file.endsWith('.md'));
      
      const stats: MemoryStats = {
        total: 0,
        byCategory: {},
        byPriority: { low: 0, medium: 0, high: 0 },
        archived: 0,
        favorites: 0,
        totalSize: 0
      };

      for (const file of memoryFiles) {
        try {
          const content = await fs.readFile(path.join(MEMORIES_DIR, file), 'utf-8');
          const memory = this.parseMarkdownMemory(content);
          
          stats.total++;
          stats.totalSize += memory.size || 0;
          
          if (memory.archived) stats.archived++;
          if (memory.favorite) stats.favorites++;
          
          const category = memory.category || 'general';
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
          
          const priority = memory.priority || 'medium';
          stats.byPriority[priority]++;
        } catch (error) {
          console.error(`Error parsing memory file ${file}:`, error);
        }
      }

      return stats;
    } catch (error) {
      throw new Error(`Error getting memory stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private setupResourcesHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'memory://stats',
            name: 'Memory Statistics',
            description: 'Overall statistics about memories',
            mimeType: 'application/json',
          },
          {
            uri: 'memory://config',
            name: 'Server Configuration',
            description: 'Current server configuration',
            mimeType: 'application/json',
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'memory://stats':
          const stats = await this.getMemoryStats();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(stats, null, 2),
              },
            ],
          };

        case 'memory://config':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.config, null, 2),
              },
            ],
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  private setupToolsHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_memory',
            description: 'Create a new memory as a markdown file',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Title of the memory' },
                content: { type: 'string', description: 'Content of the memory in markdown format' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Tags to categorize the memory' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level' },
                category: { type: 'string', description: 'Category for organization' },
                projectId: { type: 'string', description: 'Associated project ID' },
                favorite: { type: 'boolean', description: 'Mark as favorite' },
              },
              required: ['title', 'content'],
            },
          },
          {
            name: 'read_memory',
            description: 'Read a specific memory by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'ID of the memory to read' },
              },
              required: ['id'],
            },
          },
          {
            name: 'list_memories',
            description: 'List all memories with their metadata',
            inputSchema: {
              type: 'object',
              properties: {
                tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
                category: { type: 'string', description: 'Filter by category' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Filter by priority' },
                archived: { type: 'boolean', description: 'Filter by archived status' },
                favorite: { type: 'boolean', description: 'Filter by favorite status' },
                limit: { type: 'number', description: 'Maximum number of results' },
              },
            },
          },
          {
            name: 'update_memory',
            description: 'Update an existing memory',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'ID of the memory to update' },
                title: { type: 'string', description: 'New title' },
                content: { type: 'string', description: 'New content' },
                tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'New priority' },
                category: { type: 'string', description: 'New category' },
                projectId: { type: 'string', description: 'Associated project ID' },
                favorite: { type: 'boolean', description: 'Mark as favorite' },
                archived: { type: 'boolean', description: 'Archive status' },
              },
              required: ['id'],
            },
          },
          {
            name: 'delete_memory',
            description: 'Delete a memory by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'ID of the memory to delete' },
              },
              required: ['id'],
            },
          },
          {
            name: 'search_memories',
            description: 'Advanced search memories by content, title, tags, or metadata',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
                category: { type: 'string', description: 'Filter by category' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Filter by priority' },
                archived: { type: 'boolean', description: 'Include archived memories' },
                favorite: { type: 'boolean', description: 'Filter favorites only' },
                limit: { type: 'number', description: 'Maximum results' },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_memory_stats',
            description: 'Get comprehensive statistics about memories',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'backup_memories',
            description: 'Create a backup of all memories',
            inputSchema: {
              type: 'object',
              properties: {
                includeConfig: { type: 'boolean', description: 'Include configuration in backup' },
              },
            },
          },
          {
            name: 'toggle_favorite',
            description: 'Toggle favorite status of a memory',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'ID of the memory' },
              },
              required: ['id'],
            },
          },
          {
            name: 'archive_memory',
            description: 'Archive or unarchive a memory',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'ID of the memory' },
                archived: { type: 'boolean', description: 'Archive status' },
              },
              required: ['id', 'archived'],
            },
          },
          {
            name: 'create_project',
            description: 'Create a new project to organize memories',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Project name' },
                description: { type: 'string', description: 'Project description' },
                color: { type: 'string', description: 'Project color (optional)' },
                icon: { type: 'string', description: 'Project icon (optional)' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Project tags' },
              },
              required: ['name', 'description'],
            },
          },
          {
            name: 'list_projects',
            description: 'List all projects with their statistics',
            inputSchema: {
              type: 'object',
              properties: {
                archived: { type: 'boolean', description: 'Include archived projects' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
              },
            },
          },
          {
            name: 'read_project',
            description: 'Read project details and associated memories',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Project ID' },
                includeMemories: { type: 'boolean', description: 'Include memory summaries', default: true },
              },
              required: ['id'],
            },
          },
          {
            name: 'update_project',
            description: 'Update project information',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Project ID' },
                name: { type: 'string', description: 'New project name' },
                description: { type: 'string', description: 'New project description' },
                color: { type: 'string', description: 'New project color' },
                icon: { type: 'string', description: 'New project icon' },
                tags: { type: 'array', items: { type: 'string' }, description: 'New project tags' },
                archived: { type: 'boolean', description: 'Archive status' },
              },
              required: ['id'],
            },
          },
          {
            name: 'delete_project',
            description: 'Delete a project (memories will be unlinked)',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Project ID' },
                confirm: { type: 'boolean', description: 'Confirmation flag', const: true },
              },
              required: ['id', 'confirm'],
            },
          },
          {
            name: 'list_memories_by_project',
            description: 'List all memories linked to a specific project',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'string', description: 'Project ID' },
                limit: { type: 'number', description: 'Maximum number of results', default: 50 },
                archived: { type: 'boolean', description: 'Include archived memories', default: false },
                favorite: { type: 'boolean', description: 'Filter by favorite status' },
              },
              required: ['projectId'],
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      await this.ensureMemoriesDir();
      await this.ensureProjectsDir();

      try {
        switch (name) {
          case 'create_memory':
            return await this.createMemory(args);
          case 'read_memory':
            return await this.readMemory(args);
          case 'list_memories':
            return await this.listMemories(args);
          case 'update_memory':
            return await this.updateMemory(args);
          case 'delete_memory':
            return await this.deleteMemory(args);
          case 'search_memories':
            return await this.searchMemories(args);
          case 'get_memory_stats':
            return await this.getStatsResponse();
          case 'backup_memories':
            return await this.backupMemories(args);
          case 'toggle_favorite':
            return await this.toggleFavorite(args);
          case 'archive_memory':
            return await this.archiveMemory(args);
          case 'create_project':
            return await this.createProject(args);
          case 'list_projects':
            return await this.listProjects(args);
          case 'read_project':
            return await this.readProject(args);
          case 'update_project':
            return await this.updateProject(args);
          case 'delete_project':
            return await this.deleteProject(args);
          case 'list_memories_by_project':
            return await this.listMemoriesByProject(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async createMemory(args: any) {
    const { title, content, tags = [], priority = 'medium', category = 'general', projectId, favorite = false } = args;
    const now = new Date().toISOString();

    // Verificar límite de memorias
    const stats = await this.getMemoryStats();
    if (stats.total >= this.config.maxMemories) {
      throw new Error(`Maximum number of memories reached (${this.config.maxMemories})`);
    }

    const memory: Memory = {
      id: this.generateMemoryId(),
      title,
      content,
      tags,
      createdAt: now,
      updatedAt: now,
      priority,
      category,
      projectId,
      archived: false,
      favorite,
      size: content.length,
    };

    const markdownContent = this.formatMemoryAsMarkdown(memory);
    const filePath = this.getMemoryFilePath(memory.id);

    await fs.writeFile(filePath, markdownContent, 'utf-8');

    // Vincular memoria al proyecto si se especifica
    if (projectId) {
      await this.updateMemoryProjectLink(memory.id, undefined, projectId);
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Memory created successfully!\n**ID:** ${memory.id}\n**Title:** ${memory.title}\n**Category:** ${memory.category}\n**Priority:** ${memory.priority}${projectId ? `\n**Linked to Project:** ${projectId}` : ''}\n**File:** ${filePath}`,
        },
      ],
    };
  }

  private async readMemory(args: any) {
    const { id } = args;
    const filePath = this.getMemoryFilePath(id);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const memory = this.parseMarkdownMemory(content);

      const statusIcons = [];
      if (memory.favorite) statusIcons.push('⭐');
      if (memory.archived) statusIcons.push('📦');
      if (memory.priority === 'high') statusIcons.push('🔴');
      else if (memory.priority === 'low') statusIcons.push('🟢');

      return {
        content: [
          {
            type: 'text',
            text: `# ${memory.title} ${statusIcons.join(' ')}\n\n**📁 Category:** ${memory.category}\n**🏷️ Tags:** ${memory.tags.join(', ')}\n**📅 Created:** ${memory.createdAt}\n**🔄 Updated:** ${memory.updatedAt}\n**⚡ Priority:** ${memory.priority}\n**📏 Size:** ${memory.size} characters\n\n---\n\n${memory.content}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error reading memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async listMemories(args: any) {
    const { tags: filterTags, category, priority, archived, favorite, limit = 50 } = args;

    try {
      const files = await fs.readdir(MEMORIES_DIR);
      const memoryFiles = files.filter(file => file.endsWith('.md'));

      const memories: Memory[] = [];

      for (const file of memoryFiles) {
        try {
          const content = await fs.readFile(path.join(MEMORIES_DIR, file), 'utf-8');
          const memory = this.parseMarkdownMemory(content);

          // Aplicar filtros
          if (category && memory.category !== category) continue;
          if (priority && memory.priority !== priority) continue;
          if (archived !== undefined && memory.archived !== archived) continue;
          if (favorite !== undefined && memory.favorite !== favorite) continue;
          
          if (filterTags && filterTags.length > 0) {
            const hasMatchingTag = filterTags.some((tag: string) =>
              memory.tags.some(memoryTag =>
                memoryTag.toLowerCase().includes(tag.toLowerCase())
              )
            );
            if (!hasMatchingTag) continue;
          }

          memories.push(memory);
        } catch (error) {
          console.error(`Error parsing memory file ${file}:`, error);
        }
      }

      // Ordenar por fecha de actualización (más reciente primero)
      memories.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      // Aplicar límite
      const limitedMemories = memories.slice(0, limit);

      const memoryList = limitedMemories.map(memory => {
        const statusIcons = [];
        if (memory.favorite) statusIcons.push('⭐');
        if (memory.archived) statusIcons.push('📦');
        
        const priorityIcon = memory.priority === 'high' ? '🔴' : 
                            memory.priority === 'low' ? '🟢' : '🟡';
        
        return `- **${memory.title}** ${statusIcons.join(' ')}\n  📁 ${memory.category} | ${priorityIcon} ${memory.priority} | 🏷️ ${memory.tags.join(', ')}\n  🆔 ${memory.id} | 📅 ${memory.updatedAt}\n  📏 ${memory.size} chars`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `# 📋 Memories (${limitedMemories.length}/${memories.length} shown)\n\n${memoryList || 'No memories found matching the criteria.'}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error listing memories: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async updateMemory(args: any) {
    const { id, title, content, tags, priority, category, favorite, archived, projectId } = args;
    const filePath = this.getMemoryFilePath(id);

    try {
      const existingContent = await fs.readFile(filePath, 'utf-8');
      const existingMemory = this.parseMarkdownMemory(existingContent);

      const updatedMemory: Memory = {
        ...existingMemory,
        title: title !== undefined ? title : existingMemory.title,
        content: content !== undefined ? content : existingMemory.content,
        tags: tags !== undefined ? tags : existingMemory.tags,
        priority: priority !== undefined ? priority : existingMemory.priority,
        category: category !== undefined ? category : existingMemory.category,
        favorite: favorite !== undefined ? favorite : existingMemory.favorite,
        archived: archived !== undefined ? archived : existingMemory.archived,
        projectId: projectId !== undefined ? projectId : existingMemory.projectId,
        updatedAt: new Date().toISOString(),
        size: content !== undefined ? content.length : existingMemory.size,
      };

      const markdownContent = this.formatMemoryAsMarkdown(updatedMemory);
      await fs.writeFile(filePath, markdownContent, 'utf-8');

      // Manejar cambios en la vinculación del proyecto
      if (projectId !== undefined && projectId !== existingMemory.projectId) {
        await this.updateMemoryProjectLink(id, existingMemory.projectId, projectId);
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Memory updated successfully!\n**ID:** ${id}\n**Title:** ${updatedMemory.title}\n**Category:** ${updatedMemory.category}\n**Priority:** ${updatedMemory.priority}${updatedMemory.projectId ? `\n**Linked to Project:** ${updatedMemory.projectId}` : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error updating memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async deleteMemory(args: any) {
    const { id } = args;
    const filePath = this.getMemoryFilePath(id);

    try {
      // Leer memoria antes de eliminar para mostrar información
      const content = await fs.readFile(filePath, 'utf-8');
      const memory = this.parseMarkdownMemory(content);
      
      await fs.unlink(filePath);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Memory deleted successfully!\n**Title:** ${memory.title}\n**ID:** ${id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error deleting memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async searchMemories(args: any) {
    const { query, tags: filterTags, category, priority, archived = false, favorite, limit = this.config.searchLimit } = args;

    try {
      const files = await fs.readdir(MEMORIES_DIR);
      const memoryFiles = files.filter(file => file.endsWith('.md'));

      const matchingMemories: Memory[] = [];

      for (const file of memoryFiles) {
        try {
          const content = await fs.readFile(path.join(MEMORIES_DIR, file), 'utf-8');
          const memory = this.parseMarkdownMemory(content);

          // Aplicar filtros de metadatos
          if (category && memory.category !== category) continue;
          if (priority && memory.priority !== priority) continue;
          if (memory.archived !== archived && archived !== undefined) continue;
          if (favorite !== undefined && memory.favorite !== favorite) continue;

          if (filterTags && filterTags.length > 0) {
            const hasMatchingTag = filterTags.some((tag: string) =>
              memory.tags.some(memoryTag =>
                memoryTag.toLowerCase().includes(tag.toLowerCase())
              )
            );
            if (!hasMatchingTag) continue;
          }

          // Buscar en título, contenido y tags
          const searchIn = [
            memory.title,
            memory.content,
            ...memory.tags,
            memory.category
          ].join(' ').toLowerCase();

          if (searchIn.includes(query.toLowerCase())) {
            matchingMemories.push(memory);
          }
        } catch (error) {
          console.error(`Error parsing memory file ${file}:`, error);
        }
      }

      // Ordenar por relevancia (más reciente primero)
      matchingMemories.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      // Aplicar límite
      const limitedResults = matchingMemories.slice(0, limit);

      const searchResults = limitedResults.map(memory => {
        const statusIcons = [];
        if (memory.favorite) statusIcons.push('⭐');
        if (memory.archived) statusIcons.push('📦');
        
        const priorityIcon = memory.priority === 'high' ? '🔴' : 
                            memory.priority === 'low' ? '🟢' : '🟡';
        
        // Mostrar preview con contexto de búsqueda
        const preview = memory.content.substring(0, 150);
        const highlightedPreview = preview.replace(
          new RegExp(query, 'gi'), 
          `**${query}**`
        );
        
        return `- **${memory.title}** ${statusIcons.join(' ')}\n  📁 ${memory.category} | ${priorityIcon} ${memory.priority} | 🏷️ ${memory.tags.join(', ')}\n  🆔 ${memory.id}\n  📄 ${highlightedPreview}...`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `# 🔍 Search Results for "${query}" (${limitedResults.length}/${matchingMemories.length} shown)\n\n${searchResults || 'No memories found matching your search criteria.'}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error searching memories: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getStatsResponse() {
    try {
      const stats = await this.getMemoryStats();
      
      const categoryList = Object.entries(stats.byCategory)
        .map(([cat, count]) => `  - ${cat}: ${count}`)
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `# 📊 Memory Statistics\n\n**📈 Overview:**\n- Total memories: ${stats.total}\n- Archived: ${stats.archived}\n- Favorites: ${stats.favorites}\n- Total size: ${(stats.totalSize / 1024).toFixed(2)} KB\n\n**📁 By Category:**\n${categoryList}\n\n**⚡ By Priority:**\n  - High: ${stats.byPriority.high}\n  - Medium: ${stats.byPriority.medium}\n  - Low: ${stats.byPriority.low}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error getting stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async backupMemories(args: any) {
    const { includeConfig = true } = args;
    
    try {
      await this.ensureBackupDir();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}`);
      
      await fs.mkdir(backupPath, { recursive: true });
      
      // Copiar todas las memorias
      const files = await fs.readdir(MEMORIES_DIR);
      const memoryFiles = files.filter(file => file.endsWith('.md'));
      
      for (const file of memoryFiles) {
        const source = path.join(MEMORIES_DIR, file);
        const dest = path.join(backupPath, file);
        await fs.copyFile(source, dest);
      }
      
      if (includeConfig) {
        try {
          const configSource = path.join(CONFIG_DIR, 'settings.json');
          const configDest = path.join(backupPath, 'settings.json');
          await fs.copyFile(configSource, configDest);
        } catch {
          // Crear archivo de configuración si no existe
          await fs.writeFile(
            path.join(backupPath, 'settings.json'), 
            JSON.stringify(this.config, null, 2)
          );
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Backup created successfully!\n**Path:** ${backupPath}\n**Files:** ${memoryFiles.length} memories\n**Config included:** ${includeConfig ? 'Yes' : 'No'}\n**Timestamp:** ${timestamp}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error creating backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async toggleFavorite(args: any) {
    const { id } = args;
    
    try {
      const filePath = this.getMemoryFilePath(id);
      const content = await fs.readFile(filePath, 'utf-8');
      const memory = this.parseMarkdownMemory(content);
      
      memory.favorite = !memory.favorite;
      memory.updatedAt = new Date().toISOString();
      
      const markdownContent = this.formatMemoryAsMarkdown(memory);
      await fs.writeFile(filePath, markdownContent, 'utf-8');
      
      return {
        content: [
          {
            type: 'text',
            text: `${memory.favorite ? '⭐' : '☆'} Memory "${memory.title}" ${memory.favorite ? 'added to' : 'removed from'} favorites!`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error toggling favorite: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async archiveMemory(args: any) {
    const { id, archived } = args;
    
    try {
      const filePath = this.getMemoryFilePath(id);
      const content = await fs.readFile(filePath, 'utf-8');
      const memory = this.parseMarkdownMemory(content);
      
      memory.archived = archived;
      memory.updatedAt = new Date().toISOString();
      
      const markdownContent = this.formatMemoryAsMarkdown(memory);
      await fs.writeFile(filePath, markdownContent, 'utf-8');
      
      return {
        content: [
          {
            type: 'text',
            text: `${archived ? '📦' : '📂'} Memory "${memory.title}" ${archived ? 'archived' : 'unarchived'} successfully!`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error archiving memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  // ================= PROJECT MANAGEMENT METHODS =================

  private async createProject(args: any) {
    const { name, description, color, icon, tags = [] } = args;
    const now = new Date().toISOString();

    const project: Project = {
      id: this.generateProjectId(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      memories: [],
      color,
      icon,
      archived: false,
      tags,
    };

    await this.saveProject(project);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Project created successfully!\n**ID:** ${project.id}\n**Name:** ${project.name}\n**Description:** ${project.description}${color ? `\n**Color:** ${color}` : ''}${icon ? `\n**Icon:** ${icon}` : ''}`,
        },
      ],
    };
  }

  private async listProjects(args: any) {
    const { archived = false, tags: filterTags } = args;

    try {
      const files = await fs.readdir(PROJECTS_DIR);
      const projectFiles = files.filter(file => file.endsWith('.json'));

      const projects: Project[] = [];

      for (const file of projectFiles) {
        try {
          const project = await this.loadProject(path.basename(file, '.json'));
          
          // Aplicar filtros
          if (project.archived !== archived && !archived) continue;
          
          if (filterTags && filterTags.length > 0) {
            const hasMatchingTag = filterTags.some((tag: string) =>
              project.tags?.some(projectTag =>
                projectTag.toLowerCase().includes(tag.toLowerCase())
              )
            );
            if (!hasMatchingTag) continue;
          }

          projects.push(project);
        } catch (error) {
          console.error(`Error loading project file ${file}:`, error);
        }
      }

      // Ordenar por fecha de actualización
      projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      const projectList = projects.map(project => {
        const statusIcon = project.archived ? '📦' : '📁';
        const colorIcon = project.color ? '🎨' : '';
        const iconDisplay = project.icon ? project.icon : '';
        
        return `- **${project.name}** ${statusIcon} ${iconDisplay} ${colorIcon}\n  📝 ${project.description}\n  💾 ${project.memories.length} memories | 🏷️ ${project.tags?.join(', ') || 'No tags'}\n  🆔 ${project.id} | 📅 ${project.updatedAt}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `# 📁 Projects (${projects.length} found)\n\n${projectList || 'No projects found.'}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error listing projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async readProject(args: any) {
    const { id, includeMemories = true } = args;

    try {
      const project = await this.loadProject(id);
      
      let memoriesInfo = '';
      if (includeMemories && project.memories.length > 0) {
        const memorySummaries = [];
        for (const memoryId of project.memories.slice(0, 10)) { // Limitar a 10 para no sobrecargar
          try {
            const content = await fs.readFile(this.getMemoryFilePath(memoryId), 'utf-8');
            const memory = this.parseMarkdownMemory(content);
            const statusIcons = [];
            if (memory.favorite) statusIcons.push('⭐');
            if (memory.archived) statusIcons.push('📦');
            
            memorySummaries.push(`  - **${memory.title}** ${statusIcons.join(' ')}\n    🏷️ ${memory.tags.join(', ')} | ⚡ ${memory.priority} | 📅 ${memory.updatedAt}`);
          } catch (error) {
            memorySummaries.push(`  - ❌ Memory ${memoryId} (error loading)`);
          }
        }
        
        memoriesInfo = `\n\n## 📋 Associated Memories (${project.memories.length} total):\n\n${memorySummaries.join('\n\n')}`;
        
        if (project.memories.length > 10) {
          memoriesInfo += `\n\n... and ${project.memories.length - 10} more memories. Use list_memories_by_project for complete list.`;
        }
      }

      const statusIcon = project.archived ? '📦' : '📁';
      const colorInfo = project.color ? `\n**🎨 Color:** ${project.color}` : '';
      const iconInfo = project.icon ? `\n**${project.icon} Icon:** ${project.icon}` : '';

      return {
        content: [
          {
            type: 'text',
            text: `# ${project.name} ${statusIcon} ${project.icon || ''}\n\n**📝 Description:** ${project.description}\n**🆔 ID:** ${project.id}\n**💾 Memories:** ${project.memories.length}\n**🏷️ Tags:** ${project.tags?.join(', ') || 'No tags'}\n**📅 Created:** ${project.createdAt}\n**🔄 Updated:** ${project.updatedAt}${colorInfo}${iconInfo}${memoriesInfo}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error reading project: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async updateProject(args: any) {
    const { id, name, description, color, icon, tags, archived } = args;

    try {
      const existingProject = await this.loadProject(id);

      const updatedProject: Project = {
        ...existingProject,
        name: name !== undefined ? name : existingProject.name,
        description: description !== undefined ? description : existingProject.description,
        color: color !== undefined ? color : existingProject.color,
        icon: icon !== undefined ? icon : existingProject.icon,
        tags: tags !== undefined ? tags : existingProject.tags,
        archived: archived !== undefined ? archived : existingProject.archived,
        updatedAt: new Date().toISOString(),
      };

      await this.saveProject(updatedProject);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Project updated successfully!\n**ID:** ${id}\n**Name:** ${updatedProject.name}\n**Description:** ${updatedProject.description}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error updating project: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async deleteProject(args: any) {
    const { id, confirm } = args;

    if (!confirm) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Project deletion requires confirmation. Set confirm: true to proceed.`,
          },
        ],
        isError: true,
      };
    }

    try {
      const project = await this.loadProject(id);
      
      // Desvincular todas las memorias del proyecto
      for (const memoryId of project.memories) {
        try {
          const content = await fs.readFile(this.getMemoryFilePath(memoryId), 'utf-8');
          const memory = this.parseMarkdownMemory(content);
          
          // Remover projectId de la memoria
          const updatedMemory: Memory = {
            ...memory,
            projectId: undefined,
            updatedAt: new Date().toISOString(),
          };
          
          const markdownContent = this.formatMemoryAsMarkdown(updatedMemory);
          await fs.writeFile(this.getMemoryFilePath(memoryId), markdownContent, 'utf-8');
        } catch (error) {
          console.warn(`Could not unlink memory ${memoryId}:`, error);
        }
      }
      
      // Eliminar el archivo del proyecto
      await fs.unlink(this.getProjectFilePath(id));
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Project deleted successfully!\n**Name:** ${project.name}\n**ID:** ${id}\n**Unlinked memories:** ${project.memories.length}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error deleting project: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async listMemoriesByProject(args: any) {
    const { projectId, limit = 50, archived = false, favorite } = args;

    try {
      const project = await this.loadProject(projectId);
      const memories: Memory[] = [];

      for (const memoryId of project.memories) {
        try {
          const content = await fs.readFile(this.getMemoryFilePath(memoryId), 'utf-8');
          const memory = this.parseMarkdownMemory(content);

          // Aplicar filtros
          if (memory.archived !== archived && !archived) continue;
          if (favorite !== undefined && memory.favorite !== favorite) continue;

          memories.push(memory);
        } catch (error) {
          console.error(`Error loading memory ${memoryId}:`, error);
        }
      }

      // Ordenar por fecha de actualización
      memories.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      // Aplicar límite
      const limitedMemories = memories.slice(0, limit);

      const memoryList = limitedMemories.map(memory => {
        const statusIcons = [];
        if (memory.favorite) statusIcons.push('⭐');
        if (memory.archived) statusIcons.push('📦');
        
        const priorityIcon = memory.priority === 'high' ? '🔴' : 
                            memory.priority === 'low' ? '🟢' : '🟡';
        
        return `- **${memory.title}** ${statusIcons.join(' ')}\n  📁 ${memory.category} | ${priorityIcon} ${memory.priority} | 🏷️ ${memory.tags.join(', ')}\n  🆔 ${memory.id} | 📅 ${memory.updatedAt}\n  📏 ${memory.size} chars`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `# 📋 Memories in Project "${project.name}" (${limitedMemories.length}/${memories.length} shown)\n\n${memoryList || 'No memories found in this project.'}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error listing project memories: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`🚀 Memory MCP Server v2.0.0 running on stdio`);
    console.error(`📁 Memories directory: ${MEMORIES_DIR}`);
    console.error(`⚙️ Config directory: ${CONFIG_DIR}`);
    console.error(`💾 Backup directory: ${BACKUP_DIR}`);
    console.error(`📊 Max memories: ${this.config.maxMemories}`);
  }
}

const memoryServer = new MemoryServer();
memoryServer.run().catch(console.error);