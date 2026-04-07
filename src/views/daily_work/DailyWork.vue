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
        <div class="right-filters">
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
          <div class="proj-filter-row">
            <Dropdown v-model="filterTask" :options="taskOptions" optionLabel="label" optionValue="value"
              placeholder="🔍 กรองโครงการ" showClear filter filterPlaceholder="ค้นหา..." class="proj-dropdown">
              <template #value="{ value }">
                <div v-if="value" class="filter-val">
                  <span v-if="taskOptions.find(t=>t.value===value)?.so" class="filter-so-tag">{{ taskOptions.find(t=>t.value===value).so }}</span>
                  <span>{{ taskOptions.find(t=>t.value===value)?.name }}</span>
                </div>
                <span v-else>🔍 กรองโครงการ</span>
              </template>
              <template #option="{ option }">
                <div class="filter-opt">
                  <span v-if="option.so" class="filter-so-tag">{{ option.so }}</span>
                  <span>{{ option.name }}</span>
                </div>
              </template>
            </Dropdown>
            <Dropdown v-model="filterStep" :options="stepOptions" optionLabel="label" optionValue="value"
              placeholder="🔍 กรองขั้นตอน" showClear filter filterPlaceholder="ค้นหา..." class="step-dropdown" :disabled="!filterTask" />
          </div>
        </div>
      </div>
      <DailyWorkList ref="workList" :records="filteredRecords" @refresh-data="loadWorkRecords" @add-to-group="openAddToGroup" />
    </div>

    <!-- Work Form Dialog -->
    <Dialog v-model:visible="showWorkDialog" modal 
      class="work-dialog"
      :style="{ width: 'min(1400px, 95vw)', maxHeight: '95vh' }"
      :contentStyle="{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '85vh' }"
      :breakpoints="{ '960px': '90vw', '640px': '100vw' }"
      :draggable="false"
      :dismissableMask="false">
      <template #header>
        <div class="dialog-header-custom">
          <i class="pi pi-calendar-plus" style="font-size: 1.5rem; color: #3b82f6;"></i>
          <span class="dialog-title">ลงตารางงานรายวัน</span>
        </div>
      </template>
      <div style="flex: 1; overflow-y: auto; padding: 1.5rem;">
        <DailyWorkForm :key="dialogKey" ref="workForm" @submit-work="handleWorkSubmit" @close-form="showWorkDialog = false" />
      </div>
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
      dialogKey: 0,
      activeFilter: 'all',
      filterTask: null,
      filterStep: null
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
    taskOptions() {
      const map = {}
      this.workRecords.forEach(r => {
        if (r.task_id && r.task_name) map[r.task_id] = { name: r.task_name, so: r.so_number || '' }
      })
      return Object.entries(map).map(([v, d]) => ({
        value: v,
        label: d.so ? `[${d.so}] ${d.name}` : d.name,
        so: d.so,
        name: d.name
      }))
    },
    stepOptions() {
      if (!this.filterTask) return []
      const map = {}
      this.workRecords.filter(r => String(r.task_id) === String(this.filterTask)).forEach(r => {
        if (r.step_id && r.step_name) map[r.step_id] = r.step_name
      })
      return Object.entries(map).map(([v, l]) => ({ value: v, label: l }))
    },
    filteredRecords() {
      let records = this.workRecords
      if (this.activeFilter === 'today') records = records.filter(r => r.work_date && r.work_date.substring(0, 10) === this.todayStr)
      else if (this.activeFilter === 'future') records = records.filter(r => r.work_date && r.work_date.substring(0, 10) > this.todayStr)
      if (this.filterTask) records = records.filter(r => String(r.task_id) === String(this.filterTask))
      if (this.filterStep) records = records.filter(r => String(r.step_id) === String(this.filterStep))
      return records
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
  watch: {
    filterTask() { this.filterStep = null }
  },
  methods: {
    showWorkForm() {
      this.dialogKey++
      this.showWorkDialog = true
    },
    openAddToGroup(workDate) {
      this.showWorkDialog = true
      this.$nextTick(() => {
        if (this.$refs.workForm) {
          this.$refs.workForm.formData.workDate = new Date(workDate)
        }
      })
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
    this._clockInterval = setInterval(() => {
      this.currentTime = new Date()
    }, 1000)
    
    // Listen for work record updates
    window.addEventListener('workRecordUpdated', this.handleWorkRecordUpdate)
    window.addEventListener('taskUpdated', this.handleWorkRecordUpdate)
  },
  beforeUnmount() {
    clearInterval(this._clockInterval)
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

.right-filters {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.proj-filter-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
}

.proj-dropdown, .step-dropdown {
  min-width: 200px;
  border-radius: 10px;
}

.step-dropdown {
  min-width: 180px;
}

.filter-opt, .filter-val {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-so-tag {
  background: #3b82f6;
  color: #fff;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
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

  .right-filters {
    width: 100%;
    align-items: stretch;
  }

  .proj-filter-row {
    flex-direction: column;
  }

  .proj-dropdown, .step-dropdown {
    min-width: 0;
    width: 100% !important;
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

/* Dialog Header Custom */
.dialog-header-custom {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.dialog-title {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:deep(.work-dialog) {
  max-width: 95vw;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

:deep(.work-dialog .p-dialog-header) {
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
  border-bottom: 2px solid #bfdbfe;
  padding: 1.25rem 1.5rem;
  border-radius: 16px 16px 0 0;
}

:deep(.work-dialog .p-dialog-header-icon) {
  width: 2.5rem;
  height: 2.5rem;
  color: #3b82f6;
  transition: all 0.2s;
}

:deep(.work-dialog .p-dialog-header-icon:hover) {
  background: #dbeafe;
  color: #1d4ed8;
  transform: rotate(90deg);
}

@media (max-width: 768px) {
  :deep(.work-dialog) {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    top: 0 !important;
    left: 0 !important;
    border-radius: 0 !important;
    transform: none !important;
  }

  :deep(.work-dialog .p-dialog-header) {
    border-radius: 0;
    padding: 1rem;
  }

  :deep(.work-dialog .p-dialog-content) {
    height: calc(100dvh - 56px) !important;
    max-height: calc(100dvh - 56px) !important;
  }

  .dialog-header-custom {
    font-size: 1.1rem;
  }
}

</style>

<style>
/* global: fix dropdown/multiselect panel — PrimeVue teleports to body */
@media (max-width: 640px) {
  .p-dropdown-panel,
  .p-multiselect-panel {
    width: calc(100vw - 1rem) !important;
    max-width: calc(100vw - 1rem) !important;
    left: 0.5rem !important;
    max-height: 50vh !important;
    z-index: 9999 !important;
    box-sizing: border-box !important;
  }
  .p-dropdown-panel .p-dropdown-items-wrapper,
  .p-multiselect-panel .p-multiselect-items-wrapper {
    max-height: 44vh !important;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .p-dropdown-panel,
  .p-multiselect-panel {
    max-width: min(600px, 90vw) !important;
    z-index: 9999 !important;
  }
}

/* dropdown items responsive */
.p-dropdown-panel .p-dropdown-item,
.p-multiselect-panel .p-multiselect-item {
  white-space: normal !important;
  word-break: break-word !important;
  overflow-wrap: anywhere !important;
  max-width: 100% !important;
  overflow: hidden !important;
  border-bottom: 1px solid #f1f5f9 !important;
  padding: 0.6rem 0.75rem !important;
}

.p-dropdown-panel .p-dropdown-item:last-child,
.p-multiselect-panel .p-multiselect-item:last-child {
  border-bottom: none !important;
}

.p-dropdown-panel .p-dropdown-items,
.p-multiselect-panel .p-multiselect-items {
  overflow-x: hidden !important;
  padding: 0 !important;
}
</style>