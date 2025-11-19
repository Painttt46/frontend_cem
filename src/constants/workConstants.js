import { isCompleted, isActive } from '@/utils/statusHelper'

/**
 * Work Status Constants
 */
export const WORK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DONE: 'done',
  CANCELLED: 'cancelled'
}

/**
 * Work Status Labels (Thai)
 */
export const WORK_STATUS_LABELS = {
  [WORK_STATUS.PENDING]: 'รอดำเนินการ',
  [WORK_STATUS.IN_PROGRESS]: 'กำลังดำเนินการ',
  [WORK_STATUS.COMPLETED]: 'เสร็จสิ้น',
  [WORK_STATUS.DONE]: 'เสร็จสิ้น',
  [WORK_STATUS.CANCELLED]: 'ยกเลิก'
}

/**
 * Work Status Colors
 */
export const WORK_STATUS_COLORS = {
  [WORK_STATUS.PENDING]: '#f59e0b',
  [WORK_STATUS.IN_PROGRESS]: '#3b82f6',
  [WORK_STATUS.COMPLETED]: '#10b981',
  [WORK_STATUS.DONE]: '#10b981',
  [WORK_STATUS.CANCELLED]: '#ef4444'
}

/**
 * Check if status is completed (using helper)
 */
export { isCompleted, isActive }

/**
 * Edit cutoff time (hours)
 */
export const EDIT_CUTOFF_HOUR = 8  // 08:00 น.

/**
 * Missing work check time
 */
export const MISSING_WORK_CHECK_TIME = {
  HOUR: 9,
  MINUTE: 30
}

/**
 * Leave Types
 */
export const LEAVE_TYPES = {
  SICK: 'sick',
  VACATION: 'vacation',
  PERSONAL: 'personal',
  MATERNITY: 'maternity',
  OTHER: 'other'
}

/**
 * Leave Type Labels (Thai)
 */
export const LEAVE_TYPE_LABELS = {
  [LEAVE_TYPES.SICK]: 'ลาป่วย',
  [LEAVE_TYPES.VACATION]: 'ลาพักร้อน',
  [LEAVE_TYPES.PERSONAL]: 'ลากิจ',
  [LEAVE_TYPES.MATERNITY]: 'ลาคลอด',
  [LEAVE_TYPES.OTHER]: 'อื่นๆ'
}

/**
 * Leave Status
 */
export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

/**
 * Leave Status Labels (Thai)
 */
export const LEAVE_STATUS_LABELS = {
  [LEAVE_STATUS.PENDING]: 'รออนุมัติ',
  [LEAVE_STATUS.APPROVED]: 'อนุมัติ',
  [LEAVE_STATUS.REJECTED]: 'ไม่อนุมัติ'
}
