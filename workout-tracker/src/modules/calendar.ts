import { DAYS_ID, MONTHS_ID, DOW_ORDER } from '../lib/constants'
import { fmt } from '../lib/dates'
import { esc } from '../lib/utils'
import type { WorkoutState } from '../lib/types'
import { heroSvg, monthAccent } from './hero-art'
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
  document.getElementById('rings')!.innerHTML = Array.from({ length: 14 }, () => '<div class="ring"></div>').join('')
  document.getElementById('dow')!.innerHTML = DOW_ORDER.map((i) => `<div class="${i === 0 ? 'sun' : ''}">${DAYS_ID[i].slice(0, 3)}</div>`).join('')
}

export function renderCalendar(ctx: CalendarCtx): string {
  const { state, view, selected, justMarked } = ctx
  const m = view.getMonth()
  const accent = monthAccent(m)
  const panel = document.querySelector<HTMLElement>('.calendar-panel')
  if (panel) {
    panel.style.setProperty('--month-primary', accent.primary)
    panel.style.setProperty('--month-soft', accent.soft)
    panel.style.setProperty('--month-glow', accent.glow)
  }
  document.getElementById('heroArt')!.innerHTML = heroSvg(m)
  document.getElementById('monthName')!.textContent = MONTHS_ID[m]
  document.getElementById('yearName')!.textContent = String(view.getFullYear())

  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const lead = (first.getDay() + 6) % 7
  const total = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  const todayStr = fmt(new Date())
  const cells = lead + total
  const trail = (7 - (cells % 7)) % 7
  let html = ''
  for (let i = 0; i < lead; i++) html += `<div class="day empty"></div>`
  for (let d = 1; d <= total; d++) {
    const date = new Date(view.getFullYear(), view.getMonth(), d)
    const s = fmt(date)
    const wd = date.getDay()
    const list = state.schedule[String(wd)] || []
    const cls = ['day']
    if (wd === 0) cls.push('sun')
    if (s === todayStr) cls.push('today')
    if (s === selected) cls.push('selected')
    if (state.done[s]) cls.push('done')
    const dayLabel = (state.labels?.[String(wd)] || '').trim()
    const label = dayLabel ? esc(dayLabel) : (list.length ? 'Latihan' : '')
    html += `<div class="${cls.join(' ')}" data-d="${s}">
      <span class="n">${d}</span><span class="lbl">${label}</span>
      ${state.done[s] ? xMark(date.getFullYear() * 372 + date.getMonth() * 31 + d, justMarked === s) : ''}
    </div>`
  }
  for (let i = 0; i < trail; i++) html += `<div class="day empty"></div>`

  const el = document.getElementById('days')!
  el.innerHTML = html
  el.querySelectorAll<HTMLElement>('.day[data-d]').forEach((n) => {
    n.onclick = () => { ctx.onSelectDate(n.dataset.d!) }
  })

  const page = document.getElementById('page')!
  page.classList.remove('flip-next', 'flip-prev')
  if (ctx.flip) {
    void page.offsetWidth
    page.classList.add(ctx.flip)
  }
  return ''
}
