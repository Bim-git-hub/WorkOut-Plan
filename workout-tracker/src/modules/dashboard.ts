import { DAYS_ID, MONTHS_ID } from '../lib/constants'
import { fmt, parse, calcStreak, countMonth, countTotal, pad } from '../lib/dates'
import { esc } from '../lib/utils'
import type { WorkoutState } from '../lib/types'

const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function lastNDays(n: number, now = new Date()): Date[] {
  const out: Date[] = []
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    out.push(d)
  }
  return out
}

export function renderDashboard(state: WorkoutState): void {
  const now = new Date()
  const today = fmt(now)
  const streak = calcStreak(state.done, now)
  const monthCount = countMonth(state.done, now.getFullYear(), now.getMonth())
  const total = countTotal(state.done)
  const daysElapsed = now.getDate()
  const consistency = daysElapsed > 0 ? Math.round((monthCount / daysElapsed) * 100) : 0

  const set = (id: string, val: string) => { const el = document.getElementById(id); if (el) el.textContent = val }
  set('dbStreak', pad(streak))
  set('dbMonth', pad(monthCount))
  set('dbTotal', pad(total))
  set('dbMonthMeta', `${MONTHS_ID[now.getMonth()].slice(0, 3)} · ${consistency}%`)
  const bar = document.getElementById('dbConsistencyBar') as HTMLElement | null
  if (bar) bar.style.width = `${Math.min(100, consistency)}%`

  // week squares (Mon..Sun of current week)
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  mon.setDate(mon.getDate() - ((now.getDay() + 6) % 7))
  const squares = document.getElementById('dbWeekSquares')
  if (squares) {
    let wh = ''
    for (let i = 0; i < 7; i++) {
      const x = new Date(mon)
      x.setDate(mon.getDate() + i)
      const s = fmt(x)
      wh += `<div class="${state.done[s] ? 'on' : ''} ${s === today ? 'now' : ''}"><i></i>${DAYS_SHORT[x.getDay()][0]}</div>`
    }
    squares.innerHTML = wh
  }

  // 7 day bars
  const bars = document.getElementById('dbWeekBars')
  if (bars) {
    const days = lastNDays(7, now)
    bars.innerHTML = days.map((d) => {
      const k = fmt(d)
      const done = !!state.done[k]
      const isToday = k === today
      return `<div class="week-bar-col">
        <div class="week-bar-val">${done ? '✓' : ''}</div>
        <div class="week-bar-track"><div class="week-bar-fill ${done ? '' : 'empty'}" style="height:${done ? 100 : 2}%"></div></div>
        <div class="week-bar-label ${isToday ? 'today' : ''}">${DAYS_ID[d.getDay()].slice(0, 3)}</div>
      </div>`
    }).join('')
  }

  // today's schedule
  const schedEl = document.getElementById('dbTodaySchedule')
  if (schedEl) {
    const wd = now.getDay()
    const list = state.schedule[String(wd)] || []
    const label = (state.labels?.[String(wd)] || '').trim()
    if (!list.length) {
      schedEl.innerHTML = `<div class="empty-state">Tidak ada jadwal untuk hari ini. Tambahkan di menu Jadwal.</div>`
    } else {
      const doneToday = !!state.done[today]
      schedEl.innerHTML = `<div class="schedule-title" style="margin:0 0 10px">${esc(label || 'Latihan')}</div>
        <div class="today-schedule-list">${list.map((e) => `<div class="today-schedule-item"><span>${esc(e.n)}</span><i>${esc(e.d)}</i></div>`).join('')}</div>
        <div style="margin-top:12px;font:10px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:${doneToday ? 'var(--accent)' : 'var(--muted)'}">
          ${doneToday ? '[ Selesai ]' : '[ Belum ditandai ]'}
        </div>`
    }
  }

  // recent
  const recentEl = document.getElementById('dbRecent')
  if (recentEl) {
    const keys = Object.keys(state.done).filter((k) => state.done[k]).sort().reverse().slice(0, 5)
    if (!keys.length) {
      recentEl.innerHTML = `<div class="empty-state">Belum ada riwayat workout. Tandai sesi selesai di kalender untuk mulai melacak.</div>`
    } else {
      recentEl.innerHTML = `<div class="recent-list">${keys.map((k) => {
        const d = parse(k)
        const wd = d.getDay()
        const exercises = state.schedule[String(wd)] || []
        const label = (state.labels?.[String(wd)] || '').trim()
        const meta = label || exercises.map((e) => e.n).join(', ') || 'Latihan selesai'
        const dateStr = `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
        return `<div class="recent-item">
          <div class="recent-main">
            <div class="recent-date">${dateStr}</div>
            <div class="recent-meta">${DAYS_ID[wd]} · ${esc(meta)}</div>
          </div>
          <div class="recent-badge">Selesai</div>
        </div>`
      }).join('')}</div>`
    }
  }
}
