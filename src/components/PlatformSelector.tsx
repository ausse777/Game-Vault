import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Platform } from '../models/types';

interface Props {
  selected: string[];
  platforms: Platform[];
  onToggle: (name: string) => void;
}

const RECENT_PLATFORM_LIMIT = 5;

export const PlatformSelector: React.FC<Props> = ({ selected, platforms, onToggle }) => {
  const [expanded, setExpanded] = useState(false);
  const orderedPlatforms = useMemo(() => {
    const options = [...platforms];
    selected.forEach((name) => {
      if (!options.some((platform) => platform.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        options.push({ id: `selected-${name}`, name, createdAt: 0, updatedAt: 0, lastUsedAt: 0 });
      }
    });

    return options.sort((a, b) => {
      const aSelected = selected.includes(a.name);
      const bSelected = selected.includes(b.name);
      if (aSelected !== bSelected) return aSelected ? -1 : 1;
      return b.lastUsedAt - a.lastUsedAt || a.name.localeCompare(b.name);
    });
  }, [platforms, selected]);

  if (orderedPlatforms.length === 0) {
    return <p className="helper-text">No platforms are available yet. <Link to="/settings">Add platforms in Settings.</Link></p>;
  }

  const visiblePlatforms = expanded ? orderedPlatforms : orderedPlatforms.slice(0, RECENT_PLATFORM_LIMIT);
  const hiddenCount = orderedPlatforms.length - visiblePlatforms.length;

  return (
    <div className="platform-selector">
      <div className="chip-row">
        {visiblePlatforms.map((platform) => {
          const isSelected = selected.includes(platform.name);
          return (
            <button
              key={platform.id}
              className={`chip ${isSelected ? 'active' : ''}`}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(platform.name)}
            >
              {platform.name}
            </button>
          );
        })}
        {orderedPlatforms.length > RECENT_PLATFORM_LIMIT && (
          <button
            className="icon-button"
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? 'Show recent platforms only' : `Show all platforms (${hiddenCount} more)`}
            title={expanded ? 'Show recent platforms only' : `Show all platforms (${hiddenCount} more)`}
            onClick={() => setExpanded((value) => !value)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
              <path d={expanded ? 'm7 14 5-5 5 5' : 'm7 10 5 5 5-5'} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      {!expanded && hiddenCount > 0 && <small className="helper-text">Showing selected and recently used platforms.</small>}
    </div>
  );
};
