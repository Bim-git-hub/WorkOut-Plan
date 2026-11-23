import { DAYS_ID, MONTHS_ID } from '../lib/constants'
import { parse } from '../lib/dates'
import { esc } from '../lib/utils'
import type { WorkoutState, Exercise } from '../lib/types'

export interface NotepadCtx {
  state: WorkoutState
  selected: string
  editing: boolean
  setEditing: (v: boolean) => void
  setJustMarked: (v: string | null) => void
  save: () => Promise<void> | void
  render: () => void
  renderNote: () => void
  reloadState: () => Promise<void>
}

export function renderNote(ctx: NotepadCtx): void {
  const { state, selected } = ctx
  const date = parse(selected)
  const wd = date.getDay()
  const list = state.schedule[String(wd)] || []
  const isDone = !!state.done[selected]
  const body = document.getElementById('notebody')!

  if (ctx.editing) {
    body.innerHTML = `<h3>Atur jadwal ${DAYS_ID[wd]}</h3>
      <p class="date">berlaku untuk semua hari ${DAYS_ID[wd]}</p>
      <div id="editRows">${list.map((e, i) => `<div class="erow">
        <input type="text" value="${esc(e.n)}" placeholder="Nama latihan">
        <input type="text" value="${esc(e.d)}" placeholder="3 x 12">
        <button data-del="${i}" title="Hapus">✕</button></div>`).join('')}</div>
      <div class="btnrow">
        <button class="btn" id="addRow">+ Latihan</button>
        <button class="btn primary" id="saveEdit">Simpan</button>
        <button class="btn" id="cancelEdit">Batal</button>
      </div>`
    const collect = (): Exercise[] => [...body.querySelectorAll('.erow')].map((r) => {
      const i = r.querySelectorAll('input')
      return { n: i[0].value.trim(), d: i[1].value.trim() }
    })
    body.querySelector('#addRow')!.addEventListener('click', () => {
      state.schedule[String(wd)] = collect().concat([{ n: '', d: '' }])
      ctx.renderNote()
    })
    body.querySelectorAll<HTMLElement>('[data-del]').forEach((b) => {
      b.onclick = () => {
        const c = collect()
        c.splice(+b.dataset.del!, 1)
        state.schedule[String(wd)] = c
        ctx.renderNote()
      }
    })
    body.querySelector('#saveEdit')!.addEventListener('click', async () => {
      state.schedule[String(wd)] = collect().filter((e) => e.n)
      ctx.setEditing(false)
      await ctx.save()
      ctx.render()
    })
    body.querySelector('#cancelEdit')!.addEventListener('click', async () => {
      await ctx.reloadState()
      ctx.setEditing(false)
      ctx.render()
    })
    return
  }

  const dayLabel = (state.labels?.[String(wd)] || '').trim()
  body.innerHTML = `${isDone ? '<div class="stamp">SELESAI</div>' : ''}
    <h3>${DAYS_ID[wd]}</h3>
    <p class="date">${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}${dayLabel ? ` · <span style="color:var(--accent-strong)">${esc(dayLabel)}</span>` : ''}</p>
    ${list.length ? `<ul>${list.map((e) => `<li><span>${esc(e.n)}</span><i>${esc(e.d)}</i></li>`).join('')}</ul>` : `<div class="rest">Hari istirahat. Belum ada jadwal.</div>`}
    <button class="markbtn ${isDone ? 'on' : ''}" id="toggleDone">${isDone ? '✔ Sudah selesai (klik untuk batal)' : '✕ Tandai selesai workout'}</button>
    <label>Catatan hari ini</label>
    <textarea id="noteText" placeholder="beban, rasa badan, PR baru...">${esc(state.notes[selected] || '')}</textarea>
    <div class="btnrow"><button class="btn" id="editSched">Edit jadwal ${DAYS_ID[wd]}</button></div>`

  body.querySelector('#toggleDone')!.addEventListener('click', async () => {
    if (state.done[selected]) {
      delete state.done[selected]
      ctx.setJustMarked(null)
    } else {
      state.done[selected] = true
      ctx.setJustMarked(selected)
    }
    await ctx.save()
    ctx.render()
    ctx.setJustMarked(null)
  })
  body.querySelector('#noteText')!.addEventListener('input', (e) => {
    const v = (e.target as HTMLTextAreaElement).value
    if (v.trim()) state.notes[selected] = v
    else delete state.notes[selected]
    void ctx.save()
  })
  body.querySelector('#editSched')!.addEventListener('click', () => {
    ctx.setEditing(true)
    ctx.renderNote()
  })
}
