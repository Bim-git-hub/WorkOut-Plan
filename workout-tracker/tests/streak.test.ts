import { describe, it, expect } from 'vitest'
import { calcStreak } from '../src/lib/dates'

describe('calcStreak', () => {
  it('returns 0 when no workouts', () => {
    expect(calcStreak({}, new Date(2026, 10, 23))).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    const done = { '2026-11-21': true, '2026-11-22': true, '2026-11-23': true }
    expect(calcStreak(done, new Date(2026, 10, 23, 15, 0))).toBe(3)
  })

  it('today not marked does not break streak until day ends (A6)', () => {
    const done = { '2026-11-21': true, '2026-11-22': true }
    // today is 23rd, not marked yet
    expect(calcStreak(done, new Date(2026, 10, 23, 8, 0))).toBe(2)
  })

  it('streak breaks when a day is missed', () => {
    const done = { '2026-11-20': true, '2026-11-22': true, '2026-11-23': true }
    expect(calcStreak(done, new Date(2026, 10, 23))).toBe(2)
  })

  it('counts from yesterday when today not done and yesterday done', () => {
    const done = { '2026-11-22': true }
    expect(calcStreak(done, new Date(2026, 10, 23))).toBe(1)
  })
})
