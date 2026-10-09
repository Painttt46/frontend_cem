import { ref } from 'vue'
import axios from '@/utils/axiosConfig'

// ===== ระบบสิทธิ์ฝั่งหน้าเว็บ =====
// - admin / superadmin มีสิทธิ์ทุกอย่างเสมอ (ไม่ต้องมีแถวใน role_permissions) — ตรงกับฝั่ง backend (utils/permissions.js)
// - role อื่นตามที่ตั้งในหน้า "จัดการสิทธิ์" (/management/settings/role-permissions): ไม่มีแถว = ไม่มีสิทธิ์
// - คีย์มี 2 แบบ: path ของหน้า (/management/users) และ "ความสามารถ" (path#ชื่อ เช่น /projects#delete)
const FULL_ACCESS_ROLES = ['admin', 'superadmin']
export const isFullAccessRole = (role) => FULL_ACCESS_ROLES.includes(String(role ?? '').trim().toLowerCase())

// หน้าทั้งหมดในส่วน "จัดการระบบ" — มีสิทธิ์หน้าใดหน้าหนึ่งก็เห็นเมนู "จัดการระบบ" และเข้าหน้ารวม /management ได้
// (หน้ารวมเป็นแค่การ์ดลิงก์ที่กรองตามสิทธิ์ของแต่ละหน้าอีกชั้น ไม่ได้เปิดข้อมูลเพิ่ม และ backend ไม่มี API ที่ใช้คีย์ /management)
// เดิมต้องติ๊ก /management ด้วย — ถ้าติ๊กแค่หน้าย่อย (เช่น /management/leave) ผู้ใช้เข้าหน้านั้นได้แต่ไม่มีเมนูให้กดไปถึง
export const MANAGEMENT_SECTION_KEYS = [
  '/management/dashboard', '/management/users', '/management/leave',
  '/management/tasks', '/management/projects', '/management/daily-work',
  '/management/settings', '/management/settings/role-permissions',
  '/management/settings/leave-approval', '/management/settings/role-work-hours',
  '/management#audit-logs'
]

const PERMISSIONS_MAX_AGE_MS = 60 * 1000 // ผู้ดูแลแก้สิทธิ์แล้วผู้ใช้ที่เปิดแอปค้างอยู่จะได้ค่าใหม่ภายในประมาณ 1 นาที (ไม่ต้อง login ใหม่)

const permissions = ref([])
const permissionsLoaded = ref(false)
// เป็น ref เพื่อให้เมนู/การ์ดที่เรียก hasAccess() คำนวณใหม่เมื่อโหลดสิทธิ์ของ role ใหม่เสร็จ
// (ถ้าเป็นตัวแปรธรรมดา: ระหว่างที่ role ยังไม่ตรง hasAccess คืน false โดยไม่ได้อ่าน permissions — Vue จึงไม่รู้ว่าต้องวาดเมนูใหม่เมื่อโหลดเสร็จ)
const loadedRole = ref(null)
let loadedAt = 0
let inflight = null

export function usePermissions() {
  const loadPermissions = async () => {
    try {
      if (!localStorage.getItem('soc_role')) return false

      // ถามสิทธิ์ของ "ผู้ใช้ที่ล็อกอินอยู่" ตาม role จริงในฐานข้อมูล — ไม่ใช้ role ที่ค้างใน localStorage (ถ้าผู้ดูแลเปลี่ยน role ให้ระหว่างที่เปิดระบบค้างไว้
      // คำขอแบบระบุชื่อ role จะถูกปฏิเสธและเมนูหายทั้งหมดจนกว่าจะ login ใหม่)
      const response = await axios.get('/api/role-permissions/me', { silent: true })
      const role = response.data.role || localStorage.getItem('soc_role')

      if (role && role !== localStorage.getItem('soc_role')) localStorage.setItem('soc_role', role)

      permissions.value = response.data.permissions || []
      permissionsLoaded.value = true
      loadedRole.value = role
      loadedAt = Date.now()
      return true
    } catch {
      // โหลดไม่สำเร็จ (เครือข่ายสะดุด / backend รีสตาร์ท / ถูกจำกัดจำนวนคำขอ): ถ้าเคยโหลดสำเร็จมาแล้ว "คงสิทธิ์ล่าสุดไว้" แล้วลองใหม่ตอนเปลี่ยนหน้าครั้งถัดไป
      // — เดิมล้างสิทธิ์ทิ้ง ทำให้เมนู/ปุ่มที่ต้องมีสิทธิ์ (เช่น "อนุมัติการลา") หายไปทั้งหมดชั่วคราวเพราะคำขอพลาดครั้งเดียว
      return permissionsLoaded.value && loadedRole.value === localStorage.getItem('soc_role')
    }
  }

  // โหลดสิทธิ์ใหม่ถ้ายังไม่เคยโหลด / เปลี่ยน role (login ใหม่ในแท็บเดิม) / ข้อมูลเก่าเกินกำหนด — เรียกซ้อนกันได้ (ใช้คำขอเดียวร่วมกัน)
  const ensureFreshPermissions = async (maxAgeMs = PERMISSIONS_MAX_AGE_MS) => {
    const role = localStorage.getItem('soc_role')
    if (!role) return false
    const fresh = permissionsLoaded.value && loadedRole.value === role && (Date.now() - loadedAt) < maxAgeMs
    if (fresh) return true
    if (!inflight) inflight = loadPermissions().finally(() => { inflight = null })
    return inflight
  }

  const hasAccess = (path) => {
    const role = localStorage.getItem('soc_role')

    // admin / superadmin มีสิทธิ์ทุกอย่าง
    if (isFullAccessRole(role)) return true

    // ยังโหลดไม่เสร็จ หรือเป็นสิทธิ์ของ role เดิม (เพิ่งเปลี่ยนผู้ใช้) → ยังไม่ให้
    if (!permissionsLoaded.value || loadedRole.value !== role) return false

    // ไม่มีแถว = ไม่มีสิทธิ์
    const permission = permissions.value.find(p => p.page_path === path)
    return permission ? permission.has_access === true : false
  }

  // มีสิทธิ์หน้าใดก็ได้ในส่วน "จัดการระบบ" (รวมตัวหน้ารวม /management เอง)
  const hasManagementAccess = () => hasAccess('/management') || MANAGEMENT_SECTION_KEYS.some(key => hasAccess(key))

  const canAccessRoute = (path) => {
    // หน้ารวม /management: เข้าได้ถ้ามีสิทธิ์หน้าใดหน้าหนึ่งในส่วนนี้ (การ์ดในหน้ารวมกรองตามสิทธิ์ของแต่ละหน้าอยู่แล้ว)
    if (path === '/management') return hasManagementAccess()
    return hasAccess(path)
  }

  const getFirstAccessibleRoute = () => {
    const role = localStorage.getItem('soc_role')
    if (isFullAccessRole(role)) return '/daily_work'
    const menuOrder = ['/daily_work', '/car_booking', '/leave_work', '/projects', '/management']
    for (const path of menuOrder) {
      if (canAccessRoute(path)) return path
    }
    return '/profile'
  }

  return {
    permissions,
    permissionsLoaded,
    loadPermissions,
    ensureFreshPermissions,
    hasAccess,
    canAccessRoute,
    hasManagementAccess,
    getFirstAccessibleRoute,
    isFullAccess: () => isFullAccessRole(localStorage.getItem('soc_role'))
  }
}
