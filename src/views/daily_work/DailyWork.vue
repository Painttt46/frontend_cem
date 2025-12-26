<template>
  <div class="daily-work-container">
    <Toast />
    
    <div class="header-card">
      <div class="main-header">
        <h1><i class="pi pi-calendar"></i> ระบบลงตารางงาน</h1>
      </div>
    </div>

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
.daily-work-container {
  padding: 1rem;
  max-width: 100%;
  
  margin: 0 auto;
  
  background: #e5e7eb;
  height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: auto;
}

.tab-action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  margin-top: 0rem;
  justify-content: flex-start;
}

.work-btn {
  background: #1e3a8a !important;
  border: none !important;
  color: white !important;
  padding: 1rem 2rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 15px rgba(30, 58, 138, 0.4) !important;
  transition: all 0.3s ease !important;
  position: relative !important;
  overflow: hidden !important;
  min-width: 180px !important;
  font-size: 1rem !important;
}

.work-btn:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 8px 25px rgba(30, 58, 138, 0.6) !important;
}

.task-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  border: none !important;
  color: white !important;
  padding: 1rem 2rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4) !important;
  transition: all 0.3s ease !important;
  position: relative !important;
  overflow: hidden !important;
  min-width: 180px !important;
  font-size: 1rem !important;
}

.task-btn:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6) !important;
}

.btn-text {
  margin-left: 0.5rem;
  font-size: 1rem;
  letter-spacing: 0.5px;
}

.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  padding: 2rem;
}

.tab-navigation {
  border: none;
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.tab-content {
  padding: 1rem 2rem 1rem 2rem;
  min-height: 500px;
}

.tab-navigation :deep(.p-tabview-nav) {
  background: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  padding: 0 1rem;
}

.tab-navigation :deep(.p-tabview-nav-link) {
  background: transparent;
  border: none;
  color: #6c757d;
  font-weight: 500;
  padding: 1rem 1.5rem;
  margin: 0 0.25rem;
  border-radius: 8px 8px 0 0;
  transition: all 0.3s ease;
}

.tab-navigation :deep(.p-tabview-nav-link:hover) {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.tab-navigation :deep(.p-tabview-nav-link.p-highlight) {
  background: white;
  color: #667eea;
  border-bottom: 2px solid #667eea;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.tab-navigation :deep(.p-tabview-panels) {
  background: white;
  border: none;
  padding: 0;
}

.tab-navigation :deep(.p-tabview-panel) {
  background: white;
}

.tab-navigation :deep(.p-tabview-ink-bar) {
  display: none !important;
}

.header-card {
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-radius: 15px;
  overflow: hidden;
}

.header-card :deep(.p-card-body) {
  padding: 0;
  background: transparent;
}

.header-card :deep(.p-card-content) {
  padding: 0;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border-radius: 15px 15px 0 0;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  overflow: hidden;
  min-height: 80px;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.main-header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.main-header i {
  font-size: 1.5rem;
}

@media (max-width: 768px) {
  .daily-work-container {
    padding: 1rem;
  }

  .main-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 1.5rem;
  }

  .main-header h1 {
    font-size: 1.5rem;
  }

  .tab-content {
    padding: 1rem;
  }

  .tab-action-buttons {
    justify-content: center;
    flex-direction: column;
  }

  .work-btn, .task-btn {
    width: 100% !important;
    min-width: auto !important;
  }

  .tab-navigation :deep(.p-tabview-nav) {
    flex-wrap: wrap;
    padding: 0 0.5rem;
  }

  .tab-navigation :deep(.p-tabview-nav-link) {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    margin: 0.25rem;
  }
}

@media (max-width: 480px) {
  .daily-work-container {
    padding: 0.5rem;
  }

  .main-header {
    padding: 1rem;
  }

  .main-header h1 {
    font-size: 1.3rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tab-content {
    padding: 0.75rem;
  }

  .tab-action-buttons {
    gap: 0.75rem;
  }

  .tab-navigation :deep(.p-tabview-nav-link) {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
}
</style>
