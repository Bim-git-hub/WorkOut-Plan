import { calcStreak, countMonth, countTotal, fmt, pad } from '../lib/dates'
import type { WorkoutState } from '../lib/types'

const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export function renderStats(state: WorkoutState, view: Date): void {
  const set = (id: string, val: string) => { const el = document.getElementById(id); if (el) el.textContent = val }

  set('stTotal', pad(countTotal(state.done)))
  set('stStreak', pad(calcStreak(state.done, new Date())))

  const monthCount = countMonth(state.done, view.getFullYear(), view.getMonth())
  const dim = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  let target = 0
  for (let d = 1; d <= dim; d++) {
    const wd = new Date(view.getFullYear(), view.getMonth(), d).getDay()
    if ((state.schedule[String(wd)] || []).length) target++
  }
  set('stMonth', pad(monthCount))
  set('stTarget', target ? `/ ${pad(target)} hari` : 'hari')
  const bar = document.getElementById('stBar') as HTMLElement | null
  if (bar) bar.style.width = `${target ? Math.min(100, (monthCount / target) * 100) : 0}%`

  const t = new Date()
  t.setHours(0, 0, 0, 0)
  const mon = new Date(t)
  mon.setDate(t.getDate() - ((t.getDay() + 6) % 7))
  const today = fmt(t)
  let wh = ''
  for (let i = 0; i < 7; i++) {
    const x = new Date(mon)
    x.setDate(mon.getDate() + i)
    const s = fmt(x)
    wh += `<div class="${state.done[s] ? 'on' : ''} ${s === today ? 'now' : ''}"><i></i>${DAYS_SHORT[x.getDay()][0]}</div>`
  }
  const week = document.getElementById('week')
  if (week) week.innerHTML = wh
}
