import { Link } from 'react-router-dom';
import type { DLC, Game, Platform, SortOption, Tag } from '../models/types';
import { PlatformSelector } from '../components/PlatformSelector';
import { TagChips } from '../components/TagChips';

interface Props {
  games: Game[];
  tags: Tag[];
  platforms: Platform[];
  matchedDlc: Record<string, DLC[]>;
  dlcCountByGameId: Record<string, number>;
  query: string;
  onQuery: (v: string) => void;
  selectedPlatforms: string[];
  onSelectedPlatforms: (v: string[]) => void;
  selectedTags: string[];
  onSelectedTags: (v: string[]) => void;
  includeDlc: boolean;
  onIncludeDlc: (v: boolean) => void;
  sort: SortOption;
  onSort: (v: SortOption) => void;
}

export const LibraryPage: React.FC<Props> = ({ games, tags, platforms, matchedDlc, dlcCountByGameId, query, onQuery, selectedPlatforms, onSelectedPlatforms, selectedTags, onSelectedTags, includeDlc, onIncludeDlc, sort, onSort }) => {
  const togglePlatform = (name: string) => onSelectedPlatforms(selectedPlatforms.includes(name)
    ? selectedPlatforms.filter((platform) => platform !== name)
    : [...selectedPlatforms, name]);
  const toggleTag = (id: string) => onSelectedTags(selectedTags.includes(id) ? selectedTags.filter((x) => x !== id) : [...selectedTags, id]);

  return (
    <div className="stack">
      <div className="toolbar">
        <input placeholder="Search by title, tags, platforms, custom fields..." value={query} onChange={(e) => onQuery(e.target.value)} />
        <select value={sort} onChange={(e) => onSort(e.target.value as SortOption)}>
          <option value="az">A → Z</option><option value="za">Z → A</option>
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
        </select>
      </div>
      <label className="toggle"><input type="checkbox" checked={includeDlc} onChange={(e) => onIncludeDlc(e.target.checked)} /> Include DLC in search & filters</label>
      <div className="filter-group">
        <p>Platforms</p>
        <PlatformSelector selected={selectedPlatforms} platforms={platforms} onToggle={togglePlatform} />
      </div>
      <div className="filter-group">
        <p>Tags</p>
        <TagChips selected={selectedTags} tags={tags} onToggle={toggleTag} />
      </div>
      {games.length === 0 ? (
        <div className="empty-state"><p>No games found.</p><Link to="/game/new" className="button-link">Add your first game</Link></div>
      ) : (
        <div className="card-grid">
          {games.map((game) => (
            <Link key={game.id} to={`/game/${game.id}`} className="card-link">
              <article className="card">
                <h3>{game.title}</h3>
                <p>{game.platforms.join(', ') || 'No platforms yet'}</p>
                <p>DLC count: {dlcCountByGameId[game.id] ?? 0}</p>
                <small>Added: {new Date(game.dateAdded).toLocaleDateString()}</small>
                {matchedDlc[game.id]?.length ? <div className="match">Matched DLC: {matchedDlc[game.id].map((d) => d.title).join(', ')}</div> : null}
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
