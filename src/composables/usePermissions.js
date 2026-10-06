import { ref } from 'vue'
import axios from '@/utils/axiosConfig'

// ===== ระบบสิทธิ์ฝั่งหน้าเว็บ =====
// - admin / superadmin มีสิทธิ์ทุกอย่างเสมอ (ไม่ต้องมีแถวใน role_permissions) — ตรงกับฝั่ง backend (utils/permissions.js)
// - role อื่นตามที่ตั้งในหน้า "จัดการสิทธิ์" (/management/settings/role-permissions): ไม่มีแถว = ไม่มีสิทธิ์
// - คีย์มี 2 แบบ: path ของหน้า (/management/users) และ "ความสามารถ" (path#ชื่อ เช่น /projects#delete)
const FULL_ACCESS_ROLES = ['admin', 'superadmin']
export const isFullAccessRole = (role) => FULL_ACCESS_ROLES.includes(String(role ?? '').trim().toLowerCase())

const PERMISSIONS_MAX_AGE_MS = 60 * 1000 // ผู้ดูแลแก้สิทธิ์แล้วผู้ใช้ที่เปิดแอปค้างอยู่จะได้ค่าใหม่ภายในประมาณ 1 นาที (ไม่ต้อง login ใหม่)

const permissions = ref([])
const permissionsLoaded = ref(false)
let loadedRole = null
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
      loadedRole = role
      loadedAt = Date.now()
      return true
    } catch {
      // โหลดไม่สำเร็จ (เครือข่ายสะดุด / backend รีสตาร์ท / ถูกจำกัดจำนวนคำขอ): ถ้าเคยโหลดสำเร็จมาแล้ว "คงสิทธิ์ล่าสุดไว้" แล้วลองใหม่ตอนเปลี่ยนหน้าครั้งถัดไป
      // — เดิมล้างสิทธิ์ทิ้ง ทำให้เมนู/ปุ่มที่ต้องมีสิทธิ์ (เช่น "อนุมัติการลา") หายไปทั้งหมดชั่วคราวเพราะคำขอพลาดครั้งเดียว
      return permissionsLoaded.value && loadedRole === localStorage.getItem('soc_role')
    }
  }

  // โหลดสิทธิ์ใหม่ถ้ายังไม่เคยโหลด / เปลี่ยน role (login ใหม่ในแท็บเดิม) / ข้อมูลเก่าเกินกำหนด — เรียกซ้อนกันได้ (ใช้คำขอเดียวร่วมกัน)
  const ensureFreshPermissions = async (maxAgeMs = PERMISSIONS_MAX_AGE_MS) => {
    const role = localStorage.getItem('soc_role')
    if (!role) return false
    const fresh = permissionsLoaded.value && loadedRole === role && (Date.now() - loadedAt) < maxAgeMs
    if (fresh) return true
    if (!inflight) inflight = loadPermissions().finally(() => { inflight = null })
    return inflight
  }

  const hasAccess = (path) => {
    const role = localStorage.getItem('soc_role')

    // admin / superadmin มีสิทธิ์ทุกอย่าง
    if (isFullAccessRole(role)) return true

    // ยังโหลดไม่เสร็จ หรือเป็นสิทธิ์ของ role เดิม (เพิ่งเปลี่ยนผู้ใช้) → ยังไม่ให้
    if (!permissionsLoaded.value || loadedRole !== role) return false

    // ไม่มีแถว = ไม่มีสิทธิ์
    const permission = permissions.value.find(p => p.page_path === path)
    return permission ? permission.has_access === true : false
  }

  const canAccessRoute = (path) => {
    return hasAccess(path)
  }

  const getFirstAccessibleRoute = () => {
    const role = localStorage.getItem('soc_role')
    if (isFullAccessRole(role)) return '/daily_work'
    const menuOrder = ['/daily_work', '/car_booking', '/leave_work', '/projects', '/management']
    for (const path of menuOrder) {
      if (hasAccess(path)) return path
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
    getFirstAccessibleRoute,
    isFullAccess: () => isFullAccessRole(localStorage.getItem('soc_role'))
  }
}
