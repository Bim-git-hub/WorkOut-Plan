import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, copyFileSync } from 'fs'

type Exercise = { n: string; d: string }
type WorkoutState = {
  version: 1
  schedule: Record<string, Exercise[]>
  done: Record<string, boolean>
  notes: Record<string, string>
  labels?: Record<string, string>
}

function getDataDir(): string {
  return app.getPath('userData')
}

function getDataPath(): string {
  return join(getDataDir(), 'data.json')
}

function getBackupPath(): string {
  return join(getDataDir(), 'data.bak.json')
}

function getTmpPath(): string {
  return join(getDataDir(), 'data.tmp.json')
}

function ensureDataDir() {
  const dir = getDataDir()
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function isValidState(obj: any): obj is WorkoutState {
  return obj && typeof obj === 'object' && obj.schedule && obj.done && typeof obj.schedule === 'object' && typeof obj.done === 'object'
}

function readJsonFile(path: string): WorkoutState | null {
  try {
    if (!existsSync(path)) return null
    const raw = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(raw)
    if (isValidState(parsed)) return parsed as WorkoutState
    return null
  } catch {
    return null
  }
}

function atomicWriteJson(path: string, data: WorkoutState) {
  ensureDataDir()
  const tmp = getTmpPath()
  const bak = getBackupPath()
  const payload = JSON.stringify(data, null, 2)
  writeFileSync(tmp, payload, 'utf-8')
  // backup existing
  if (existsSync(path)) {
    try {
      copyFileSync(path, bak)
    } catch {
      // ignore backup failure
    }
  }
  // atomic-ish rename: on Windows rename can fail if dest exists
  try {
    if (existsSync(path)) unlinkSync(path)
  } catch {
    // if unlink fails, try rename anyway
  }
  renameSync(tmp, path)
}

function loadState(): WorkoutState | null {
  const p = getDataPath()
  const state = readJsonFile(p)
  if (state) return state
  // try backup
  const bak = readJsonFile(getBackupPath())
  if (bak) {
    try { atomicWriteJson(p, bak) } catch {}
    return bak
  }
  return null
}

function saveState(state: WorkoutState) {
  atomicWriteJson(getDataPath(), state)
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    title: 'Workout Tracker',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.setMenuBarVisibility(false)

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('storage:load', async () => {
    return loadState()
  })

  ipcMain.handle('storage:save', async (_e, state: WorkoutState) => {
    if (!isValidState(state)) throw new Error('Invalid state')
    saveState(state)
  })

  ipcMain.handle('storage:export', async (_e, state: WorkoutState) => {
    if (!isValidState(state)) throw new Error('Invalid state')
    const win = BrowserWindow.getFocusedWindow()
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const defaultName = `workout-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`
    const res = await dialog.showSaveDialog(win ?? undefined as any, {
      title: 'Ekspor backup',
      defaultPath: defaultName,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (res.canceled || !res.filePath) return { ok: false }
    writeFileSync(res.filePath, JSON.stringify(state, null, 2), 'utf-8')
    return { ok: true }
  })

  ipcMain.handle('storage:import', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const res = await dialog.showOpenDialog(win ?? undefined as any, {
      title: 'Impor backup',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (res.canceled || !res.filePaths[0]) return null
    const raw = readFileSync(res.filePaths[0], 'utf-8')
    const parsed = JSON.parse(raw)
    if (!isValidState(parsed)) throw new Error('Invalid backup')
    // normalize minimal
    const state: WorkoutState = {
      version: 1,
      schedule: parsed.schedule as any,
      done: parsed.done as any,
      notes: (parsed.notes && typeof parsed.notes === 'object') ? parsed.notes as any : {},
      labels: (parsed.labels && typeof parsed.labels === 'object') ? parsed.labels as any : {}
    }
    saveState(state)
    return state
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
