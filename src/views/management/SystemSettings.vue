<template>
  <div class="settings-container">
    <Toast />
    
    <!-- Header -->
    <Card class="header-card mb-4">
      <template #content>
        <div class="header-content">
          <Button icon="pi pi-arrow-left" text rounded @click="$router.push('/management')" class="back-btn" />
          <div class="header-title">
            <i class="pi pi-cog"></i>
            <h1>ตั้งค่าระบบ</h1>
          </div>
        </div>
      </template>
    </Card>

    <!-- Settings Grid -->
    <div class="settings-grid">
      <!-- Role Permissions -->
      <Card class="setting-card" @click="navigateTo('role-permissions')">
        <template #content>
          <div class="card-content">
            <div class="card-header">
              <i class="pi pi-shield card-icon"></i>
              <Badge value="Active" severity="success" />
            </div>
            <h3>จัดการสิทธิ์การเข้าถึง</h3>
            <p>กำหนดสิทธิ์การเข้าถึงหน้าต่างๆ ตาม Role</p>
            <div class="card-footer">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Notifications -->
      <Card class="setting-card" @click="showComingSoon">
        <template #content>
          <div class="card-content">
            <div class="card-header">
              <i class="pi pi-bell card-icon"></i>
              <Badge value="Coming Soon" severity="warning" />
            </div>
            <h3>การแจ้งเตือน</h3>
            <p>ตั้งค่าการแจ้งเตือนผ่าน Email และ Line</p>
            <div class="card-footer">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- System Config -->
      <Card class="setting-card" @click="showComingSoon">
        <template #content>
          <div class="card-content">
            <div class="card-header">
              <i class="pi pi-sliders-h card-icon"></i>
              <Badge value="Coming Soon" severity="warning" />
            </div>
            <h3>ค่าคอนฟิกระบบ</h3>
            <p>ตั้งค่าทั่วไปของระบบและการเชื่อมต่อ</p>
            <div class="card-footer">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Backup Settings -->
      <Card class="setting-card" @click="showComingSoon">
        <template #content>
          <div class="card-content">
            <div class="card-header">
              <i class="pi pi-save card-icon"></i>
              <Badge value="Coming Soon" severity="warning" />
            </div>
            <h3>การสำรองข้อมูล</h3>
            <p>ตั้งค่าการสำรองข้อมูลอัตโนมัติ</p>
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
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const toast = useToast()

const navigateTo = (section) => {
  if (section === 'role-permissions') {
    router.push('/management/settings/role-permissions')
  }
}

const showComingSoon = () => {
  toast.add({
    severity: 'info',
    summary: 'กำลังพัฒนา',
    detail: 'ฟีเจอร์นี้อยู่ระหว่างการพัฒนา',
    life: 3000
  })
}
</script>

<style scoped>
.settings-container {
  padding: 1rem;
  padding-bottom: 0;
  max-width: 100%;
  margin: 0 auto;
  
  background: #e5e7eb;
  height: 100%;
  overflow: auto;
}

.header-card {
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border: none;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.back-btn {
  color: white !important;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title i {
  font-size: 1.5rem;
}

.header-title h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.setting-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  border-radius: 12px;
}

.setting-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  border-color: #4A90E2;
}

.card-content {
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-icon {
  font-size: 2.5rem;
  color: #4A90E2;
  transition: color 0.3s ease;
}

.setting-card:hover .card-icon {
  color: #D73527;
}

.card-content h3 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.card-content p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f8f9fa;
}

.card-footer i {
  color: #4A90E2;
  transition: transform 0.3s ease;
}

.setting-card:hover .card-footer i {
  transform: translateX(4px);
  color: #D73527;
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
