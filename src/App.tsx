import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { LibraryPage } from './pages/LibraryPage';
import { GameDetailPage } from './pages/GameDetailPage';
import { DlcDetailPage } from './pages/DlcDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { JumpToTopButton } from './components/JumpToTopButton';
import { repository } from './db/repository';
import type { DLC, Game, Platform, SortOption, Tag } from './models/types';
import { filterGames } from './utils/search';

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [dlc, setDlc] = useState<DLC[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [query, setQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [includeDlc, setIncludeDlc] = useState(false);
  const [sort, setSort] = useState<SortOption>('newest');

  const reload = async () => {
    const data = await repository.getLibrary();
    setGames(data.games);
    setDlc(data.dlc);
    setTags(data.tags.sort((a, b) => a.name.localeCompare(b.name)));
    setPlatforms(data.platforms.sort((a, b) => b.lastUsedAt - a.lastUsedAt || a.name.localeCompare(b.name)));
  };

  useEffect(() => { void reload(); }, []);

  const tagsById = useMemo(() => Object.fromEntries(tags.map((tag) => [tag.id, tag])), [tags]);
  const dlcByGameId = useMemo(() => dlc.reduce<Record<string, DLC[]>>((acc, item) => {
    acc[item.gameId] = [...(acc[item.gameId] ?? []), item];
    return acc;
  }, {}), [dlc]);
  const dlcCountByGameId = useMemo(() => Object.fromEntries(
    Object.entries(dlcByGameId).map(([gameId, items]) => [gameId, items.length])
  ), [dlcByGameId]);

  const { results, matchedDlc } = useMemo(() => filterGames(games, {
    query,
    selectedPlatforms,
    selectedTagIds,
    includeDlc,
    sort,
    tagsById,
    dlcByGameId
  }), [games, query, selectedPlatforms, selectedTagIds, includeDlc, sort, tagsById, dlcByGameId]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>GameVault</h1>
        <nav><Link to="/">Library</Link><Link to="/game/new">Add Game</Link><Link to="/settings">Settings</Link></nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<LibraryPage games={results} tags={tags} platforms={platforms} matchedDlc={matchedDlc} dlcCountByGameId={dlcCountByGameId} query={query} onQuery={setQuery} selectedPlatforms={selectedPlatforms} onSelectedPlatforms={setSelectedPlatforms} selectedTags={selectedTagIds} onSelectedTags={setSelectedTagIds} includeDlc={includeDlc} onIncludeDlc={setIncludeDlc} sort={sort} onSort={setSort} />} />
          <Route path="/game/new" element={<GameDetailPage games={games} dlc={dlc} tags={tags} platforms={platforms} reload={reload} />} />
          <Route path="/game/:id" element={<GameDetailPage games={games} dlc={dlc} tags={tags} platforms={platforms} reload={reload} />} />
          <Route path="/game/:id/dlc/:dlcId" element={<DlcDetailPage dlc={dlc} tags={tags} platforms={platforms} reload={reload} />} />
          <Route path="/settings" element={<SettingsPage tags={tags} platforms={platforms} reload={reload} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <JumpToTopButton />
    </div>
  );
}
