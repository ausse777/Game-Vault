import { useState } from 'react';
import type { Game, Tag } from '../models/types';
import { CustomFieldEditor } from './CustomFieldEditor';
import { TagChips } from './TagChips';
import { validateTitle } from '../utils/validation';

interface Props {
  initial?: Game;
  tags: Tag[];
  onSubmit: (data: Pick<Game, 'title' | 'platforms' | 'tagIds' | 'customFields'>) => void;
}

export const GameForm: React.FC<Props> = ({ initial, tags, onSubmit }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [platforms, setPlatforms] = useState((initial?.platforms ?? []).join(', '));
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? []);
  const [customFields, setCustomFields] = useState(initial?.customFields ?? []);
  const [error, setError] = useState('');

  const toggleTag = (id: string) => setTagIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const titleError = validateTitle(title);
    if (titleError) return setError(titleError);
    onSubmit({
      title: title.trim(),
      platforms: platforms.split(',').map((x) => x.trim()).filter(Boolean),
      tagIds,
      customFields
    });
  };

  return (
    <form onSubmit={submit} className="stack">
      <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label>Platforms (comma-separated)<input value={platforms} onChange={(e) => setPlatforms(e.target.value)} /></label>
      <div><p>Tags</p><TagChips selected={tagIds} tags={tags} onToggle={toggleTag} /></div>
      <div><p>Custom fields</p><CustomFieldEditor fields={customFields} onChange={setCustomFields} /></div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit">Save game</button>
    </form>
  );
};
