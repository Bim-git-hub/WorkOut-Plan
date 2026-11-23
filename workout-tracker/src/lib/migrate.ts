import { STORAGE_KEY, normalizeState, type WorkoutState } from './types';

export function readLegacyLocalStorage(storage: Pick<Storage, 'getItem'> | null | undefined): WorkoutState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    // Must look like a backup/state
    if (!('schedule' in parsed) || !('done' in parsed)) return null;
    return normalizeState(parsed);
  } catch {
    return null;
  }
}
