<template>
  <div class="daily-work-container">
    <Toast />
    
    <Card class="header-card">
      <template #header>
        <div class="main-header">
          <h1><i class="pi pi-calendar"></i> ระบบลงตารางงาน</h1>
        </div>
      </template>
    </Card>

    <div class="main-content">
      <div class="tab-action-buttons">
        <Button @click="showWorkForm" class="work-btn" icon="pi pi-clock" raised>
          <span class="btn-text">ลงตารางงาน</span>
        </Button>
      </div>
      <DailyWorkList ref="workList" :records="workRecords" @refresh-data="loadWorkRecords" />
    </div>

    <!-- Work Form Dialog -->
    <Dialog v-model:visible="showWorkDialog" modal header="ลงตารางงาน" :style="{ width: '95vw', height: '90vh' }" :draggable="false">
      <DailyWorkForm ref="workForm" @submit-work="handleWorkSubmit" @close-form="showWorkDialog = false" />
    </Dialog>
  </div>
</template>

<script>
import DailyWorkForm from './DailyWorkForm.vue'
import DailyWorkList from './DailyWorkList.vue'
import axios from '@/utils/axiosConfig'

export default {
  name: 'DailyWork',
  components: {
    DailyWorkForm,
    DailyWorkList
  },
  data() {
    return {
      currentTime: new Date(),
      workRecords: [],
      loading: false,
      showWorkDialog: false,
      checkInterval: null,
      allCompleteNotificationSent: false
    }
  },
  computed: {
    currentDateTime() {
      return this.currentTime.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  },
  methods: {
    async checkMissingWorkNotification() {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      
      
      // ตรวจสอบว่าเป็นเวลา 9:30 น. หรือหลังจากนั้น
      if (currentHour > 9 || (currentHour === 9 && currentMinute >= 30)) {
        try {
          const response = await axios.post('/api/daily-work/check-missing', {}, { silent: true })
          
          // Update notification status based on backend response
          if (response.data.message.includes('Missing work')) {
            this.allCompleteNotificationSent = false
          } else if (response.data.message.includes('All complete') && !this.allCompleteNotificationSent) {
            this.allCompleteNotificationSent = true
            localStorage.setItem('allCompleteNotificationSent', 'true')
          }
        } catch { // ignore
          
        }
      }
    },

    initializeNotificationCheck() {
      // รีเซ็ต flag เมื่อเริ่มวันใหม่
      const today = new Date().toISOString().split('T')[0]
      const lastCheckDate = localStorage.getItem('lastWorkCheckDate')
      if (lastCheckDate !== today) {
        this.allCompleteNotificationSent = false
        localStorage.setItem('lastWorkCheckDate', today)
        localStorage.removeItem('allCompleteNotificationSent') // ลบ flag เก่า
      } else {
        this.allCompleteNotificationSent = localStorage.getItem('allCompleteNotificationSent') === 'true'
      }
      
      // ตรวจสอบทุก 1 นาที
      this.checkInterval = setInterval(() => {
        this.checkMissingWorkNotification()
      }, 1 * 60 * 1000) // 1 minute
      
      // ตรวจสอบทันทีเมื่อเริ่มต้น
      this.checkMissingWorkNotification()
    },

    showWorkForm() {
      this.showWorkDialog = true
    },

    async loadWorkRecords() {
      this.loading = true
      try {
        const response = await axios.get('/api/daily-work')
        this.workRecords = response.data
      } catch { // ignore
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถโหลดข้อมูลการลงงานได้',
          life: 3000
        })
      } finally {
        this.loading = false
      }
    },
    handleWorkSubmit() {
      // Refresh work list after submission
      this.loadWorkRecords()
      this.showWorkDialog = false
    },
    handleWorkRecordUpdate() {
      // Auto-refresh when work record is updated
      this.loadWorkRecords()
    }
  },
  created() {
    this.loadWorkRecords()
  },
  mounted() {
    setInterval(() => {
      this.currentTime = new Date()
    }, 1000)
    
    // Listen for work record updates
    window.addEventListener('workRecordUpdated', this.handleWorkRecordUpdate)
    window.addEventListener('taskUpdated', this.handleWorkRecordUpdate)
    
    // Initialize notification check
    this.initializeNotificationCheck()
  },
  beforeUnmount() {
    window.removeEventListener('workRecordUpdated', this.handleWorkRecordUpdate)
    window.removeEventListener('taskUpdated', this.handleWorkRecordUpdate)
    
    // Clear notification check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  },
}
</script>

<style scoped>
.header-card {
  margin-bottom: 1rem;
  background: transparent;
  box-shadow: none;
  border: none;
}

.header-card :deep(.p-card-body),
.header-card :deep(.p-card-content) {
  padding: 0;
  background: transparent;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border-radius: var(--radius-md);
}

.main-header h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-action-buttons {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.work-btn {
  background: #1e3a8a;
  border: none;
}

.btn-text {
  margin-left: 0.25rem;
}

.main-content {
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 1rem;
  border: 1px solid var(--border-color);
}

@media (max-width: 768px) {
  .main-header {
    padding: 0.75rem 1rem;
  }

  .main-header h1 {
    font-size: 1.1rem;
  }

  .tab-action-buttons {
    flex-direction: column;
  }

  .work-btn {
    width: 100%;
  }
}
</style>
