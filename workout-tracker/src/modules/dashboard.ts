import { DAYS_ID, MONTHS_ID } from '../lib/constants'
import { fmt, parse, calcStreak, countMonth, countTotal, pad } from '../lib/dates'
import { esc } from '../lib/utils'
import type { WorkoutState } from '../lib/types'

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
  set('dbStreak', String(streak))
  set('dbMonth', String(monthCount))
  set('dbTotal', String(total))
  set('dbConsistency', `${consistency}%`)
  set('dbMonthMeta', `${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`)
  set('dbConsistencyMeta', `${monthCount} dari ${daysElapsed} hari berlalu`)
  const bar = document.getElementById('dbConsistencyBar') as HTMLElement | null
  if (bar) bar.style.width = `${Math.min(100, consistency)}%`

  // 7 day bars
  const bars = document.getElementById('dbWeekBars')
  if (bars) {
    const days = lastNDays(7, now)
    bars.innerHTML = days.map((d) => {
      const k = fmt(d)
      const done = !!state.done[k]
      const isToday = k === today
      const label = DAYS_ID[d.getDay()].slice(0, 3)
      const h = done ? 100 : 4
      return `<div class="week-bar-col">
        <div class="week-bar-val">${done ? '✓' : ''}</div>
        <div class="week-bar-track"><div class="week-bar-fill ${done ? '' : 'empty'}" style="height:${h}%"></div></div>
        <div class="week-bar-label ${isToday ? 'today' : ''}">${label}</div>
      </div>`
    }).join('')
  }

  // Today's schedule
  const schedEl = document.getElementById('dbTodaySchedule')
  if (schedEl) {
    const wd = now.getDay()
    const list = state.schedule[String(wd)] || []
    if (!list.length) {
      schedEl.innerHTML = `<div class="empty-state">Tidak ada jadwal latihan untuk hari ini. Anda bisa menambahkannya di menu Jadwal.</div>`
    } else {
      const doneToday = !!state.done[today]
      schedEl.innerHTML = `<div class="today-schedule-list">${list.map((e) => `
        <div class="today-schedule-item"><span>${esc(e.n)}</span><i>${esc(e.d)}</i></div>`).join('')}</div>
        <div style="margin-top:14px;font-size:13px;color:${doneToday ? 'var(--success)' : 'var(--text-muted)'}">
          ${doneToday ? 'Sesi hari ini sudah ditandai selesai.' : 'Sesi hari ini belum ditandai selesai.'}
        </div>`
    }
  }

  // Recent
  const recentEl = document.getElementById('dbRecent')
  if (recentEl) {
    const keys = Object.keys(state.done).filter((k) => state.done[k]).sort().reverse().slice(0, 5)
    if (!keys.length) {
      recentEl.innerHTML = `<div class="empty-state">Belum ada riwayat workout. Tandai sesi selesai di kalender untuk mulai melacak progres.</div>`
    } else {
      recentEl.innerHTML = `<div class="recent-list">${keys.map((k) => {
        const d = parse(k)
        const wd = d.getDay()
        const exercises = state.schedule[String(wd)] || []
        const label = exercises.length ? exercises.map((e) => e.n).join(', ') : 'Latihan selesai'
        const dateStr = `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
        return `<div class="recent-item">
          <div class="recent-main">
            <div class="recent-date">${dateStr}</div>
            <div class="recent-meta">${DAYS_ID[wd]} · ${esc(label)}</div>
          </div>
          <div class="recent-badge">Selesai</div>
        </div>`
      }).join('')}</div>`
    }
  }
}
