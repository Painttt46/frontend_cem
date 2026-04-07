<template>
  <div class="form-wrap">
    <Toast />
    <form @submit.prevent="submitForm" class="dwf">

      <!-- วันที่ -->
      <div class="section date-section">
        <label class="field-label"><i class="pi pi-calendar"></i> วันที่ลงงาน <span class="req">*</span></label>
        <Calendar id="workDate" v-model="formData.workDate" dateFormat="dd/mm/yy" class="w-full" :minDate="minDate" required />
      </div>

      <!-- โครงการ -->
      <div class="section">
        <div class="section-header">
          <span class="section-title"><i class="pi pi-briefcase"></i> โครงการที่ทำวันนี้ <span class="req">*</span></span>
          <Button type="button" icon="pi pi-plus" label="เพิ่มโครงการ" size="small" severity="secondary" outlined @click="addTaskEntry" />
        </div>

        <div v-for="(entry, idx) in taskEntries" :key="idx" class="entry-card">
          <!-- Header: เลข + dropdown + ลบ -->
          <div class="entry-top">
            <span class="entry-badge">{{ idx + 1 }}</span>
            <div class="entry-dropdown-wrap">
              <Dropdown
                v-model="entry.taskId" :options="tasks" optionLabel="display" optionValue="id"
                class="w-full" placeholder="เลือกโครงการ"
                @change="onTaskEntryChange(entry)"
                filter filterPlaceholder="ค้นหาชื่อโครงการ / เลข SO"
                :filterFields="['task_name','so_number','display']"
                scrollHeight="300px" appendTo="body">
                <template #value="{ value }">
                  <div v-if="value" class="val-row">
                    <span v-if="getTaskSO(value)" class="so-tag">{{ getTaskSO(value) }}</span>
                    <span class="task-txt">{{ getTaskName(value) }}</span>
                  </div>
                  <span v-else class="ph">เลือกโครงการ</span>
                </template>
                <template #option="{ option }">
                  <div class="opt-row" :class="{ 'opt-mine': option._assigned }">
                    <span v-if="option._assigned" class="mine-tag"><i class="pi pi-star-fill"></i> งานของฉัน</span>
                    <span v-if="option.so_number" class="so-tag">{{ option.so_number }}</span>
                    <span class="task-txt">{{ option.task_name }}</span>
                  </div>
                </template>
              </Dropdown>
            </div>
            <Button v-if="taskEntries.length > 1" type="button" icon="pi pi-times" severity="danger" text rounded size="small" @click="removeTaskEntry(idx)" />
          </div>

          <!-- เวลา -->
          <div class="time-row">
            <div class="time-fields">
              <div class="time-field">
                <label class="field-label-sm">เริ่ม</label>
                <InputText v-model="entry.startTimeText" class="time-input" :class="{ 'p-invalid': entry.startTimeError }"
                  maxlength="5" inputmode="numeric"
                  @input="formatEntryTime(entry, 'startTimeText'); entry.startTimeError = false"
                  @blur="parseEntryStartTime(entry)" required />
              </div>
              <span class="time-sep">—</span>
              <div class="time-field">
                <label class="field-label-sm">สิ้นสุด</label>
                <InputText v-model="entry.endTimeText" class="time-input" :class="{ 'p-invalid': entry.endTimeError }"
                  maxlength="5" inputmode="numeric"
                  @input="formatEntryTime(entry, 'endTimeText'); entry.endTimeError = false"
                  @blur="parseEntryEndTime(entry)" required />
              </div>
            </div>
            <div class="time-total-pill">
              <i class="pi pi-clock"></i> {{ calcEntryHours(entry) }}
            </div>
          </div>

          <!-- Steps -->
          <div v-if="entry.taskId && getStepsForTask(entry.taskId).length > 0" class="field-row">
            <label class="field-label"><i class="pi pi-list-check"></i> ขั้นตอน</label>
            <MultiSelect v-model="entry.stepIds" :options="getStepsForTask(entry.taskId)"
              optionLabel="step_name" optionValue="id" :optionDisabled="isStepCompleted"
              class="w-full" placeholder="เลือก step (ถ้ามี)"
              filter filterPlaceholder="ค้นหา step..." scrollHeight="300px" appendTo="body">
              <template #value="{ value }">
                <div v-if="value && value.length" class="chips-wrap">
                  <div v-for="sid in value" :key="sid" class="step-chip"
                    :style="{ borderColor: getStepStatusColor(getStepByIdFromTask(sid, entry.taskId)) }">
                    <span class="chip-num" :style="{ background: getStepStatusColor(getStepByIdFromTask(sid, entry.taskId)) }">{{ getStepNumberFromTask(sid, entry.taskId) }}</span>
                    <span class="chip-name">{{ getStepByIdFromTask(sid, entry.taskId)?.step_name }}</span>
                    <i class="pi pi-times chip-x" @click.stop="entry.stepIds = entry.stepIds.filter(i => i !== sid)"></i>
                  </div>
                </div>
                <span v-else class="ph">เลือก step (ถ้ามี)</span>
              </template>
              <template #option="{ option, index }">
                <div class="step-opt" :style="{ borderLeftColor: getStepStatusColor(option) }">
                  <span class="step-num-badge" :style="{ background: getStepStatusColor(option) }">{{ index + 1 }}</span>
                  <div class="step-opt-body">
                    <div class="step-opt-top">
                      <span class="step-opt-name">{{ option.step_name }}</span>
                      <span class="step-status-tag" :style="{ color: getStepStatusColor(option), borderColor: getStepStatusColor(option) + '40', background: getStepStatusColor(option) + '15' }">
                        <i class="pi pi-circle-fill" style="font-size:0.45rem"></i> {{ getStepStatusLabel(option) }}
                      </span>
                    </div>
                    <div v-if="option.start_date || option.end_date" class="step-opt-dates">
                      <i class="pi pi-calendar"></i>
                      <span v-if="option.start_date">{{ new Date(option.start_date).toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'2-digit' }) }}</span>
                      <span v-if="option.start_date && option.end_date"> – </span>
                      <span v-if="option.end_date">{{ new Date(option.end_date).toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'2-digit' }) }}</span>
                    </div>
                    <div v-if="option.description" class="step-opt-desc">{{ option.description }}</div>
                  </div>
                </div>
              </template>
            </MultiSelect>
          </div>

          <!-- สถานที่ -->
          <div class="field-row">
            <label class="field-label"><i class="pi pi-map-marker"></i> สถานที่ <span class="req">*</span></label>
            <InputText v-model="entry.location" required class="w-full" placeholder="ระบุสถานที่หรือที่อยู่" />
          </div>

          <!-- รายละเอียด -->
          <div class="field-row">
            <label class="field-label"><i class="pi pi-align-left"></i> รายละเอียดงานที่ทำ <span class="req">*</span></label>
            <Textarea v-model="entry.workDescription" rows="3" required class="w-full" />
          </div>

          <!-- แนบไฟล์ -->
          <div class="field-row">
            <label class="field-label"><i class="pi pi-paperclip"></i> แนบไฟล์</label>
            <input :ref="'fileInput_' + idx" @change="e => handleFileUploadEntry(e, entry)" type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple style="display:none">
            <Button type="button"
              :label="entry.files?.length > 0 ? `${entry.files.length} ไฟล์ที่เลือก` : 'เลือกไฟล์'"
              icon="pi pi-upload" severity="secondary" outlined size="small"
              @click="$refs['fileInput_' + idx][0].click()" />
            <div v-if="entry.files?.length > 0" class="file-list">
              <div v-for="(file, fi) in entry.files" :key="fi" class="file-item">
                <i class="pi pi-file-pdf" v-if="file.name.endsWith('.pdf')"></i>
                <i class="pi pi-image" v-else-if="/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)"></i>
                <i class="pi pi-file" v-else></i>
                <span class="file-name">{{ file.name }}</span>
                <Button icon="pi pi-times" size="small" severity="danger" text @click="entry.files.splice(fi,1)" />
              </div>
            </div>
          </div>

          <!-- Calendar / Teams -->
          <div class="cal-section">
            <div class="cal-header"><i class="pi pi-calendar-plus"></i> Calendar / MS Teams</div>
            <div class="field-row">
              <InputText v-model="entry.eventTitle" class="w-full" placeholder="หัวข้อ Calendar Event" />
            </div>
            <div class="field-row">
              <textarea v-model="entry.eventDetails" rows="2" class="cal-textarea" placeholder="รายละเอียดเพิ่มเติม..." />
            </div>
            <div class="teams-toggle">
              <Checkbox v-model="entry.createTeamsMeeting" :inputId="'teams_' + idx" :binary="true" />
              <label :for="'teams_' + idx" class="teams-label"><i class="pi pi-video"></i> สร้าง MS Teams Meeting</label>
            </div>
            <div v-if="entry.createTeamsMeeting" class="meeting-time-grid">
              <div class="meeting-time-field">
                <label class="field-label-sm"><i class="pi pi-clock"></i> เวลาเริ่ม</label>
                <InputText 
                  v-model="entry.meetingStartTimeText" 
                  class="meeting-time-input"
                  :class="{ 'p-invalid': entry.meetingStartTimeError }"
                  maxlength="5" 
                  inputmode="numeric"
                  @input="formatMeetingTime(entry, 'meetingStartTimeText'); entry.meetingStartTimeError = false"
                  @blur="parseMeetingStartTime(entry)" />
              </div>
              <span class="meeting-time-separator">—</span>
              <div class="meeting-time-field">
                <label class="field-label-sm"><i class="pi pi-clock"></i> เวลาสิ้นสุด</label>
                <InputText 
                  v-model="entry.meetingEndTimeText" 
                  class="meeting-time-input"
                  :class="{ 'p-invalid': entry.meetingEndTimeError }"
                  maxlength="5" 
                  inputmode="numeric"
                  @input="formatMeetingTime(entry, 'meetingEndTimeText'); entry.meetingEndTimeError = false"
                  @blur="parseMeetingEndTime(entry)" />
              </div>
            </div>
            <div v-if="entry.createTeamsMeeting" class="attendees-section">
              <label class="field-label-sm" style="margin-bottom: 0.5rem; display: block;">
                <i class="pi pi-users"></i> เชิญผู้เข้าร่วม
              </label>
              <AutoComplete 
                v-model="entry.selectedAttendee" 
                :suggestions="filteredAttendees"
                @complete="searchAttendees"
                @item-select="(e) => onAttendeeSelect(e, entry)"
                optionLabel="name"
                placeholder="ค้นหาชื่อ หรือ อีเมล..."
                class="w-full"
                forceSelection
                :dropdown="true"
                @dropdown-click="showAllAttendees">
                <template #option="slotProps">
                  <div class="attendee-option">
                    <div class="attendee-name">{{ slotProps.option.name }}</div>
                    <div class="attendee-email">{{ slotProps.option.email }}</div>
                  </div>
                </template>
              </AutoComplete>
              <div v-if="entry.attendees && entry.attendees.length > 0" class="attendees-list">
                <div v-for="(att, ai) in entry.attendees" :key="ai" class="attendee-chip">
                  <i class="pi pi-user"></i>
                  <span class="attendee-chip-name">{{ att.name }}</span>
                  <i class="pi pi-times attendee-chip-remove" @click="entry.attendees.splice(ai, 1)"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <Button type="button" label="ล้างข้อมูล" icon="pi pi-refresh" severity="secondary" outlined @click="resetForm" />
        <Button type="submit" label="บันทึกงาน" icon="pi pi-check" severity="success" />
      </div>
    </form>
  </div>
</template>
<script>
/* eslint-disable no-unused-vars */
import axios from '@/utils/axiosConfig'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import MultiSelect from 'primevue/multiselect'
import AutoComplete from 'primevue/autocomplete'

import { isValidTimeRange } from '@/utils/validation'
import { isActive } from '@/utils/statusHelper'

export default {
  name: 'DailyWorkForm',
  components: { Checkbox, Button, MultiSelect, AutoComplete },
  inject: ['$toast'],
  created() {
    this.$http = axios
  },
  data() {
    return {
      tasks: [],
      workflowStepsMap: {},
      taskEntries: [{ 
        taskId: null, stepIds: [], location: '', workDescription: '', files: [], 
        eventTitle: '', eventDetails: '', createTeamsMeeting: false, 
        meetingStartTime: null, meetingEndTime: null, 
        meetingStartTimeText: '', meetingEndTimeText: '',
        meetingStartTimeError: false, meetingEndTimeError: false,
        startTimeText: '', endTimeText: '', 
        startTime: null, endTime: null, attendees: [], selectedAttendee: null
      }],
      minDate: new Date(),
      formData: { workDate: new Date() },
      statusOptions: [],
      users: [],
      filteredAttendees: []
    }
  },
  async mounted() {
    await this.loadTasks()
    await this.loadUsers()
    this.loadStatusOptions()
    // ตั้งค่าเริ่มต้นเวลาปัจจุบัน
    const now = new Date()
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
    if (this.taskEntries[0]) {
      this.taskEntries[0].startTimeText = timeStr
      this.taskEntries[0].startTime = new Date(now)
    }
  },
  methods: {
    async loadTasks() {
      try {
        const userId = localStorage.getItem('soc_user_id')
        const [tasksRes, stepsRes] = await Promise.all([
          axios.get('/api/tasks'),
          axios.get('/api/task-steps/all')
        ])
        const availableTasks = tasksRes.data.filter(task => isActive(task.status))
        const assignedTaskIds = new Set(
          stepsRes.data.filter(s => {
            const users = typeof s.assigned_users === 'string' ? JSON.parse(s.assigned_users) : s.assigned_users
            return users?.some(u => String(u.id || u) === String(userId))
          }).map(s => s.task_id)
        )
        this.tasks = availableTasks.map(task => ({
          ...task,
          _assigned: assignedTaskIds.has(task.id),
          display: `${task.task_name} ${task.so_number ? `(${task.so_number})` : ''}`
        })).sort((a, b) => (b._assigned ? 1 : 0) - (a._assigned ? 1 : 0))
      } catch (e) { console.error(e) }
    },
    async onTaskEntryChange(entry) {
      entry.stepIds = []
      if (entry.taskId && !this.workflowStepsMap[entry.taskId]) {
        try {
          const res = await axios.get(`/api/task-steps/task/${entry.taskId}`)
          this.workflowStepsMap[entry.taskId] = res.data || []
        } catch (e) { console.error(e) }
      }
    },
    formatEntryTime(entry, field) {
      let digits = (entry[field] || '').replace(/\D/g, '')
      // clamp hours ≤ 23
      if (digits.length >= 2) {
        let h = parseInt(digits.slice(0, 2), 10)
        if (h > 23) { h = 23; digits = '23' + digits.slice(2) }
      }
      // clamp minutes ≤ 59
      if (digits.length >= 4) {
        let m = parseInt(digits.slice(2, 4), 10)
        if (m > 59) { digits = digits.slice(0, 2) + '59' }
      }
      if (digits.length >= 2) digits = digits.slice(0, 2) + ':' + digits.slice(2, 4)
      entry[field] = digits.slice(0, 5)
    },
    parseEntryStartTime(entry) {
      const parts = entry.startTimeText.split(':')
      if (parts.length === 2) {
        const [h, m] = parts.map(Number)
        if (h >= 0 && h < 24 && m >= 0 && m < 60) {
          const d = new Date(); d.setHours(h, m, 0, 0)
          entry.startTime = d
          // Auto-fill meeting start time if empty
          if (!entry.meetingStartTimeText && entry.createTeamsMeeting) {
            entry.meetingStartTimeText = entry.startTimeText
            entry.meetingStartTime = new Date(d)
          }
        }
      }
    },
    parseEntryEndTime(entry) {
      const parts = entry.endTimeText.split(':')
      if (parts.length === 2) {
        const [h, m] = parts.map(Number)
        if (h >= 0 && h < 24 && m >= 0 && m < 60) {
          const d = new Date(); d.setHours(h, m, 0, 0)
          entry.endTime = d
          // Auto-fill meeting end time if empty
          if (!entry.meetingEndTimeText && entry.createTeamsMeeting) {
            entry.meetingEndTimeText = entry.endTimeText
            entry.meetingEndTime = new Date(d)
          }
        }
      }
    },
    formatMeetingTime(entry, field) {
      let digits = (entry[field] || '').replace(/\D/g, '')
      // clamp hours ≤ 23
      if (digits.length >= 2) {
        let h = parseInt(digits.slice(0, 2), 10)
        if (h > 23) { h = 23; digits = '23' + digits.slice(2) }
      }
      // clamp minutes ≤ 59
      if (digits.length >= 4) {
        let m = parseInt(digits.slice(2, 4), 10)
        if (m > 59) { digits = digits.slice(0, 2) + '59' }
      }
      if (digits.length >= 2) digits = digits.slice(0, 2) + ':' + digits.slice(2, 4)
      entry[field] = digits.slice(0, 5)
    },
    parseMeetingStartTime(entry) {
      const parts = entry.meetingStartTimeText.split(':')
      if (parts.length === 2) {
        const [h, m] = parts.map(Number)
        if (h >= 0 && h < 24 && m >= 0 && m < 60) {
          const d = new Date(); d.setHours(h, m, 0, 0)
          entry.meetingStartTime = d
          entry.meetingStartTimeError = false
        } else {
          entry.meetingStartTimeError = true
        }
      } else if (entry.meetingStartTimeText) {
        entry.meetingStartTimeError = true
      }
    },
    parseMeetingEndTime(entry) {
      const parts = entry.meetingEndTimeText.split(':')
      if (parts.length === 2) {
        const [h, m] = parts.map(Number)
        if (h >= 0 && h < 24 && m >= 0 && m < 60) {
          const d = new Date(); d.setHours(h, m, 0, 0)
          entry.meetingEndTime = d
          entry.meetingEndTimeError = false
        } else {
          entry.meetingEndTimeError = true
        }
      } else if (entry.meetingEndTimeText) {
        entry.meetingEndTimeError = true
      }
    },
    calcEntryHours(entry) {
      if (!entry.startTime || !entry.endTime) return '0 ชั่วโมง'
      let diff = (entry.endTime - entry.startTime) / 3600000
      if (diff < 0) diff += 24
      const sh = entry.startTime.getHours() + entry.startTime.getMinutes()/60
      const eh = entry.endTime.getHours() + entry.endTime.getMinutes()/60
      if (sh < 13 && eh > 12) diff -= (Math.min(eh, 13) - Math.max(sh, 12))
      return `${Math.max(0, diff).toFixed(1)} ชม.`
    },
    addTaskEntry() {
      this.taskEntries.push({ 
        taskId: null, stepIds: [], location: '', workDescription: '', files: [], 
        eventTitle: '', eventDetails: '', createTeamsMeeting: false, 
        meetingStartTime: null, meetingEndTime: null,
        meetingStartTimeText: '', meetingEndTimeText: '',
        meetingStartTimeError: false, meetingEndTimeError: false,
        startTimeText: '', endTimeText: '', attendees: [], selectedAttendee: null
      })
    },
    removeTaskEntry(idx) { this.taskEntries.splice(idx, 1) },
    getStepsForTask(id) { return this.workflowStepsMap[id] || [] },
    getStepByIdFromTask(sid, tid) { return this.getStepsForTask(tid).find(s => s.id === sid) },
    getStepNumberFromTask(sid, tid) { return this.getStepsForTask(tid).findIndex(s => s.id === sid) + 1 },
    getStepStatusColor(step) {
      if (!step) return '#9ca3af'
      if (step.status === 'completed') return '#10b981'
      const today = new Date(); today.setHours(0,0,0,0)
      if (step.end_date && today > new Date(step.end_date).setHours(0,0,0,0)) return '#ef4444'
      if (step.has_work_logged) return '#f59e0b'
      return '#9ca3af'
    },
    getStepStatusLabel(step) {
      if (!step) return 'รอดำเนินการ'
      if (step.status === 'completed') return 'เสร็จสิ้น'
      const today = new Date(); today.setHours(0,0,0,0)
      if (step.end_date && today > new Date(step.end_date).setHours(0,0,0,0)) return 'เกินกำหนด'
      if (step.has_work_logged) return 'กำลังดำเนินการ'
      return 'รอดำเนินการ'
    },
    isStepCompleted(step) { return step?.status === 'completed' },
    getTaskSO(id) { return this.tasks.find(t => t.id === id)?.so_number },
    getTaskName(id) { return this.tasks.find(t => t.id === id)?.task_name },
    handleFileUploadEntry(event, entry) { entry.files = [...(entry.files || []), ...Array.from(event.target.files)] },
    async loadUsers() {
      try {
        const response = await this.$http.get('/api/users')
        this.users = response.data.map(user => ({
          ...user,
          name: `${user.firstname} ${user.lastname}${user.nickname ? ` (${user.nickname})` : ''}`.trim(),
          email: user.email
        }))
        this.users.unshift({
          name: 'Engineers Group',
          email: 'engineers@gent-s.com',
          position: 'Group Email',
          department: 'Engineer'
        })
      } catch (err) {
        console.error('Load users error:', err)
      }
    },
    searchAttendees(event) {
      const query = event.query.toLowerCase().trim()
      if (query) {
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
    onAttendeeSelect(event, entry) {
      const attendee = event.value
      if (attendee && attendee.email) {
        const exists = entry.attendees.some(a => a.email === attendee.email)
        if (!exists) {
          entry.attendees.push({
            email: attendee.email,
            name: attendee.name,
            position: attendee.position || '',
            department: attendee.department || ''
          })
        }
      }
      this.$nextTick(() => {
        entry.selectedAttendee = null
      })
    },
    loadStatusOptions() {
      const saved = localStorage.getItem('work_statuses')
      this.statusOptions = saved ? JSON.parse(saved) : []
    },
    async uploadFilesForEntry(entry) {
      if (!entry.files || entry.files.length === 0) return []
      
      try {
        const formData = new FormData()
        entry.files.forEach(file => formData.append('files', file))
        
        const response = await this.$http.post('/api/files/upload?type=daily_work', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data.files || []
      } catch (error) {
        console.error('File upload error:', error)
        this.$toast.add({ 
          severity: 'error', 
          summary: 'อัปโหลดไฟล์ไม่สำเร็จ', 
          detail: error.response?.data?.error || error.message, 
          life: 5000 
        })
        return []
      }
    },
    async submitForm() {
      // Validate
      if (!this.formData.workDate) {
        this.$toast.add({ severity: 'warn', summary: 'กรุณาเลือกวันที่', life: 3000 })
        return
      }

      const validEntries = this.taskEntries.filter(e => e.taskId)
      if (validEntries.length === 0) {
        this.$toast.add({ severity: 'error', summary: 'ข้อผิดพลาด', detail: 'กรุณาเลือกโครงการอย่างน้อย 1 รายการ', life: 3000 })
        return
      }

      // Validate time and required fields
      for (const e of validEntries) {
        if (!e.startTime || !e.endTime) {
          this.$toast.add({ severity: 'error', summary: 'ข้อผิดพลาด', detail: 'กรุณากรอกเวลาเริ่มและสิ้นสุดให้ครบทุกโครงการ', life: 3000 })
          return
        }
        if (!e.location || !e.workDescription) {
          this.$toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบ', detail: 'สถานที่และรายละเอียดงานเป็นข้อมูลที่จำเป็น', life: 3000 })
          return
        }
      }

      try {
        const userId = localStorage.getItem('soc_user_id')
        const submittedAt = new Date().toISOString()

        await Promise.all(validEntries.map(async entry => {
          const uploadedFiles = await this.uploadFilesForEntry(entry)
          
          // Auto-build event_details from selected steps
          const steps = (entry.stepIds || []).map(id => this.getStepByIdFromTask(id, entry.taskId)).filter(Boolean)
          const stepDetails = steps.length > 0
            ? 'Steps:\n' + steps.map((s, i) => `${i + 1}. ${s.step_name}${s.description ? ' - ' + s.description : ''}`).join('\n')
            : ''
          const eventDetails = [stepDetails, entry.eventDetails].filter(Boolean).join('\n\n')

          // Calculate total hours
          let totalHours = 0
          if (entry.startTime && entry.endTime) {
            const start = new Date(entry.startTime)
            let end = new Date(entry.endTime)
            if (end <= start) end.setDate(end.getDate() + 1)
            let diff = (end - start) / 3600000
            const sh = start.getHours() + start.getMinutes() / 60
            const eh = end.getHours() + end.getMinutes() / 60
            if (sh < 13 && eh > 12) diff -= (Math.min(eh, 13) - Math.max(sh, 12))
            totalHours = Math.max(0, diff)
          }

          return this.$http.post('/api/daily-work', {
            task_id: entry.taskId,
            step_ids: entry.stepIds.length > 0 ? entry.stepIds : [null],
            work_date: this.formatDate(this.formData.workDate),
            start_time: this.formatTime(entry.startTime),
            end_time: this.formatTime(entry.endTime),
            total_hours: totalHours,
            location: entry.location,
            work_description: entry.workDescription,
            files: uploadedFiles,
            user_id: userId,
            submitted_at: submittedAt,
            create_calendar_event: !!(entry.eventTitle && entry.createTeamsMeeting),
            event_title: entry.eventTitle || '',
            event_details: eventDetails,
            create_teams_meeting: entry.createTeamsMeeting || false,
            meeting_start_time: entry.createTeamsMeeting ? this.formatTime(entry.meetingStartTime || entry.startTime) : null,
            meeting_end_time: entry.createTeamsMeeting ? this.formatTime(entry.meetingEndTime || entry.endTime) : null,
            attendees: entry.attendees || []
          })
        }))

        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: `บันทึกงานรายวัน ${validEntries.length} โครงการเรียบร้อยแล้ว`,
          life: 3000
        })

        window.dispatchEvent(new CustomEvent('taskUpdated'))
        window.dispatchEvent(new CustomEvent('taskStatusChanged'))
        this.$emit('submit-work')
      } catch (err) {
        console.error('Submit error:', err)
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: err.response?.data?.error || err.userMessage || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
          life: 5000
        })
      }
    },
    formatDate(date) {
      if (!date) return null
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    },
    formatTime(date) {
      if (!date) return null
      if (typeof date === 'string' && /^\d{2}:\d{2}/.test(date)) return date.slice(0, 5)
      const d = new Date(date)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },
    resetForm() {
      if (!confirm('ล้างข้อมูลทั้งหมด?')) return
      location.reload()
    }
  }
}
</script>

<style scoped>
/* ── Layout ── */
.form-wrap { 
  background: transparent; 
  min-height: 100%; 
}

.dwf { 
  padding: 0; 
  display: flex; 
  flex-direction: column; 
  gap: 0; 
  max-width: 100%; 
}

/* ── Section ── */
.section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: all 0.2s;
}

.section:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.date-section { 
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #bfdbfe;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1rem;
}

.section-title { 
  font-weight: 700; 
  color: #1e3a8a; 
  font-size: 1rem; 
  display: flex; 
  align-items: center; 
  gap: 8px; 
}

.section-title i { 
  color: #3b82f6; 
  font-size: 1.1rem;
}

/* ── Entry Card ── */
.entry-card {
  border: 2px solid #e2e8f0;
  border-left: 4px solid #3b82f6;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.2s;
}

.entry-card:hover {
  border-left-color: #2563eb;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.entry-card:last-child { 
  margin-bottom: 0; 
}

/* ── Entry Top ── */
.entry-top { 
  display: flex; 
  align-items: center; 
  gap: 10px; 
  margin-bottom: 1rem; 
}

.entry-badge {
  width: 32px; 
  height: 32px; 
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff; 
  font-size: 0.85rem; 
  font-weight: 700;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  flex-shrink: 0;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.entry-dropdown-wrap { 
  flex: 1; 
  min-width: 0; 
}

/* ── Time Row ── */
.time-row {
  display: flex; align-items: center; justify-content: space-between;
  background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 0.6rem 0.9rem; margin-bottom: 0.75rem; gap: 0.75rem; flex-wrap: wrap;
}
.time-fields { display: flex; align-items: flex-end; gap: 0.5rem; }
.time-field { display: flex; flex-direction: column; gap: 2px; }
.time-sep { font-weight: 600; color: #94a3b8; padding-bottom: 4px; }
.time-input { width: 72px !important; text-align: center; font-size: 1rem; padding: 0.4rem 0.3rem !important; }
.time-total-pill {
  background: #dbeafe; color: #1d4ed8; border-radius: 20px;
  padding: 4px 12px; font-size: 0.82rem; font-weight: 600;
  display: flex; align-items: center; gap: 4px; white-space: nowrap;
}

/* ── Fields ── */
.field-row { margin-bottom: 0.75rem; }
.field-row:last-child { margin-bottom: 0; }
.field-label { font-weight: 600; color: #374151; font-size: 0.875rem; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 5px; }
.field-label i { color: #6b7280; font-size: 0.8rem; }
.field-label-sm { font-size: 0.78rem; color: #6b7280; font-weight: 500; margin-bottom: 2px; display: block; }
.req { color: #ef4444; }

/* ── Dropdown / Input ── */
.w-full { width: 100% !important; }
:deep(.p-dropdown), :deep(.p-multiselect), :deep(.p-calendar), :deep(.p-inputtext):not(.time-input) { width: 100% !important; }
:deep(.p-textarea) { width: 100% !important; resize: vertical; }

/* ── Dropdown options ── */
.val-row, .opt-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; max-width: 100%; overflow: hidden; }
.opt-mine { background: #fefce8; border-left: 3px solid #f59e0b; padding: 3px 6px; border-radius: 4px; width: 100%; box-sizing: border-box; }
.so-tag { background: #3b82f6; color: #fff; padding: 1px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; white-space: nowrap; }
.mine-tag { background: #f59e0b; color: #fff; font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 10px; flex-shrink: 0; white-space: nowrap; }
.task-txt { flex: 1; min-width: 0; word-break: break-word; line-height: 1.4; overflow-wrap: anywhere; }
.ph { color: #9ca3af; }

/* ── Step chips ── */
.chips-wrap { display: flex; flex-direction: column; gap: 4px; width: 100%; }
.step-chip { display: flex; align-items: center; gap: 6px; border-left: 3px solid; border-radius: 4px; padding: 4px 8px; background: #f8fafc; }
.chip-num { width: 20px; height: 20px; border-radius: 50%; color: #fff; font-size: 0.65rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.chip-name { flex: 1; font-size: 0.82rem; color: #334155; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chip-x { cursor: pointer; color: #94a3b8; font-size: 0.7rem; }
.chip-x:hover { color: #ef4444; }

/* ── Step option ── */
.step-opt { display: flex; align-items: flex-start; gap: 8px; border-left: 3px solid; padding: 6px 8px; border-radius: 0 6px 6px 0; background: #f8fafc; }
.step-num-badge { width: 24px; height: 24px; border-radius: 50%; color: #fff; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.step-opt-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.step-opt-top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.step-opt-name { flex: 1; font-weight: 600; font-size: 0.875rem; color: #1e293b; }
.step-status-tag { font-size: 0.7rem; font-weight: 600; white-space: nowrap; padding: 1px 7px; border-radius: 10px; border: 1px solid; display: flex; align-items: center; gap: 3px; }
.step-opt-dates { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #64748b; }
.step-opt-dates i { font-size: 0.7rem; }
.step-opt-desc { font-size: 0.75rem; color: #94a3b8; line-height: 1.4; white-space: pre-wrap; word-break: break-word; }

/* ── File list ── */
.file-list { margin-top: 0.5rem; display: flex; flex-direction: column; gap: 4px; }
.file-item { display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; }
.file-item i { color: #6b7280; }
.file-name { flex: 1; font-size: 0.82rem; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }

/* ── Calendar section ── */
.cal-section { 
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #bae6fd; 
  border-radius: 12px; 
  padding: 1rem; 
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.1);
  transition: all 0.2s;
}

.cal-section:hover {
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.2);
}

.cal-header { 
  color: #0369a1; 
  font-weight: 700; 
  font-size: 0.95rem; 
  margin-bottom: 0.75rem; 
  display: flex; 
  align-items: center; 
  gap: 8px; 
}

.cal-textarea { 
  width: 100%; 
  border: 2px solid #bae6fd; 
  border-radius: 8px; 
  padding: 0.75rem; 
  font-family: inherit; 
  font-size: 0.9rem; 
  resize: vertical; 
  background: #fff;
  transition: all 0.2s;
}

.cal-textarea:focus { 
  outline: none; 
  border-color: #38bdf8; 
  box-shadow: 0 0 0 3px rgba(56,189,248,0.15); 
}

.teams-toggle { 
  display: flex; 
  align-items: center; 
  gap: 10px; 
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.teams-label { 
  font-size: 0.9rem; 
  font-weight: 600; 
  color: #1d4ed8; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  gap: 6px;
  transition: color 0.2s;
}

.teams-label:hover {
  color: #1e40af;
}

.meeting-time-grid { 
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(254, 252, 232, 0.5), rgba(253, 246, 178, 0.3));
  border: 2px dashed #fbbf24;
  border-radius: 8px;
  animation: slideDown 0.3s ease-out;
}

.meeting-time-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.meeting-time-separator {
  font-size: 1.5rem;
  font-weight: 600;
  color: #f59e0b;
  padding-bottom: 0.25rem;
  flex-shrink: 0;
}

.meeting-time-input {
  width: 100% !important;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0.75rem !important;
  border: 2px solid #fbbf24 !important;
  border-radius: 8px;
  background: #fff;
  transition: all 0.2s;
}

.meeting-time-input:focus {
  border-color: #f59e0b !important;
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.2) !important;
}

.meeting-time-input.p-invalid {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
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

/* ── Actions ── */
.form-actions { 
  display: flex; 
  gap: 1rem; 
  justify-content: flex-end; 
  padding: 1.5rem 0 0.5rem; 
  margin-top: 1rem;
  border-top: 2px solid #e2e8f0; 
  position: sticky;
  bottom: 0;
  background: linear-gradient(to top, #ffffff 80%, transparent);
  z-index: 10;
}

.form-actions :deep(.p-button) {
  min-width: 140px;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.form-actions :deep(.p-button-success) {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.form-actions :deep(.p-button-success:hover) {
  background: linear-gradient(135deg, #059669, #047857);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  transform: translateY(-2px);
}

.form-actions :deep(.p-button-secondary) {
  background: #f1f5f9;
  color: #475569;
  border: 2px solid #e2e8f0;
}

.form-actions :deep(.p-button-secondary:hover) {
  background: #e2e8f0;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

/* ── Dropdown panel fix ── */
:deep(.p-dropdown-panel), :deep(.p-multiselect-panel) {
  max-width: calc(100vw - 2rem) !important;
}

/* ── Attendees Section ── */
.attendees-section {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 2px dashed #bae6fd;
  animation: slideDown 0.3s ease-out;
}

.attendee-option {
  padding: 0.5rem;
}

.attendee-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.attendee-email {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.15rem;
}

.attendees-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.attendee-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border: 1px solid #93c5fd;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #1e40af;
  transition: all 0.2s;
}

.attendee-chip:hover {
  background: linear-gradient(135deg, #bfdbfe, #93c5fd);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.attendee-chip i.pi-user {
  font-size: 0.75rem;
}

.attendee-chip-name {
  font-weight: 500;
}

.attendee-chip-remove {
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0.2rem;
  border-radius: 50%;
  transition: all 0.2s;
}

.attendee-chip-remove:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* ── Mobile ── */
@media (max-width: 640px) {
  .dwf { padding: 0; }
  .section { 
    padding: 1rem; 
    margin-bottom: 1rem;
    border-radius: 8px;
  }
  .entry-card { 
    padding: 1rem; 
    border-radius: 8px;
  }

  .entry-top { flex-wrap: wrap; gap: 8px; }
  .entry-dropdown-wrap { order: 3; width: 100%; }
  .entry-badge { order: 1; width: 28px; height: 28px; font-size: 0.8rem; }
  .entry-top .p-button { order: 2; margin-left: auto; }

  .time-row { flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem; }
  .time-fields { flex: 1; min-width: 0; gap: 0.5rem; }
  .time-field { flex: 1; min-width: 0; }
  .time-input { width: 100% !important; min-width: 0; font-size: 1rem; padding: 0.5rem !important; }
  .time-sep { flex-shrink: 0; }
  .time-total-pill { width: 100%; justify-content: center; font-size: 0.85rem; padding: 6px 12px; }

  .meeting-time-grid { 
    flex-direction: column; 
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .meeting-time-separator {
    display: none;
  }
  
  .meeting-time-input {
    font-size: 1rem;
    padding: 0.65rem !important;
  }
  
  .form-actions { 
    flex-direction: column; 
    gap: 0.75rem;
    padding: 1rem 0;
    position: relative;
  }
  .form-actions :deep(.p-button) { 
    width: 100%; 
    min-width: auto;
  }

  .section-title {
    font-size: 0.95rem;
  }

  .cal-section {
    padding: 0.75rem;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .dwf { padding: 0; }
  .section { padding: 1.25rem; }
  .entry-card { padding: 1.25rem; }
  .time-input { width: 85px !important; }
}

@media (min-width: 1025px) {
  .dwf { padding: 0; }
  .section { padding: 1.5rem; }
  .entry-card { padding: 1.5rem; }
  .time-input { width: 90px !important; }
}
</style>