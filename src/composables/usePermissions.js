import { ref } from 'vue'
import axios from 'axios'

const permissions = ref([])
const permissionsLoaded = ref(false)

export function usePermissions() {
  const loadPermissions = async () => {
    try {
      const role = localStorage.getItem('soc_role')
      if (!role) return false

      // ไม่ต้องส่ง Authorization header (ใช้ cookie อัตโนมัติ)
      const response = await axios.get(`/api/role-permissions/${role}`)

      permissions.value = response.data.permissions || []
      permissionsLoaded.value = true
      return true
    } catch {
      // ถ้า token หมดอายุ - axios interceptor จะ handle
      permissions.value = []
      permissionsLoaded.value = true
      return false
    }
  }

  const hasAccess = (path) => {
    const role = localStorage.getItem('soc_role')
    
    // Superadmin has access to everything
    if (role === 'superadmin') return true

    // Check if permissions are loaded
    if (!permissionsLoaded.value) return false

    // Find permission for this path
    const permission = permissions.value.find(p => p.page_path === path)
    return permission ? permission.has_access : false
  }

  const canAccessRoute = (path) => {
    return hasAccess(path)
  }

  const getFirstAccessibleRoute = () => {
    const accessible = permissions.value.find(p => p.has_access)
    return accessible ? accessible.page_path : '/profile'
  }

  return {
    permissions,
    permissionsLoaded,
    loadPermissions,
    hasAccess,
    canAccessRoute,
    getFirstAccessibleRoute
  }
}
