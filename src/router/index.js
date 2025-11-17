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
const ManagementView = () => import('../views/ManagementView.vue')
const UserManagement = () => import('../views/management/UserManagement.vue')
const TaskManagement = () => import('../views/management/TaskManagement.vue')
const ProjectsView = () => import('../views/management/ProjectsView.vue')
const DailyWorkManagement = () => import('../views/management/DailyWorkManagement.vue')
const SystemSettings = () => import('../views/management/SystemSettings.vue')
const RolePermissions = () => import('../views/management/RolePermissions.vue')
const LeaveManagement = () => import('../views/management/LeaveManagement.vue')
const Dashboard = () => import('../views/management/Dashboard.vue')

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
    meta: { requiresAuth: true, title: 'ระบบเเจ้งใช้งานรถ - Gent-CEM' },
  },
  {
    path: '/leave_work',
    name: 'leave work',
    component: LeaveWork,
    meta: { requiresAuth: true, title: 'ระบบแจ้งลางาน - Gent-CEM' },
  },
  {
    path: '/daily_work',
    name: 'daily work',
    component: DailyWork,
    meta: { requiresAuth: true, title: 'ระบบลงงานรายวัน - Gent-CEM' },
  },
  {
    path: '/projects',
    name: 'projects-main',
    component: Projects,
    meta: { requiresAuth: true, title: 'โครงการ - Gent-CEM' },
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
    meta: { requiresAuth: true, title: 'จัดการผู้ใช้งาน - Gent-CEM' },
  },
  {
    path: '/management/tasks',
    name: 'task-management',
    component: TaskManagement,
    meta: { requiresAuth: true, title: 'จัดการงาน - Gent-CEM' },
  },
  {
    path: '/management/projects',
    name: 'management-projects',
    component: ProjectsView,
    meta: { requiresAuth: true, title: 'รายการงาน - Gent-CEM' },
  },
  {
    path: '/management/daily-work',
    name: 'daily-work-management',
    component: DailyWorkManagement,
    meta: { requiresAuth: true, title: 'งานรายวัน - Gent-CEM' },
  },
  {
    path: '/management/settings',
    name: 'system-settings',
    component: SystemSettings,
    meta: { requiresAuth: true, title: 'ตั้งค่าระบบ - Gent-CEM' },
  },
  {
    path: '/management/settings/role-permissions',
    name: 'role-permissions',
    component: RolePermissions,
    meta: { requiresAuth: true, title: 'จัดการสิทธิ์การเข้าถึง - Gent-CEM' },
  },
  {
    path: '/management/leave',
    name: 'leave-management',
    component: LeaveManagement,
    meta: { requiresAuth: true, title: 'จัดการการลางาน - Gent-CEM' },
  },
  {
    path: '/management/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, title: 'Dashboard - Gent-CEM' },
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

  if (to.meta.requiresAuth) {
    // ตรวจสอบว่ามี userId และ token
    if (!userId || !token) {
      // Clear all auth data
      localStorage.clear();
      sessionStorage.clear();
      next("/login");
      return;
    }

    // Check if token is expired (decode JWT without verification)
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        
        if (currentTime >= expirationTime) {
          // Token expired - clear all auth data
          localStorage.clear();
          sessionStorage.clear();
          document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
          });
          next("/login");
          return;
        }
      }
    } catch (e) {
      // Invalid token format - clear and redirect
      localStorage.clear();
      sessionStorage.clear();
      next("/login");
      return;
    }

    // Check permissions for protected routes (except profile and login)
    if (role && to.path !== '/profile' && to.path !== '/login' && to.path !== '/two-authentication') {
      const { loadPermissions, canAccessRoute, permissionsLoaded } = usePermissions();
      
      // Load permissions if not loaded yet
      if (!permissionsLoaded.value) {
        await loadPermissions();
      }

      // Check if user has access to this route
      if (!canAccessRoute(to.path)) {
        // Redirect back to previous page or home
        if (from.path && from.path !== to.path) {
          next(from.path);
        } else {
          next("/daily_work");
        }
        return;
      }
    }

    next();
  } else {
    next();
  }
});

export default router;