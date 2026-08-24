import Dexie, { Table } from 'dexie';
import type { DLC, Game, Platform, Tag } from '../models/types';

class GameVaultDB extends Dexie {
  games!: Table<Game, string>;
  dlc!: Table<DLC, string>;
  tags!: Table<Tag, string>;
  platforms!: Table<Platform, string>;

  constructor() {
    super('gamevault-db');
    this.version(1).stores({
      games: 'id, title, dateAdded, updatedAt, *tagIds, *platforms',
      dlc: 'id, gameId, title, dateAdded, updatedAt, *tagIds',
      tags: 'id, name, updatedAt'
    });

    this.version(2).stores({
      games: 'id, title, dateAdded, updatedAt, *tagIds, *platforms',
      dlc: 'id, gameId, title, dateAdded, updatedAt, *tagIds, *platforms',
      tags: 'id, name, updatedAt',
      platforms: 'id, name, lastUsedAt, updatedAt'
    }).upgrade(async (transaction) => {
      const games = await transaction.table<Game, string>('games').toArray();
      const dlcItems = await transaction.table<DLC, string>('dlc').toArray();
      const platformByName = new Map<string, Platform>();

      const rememberPlatform = (name: string, usedAt: number) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;
        const normalizedName = trimmedName.toLocaleLowerCase();
        const existing = platformByName.get(normalizedName);
        if (existing) {
          existing.lastUsedAt = Math.max(existing.lastUsedAt, usedAt);
          existing.updatedAt = Math.max(existing.updatedAt, usedAt);
          return;
        }
        platformByName.set(normalizedName, {
          id: crypto.randomUUID(),
          name: trimmedName,
          createdAt: usedAt,
          updatedAt: usedAt,
          lastUsedAt: usedAt
        });
      };

      games.forEach((game) => {
        (game.platforms ?? []).forEach((name) => rememberPlatform(name, game.updatedAt ?? game.dateAdded));
      });

      for (const item of dlcItems) {
        const platforms = Array.isArray(item.platforms) ? item.platforms : [];
        platforms.forEach((name) => rememberPlatform(name, item.updatedAt ?? item.dateAdded));
        if (!Array.isArray(item.platforms)) {
          await transaction.table<DLC, string>('dlc').update(item.id, { platforms });
        }
      }

      await transaction.table<Platform, string>('platforms').bulkPut([...platformByName.values()]);
    });
  }
}

export const db = new GameVaultDB();
