<template>
  <div class="workflow-builder">
    <div class="workflow-header">
      <h3><i class="pi pi-sitemap"></i> Workflow Steps</h3>
      <Button icon="pi pi-plus" label="เพิ่ม Step" @click="addStep" size="small" />
    </div>

    <div class="workflow-timeline" v-if="steps.length > 0">
      <template v-for="(step, index) in steps" :key="step.id || index">
        <div class="workflow-step"
             draggable="true"
             @dragstart="onDragStart($event, index)"
             @dragover.prevent
             @dragenter="onDragEnter($event, index)"
             @dragleave="onDragLeave($event)"
             @drop="onDrop($event, index)"
             :class="{ 'drag-over': dragOverIndex === index }">
        
          <div class="step-card" :class="getStepClass(step)">
            <div class="step-header">
              <div class="drag-handle" v-tooltip="'ลากเพื่อเรียงลำดับ'">
                <i class="pi pi-bars"></i>
              </div>
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-status-badge" :class="getStepClass(step)">
                <i :class="getStatusIcon(step)"></i>
                {{ getStepStatusLabel(step) }}
              </div>
              <div class="step-actions">
                <Button v-if="showCompleteButton && step.status !== 'completed'" icon="pi pi-check" 
                        v-tooltip="'เสร็จสิ้น'" @click="completeStep(index)" 
                        text severity="success" size="small" />
                <Button icon="pi pi-pencil" @click="editStep(index)" text size="small" />
                <Button icon="pi pi-trash" @click="deleteStep(index)" text severity="danger" size="small" />
              </div>
            </div>

            <div class="step-content">
              <h4>{{ step.step_name || 'ไม่มีชื่อ' }}</h4>
              <p v-if="step.description" class="step-description">{{ step.description }}</p>
              
              <div class="step-info">
                <div class="info-item" v-if="step.project_statuses && step.project_statuses.length > 0">
                  <span v-for="ps in step.project_statuses" :key="ps" class="project-badge" 
                        :style="{ background: getStatusColor(ps) + '20', color: getStatusColor(ps) }">
                    <i class="pi pi-folder"></i> {{ getProjectStatusLabel(ps) }}
                  </span>
                </div>

                <div class="info-item" v-if="step.start_date || step.end_date">
                  <i class="pi pi-calendar"></i>
                  <span>{{ formatDateRange(step.start_date, step.end_date) }}</span>
                </div>
                
                <div class="info-item" v-if="step.assigned_users && step.assigned_users.length > 0">
                  <i class="pi pi-users"></i>
                  <div class="assigned-users">
                    <span v-for="(user, idx) in step.assigned_users" :key="idx" class="user-badge">
                      {{ typeof user === 'object' ? user.name : user }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-else class="empty-workflow">
      <i class="pi pi-sitemap"></i>
      <p>ยังไม่มี workflow steps</p>
      <Button icon="pi pi-plus" label="เพิ่ม Step แรก" @click="addStep" />
    </div>

    <!-- Step Dialog -->
    <Dialog v-model:visible="showStepDialog" :header="editingIndex !== null ? 'แก้ไข Step' : 'เพิ่ม Step'" 
            :style="{width: '95vw', maxWidth: '1200px'}" modal :draggable="false" position="center">
      <div class="step-form">
        <div class="field">
          <label>ชื่อ Step Workflow <span class="required">*</span></label>
          <InputText v-model="currentStep.step_name" placeholder="เช่น วางแผน, ออกแบบ, พัฒนา" />
        </div>

        <div class="field">
          <label>คำอธิบาย</label>
          <Textarea v-model="currentStep.description" rows="3" placeholder="รายละเอียดของ step นี้" />
        </div>

        <div class="field-group">
          <div class="field">
            <label>วันเริ่มต้น</label>
            <Calendar v-model="currentStep.start_date" dateFormat="yy-mm-dd" showIcon />
          </div>
          <div class="field">
            <label>วันสิ้นสุด</label>
            <Calendar v-model="currentStep.end_date" dateFormat="yy-mm-dd" showIcon />
          </div>
        </div>

        <div class="field">
          <label>ผู้รับผิดชอบ</label>
          <MultiSelect v-model="currentStep.assigned_users" :options="users" 
                       optionLabel="name" placeholder="เลือกผู้รับผิดชอบ" 
                       display="chip" filter filterPlaceholder="ค้นหาชื่อ...">
            <template #option="slotProps">
              <div class="user-option">
                <div class="user-name">{{ slotProps.option.name }}</div>
                <div class="user-info" v-if="slotProps.option.position || slotProps.option.department">
                  <span v-if="slotProps.option.position">{{ slotProps.option.position }}</span>
                  <span v-if="slotProps.option.position && slotProps.option.department"> | </span>
                  <span v-if="slotProps.option.department">{{ slotProps.option.department }}</span>
                </div>
              </div>
            </template>
          </MultiSelect>
        </div>

        <div class="field">
          <label>สถานะโครงการ</label>
          <MultiSelect v-model="currentStep.project_statuses" :options="projectStatusOptions" 
                    optionLabel="label" optionValue="value" 
                    placeholder="เลือกสถานะโครงการ" class="w-full" display="chip">
            <template #option="slotProps">
              <span class="project-badge" 
                    :style="{ background: slotProps.option.color + '20', color: slotProps.option.color }">
                {{ slotProps.option.label }}
              </span>
            </template>
          </MultiSelect>
        </div>
      </div>

      <template #footer>
        <Button label="ยกเลิก" @click="showStepDialog = false" text />
        <Button label="บันทึก" @click="saveStep" :disabled="!currentStep.step_name" />
      </template>
    </Dialog>
  </div>
</template>

<script>
import axios from '@/utils/axiosConfig'
import { useConfirm } from 'primevue/useconfirm'

export default {
  name: 'WorkflowBuilder',
  setup() {
    return {
      $confirm: useConfirm()
    }
  },
  props: {
    taskId: {
      type: Number,
      default: null
    },
    modelValue: {
      type: Array,
      default: () => []
    },
    projectStatus: {
      type: String,
      default: null
    },
    showCompleteButton: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      steps: [],
      users: [],
      projectStatusOptions: [],
      showStepDialog: false,
      editingIndex: null,
      dragIndex: null,
      dragOverIndex: null,
      currentStep: {
        step_name: '',
        description: '',
        start_date: null,
        end_date: null,
        assigned_users: [],
        step_order: 0
      }
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(val) {
        this.steps = val || []
      }
    },
    taskId: {
      immediate: true,
      handler(val) {
        if (val) {
          this.loadSteps()
        }
      }
    }
  },
  mounted() {
    this.loadUsers()
    this.loadStatusOptions()
  },
  methods: {
    async loadStatusOptions() {
      try {
        const response = await axios.get('/api/settings/statuses')
        this.projectStatusOptions = response.data
      } catch {
        // ignore
      }
    },
    getEmptyStep() {
      return {
        step_name: '',
        description: '',
        start_date: null,
        end_date: null,
        assigned_users: [],
        project_statuses: [],
        step_order: this.steps.length
      }
    },
    async loadUsers() {
      try {
        const response = await axios.get('/api/users')
        this.users = response.data.map(u => ({
          id: u.id,
          name: `${u.firstname} ${u.lastname}`,
          position: u.position || '',
          department: u.department || ''
        }))
      } catch (error) {
        console.error('Error loading users:', error)
      }
    },
    async loadSteps() {
      if (!this.taskId) return
      try {
        const response = await axios.get(`/api/task-steps/task/${this.taskId}`)
        this.steps = response.data
        this.$emit('update:modelValue', this.steps)
      } catch (error) {
        console.error('Error loading steps:', error)
      }
    },
    addStep() {
      this.currentStep = this.getEmptyStep()
      this.editingIndex = null
      this.showStepDialog = true
    },
    editStep(index) {
      this.currentStep = { ...this.steps[index] }
      // Convert date strings to Date objects
      if (this.currentStep.start_date) {
        this.currentStep.start_date = new Date(this.currentStep.start_date)
      }
      if (this.currentStep.end_date) {
        this.currentStep.end_date = new Date(this.currentStep.end_date)
      }
      this.editingIndex = index
      this.showStepDialog = true
    },
    saveStep() {
      const existingStep = this.editingIndex !== null ? this.steps[this.editingIndex] : {}
      const stepData = {
        ...existingStep,
        ...this.currentStep,
        step_order: this.editingIndex !== null ? this.editingIndex : this.steps.length,
        start_date: this.currentStep.start_date ? this.formatDate(this.currentStep.start_date) : null,
        end_date: this.currentStep.end_date ? this.formatDate(this.currentStep.end_date) : null
      }

      if (this.editingIndex !== null) {
        this.steps[this.editingIndex] = stepData
      } else {
        this.steps.push(stepData)
      }

      this.$emit('update:modelValue', this.steps)
      this.showStepDialog = false
    },
    onDragStart(event, index) {
      this.dragIndex = index
      event.dataTransfer.effectAllowed = 'move'
    },
    onDragEnter(event, index) {
      if (this.dragIndex !== index) {
        this.dragOverIndex = index
      }
    },
    onDragLeave() {
      this.dragOverIndex = null
    },
    onDrop(event, index) {
      event.preventDefault()
      if (this.dragIndex !== null && this.dragIndex !== index) {
        const item = this.steps.splice(this.dragIndex, 1)[0]
        this.steps.splice(index, 0, item)
        // Update step_order
        this.steps.forEach((step, idx) => {
          step.step_order = idx
        })
        this.$emit('update:modelValue', this.steps)
      }
      this.dragIndex = null
      this.dragOverIndex = null
    },
    deleteStep(index) {
      this.$confirm.require({
        message: 'คุณต้องการลบ step นี้หรือไม่?',
        header: 'ยืนยันการลบ',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.steps.splice(index, 1)
          // Update step_order
          this.steps.forEach((step, idx) => {
            step.step_order = idx
          })
          this.$emit('update:modelValue', this.steps)
        }
      })
    },
    async completeStep(index) {
      const step = this.steps[index]
      if (step.id && this.taskId) {
        try {
          await axios.put(`/api/task-steps/${step.id}`, { status: 'completed' })
          this.steps[index].status = 'completed'
          this.$emit('update:modelValue', this.steps)
        } catch (error) {
          console.error('Error completing step:', error)
        }
      } else {
        this.steps[index].status = 'completed'
        this.$emit('update:modelValue', this.steps)
      }
    },
    formatDate(date) {
      if (!date) return null
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    formatDateRange(start, end) {
      if (!start && !end) return 'ไม่ระบุวันที่'
      const formatThai = (date) => {
        if (!date) return ''
        return new Date(date).toLocaleDateString('th-TH', { 
          day: 'numeric', 
          month: 'short',
          year: '2-digit'
        })
      }
      if (start && end) {
        return `${formatThai(start)} - ${formatThai(end)}`
      }
      return formatThai(start || end)
    },
    getStatusIcon(step) {
      if (step.status === 'completed') return 'pi pi-check-circle'
      if (step.status === 'in_progress') return 'pi pi-spin pi-spinner'
      return 'pi pi-circle'
    },
    getStepStatusLabel(step) {
      if (step.status === 'completed') return 'เสร็จสิ้น'
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // เกินกำหนด - เช็คก่อนเสมอ (priority สูงสุด)
      if (step.end_date) {
        const endDate = new Date(step.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return 'เกินกำหนด'
      }
      
      // กำลังดำเนินการ - เช็คว่ามีการลงงานแล้ว
      if (step.has_work_logged) {
        if (step.latest_work_date) {
          const workDate = new Date(step.latest_work_date)
          workDate.setHours(0, 0, 0, 0)
          if (workDate <= today) return 'กำลังดำเนินการ'
        } else {
          return 'กำลังดำเนินการ'
        }
      }
      
      return 'รอดำเนินการ'
    },
    getStepClass(step) {
      if (step.status === 'completed') return 'status-completed'
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // เกินกำหนด - เช็คก่อนเสมอ (priority สูงสุด)
      if (step.end_date) {
        const endDate = new Date(step.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return 'status-overdue'
      }
      
      // กำลังดำเนินการ - เช็คว่ามีการลงงานแล้ว
      if (step.has_work_logged) {
        if (step.latest_work_date) {
          const workDate = new Date(step.latest_work_date)
          workDate.setHours(0, 0, 0, 0)
          if (workDate <= today) return 'status-working'
        } else {
          return 'status-working'
        }
      }
      
      return 'status-pending'
    },
    getProjectStatusLabel(status) {
      const found = this.projectStatusOptions.find(opt => opt.value === status)
      return found ? found.label : status
    },
    getStatusColor(status) {
      const found = this.projectStatusOptions.find(opt => opt.value === status)
      return found?.color || '#6b7280'
    }
  }
}
</script>

<style scoped>
.workflow-builder {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.workflow-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2c3e50;
}

.workflow-timeline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  position: relative;
  padding-left: 0.5rem;
}

.workflow-step {
  position: relative;
  flex: 0 0 auto;
  cursor: grab;
  margin-left: 25px;
}

.workflow-step:first-child {
  margin-left: 0;
}

.workflow-step:active {
  cursor: grabbing;
}

.workflow-step.drag-over .step-card {
  border: 2px dashed #3b82f6;
  background: #eff6ff;
}

.step-connector {
  display: none;
}

.step-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  flex-shrink: 0;
}

.step-arrow i {
  color: #3b82f6;
  font-size: 1.5rem;
  font-weight: bold;
}

/* ลูกศรติด block */
.workflow-step {
  position: relative;
}

.workflow-step:not(:first-child)::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 10px solid #3b82f6;
}

.workflow-step:not(:first-child)::after {
  content: '';
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 3px;
  background: #3b82f6;
}

.step-card {
  background: white;
  border-radius: 10px;
  padding: 0.75rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-left: 3px solid #3b82f6;
  transition: all 0.3s ease;
  min-height: fit-content;
}

.step-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}

.step-card.status-completed {
  border-left-color: #10b981;
  background: linear-gradient(to right, #f0fdf4 0%, white 10%);
}

.step-card.status-working {
  border-left-color: #f59e0b;
  background: linear-gradient(to right, #fefce8 0%, white 10%);
}

.step-card.status-overdue {
  border-left-color: #ef4444;
  background: linear-gradient(to right, #fef2f2 0%, white 10%);
}

.step-card.status-in_progress {
  border-left-color: #3b82f6;
  background: linear-gradient(to right, #eff6ff 0%, white 10%);
}

.step-card.status-pending {
  border-left-color: #9ca3af;
  background: linear-gradient(to right, #f9fafb 0%, white 10%);
}

.step-card.status-on_hold {
  border-left-color: #6b7280;
  background: linear-gradient(to right, #f9fafb 0%, white 10%);
}

.drag-handle {
  cursor: grab;
  padding: 0.25rem;
  color: #9ca3af;
  display: flex;
  align-items: center;
}

.drag-handle:hover {
  color: #3b82f6;
}

.drag-handle:active {
  cursor: grabbing;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.85rem;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.status-completed .step-number {
  background: linear-gradient(135deg, #10b981, #059669);
}

.status-working .step-number {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.status-overdue .step-number {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.status-in_progress .step-number {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.status-pending .step-number {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
}

.status-on_hold .step-number {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.step-status-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  background: #f1f5f9;
  color: #64748b;
}

.step-status-badge.status-completed {
  background: #d1fae5;
  color: #047857;
}

.step-status-badge.status-working {
  background: #fef3c7;
  color: #b45309;
}

.step-status-badge.status-overdue {
  background: #fee2e2;
  color: #dc2626;
}

.step-status-badge.status-in_progress {
  background: #dbeafe;
  color: #1d4ed8;
}

.step-status-badge.status-pending {
  background: #e5e7eb;
  color: #374151;
}

.step-actions {
  margin-left: auto;
  display: flex;
  gap: 0.1rem;
}

.step-content h4 {
  margin: 0 0 0.25rem 0;
  color: #1e293b;
  font-size: 0.9rem;
  word-wrap: break-word;
}

.step-description {
  color: #64748b;
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.3;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.step-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
  font-size: 0.75rem;
}

.info-item i {
  color: #94a3b8;
  font-size: 0.7rem;
}

.assigned-users {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.user-badge {
  background: #3b82f6;
  color: #fff;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
}

.project-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
}

.empty-workflow {
  text-align: center;
  padding: 2rem 1rem;
  color: #94a3b8;
}

.empty-workflow i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.empty-workflow p {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
}

.step-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.field label {
  font-weight: 500;
  color: #374151;
}

.field :deep(input),
.field :deep(textarea),
.field :deep(.p-inputtext),
.field :deep(.p-calendar),
.field :deep(.p-multiselect) {
  width: 100%;
}

.required {
  color: #ef4444;
}

.field-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.user-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-option .user-name {
  font-weight: 500;
  color: #1f2937;
}

.user-option .user-info {
  font-size: 0.75rem;
  color: #6b7280;
}

@media (max-width: 768px) {
  .field-group {
    grid-template-columns: 1fr;
  }
}
</style>
