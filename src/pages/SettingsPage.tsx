import { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { repository } from '../db/repository';
import type { Tag } from '../models/types';
import { validateBackup } from '../utils/validation';
import { useToast } from '../context/ToastContext';

interface Props { tags: Tag[]; reload: () => Promise<void>; }

export const SettingsPage: React.FC<Props> = ({ tags, reload }) => {
  const { pushToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');

  const addTag = async () => {
    if (!name.trim()) return;
    const now = Date.now();
    await repository.saveTag({ id: uuidv4(), name: name.trim(), createdAt: now, updatedAt: now });
    setName('');
    await reload();
  };

  const rename = async (tag: Tag) => {
    const nextName = window.prompt('Rename tag', tag.name);
    if (!nextName) return;
    await repository.saveTag({ ...tag, name: nextName, updatedAt: Date.now() });
    await reload();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this tag from all games and DLC?')) return;
    await repository.deleteTag(id);
    await reload();
  };

  const exportLibrary = async () => {
    const payload = await repository.exportLibrary();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gamevault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    pushToast('Library exported', 'success');
  };

  const importLibrary = async (file: File) => {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      pushToast('Backup file is not valid JSON.', 'error');
      return;
    }
    const validation = validateBackup(parsed);
    if (!validation.ok || !validation.data) {
      pushToast(validation.message ?? 'Import validation failed.', 'error');
      return;
    }
    await repository.importLibrary(validation.data, mode);
    await reload();
    pushToast('Library imported', 'success');
  };

  return (
    <div className="stack">
      <h2>Settings</h2>
      <section className="stack">
        <h3>Tag management</h3>
        <div className="toolbar"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Create tag" /><button onClick={addTag}>Add tag</button></div>
        {tags.map((tag) => <div key={tag.id} className="row"><span>{tag.name}</span><span><button onClick={() => rename(tag)}>Rename</button><button className="danger" onClick={() => remove(tag.id)}>Delete</button></span></div>)}
      </section>
      <section className="stack">
        <h3>Import / Export</h3>
        <button onClick={exportLibrary}>Export Library</button>
        <label>Import mode
          <select value={mode} onChange={(e) => setMode(e.target.value as 'merge' | 'replace')}>
            <option value="merge">Merge with existing</option>
            <option value="replace">Replace existing</option>
          </select>
        </label>
        <button onClick={() => fileRef.current?.click()}>Import Library</button>
        <input ref={fileRef} type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && importLibrary(e.target.files[0])} hidden />
      </section>
    </div>
  );
};
