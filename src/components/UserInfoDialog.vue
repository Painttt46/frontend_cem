<template>
  <Dialog :visible="visible" modal header="ข้อมูลผู้ใช้" :style="{ width: '90vw', maxWidth: '450px' }" position="center" :draggable="false" @update:visible="$emit('update:visible', $event)">
    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      <p>กำลังโหลดข้อมูล...</p>
    </div>

    <div v-else-if="user" class="user-info-content">
      <div class="user-header">
        <div class="user-avatar">
          <i class="pi pi-user"></i>
        </div>
        <div class="user-title">
          <h3>{{ user.firstname }} {{ user.lastname }}</h3>
          <Badge :value="getRoleLabel(user.role)" :severity="getRoleSeverity(user.role)" />
        </div>
      </div>

      <div class="user-details">
        <div class="detail-row">
          <span class="detail-label"><i class="pi pi-id-card"></i> รหัสพนักงาน</span>
          <span class="detail-value">{{ user.employee_id || '-' }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label"><i class="pi pi-envelope"></i> Email</span>
          <span class="detail-value">{{ user.email || '-' }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label"><i class="pi pi-phone"></i> เบอร์โทร</span>
          <span class="detail-value">{{ user.phone || '-' }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label"><i class="pi pi-briefcase"></i> ตำแหน่ง</span>
          <span class="detail-value">{{ user.position || '-' }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label"><i class="pi pi-building"></i> แผนก</span>
          <span class="detail-value">{{ user.department || '-' }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label"><i class="pi pi-circle-fill"></i> สถานะ</span>
          <Badge :value="user.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'" :severity="user.is_active ? 'success' : 'danger'" />
        </div>
      </div>
    </div>

    <div v-else class="error-state">
      <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: #f59e0b"></i>
      <p>ไม่พบข้อมูลผู้ใช้</p>
    </div>
  </Dialog>
</template>

<script>
import axios from '@/utils/axiosConfig'

export default {
  name: 'UserInfoDialog',
  props: {
    visible: Boolean,
    userName: String,
    userId: Number
  },
  emits: ['update:visible'],
  mounted() {
    if (this.visible && (this.userId || this.userName)) {
      this.loadUserInfo()
    }
  },
  data() {
    return {
      user: null,
      loading: false
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.loadUserInfo()
      }
    }
  },
  methods: {
    async loadUserInfo() {
      if (!this.userName && !this.userId) return

      this.loading = true
      this.user = null

      try {
        const response = await axios.get('/api/users')
        
        if (this.userId) {
          this.user = response.data.find(u => u.id === this.userId)
        } else {
          const fullName = this.userName.trim()
          this.user = response.data.find(u => {
            const userName = `${u.firstname} ${u.lastname}`.trim()
            return userName === fullName
          })
        }
      } catch {
        // ignore
      } finally {
        this.loading = false
      }
    },
    getRoleLabel(role) {
      const roles = {
        'admin': 'ผู้ดูแลระบบ',
        'manager': 'ผู้จัดการ',
        'hr': 'ฝ่ายบุคคล',
        'user': 'ผู้ใช้งาน'
      }
      return roles[role?.toLowerCase()] || role
    },
    getRoleSeverity(role) {
      const severities = {
        'admin': 'danger',
        'manager': 'warning',
        'hr': 'info',
        'user': 'success'
      }
      return severities[role?.toLowerCase()] || 'secondary'
    }
  }
}
</script>

<style scoped>
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  gap: 0.75rem;
  color: #6c757d;
}

.user-info-content {
  padding: 0.5rem 0;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.8rem;
}

.user-title h3 {
  margin: 0 0 0.4rem 0;
  font-size: 1.2rem;
  color: #2c3e50;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.detail-label i {
  color: #6c757d;
  font-size: 0.85rem;
}

.detail-value {
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .user-avatar {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }

  .user-title h3 {
    font-size: 1rem;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .detail-label,
  .detail-value {
    font-size: 0.85rem;
  }
}
</style>
