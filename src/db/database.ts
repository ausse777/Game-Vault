import Dexie, { Table } from 'dexie';
import type { DLC, Game, Tag } from '../models/types';

class GameVaultDB extends Dexie {
  games!: Table<Game, string>;
  dlc!: Table<DLC, string>;
  tags!: Table<Tag, string>;

  constructor() {
    super('gamevault-db');
    this.version(1).stores({
      games: 'id, title, dateAdded, updatedAt, *tagIds, *platforms',
      dlc: 'id, gameId, title, dateAdded, updatedAt, *tagIds',
      tags: 'id, name, updatedAt'
    });
  }
}

export const db = new GameVaultDB();
