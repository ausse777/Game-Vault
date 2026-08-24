import { db } from './database';
import type { BackupPayload, CustomField, DLC, Game, Platform, ReadableCustomField, ReadableGameEntry, Tag } from '../models/types';
import { toDateInputValue } from '../utils/dates';

const normalizePlatformNames = (names: string[] = []): string[] => {
  const seen = new Set<string>();
  return names.map((name) => name.trim()).filter((name) => {
    const normalizedName = name.toLocaleLowerCase();
    if (!name || seen.has(normalizedName)) return false;
    seen.add(normalizedName);
    return true;
  });
};

const canonicalizePlatformNames = (names: string[], platforms: Platform[]): string[] => normalizePlatformNames(names).map((name) => (
  platforms.find((platform) => platform.name.localeCompare(name, undefined, { sensitivity: 'accent' }) === 0)?.name ?? name
));

const createPlatform = (name: string, usedAt: number): Platform => ({
  id: crypto.randomUUID(),
  name,
  createdAt: usedAt,
  updatedAt: usedAt,
  lastUsedAt: usedAt
});

const touchPlatforms = async (names: string[], usedAt: number) => {
  const existingPlatforms = await db.platforms.toArray();
  for (const name of normalizePlatformNames(names)) {
    const existing = existingPlatforms.find((platform) => platform.name.localeCompare(name, undefined, { sensitivity: 'accent' }) === 0);
    if (existing) {
      await db.platforms.put({ ...existing, lastUsedAt: Math.max(existing.lastUsedAt, usedAt) });
    } else {
      const platform = createPlatform(name, usedAt);
      existingPlatforms.push(platform);
      await db.platforms.put(platform);
    }
  }
};

const readableCustomFields = (fields: CustomField[]): ReadableCustomField[] => fields
  .filter((field) => field.key.trim())
  .map((field) => ({ name: field.key, value: field.value }));

export const repository = {
  async getLibrary() {
    const [games, dlc, tags, platforms] = await Promise.all([
      db.games.toArray(),
      db.dlc.toArray(),
      db.tags.toArray(),
      db.platforms.toArray()
    ]);
    return {
      games: games.map((game) => ({ ...game, platforms: canonicalizePlatformNames(game.platforms, platforms) })),
      dlc: dlc.map((item) => ({ ...item, platforms: canonicalizePlatformNames(item.platforms, platforms) })),
      tags,
      platforms
    };
  },
  async saveGame(game: Game) {
    const normalizedGame = { ...game, platforms: normalizePlatformNames(game.platforms) };
    await db.transaction('rw', db.games, db.platforms, async () => {
      await db.games.put(normalizedGame);
      await touchPlatforms(normalizedGame.platforms, game.updatedAt);
    });
  },
  async saveDlc(item: DLC) {
    const normalizedItem = { ...item, platforms: normalizePlatformNames(item.platforms) };
    await db.transaction('rw', db.dlc, db.platforms, async () => {
      await db.dlc.put(normalizedItem);
      await touchPlatforms(normalizedItem.platforms, item.updatedAt);
    });
  },
  async saveTag(tag: Tag) {
    await db.tags.put(tag);
  },
  async savePlatform(platform: Platform) {
    await db.platforms.put({ ...platform, name: platform.name.trim() });
  },
  async renamePlatform(platform: Platform, nextName: string) {
    const trimmedName = nextName.trim();
    if (!trimmedName) return;
    const previousName = platform.name.toLocaleLowerCase();
    const replaceName = (names: string[]) => normalizePlatformNames(names.map((name) => (
      name.toLocaleLowerCase() === previousName ? trimmedName : name
    )));

    await db.transaction('rw', db.games, db.dlc, db.platforms, async () => {
      const [games, dlc] = await Promise.all([db.games.toArray(), db.dlc.toArray()]);
      await Promise.all(games.map((game) => db.games.put({ ...game, platforms: replaceName(game.platforms) })));
      await Promise.all(dlc.map((item) => db.dlc.put({ ...item, platforms: replaceName(item.platforms) })));
      await db.platforms.put({ ...platform, name: trimmedName, updatedAt: Date.now() });
    });
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
  async deletePlatform(platformId: string) {
    await db.transaction('rw', db.games, db.dlc, db.platforms, async () => {
      const platform = await db.platforms.get(platformId);
      if (!platform) return;
      const platformName = platform.name.toLocaleLowerCase();
      const [games, dlc] = await Promise.all([db.games.toArray(), db.dlc.toArray()]);
      await Promise.all(games.map((game) => db.games.put({
        ...game,
        platforms: game.platforms.filter((name) => name.toLocaleLowerCase() !== platformName)
      })));
      await Promise.all(dlc.map((item) => db.dlc.put({
        ...item,
        platforms: item.platforms.filter((name) => name.toLocaleLowerCase() !== platformName)
      })));
      await db.platforms.delete(platformId);
    });
  },
  async exportLibrary(): Promise<BackupPayload> {
    const { games, dlc, tags, platforms } = await this.getLibrary();
    return { version: 2, exportedAt: Date.now(), games, dlc, tags, platforms };
  },
  async exportReadableLibrary(): Promise<ReadableGameEntry[]> {
    const { games, dlc, tags } = await this.getLibrary();
    const tagsById = new Map(tags.map((tag) => [tag.id, tag.name]));
    const tagNames = (ids: string[]) => ids.map((id) => tagsById.get(id)).filter((name): name is string => Boolean(name));

    return [...games].sort((a, b) => a.title.localeCompare(b.title)).map((game) => ({
      name: game.title,
      platforms: game.platforms,
      tags: tagNames(game.tagIds),
      customFields: readableCustomFields(game.customFields),
      dlc: dlc.filter((item) => item.gameId === game.id).sort((a, b) => a.title.localeCompare(b.title)).map((item) => ({
        name: item.title,
        platforms: item.platforms,
        tags: tagNames(item.tagIds),
        customFields: readableCustomFields(item.customFields),
        dateAdded: toDateInputValue(item.dateAdded)
      })),
      dateAdded: toDateInputValue(game.dateAdded)
    }));
  },
  async importLibrary(data: BackupPayload, mode: 'merge' | 'replace') {
    await db.transaction('rw', db.games, db.dlc, db.tags, db.platforms, async () => {
      if (mode === 'replace') {
        await Promise.all([db.games.clear(), db.dlc.clear(), db.tags.clear(), db.platforms.clear()]);
      }
      const upsertNewest = <T extends { id: string; updatedAt: number }>(existing: T | undefined, incoming: T): T => {
        if (!existing) return incoming;
        return existing.updatedAt > incoming.updatedAt ? existing : incoming;
      };

      for (const g of data.games) {
        const incoming = { ...g, platforms: normalizePlatformNames(g.platforms), tagIds: g.tagIds ?? [], customFields: g.customFields ?? [] };
        const current = await db.games.get(g.id);
        await db.games.put(mode === 'merge' ? upsertNewest(current, incoming) : incoming);
        await touchPlatforms(incoming.platforms, incoming.updatedAt ?? incoming.dateAdded);
      }
      for (const d of data.dlc) {
        const incoming = {
          ...d,
          platforms: normalizePlatformNames(d.platforms),
          tagIds: d.tagIds ?? [],
          customFields: d.customFields ?? []
        };
        const current = await db.dlc.get(d.id);
        await db.dlc.put(mode === 'merge' ? upsertNewest(current, incoming) : incoming);
        await touchPlatforms(incoming.platforms, incoming.updatedAt ?? incoming.dateAdded);
      }
      for (const t of data.tags) {
        const current = await db.tags.get(t.id);
        await db.tags.put(mode === 'merge' ? upsertNewest(current, t) : t);
      }
      for (const p of data.platforms ?? []) {
        const sameName = (await db.platforms.toArray()).find((platform) => (
          platform.name.localeCompare(p.name, undefined, { sensitivity: 'accent' }) === 0
        ));
        const current = await db.platforms.get(p.id) ?? sameName;
        const incoming = current && current.id !== p.id ? { ...p, id: current.id } : p;
        await db.platforms.put(mode === 'merge' ? upsertNewest(current, incoming) : incoming);
      }
    });
  }
};
