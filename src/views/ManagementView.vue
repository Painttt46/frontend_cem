<template>
  <div class="management-container">
    <Toast />
    
    <!-- Header Card -->
    <Card class="header-card mb-4">
      <template #content>
        <div class="header-content">
          <div class="header-left">
            <div class="header-title">
              <i class="pi pi-cog header-icon"></i>
              <h1>ระบบจัดการ</h1>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Management Grid -->
    <div class="management-grid">
      <!-- Dashboard -->
      <Card v-if="hasAccess('/management/dashboard')" class="management-card" @click="navigateTo('dashboard')">
        <template #content>
          <div class="card-content">
            <div class="card-header">
              <i class="pi pi-chart-bar card-icon"></i>
              <Badge value="Active" severity="success" class="status-badge" />
            </div>
            <h3>Dashboard</h3>
            <p>รายงานสถิติและภาพรวมของระบบ</p>
            <div class="card-footer">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- User Management -->
      <Card v-if="hasAccess('/management/users')" class="management-card" @click="navigateTo('users')">
        <template #content>
          <div class="card-content">
            <div class="card-header">
              <i class="pi pi-users card-icon"></i>
              <Badge value="Active" severity="success" class="status-badge" />
            </div>
            <h3>จัดการผู้ใช้งาน</h3>
            <p>เพิ่ม แก้ไข ลบ ผู้ใช้งาน และกำหนดสิทธิ์</p>
            <div class="card-footer">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Leave Management -->
      <Card v-if="hasAccess('/management/leave')" class="management-card" @click="navigateTo('leave-management')">
        <template #content>
          <div class="card-content">
            <div class="card-header">
              <i class="pi pi-calendar-times card-icon"></i>
              <Badge value="Active" severity="success" class="status-badge" />
            </div>
            <h3>จัดการการลางาน</h3>
            <p>ตั้งค่าโควต้า อนุมัติการลา และรายงาน</p>
            <div class="card-footer">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Car Management -->
      <Card class="management-card" @click="navigateTo('car-management')">
        <template #content>
          <div class="card-content">
            <div class="card-header">
              <i class="pi pi-car card-icon"></i>
              <Badge value="Coming Soon" severity="warning" class="status-badge" />
            </div>
            <h3>จัดการรถยนต์</h3>
            <p>เพิ่มรถ กำหนดตารางใช้งาน และบำรุงรักษา</p>
            <div class="card-footer">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Task Management -->
      <Card v-if="hasAccess('/management/tasks')" class="management-card" @click="navigateTo('task-management')">
        <template #content>
          <div class="card-content">
            <div class="card-header">
              <i class="pi pi-briefcase card-icon"></i>
              <Badge value="Active" severity="success" class="status-badge" />
            </div>
            <h3>จัดการงาน</h3>
            <p>สร้างงาน มอบหมายงาน และติดตามผล</p>
            <div class="card-footer">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Department Management -->
      <Card class="management-card" @click="navigateTo('departments')">
        <template #content>
          <div class="card-content">
            <div class="card-header">
              <i class="pi pi-building card-icon"></i>
              <Badge value="Coming Soon" severity="warning" class="status-badge" />
            </div>
            <h3>จัดการแผนก</h3>
            <p>เพิ่ม แก้ไข แผนกและตำแหน่งงาน</p>
            <div class="card-footer">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- System Settings -->
      <Card v-if="hasAccess('/management/settings')" class="management-card" @click="navigateTo('settings')">
        <template #content>
          <div class="card-content">
            <div class="card-header">
              <i class="pi pi-cog card-icon"></i>
              <Badge value="Active" severity="success" class="status-badge" />
            </div>
            <h3>ตั้งค่าระบบ</h3>
            <p>การแจ้งเตือน การเชื่อมต่อ และการสำรองข้อมูล</p>
            <div class="card-footer">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Backup & Restore -->
      <Card class="management-card" @click="navigateTo('backup')">
        <template #content>
          <div class="card-content">
            <div class="card-header">
              <i class="pi pi-database card-icon"></i>
              <Badge value="Coming Soon" severity="warning" class="status-badge" />
            </div>
            <h3>สำรองข้อมูล</h3>
            <p>สำรองและกู้คืนข้อมูลระบบ</p>
            <div class="card-footer">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { usePermissions } from '@/composables/usePermissions'

const router = useRouter()
const toast = useToast()
const { loadPermissions, hasAccess } = usePermissions()

onMounted(() => {
  loadPermissions()
})

const navigateTo = (section) => {
  const pathMap = {
    'dashboard': '/management/dashboard',
    'users': '/management/users',
    'leave-management': '/management/leave',
    'task-management': '/management/tasks'
  }
  const targetPath = pathMap[section]
  
  if (targetPath && !hasAccess(targetPath)) {
    toast.add({
      severity: 'error',
      summary: 'ไม่มีสิทธิ์เข้าถึง',
      detail: 'คุณไม่มีสิทธิ์เข้าถึงส่วนจัดการนี้',
      life: 3000
    })
    return
  }

  // Navigate to management sections
  switch (section) {
    case 'dashboard':
      router.push('/management/dashboard')
      break
    case 'users':
      router.push('/management/users')
      break
    case 'leave-management':
      router.push('/management/leave')
      break
    case 'task-management':
      router.push('/management/tasks')
      break
    case 'settings':
      router.push('/management/settings')
      break
    case 'car-management':
    case 'departments':
    case 'reports':
    case 'backup':
      toast.add({
        severity: 'info',
        summary: 'กำลังพัฒนา',
        detail: 'หน้านี้อยู่ระหว่างการพัฒนา',
        life: 3000
      })
      break
    default:
      toast.add({
        severity: 'info',
        summary: 'กำลังพัฒนา',
        detail: 'ฟีเจอร์นี้อยู่ระหว่างการพัฒนา',
        life: 3000
      })
  }
}
</script>

<style scoped>
.management-container {
  padding: 1rem;
  background: var(--bg-color);
  min-height: 100%;
  overflow: auto;
}

.header-card {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
  box-shadow: var(--shadow-md);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  font-size: 1.5rem;
}

.header-title h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.header-stats {
  display: flex;
  align-items: center;
}

.system-count {
  font-size: 0.875rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Grid Layout */
.management-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.management-card {
  cursor: pointer;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  height: 100%;
}

.management-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.card-content {
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-icon {
  font-size: 2.5rem;
  color: var(--primary-color);
}

.status-badge {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
}

.card-content h3 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.card-content p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f8f9fa;
}

.card-footer i {
  color: var(--primary-color);
}

.management-card:hover .card-footer i {
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-left {
    flex-direction: column;
    gap: 0.5rem;
  }

  .management-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
