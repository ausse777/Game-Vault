import { db } from './database';
import type { BackupPayload, DLC, Game, Tag } from '../models/types';

export const repository = {
  async getLibrary() {
    const [games, dlc, tags] = await Promise.all([db.games.toArray(), db.dlc.toArray(), db.tags.toArray()]);
    return { games, dlc, tags };
  },
  async saveGame(game: Game) {
    await db.games.put(game);
  },
  async saveDlc(item: DLC) {
    await db.dlc.put(item);
  },
  async saveTag(tag: Tag) {
    await db.tags.put(tag);
  },
  async deleteGame(gameId: string) {
    await db.transaction('rw', db.games, db.dlc, async () => {
      await db.games.delete(gameId);
      await db.dlc.where('gameId').equals(gameId).delete();
    });
  },
  async deleteDlc(id: string) {
    await db.dlc.delete(id);
  },
  async deleteTag(tagId: string) {
    await db.transaction('rw', db.games, db.dlc, db.tags, async () => {
      await db.tags.delete(tagId);
      const games = await db.games.toArray();
      const dlc = await db.dlc.toArray();
      await Promise.all(games.map((game) => db.games.put({ ...game, tagIds: game.tagIds.filter((id) => id !== tagId) })));
      await Promise.all(dlc.map((item) => db.dlc.put({ ...item, tagIds: item.tagIds.filter((id) => id !== tagId) })));
    });
  },
  async exportLibrary(): Promise<BackupPayload> {
    const { games, dlc, tags } = await this.getLibrary();
    return { version: 1, exportedAt: Date.now(), games, dlc, tags };
  },
  async importLibrary(data: BackupPayload, mode: 'merge' | 'replace') {
    await db.transaction('rw', db.games, db.dlc, db.tags, async () => {
      if (mode === 'replace') {
        await Promise.all([db.games.clear(), db.dlc.clear(), db.tags.clear()]);
      }
      const upsertNewest = <T extends { id: string; updatedAt: number }>(existing: T | undefined, incoming: T): T => {
        if (!existing) return incoming;
        return existing.updatedAt > incoming.updatedAt ? existing : incoming;
      };

      for (const g of data.games) {
        const current = await db.games.get(g.id);
        await db.games.put(mode === 'merge' ? upsertNewest(current, g) : g);
      }
      for (const d of data.dlc) {
        const current = await db.dlc.get(d.id);
        await db.dlc.put(mode === 'merge' ? upsertNewest(current, d) : d);
      }
      for (const t of data.tags) {
        const current = await db.tags.get(t.id);
        await db.tags.put(mode === 'merge' ? upsertNewest(current, t) : t);
      }
    });
  }
};
