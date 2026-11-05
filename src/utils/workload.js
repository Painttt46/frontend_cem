import { parseLocalDate, toDateKey } from '@/utils/dateUtils'
import { getCurrentStatusStep, projectState } from '@/utils/projectStatus'

// งานที่แต่ละคนถืออยู่ — ใช้ร่วมกันระหว่าง Dashboard และ Analytics ให้นับตรงกัน

// role ที่ต้องลงงานทุกวันทำงาน (ตรงกับการแจ้งเตือน "ยังไม่ลงงาน" ใน Teams)
const REQUIRED_ROLES = ['engineer']
export const isRequiredToLog = (user) => REQUIRED_ROLES.includes(String(user?.role || '').trim().toLowerCase())

// สถานะของ step: completed | overdue (เลยวันสิ้นสุด) | working (ลงงานแล้ว หรือเป็น step ที่กำหนดสถานะปัจจุบันของโครงการ) | pending (ยังไม่เริ่ม)
export function stepWorkStatus(step, today = new Date(), isCurrentStatus = false) {
  if (step.status === 'completed') return 'completed'
  const todayKey = toDateKey(today)
  if (step.end_date && toDateKey(parseLocalDate(step.end_date)) < todayKey) return 'overdue'
  if (isCurrentStatus) return 'working'
  if (step.has_work_logged && step.latest_work_date && toDateKey(parseLocalDate(step.latest_work_date)) <= todayKey) return 'working'
  return 'pending'
}

const STATUS_ORDER = { working: 0, in_progress: 1, overdue: 2, pending: 3, completed: 4 }

// ผู้ใช้ → โครงการ → step ที่ได้รับมอบหมาย เฉพาะโครงการที่ยังดำเนินการอยู่ (เสร็จ/ยกเลิกแล้วไม่นับ)
// tasks ต้องแนบ steps มาแล้ว และตัดโครงการที่ step ของคนนั้นเสร็จหมดแล้วออก
export function buildWorkloadByUser(tasks, today = new Date()) {
  const raw = {}
  const totals = {}
  tasks.forEach(task => {
    if (projectState(task) !== 'active') return
    const steps = task.steps || []
    totals[task.id] = { total: steps.length, done: steps.filter(s => s.status === 'completed').length }
    const currentStep = getCurrentStatusStep(steps)
    steps.forEach((step, idx) => {
      (step.assigned_users || []).forEach(u => {
        const uid = typeof u === 'object' ? u?.id : u
        if (!uid) return
        if (!raw[uid]) raw[uid] = {}
        if (!raw[uid][task.id]) raw[uid][task.id] = { taskId: task.id, taskName: task.task_name, soNumber: task.so_number || null, steps: [] }
        raw[uid][task.id].steps.push({
          taskId: task.id,
          stepId: step.id,
          stepName: step.step_name,
          stepOrder: idx + 1,
          stepStatus: stepWorkStatus(step, today, step === currentStep),
          endDate: step.end_date || null,
          projectStatuses: step.project_statuses || []
        })
      })
    })
  })

  const result = {}
  Object.entries(raw).forEach(([uid, projects]) => {
    const list = Object.values(projects)
      .filter(proj => proj.steps.some(s => s.stepStatus !== 'completed'))
      .map(proj => {
        // เรียง steps: กำลังทำก่อน เสร็จแล้วไว้ท้าย
        proj.steps.sort((a, b) => (STATUS_ORDER[a.stepStatus] ?? 5) - (STATUS_ORDER[b.stepStatus] ?? 5))
        const { total, done } = totals[proj.taskId]
        return { ...proj, progress: total > 0 ? Math.round((done / total) * 100) : 0, totalSteps: total, completedSteps: done }
      })
      .sort((a, b) => (STATUS_ORDER[a.steps[0]?.stepStatus] ?? 5) - (STATUS_ORDER[b.steps[0]?.stepStatus] ?? 5))
    if (list.length) result[uid] = list
  })
  return result
}

// สรุปตัวเลข workload ของคนหนึ่งคน (นับเฉพาะ step ที่ยังไม่เสร็จ)
// dueSoon = ยังไม่เลยกำหนด และครบกำหนดภายใน 7 วันข้างหน้า
export function workloadSummary(projects = [], today = new Date()) {
  const todayKey = toDateKey(today)
  const limit = new Date(today)
  limit.setDate(limit.getDate() + 7)
  const limitKey = toDateKey(limit)
  const summary = { projects: projects.length, openSteps: 0, working: 0, overdue: 0, pending: 0, dueSoon: 0 }
  projects.forEach(proj => proj.steps.forEach(s => {
    if (s.stepStatus === 'completed') return
    summary.openSteps++
    if (s.stepStatus === 'overdue') summary.overdue++
    else if (s.stepStatus === 'working') summary.working++
    else summary.pending++
    if (s.stepStatus !== 'overdue' && s.endDate) {
      const key = toDateKey(parseLocalDate(s.endDate))
      if (key >= todayKey && key <= limitKey) summary.dueSoon++
    }
  }))
  return summary
}
