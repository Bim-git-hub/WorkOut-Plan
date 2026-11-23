import { DAYS_ID, MONTHS_ID } from '../lib/constants'
import { parse, pad, fmt } from '../lib/dates'
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
  const key = String(wd)
  const list = state.schedule[key] || []
  const isDone = !!state.done[selected]
  const isToday = selected === fmt(new Date())
  const label = (state.labels?.[key] || '').trim()
  const body = document.getElementById('notebody')!

  if (ctx.editing) {
    body.innerHTML = `<div class="top"><span>Atur jadwal</span><span>${DAYS_ID[wd]}</span></div>
      <div class="bigdate" style="padding:16px 0 14px"><div><em>Setiap ${DAYS_ID[wd]}</em><span>berlaku untuk semua hari ${DAYS_ID[wd]}</span></div></div>
      <div class="label-row" style="margin-top:16px">
        <span class="field-label">Judul sesi</span>
        <input class="field-input" id="labelInput" type="text" value="${esc(label)}" placeholder="Contoh: Upper Body, Lower Body, Cardio">
      </div>
      <div id="editRows">${list.map((e, i) => `<div class="erow">
        <input class="einput" type="text" value="${esc(e.n)}" placeholder="Nama latihan">
        <input class="einput" type="text" value="${esc(e.d)}" placeholder="3 x 12">
        <button class="x" data-del="${i}" title="Hapus">×</button></div>`).join('')}</div>
      <div class="row">
        <button class="tbtn" id="addRow">+ Latihan</button>
        <button class="tbtn fill" id="saveEdit">Simpan</button>
        <button class="tbtn" id="cancelEdit">Batal</button>
      </div>`
    const collect = (): Exercise[] => [...body.querySelectorAll('.erow')].map((r) => {
      const i = r.querySelectorAll('input')
      return { n: i[0].value.trim(), d: i[1].value.trim() }
    })
    body.querySelector('#addRow')!.addEventListener('click', () => {
      state.schedule[key] = collect().concat([{ n: '', d: '' }])
      ctx.renderNote()
    })
    body.querySelectorAll<HTMLElement>('[data-del]').forEach((b) => {
      b.onclick = () => {
        const c = collect()
        c.splice(+b.dataset.del!, 1)
        state.schedule[key] = c
        ctx.renderNote()
      }
    })
    body.querySelector('#saveEdit')!.addEventListener('click', async () => {
      state.schedule[key] = collect().filter((e) => e.n)
      const labelInput = body.querySelector<HTMLInputElement>('#labelInput')
      state.labels = state.labels || {}
      state.labels[key] = (labelInput?.value || '').trim().slice(0, 40)
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

  body.innerHTML = `<div class="top"><span>${isToday ? 'Hari ini' : 'Terpilih'}</span><span class="${isDone ? 'ok' : ''}">${isDone ? '[ Selesai ]' : '[ Belum ]'}</span></div>
    <div class="bigdate"><b>${date.getDate()}</b><div><em>${DAYS_ID[wd]}</em><span>${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}</span></div></div>
    ${label ? `<div class="schedule-title" style="margin-top:12px">${esc(label)}</div>` : ''}
    ${list.length ? `<ul class="ex">${list.map((e, i) => `<li><span class="no">${pad(i + 1)}</span><span class="t">${esc(e.n)}</span><span class="lead"></span><span class="d">${esc(e.d)}</span></li>`).join('')}</ul>` : `<div class="restmsg">Hari istirahat.</div>`}
    <button class="cta ${isDone ? 'on' : ''}" id="toggleDone">${isDone ? 'Selesai — klik untuk batalkan' : 'Tandai selesai'}</button>
    <span class="cap">Catatan</span>
    <textarea id="noteText" placeholder="Beban, rasa badan, rekor baru...">${esc(state.notes[selected] || '')}</textarea>
    <div class="row"><button class="tbtn" id="editSched">Edit jadwal ${DAYS_ID[wd]}</button></div>`

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
