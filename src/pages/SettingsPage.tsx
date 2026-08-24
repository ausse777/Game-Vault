import { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { repository } from '../db/repository';
import type { Platform, Tag } from '../models/types';
import { validateBackup } from '../utils/validation';
import { useToast } from '../context/ToastContext';

interface Props { tags: Tag[]; platforms: Platform[]; reload: () => Promise<void>; }

export const SettingsPage: React.FC<Props> = ({ tags, platforms, reload }) => {
  const { pushToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [platformName, setPlatformName] = useState('');
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

  const addPlatform = async () => {
    const trimmedName = platformName.trim();
    if (!trimmedName) return;
    if (platforms.some((platform) => platform.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase())) {
      pushToast('That platform already exists.', 'error');
      return;
    }
    const now = Date.now();
    await repository.savePlatform({
      id: uuidv4(),
      name: trimmedName,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now
    });
    setPlatformName('');
    await reload();
    pushToast('Platform added', 'success');
  };

  const renamePlatform = async (platform: Platform) => {
    const nextName = window.prompt('Rename platform', platform.name)?.trim();
    if (!nextName || nextName === platform.name) return;
    if (platforms.some((entry) => entry.id !== platform.id && entry.name.toLocaleLowerCase() === nextName.toLocaleLowerCase())) {
      pushToast('That platform already exists.', 'error');
      return;
    }
    await repository.renamePlatform(platform, nextName);
    await reload();
    pushToast('Platform renamed', 'success');
  };

  const removePlatform = async (platform: Platform) => {
    if (!window.confirm(`Delete ${platform.name} from all games and DLC?`)) return;
    await repository.deletePlatform(platform.id);
    await reload();
    pushToast('Platform deleted', 'success');
  };

  const downloadJson = (payload: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(anchor.href), 0);
  };

  const exportLibrary = async () => {
    const payload = await repository.exportReadableLibrary();
    downloadJson(payload, `gamevault-library-${new Date().toISOString().slice(0, 10)}.json`);
    pushToast('Library exported', 'success');
  };

  const exportBackup = async () => {
    const payload = await repository.exportLibrary();
    downloadJson(payload, `gamevault-backup-${new Date().toISOString().slice(0, 10)}.json`);
    pushToast('Full backup exported', 'success');
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
        <h3>Platform management</h3>
        <div className="toolbar"><input value={platformName} onChange={(event) => setPlatformName(event.target.value)} placeholder="Create platform" /><button onClick={addPlatform}>Add platform</button></div>
        {platforms.length === 0 && <p className="helper-text">Add platforms here to make them available in game and DLC forms.</p>}
        {platforms.map((platform) => <div key={platform.id} className="row"><span>{platform.name}</span><span><button onClick={() => renamePlatform(platform)}>Rename</button><button className="danger" onClick={() => removePlatform(platform)}>Delete</button></span></div>)}
      </section>
      <section className="stack">
        <h3>Import / Export</h3>
        <p className="helper-text">The readable export contains game and DLC details without internal IDs. Use the full backup for restoring data.</p>
        <button onClick={exportLibrary}>Export Library (Readable)</button>
        <button onClick={exportBackup}>Export Full Backup</button>
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
