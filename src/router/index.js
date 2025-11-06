import { createRouter, createWebHistory } from 'vue-router'
import { usePermissions } from '@/composables/usePermissions'

import LoginPage from '../views/LoginPage.vue';
import TwoFAAuthPage from '../views/TwoFAAuthPage.vue';
import ProfileView from '../views/profile/ProfileView.vue';
import CarBookingHome from '../views/car_booking/car_booking.vue';
import LeaveWork from '../views/leave_work/LeaveWork.vue';
import DailyWork from '../views/daily_work/DailyWork.vue';
import Projects from '../views/projects/Projects.vue';
import ManagementView from '../views/ManagementView.vue';
import UserManagement from '../views/management/UserManagement.vue';
import TaskManagement from '../views/management/TaskManagement.vue';
import ProjectsView from '../views/management/ProjectsView.vue';
import DailyWorkManagement from '../views/management/DailyWorkManagement.vue';
import SystemSettings from '../views/management/SystemSettings.vue';
import RolePermissions from '../views/management/RolePermissions.vue';
import LeaveManagement from '../views/management/LeaveManagement.vue';

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
  const token = localStorage.getItem("soc_token");
  const userId = localStorage.getItem("soc_user_id");
  const role = localStorage.getItem("soc_role");

  if (to.meta.requiresAuth) {
    if (!token || !userId) {
      next("/login");
      return;
    }

    // Check permissions for protected routes (except profile, login, and settings)
    if (role && to.path !== '/profile' && to.path !== '/login' && to.path !== '/two-authentication' && to.path !== '/management/settings') {
      const { canAccessRoute, refreshPermissions } = usePermissions();
      
      // Always refresh permissions to get latest data
      await refreshPermissions();

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