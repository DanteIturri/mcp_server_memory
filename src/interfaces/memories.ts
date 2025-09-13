export interface Memory {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  projectId?: string;
  archived?: boolean;
  favorite?: boolean;
  size?: number;
}

export interface MemorySearchOptions {
  query?: string;
  tags?: string[];
  category?: string;
  projectId?: string;
  priority?: 'low' | 'medium' | 'high';
  archived?: boolean;
  favorite?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface MemoryStats {
  total: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  archived: number;
  favorites: number;
  totalSize: number;
}