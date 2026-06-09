import { createRouter, createWebHistory } from 'vue-router'
import { usePermissions } from '@/composables/usePermissions'

// Lazy load components
const LoginPage = () => import('../views/LoginPage.vue')
const TwoFAAuthPage = () => import('../views/TwoFAAuthPage.vue')
const ProfileView = () => import('../views/profile/ProfileView.vue')
const CarBookingHome = () => import('../views/car_booking/car_booking.vue')
const LeaveWork = () => import('../views/leave_work/LeaveWork.vue')
const DailyWork = () => import('../views/daily_work/DailyWork.vue')
const Projects = () => import('../views/projects/Projects.vue')
const ProjectProgress = () => import('../views/ProjectProgress.vue')
const ManagementView = () => import('../views/ManagementView.vue')
const UserManagement = () => import('../views/management/UserManagement.vue')
const TaskManagement = () => import('../views/management/TaskManagement.vue')
const ProjectsView = () => import('../views/management/ProjectsView.vue')
const DailyWorkManagement = () => import('../views/management/DailyWorkManagement.vue')
const SystemSettings = () => import('../views/management/SystemSettings.vue')
const RolePermissions = () => import('../views/management/RolePermissions.vue')
const LeaveApprovalSettings = () => import('../views/management/LeaveApprovalSettings.vue')
const LeaveManagement = () => import('../views/management/LeaveManagement.vue')
const Dashboard = () => import('../views/management/Dashboard.vue')
const AnalyticsDashboard = () => import('../views/management/AnalyticsDashboard.vue')
const RoleWorkHours = () => import('../views/management/RoleWorkHours.vue')

const routes = [
  {
    path: '/',
    name: '',
    redirect: 'daily_work',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { title: 'ลงชื่อเข้าใช้ - Gent-CEM' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true, title: 'โปรไฟล์ - Gent-CEM' },
  },
  {
    path: '/two-authentication',
    name: 'two-authentication',
    component: TwoFAAuthPage,
    meta: { title: 'ยืนยันตัวตน 2 ขั้นตอน - Gent-CEM' },
  },
  {
    path: '/car_booking',
    name: 'car booking',
    component: CarBookingHome,
    meta: { requiresAuth: true, requiresPermission: '/car_booking', title: 'ระบบเเจ้งใช้งานรถ - Gent-CEM' },
  },
  {
    path: '/leave_work',
    name: 'leave work',
    component: LeaveWork,
    meta: { requiresAuth: true, requiresPermission: '/leave_work', title: 'ระบบแจ้งลางาน - Gent-CEM' },
  },
  {
    path: '/daily_work',
    name: 'daily work',
    component: DailyWork,
    meta: { requiresAuth: true, requiresPermission: '/daily_work', title: 'ระบบลงงานรายวัน - Gent-CEM' },
  },
  {
    path: '/projects',
    name: 'projects-main',
    component: Projects,
    meta: { requiresAuth: true, requiresPermission: '/projects', title: 'โครงการ - Gent-CEM' },
  },
  {
    path: '/project-progress',
    name: 'project-progress',
    component: ProjectProgress,
    meta: { requiresAuth: true, requiresPermission: '/project-progress', title: 'ขั้นตอนการดำเนินการโครงการ - Gent-CEM' },
  },
  {
    path: '/management',
    name: 'management',
    component: ManagementView,
    meta: { requiresAuth: true, title: 'ระบบจัดการ - Gent-CEM' },
  },
  {
    path: '/management/users',
    name: 'user-management',
    component: UserManagement,
    meta: { requiresAuth: true, requiresPermission: '/management/users', title: 'จัดการผู้ใช้งาน - Gent-CEM' },
  },
  {
    path: '/management/tasks',
    name: 'task-management',
    component: TaskManagement,
    meta: { requiresAuth: true, requiresPermission: '/management/tasks', title: 'จัดการงาน - Gent-CEM' },
  },
  {
    path: '/management/projects',
    name: 'management-projects',
    component: ProjectsView,
    meta: { requiresAuth: true, requiresPermission: '/management/projects', title: 'รายการงาน - Gent-CEM' },
  },
  {
    path: '/management/daily-work',
    name: 'daily-work-management',
    component: DailyWorkManagement,
    meta: { requiresAuth: true, requiresPermission: '/management/daily-work', title: 'งานรายวัน - Gent-CEM' },
  },
  {
    path: '/management/settings',
    name: 'system-settings',
    component: SystemSettings,
    meta: { requiresAuth: true, requiresPermission: '/management/settings', title: 'ตั้งค่าระบบ - Gent-CEM' },
  },
  {
    path: '/management/settings/role-permissions',
    name: 'role-permissions',
    component: RolePermissions,
    meta: { requiresAuth: true, requiresPermission: '/management/settings/role-permissions', title: 'จัดการสิทธิ์การเข้าถึง - Gent-CEM' },
  },
  {
    path: '/management/settings/leave-approval',
    name: 'leave-approval-settings',
    component: LeaveApprovalSettings,
    meta: { requiresAuth: true, requiresPermission: '/management/settings/leave-approval', title: 'ตั้งค่าผู้อนุมัติการลา - Gent-CEM' },
  },
  {
    path: '/management/settings/role-work-hours',
    name: 'role-work-hours',
    component: RoleWorkHours,
    meta: { requiresAuth: true, requiresPermission: '/management/settings/role-work-hours', title: 'ตั้งค่าเวลาทำงานตาม Role - Gent-CEM' },
  },
  {
    path: '/management/leave',
    name: 'leave-management',
    component: LeaveManagement,
    meta: { requiresAuth: true, requiresPermission: '/management/leave', title: 'จัดการการลางาน - Gent-CEM' },
  },
  {
    path: '/management/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, requiresPermission: '/management/dashboard', title: 'Dashboard - Gent-CEM' },
  },
  {
    path: '/management/analytics',
    name: 'analytics',
    component: AnalyticsDashboard,
    meta: { requiresAuth: true, requiresPermission: '/management/dashboard', title: 'Analytics - Gent-CEM' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: () => {
      // Redirect to home for any undefined routes
      return '/daily_work'
    }
  }
];

const router = createRouter({
  mode: 'history',
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// ✅ Route Guard ตรวจสอบการ Login และสิทธิ์การเข้าถึง
router.beforeEach(async (to, from, next) => {
  const userId = localStorage.getItem("soc_user_id");
  const role = localStorage.getItem("soc_role");
  const token = localStorage.getItem("soc_token");

  // ถ้าไปหน้า login แต่มี token อยู่แล้ว → redirect ไป daily_work
  if (to.path === '/login' && token && userId) {
    next("/daily_work");
    return;
  }

  if (to.meta.requiresAuth) {
    if (!userId || !token) {
      ['soc_token','soc_user_id','soc_role','soc_firstname','soc_lastname','soc_position','soc_department','soc_nickname','soc_email'].forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
      next("/login");
      return;
    }

    // Check if token is expired
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        if (Date.now() >= payload.exp * 1000) {
          ['soc_token','soc_user_id','soc_role','soc_firstname','soc_lastname','soc_position','soc_department','soc_nickname','soc_email'].forEach(k => localStorage.removeItem(k));
          sessionStorage.clear();
          next("/login");
          return;
        }
      }
    } catch (e) {
      ['soc_token','soc_user_id','soc_role','soc_firstname','soc_lastname','soc_position','soc_department','soc_nickname','soc_email'].forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
      next("/login");
      return;
    }

    // Skip permission check for basic pages (fix race condition after login)
    const skipPermissionCheck = ['/profile', '/login', '/two-authentication'];
    if (role && !skipPermissionCheck.includes(to.path) && to.meta.requiresPermission) {
      const { loadPermissions, canAccessRoute, permissionsLoaded } = usePermissions();

      if (!permissionsLoaded.value) {
        const loaded = await loadPermissions();
        // ถ้า load ไม่สำเร็จ ให้ผ่านไปก่อน (ไม่ block user)
        if (!loaded) {
          next();
          return;
        }
      }

      if (!canAccessRoute(to.meta.requiresPermission)) {
        // Redirect to first accessible route
        const accessibleRoutes = ['/leave_work', '/daily_work', '/car_booking', '/projects'];
        for (const route of accessibleRoutes) {
          if (canAccessRoute(route)) {
            next(route);
            return;
          }
        }
        // ไม่มี permission เลย → ไป /profile (ไม่ต้องการ permission) เพื่อป้องกัน redirect loop
        next("/profile");
        return;
      }
    }

    next();
  } else {
    next();
  }
});

export default router;