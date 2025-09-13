export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  memories: string[]; // Array of Memory IDs
  color?: string;
  icon?: string;
  archived?: boolean;
  tags?: string[];
}

export interface ProjectStats {
  memoriesCount: number;
  totalSize: number;
  lastUpdated: string;
  favoriteMemories: number;
}