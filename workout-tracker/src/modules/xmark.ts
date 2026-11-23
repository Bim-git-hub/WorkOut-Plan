// tanda X bergaya spidol, sedikit berbeda tiap tanggal
export function xMark(seed: number, animate: boolean): string {
  const r = (k: number): number => {
    const v = Math.sin(seed * k + k) * 10000
    return v - Math.floor(v)
  }
  const j = (k: number): number => (r(k) - 0.5) * 7
  const rot = ((r(9) - 0.5) * 8).toFixed(1)
  const d1 = `M${16 + j(1)} ${16 + j(2)} L${84 + j(3)} ${84 + j(4)}`
  const d2 = `M${84 + j(5)} ${16 + j(6)} L${16 + j(7)} ${84 + j(8)}`
  return `<svg class="xm ${animate ? 'draw' : ''}" viewBox="0 0 100 100" style="transform:rotate(${rot}deg)"><path pathLength="1" d="${d1}"/><path pathLength="1" d="${d2}"/></svg>`
}
