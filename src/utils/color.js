// ===== สีที่อ่านออก: ปรับสีพื้นของป้าย/แท็กให้ตัวหนังสือสีขาวบนสีนั้นอ่านง่าย =====
// สีของหมวดหมู่ / สถานะ / ประเภทการลาตั้งได้เองในระบบ (เช่น เหลือง #f59e0b, เขียว #10b981) — ตัวหนังสือขาวบนสีสว่างเหล่านี้มี contrast เพียง 2.1–2.8
// (เกณฑ์อ่านสบายคือ 4.5) จึงทำสีพื้นให้เข้มลงพอดีจนได้ตามเกณฑ์ โดยคงเฉดสีเดิมไว้ (ค่าที่เก็บในฐานข้อมูลไม่ถูกแก้)
const cache = new Map()

const toRgb = (color) => {
  if (typeof color !== 'string') return null
  const c = color.trim()
  let m = c.match(/^#([0-9a-f]{3})$/i)
  if (m) return m[1].split('').map(ch => parseInt(ch + ch, 16))
  m = c.match(/^#([0-9a-f]{6})$/i)
  if (m) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16))
  m = c.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i)
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])]
  return null
}

const luminance = ([r, g, b]) => {
  const f = (v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

export const contrastRatio = (a, b) => {
  const ra = toRgb(a)
  const rb = toRgb(b)
  if (!ra || !rb) return null
  const l1 = luminance(ra)
  const l2 = luminance(rb)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

// คืนสีพื้นที่เข้มลง (เฉดเดิม) จนตัวหนังสือ `fg` อ่านได้ตามเกณฑ์ — สีที่ผ่านอยู่แล้วหรืออ่านค่าไม่ได้ คืนค่าเดิม
export const accessibleBg = (color, fg = '#ffffff', minRatio = 4.5) => {
  const key = `${color}|${fg}|${minRatio}`
  if (cache.has(key)) return cache.get(key)
  const rgb = toRgb(color)
  let result = color
  if (rgb && contrastRatio(color, fg) < minRatio) {
    for (let k = 0.98; k > 0.2; k -= 0.02) {
      const dark = rgb.map(v => Math.round(v * k))
      const hex = '#' + dark.map(v => v.toString(16).padStart(2, '0')).join('')
      if (contrastRatio(hex, fg) >= minRatio) {
        result = hex
        break
      }
    }
  }
  cache.set(key, result)
  return result
}

// สีตัวหนังสือบนพื้น "สีเดียวกันแบบจาง" (ป้ายแบบ soft: พื้น = สี + โปร่งใส ~12%) — พื้นอ่อนลงบางส่วน ต้องเข้มกว่าปกติเล็กน้อยจึงอ่านได้ตามเกณฑ์
export const accessibleText = (color) => accessibleBg(color, '#ffffff', 6)
