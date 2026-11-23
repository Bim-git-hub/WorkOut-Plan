import { describe, it, expect } from 'vitest'
import { readLegacyLocalStorage } from '../src/lib/migrate'
import { STORAGE_KEY } from '../src/lib/types'

function mockStorage(map: Record<string, string>) {
  return {
    getItem: (k: string) => (k in map ? map[k] : null)
  }
}

describe('migrate', () => {
  it('returns null when storage is empty', () => {
    expect(readLegacyLocalStorage(mockStorage({}))).toBeNull()
  })

  it('returns null when key missing', () => {
    expect(readLegacyLocalStorage(mockStorage({ other: '{}' }))).toBeNull()
  })

  it('migrates valid legacy localStorage state', () => {
    const legacy = {
      schedule: { '1': [{ n: 'Push-up', d: '3 x 12' }] },
      done: { '2026-11-23': true },
      notes: { '2026-11-23': 'ok' }
    }
    const res = readLegacyLocalStorage(mockStorage({ [STORAGE_KEY]: JSON.stringify(legacy) }))
    expect(res).not.toBeNull()
    expect(res!.version).toBe(1)
    expect(res!.done['2026-11-23']).toBe(true)
    expect(res!.notes['2026-11-23']).toBe('ok')
    expect(res!.schedule['1'][0].n).toBe('Push-up')
    // should fill missing days
    expect(res!.schedule['0']).toEqual([])
  })

  it('returns null for invalid json', () => {
    expect(readLegacyLocalStorage(mockStorage({ [STORAGE_KEY]: '{bad' }))).toBeNull()
  })

  it('returns null for non-state object', () => {
    expect(readLegacyLocalStorage(mockStorage({ [STORAGE_KEY]: JSON.stringify({ foo: 1 }) }))).toBeNull()
  })
})
