import { ref } from 'vue'
import axios from 'axios'

const permissions = ref([])
const permissionsLoaded = ref(false)

export function usePermissions() {
  const loadPermissions = async () => {
    try {
      const role = localStorage.getItem('soc_role')
      if (!role) return false

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
    const role = localStorage.getItem('soc_role')
    if (role === 'superadmin') return '/daily_work'
    
    const menuOrder = ['/daily_work', '/car_booking', '/leave_work', '/projects', '/management']
    for (const path of menuOrder) {
      const permission = permissions.value.find(p => p.page_path === path)
      if (permission?.has_access) return path
    }
    return '/profile'
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
