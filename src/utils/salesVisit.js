// กิจกรรมเข้าพบลูกค้า (/sales-activity) — ใช้ร่วมกันระหว่างหน้ารายการ ภาพรวม และประวัติลูกค้า

// สถานะ "ดูจากวันที่": Sale ลงนัดแล้วจบ ไม่ได้กลับมาแก้สถานะ — มีแค่ "ยกเลิก" ที่เลือกเอง
// (ข้อมูลเก่าที่เป็น done / follow_up ก็แสดงตามวันที่เหมือนกัน)
export const VISIT_STATES = {
  upcoming: { label: 'นัดหมาย', icon: 'pi pi-clock' },
  visited: { label: 'เข้าพบแล้ว', icon: 'pi pi-check-circle' },
  cancelled: { label: 'ยกเลิก', icon: 'pi pi-times-circle' }
}

export const visitState = (visit, now = Date.now()) => {
  if (visit?.status === 'cancelled') return 'cancelled'
  const start = new Date(visit?.visit_date).getTime()
  return Number.isFinite(start) && start > now ? 'upcoming' : 'visited'
}

export const visitStateLabel = (visit, now) => VISIT_STATES[visitState(visit, now)].label

const timeOf = (visit) => new Date(visit?.visit_date).getTime() || 0

// นัดที่จะถึง (ใกล้ → ไกล) / ที่เหลือคือกิจกรรมที่ผ่านมาและที่ยกเลิก (ล่าสุด → เก่า)
export function splitVisits(visits, now = Date.now()) {
  const upcoming = []
  const past = []
  for (const v of visits) (visitState(v, now) === 'upcoming' ? upcoming : past).push(v)
  upcoming.sort((a, b) => timeOf(a) - timeOf(b))
  past.sort((a, b) => timeOf(b) - timeOf(a))
  return { upcoming, past }
}

export const VISIT_TYPE_LABELS = { on_site: 'On-site', online: 'Online Meeting', phone: 'Phone Call', survey: 'Site Survey', demo: 'POC/Demo' }
export const VISIT_TYPE_ICONS = { on_site: 'pi pi-map-marker', online: 'pi pi-video', phone: 'pi pi-phone', survey: 'pi pi-compass', demo: 'pi pi-desktop' }
export const visitTypeLabel = (t) => VISIT_TYPE_LABELS[t] || t || 'ไม่ระบุ'
export const visitTypeIcon = (t) => VISIT_TYPE_ICONS[t] || 'pi pi-calendar'

export const formatVisitDate = (d) => d
  ? new Date(d).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  : ''
export const formatVisitDay = (d) => d
  ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
  : ''

// ชื่อทีมที่ไปเข้าพบ (สูงสุด 3 คน เกินนั้น +N)
export function teamNames(visit) {
  const names = (visit?.internal_attendees || []).map(u => u?.name || u).filter(Boolean)
  if (!names.length) return ''
  return names.length <= 3 ? names.join(', ') : `${names.slice(0, 3).join(', ')} +${names.length - 3}`
}

// จำนวนวันเต็มตั้งแต่วันที่นั้นถึงวันนี้ (นับตามวันในปฏิทิน ไม่ใช่ 24 ชม.)
export function daysSince(d, now = new Date()) {
  if (!d) return null
  const a = new Date(d)
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((end - start) / 86400000)
}
