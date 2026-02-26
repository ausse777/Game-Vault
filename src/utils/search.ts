import type { DLC, Game, SortOption, Tag } from '../models/types';

interface SearchOptions {
  query: string;
  selectedTagIds: string[];
  includeDlc: boolean;
  sort: SortOption;
  tagsById: Record<string, Tag>;
  dlcByGameId: Record<string, DLC[]>;
}

const sortable = (games: Game[], sort: SortOption): Game[] => {
  const copy = [...games];
  switch (sort) {
    case 'az': return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'za': return copy.sort((a, b) => b.title.localeCompare(a.title));
    case 'newest': return copy.sort((a, b) => b.dateAdded - a.dateAdded);
    case 'oldest': return copy.sort((a, b) => a.dateAdded - b.dateAdded);
  }
};

const buildSearchBlob = (title: string, platforms: string[], tagIds: string[], tagsById: Record<string, Tag>, customFields: {key: string; value: string | number | boolean}[]) => {
  const tags = tagIds.map((id) => tagsById[id]?.name ?? '').join(' ');
  const fields = customFields.map((f) => `${f.key} ${String(f.value)}`).join(' ');
  return `${title} ${platforms.join(' ')} ${tags} ${fields}`.toLowerCase();
};

export const filterGames = (
  games: Game[],
  options: SearchOptions
): { results: Game[]; matchedDlc: Record<string, DLC[]> } => {
  const { query, selectedTagIds, includeDlc, tagsById, dlcByGameId, sort } = options;
  const lowerQuery = query.trim().toLowerCase();
  const matchedDlc: Record<string, DLC[]> = {};

  const filtered = games.filter((game) => {
    const matchesTags = selectedTagIds.length === 0 || selectedTagIds.every((id) => game.tagIds.includes(id));
    const gameBlob = buildSearchBlob(game.title, game.platforms, game.tagIds, tagsById, game.customFields);
    const matchesQuery = !lowerQuery || gameBlob.includes(lowerQuery);

    if (matchesTags && matchesQuery) return true;
    if (!includeDlc) return false;

    const dlcMatches = (dlcByGameId[game.id] ?? []).filter((item) => {
      const dlcTagMatch = selectedTagIds.length === 0 || selectedTagIds.every((id) => item.tagIds.includes(id));
      const dlcBlob = buildSearchBlob(item.title, [], item.tagIds, tagsById, item.customFields);
      const queryMatch = !lowerQuery || dlcBlob.includes(lowerQuery);
      return dlcTagMatch && queryMatch;
    });

    if (dlcMatches.length > 0) {
      matchedDlc[game.id] = dlcMatches;
      return true;
    }

    return false;
  });

  return { results: sortable(filtered, sort), matchedDlc };
};
