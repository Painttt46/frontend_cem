<template>
  <div class="workflow-status-settings">
    <Toast />
    
    <Card class="header-card">
      <template #header>
        <div class="main-header">
          <h1><i class="pi pi-cog"></i> ตั้งค่าสถานะ Workflow</h1>
        </div>
      </template>
    </Card>

    <Card class="content-card">
      <template #content>
        <div class="settings-section">
          <h3><i class="pi pi-palette"></i> สถานะตามเงื่อนไข</h3>
          <p class="section-desc">กำหนดสถานะที่จะแสดงตามเงื่อนไขต่างๆ ของ Workflow Step</p>
          
          <div class="status-list">
            <div v-for="(status, index) in workflowStatuses" :key="index" class="status-item">
              <div class="status-preview">
                <Badge :value="status.label" :style="{ backgroundColor: status.color, color: '#fff' }" />
              </div>
              <div class="status-config">
                <div class="config-row">
                  <label>ชื่อสถานะ:</label>
                  <InputText v-model="status.label" placeholder="ชื่อสถานะ" />
                </div>
                <div class="config-row">
                  <label>เงื่อนไข:</label>
                  <Dropdown v-model="status.condition" :options="conditionOptions" optionLabel="label" optionValue="value" placeholder="เลือกเงื่อนไข" />
                </div>
                <div class="config-row">
                  <label>สี:</label>
                  <ColorPicker v-model="status.color" />
                  <InputText v-model="status.color" class="color-input" />
                </div>
              </div>
              <Button icon="pi pi-trash" severity="danger" text rounded @click="removeStatus(index)" v-if="!status.isDefault" />
            </div>
          </div>

          <Button label="เพิ่มสถานะ" icon="pi pi-plus" @click="addStatus" class="mt-3" />
        </div>

        <Divider />

        <div class="actions">
          <Button label="บันทึก" icon="pi pi-save" @click="saveSettings" />
          <Button label="รีเซ็ตเป็นค่าเริ่มต้น" icon="pi pi-refresh" severity="secondary" @click="resetToDefault" />
        </div>
      </template>
    </Card>
  </div>
</template>

<script>
export default {
  name: 'WorkflowStatusSettings',
  data() {
    return {
      workflowStatuses: [],
      conditionOptions: [
        { label: 'ยังไม่มีพนักงานลงงาน', value: 'no_worker' },
        { label: 'มีพนักงานลงงานแล้ว', value: 'has_worker' },
        { label: 'เสร็จสิ้น', value: 'completed' },
        { label: 'ถึงวันเริ่มแล้วยังไม่มีคนลงงาน', value: 'start_date_passed' },
        { label: 'เกินวันสิ้นสุดแล้วยังไม่เสร็จ', value: 'overdue' }
      ],
      defaultStatuses: [
        { label: '-', condition: 'no_worker', color: '#9ca3af', isDefault: true },
        { label: 'กำลังดำเนินการ', condition: 'has_worker', color: '#3b82f6', isDefault: true },
        { label: 'เสร็จสิ้น', condition: 'completed', color: '#10b981', isDefault: true },
        { label: 'รอผู้รับผิดชอบ', condition: 'start_date_passed', color: '#f59e0b', isDefault: true },
        { label: 'เกินกำหนด', condition: 'overdue', color: '#ef4444', isDefault: true }
      ]
    }
  },
  mounted() {
    this.loadSettings()
  },
  methods: {
    loadSettings() {
      const saved = localStorage.getItem('workflowStatusSettings')
      if (saved) {
        this.workflowStatuses = JSON.parse(saved)
      } else {
        this.workflowStatuses = JSON.parse(JSON.stringify(this.defaultStatuses))
      }
    },
    saveSettings() {
      localStorage.setItem('workflowStatusSettings', JSON.stringify(this.workflowStatuses))
      this.$toast.add({
        severity: 'success',
        summary: 'บันทึกสำเร็จ',
        detail: 'บันทึกการตั้งค่าสถานะ Workflow เรียบร้อย',
        life: 3000
      })
    },
    addStatus() {
      this.workflowStatuses.push({
        label: 'สถานะใหม่',
        condition: 'no_worker',
        color: '#6b7280',
        isDefault: false
      })
    },
    removeStatus(index) {
      this.workflowStatuses.splice(index, 1)
    },
    resetToDefault() {
      this.workflowStatuses = JSON.parse(JSON.stringify(this.defaultStatuses))
      localStorage.removeItem('workflowStatusSettings')
      this.$toast.add({
        severity: 'info',
        summary: 'รีเซ็ตแล้ว',
        detail: 'รีเซ็ตเป็นค่าเริ่มต้นเรียบร้อย',
        life: 3000
      })
    }
  }
}
</script>

<style scoped>
.workflow-status-settings {
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.header-card {
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
  background: transparent;
}

.header-card :deep(.p-card-body) {
  padding: 0;
}

.main-header {
  padding: 2rem;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border-radius: 15px 15px 0 0;
}

.main-header h1 {
  margin: 0;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.content-card {
  border-radius: 12px;
}

.settings-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.section-desc {
  color: #64748b;
  margin-bottom: 1.5rem;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.status-preview {
  min-width: 120px;
}

.status-config {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.config-row label {
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}

.config-row .p-inputtext {
  width: 150px;
}

.config-row .p-dropdown {
  width: 220px;
}

.color-input {
  width: 80px !important;
  font-family: monospace;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .status-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .status-config {
    flex-direction: column;
  }
  
  .config-row .p-inputtext,
  .config-row .p-dropdown {
    width: 100%;
  }
}
</style>
