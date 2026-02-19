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
        <div class="filter-buttons">
          <button @click="setFilter('all')" :class="['filter-btn', { active: activeFilter === 'all' }]">
            <i class="pi pi-list"></i>
            <span>ทั้งหมด</span>
            <span class="filter-count">{{ workRecords.length }}</span>
          </button>
          <button @click="setFilter('today')" :class="['filter-btn', 'filter-today', { active: activeFilter === 'today' }]">
            <i class="pi pi-sun"></i>
            <span>วันนี้</span>
            <span class="filter-count">{{ todayCount }}</span>
          </button>
          <button @click="setFilter('future')" :class="['filter-btn', 'filter-future', { active: activeFilter === 'future' }]">
            <i class="pi pi-calendar-plus"></i>
            <span>งานล่วงหน้า</span>
            <span class="filter-count">{{ futureCount }}</span>
          </button>
        </div>
      </div>
      <DailyWorkList ref="workList" :records="filteredRecords" @refresh-data="loadWorkRecords" />
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
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

export default {
  name: 'DailyWork',
  components: {
    DailyWorkForm,
    DailyWorkList
  },
  setup() {
    return {
      $confirm: useConfirm(),
      $toast: useToast()
    }
  },
  provide() {
    return {
      $confirm: useConfirm(),
      $toast: useToast()
    }
  },
  data() {
    return {
      currentTime: new Date(),
      workRecords: [],
      loading: false,
      showWorkDialog: false,
      activeFilter: 'all'
    }
  },
  computed: {
    todayStr() {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    },
    todayCount() {
      return this.workRecords.filter(r => r.work_date && r.work_date.substring(0, 10) === this.todayStr).length
    },
    futureCount() {
      return this.workRecords.filter(r => r.work_date && r.work_date.substring(0, 10) > this.todayStr).length
    },
    filteredRecords() {
      if (this.activeFilter === 'today') {
        return this.workRecords.filter(r => r.work_date && r.work_date.substring(0, 10) === this.todayStr)
      }
      if (this.activeFilter === 'future') {
        return this.workRecords.filter(r => r.work_date && r.work_date.substring(0, 10) > this.todayStr)
      }
      return this.workRecords
    },
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
    },
    setFilter(filter) {
      this.activeFilter = filter
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
  },
  beforeUnmount() {
    window.removeEventListener('workRecordUpdated', this.handleWorkRecordUpdate)
    window.removeEventListener('taskUpdated', this.handleWorkRecordUpdate)
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
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.filter-buttons {
  display: flex;
  gap: 0;
  align-items: center;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  border: 1px solid #e2e8f0;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
}

.filter-btn {
  background: transparent;
  border: none;
  color: #64748b;
  padding: 0.5rem 1rem;
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.filter-btn:hover {
  background: #e2e8f0;
  color: #334155;
}

.filter-btn.active {
  background: white;
  color: #1e3a8a;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.filter-btn.filter-today.active {
  color: #059669;
}

.filter-btn.filter-future.active {
  color: #7c3aed;
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #64748b;
  border-radius: 20px;
  padding: 0.1rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  min-width: 22px;
  line-height: 1.4;
  transition: all 0.2s ease;
}

.filter-btn.active .filter-count {
  background: #dbeafe;
  color: #1e40af;
}

.filter-btn.filter-today.active .filter-count {
  background: #d1fae5;
  color: #065f46;
}

.filter-btn.filter-future.active .filter-count {
  background: #ede9fe;
  color: #5b21b6;
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
  border: none;
  background: transparent;
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
