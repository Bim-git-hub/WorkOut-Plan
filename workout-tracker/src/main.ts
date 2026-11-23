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

const VIEW_META: Record<ViewName, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Ringkasan progres latihan Anda' },
  calendar: { title: 'Kalender', sub: 'Pantau dan tandai sesi latihan harian' },
  schedule: { title: 'Jadwal', sub: 'Kelola template latihan mingguan' },
  history: { title: 'Riwayat', sub: 'Lihat catatan workout yang telah selesai' },
  settings: { title: 'Pengaturan', sub: 'Kelola data dan preferensi aplikasi' }
}

let state: WorkoutState = defaultState()
let viewDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
let selected = fmt(new Date())
let editing = false
let justMarked: string | null = null
let flip = ''
let currentView: ViewName = 'dashboard'

type Theme = 'dark' | 'light'
const THEME_KEY = 'workout-tracker-theme'

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try { localStorage.setItem(THEME_KEY, theme) } catch {}
  const btn = document.getElementById('themeToggle')
  if (btn) btn.setAttribute('aria-pressed', String(theme === 'light'))
}

function initTheme() {
  let theme: Theme = 'dark'
  try {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved === 'light' || saved === 'dark') theme = saved
    else if (window.matchMedia?.('(prefers-color-scheme: light)').matches) theme = 'light'
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

function updateChrome() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const short = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  const sd = document.getElementById('sidebarDate')
  const td = document.getElementById('topbarDate')
  if (sd) sd.textContent = short
  if (td) td.textContent = dateStr
  const meta = VIEW_META[currentView]
  const t = document.getElementById('pageTitle')
  const s = document.getElementById('pageSub')
  if (t) t.textContent = meta.title
  if (s) s.textContent = meta.sub
}

function switchView(name: ViewName) {
  currentView = name
  closeDayModal()
  document.querySelectorAll<HTMLElement>('.view').forEach((el) => el.classList.toggle('active', el.id === `view-${name}`))
  document.querySelectorAll<HTMLElement>('.nav-item[data-view]').forEach((el) => el.classList.toggle('active', el.dataset.view === name))
  updateChrome()
  renderCurrentView()
}

function renderCalendarView() {
  renderCalendar({
    state,
    view: viewDate,
    selected,
    justMarked,
    flip,
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

function renderCurrentView() {
  if (currentView === 'dashboard') renderDashboard(state)
  if (currentView === 'calendar') renderCalendarView()
  if (currentView === 'schedule') renderSchedule(state, persist, renderAll, reloadState)
  if (currentView === 'history') renderHistory(state)
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
    applyTheme(current === 'light' ? 'dark' : 'light')
  })

  document.querySelectorAll<HTMLElement>('.nav-item[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view as ViewName))
  })
  document.querySelectorAll<HTMLElement>('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.goto as ViewName))
  })

  document.getElementById('prev')!.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
    flip = 'flip-prev'
    renderAll()
  })
  document.getElementById('next')!.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
    flip = 'flip-next'
    renderAll()
  })
  document.getElementById('todayBtn')!.addEventListener('click', () => {
    const t = new Date()
    viewDate = new Date(t.getFullYear(), t.getMonth(), 1)
    selected = fmt(t)
    editing = false
    flip = 'flip-next'
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
    if (e.key === 'Escape') closeDayModal()
  })

  renderAll()
}

void init()
