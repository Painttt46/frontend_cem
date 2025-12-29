<template>
  <div>
    <Toast />
    <Card class="form-card">
      <template #content>
        <form @submit.prevent="submitForm" class="daily-work-form">
          <div class="form-grid">
            <div class="input-group">
              <label for="taskId" class="input-label">เลือกโครงการ *</label>
              <Dropdown id="taskId" v-model="formData.taskId" :options="tasks" optionLabel="display" optionValue="id"
                class="corporate-dropdown" required placeholder="เลือกโครงการที่ต้องการลงเวลา" @change="onTaskChange" />
            </div>

            <div class="input-group">
              <label for="workDate" class="input-label">วันที่ลงงาน *</label>
              <Calendar id="workDate" v-model="formData.workDate" dateFormat="dd/mm/yy" class="corporate-input"
                required />
            </div>

            <div class="input-group">
              <label for="startTime" class="input-label">เวลาเริ่มงาน *</label>
              <Calendar id="startTime" v-model="formData.startTime" timeOnly hourFormat="24" class="corporate-input"
                required />
            </div>

            <div class="input-group">
              <label for="endTime" class="input-label">เวลาสิ้นสุดงาน *</label>
              <Calendar id="endTime" v-model="formData.endTime" timeOnly hourFormat="24" class="corporate-input"
                required />
            </div>

            <div class="input-group">
              <label for="totalHours" class="input-label">ระยะเวลารวม</label>
              <InputText id="totalHours" :value="calculateHours" readonly class="corporate-input readonly-field" />
            </div>

            <div class="input-group">
              <label for="workStatus" class="input-label">สถานะงาน *</label>
              <Dropdown id="workStatus" v-model="formData.workStatus" :options="statusOptions" optionLabel="label"
                optionValue="value" class="corporate-dropdown" required>
                <template #value="slotProps">
                  <Badge v-if="slotProps.value" :value="getStatusLabelOnly(slotProps.value)"
                    :style="{ backgroundColor: getStatusColor(slotProps.value), color: '#fff' }" />
                  <span v-else>เลือกสถานะ</span>
                </template>
                <template #option="slotProps">
                  <Badge :value="slotProps.option.label"
                    :style="{ backgroundColor: slotProps.option.color || '#6c757d', color: '#fff' }" />
                </template>
              </Dropdown>
            </div>

            <div class="input-group full-width">
              <label for="location" class="input-label">สถานที่ *</label>
              <InputText id="location" v-model="formData.location" required class="corporate-input"
                placeholder="ระบุสถานที่หรือที่อยู่" />
            </div>

            <div class="input-group full-width">
              <label for="workDescription" class="input-label">รายละเอียดงานที่ทำวันนี้ *</label>
              <Textarea id="workDescription" v-model="formData.workDescription" rows="4" required
                class="corporate-input" />
            </div>

            <div class="input-group full-width">
              <label class="input-label">แนบไฟล์ (รูปภาพ, เอกสาร)</label>
              <div class="file-upload-wrapper">
                <input ref="fileInput" @change="handleFileUpload" type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple class="file-input" id="fileUpload">
                <Button type="button"
                  :label="formData.files?.length > 0 ? `เลือกแล้ว ${formData.files.length} ไฟล์` : 'เลือกไฟล์'"
                  icon="pi pi-upload" severity="secondary" outlined @click="$refs.fileInput.click()" />
              </div>
              <div v-if="formData.files?.length > 0" class="file-list">
                <div v-for="(file, index) in formData.files" :key="index" class="file-item">
                  <i class="pi pi-file"></i>
                  <span class="file-name">{{ file.name }}</span>
                  <Button icon="pi pi-times" size="small" severity="danger" text @click="removeFile(index)" />
                </div>
              </div>
            </div>
          </div>

          <Divider />
          <div class="calendar-options">
            <div class="options-header">
              <label for="createCalendar" class="calendar-main-label">
                <i class="pi pi-calendar-plus"></i>
                สร้าง Calendar Event ใน Microsoft Teams
              </label>
            </div>
 <div class="input-group">
              <label for="attendees" class="input-label">
                <i class="pi pi-users"></i>
                เชิญผู้เข้าร่วม
              </label>

              <!-- AutoComplete สำหรับเลือก attendees -->
              <div class="colleague-search">
                <AutoComplete v-model="selectedAttendee" :suggestions="filteredAttendees" @complete="searchAttendees"
                  @item-select="onAttendeeSelect" @dropdown-click="showAllAttendees" optionLabel="name"
                  placeholder="ค้นหาและเลือกผู้ใช้..." class="corporate-input" :dropdown="true" :forceSelection="false"
                  :scrollHeight="200">
                  <template #option="slotProps">
                    <div class="user-option">
                      <div class="user-name">{{ slotProps.option.name }}</div>
                    </div>
                  </template>
                </AutoComplete>
              </div>

              <!-- Input สำหรับพิมพ์ email เพิ่มเอง -->
              <div class="email-input-section mt-2">
                <div class="input-with-button">
                  <input v-model="newEmail" type="email" placeholder="พิมพ์ email เพิ่มเติม..." class="corporate-input"
                    @keyup.enter="addNewEmail" />
                  <Button type="button" icon="pi pi-plus" @click="addNewEmail" :disabled="!isValidEmail(newEmail)"
                    class="add-email-btn" />
                </div>
              </div>

              <!-- แสดงรายชื่อที่เลือกแล้ว -->
              <div v-if="formData.attendees && formData.attendees.length > 0" class="selected-attendees">
                <h6 class="attendees-title">ผู้เข้าร่วมที่เลือก:</h6>
                <div class="attendees-list">
                  <div v-for="(attendee, index) in formData.attendees" :key="index" class="attendee-card">
                    <div class="attendee-details">
                      <div class="attendee-name">{{ attendee }}</div>
                    </div>
                    <Button type="button" icon="pi pi-times" severity="danger" text rounded size="small"
                      @click="removeAttendee(index)" class="remove-btn" />
                  </div>
                </div>
              </div>

              <div v-else class="no-attendees">
                <i class="pi pi-users"></i>
                <span>ยังไม่มีผู้เข้าร่วม</span>
              </div>
            </div>

            <div class="input-group full-width event-details-group">
              <label for="eventDetails" class="input-label">
                <i class="pi pi-file-edit"></i>
                รายละเอียดเพิ่มเติมสำหรับ Calendar Event
              </label>
              <textarea id="eventDetails" v-model="formData.eventDetails"
                placeholder="ระบุรายละเอียดเพิ่มเติมที่ต้องการแสดงใน calendar event..." rows="4"
                class="corporate-textarea" />
            </div>

            <div class="input-group full-width">
              <div class="teams-meeting-section">
                <div class="checkbox-group">
                  <Checkbox v-model="formData.createTeamsMeeting" inputId="createTeams" :binary="true" />
                  <label for="createTeams" class="checkbox-label">
                    <i class="pi pi-video"></i>
                    สร้าง MS Teams Meeting
                  </label>
                </div>
                <small class="teams-hint">
                  <i class="pi pi-info-circle"></i>
                  จะสร้าง Teams Meeting อัตโนมัติและส่งลิงก์ให้ผู้เข้าร่วมทุกคน
                </small>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <Button type="button" label="ล้างข้อมูล" icon="pi pi-refresh" severity="secondary" outlined
              @click="resetForm" />
            <Button type="submit" label="บันทึกงาน" icon="pi pi-check" severity="success" />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script>
import axios from '@/utils/axiosConfig'
import Checkbox from 'primevue/checkbox'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'

import { isRequired, isValidTimeRange, getValidationMessage } from '@/utils/validation'
import { isActive } from '@/utils/statusHelper'

export default {
  name: 'DailyWorkForm',
  components: {
    Checkbox,
    AutoComplete,
    Button
  },
  created() {
    this.$http = axios
    this.loadTasks()
    this.loadUsers()
  },
  data() {
    return {
      tasks: [],
      formData: {
        taskId: null,
        workDate: new Date(),
        startTime: new Date(),
        endTime: null,
        workStatus: null,
        location: '',
        workDescription: '',
        files: [],
        createCalendarEvent: true,
        attendees: [],
        createTeamsMeeting: false,
        eventDetails: ''
      },
      selectedAttendee: null,
      filteredAttendees: [],
      users: [],
      attendeeOptions: [],
      newEmail: '',
      statusOptions: []
    }
  },
  computed: {
    calculateHours() {
      if (this.formData.startTime && this.formData.endTime) {
        const start = new Date(this.formData.startTime)
        let end = new Date(this.formData.endTime)
        
        // ถ้าเวลาสิ้นสุดน้อยกว่าเวลาเริ่ม แสดงว่าข้ามวัน
        if (end <= start) {
          end.setDate(end.getDate() + 1)
        }
        
        const diff = (end - start) / (1000 * 60 * 60)
        return diff > 0 ? `${diff.toFixed(1)} ชั่วโมง` : '0 ชั่วโมง'
      }
      return '0 ชั่วโมง'
    }
  },
  async mounted() {
    await this.loadTasks()
    this.loadStatusOptions()

    // Listen for status updates
    window.addEventListener('statusesUpdated', this.handleStatusesUpdate)
  },
  beforeUnmount() {
    window.removeEventListener('statusesUpdated', this.handleStatusesUpdate)
  },
  methods: {
    async loadUsers() {
      try {
        const response = await this.$http.get('/api/users')
        this.users = response.data.map(user => ({
          ...user,
          name: `${user.firstname} ${user.lastname}`.trim(),
          email: user.email
        }))
        this.attendeeOptions = this.users
      } catch { // ignore

      }
    },

    searchAttendees(event) {
      const query = event.query.toLowerCase().trim()

      if (query) {
        // ค้นหาจาก users ที่โหลดมา
        this.filteredAttendees = this.users.filter(user =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        )
      } else {
        this.filteredAttendees = this.users.slice()
      }
    },

    showAllAttendees() {
      this.filteredAttendees = this.users.slice()
    },

    onAttendeeSelect(event) {
      const attendee = event.value
      if (attendee && attendee.email) {
        // ตรวจสอบว่าไม่ได้เลือกซ้ำ
        if (!this.formData.attendees.includes(attendee.email)) {
          this.formData.attendees.push(attendee.email)
        }
        // Clear selection
        this.selectedAttendee = null
      }
    },

    removeAttendee(index) {
      this.formData.attendees.splice(index, 1)
    },

    addEmailDirectly() {
      if (this.selectedAttendee && typeof this.selectedAttendee === 'string') {
        const email = this.selectedAttendee.trim()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (emailRegex.test(email) && !this.formData.attendees.includes(email)) {
          this.formData.attendees.push(email)
          this.selectedAttendee = null
        }
      }
    },

    isValidEmail(email) {
      if (!email) return false
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email.trim())
    },

    addNewEmail() {
      const email = this.newEmail.trim()
      if (this.isValidEmail(email) && !this.formData.attendees.includes(email)) {
        this.formData.attendees.push(email)
        this.newEmail = ''
      }
    },

    addSelectedAttendees() {
      // เพิ่ม attendees ที่เลือกจาก dropdown เข้าไปใน chips
      this.selectedAttendees.forEach(email => {
        if (!this.formData.attendees.includes(email)) {
          this.formData.attendees.push(email)
        }
      })
      // Clear selection หลังจากเพิ่มแล้ว
      this.selectedAttendees = []
    },
    async loadTasks() {
      try {
        const response = await this.$http.get('/api/tasks')
        // กรองเฉพาะ task ที่ไม่ complete
        const availableTasks = response.data.filter(task => isActive(task.status))

        this.tasks = availableTasks.map(task => ({
          ...task,
          display: `${task.task_name} ${task.so_number ? `(${task.so_number})` : ''}`
        }))
      } catch { // ignore

      }
    },
    handleFileUpload(event) {
      const files = Array.from(event.target.files)
      this.formData.files = [...this.formData.files, ...files]
    },
    removeFile(index) {
      this.formData.files.splice(index, 1)
    },
    async uploadFiles() {
      if (this.formData.files.length === 0) return []

      const formData = new FormData()
      this.formData.files.forEach(file => {
        formData.append('files', file)
      })

      try {
        const response = await this.$http.post('/api/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data.files || []
      } catch { // ignore
        return []
      }
    },
    onTaskChange() {
      // Task changed
    },
    async submitForm() {
      if (!isRequired(this.formData.taskId)) {
        this.$toast.add({
          severity: 'error',
          summary: 'ข้อผิดพลาด',
          detail: getValidationMessage('งาน', 'required'),
          life: 3000
        })
        return
      }

      if (!isRequired(this.formData.workStatus)) {
        this.$toast.add({
          severity: 'error',
          summary: 'ข้อมูลไม่ครบถ้วน',
          detail: getValidationMessage('สถานะงาน', 'required'),
          life: 3000
        })
        return
      }

      if (!isValidTimeRange(this.formData.startTime, this.formData.endTime)) {
        this.$toast.add({
          severity: 'error',
          summary: 'ข้อผิดพลาด',
          detail: getValidationMessage('เวลา', 'timeRange'),
          life: 3000
        })
        return
      }

      try {
        const uploadedFiles = await this.uploadFiles()

        const workData = {
          task_id: this.formData.taskId,
          work_date: this.formatDate(this.formData.workDate),
          start_time: this.formatTime(this.formData.startTime),
          end_time: this.formatTime(this.formData.endTime),
          total_hours: this.calculateTotalHours(),
          work_status: this.formData.workStatus,
          location: this.formData.location,
          work_description: this.formData.workDescription,
          files: uploadedFiles,
          user_id: localStorage.getItem('soc_user_id'),
          submitted_at: new Date().toISOString(),
          create_calendar_event: this.formData.createCalendarEvent,
          attendees: this.formData.attendees,
          create_teams_meeting: this.formData.createTeamsMeeting,
          event_details: this.formData.eventDetails
        }
        await this.$http.post('/api/daily-work', workData)

        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'บันทึกงานรายวันเรียบร้อยแล้ว',
          life: 3000
        })

        // Dispatch event for realtime update
        window.dispatchEvent(new CustomEvent('taskUpdated'))
        window.dispatchEvent(new CustomEvent('taskStatusChanged'))

        this.$emit('submit-work')
        this.resetForm()
      } catch (err) {
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: err.response?.data?.error || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
          life: 5000
        })
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
    formatTime(date) {
      if (!date) return null
      const d = new Date(date)
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    },
    calculateTotalHours() {
      if (this.formData.startTime && this.formData.endTime) {
        const start = new Date(this.formData.startTime)
        let end = new Date(this.formData.endTime)
        
        // ถ้าเวลาสิ้นสุดน้อยกว่าเวลาเริ่ม แสดงว่าข้ามวัน
        if (end <= start) {
          end.setDate(end.getDate() + 1)
        }
        
        return Math.max(0, (end - start) / (1000 * 60 * 60))
      }
      return 0
    },
    resetForm() {
      this.formData = {
        taskId: null,
        workDate: new Date(),
        startTime: new Date(),
        endTime: null,
        workStatus: null,
        location: '',
        workDescription: '',
        files: []
      }
      const fileInput = document.getElementById('fileUpload')
      if (fileInput) fileInput.value = ''
    },

    loadStatusOptions() {
      this.$http.get('/api/settings/statuses')
        .then(response => {
          this.statusOptions = response.data
        })
        .catch(() => {
          // Fallback to default
          this.statusOptions = [
            { label: '✅ เสร็จสมบูรณ์', value: 'completed', icon: 'emoji:✅' },
            { label: '🔄 อยู่ระหว่างดำเนินการ', value: 'in_progress', icon: 'emoji:🔄' },
            { label: '⏳ รอข้อมูล / อนุมัติ / อุปกรณ์', value: 'pending', icon: 'emoji:⏳' }
          ]
        })
    },

    getStatusIcon(value) {
      const status = this.statusOptions.find(s => s.value === value)
      return status ? status.icon : null
    },

    getStatusLabel(value) {
      const status = this.statusOptions.find(s => s.value === value)
      return status ? status.label : value
    },

    getStatusLabelOnly(value) {
      const status = this.statusOptions.find(s => s.value === value)
      return status ? status.label : value
    },

    getStatusColor(value) {
      const status = this.statusOptions.find(s => s.value === value)
      return status?.color || '#6c757d'
    },

    handleStatusesUpdate() {
      // อัพเดทสถานะเมื่อมีการเปลี่ยนแปลงจาก Management > จัดการสถานะงาน
      this.loadStatusOptions()
    }
  }
}
</script>

<style scoped>
.form-card {
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.daily-work-form {
  padding: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group.full-width {
  grid-column: 1 / -1;
}

.input-label {
  font-weight: 500;
  color: #495057;
  font-size: 0.9rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Attendees */
.input-with-button {
  display: flex;
  gap: 0.5rem;
}

.input-with-button input {
  flex: 1;
}

.selected-attendees {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.attendees-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
}

.attendees-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attendee-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.attendee-name {
  font-weight: 500;
  color: #212529;
  font-size: 0.9rem;
}

.remove-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--danger-color);
  border: none;
  color: white;
}

.no-attendees {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--text-secondary);
  background: #f8f9fa;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  margin-top: 1rem;
}

/* Calendar Section */
.calendar-section {
  background: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin: 1rem 0;
}

.calendar-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.calendar-main-label {
  font-weight: 600;
  color: #495057;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.calendar-main-label i {
  color: var(--primary-color);
}

.calendar-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-left: 2rem;
}

.calendar-options {
  margin: 1rem 0;
  padding: 1rem;
  background: white;
  border: 1px solid var(--primary-color);
  border-radius: var(--radius-md);
}

.options-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

/* Teams Meeting */
.teams-meeting-section {
  padding: 1rem;
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: var(--radius-md);
  margin-top: 1rem;
}

.teams-meeting-section .checkbox-label {
  font-weight: 500;
  color: #1976d2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.teams-hint {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

/* Form Elements */
.corporate-input,
.corporate-dropdown,
.corporate-textarea {
  width: 100%;
  border: 1px solid #ced4da;
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  font-size: 0.9rem;
}

.corporate-input:focus,
.corporate-dropdown:focus,
.corporate-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.15);
  outline: none;
}

.corporate-textarea {
  min-height: 100px;
  resize: vertical;
}

.readonly-field {
  background: #f8f9fa;
  color: var(--text-secondary);
}

.field-hint {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Status */
.status-display,
.status-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.emoji {
  font-size: 1.1rem;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

/* File Upload */
.file-upload-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-input {
  display: none;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.file-item i {
  color: var(--text-secondary);
}

.file-name {
  flex: 1;
  font-size: 0.9rem;
  color: #495057;
  word-break: break-all;
}

:deep(.p-dropdown),
:deep(.p-calendar),
:deep(.p-inputtext),
:deep(.p-textarea) {
  width: 100%;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .p-button {
    width: 100%;
  }
}
</style>
