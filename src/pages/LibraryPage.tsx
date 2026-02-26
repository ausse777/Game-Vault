import { Link } from 'react-router-dom';
import type { DLC, Game, SortOption, Tag } from '../models/types';
import { TagChips } from '../components/TagChips';

interface Props {
  games: Game[];
  tags: Tag[];
  matchedDlc: Record<string, DLC[]>;
  query: string;
  onQuery: (v: string) => void;
  selectedTags: string[];
  onSelectedTags: (v: string[]) => void;
  includeDlc: boolean;
  onIncludeDlc: (v: boolean) => void;
  sort: SortOption;
  onSort: (v: SortOption) => void;
}

export const LibraryPage: React.FC<Props> = ({ games, tags, matchedDlc, query, onQuery, selectedTags, onSelectedTags, includeDlc, onIncludeDlc, sort, onSort }) => {
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
      <TagChips selected={selectedTags} tags={tags} onToggle={toggleTag} />
      {games.length === 0 ? (
        <div className="empty-state"><p>No games found.</p><Link to="/game/new" className="button-link">Add your first game</Link></div>
      ) : (
        <div className="card-grid">
          {games.map((game) => (
            <Link key={game.id} to={`/game/${game.id}`} className="card-link">
              <article className="card">
                <h3>{game.title}</h3>
                <p>{game.platforms.join(', ') || 'No platforms yet'}</p>
                <p>DLC count: {(matchedDlc[game.id]?.length ?? 0) || 'View details'}</p>
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
