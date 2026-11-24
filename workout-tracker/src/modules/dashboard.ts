import { DAYS_ID, MONTHS_ID } from '../lib/constants'
import { fmt, parse, calcStreak, countMonth, countTotal, pad } from '../lib/dates'
import { esc } from '../lib/utils'
import type { WorkoutState } from '../lib/types'

const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const prevNums = new Map<string, number>()
const rafs = new Map<string, number>()

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.getAttribute('data-motion') === 'off'
}

function countUp(el: HTMLElement, to: number, ms = 700): void {
  const prev = rafs.get(el.id)
  if (prev) cancelAnimationFrame(prev)
  if (reducedMotion()) { el.textContent = pad(to); return }
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / ms)
    const eased = 1 - Math.pow(1 - t, 3)
    el.textContent = pad(Math.round(eased * to))
    if (t < 1) rafs.set(el.id, requestAnimationFrame(tick))
    else rafs.delete(el.id)
  }
  rafs.set(el.id, requestAnimationFrame(tick))
}

function rollNum(el: HTMLElement, to: number): void {
  const prev = rafs.get(el.id)
  if (prev) { cancelAnimationFrame(prev); rafs.delete(el.id) }
  const next = pad(to)
  if (el.textContent === next) return
  if (reducedMotion()) { el.textContent = next; return }
  el.classList.remove('num-roll')
  void el.offsetWidth
  el.textContent = next
  el.classList.add('num-roll')
  el.addEventListener('animationend', () => el.classList.remove('num-roll'), { once: true })
}

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

export function renderDashboard(state: WorkoutState, opts?: { enter?: boolean }): void {
  const enter = !!opts?.enter
  const now = new Date()
  const today = fmt(now)
  const streak = calcStreak(state.done, now)
  const monthCount = countMonth(state.done, now.getFullYear(), now.getMonth())
  const total = countTotal(state.done)
  const daysElapsed = now.getDate()
  const consistency = daysElapsed > 0 ? Math.round((monthCount / daysElapsed) * 100) : 0

  const nums: [string, number][] = [['dbStreak', streak], ['dbMonth', monthCount], ['dbTotal', total]]
  for (const [id, val] of nums) {
    const el = document.getElementById(id)
    if (!el) continue
    if (enter) { el.textContent = '00'; countUp(el, val) }
    else if (prevNums.get(id) !== val) rollNum(el, val)
    else el.textContent = pad(val)
    prevNums.set(id, val)
  }

  const meta = document.getElementById('dbMonthMeta')
  if (meta) meta.textContent = `${MONTHS_ID[now.getMonth()].slice(0, 3)} · ${consistency}%`

  const bar = document.getElementById('dbConsistencyBar') as HTMLElement | null
  if (bar) {
    bar.style.width = `${Math.min(100, consistency)}%`
    if (enter && !reducedMotion()) {
      bar.classList.remove('grow-x')
      void bar.offsetWidth
      bar.classList.add('grow-x')
      bar.addEventListener('animationend', () => bar.classList.remove('grow-x'), { once: true })
    } else {
      bar.classList.remove('grow-x')
    }
  }

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
      const anim = enter && !reducedMotion()
      const cls = `${state.done[s] ? 'on' : ''} ${s === today ? 'now' : ''}${anim ? ' sq-enter' : ''}`.trim()
      const style = anim ? ` style="--sq-delay:${i * 45}ms"` : ''
      wh += `<div class="${cls}"${style}><i></i>${DAYS_SHORT[x.getDay()][0]}</div>`
    }
    squares.innerHTML = wh
  }

  // 7 day bars
  const bars = document.getElementById('dbWeekBars')
  if (bars) {
    const days = lastNDays(7, now)
    bars.innerHTML = days.map((d, i) => {
      const k = fmt(d)
      const done = !!state.done[k]
      const isToday = k === today
      const anim = enter && !reducedMotion()
      const fillCls = `week-bar-fill ${done ? '' : 'empty'}${anim ? ' bar-grow' : ''}`.trim()
      const fillStyle = `height:${done ? 100 : 2}%${anim ? `;--bar-delay:${i * 45}ms` : ''}`
      return `<div class="week-bar-col">
        <div class="week-bar-val">${done ? '✓' : ''}</div>
        <div class="week-bar-track"><div class="${fillCls}" style="${fillStyle}"></div></div>
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
