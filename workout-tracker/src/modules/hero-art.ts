// [langit atas, langit bawah, gunung belakang, gunung depan, matahari]
export const PALETTE: string[][] = [
  ['#9fc5e8', '#e8f1fa', '#8aa4bd', '#5f7c99', '#fff3c4'],
  ['#f4b6c2', '#fde8ec', '#b58aa0', '#8a5f7c', '#fff3c4'],
  ['#a8dcc4', '#ecf9f1', '#7fb59a', '#4f8a70', '#fff3c4'],
  ['#ffd6a5', '#fff1e0', '#d9a066', '#a96f3c', '#fff7d6'],
  ['#8ed1a2', '#e6f7ea', '#5fa878', '#3b7a53', '#fff3c4'],
  ['#6ec1f0', '#e3f4fd', '#4a98c9', '#2d6c96', '#fffbd0'],
  ['#ffc27a', '#ffe9cf', '#e08a4a', '#a85a24', '#fff1b8'],
  ['#ff9f80', '#ffe0d3', '#d0664c', '#8f3b2a', '#ffe7a8'],
  ['#c3b1e1', '#f0eafa', '#9680be', '#6a5590', '#fff3c4'],
  ['#f0a35e', '#fbe3c8', '#c06c2c', '#823f12', '#ffe2a0'],
  ['#a0a8b8', '#e6e9ef', '#7d869a', '#525b70', '#f4f4f4'],
  ['#8fb8e0', '#e9f2fb', '#6c91b8', '#3d5f87', '#ffffff']
]

export function heroSvg(m: number): string {
  const p = PALETTE[m]
  return `<svg viewBox="0 0 600 190" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs>
  <rect width="600" height="190" fill="url(#sky)"/>
  <circle cx="470" cy="62" r="30" fill="${p[4]}" opacity=".95"/>
  <polygon points="0,190 0,120 90,60 170,125 250,70 350,140 430,90 520,135 600,100 600,190" fill="${p[2]}"/>
  <polygon points="0,190 0,150 110,105 200,155 310,115 420,165 520,125 600,160 600,190" fill="${p[3]}"/>
  <g transform="translate(60,128)" fill="#fff" opacity=".9">
    <rect x="0" y="8" width="8" height="24" rx="2"/><rect x="10" y="3" width="8" height="34" rx="2"/>
    <rect x="18" y="17" width="44" height="6" rx="2"/>
    <rect x="62" y="3" width="8" height="34" rx="2"/><rect x="72" y="8" width="8" height="24" rx="2"/>
  </g></svg>`
}

export function monthAccent(m: number): { primary: string; soft: string; glow: string } {
  const p = PALETTE[m]
  return { primary: p[3], soft: p[0], glow: p[1] }
}
