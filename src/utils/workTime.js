import { toDateKey, workHoursPerDay } from '@/utils/dateUtils'

// ===== ชั่วโมงทำงานจากรายการลงงาน =====
// สูตรเดียวกับ backend (routes/daily_work.js calcTotalHours) และฟอร์มลงงาน:
// ข้ามเที่ยงคืนได้ (เวลาจบ ≤ เวลาเริ่ม = วันถัดไป) และหักเฉพาะส่วนที่ทับพักเที่ยง 12:00–13:00
const LUNCH_START = 12 * 60
const LUNCH_END = 13 * 60

export const timeToMinutes = (t) => {
  const [h, m] = String(t || '').split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
}

const toInterval = (start, end) => {
  const s = timeToMinutes(start)
  let e = timeToMinutes(end)
  if (s === null || e === null) return null
  if (e <= s) e += 24 * 60
  return { s, e }
}

const netMinutes = ({ s, e }) => Math.max(0, (e - s) - Math.max(0, Math.min(e, LUNCH_END) - Math.max(s, LUNCH_START)))

// ชั่วโมงของรายการเดียว
export const recordHours = (start, end) => {
  const iv = toInterval(start, end)
  return iv ? netMinutes(iv) / 60 : 0
}

// ชั่วโมงรวมของรายการในวันเดียวกัน — ช่วงเวลาที่ทับกันนับครั้งเดียว
// shares: ชั่วโมงของแต่ละรายการตามเวลาจริงของรายการนั้น (ย่อส่วนลงเมื่อช่วงเวลาทับกัน ให้รวมกันได้เท่า total)
export function dayHours(records) {
  const items = records.map(r => ({ r, iv: toInterval(r.start_time, r.end_time) })).filter(x => x.iv)
  if (items.length === 0) return { total: 0, shares: new Map() }
  const sorted = items.map(x => ({ ...x.iv })).sort((a, b) => a.s - b.s)
  const merged = [sorted[0]]
  for (const iv of sorted.slice(1)) {
    const last = merged[merged.length - 1]
    if (iv.s <= last.e) last.e = Math.max(last.e, iv.e)
    else merged.push(iv)
  }
  const total = merged.reduce((sum, iv) => sum + netMinutes(iv), 0) / 60
  const raw = items.map(x => netMinutes(x.iv) / 60)
  const rawSum = raw.reduce((a, b) => a + b, 0)
  const factor = rawSum > total && rawSum > 0 ? total / rawSum : 1
  return { total, shares: new Map(items.map((x, i) => [x.r, raw[i] * factor])) }
}

// ===== วันที่ควรลงงาน / ชั่วโมงที่ควรทำ =====
const atTime = (ymd, hhmm) => {
  const [y, mo, d] = ymd.split('-').map(Number)
  const min = timeToMinutes(hhmm) ?? 0
  return new Date(y, mo - 1, d, Math.floor(min / 60), min % 60)
}

// ชั่วโมงลา (ใบลาที่อนุมัติแล้ว) ที่ทับเวลาทำงานของวันนั้น ไม่นับช่วงพักเที่ยง
export function leaveHoursOnDay(leaves, ymd, workHours) {
  const dayStart = atTime(ymd, workHours.start_time)
  const dayEnd = atTime(ymd, workHours.end_time)
  const lunchStart = atTime(ymd, workHours.lunch_start)
  const lunchEnd = atTime(ymd, workHours.lunch_end)
  const overlap = (a1, a2, b1, b2) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1))
  let ms = 0
  for (const l of leaves) {
    const s = new Date(l.start_datetime).getTime()
    const e = new Date(l.end_datetime).getTime()
    if (!Number.isFinite(s) || !Number.isFinite(e)) continue
    const inDay = overlap(s, e, dayStart.getTime(), dayEnd.getTime())
    if (inDay <= 0) continue
    const lo = Math.max(s, dayStart.getTime())
    const hi = Math.min(e, dayEnd.getTime())
    ms += inDay - overlap(lo, hi, lunchStart.getTime(), lunchEnd.getTime())
  }
  return ms / 3600000
}

// วันที่ควรลงงานในช่วง from–to ('YYYY-MM-DD') ของผู้ใช้หนึ่งคน
// - วันทำงาน = จันทร์–ศุกร์ ที่ไม่ใช่วันหยุด นับตั้งแต่วันเริ่มงาน (joinDate)
// - นับถึงเมื่อวาน — วันนี้นับเมื่อลงงานแล้ว (ยังไม่ถือว่าขาดจนกว่าจะหมดวัน)
// - ลาทั้งวัน = ไม่ต้องลงงาน / ลาบางส่วน = ยังต้องลงงาน แต่ชั่วโมงที่ควรทำลดลงตามชั่วโมงลา
export function attendance({ from, to, today, joinDate, holidays, loggedDays, leaves, workHours }) {
  const perDay = workHoursPerDay(workHours)
  const startKey = joinDate && joinDate > from ? joinDate : from
  const endKey = to < today ? to : today
  const result = { requiredDays: 0, loggedDays: 0, missingDays: 0, missingDates: [], expectedHours: 0 }
  if (startKey > endKey) return result

  const [y, m, d] = startKey.split('-').map(Number)
  for (const day = new Date(y, m - 1, d); ; day.setDate(day.getDate() + 1)) {
    const key = toDateKey(day)
    if (key > endKey) break
    const dow = day.getDay()
    if (dow === 0 || dow === 6 || holidays.has(key)) continue
    if (key === today && !loggedDays.has(key)) continue
    const leaveH = leaves.length ? leaveHoursOnDay(leaves, key, workHours) : 0
    if (leaveH >= perDay - 0.01) continue
    result.requiredDays++
    result.expectedHours += perDay - leaveH
    if (loggedDays.has(key)) result.loggedDays++
    else result.missingDates.push(key)
  }
  result.missingDays = result.missingDates.length
  return result
}
