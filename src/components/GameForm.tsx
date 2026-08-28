import { useState } from 'react';
import type { Game, Platform, Tag } from '../models/types';
import { CustomFieldEditor } from './CustomFieldEditor';
import { PlatformSelector } from './PlatformSelector';
import { TagChips } from './TagChips';
import { validateTitle } from '../utils/validation';
import { fromDateInputValue, toDateInputValue } from '../utils/dates';

interface Props {
  initial?: Game;
  tags: Tag[];
  platforms: Platform[];
  onSubmit: (data: Pick<Game, 'title' | 'platforms' | 'tagIds' | 'customFields' | 'dateAdded'>) => void;
}

export const GameForm: React.FC<Props> = ({ initial, tags, platforms, onSubmit }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(initial?.platforms ?? []);
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? []);
  const [customFields, setCustomFields] = useState(initial?.customFields ?? []);
  const [dateAdded, setDateAdded] = useState(toDateInputValue(initial?.dateAdded ?? Date.now()));
  const [error, setError] = useState('');

  const toggleTag = (id: string) => setTagIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
  const togglePlatform = (name: string) => setSelectedPlatforms((previous) => (
    previous.includes(name) ? previous.filter((value) => value !== name) : [...previous, name]
  ));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const titleError = validateTitle(title);
    if (titleError) return setError(titleError);
    onSubmit({
      title: title.trim(),
      platforms: selectedPlatforms,
      tagIds,
      customFields,
      dateAdded: fromDateInputValue(dateAdded, initial?.dateAdded)
    });
  };

  return (
    <form onSubmit={submit} className="stack">
      <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <div><p>Platforms</p><PlatformSelector selected={selectedPlatforms} platforms={platforms} onToggle={togglePlatform} /></div>
      <div><p>Tags</p><TagChips selected={tagIds} tags={tags} onToggle={toggleTag} /></div>
      <details className="collapsible-section">
        <summary>Custom fields <span className="summary-count">{customFields.length}</span></summary>
        <div className="collapsible-content"><CustomFieldEditor fields={customFields} onChange={setCustomFields} /></div>
      </details>
      <label>Date added<input type="date" value={dateAdded} onChange={(event) => setDateAdded(event.target.value)} required /></label>
      {error && <p className="error-text">{error}</p>}
      <button type="submit">Save game</button>
    </form>
  );
};
