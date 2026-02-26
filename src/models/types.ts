export type CustomFieldType = 'text' | 'number' | 'boolean' | 'date' | 'choice';

export interface CustomField {
  key: string;
  type: CustomFieldType;
  value: string | number | boolean;
  options?: string[];
}

export interface Tag {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface DLC {
  id: string;
  gameId: string;
  title: string;
  dateAdded: number;
  updatedAt: number;
  tagIds: string[];
  customFields: CustomField[];
}

export interface Game {
  id: string;
  title: string;
  platforms: string[];
  dateAdded: number;
  updatedAt: number;
  tagIds: string[];
  customFields: CustomField[];
}

export type SortOption = 'az' | 'za' | 'newest' | 'oldest';

export interface BackupPayload {
  version: number;
  exportedAt: number;
  games: Game[];
  dlc: DLC[];
  tags: Tag[];
}
