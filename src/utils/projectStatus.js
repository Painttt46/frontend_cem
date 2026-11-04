import { isCompleted } from '@/utils/statusHelper'

// สถานะโครงการ — ใช้ร่วมกันระหว่างหน้า "โครงการ" (TaskList) และ Dashboard ให้นับตรงกัน

// สถานะปัจจุบันของโครงการ = step ที่ "มีความเคลื่อนไหวล่าสุด" ในบรรดา step ที่ตั้งสถานะโครงการไว้
//   ความเคลื่อนไหว = เวลาที่แก้/เลือกสถานะของ step นั้นล่าสุด (project_status_updated_at) หรือวันที่ลงงานล่าสุดของ step (ไม่เกินวันนี้)
//   เท่ากัน → step ที่อยู่ลำดับหลังกว่า
// steps ต้องมี project_statuses, project_status_updated_at, has_work_logged, latest_work_date (จาก /api/task-steps/all)
export function getCurrentStatusStep(steps) {
  if (!steps || steps.length === 0) return null
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const toTime = v => { const t = v ? new Date(v).getTime() : NaN; return Number.isFinite(t) ? t : 0 }

  const candidates = steps
    .filter(s => Array.isArray(s.project_statuses) && s.project_statuses.length > 0)
    .map(s => {
      const editedAt = toTime(s.project_status_updated_at)
      const workedAt = s.has_work_logged && toTime(s.latest_work_date) <= today.getTime() ? toTime(s.latest_work_date) : 0
      return { step: s, activity: Math.max(editedAt, workedAt) }
    })
    .filter(c => c.activity > 0)

  if (candidates.length === 0) return null
  candidates.sort((x, y) => (y.activity - x.activity) || ((y.step.step_order ?? 0) - (x.step.step_order ?? 0)))
  return candidates[0].step
}

const CANCELLED_STATUSES = ['cancelled', 'canceled', 'ยกเลิก']

// ภาพรวมของโครงการ: 'active' | 'completed' | 'cancelled'
// - สถานะโครงการเป็นเสร็จ (เช่น ERP แจ้ง Completed) หรือยกเลิก → ตามนั้น
// - มี workflow → เสร็จเมื่อทุก step เสร็จ
// - ไม่มี workflow และสถานะว่าง = ยังเปิดอยู่ใน ERP → นับเป็นกำลังดำเนินการ
export function projectState(task) {
  const status = String(task?.status || '').trim().toLowerCase()
  if (CANCELLED_STATUSES.includes(status)) return 'cancelled'
  if (isCompleted(status)) return 'completed'
  const steps = task?.steps || []
  if (steps.length > 0) return steps.every(s => s.status === 'completed') ? 'completed' : 'active'
  return 'active'
}
