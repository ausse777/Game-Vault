import type { Tag } from '../models/types';

interface Props {
  selected: string[];
  tags: Tag[];
  onToggle?: (id: string) => void;
  readOnly?: boolean;
}

export const TagChips: React.FC<Props> = ({ selected, tags, onToggle, readOnly = false }) => (
  <div className="chip-row">
    {tags.map((tag) => (
      <button
        key={tag.id}
        className={`chip ${selected.includes(tag.id) ? 'active' : ''}`}
        onClick={() => onToggle?.(tag.id)}
        disabled={readOnly}
        type="button"
      >
        {tag.name}
      </button>
    ))}
  </div>
);
