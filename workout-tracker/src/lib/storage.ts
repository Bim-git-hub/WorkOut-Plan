import { defaultState, normalizeState, type WorkoutState } from './types';
import { readLegacyLocalStorage } from './migrate';

export interface StorageApi {
  load: () => Promise<WorkoutState | null>;
  save: (state: WorkoutState) => Promise<void>;
  exportJson: (state: WorkoutState) => Promise<void>;
  importJson: () => Promise<WorkoutState | null>;
}

declare global {
  interface Window {
    api?: StorageApi;
  }
}

function getApi(): StorageApi | null {
  return window.api ?? null;
}

export async function loadState(): Promise<WorkoutState> {
  const api = getApi();
  if (api) {
    const stored = await api.load();
    if (stored) return normalizeState(stored);
    // migrate once from localStorage if present
    const legacy = readLegacyLocalStorage(window.localStorage);
    if (legacy) {
      await api.save(legacy);
      try { window.localStorage.removeItem('workout-tracker-v1'); } catch {}
      return legacy;
    }
    const fresh = defaultState();
    await api.save(fresh);
    return fresh;
  }
  // Fallback for browser/dev without electron (should not happen in packaged app)
  try {
    const raw = window.localStorage.getItem('workout-tracker-v1');
    if (raw) return normalizeState(JSON.parse(raw));
  } catch {}
  return defaultState();
}

export async function saveState(state: WorkoutState): Promise<void> {
  const api = getApi();
  if (api) {
    await api.save(state);
    return;
  }
  try { window.localStorage.setItem('workout-tracker-v1', JSON.stringify(state)); } catch {}
}

export async function exportBackup(state: WorkoutState): Promise<void> {
  const api = getApi();
  if (api) {
    await api.exportJson(state);
    return;
  }
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  a.download = `workout-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function importBackup(): Promise<WorkoutState | null> {
  const api = getApi();
  if (api) {
    const imported = await api.importJson();
    return imported ? normalizeState(imported) : null;
  }
  return null;
}
