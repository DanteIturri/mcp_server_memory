import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const memoryTools: Tool[] = [
  {
    name: 'create_memory',
    description: 'Create a new memory as a markdown file with advanced metadata',
    inputSchema: {
      type: 'object',
      properties: {
        title: { 
          type: 'string', 
          description: 'Title of the memory',
          minLength: 1,
          maxLength: 200
        },
        content: { 
          type: 'string', 
          description: 'Content of the memory in markdown format',
          minLength: 1
        },
        tags: { 
          type: 'array', 
          items: { type: 'string' }, 
          description: 'Tags to categorize the memory',
          maxItems: 20
        },
        priority: { 
          type: 'string', 
          enum: ['low', 'medium', 'high'], 
          description: 'Priority level (default: medium)',
          default: 'medium'
        },
        category: { 
          type: 'string', 
          description: 'Category for organization (default: general)',
          default: 'general',
          maxLength: 50
        },
        projectId: { 
          type: 'string', 
          description: 'Associated project ID (optional)'
        },
        favorite: { 
          type: 'boolean', 
          description: 'Mark as favorite (default: false)',
          default: false
        },
      },
      required: ['title', 'content'],
      additionalProperties: false
    },
  },
  {
    name: 'read_memory',
    description: 'Read a specific memory by ID with formatted output',
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'ID of the memory to read',
          pattern: '^memory_[0-9]+_[a-z0-9]+$'
        },
      },
      required: ['id'],
      additionalProperties: false
    },
  },
  {
    name: 'list_memories',
    description: 'List memories with advanced filtering options',
    inputSchema: {
      type: 'object',
      properties: {
        tags: { 
          type: 'array', 
          items: { type: 'string' }, 
          description: 'Filter by tags (any match)',
          maxItems: 10
        },
        category: { 
          type: 'string', 
          description: 'Filter by exact category match'
        },
        priority: { 
          type: 'string', 
          enum: ['low', 'medium', 'high'], 
          description: 'Filter by priority level'
        },
        archived: { 
          type: 'boolean', 
          description: 'Filter by archived status (default: false)',
          default: false
        },
        favorite: { 
          type: 'boolean', 
          description: 'Filter by favorite status'
        },
        limit: { 
          type: 'number', 
          description: 'Maximum number of results (default: 50)',
          minimum: 1,
          maximum: 200,
          default: 50
        },
        sortBy: {
          type: 'string',
          enum: ['updated', 'created', 'title', 'priority'],
          description: 'Sort results by field (default: updated)',
          default: 'updated'
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order (default: desc)',
          default: 'desc'
        }
      },
      additionalProperties: false
    },
  },
  {
    name: 'update_memory',
    description: 'Update an existing memory with partial updates',
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'ID of the memory to update',
          pattern: '^memory_[0-9]+_[a-z0-9]+$'
        },
        title: { 
          type: 'string', 
          description: 'New title (optional)',
          minLength: 1,
          maxLength: 200
        },
        content: { 
          type: 'string', 
          description: 'New content (optional)',
          minLength: 1
        },
        tags: { 
          type: 'array', 
          items: { type: 'string' }, 
          description: 'New tags (optional)',
          maxItems: 20
        },
        priority: { 
          type: 'string', 
          enum: ['low', 'medium', 'high'], 
          description: 'New priority (optional)'
        },
        category: { 
          type: 'string', 
          description: 'New category (optional)',
          maxLength: 50
        },
        favorite: { 
          type: 'boolean', 
          description: 'Update favorite status (optional)'
        },
        archived: { 
          type: 'boolean', 
          description: 'Update archived status (optional)'
        },
      },
      required: ['id'],
      additionalProperties: false,
      minProperties: 2 // At least ID and one other property
    },
  },
  {
    name: 'delete_memory',
    description: 'Permanently delete a memory by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'ID of the memory to delete',
          pattern: '^memory_[0-9]+_[a-z0-9]+$'
        },
        confirm: {
          type: 'boolean',
          description: 'Confirmation flag to prevent accidental deletion',
          const: true
        }
      },
      required: ['id', 'confirm'],
      additionalProperties: false
    },
  },
  {
    name: 'search_memories',
    description: 'Advanced search with full-text search and metadata filtering',
    inputSchema: {
      type: 'object',
      properties: {
        query: { 
          type: 'string', 
          description: 'Search query for content, title, and tags',
          minLength: 1
        },
        tags: { 
          type: 'array', 
          items: { type: 'string' }, 
          description: 'Filter by tags (any match)',
          maxItems: 10
        },
        category: { 
          type: 'string', 
          description: 'Filter by category'
        },
        priority: { 
          type: 'string', 
          enum: ['low', 'medium', 'high'], 
          description: 'Filter by priority'
        },
        archived: { 
          type: 'boolean', 
          description: 'Include archived memories (default: false)',
          default: false
        },
        favorite: { 
          type: 'boolean', 
          description: 'Filter favorites only'
        },
        limit: { 
          type: 'number', 
          description: 'Maximum results (default: 20)',
          minimum: 1,
          maximum: 100,
          default: 20
        },
        highlightMatch: {
          type: 'boolean',
          description: 'Highlight search terms in results (default: true)',
          default: true
        }
      },
      required: ['query'],
      additionalProperties: false
    },
  },
  {
    name: 'get_memory_stats',
    description: 'Get comprehensive statistics about memories',
    inputSchema: {
      type: 'object',
      properties: {
        detailed: {
          type: 'boolean',
          description: 'Include detailed breakdown (default: false)',
          default: false
        }
      },
      additionalProperties: false
    },
  },
  {
    name: 'backup_memories',
    description: 'Create a timestamped backup of all memories',
    inputSchema: {
      type: 'object',
      properties: {
        includeConfig: { 
          type: 'boolean', 
          description: 'Include configuration in backup (default: true)',
          default: true
        },
        compress: {
          type: 'boolean',
          description: 'Compress backup files (default: false)',
          default: false
        },
        description: {
          type: 'string',
          description: 'Optional description for the backup',
          maxLength: 200
        }
      },
      additionalProperties: false
    },
  },
  {
    name: 'toggle_favorite',
    description: 'Toggle favorite status of a memory',
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'ID of the memory',
          pattern: '^memory_[0-9]+_[a-z0-9]+$'
        },
      },
      required: ['id'],
      additionalProperties: false
    },
  },
  {
    name: 'archive_memory',
    description: 'Archive or unarchive a memory',
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'ID of the memory',
          pattern: '^memory_[0-9]+_[a-z0-9]+$'
        },
        archived: { 
          type: 'boolean', 
          description: 'Archive status (true to archive, false to unarchive)'
        },
      },
      required: ['id', 'archived'],
      additionalProperties: false
    },
  },
  {
    name: 'find_similar_memories',
    description: 'Find memories similar to a given memory based on content and tags',
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'ID of the reference memory',
          pattern: '^memory_[0-9]+_[a-z0-9]+$'
        },
        limit: { 
          type: 'number', 
          description: 'Maximum similar memories to return (default: 5)',
          minimum: 1,
          maximum: 20,
          default: 5
        },
        threshold: {
          type: 'number',
          description: 'Minimum similarity threshold 0-1 (default: 0.3)',
          minimum: 0,
          maximum: 1,
          default: 0.3
        }
      },
      required: ['id'],
      additionalProperties: false
    },
  },
  {
    name: 'suggest_tags',
    description: 'Suggest tags for a memory based on its content',
    inputSchema: {
      type: 'object',
      properties: {
        content: { 
          type: 'string', 
          description: 'Content to analyze for tag suggestions',
          minLength: 10
        },
        maxSuggestions: {
          type: 'number',
          description: 'Maximum number of tag suggestions (default: 8)',
          minimum: 1,
          maximum: 20,
          default: 8
        }
      },
      required: ['content'],
      additionalProperties: false
    },
  },
  {
    name: 'export_memories',
    description: 'Export memories in various formats',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['json', 'csv', 'markdown'],
          description: 'Export format (default: json)',
          default: 'json'
        },
        filter: {
          type: 'object',
          description: 'Optional filters to apply',
          properties: {
            category: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            archived: { type: 'boolean' },
            favorite: { type: 'boolean' }
          },
          additionalProperties: false
        },
        includeContent: {
          type: 'boolean',
          description: 'Include full content in export (default: true)',
          default: true
        }
      },
      additionalProperties: false
    },
  }
];