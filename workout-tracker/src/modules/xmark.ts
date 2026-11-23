// tanda X seperti spidol, bentuk sedikit berbeda tiap tanggal
export function xMark(seed: number, animate: boolean): string {
  const r = (k: number): number => {
    const v = Math.sin(seed * k + k) * 10000
    return v - Math.floor(v)
  }
  const j = (k: number, a: number): string => ((r(k) - 0.5) * a).toFixed(1)
  const rot = ((r(9) - 0.5) * 14).toFixed(1)
  const d1 = `M${18 + +j(1, 10)} ${20 + +j(2, 10)} C${38 + +j(3, 10)} ${38 + +j(4, 10)},${58 + +j(5, 10)} ${62 + +j(6, 10)},${82 + +j(7, 8)} ${82 + +j(8, 8)}`
  const d2 = `M${82 + +j(11, 10)} ${18 + +j(12, 10)} C${62 + +j(13, 10)} ${40 + +j(14, 10)},${40 + +j(15, 10)} ${62 + +j(16, 10)},${20 + +j(17, 8)} ${84 + +j(18, 8)}`
  return `<svg class="xm ${animate ? 'draw' : ''}" viewBox="0 0 100 100" style="transform:rotate(${rot}deg)"><path pathLength="1" d="${d1}"/><path pathLength="1" d="${d2}"/></svg>`
}
