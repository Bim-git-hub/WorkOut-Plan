import './styles.css'
import { fmt } from './lib/dates'
import { loadState, saveState, exportBackup, importBackup } from './lib/storage'
import { normalizeState, defaultState, type WorkoutState } from './lib/types'
import { initCalendarStatic, renderCalendar } from './modules/calendar'
import { renderNote } from './modules/notepad'
import { renderStats } from './modules/stats'
import { renderDashboard } from './modules/dashboard'
import { renderSchedule } from './modules/schedule'
import { renderHistory } from './modules/history'

type ViewName = 'dashboard' | 'calendar' | 'schedule' | 'history' | 'settings'

let state: WorkoutState = defaultState()
let viewDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
let selected = fmt(new Date())
let editing = false
let justMarked: string | null = null
let flip = ''
let currentView: ViewName = 'dashboard'

type Theme = 'paper' | 'ink'
const THEME_KEY = 'workout-log-theme'

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try { localStorage.setItem(THEME_KEY, theme) } catch {}
  const btn = document.getElementById('themeToggle')
  if (btn) btn.textContent = theme === 'paper' ? 'Mode Tinta' : 'Mode Kertas'
}

function initTheme() {
  let theme: Theme = 'paper'
  try {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved === 'paper' || saved === 'ink') theme = saved
    else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) theme = 'ink'
  } catch {}
  applyTheme(theme)
}

function setEditing(v: boolean) { editing = v }
function setJustMarked(v: string | null) { justMarked = v }

async function persist() { await saveState(state) }

async function reloadState() {
  const fresh = await loadState()
  const norm = normalizeState(fresh)
  state.version = norm.version
  state.schedule = norm.schedule
  state.done = norm.done
  state.notes = norm.notes
  state.labels = norm.labels
}

function openDayModal() {
  const modal = document.getElementById('dayModal')
  if (modal) {
    modal.hidden = false
    const focusTarget = modal.querySelector<HTMLElement>('#dayModalClose')
    focusTarget?.focus()
  }
}
async function closeDayModal() {
  const modal = document.getElementById('dayModal')
  if (modal) modal.hidden = true
  if (editing) {
    await reloadState()
    editing = false
    renderAll()
  } else {
    editing = false
  }
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function updateChrome() {
  const now = new Date()
  const line = `${DAYS_SHORT[now.getDay()]}, ${now.getDate()} ${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}`
  const tl = document.getElementById('todayLine')
  if (tl) tl.textContent = line
  const fd = document.getElementById('footDate')
  if (fd) fd.textContent = `${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}`
  const dm = document.getElementById('dashMonth')
  if (dm) dm.textContent = `${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}`
}

const VIEW_ORDER: ViewName[] = ['dashboard', 'calendar', 'schedule', 'history', 'settings']

function updateTabIndicator(name: ViewName = currentView, instant = false) {
  const tabs = document.querySelector<HTMLElement>('.tabs')
  const indicator = tabs?.querySelector<HTMLElement>('.tab-indicator')
  const btn = tabs?.querySelector<HTMLElement>(`[data-view="${name}"]`)
  if (!tabs || !indicator || !btn) return
  const tr = tabs.getBoundingClientRect()
  const br = btn.getBoundingClientRect()
  if (instant) indicator.style.transition = 'none'
  indicator.style.width = `${br.width}px`
  indicator.style.transform = `translateX(${br.left - tr.left}px)`
  if (instant) {
    void indicator.offsetWidth
    indicator.style.transition = ''
  }
}

function triggerEnter(viewEl: HTMLElement) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.getAttribute('data-motion') === 'off'
  if (reduced) return
  const targets = [...viewEl.querySelectorAll<HTMLElement>('.mast, .stats .st, .pane')]
  targets.forEach((el, i) => {
    el.classList.remove('enter')
    el.style.removeProperty('--enter-delay')
    // force reflow so re-trigger works only when explicitly called again
    void el.offsetWidth
    const delay = Math.min(i * 45, 350)
    el.style.setProperty('--enter-delay', `${delay}ms`)
    el.classList.add('enter')
    el.addEventListener('animationend', (e) => {
      if (e.target !== el) return
      el.classList.remove('enter')
      el.style.removeProperty('--enter-delay')
    }, { once: true })
  })
}

let viewTx = 0
function finishViewTransition(el: HTMLElement) {
  el.classList.remove('leaving', 'entering', 'back')
}

function switchView(name: ViewName) {
  if (name === currentView) return
  const prev = currentView
  const dir = VIEW_ORDER.indexOf(name) > VIEW_ORDER.indexOf(prev) ? 1 : -1
  currentView = name
  closeDayModal()

  document.querySelectorAll<HTMLElement>('.tabs [data-view]').forEach((el) => el.classList.toggle('active', el.dataset.view === name))
  updateTabIndicator(name)
  updateChrome()

  const oldView = document.getElementById(`view-${prev}`)
  const newView = document.getElementById(`view-${name}`)
  if (!oldView || !newView) { renderCurrentView(); return }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.getAttribute('data-motion') === 'off'

  const lingering = document.querySelectorAll<HTMLElement>('.view.leaving, .view.entering')
  const tx = ++viewTx
  if (lingering.length || reduced) {
    document.querySelectorAll<HTMLElement>('.view').forEach((el) => { el.classList.remove('active', 'leaving', 'entering', 'back') })
    newView.classList.add('active')
    if (!reduced) {
      newView.classList.add('entering')
      if (dir < 0) newView.classList.add('back')
      newView.addEventListener('animationend', (e) => {
        if (e.target !== newView || tx !== viewTx) return
        newView.classList.remove('entering', 'back')
      }, { once: true })
    }
    renderCurrentView(true)
    triggerEnter(newView)
    return
  }

  oldView.classList.remove('active')
  oldView.classList.add('leaving')

  const enter = () => {
    if (tx !== viewTx) return
    oldView.classList.remove('leaving')
    newView.classList.add('active', 'entering')
    if (dir < 0) newView.classList.add('back')
    renderCurrentView(true)
    triggerEnter(newView)
    newView.addEventListener('animationend', (e) => {
      if (e.target !== newView || tx !== viewTx) return
      newView.classList.remove('entering', 'back')
    }, { once: true })
  }

  oldView.addEventListener('animationend', (e) => {
    if (e.target !== oldView || tx !== viewTx) return
    enter()
  }, { once: true })
}

function renderCalendarView(enter = false) {
  const anim = enter || !!flip
  renderCalendar({
    state,
    view: viewDate,
    selected,
    justMarked,
    flip,
    enter: anim,
    onSelectDate: (dateStr) => { selected = dateStr; editing = false; renderAll(); openDayModal() }
  })
  flip = ''

  const noteCtx = {
    state,
    selected,
    get editing() { return editing },
    setEditing,
    setJustMarked,
    save: persist,
    render: renderAll,
    renderNote: () => renderNote(noteCtx),
    reloadState
  }
  renderNote(noteCtx)
  renderStats(state, viewDate)
}

function renderCurrentView(enter = false) {
  if (currentView === 'dashboard') renderDashboard(state, { enter })
  if (currentView === 'calendar') renderCalendarView(enter)
  if (currentView === 'schedule') renderSchedule(state, persist, renderAll, reloadState, { enter })
  if (currentView === 'history') renderHistory(state, { enter })
  // settings is static
}

function renderAll() {
  updateChrome()
  // always keep calendar stats fresh when visible; render current view
  renderCurrentView()
  // if dashboard is active, also fine; calendar stats will update when calendar opened
}

async function init() {
  initTheme()
  state = await loadState()
  initCalendarStatic()
  updateChrome()

  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme')
    applyTheme(current === 'ink' ? 'paper' : 'ink')
  })

  document.querySelectorAll<HTMLElement>('.tabs [data-view]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view as ViewName))
  })
  document.querySelectorAll<HTMLElement>('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.goto as ViewName))
  })
  window.addEventListener('resize', () => updateTabIndicator(currentView, true))

  document.getElementById('prev')!.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
    flip = 'slide-p'
    renderAll()
  })
  document.getElementById('next')!.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
    flip = 'slide-n'
    renderAll()
  })
  document.getElementById('todayBtn')!.addEventListener('click', () => {
    const t = new Date()
    viewDate = new Date(t.getFullYear(), t.getMonth(), 1)
    selected = fmt(t)
    editing = false
    flip = 'slide-n'
    renderAll()
    openDayModal()
  })

  document.getElementById('exportBtn')!.addEventListener('click', async () => { await exportBackup(state) })

  document.getElementById('importBtn')!.addEventListener('click', async () => {
    if (window.api) {
      try {
        const imported = await importBackup()
        if (imported) {
          const norm = normalizeState(imported)
          state.version = norm.version; state.schedule = norm.schedule; state.done = norm.done; state.notes = norm.notes; state.labels = norm.labels
          editing = false
          renderAll()
          alert('Backup berhasil diimpor.')
        }
      } catch { alert('File backup tidak valid.') }
      return
    }
    document.getElementById('importFile')!.click()
  })

  document.getElementById('importFile')!.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement
    const f = input.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => {
      try {
        const s = JSON.parse(String(r.result))
        if (!s.schedule || !s.done) throw 0
        const norm = normalizeState(s)
        state.version = norm.version; state.schedule = norm.schedule; state.done = norm.done; state.notes = norm.notes; state.labels = norm.labels
        void saveState(state)
        renderAll()
        alert('Backup berhasil diimpor.')
      } catch { alert('File backup tidak valid.') }
    }
    r.readAsText(f)
    input.value = ''
  })

  document.getElementById('dayModalClose')?.addEventListener('click', closeDayModal)
  document.getElementById('dayModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDayModal()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { void closeDayModal(); return }
    if (currentView !== 'calendar') return
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (e.key === 'ArrowLeft') {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
      flip = 'slide-p'
      renderAll()
    }
    if (e.key === 'ArrowRight') {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
      flip = 'slide-n'
      renderAll()
    }
  })

  updateChrome()
  renderCurrentView(true)
  requestAnimationFrame(() => updateTabIndicator(currentView, true))
  const initView = document.getElementById(`view-${currentView}`)
  if (initView) triggerEnter(initView)
}

void init()

