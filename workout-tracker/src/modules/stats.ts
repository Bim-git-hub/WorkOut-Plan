import { calcStreak, countMonth, countTotal } from '../lib/dates'
import type { WorkoutState } from '../lib/types'

export function renderStats(state: WorkoutState, view: Date): void {
  document.getElementById('stTotal')!.textContent = String(countTotal(state.done))
  document.getElementById('stMonth')!.textContent = String(countMonth(state.done, view.getFullYear(), view.getMonth()))
  document.getElementById('stStreak')!.textContent = String(calcStreak(state.done, new Date()))
}
