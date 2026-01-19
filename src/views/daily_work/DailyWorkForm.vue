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
                class="corporate-dropdown task-dropdown" required placeholder="เลือกโครงการที่ต้องการลงเวลา" @change="onTaskChange"
                filter filterPlaceholder="ค้นหาชื่อโครงการ / เลข SO"
                :filterFields="['task_name', 'so_number', 'display']">
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="task-selected">
                    <span v-if="getTaskSO(slotProps.value)" class="so-badge">{{ getTaskSO(slotProps.value) }}</span>
                    <span class="task-name-text">{{ getTaskName(slotProps.value) }}</span>
                  </div>
                  <span v-else>เลือกโครงการที่ต้องการลงเวลา</span>
                </template>
                <template #option="slotProps">
                  <div class="task-option">
                    <span v-if="slotProps.option.so_number" class="so-badge">{{ slotProps.option.so_number }}</span>
                    <span class="task-name-text">{{ slotProps.option.task_name }}</span>
                  </div>
                </template>
              </Dropdown>
            </div>

            <div class="input-group" v-if="workflowSteps.length > 0">
              <label for="stepId" class="input-label">
                <i class="pi pi-sitemap"></i> เลือก Workflow Step (เลือกได้หลายรายการ)
              </label>
              <MultiSelect id="stepId" v-model="formData.stepIds" :options="workflowSteps" optionLabel="step_name"
                optionValue="id" class="corporate-dropdown workflow-dropdown" placeholder="เลือก step (ถ้ามี)"
                filter filterPlaceholder="ค้นหาชื่อ step...">
                <template #value="slotProps">
                  <div v-if="slotProps.value && slotProps.value.length > 0" class="selected-chips">
                    <div v-for="stepId in slotProps.value" :key="stepId" class="step-chip" 
                      :style="{ borderLeftColor: getStepStatusColor(getStepById(stepId)), background: getStepStatusColor(getStepById(stepId)) + '15' }">
                      <div class="chip-main">
                        <span class="chip-badge" :style="{ background: getStepStatusColor(getStepById(stepId)) }">{{ getStepNumber(stepId) }}</span>
                        <span class="chip-name">{{ getStepById(stepId)?.step_name }}</span>
                        <span class="chip-status" :style="{ color: getStepStatusColor(getStepById(stepId)) }">{{ getStepStatusLabel(getStepById(stepId)) }}</span>
                        <i class="pi pi-times chip-remove" @click.stop="removeStep(stepId)"></i>
                      </div>
                      <div v-if="getStepById(stepId)?.description" class="chip-desc">{{ getStepById(stepId).description }}</div>
                      <div class="chip-details">
                        <span v-if="getStepById(stepId)?.start_date || getStepById(stepId)?.end_date" class="chip-meta">
                          <i class="pi pi-calendar"></i> {{ formatDateRange(getStepById(stepId)?.start_date, getStepById(stepId)?.end_date) }}
                        </span>
                        <span v-if="getStepById(stepId)?.assigned_users?.length > 0" class="chip-meta">
                          <i class="pi pi-users"></i> {{ formatAssignedUsers(getStepById(stepId).assigned_users) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span v-else class="placeholder-text">เลือก step (ถ้ามี)</span>
                </template>
                <template #option="slotProps">
                  <div class="step-option" :style="{ borderLeftColor: getStepStatusColor(slotProps.option) }">
                    <div class="step-header-option">
                      <span class="step-badge" :style="{ backgroundColor: getStepStatusColor(slotProps.option) }">{{ slotProps.index + 1 }}</span>
                      <strong>{{ slotProps.option.step_name }}</strong>
                      <span class="step-status-inline" :style="{ color: getStepStatusColor(slotProps.option) }">
                        <i class="pi pi-circle-fill"></i> {{ getStepStatusLabel(slotProps.option) }}
                      </span>
                    </div>
                    <div v-if="slotProps.option.description" class="step-desc">{{ slotProps.option.description }}</div>
                    <div class="step-meta">
                      <span v-if="slotProps.option.start_date || slotProps.option.end_date" class="meta-item">
                        <i class="pi pi-calendar"></i>
                        {{ formatDateRange(slotProps.option.start_date, slotProps.option.end_date) }}
                      </span>
                      <span v-if="slotProps.option.assigned_users && slotProps.option.assigned_users.length > 0" class="meta-item">
                        <i class="pi pi-users"></i>
                        {{ formatAssignedUsers(slotProps.option.assigned_users) }}
                      </span>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>

            <div class="input-group">
              <label for="workDate" class="input-label">วันที่ลงงาน *</label>
              <Calendar id="workDate" v-model="formData.workDate" dateFormat="dd/mm/yy" class="corporate-input"
                :minDate="minDate" required />
            </div>

            <div class="input-group time-range-group">
              <label class="input-label">ระยะเวลา *</label>
              <div class="time-range-inputs">
                <InputText id="startTime" v-model="formData.startTimeText" class="corporate-input time-input"
                  placeholder="เริ่ม" maxlength="5" inputmode="numeric"
                  @input="formatTimeInput('startTimeText')" @blur="parseStartTime" required />
                <span class="time-separator">-</span>
                <InputText id="endTime" v-model="formData.endTimeText" class="corporate-input time-input"
                  placeholder="สิ้นสุด" maxlength="5" inputmode="numeric"
                  @input="formatTimeInput('endTimeText')" @blur="parseEndTime" required />
                <span class="time-total">({{ calculateHours }})</span>
              </div>
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

            <div class="input-group full-width">
              <label for="eventTitle" class="input-label">
                <i class="pi pi-bookmark"></i>
                หัวข้อ Calendar Event *
              </label>
              <InputText id="eventTitle" v-model="formData.eventTitle" class="corporate-input"
                placeholder="หัวข้อ calendar event" required />
            </div>

            <div class="input-group attendees-section">
              <label for="attendees" class="input-label">
                <i class="pi pi-users"></i>
                เชิญผู้เข้าร่วม
              </label>

              <!-- AutoComplete สำหรับเลือก attendees -->
              <div class="colleague-search">
                <AutoComplete ref="attendeeAutocomplete" v-model="selectedAttendee" :suggestions="filteredAttendees" @complete="searchAttendees"
                  @item-select="onAttendeeSelect" @dropdown-click="showAllAttendees" optionLabel="name"
                  placeholder="ค้นหาและเลือกผู้ใช้..." class="corporate-input attendee-autocomplete" :dropdown="true" :forceSelection="false"
                  scrollHeight="200px">
                  <template #option="slotProps">
                    <div class="user-option">
                      <div class="user-name">{{ slotProps.option.name }}</div>
                      <div class="user-role">{{ slotProps.option.position }} - {{ slotProps.option.department }}</div>
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
                      <div class="attendee-name">{{ attendee.name || attendee }}</div>
                      <div v-if="attendee.position" class="attendee-position">
                        <i class="pi pi-briefcase"></i>
                        {{ attendee.position }}
                      </div>
                      <div v-if="attendee.department" class="attendee-department">
                        <i class="pi pi-building"></i>
                        {{ attendee.department }}
                      </div>
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

            <div v-if="formData.createTeamsMeeting" class="input-group-row">
              <div class="input-group">
                <label for="meetingStartTime" class="input-label">
                  <i class="pi pi-clock"></i>
                  เวลาเริ่ม Meeting
                </label>

                <Calendar id="meetingStartTime" ref="meetingStartTimeCal" v-model="formData.meetingStartTime" timeOnly
                  hourFormat="24" class="corporate-input" :manualInput="true" :pt="{
                    input: {
                      autocomplete: 'off'
                    }
                  }" @update:modelValue="onMeetingTimeChange" />
              </div>

              <div class="input-group">
                <label for="meetingEndTime" class="input-label">
                  <i class="pi pi-clock"></i>
                  เวลาสิ้นสุด Meeting
                </label>

                <Calendar id="meetingEndTime" ref="meetingEndTimeCal" v-model="formData.meetingEndTime" timeOnly
                  hourFormat="24" class="corporate-input" :manualInput="true" :pt="{
                    input: {
                      autocomplete: 'off'
                    }
                  }" @update:modelValue="onMeetingTimeChange" />
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
import MultiSelect from 'primevue/multiselect'

import { isRequired, isValidTimeRange, getValidationMessage } from '@/utils/validation'
import { isActive } from '@/utils/statusHelper'

export default {
  name: 'DailyWorkForm',
  components: {
    Checkbox,
    AutoComplete,
    Button,
    MultiSelect
  },
  created() {
    this.$http = axios
    this.loadTasks()
    this.loadUsers()
  },
  data() {
    return {
      tasks: [],
      workflowSteps: [],
      minDate: new Date(),
      formData: {
        taskId: null,
        stepIds: [],
        workDate: new Date(),
        startTime: new Date(),
        endTime: null,
        startTimeText: '',
        endTimeText: '',
        workStatus: null,
        location: '',
        workDescription: '',
        files: [],
        createCalendarEvent: true,
        eventTitle: '',
        meetingStartTime: new Date(),
        meetingEndTime: null,
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
  watch: {
    'formData.taskId'(newVal) {
      if (newVal) {
        const task = this.tasks.find(t => t.id === newVal)
        if (task) {
          this.formData.eventTitle = task.task_name
        }
      }
    },
    'formData.startTime'(newVal) {
      if (newVal) {
        this.formData.meetingStartTime = new Date(newVal)
      }
    },
    'formData.endTime'(newVal) {
      if (newVal) {
        this.formData.meetingEndTime = new Date(newVal)
      }
    }
  },
  computed: {
    selectedSteps() {
      if (!this.formData.stepIds || this.formData.stepIds.length === 0) return []
      return this.formData.stepIds.map(id => this.workflowSteps.find(s => s.id === id)).filter(Boolean)
    },
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

    // ตั้งค่าเริ่มต้นเวลา
    const now = new Date()
    this.formData.startTimeText = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
    this.parseStartTime()

    // Listen for status updates
    window.addEventListener('statusesUpdated', this.handleStatusesUpdate)
  },
  beforeUnmount() {
    window.removeEventListener('statusesUpdated', this.handleStatusesUpdate)
  },
  methods: {
    focusCalendarInput(refName) {
      this.$nextTick(() => {
        const root = this.$refs[refName]?.$el
        const input = root?.querySelector('input')
        if (input && document.activeElement !== input) input.focus()
      })
    },
    onMeetingTimeChange() {
      // Force reactivity when meeting time changes via Calendar picker
      console.log('Meeting time updated:', this.formData.meetingStartTime, this.formData.meetingEndTime)
    },

    parseStartTime() {
      const time = this.parseTimeText(this.formData.startTimeText)
      if (time) {
        this.formData.startTime = time
        this.formData.meetingStartTime = new Date(time)
      }
    },
    parseEndTime() {
      const time = this.parseTimeText(this.formData.endTimeText)
      if (time) {
        this.formData.endTime = time
        this.formData.meetingEndTime = new Date(time)
      }
    },
    parseTimeText(text) {
      if (!text || text.length < 5) return null
      const [hours, minutes] = text.split(':').map(Number)
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const date = new Date()
        date.setHours(hours, minutes, 0, 0)
        return date
      }
      return null
    },
    formatTimeInput(field) {
      let value = this.formData[field].replace(/\D/g, '')
      if (value.length >= 2) {
        value = value.slice(0, 2) + ':' + value.slice(2, 4)
      }
      this.formData[field] = value.slice(0, 5)
    },
    getStepNumber(stepId) {
      const index = this.workflowSteps.findIndex(s => s.id === stepId)
      return index >= 0 ? index + 1 : ''
    },
    getStepById(stepId) {
      return this.workflowSteps.find(s => s.id === stepId)
    },
    getStepName(stepId) {
      const step = this.workflowSteps.find(s => s.id === stepId)
      return step ? step.step_name : ''
    },
    getStepStatusLabel(step) {
      if (!step) return 'รอดำเนินการ'
      if (step.status === 'completed') return 'เสร็จสิ้น'
      if (step.has_work_logged) return 'กำลังดำเนินการ'
      return 'รอดำเนินการ'
    },
    getStepStatusColor(step) {
      if (!step) return '#9ca3af'
      if (step.status === 'completed') return '#10b981'
      if (step.has_work_logged) return '#3b82f6'
      return '#9ca3af'
    },
    removeStep(stepId) {
      this.formData.stepIds = this.formData.stepIds.filter(id => id !== stepId)
    },
    formatAssignedUsers(users) {
      if (!users || users.length === 0) return ''
      return users.map(u => u.name || u).join(', ')
    },
    formatDateRange(start, end) {
      if (!start && !end) return ''
      const formatDate = (date) => {
        if (!date) return ''
        return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
      }
      if (start && end) return `${formatDate(start)} - ${formatDate(end)}`
      return formatDate(start || end)
    },
    getTaskSO(taskId) {
      const task = this.tasks.find(t => t.id === taskId)
      return task?.so_number || ''
    },
    getTaskName(taskId) {
      const task = this.tasks.find(t => t.id === taskId)
      return task?.task_name || ''
    },
    async loadUsers() {
      try {
        const response = await this.$http.get('/api/users')
        this.users = response.data.map(user => ({
          ...user,
          name: `${user.firstname} ${user.lastname}`.trim(),
          email: user.email
        }))
        // เพิ่ม hardcoded group email
        this.users.unshift({
          name: 'Engineers Group',
          email: 'engineers@gent-s.com',
          position: 'Group Email',
          department: ''
        })
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
          user.email.toLowerCase().includes(query) ||
          (user.position && user.position.toLowerCase().includes(query)) ||
          (user.department && user.department.toLowerCase().includes(query))
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
        const exists = this.formData.attendees.some(a => a.email === attendee.email)
        if (!exists) {
          this.formData.attendees.push({
            email: attendee.email,
            name: attendee.name,
            position: attendee.position || '',
            department: attendee.department || ''
          })
        }
      }
      // Clear selection
      this.$nextTick(() => {
        this.selectedAttendee = null
      })
    },

    removeAttendee(index) {
      this.formData.attendees.splice(index, 1)
    },

    addEmailDirectly() {
      if (this.selectedAttendee && typeof this.selectedAttendee === 'string') {
        const email = this.selectedAttendee.trim()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const exists = this.formData.attendees.some(a => a.email === email)
        if (emailRegex.test(email) && !exists) {
          this.formData.attendees.push({ email, name: email, position: '', department: '' })
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
      const exists = this.formData.attendees.some(a => a.email === email)
      if (this.isValidEmail(email) && !exists) {
        this.formData.attendees.push({ email, name: email, position: '', department: '' })
        this.newEmail = ''
      }
    },

    addSelectedAttendees() {
      // เพิ่ม attendees ที่เลือกจาก dropdown เข้าไปใน chips
      this.selectedAttendees.forEach(email => {
        const exists = this.formData.attendees.some(a => a.email === email)
        if (!exists) {
          this.formData.attendees.push({ email, name: email, position: '', department: '' })
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
    async onTaskChange() {
      this.workflowSteps = []
      this.formData.stepIds = []
      if (this.formData.taskId) {
        try {
          const response = await axios.get(`/api/task-steps/task/${this.formData.taskId}`)
          this.workflowSteps = response.data || []
        } catch (error) {
          console.error('Error loading workflow steps:', error)
        }
      }
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
        const stepIds = this.formData.stepIds && this.formData.stepIds.length > 0 
          ? this.formData.stepIds 
          : [null]

        for (const stepId of stepIds) {
          const workData = {
            task_id: this.formData.taskId,
            step_id: stepId,
            work_date: this.formatDate(this.formData.workDate),
            start_time: this.formatTime(this.formData.startTime),
            end_time: this.formatTime(this.formData.endTime),
            total_hours: this.calculateTotalHours(),
            location: this.formData.location,
            work_description: this.formData.workDescription,
            files: uploadedFiles,
            user_id: localStorage.getItem('soc_user_id'),
            submitted_at: new Date().toISOString(),
            create_calendar_event: this.formData.createCalendarEvent,
            event_title: this.formData.eventTitle,
            meeting_start_time: this.formatTime(this.formData.meetingStartTime),
            meeting_end_time: this.formatTime(this.formData.meetingEndTime),
            attendees: this.formData.attendees,
            create_teams_meeting: this.formData.createTeamsMeeting,
            event_details: this.formData.eventDetails
          }
          await this.$http.post('/api/daily-work', workData)
        }

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
      const now = new Date()
      this.formData = {
        taskId: null,
        stepIds: [],
        workDate: new Date(),
        startTime: new Date(),
        endTime: null,
        startTimeText: now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'),
        endTimeText: '',
        workStatus: null,
        location: '',
        workDescription: '',
        files: [],
        createCalendarEvent: true,
        eventTitle: '',
        meetingStartTime: new Date(),
        meetingEndTime: null,
        attendees: [],
        createTeamsMeeting: false,
        eventDetails: ''
      }
      this.workflowSteps = []
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

/* Task Dropdown Styling */
.task-dropdown {
  width: 100%;
  max-width: 100%;
}

.task-dropdown :deep(.p-dropdown) {
  width: 100% !important;
  max-width: 100% !important;
}

.task-dropdown :deep(.p-dropdown-label) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.task-dropdown :deep(.p-dropdown-panel) {
  position: fixed !important;
  max-width: calc(100vw - 2rem) !important;
  left: 1rem !important;
  right: 1rem !important;
  width: calc(100vw - 2rem) !important;
}

.task-dropdown :deep(.p-dropdown-items-wrapper) {
  max-width: 100%;
  overflow-x: hidden;
}

.task-dropdown :deep(.p-dropdown-item) {
  white-space: normal;
  word-break: break-word;
  max-width: 100%;
}

.task-selected,
.task-option {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  max-width: 100%;
  width: 100%;
}

.so-badge {
  flex-shrink: 0;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.task-name-text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
  white-space: normal;
  line-height: 1.4;
}

.selected-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-right: 2rem;
}

.workflow-dropdown :deep(.p-dropdown-clear-icon) {
  right: 2.5rem;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: bold;
}

.step-option {
  padding: 0.5rem 0.75rem;
  border-left: 4px solid #9ca3af;
  margin: 0.25rem 0;
  border-radius: 0 4px 4px 0;
  background: #f8fafc;
}

.step-header-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #9ca3af;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: bold;
}

.step-desc {
  color: #64748b;
  font-size: 0.85rem;
  margin: 0.25rem 0 0.25rem 2rem;
  line-height: 1.4;
}

.step-meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.25rem;
  margin-left: 2rem;
  font-size: 0.8rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #64748b;
}

.meta-item i {
  font-size: 0.7rem;
}

.meta-item.status {
  color: #10b981;
}

.selected-steps-detail {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selected-step-item {
  padding: 0.75rem;
  border-left: 4px solid #9ca3af;
  border-radius: 0 6px 6px 0;
  background: #f8fafc;
}

.step-status-tag {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  color: white;
  margin-left: auto;
}

.selected-chips {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.step-chip {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0.6rem;
  border-left: 3px solid;
  border-radius: 0 6px 6px 0;
  font-size: 0.85rem;
}

.chip-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chip-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  flex-shrink: 0;
}

.chip-name {
  font-weight: 500;
  color: #334155;
}

.chip-status {
  font-size: 0.75rem;
  margin-left: auto;
}

.chip-remove {
  cursor: pointer;
  color: #94a3b8;
  padding: 0.2rem;
  margin-left: 0.25rem;
}

.chip-remove:hover {
  color: #ef4444;
}

.chip-details {
  display: flex;
  gap: 1rem;
  margin-left: 1.75rem;
  font-size: 0.75rem;
}

.chip-desc {
  margin-left: 1.75rem;
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.3;
}

.chip-meta {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #64748b;
}

.chip-meta i {
  font-size: 0.65rem;
}

.step-status-inline {
  margin-left: auto;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.step-status-inline i {
  font-size: 0.5rem;
}

.placeholder-text {
  color: #94a3b8;
}

.workflow-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.workflow-steps-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.workflow-step-item {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  transition: all 0.2s;
  border-radius: 6px;
}

.workflow-step-item.active {
  background: #e0f2fe;
  border-left: 3px solid #0284c7;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  z-index: 1;
}

.workflow-step-item.active .step-circle {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
  transform: scale(1.1);
}

.step-line {
  width: 3px;
  flex: 1;
  background: linear-gradient(to bottom, #3b82f6, #93c5fd);
  margin-top: 0.25rem;
  min-height: 30px;
}

.step-content-preview {
  flex: 1;
  padding-top: 0.25rem;
}

.step-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.step-subtitle {
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.4;
}

.daily-work-form {
  padding: 1rem;
}

.input-group-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .input-group-row {
    grid-template-columns: 1fr;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-range-group .time-range-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-range-group .time-input {
  width: 80px;
  text-align: center;
}

.time-range-group .time-separator {
  font-weight: bold;
  color: #6c757d;
}

.time-range-group .time-total {
  font-size: 0.9rem;
  color: #6c757d;
  margin-left: 0.5rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Attendees Section Styling */
.colleague-search {
  margin-bottom: 1rem;
  width: 100%;
}

.colleague-search :deep(.p-autocomplete) {
  width: 100%;
}

.colleague-search :deep(.p-autocomplete-input) {
  width: 100%;
}

.email-input-section {
  margin-bottom: 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

.input-with-button {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
}

.input-with-button input {
  flex: 1;
  min-width: 0;
}

.add-email-btn {
  min-width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #007bff;
  border: none;
  color: white;
  transition: all 0.2s ease;
}

.add-email-btn:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.add-email-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.selected-attendees {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  max-width: 100%;
  overflow: hidden;
}

.attendees-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.attendees-title::before {
  content: '👥';
  font-size: 1rem;
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
  border: 1px solid #dee2e6;
  border-radius: 6px;
  transition: all 0.2s ease;
  max-width: 100%;
  overflow: hidden;
}

.attendee-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.attendee-details {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.attendee-name {
  font-weight: 500;
  color: #212529;
  font-size: 0.9rem;
  word-break: break-all;
  overflow-wrap: break-word;
}

.attendee-position,
.attendee-department {
  font-size: 0.8rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 4px;
}

.attendee-position i,
.attendee-department i {
  font-size: 0.7rem;
}

.remove-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #dc3545;
  border: none;
  color: white;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #c82333;
  transform: scale(1.1);
}

.no-attendees {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  margin-top: 1rem;
}

.no-attendees i {
  font-size: 1.2rem;
  opacity: 0.7;
}

/* User Option Styling */
.user-option {
  padding: 0.5rem 0;
}

.user-name {
  font-weight: 500;
  color: #212529;
  font-size: 0.9rem;
}

.user-role {
  font-size: 0.8rem;
  color: #6c757d;
}

/* Input Styling */
.corporate-input {
  border: 1px solid #ced4da;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.corporate-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  outline: none;
}

.field-hint {
  color: #6c757d;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Event Details Section */
.event-details-section {
  margin-top: 0.5rem;
}

.corporate-textarea {
  width: 100%;
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;
  background: #fff;
}

.corporate-textarea:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  outline: none;
}

.corporate-textarea::placeholder {
  color: #6c757d;
  font-style: italic;
}

.field-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #ffc107;
}

.field-hint i {
  color: #ffc107;
  font-size: 0.9rem;
}

/* Teams Meeting Section */
.event-details-group {
  margin-top: 1.5rem;
}

.teams-meeting-section {
  padding: 1rem;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border: 1px solid #bbdefb;
  border-radius: 8px;
  margin-top: 1rem;
}

.teams-meeting-section .checkbox-group {
  margin-bottom: 0.5rem;
}

.teams-meeting-section .checkbox-label {
  font-weight: 500;
  color: #1976d2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.teams-meeting-section .checkbox-label i {
  color: #1976d2;
  font-size: 1.1rem;
}

.teams-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.8rem;
  font-style: italic;
  margin-top: 0.5rem;
}

.teams-hint i {
  color: #1976d2;
  font-size: 0.9rem;
}

.calendar-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #dee2e6;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
  transition: all 0.3s ease;
}

.calendar-section:hover {
  border-color: #007bff;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.calendar-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.calendar-main-label {
  font-weight: 600;
  font-size: 1.1rem;
  color: #495057;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s ease;
}

.calendar-main-label i {
  font-size: 1.2rem;
  color: #007bff;
}

.calendar-description {
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.4;
  margin-left: 2.5rem;
}

.calendar-options {
  margin: 1.5rem 0;
  padding: 2rem;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border: 2px solid #3b82f6;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.12);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.options-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e7ff;
}

.calendar-main-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: #1e40af;
  font-size: 1.1rem;
  margin: 0;
}

.calendar-main-label i {
  font-size: 1.3rem;
  color: #3b82f6;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.input-label i {
  color: #3b82f6;
  font-size: 1rem;
}

.teams-meeting-section {
  background: #f0f9ff;
  padding: 1.25rem;
  border-radius: 12px;
  border: 2px solid #bfdbfe;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1e40af;
  font-size: 1rem;
  cursor: pointer;
  margin: 0;
}

.checkbox-label i {
  color: #3b82f6;
  font-size: 1.1rem;
}

.teams-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.85rem;
  margin-left: 2rem;
}

.teams-hint i {
  color: #3b82f6;
}

.event-details-group {
  margin: 1.5rem 0;
}

.event-details-group textarea {
  border: 2px solid #e0e7ff;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.event-details-group textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.attendees-section {
  margin-top: 2rem;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.attendees-section :deep(.p-autocomplete) {
  width: 100% !important;
  max-width: 100% !important;
}

.attendees-section :deep(.p-autocomplete-input) {
  width: 100% !important;
  text-overflow: ellipsis;
}

.attendees-section :deep(.p-autocomplete-panel) {
  position: fixed !important;
  max-width: calc(100vw - 2rem) !important;
  left: 1rem !important;
  right: 1rem !important;
  width: calc(100vw - 2rem) !important;
}

.attendees-section :deep(.p-autocomplete-items) {
  max-width: 100%;
}

.attendees-section :deep(.p-autocomplete-item) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.attendees-section .user-option {
  max-width: 100%;
  overflow: hidden;
}

.attendees-section .user-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.input-group-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #fefce8;
  border-radius: 8px;
  border: 2px dashed #fbbf24;
}

.input-group-row .input-label {
  color: #92400e;
}

.input-group-row .input-label i {
  color: #f59e0b;
}

.field-hint {
  color: #6c757d;
  font-style: italic;
  margin-top: 0.25rem;
  display: block;
}

.full-width {
  grid-column: 1 / -1;
}

.corporate-input,
.corporate-dropdown {
  border: 2px solid #e9ecef;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.corporate-input:focus,
.corporate-dropdown:focus {
  border-color: #28a745;
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
  outline: none;
}

.status-display,
.status-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.emoji {
  font-size: 1.2rem;
}

.readonly-field {
  background: #f8f9fa;
  color: #6c757d;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 2px solid #e9ecef;
}

.form-actions .p-button {
  min-width: 120px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
}

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
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.file-item i {
  color: #6c757d;
  font-size: 1rem;
}

.file-name {
  flex: 1;
  font-size: 0.9rem;
  color: #495057;
  word-break: break-all;
}

:deep(.p-dropdown) {
  width: 100%;
}

:deep(.p-calendar) {
  width: 100%;
}

:deep(.p-inputtext) {
  width: 100%;
}

:deep(.p-textarea) {
  width: 100%;
  resize: vertical;
}

:deep(.p-divider) {
  margin: 1.5rem 0;
}

.status-display,
.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-display .emoji,
.status-option .emoji {
  font-size: 16px;
}

.status-display i,
.status-option i {
  color: #4A90E2;
  font-size: 14px;
}

@media (max-width: 768px) {
  .daily-work-form {
    padding: 0.75rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .p-button {
    width: 100%;
  }

  .corporate-input,
  .corporate-dropdown {
    font-size: 16px !important;
  }

  .attendees-section {
    width: 100%;
    overflow: hidden;
  }

  .colleague-search :deep(.p-autocomplete) {
    width: 100% !important;
    max-width: 100% !important;
  }

  .colleague-search :deep(.p-autocomplete-input) {
    width: 100% !important;
  }

  .attendee-name {
    word-break: break-all;
    font-size: 0.85rem;
  }

  .input-with-button input {
    min-width: 0;
  }

  .selected-attendees {
    padding: 0.75rem;
  }

  .attendee-card {
    padding: 0.5rem;
  }

  .colleague-search :deep(.p-autocomplete-dropdown) {
    width: 40px !important;
  }

  /* Step chips responsive */
  .selected-chips {
    gap: 0.35rem;
  }

  .step-chip {
    padding: 0.4rem 0.5rem;
    font-size: 0.8rem;
  }

  .chip-name {
    font-size: 0.8rem;
    word-break: break-word;
  }

  .chip-details {
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-left: 1.5rem;
    font-size: 0.7rem;
  }

  .chip-badge {
    width: 18px;
    height: 18px;
    font-size: 0.65rem;
  }

  /* Dropdown options responsive */
  .step-option {
    padding: 0.4rem 0.5rem;
  }

  .step-badge {
    width: 20px;
    height: 20px;
    font-size: 0.65rem;
  }

  .step-desc {
    font-size: 0.75rem;
    margin-left: 1.5rem;
  }

  .step-meta {
    margin-left: 1.5rem;
    font-size: 0.7rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .daily-work-form {
    padding: 0.5rem;
  }

  .input-label {
    font-size: 0.8rem;
  }

  .form-grid {
    gap: 0.75rem;
  }

  .chip-main {
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .chip-status {
    margin-left: 0;
    font-size: 0.65rem;
  }

  .chip-details {
    margin-left: 0;
  }
}
</style>
