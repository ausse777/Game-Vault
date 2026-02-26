import type { BackupPayload, CustomField, DLC, Game, Tag } from '../models/types';

export const validateTitle = (value: string): string | null => {
  if (!value.trim()) return 'Title is required.';
  if (value.trim().length > 120) return 'Title must be 120 characters or less.';
  return null;
};

export const validateCustomField = (field: CustomField): string | null => {
  if (!field.key.trim()) return 'Field name is required.';
  if (field.type === 'choice' && (!field.options || field.options.length === 0)) {
    return 'Choice fields require at least one option.';
  }
  return null;
};

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export const validateBackup = (payload: unknown): { ok: boolean; message?: string; data?: BackupPayload } => {
  if (!isObject(payload)) return { ok: false, message: 'Invalid backup format.' };
  if (!Array.isArray(payload.games) || !Array.isArray(payload.dlc) || !Array.isArray(payload.tags)) {
    return { ok: false, message: 'Backup must include games, dlc, and tags arrays.' };
  }

  const looksLikeGame = (g: unknown): g is Game => isObject(g) && typeof g.id === 'string' && typeof g.title === 'string';
  const looksLikeDlc = (d: unknown): d is DLC => isObject(d) && typeof d.id === 'string' && typeof d.gameId === 'string';
  const looksLikeTag = (t: unknown): t is Tag => isObject(t) && typeof t.id === 'string' && typeof t.name === 'string';

  if (!payload.games.every(looksLikeGame)) return { ok: false, message: 'One or more games are invalid.' };
  if (!payload.dlc.every(looksLikeDlc)) return { ok: false, message: 'One or more DLC items are invalid.' };
  if (!payload.tags.every(looksLikeTag)) return { ok: false, message: 'One or more tags are invalid.' };

  return { ok: true, data: payload as unknown as BackupPayload };
};
