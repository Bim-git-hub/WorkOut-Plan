export interface Exercise {
  n: string;
  d: string;
}

export interface WorkoutState {
  version: 1;
  schedule: Record<string, Exercise[]>;
  done: Record<string, boolean>;
  notes: Record<string, string>;
  labels: Record<string, string>;
}

export const STORAGE_KEY = 'workout-tracker-v1';

export function defaultState(): WorkoutState {
  return {
    version: 1,
    schedule: {
      '0': [],
      '1': [
        { n: 'Push-up', d: '3 x 12' },
        { n: 'Dumbbell press', d: '3 x 10' },
        { n: 'Plank', d: '3 x 45 detik' }
      ],
      '2': [
        { n: 'Squat', d: '4 x 12' },
        { n: 'Lunge', d: '3 x 10 per kaki' }
      ],
      '3': [],
      '4': [
        { n: 'Pull-up / Row', d: '3 x 8' },
        { n: 'Bicep curl', d: '3 x 12' }
      ],
      '5': [
        { n: 'Deadlift', d: '4 x 8' },
        { n: 'Core circuit', d: '15 menit' }
      ],
      '6': [{ n: 'Cardio ringan', d: '30 menit' }]
    },
    done: {},
    notes: {},
    labels: {
      '0': 'Rest',
      '1': 'Upper Body',
      '2': 'Lower Body',
      '3': 'Rest',
      '4': 'Upper Body',
      '5': 'Lower Body',
      '6': 'Cardio'
    }
  };
}

export function normalizeState(input: unknown): WorkoutState {
  const d = defaultState();
  if (!input || typeof input !== 'object') return d;
  const s = input as Partial<WorkoutState> & { schedule?: unknown; done?: unknown; notes?: unknown };
  const schedule = s.schedule && typeof s.schedule === 'object' ? (s.schedule as Record<string, Exercise[]>) : d.schedule;
  const done = s.done && typeof s.done === 'object' ? (s.done as Record<string, boolean>) : {};
  const notes = s.notes && typeof s.notes === 'object' ? (s.notes as Record<string, string>) : {};
  // ensure keys 0-6 exist
  const normSchedule: Record<string, Exercise[]> = { ...d.schedule };
  for (let i = 0; i <= 6; i++) {
    const k = String(i);
    const v = (schedule as any)[k];
    if (Array.isArray(v)) {
      normSchedule[k] = v
        .filter((e) => e && typeof e === 'object')
        .map((e: any) => ({ n: String(e.n ?? '').trim(), d: String(e.d ?? '').trim() }))
        .filter((e) => e.n.length > 0);
    }
  }
  const normDone: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(done)) {
    if (v === true && /^\d{4}-\d{2}-\d{2}$/.test(k)) normDone[k] = true;
  }
  const normNotes: Record<string, string> = {};
  for (const [k, v] of Object.entries(notes)) {
    if (typeof v === 'string' && v.trim() && /^\d{4}-\d{2}-\d{2}$/.test(k)) normNotes[k] = v;
  }
  const labelsRaw = (s as any).labels && typeof (s as any).labels === 'object' ? (s as any).labels as Record<string, unknown> : {};
  const normLabels: Record<string, string> = { ...d.labels };
  for (let i = 0; i <= 6; i++) {
    const k = String(i);
    const v = labelsRaw[k];
    if (typeof v === 'string') normLabels[k] = v.trim().slice(0, 40);
  }
  return { version: 1, schedule: normSchedule, done: normDone, notes: normNotes, labels: normLabels };
}
