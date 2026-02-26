import { useState } from 'react';
import type { DLC, Tag } from '../models/types';
import { CustomFieldEditor } from './CustomFieldEditor';
import { TagChips } from './TagChips';
import { validateTitle } from '../utils/validation';

interface Props {
  initial?: DLC;
  tags: Tag[];
  onSubmit: (data: Pick<DLC, 'title' | 'tagIds' | 'customFields'>) => void;
}

export const DlcForm: React.FC<Props> = ({ initial, tags, onSubmit }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? []);
  const [customFields, setCustomFields] = useState(initial?.customFields ?? []);
  const [error, setError] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const titleError = validateTitle(title);
    if (titleError) return setError(titleError);
    onSubmit({ title: title.trim(), tagIds, customFields });
  };

  return (
    <form onSubmit={submit} className="stack">
      <label>DLC Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <TagChips selected={tagIds} tags={tags} onToggle={(id) => setTagIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id])} />
      <CustomFieldEditor fields={customFields} onChange={setCustomFields} />
      {error && <p className="error-text">{error}</p>}
      <button type="submit">Save DLC</button>
    </form>
  );
};
