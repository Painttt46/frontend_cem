import axios from '@/utils/axiosConfig'

// กติกาเวลาลงงาน (ตรวจจริงที่ backend: utils/entryWindow.js) — หน้าเว็บใช้จำกัดวันที่ที่เลือกได้และแจ้งเมื่อถูกปิดลงงาน
// GET .../entry-window → { today, minDate, phase: 'open' | 'locked' | 'future_only', exempt, message }

// 'YYYY-MM-DD' → Date เที่ยงคืนตามเวลาเครื่อง
export const ymdToDate = (ymd) => {
  if (!ymd) return null
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Date → 'YYYY-MM-DD' ตามเวลาเครื่อง
export const dateToYmd = (date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// โหลดสถานะ — โหลดไม่ได้คืน null (backend ยังตรวจตอนบันทึกอยู่ดี)
export async function fetchEntryWindow(url) {
  try {
    const res = await axios.get(url, { silent: true })
    return res.data
  } catch {
    return null
  }
}

// วันแรกที่เลือกได้ (Date) — null = ไม่จำกัด (admin/superadmin) / ยังโหลดไม่ได้ใช้วันนี้ของเครื่อง
export const entryMinDate = (win) => {
  if (win?.exempt) return null
  if (win?.minDate) return ymdToDate(win.minDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}
