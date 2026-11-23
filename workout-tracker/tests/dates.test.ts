import { describe, it, expect } from 'vitest'
import { fmt, parse, pad, countMonth, countTotal } from '../src/lib/dates'

describe('dates', () => {
  it('pad adds leading zero', () => {
    expect(pad(1)).toBe('01')
    expect(pad(12)).toBe('12')
  })

  it('fmt formats local date as YYYY-MM-DD', () => {
    expect(fmt(new Date(2026, 10, 23))).toBe('2026-11-23')
    expect(fmt(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('parse parses YYYY-MM-DD as local date', () => {
    const d = parse('2026-11-23')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(10)
    expect(d.getDate()).toBe(23)
  })

  it('fmt/parse roundtrip', () => {
    const s = '2024-02-29'
    expect(fmt(parse(s))).toBe(s)
  })

  it('countMonth counts only keys in given month', () => {
    const done = { '2026-11-01': true, '2026-11-23': true, '2026-12-01': true }
    expect(countMonth(done, 2026, 10)).toBe(2)
    expect(countMonth(done, 2026, 11)).toBe(1)
  })

  it('countTotal counts all done entries', () => {
    expect(countTotal({ '2026-11-01': true, '2026-11-23': true })).toBe(2)
  })
})
