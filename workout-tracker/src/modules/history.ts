import { DAYS_ID, MONTHS_ID } from '../lib/constants'
import { parse, pad } from '../lib/dates'
import { esc } from '../lib/utils'
import type { WorkoutState } from '../lib/types'

let filterMonth = ''

export function renderHistory(state: WorkoutState): void {
  const listEl = document.getElementById('historyList')
  const monthInput = document.getElementById('historyMonth') as HTMLInputElement | null
  if (!listEl) return

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
  if (!filterMonth) filterMonth = currentMonth
  if (monthInput) {
    if (!monthInput.value) monthInput.value = filterMonth
    monthInput.onchange = () => { filterMonth = monthInput.value; renderHistory(state) }
  }

  const keys = Object.keys(state.done)
    .filter((k) => state.done[k])
    .filter((k) => !filterMonth || k.startsWith(filterMonth))
    .sort()
    .reverse()

  if (!keys.length) {
    listEl.innerHTML = `<div class="empty-state">Tidak ada riwayat workout untuk periode ini.</div>`
    return
  }

  listEl.innerHTML = `<div class="history-list">${keys.map((k) => {
    const d = parse(k)
    const wd = d.getDay()
    const exercises = state.schedule[String(wd)] || []
    const note = state.notes[k]
    const dateStr = `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
    const exLabel = exercises.length ? exercises.map((e) => `<strong>${esc(e.n)}</strong> <span style="color:var(--text-dim)">(${esc(e.d)})</span>`).join(', ') : 'Latihan selesai'
    return `<div class="history-item">
      <div>
        <div class="history-date">${dateStr}</div>
        <div class="history-day">${DAYS_ID[wd]}</div>
      </div>
      <div class="history-detail">
        <div>${exLabel}</div>
        ${note ? `<div class="history-note">"${esc(note)}"</div>` : ''}
      </div>
      <div class="history-status">Selesai</div>
    </div>`
  }).join('')}</div>`
}
