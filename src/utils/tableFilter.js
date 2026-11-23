// ตัวช่วยค้นหา / กรองขั้นสูงของตาราง (EnhancedDataTable)
// แยกเป็นไฟล์ JS ล้วน เพื่อทดสอบกับข้อมูลหลายรูปแบบได้โดยไม่ต้องเปิดหน้าเว็บ
//
// รูปแบบค่าที่ API ส่งมา:
//   วันที่ (คอลัมน์ DATE / TO_CHAR)   '2026-03-02'
//   วันเวลา (timestamp)               '2026-03-02T01:30:00.000Z'  ← เวลา UTC ต้องแปลงเป็นเวลาเครื่องก่อนเทียบ
//                                      (ถ้าตัดตัวอักษรตรง ๆ เวลาก่อน 07:00 จะกลายเป็นวันก่อนหน้า)
//   เวลา (คอลัมน์ TIME / ข้อความ)     '08:30:00' หรือ '08:30'
// ส่วนผู้ใช้กรอก: Date จากปฏิทิน, 02/03/2026, 2/3/69, 02/03/2569, 2 มี.ค. 2569, 2 มีนาคม 2026,
//   03/2026 (ทั้งเดือน), มี.ค. 2569 (ทั้งเดือน), 2569 (ทั้งปี), 08:30, 08.30 น., 02/03/2026 08:30
// ช่องของคอลัมน์เวลา/ระยะเวลาพิมพ์สั้นได้: 8, 0830, 2 ชั่วโมง, 30 นาที, 1:30

export const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
export const THAI_MONTHS_LONG = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

const pad2 = (n) => String(n).padStart(2, '0')
const ymd = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`
const isValidDay = (y, m, d) => {
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}
const lastDayOfMonth = (y, m) => new Date(y, m, 0).getDate()

// 0 ต้องเป็น "0" (ใช้ !text จะทำให้ 0 กลายเป็นค่าว่าง)
export const normalizeText = (text) => (text === null || text === undefined ? '' : String(text).toLowerCase().trim())

// มีค่าให้กรองไหม (Date จากปฏิทิน หรือข้อความที่ไม่ว่าง)
export const isFilledValue = (v) => (v instanceof Date ? !isNaN(v.getTime()) : normalizeText(v) !== '')

// ปี พ.ศ. / ค.ศ. (2 หรือ 4 หลัก) → ค.ศ.   69 → 2569 → 2026,  26 → 2026,  2569 → 2026
export const toCE = (yearText) => {
  const s = String(yearText)
  const y = Number(s)
  if (s.length <= 2) return y >= 43 ? 1957 + y : 2000 + y
  return y > 2400 ? y - 543 : y
}

const makeTime = (h, m) => {
  const hh = Number(h)
  const mm = Number(m)
  if (!(hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59)) return ''
  return `${pad2(hh)}:${pad2(mm)}`
}

// ===== ค่าในตาราง =====

const DATA_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?)?$/i

// ค่าวันที่ / วันเวลา → { date: 'yyyy-mm-dd', time: 'HH:MM' | '' } (ตามเวลาเครื่อง) — ไม่ใช่วันที่คืน null
export const parseDataDate = (value) => {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null
    return { date: ymd(value.getFullYear(), value.getMonth() + 1, value.getDate()), time: makeTime(value.getHours(), value.getMinutes()) }
  }
  if (typeof value !== 'string') return null
  const str = value.trim()
  const m = str.match(DATA_DATE_RE)
  if (!m) return null
  if (m[7]) {
    // มีโซนเวลา (Z, +07, +0700, +07:00) → แปลงเป็นเวลาเครื่อง
    let zone = m[7].toUpperCase()
    if (/^[+-]\d{2}$/.test(zone)) zone += ':00'
    else if (/^[+-]\d{4}$/.test(zone)) zone = `${zone.slice(0, 3)}:${zone.slice(3)}`
    const dt = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] || '00'}${zone}`)
    if (isNaN(dt.getTime())) return null
    return { date: ymd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate()), time: makeTime(dt.getHours(), dt.getMinutes()) }
  }
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!isValidDay(y, mo, d)) return null
  return { date: ymd(y, mo, d), time: m[4] ? makeTime(m[4], m[5]) : '' }
}

// ค่าเวลา '08:30' / '08:30:00' → '08:30' — ไม่ใช่เวลาคืน ''
export const parseDataTime = (value) => {
  if (typeof value !== 'string') return ''
  const m = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/)
  return m ? makeTime(m[1], m[2]) : ''
}

// ค่าในตาราง → { date, time } สำหรับเทียบแบบวันที่/เวลา หรือ null ถ้าเป็นข้อความทั่วไป
export const temporalOf = (value) => {
  const d = parseDataDate(value)
  if (d) return d
  const t = parseDataTime(value)
  return t ? { date: '', time: t } : null
}

// ข้อความวันที่หลายรูปแบบ (แบบที่หน้าจอแสดง) ไว้ให้ "มีคำว่า" / ช่องค้นหาทั่วไปเจอ
export const dateTexts = (info) => {
  if (!info) return []
  if (!info.date) return info.time ? [info.time] : []
  const [y, mo, d] = info.date.split('-').map(Number)
  const be = y + 543
  const texts = [
    info.date,
    `${pad2(d)}/${pad2(mo)}/${y}`, `${d}/${mo}/${y}`,
    `${pad2(d)}/${pad2(mo)}/${be}`, `${d}/${mo}/${be}`,
    `${d} ${THAI_MONTHS_SHORT[mo - 1]} ${be}`, `${d} ${THAI_MONTHS_LONG[mo - 1]} ${be}`,
    `${d} ${THAI_MONTHS_SHORT[mo - 1]} ${String(be).slice(2)}`,
    `${d} ${THAI_MONTHS_SHORT[mo - 1]} ${y}`, `${d} ${THAI_MONTHS_LONG[mo - 1]} ${y}`
  ]
  if (info.time) texts.push(info.time, ...texts.map(t => `${t} ${info.time}`))
  return texts
}

// ===== สิ่งที่ผู้ใช้กรอก =====

// ชื่อเดือนไทย: แบบย่อมีจุด/ไม่มีจุด และแบบเต็ม (ยาวก่อน เพื่อให้ regex จับคำที่ยาวที่สุด)
const MONTH_LOOKUP = []
THAI_MONTHS_SHORT.forEach((name, i) => {
  MONTH_LOOKUP.push([name, i + 1], [name.replace(/\./g, ''), i + 1])
  // ใส่จุดแค่ตัวกลาง เช่น "มี.ค"
  if (name.endsWith('.')) MONTH_LOOKUP.push([name.slice(0, -1), i + 1])
})
THAI_MONTHS_LONG.forEach((name, i) => MONTH_LOOKUP.push([name, i + 1]))
MONTH_LOOKUP.sort((a, b) => b[0].length - a[0].length)
const MONTH_ALT = MONTH_LOOKUP.map(([name]) => name.replace(/\./g, '\\.')).join('|')
const THAI_DATE_RE = new RegExp(`^(?:(\\d{1,2})\\s*)?(${MONTH_ALT})\\s*(\\d{4}|\\d{2})?$`)
const monthNumber = (name) => (MONTH_LOOKUP.find(([n]) => n === name) || [])[1]

const period = (y, m, d, time) => {
  if (!(m >= 1 && m <= 12) || !(y >= 1900 && y <= 2200)) return null
  if (d) {
    if (!isValidDay(y, m, d)) return null
    const iso = ymd(y, m, d)
    return { from: iso, to: iso, time }
  }
  return { from: ymd(y, m, 1), to: ymd(y, m, lastDayOfMonth(y, m)), time: '' }
}

// เวลาที่ผู้ใช้พิมพ์: 08:30, 8.30, 08:30 น.
export const parseQueryTime = (input) => {
  if (input === null || input === undefined || input instanceof Date) return ''
  const m = String(input).trim().replace(/\s*น\.?$/, '').match(/^(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?$/)
  return m ? makeTime(m[1], m[2]) : ''
}

// เวลาในช่องที่รู้อยู่แล้วว่าเป็นเวลา: รับแบบสั้นด้วย — 8 → 08:00, 830 / 0830 → 08:30
export const parseLooseTime = (input) => {
  const strict = parseQueryTime(input)
  if (strict) return strict
  if (input === null || input === undefined || input instanceof Date) return ''
  const s = String(input).trim().replace(/\s*น\.?$/, '')
  let m
  if ((m = s.match(/^(\d{1,2})$/))) return makeTime(m[1], 0)
  if ((m = s.match(/^(\d{1,2})(\d{2})$/))) return makeTime(m[1], m[2])
  return ''
}

// ระยะเวลาที่ผู้ใช้พิมพ์ → นาที (อ่านไม่ออกคืน NaN): 2 ชั่วโมง, 2 ชม. 30 นาที, 45 นาที, 1:30, 2.5 (= ชั่วโมง)
export const parseDuration = (input) => {
  if (input === null || input === undefined || input instanceof Date) return NaN
  const s = String(input).trim().toLowerCase()
  let m
  if ((m = s.match(/^(\d+):(\d{2})$/))) return Number(m[1]) * 60 + Number(m[2])
  if ((m = s.match(/^(\d+(?:\.\d+)?)$/))) return Math.round(Number(m[1]) * 60)
  m = s.match(/^(?:(\d+(?:\.\d+)?)\s*(?:ชั่วโมง|ชม\.?))?\s*(?:(\d+)\s*(?:นาที|น\.?))?$/)
  if (m && (m[1] || m[2])) return Math.round(Number(m[1] || 0) * 60) + Number(m[2] || 0)
  return NaN
}

// คำค้น → ช่วงวันที่ { from, to, time } (from/to = yyyy-mm-dd ทั้งสองฝั่งรวมอยู่ในช่วง)
//   วันเดียว from = to | ทั้งเดือน / ทั้งปี from–to | เวลาอย่างเดียว { from: '', to: '', time } | อ่านไม่ออกคืน null
export const parseQueryDate = (input, now = new Date()) => {
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return null
    // ปฏิทินเลือกได้แค่วัน — พิมพ์ปี พ.ศ. ลงช่องปฏิทินเอง (เช่น 02/03/2569) ก็แปลงให้
    // เผื่อได้ Date ปี 1943–1999 จากปี 2 หลัก (69 → 1969): ระบบไม่มีข้อมูลก่อนปี 2000 จึงถือเป็น พ.ศ. 25xx
    const y = input.getFullYear()
    return period(y >= 1943 && y <= 1999 ? toCE(y - 1900) : toCE(y), input.getMonth() + 1, input.getDate(), '')
  }
  if (input === null || input === undefined) return null
  let s = String(input).trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*น\.?$/, '')
  if (!s) return null

  const timeOnly = parseQueryTime(s)
  if (timeOnly) return { from: '', to: '', time: timeOnly }

  // เวลาต่อท้ายวันที่: "02/03/2026 08:30", "2 มี.ค. 2569 เวลา 8.30"
  let time = ''
  const tm = s.match(/^(.*\S)\s+(?:เวลา\s*)?(\d{1,2})[:.](\d{2})$/)
  if (tm) {
    time = makeTime(tm[2], tm[3])
    if (!time) return null
    s = tm[1].replace(/\s*เวลา$/, '')
  }

  let m
  // yyyy-mm-dd, yyyy/mm/dd, yyyy-mm (ทั้งเดือน)
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/))) return period(toCE(m[1]), Number(m[2]), m[3] ? Number(m[3]) : 0, time)
  // dd/mm/yyyy, d-m-yy, d.m.2569
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2})$/))) return period(toCE(m[3]), Number(m[2]), Number(m[1]), time)
  // mm/yyyy (ทั้งเดือน)
  if ((m = s.match(/^(\d{1,2})[-/](\d{4})$/))) return period(toCE(m[2]), Number(m[1]), 0, time)
  // dd/mm (ปีนี้)
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})$/))) return period(now.getFullYear(), Number(m[2]), Number(m[1]), time)
  // [วัน] ชื่อเดือนไทย [ปี] — ไม่ใส่ปีถือเป็นปีนี้
  if ((m = s.match(THAI_DATE_RE))) {
    const year = m[3] ? toCE(m[3]) : now.getFullYear()
    return period(year, monthNumber(m[2]), m[1] ? Number(m[1]) : 0, time)
  }
  // ปีอย่างเดียว (ทั้งปี) — ค.ศ. หรือ พ.ศ.
  if (!time && (m = s.match(/^(\d{4})$/))) {
    const y = toCE(m[1])
    if (y >= 1900 && y <= 2200) return { from: ymd(y, 1, 1), to: ymd(y, 12, 31), time: '' }
  }
  return null
}

// วันที่ที่พิมพ์เองในช่องปฏิทิน → Date (ค.ศ.) ใช้ตอนออกจากช่อง — ไม่ใช่วันเดียวหรืออ่านไม่ออกคืน null
// (ปฏิทิน PrimeVue อ่านได้แค่ dd/mm/yyyy: ปี พ.ศ. กลายเป็นปี 2569 จริง, ปี 2 หลักและ "20 พ.ย. 2569" ถูกทิ้งเงียบ ๆ)
export const typedDate = (text) => {
  const q = parseQueryDate(text)
  if (!q || !q.from || q.from !== q.to) return null
  const [y, m, d] = q.from.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// วันจากปฏิทิน + เวลาที่พิมพ์ (ไม่บังคับ) → คำค้นเดียว
export const joinDateTime = (date, timeText) => {
  const time = parseLooseTime(timeText)
  if (!time) return date
  if (!isFilledValue(date)) return time
  const q = parseQueryDate(date)
  return q && q.from && q.from === q.to ? `${q.from} ${time}` : date
}

// ===== เทียบ =====

// ค่าในตาราง + คำค้น → { key, from, to } ในหน่วยเดียวกัน (ข้อความเรียงได้ตามลำดับเวลา)
// ใช้ไม่ได้ (เช่น ค้นด้วยเวลาแต่คอลัมน์มีแต่วันที่) คืน null
const comparable = (data, q) => {
  if (!q.from) {
    if (!data.time) return null
    return { key: data.time, from: q.time, to: q.time }
  }
  if (!data.date) return null
  if (q.time && data.time) {
    const k = `${q.from} ${q.time}`
    return { key: `${data.date} ${data.time}`, from: k, to: k }
  }
  return { key: data.date, from: q.from, to: q.to }
}

const compareRange = (op, { key, from, to }) => {
  switch (op) {
    case 'equals':
    case 'contains': return key >= from && key <= to
    case 'notEquals': return key < from || key > to
    case 'greaterThan': return key > to
    case 'lessThan': return key < from
    case 'gte': return key >= from
    case 'lte': return key <= to
    default: return undefined
  }
}

// อ่านคำค้นตามชนิดข้อมูล: ช่องที่เป็นเวลาล้วนรับแบบสั้นได้ (8, 0830)
const readTemporal = (value, data) => {
  if (!isFilledValue(value)) return null
  if (!data.date) {
    const t = parseLooseTime(value)
    if (t) return { from: '', to: '', time: t }
  }
  return parseQueryDate(value)
}

const lowerKey = (q) => `${q.from} ${q.time || '00:00'}`
const upperKey = (q) => `${q.to} ${q.time || '23:59'}`

// เทียบแบบวันที่/เวลา — คืน undefined ถ้าคำค้นไม่ใช่วันที่/เวลา (ให้ไปเทียบแบบข้อความแทน)
const matchTemporal = (data, op, value, value2) => {
  if (op === 'between') {
    let qa = readTemporal(value, data)
    let qb = readTemporal(value2, data)
    if (!qa && !qb) return undefined
    if (qa && qb) {
      // เวลาข้ามเที่ยงคืน เช่น 22:00–06:00
      if (!qa.from && !qb.from && qa.time > qb.time) {
        return data.time ? data.time >= qa.time || data.time <= qb.time : false
      }
      // ใส่วันที่สลับต้น-ปลาย → สลับให้
      if (qa.from && qb.from && lowerKey(qa) > upperKey(qb)) [qa, qb] = [qb, qa]
    }
    const a = qa && comparable(data, qa)
    const b = qb && comparable(data, qb)
    if ((qa && !a) || (qb && !b)) return false
    return (!a || a.key >= a.from) && (!b || b.key <= b.to)
  }
  if (op === 'startsWith' || op === 'endsWith') return undefined
  const q = readTemporal(value, data)
  if (!q) return undefined
  const c = comparable(data, q)
  if (!c) return op === 'notEquals'
  return compareRange(op, c)
}

const toNumber = (text) => {
  const t = text.replace(/,/g, '')
  return t !== '' && !isNaN(Number(t)) ? Number(t) : NaN
}

// เทียบตัวเลขที่อ่านได้แล้วทั้งสองฝั่ง (ใช้กับตัวเลขและระยะเวลาเป็นนาที)
const compareNumber = (n, op, a, b) => {
  switch (op) {
    case 'equals': return n === a
    case 'notEquals': return n !== a
    case 'greaterThan': return n > a
    case 'lessThan': return n < a
    case 'gte': return n >= a
    case 'lte': return n <= a
    case 'between': {
      if (isNaN(n)) return false
      let lo = isNaN(a) ? -Infinity : a
      let hi = isNaN(b) ? Infinity : b
      if (lo > hi) [lo, hi] = [hi, lo]
      return n >= lo && n <= hi
    }
    default: return undefined
  }
}

const sameText = (field, q) => field === q || (!isNaN(toNumber(field)) && toNumber(field) === toNumber(q))
const leadingNumber = (text) => parseFloat(text.replace(/,/g, ''))

const matchText = (raw, op, value, value2) => {
  const field = normalizeText(raw)
  const q = normalizeText(value)
  switch (op) {
    case 'contains': return field.includes(q)
    case 'equals': return sameText(field, q)
    case 'notEquals': return !sameText(field, q)
    case 'startsWith': return field.startsWith(q)
    case 'endsWith': return field.endsWith(q)
    default: {
      const r = compareNumber(leadingNumber(field), op, leadingNumber(q), leadingNumber(normalizeText(value2)))
      return r === undefined ? true : r
    }
  }
}

// ค่า 1 ช่องตรงเงื่อนไขกรองขั้นสูงไหม — filter = { operator, value, value2, type }
//   type 'duration': ค่าในตารางเป็นจำนวนนาที คำค้นเป็น "2 ชั่วโมง" / "30 นาที" / "1:30"
export const matchesFilter = (raw, { operator, value, value2, type }) => {
  if (type === 'duration') {
    if (!isFilledValue(raw)) return operator === 'notEquals'
    return !!compareNumber(Number(raw), operator, parseDuration(value), parseDuration(value2))
  }
  const data = temporalOf(raw)
  if (data) {
    const r = matchTemporal(data, operator, value, value2)
    if (operator === 'contains') {
      if (r) return true
      const q = normalizeText(value)
      return normalizeText(raw).includes(q) || dateTexts(data).some(t => normalizeText(t).includes(q))
    }
    if (r !== undefined) return r
  }
  return matchText(raw, operator, value, value2)
}

const isOrderOp = (op) => ['greaterThan', 'lessThan', 'gte', 'lte', 'between'].includes(op)

// ค่าที่กรอกยังใช้กรองไม่ได้ (พิมพ์ไม่ครบ/ผิดรูปแบบ) → ข้อความบอกวิธีกรอก, ใช้ได้คืน ''
// (เดิมเอาไปเทียบแบบข้อความ ผลที่ได้จึงมั่ว เช่น พิมพ์เวลา "07:" แล้วได้แถวผิด)
export const filterProblem = ({ operator, value, value2, time, time2, type }) => {
  const filled = [value, value2].filter(isFilledValue)
  if (type === 'date' || type === 'datetime') {
    if (operator === 'contains') return ''
    if (filled.some(v => !parseQueryDate(v))) return 'เลือกวันที่จากปฏิทิน หรือพิมพ์ วว/ดด/ปปปป เช่น 20/11/2569'
    if ([time, time2].some(t => isFilledValue(t) && !parseLooseTime(t))) return 'ใส่เวลาเป็น ชั่วโมง:นาที เช่น 08:30'
  }
  if (type === 'time' && filled.some(v => !parseLooseTime(v))) return 'ใส่เวลาเป็น ชั่วโมง:นาที เช่น 08:30'
  if (type === 'duration' && filled.some(v => isNaN(parseDuration(v)))) return 'ใส่ระยะเวลา เช่น 2 ชั่วโมง, 30 นาที, 1:30'
  if (type === 'number' && isOrderOp(operator) && filled.some(v => isNaN(toNumber(normalizeText(v))))) return 'ใส่ตัวเลข เช่น 10 หรือ 2.5'
  return ''
}

// ช่องค้นหาทั่วไป: ค้นทุกค่าในแถว (รวมค่าซ้อนในอาร์เรย์/อ็อบเจ็กต์) — คืนฟังก์ชันทดสอบแถว
export const makeRowSearcher = (query) => {
  const q = normalizeText(query)
  const qDate = parseQueryDate(query)
  // คำค้นที่ไม่มีตัวเลขและไม่ใช่ชื่อเดือน ไม่มีทางตรงกับวันที่/เวลา — ข้ามการแปลงวันที่ (ตารางใหญ่พิมพ์แล้วไม่หน่วง)
  const mayBeDate = /\d/.test(q) || MONTH_LOOKUP.some(([name]) => name.includes(q) || q.includes(name))
  const seen = new Map() // วันที่/เวลาซ้ำกันมากในตาราง จำผลไว้
  const dateMatches = (v) => {
    const data = temporalOf(v)
    if (!data) return false
    if (dateTexts(data).some(t => normalizeText(t).includes(q))) return true
    if (!qDate) return false
    const c = comparable(data, qDate)
    return !!c && c.key >= c.from && c.key <= c.to
  }
  const test = (v, depth = 0) => {
    if (v === null || v === undefined || depth > 8) return false
    if (typeof v === 'string' || typeof v === 'number') {
      if (normalizeText(v).includes(q)) return true
      // ค่าวันที่/เวลายาวไม่เกิน ~35 ตัวอักษร (ข้อความยาวไม่ต้องลองแปลง)
      if (!mayBeDate || typeof v !== 'string' || v.length > 40) return false
      if (!seen.has(v)) seen.set(v, dateMatches(v))
      return seen.get(v)
    }
    if (v instanceof Date) return mayBeDate && dateMatches(v)
    if (Array.isArray(v)) return v.some(item => test(item, depth + 1))
    if (typeof v === 'object') return Object.values(v).some(item => test(item, depth + 1))
    return false
  }
  return (row) => test(row)
}

// ===== ชนิดคอลัมน์ (เลือกช่องกรอกและเงื่อนไขให้เหมาะ) =====

// ตัวเลขที่เอามาเทียบมาก/น้อยได้ — รหัส/เลข SO/เบอร์โทร (ขึ้นต้นด้วย 0 หรือยาวเกิน 6 หลัก) ถือเป็นข้อความ
const isPlainNumber = (v) => typeof v === 'number' || (typeof v === 'string' && /^-?(0|[1-9]\d{0,5})(\.\d+)?$/.test(v.trim()))

// 'date' | 'datetime' | 'time' | 'number' | 'text' — ไม่มีค่าให้ดูเลยคืน ''
export const detectColumnType = (values) => {
  const sample = values.filter(isFilledValue).slice(0, 50)
  if (!sample.length) return ''
  const share = (fn) => sample.filter(fn).length / sample.length
  if (share(v => parseDataDate(v)) >= 0.8) return sample.some(v => parseDataDate(v)?.time) ? 'datetime' : 'date'
  if (share(v => parseDataTime(v)) >= 0.8) return 'time'
  if (share(isPlainNumber) >= 0.8) return 'number'
  return 'text'
}

const DATE_OPERATORS = [
  { label: 'ตรงกับวันที่', value: 'equals' },
  { label: 'ไม่ใช่วันที่', value: 'notEquals' },
  { label: 'ตั้งแต่วันที่', value: 'gte' },
  { label: 'ถึงวันที่', value: 'lte' },
  { label: 'ระหว่างวันที่', value: 'between' },
  { label: 'ก่อนวันที่', value: 'lessThan' },
  { label: 'หลังวันที่', value: 'greaterThan' },
  { label: 'มีคำว่า (พิมพ์เอง เช่น พ.ย. 2569)', value: 'contains' }
]

export const OPERATORS = {
  text: [
    { label: 'มีคำว่า', value: 'contains' },
    { label: 'เท่ากับ', value: 'equals' },
    { label: 'ไม่เท่ากับ', value: 'notEquals' },
    { label: 'เริ่มต้นด้วย', value: 'startsWith' },
    { label: 'ลงท้ายด้วย', value: 'endsWith' },
    { label: 'มากกว่า', value: 'greaterThan' },
    { label: 'น้อยกว่า', value: 'lessThan' }
  ],
  number: [
    { label: 'เท่ากับ', value: 'equals' },
    { label: 'ไม่เท่ากับ', value: 'notEquals' },
    { label: 'มากกว่า', value: 'greaterThan' },
    { label: 'น้อยกว่า', value: 'lessThan' },
    { label: 'ตั้งแต่ (≥)', value: 'gte' },
    { label: 'ไม่เกิน (≤)', value: 'lte' },
    { label: 'ระหว่าง', value: 'between' },
    { label: 'มีคำว่า', value: 'contains' },
    { label: 'เริ่มต้นด้วย', value: 'startsWith' },
    { label: 'ลงท้ายด้วย', value: 'endsWith' }
  ],
  date: DATE_OPERATORS,
  datetime: DATE_OPERATORS,
  time: [
    { label: 'ตรงกับเวลา', value: 'equals' },
    { label: 'ตั้งแต่เวลา', value: 'gte' },
    { label: 'ถึงเวลา', value: 'lte' },
    { label: 'ระหว่างเวลา', value: 'between' },
    { label: 'ก่อนเวลา', value: 'lessThan' },
    { label: 'หลังเวลา', value: 'greaterThan' }
  ],
  duration: [
    { label: 'ตั้งแต่ (≥)', value: 'gte' },
    { label: 'ไม่เกิน (≤)', value: 'lte' },
    { label: 'ระหว่าง', value: 'between' },
    { label: 'มากกว่า', value: 'greaterThan' },
    { label: 'น้อยกว่า', value: 'lessThan' },
    { label: 'เท่ากับ', value: 'equals' }
  ]
}

export const DEFAULT_OPERATOR = { text: 'contains', number: 'equals', date: 'equals', datetime: 'equals', time: 'equals', duration: 'gte' }
