export const pad = (n: number): string => String(n).padStart(2, '0');

export const fmt = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parse = (s: string): Date => {
  const [a, b, c] = s.split('-').map(Number);
  return new Date(a, b - 1, c);
};

export const todayStr = (now: Date = new Date()): string => fmt(now);

export const startOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export function calcStreak(done: Record<string, boolean>, now: Date = new Date()): number {
  let d = startOfDay(now);
  const key = fmt(d);
  if (!done[key]) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (done[fmt(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function countMonth(done: Record<string, boolean>, year: number, monthIndex: number): number {
  const m = `${year}-${pad(monthIndex + 1)}`;
  return Object.keys(done).filter((k) => k.startsWith(m)).length;
}

export function countTotal(done: Record<string, boolean>): number {
  return Object.keys(done).length;
}
