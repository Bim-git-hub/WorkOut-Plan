import { calcStreak, countMonth, countTotal, fmt, pad } from '../lib/dates'
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

export function renderStats(state: WorkoutState, view: Date, opts?: { enter?: boolean }): void {
  const enter = !!opts?.enter

  const total = countTotal(state.done)
  const streak = calcStreak(state.done, new Date())
  const monthCount = countMonth(state.done, view.getFullYear(), view.getMonth())
  const dim = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  let target = 0
  for (let d = 1; d <= dim; d++) {
    const wd = new Date(view.getFullYear(), view.getMonth(), d).getDay()
    if ((state.schedule[String(wd)] || []).length) target++
  }

  const nums: [string, number][] = [['stTotal', total], ['stStreak', streak], ['stMonth', monthCount]]
  for (const [id, val] of nums) {
    const el = document.getElementById(id)
    if (!el) continue
    if (enter) { el.textContent = '00'; countUp(el, val) }
    else if (prevNums.get(id) !== val) rollNum(el, val)
    else el.textContent = pad(val)
    prevNums.set(id, val)
  }

  const stTarget = document.getElementById('stTarget')
  if (stTarget) stTarget.textContent = target ? `/ ${pad(target)} hari` : 'hari'
  const bar = document.getElementById('stBar') as HTMLElement | null
  if (bar) {
    bar.style.width = `${target ? Math.min(100, (monthCount / target) * 100) : 0}%`
    if (enter && !reducedMotion()) {
      bar.classList.remove('grow-x')
      void bar.offsetWidth
      bar.classList.add('grow-x')
      bar.addEventListener('animationend', () => bar.classList.remove('grow-x'), { once: true })
    } else {
      bar.classList.remove('grow-x')
    }
  }

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
