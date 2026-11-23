import { DAYS_ID } from '../lib/constants'
import { esc } from '../lib/utils'
import type { WorkoutState, Exercise } from '../lib/types'

let editingDay: number | null = null

const ORDER = [1, 2, 3, 4, 5, 6, 0] // Senin..Minggu

export function renderSchedule(state: WorkoutState, persist: () => Promise<void>, renderAll: () => void, reloadState: () => Promise<void>): void {
  const grid = document.getElementById('scheduleGrid')
  if (!grid) return

  grid.innerHTML = ORDER.map((wd) => {
    const key = String(wd)
    const list = state.schedule[key] || []
    const label = (state.labels?.[key] || '').trim()
    const isEditing = editingDay === wd
    const dayName = DAYS_ID[wd]

    if (isEditing) {
      return `<div class="schedule-day" data-day="${wd}">
        <div class="schedule-day-head"><h3>${dayName}</h3><span>Mengedit</span></div>
        <div class="schedule-edit" id="sched-edit-${wd}">
          <div class="label-row">
            <label class="field-label" for="label-${wd}">Judul sesi</label>
            <input class="field-input" id="label-${wd}" type="text" value="${esc(label)}" placeholder="Contoh: Upper Body, Lower Body, Cardio">
          </div>
          <div class="field-label" style="margin:10px 0 8px">Daftar latihan</div>
          ${list.map((e, i) => `<div class="erow">
            <input class="einput" type="text" value="${esc(e.n)}" placeholder="Nama latihan">
            <input class="einput" type="text" value="${esc(e.d)}" placeholder="3 x 12">
            <button class="x" data-del="${i}" title="Hapus">×</button>
          </div>`).join('')}
        </div>
        <div class="row">
          <button class="tbtn" data-action="add" data-day="${wd}">+ Latihan</button>
          <button class="tbtn fill" data-action="save" data-day="${wd}">Simpan</button>
          <button class="tbtn" data-action="cancel" data-day="${wd}">Batal</button>
        </div>
      </div>`
    }

    return `<div class="schedule-day" data-day="${wd}">
      <div class="schedule-day-head">
        <div>
          <h3>${dayName}</h3>
          <div class="schedule-title">${esc(label || (list.length ? 'Latihan' : 'Rest'))}</div>
        </div>
        <span>${list.length} latihan</span>
      </div>
      <div class="schedule-exercises">
        ${list.length
          ? list.map((e) => `<div class="schedule-exercise"><span>${esc(e.n)}</span><i>${esc(e.d)}</i></div>`).join('')
          : `<div class="empty-state" style="padding:12px">Hari istirahat</div>`}
      </div>
      <div class="row"><button class="tbtn" data-action="edit" data-day="${wd}">Edit jadwal</button></div>
    </div>`
  }).join('')

  const collect = (wd: number): Exercise[] => {
    const container = document.getElementById(`sched-edit-${wd}`)
    if (!container) return []
    return [...container.querySelectorAll('.erow')].map((r) => {
      const inputs = r.querySelectorAll('input')
      return { n: inputs[0].value.trim(), d: inputs[1].value.trim() }
    })
  }

  grid.querySelectorAll<HTMLElement>('[data-action="edit"]').forEach((btn) => {
    btn.onclick = async () => { await reloadState(); editingDay = Number(btn.dataset.day); renderSchedule(state, persist, renderAll, reloadState) }
  })
  grid.querySelectorAll<HTMLElement>('[data-action="add"]').forEach((btn) => {
    btn.onclick = () => {
      const wd = Number(btn.dataset.day)
      state.schedule[String(wd)] = collect(wd).concat([{ n: '', d: '' }])
      renderSchedule(state, persist, renderAll, reloadState)
    }
  })
  grid.querySelectorAll<HTMLElement>('[data-action="save"]').forEach((btn) => {
    btn.onclick = async () => {
      const wd = Number(btn.dataset.day)
      const key = String(wd)
      const labelInput = document.getElementById(`label-${wd}`) as HTMLInputElement | null
      state.schedule[key] = collect(wd).filter((e) => e.n)
      state.labels = state.labels || {}
      state.labels[key] = (labelInput?.value || '').trim().slice(0, 40)
      editingDay = null
      await persist()
      renderAll()
    }
  })
  grid.querySelectorAll<HTMLElement>('[data-action="cancel"]').forEach((btn) => {
    btn.onclick = async () => { await reloadState(); editingDay = null; renderAll() }
  })
  grid.querySelectorAll<HTMLElement>('[data-del]').forEach((btn) => {
    btn.onclick = () => {
      const dayEl = btn.closest<HTMLElement>('[data-day]')
      if (!dayEl) return
      const wd = Number(dayEl.dataset.day)
      const c = collect(wd)
      c.splice(Number(btn.dataset.del), 1)
      state.schedule[String(wd)] = c
      renderSchedule(state, persist, renderAll, reloadState)
    }
  })
}
