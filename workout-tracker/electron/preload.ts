import { contextBridge, ipcRenderer } from 'electron'

type Exercise = { n: string; d: string }
type WorkoutState = {
  version: 1
  schedule: Record<string, Exercise[]>
  done: Record<string, boolean>
  notes: Record<string, string>
  labels?: Record<string, string>
}

const api = {
  load: (): Promise<WorkoutState | null> => ipcRenderer.invoke('storage:load'),
  save: (state: WorkoutState): Promise<void> => ipcRenderer.invoke('storage:save', state),
  exportJson: (state: WorkoutState): Promise<void> => ipcRenderer.invoke('storage:export', state).then(() => undefined),
  importJson: (): Promise<WorkoutState | null> => ipcRenderer.invoke('storage:import')
}

contextBridge.exposeInMainWorld('api', api)

export type { WorkoutState, Exercise }
