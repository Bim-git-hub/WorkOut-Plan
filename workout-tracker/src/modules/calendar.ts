import { DAYS_ID, MONTHS_ID, DOW_ORDER } from '../lib/constants'
import { fmt } from '../lib/dates'
import { esc } from '../lib/utils'
import type { WorkoutState } from '../lib/types'
import { xMark } from './xmark'

export interface CalendarCtx {
  state: WorkoutState
  view: Date
  selected: string
  justMarked: string | null
  flip: string
  onSelectDate: (dateStr: string) => void
}

export function initCalendarStatic(): void {
  document.getElementById('dow')!.innerHTML = DOW_ORDER.map((i) => `<div class="${i === 0 ? 'sun' : ''}">${DAYS_ID[i].slice(0, 3)}</div>`).join('')
}

export function renderCalendar(ctx: CalendarCtx): void {
  const { state, view, selected, justMarked } = ctx
  const m = view.getMonth()
  const monthEl = document.getElementById('monthName')
  const yearEl = document.getElementById('yearName')
  const prevEl = document.getElementById('prev')
  const nextEl = document.getElementById('next')
  if (monthEl) monthEl.textContent = MONTHS_ID[m]
  if (yearEl) yearEl.textContent = String(view.getFullYear())
  if (prevEl) prevEl.textContent = `← ${MONTHS_ID[(m + 11) % 12].slice(0, 3)}`
  if (nextEl) nextEl.textContent = `${MONTHS_ID[(m + 1) % 12].slice(0, 3)} →`

  const first = new Date(view.getFullYear(), m, 1)
  const lead = (first.getDay() + 6) % 7
  const total = new Date(view.getFullYear(), m + 1, 0).getDate()
  const trail = (7 - ((lead + total) % 7)) % 7
  const todayStr = fmt(new Date())
  let html = ''
  for (let i = 0; i < lead; i++) html += `<div class="day empty"></div>`
  for (let d = 1; d <= total; d++) {
    const date = new Date(view.getFullYear(), m, d)
    const s = fmt(date)
    const wd = date.getDay()
    const list = state.schedule[String(wd)] || []
    const cls = ['day']
    if (wd === 0) cls.push('sun')
    if (!list.length) cls.push('rest')
    if (s === todayStr) cls.push('today')
    if (s === selected) cls.push('selected')
    if (state.done[s]) cls.push('done')
    const dayLabel = (state.labels?.[String(wd)] || '').trim()
    const label = dayLabel ? esc(dayLabel) : (list.length ? 'Latihan' : 'Istirahat')
    html += `<div class="${cls.join(' ')}" data-d="${s}" tabindex="0" role="button" aria-label="${d} ${MONTHS_ID[m]} ${view.getFullYear()}"><span class="n">${d}</span><span class="lbl">${label}</span>${state.done[s] ? xMark(date.getFullYear() * 372 + m * 31 + d, justMarked === s) : ''}</div>`
  }
  for (let i = 0; i < trail; i++) html += `<div class="day empty"></div>`

  const el = document.getElementById('days')!
  el.innerHTML = html
  el.querySelectorAll<HTMLElement>('.day[data-d]').forEach((n) => {
    const pick = () => ctx.onSelectDate(n.dataset.d!)
    n.onclick = pick
    n.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick() }
    }
  })

  el.classList.remove('slide-n', 'slide-p')
  if (ctx.flip) {
    void el.offsetWidth
    el.classList.add(ctx.flip)
  }
}
