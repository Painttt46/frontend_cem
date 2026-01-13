<template>
  <Card class="history-card">
    <template #content>
      <div v-if="records.length === 0" class="empty-state">
        <i class="pi pi-calendar-clock" style="font-size: 4rem; color: #ccc;"></i>
        <p>ยังไม่มีข้อมูลการลงงาน</p>
      </div>

      <EnhancedDataTable v-else :data="records"  :paginator="true" :rows="10" 
        :rowsPerPageOptions="[5, 10, 20]" responsiveLayout="scroll" class="history-table" stripedRows>

        <Column field="id" header="ID" :sortable="true" style="width: 80px; text-align: center;">
          <template #body="slotProps">
            <Badge :value="slotProps.data.id" severity="info" />
          </template>
        </Column>

        <Column field="work_date" header="วันที่ลงงาน" :sortable="true">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.work_date) }}
          </template>
        </Column>

        <Column field="start_time" header="เวลา" style="min-width: 120px;">
          <template #body="slotProps">
            {{ formatTime(slotProps.data.start_time) }} - {{ formatTime(slotProps.data.end_time) }}
          </template>
        </Column>

        <Column field="employee_name" header="ชื่อ-นามสกุล" :sortable="true" style="min-width: 150px;">
          <template #body="slotProps">
            <div class="employee-info">
              <div class="employee-name clickable-name" @click="showUserInfo(slotProps.data.user_id)">
                {{ slotProps.data.employee_name || 'ไม่ระบุ' }}
              </div>
            </div>
          </template>
        </Column>

        <Column field="employee_position" header="ตำแหน่ง" :sortable="true">
          <template #body="slotProps">
            <span class="position-text">{{ slotProps.data.employee_position || 'ไม่ระบุ' }}</span>
          </template>
        </Column>

        <!-- <Column field="employee_department" header="แผนก" :sortable="true" class="hide-mobile">
          <template #body="slotProps">
            <span class="department-text">{{ slotProps.data.employee_department || 'ไม่ระบุ' }}</span>
          </template>
        </Column> -->

        <Column field="task_name" header="โครงการ" :sortable="true" style="min-width: 200px;">
          <template #body="slotProps">
            <div class="task-info">
              <div class="task-name">{{ slotProps.data.task_name || 'ไม่ระบุชื่องาน' }}</div>
              <div v-if="slotProps.data.so_number" class="so-number">{{ slotProps.data.so_number }}</div>
            </div>
          </template>
        </Column>

        <Column field="step_name" header="ขั้นตอน" :sortable="true" style="min-width: 200px;">
          <template #body="slotProps">
            <div v-if="slotProps.data.step_name" class="step-info" 
              :style="{ borderLeftColor: getStepColor(slotProps.data) }">
              <div class="step-name">
                <span class="step-badge-small" :style="{ background: getStepColor(slotProps.data) }">
                  <i class="pi pi-sitemap"></i>
                </span>
                {{ slotProps.data.step_name }}
                <span class="step-status-tag" :style="{ background: getStepColor(slotProps.data) }">
                  {{ getStepLabel(slotProps.data) }}
                </span>
              </div>
              <div v-if="slotProps.data.step_description" class="step-detail">
                {{ slotProps.data.step_description }}
              </div>
              <div v-if="slotProps.data.step_start_date || slotProps.data.step_end_date" class="step-detail">
                <i class="pi pi-calendar"></i> {{ formatStepDateRange(slotProps.data.step_start_date, slotProps.data.step_end_date) }}
              </div>
              <div v-if="slotProps.data.step_assigned_users && slotProps.data.step_assigned_users.length > 0" class="step-detail step-users">
                <i class="pi pi-users"></i>
                <template v-for="(user, idx) in slotProps.data.step_assigned_users" :key="idx">
                  <span class="clickable-name" @click="showUserInfo(user.id)">{{ user.name }}</span>
                  <span v-if="idx < slotProps.data.step_assigned_users.length - 1">, </span>
                </template>
              </div>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </Column>

        <Column field="work_status" header="สถานะงาน" :sortable="true" style="text-align: center; min-width: 140px;">
          <template #body="slotProps">
            <div class="badge-container">
              <Badge v-if="slotProps.data.work_status" :value="getStatusLabel(slotProps.data.work_status)"
                :style="{ backgroundColor: getStatusColor(slotProps.data.work_status), color: '#fff' }" />
              <span v-else class="text-muted">-</span>
            </div>
          </template>
        </Column>

        <Column field="location" header="สถานที่" style="min-width: 100px;" />

        <Column field="category" header="หมวดหมู่งาน" :sortable="true" style="text-align: center; min-width: 100px;">
          <template #body="slotProps">
            <div class="badge-container category-badges">
              <Badge v-for="cat in parseCategoryArray(slotProps.data.category)" :key="cat"
                     :value="getCategoryLabel(cat)" 
                     :style="{ backgroundColor: getCategoryColor(cat), color: '#fff', margin: '2px' }" />
            </div>
          </template>
        </Column>

        <!-- <Column header="Sale เจ้าของงาน" class="hide-mobile">
          <template #body="slotProps">
            <div v-if="slotProps.data.sale_owner" class="sale-info">
              <i class="pi pi-user"></i>
              {{ slotProps.data.sale_owner }}
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </Column> -->

        <Column header="รายละเอียดงาน">
          <template #body="slotProps">
            <Button label="ดูรายละเอียด" icon="pi pi-info-circle" size="small" severity="info" outlined
              @click="showDetails(slotProps.data)" />
          </template>
        </Column>

        <Column header="จัดการ" style="width: 120px; text-align: center;">
          <template #body="slotProps">
            <div class="action-buttons" v-if="slotProps.data && (isAdmin() || (isOwner(slotProps.data) && !isEditDisabled(slotProps.data))) && slotProps.data.work_status !== 'cancelled'">
              <Button icon="pi pi-pencil" size="small" severity="warning"
                outlined @click="editRecord(slotProps.data)" v-tooltip="'แก้ไข'" />
              <Button icon="pi pi-times" size="small" severity="danger"
                outlined @click="confirmCancel(slotProps.data)" v-tooltip="'ยกเลิก'" />
            </div>
            <span v-else style="display: block; text-align: center;">-</span>
          </template>
        </Column>

        <Column header="ไฟล์แนบ" style="width: 80px;">
          <template #body="slotProps">
            <div v-if="hasFiles(slotProps.data)" class="attachments-info">
              <Button icon="pi pi-paperclip" size="small" severity="info" outlined
                @click="downloadFiles(slotProps.data)" v-tooltip="`${getFilesCount(slotProps.data)} ไฟล์`" />
            </div>
            <span v-else class="no-files">-</span>
          </template>
        </Column>
      </EnhancedDataTable>
    </template>
  </Card>

  <!-- Dialog สำหรับแสดงรายละเอียดงาน -->
  <div v-if="detailDialog" class="dialog-overlay" @click="detailDialog = false">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>รายละเอียดงาน</h3>
        <button class="dialog-close" @click="detailDialog = false">&times;</button>
      </div>
      <div class="dialog-body">
        <div class="work-description">
          {{ selectedRecord?.work_description || 'ไม่มีรายละเอียด' }}
        </div>
      </div>
    </div>
  </div>

  <!-- Files Dialog -->
  <Dialog v-model:visible="filesDialog" modal header="ไฟล์แนบ" :style="{ width: '90vw', maxWidth: '800px' }" :draggable="false">
    <div v-if="selectedRecordFiles && selectedRecordFiles.length > 0" class="files-list">
      <div v-for="(file, index) in selectedRecordFiles" :key="index" class="file-item">
        <div class="file-info">
          <img v-if="isImageFile(file)" :src="getFileUrl(file)" class="file-preview" @click="viewFullImage(file)" />
          <i v-else class="pi pi-file file-icon"></i>
          <span class="file-name">{{ file }}</span>
        </div>
        <Button icon="pi pi-download" size="small" severity="success" outlined @click="downloadFile(file)"
          v-tooltip="'ดาวน์โหลด'" />
      </div>
    </div>
    <div v-else class="no-files-dialog">
      <p>ไม่มีไฟล์แนบ</p>
    </div>
  </Dialog>

  <!-- Full Image Dialog -->
  <Dialog v-model:visible="fullImageDialog" modal header="รูปภาพ" :style="{ width: '90vw', maxWidth: '900px' }" :draggable="false">
    <img :src="fullImageUrl" class="full-image" />
  </Dialog>

  <!-- Edit Record Dialog -->
  <Dialog v-model:visible="editDialog" modal header="แก้ไขรายการงาน" :style="{ width: '90vw', maxWidth: '600px' }" position="center" :draggable="false">
    <form @submit.prevent="updateRecord" class="edit-form">
      <div class="edit-form-content">
        <div class="edit-row">
          <div class="edit-field">
            <label class="edit-label"><i class="pi pi-calendar"></i> วันที่ลงงาน</label>
            <Calendar v-model="editFormData.work_date" dateFormat="dd/mm/yy" class="w-full" required showIcon />
          </div>
        </div>

        <div class="edit-row">
          <div class="edit-field">
            <label class="edit-label"><i class="pi pi-clock"></i> ระยะเวลา</label>
            <div class="time-range-inputs">
              <InputText v-model="editFormData.start_time_text" class="time-input" placeholder="เริ่ม" maxlength="5" inputmode="numeric" @input="formatTimeInput('start_time_text')" required />
              <span class="time-separator">-</span>
              <InputText v-model="editFormData.end_time_text" class="time-input" placeholder="สิ้นสุด" maxlength="5" inputmode="numeric" @input="formatTimeInput('end_time_text')" required />
              <span class="time-total">{{ calculateEditHours }}</span>
            </div>
          </div>
        </div>

        <div class="edit-row">
          <div class="edit-field">
            <label class="edit-label"><i class="pi pi-map-marker"></i> สถานที่</label>
            <InputText v-model="editFormData.location" required class="w-full" placeholder="ระบุสถานที่" />
          </div>
        </div>

        <div class="edit-row">
          <div class="edit-field">
            <label class="edit-label"><i class="pi pi-align-left"></i> รายละเอียดงาน</label>
            <Textarea v-model="editFormData.work_description" rows="3" required class="w-full" placeholder="รายละเอียดงานที่ทำ" />
          </div>
        </div>

        <div class="edit-row">
          <div class="edit-field">
            <label class="edit-label"><i class="pi pi-paperclip"></i> ไฟล์แนบ</label>
            <div class="file-upload-area">
              <input type="file" ref="editFileInput" @change="handleEditFileUpload"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple style="display: none;">
              <Button type="button" label="เพิ่มไฟล์" icon="pi pi-upload" severity="secondary" outlined size="small"
                @click="$refs.editFileInput.click()" />
            </div>

            <div v-if="editFormData.existingFiles?.length > 0" class="file-list">
              <div v-for="(file, index) in editFormData.existingFiles" :key="'existing-'+index" class="file-chip">
                <i class="pi pi-file"></i>
                <span>{{ file }}</span>
                <i class="pi pi-times remove-file" @click="removeExistingFile(index)"></i>
              </div>
            </div>

            <div v-if="editFormData.newFiles?.length > 0" class="file-list new">
              <div v-for="(file, index) in editFormData.newFiles" :key="'new-'+index" class="file-chip new">
                <i class="pi pi-file"></i>
                <span>{{ file.name }}</span>
                <i class="pi pi-times remove-file" @click="removeNewFile(index)"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <Button type="button" label="ยกเลิก" severity="secondary" outlined @click="editDialog = false" />
        <Button type="submit" label="บันทึก" severity="success" />
      </div>
    </form>
  </Dialog>

  <UserInfoDialog v-model:visible="showUserDialog" :userId="selectedUserId" />
</template>

<script>
import axios from '@/utils/axiosConfig'
import UserInfoDialog from '@/components/UserInfoDialog.vue'
import EnhancedDataTable from '@/components/EnhancedDataTable.vue'

import { addDays } from '@/utils/dateUtils'
import { EDIT_CUTOFF_HOUR } from '@/constants/workConstants'

export default {
  name: 'DailyWorkList',
  components: {
    UserInfoDialog,
    EnhancedDataTable
  },
  inject: ['$confirm', '$toast'],
  emits: ['refresh-data'],
  props: {
    records: {
      type: Array,
      default: () => []
    }
  },
  created() {
    this.$http = axios
    if (!this.records || this.records.length === 0) {
      this.loadWorkRecords()
    }
  },
  mounted() {
    // Load status options from localStorage
    this.loadStatusOptions()
    this.loadCategoryOptions()

    // Update current time every second for realtime button state
    setInterval(() => {
      this.currentTime = new Date()
      this.$forceUpdate() // Force component to re-render
    }, 1000)
    
    // Listen for task updates
    window.addEventListener('taskUpdated', () => {
      this.$emit('refresh-data')
    })

    // Listen for status updates from TaskManagement
    window.addEventListener('statusesUpdated', () => {
      this.loadStatusOptions()
    })

    // Listen for category updates
    window.addEventListener('categoriesUpdated', () => {
      this.loadCategoryOptions()
    })
  },
  
  beforeUnmount() {
    window.removeEventListener('taskUpdated', () => {
      this.$emit('refresh-data')
    })
  },
  computed: {
    workRecords() {
      return this.records && this.records.length > 0 ? this.records : this.localRecords
    },
    calculateEditHours() {
      if (!this.editFormData.start_time_text || !this.editFormData.end_time_text) return '0.00 ชม.'
      const start = this.editFormData.start_time_text.split(':')
      const end = this.editFormData.end_time_text.split(':')
      if (start.length < 2 || end.length < 2) return '0.00 ชม.'
      const startMin = parseInt(start[0]) * 60 + parseInt(start[1])
      const endMin = parseInt(end[0]) * 60 + parseInt(end[1])
      let diff = endMin - startMin
      if (diff < 0) diff += 24 * 60
      return (diff / 60).toFixed(2) + ' ชม.'
    }
  },
  data() {
    return {
      localRecords: [],
      detailDialog: false,
      selectedRecord: null,
      filesDialog: false,
      selectedRecordFiles: [],
      fullImageDialog: false,
      fullImageUrl: '',
      editDialog: false,
      editFormData: {
        id: null,
        work_date: null,
        start_time: null,
        end_time: null,
        start_time_text: '',
        end_time_text: '',
        work_status: null,
        location: '',
        work_description: '',
        existingFiles: [],
        newFiles: []
      },
      statusOptions: [],
      categoryOptions: [],
      showUserDialog: false,
      selectedUserId: null
    }
  },
  methods: {
    showUserInfo(userId) {
      if (userId) {
        this.selectedUserId = userId
        this.showUserDialog = true
      }
    },
    loadStatusOptions() {
      this.$http.get('/api/settings/statuses')
        .then(response => {
          this.statusOptions = response.data.map(status => ({
            label: status.label,
            value: status.value,
            color: status.color
          }))
        })
        .catch(() => {
          // Fallback to default
          this.statusOptions = [
            { label: '⏳ รอดำเนินการ', value: 'pending', color: '#f59e0b' },
            { label: '🔄 กำลังดำเนินการ', value: 'in_progress', color: '#3b82f6' },
            { label: '✅ เสร็จสิ้น', value: 'completed', color: '#10b981' },
            { label: '⏸️ ระงับ', value: 'on_hold', color: '#6c757d' }
          ]
        })
    },
    loadCategoryOptions() {
      this.$http.get('/api/settings/categories')
        .then(response => {
          this.categoryOptions = response.data
        })
        .catch(() => {
          this.categoryOptions = []
        })
    },
    formatStepDateRange(start, end) {
      const formatDate = (date) => {
        if (!date) return ''
        return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
      }
      if (start && end) return `${formatDate(start)} - ${formatDate(end)}`
      if (start) return `เริ่ม ${formatDate(start)}`
      if (end) return `ถึง ${formatDate(end)}`
      return ''
    },
    formatAssignedUsers(users) {
      if (!users || users.length === 0) return ''
      return users.map(u => u.name || u).join(', ')
    },
    isOwner(record) {
      const currentUserId = localStorage.getItem('soc_user_id')
      return record.user_id == currentUserId
    },
    isAdmin() {
      const role = localStorage.getItem('soc_role')
      return role === 'admin'
    },
    isEditDisabled(record) {
      if (!record || !record.work_date) {
        return true
      }

      // วันที่ลงงาน
      const workDate = new Date(record.work_date)

      // กำหนดเวลาล็อก = EDIT_CUTOFF_HOUR ของวันถัดไป
      const cutoff = addDays(workDate, 1)
      cutoff.setHours(EDIT_CUTOFF_HOUR, 0, 0, 0)

      // เวลาปัจจุบัน
      const now = new Date()

      // ปิดการแก้ไขหลัง EDIT_CUTOFF_HOUR ของวันถัดไป
      return now > cutoff
    },
    confirmCancel(record) {
      this.$confirm.require({
        message: 'คุณต้องการยกเลิกงานนี้หรือไม่?',
        header: 'ยืนยันการยกเลิก',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'ยกเลิกงาน',
        rejectLabel: 'ปิด',
        accept: () => this.cancelRecord(record)
      })
    },
    async cancelRecord(record) {
      try {
        await this.$http.put(`/api/daily-work/${record.id}`, {
          step_id: record.step_id,
          work_date: record.work_date,
          start_time: record.start_time,
          end_time: record.end_time,
          work_status: 'cancelled',
          location: record.location,
          work_description: record.work_description,
          files: record.files
        })
        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'ยกเลิกงานเรียบร้อยแล้ว',
          life: 3000
        })
        this.$emit('refresh-data')
        this.loadWorkRecords()
      } catch {
        this.$toast.add({
          severity: 'error',
          summary: 'ผิดพลาด',
          detail: 'ไม่สามารถยกเลิกงานได้',
          life: 3000
        })
      }
    },

    async loadWorkRecords() {
      try {
        const response = await this.$http.get('/api/daily-work')
        this.localRecords = response.data || []

        // ตรวจสอบข้อมูลที่ได้รับ

        if (this.localRecords.length === 0) {
          this.$toast.add({
            severity: 'info',
            summary: 'ไม่มีข้อมูล',
            detail: 'ยังไม่มีการลงงานรายวัน',
            life: 3000
          })
        }
      } catch { // ignore
        this.localRecords = []

        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถโหลดข้อมูลการลงงานได้',
          life: 5000
        })
      }
    },
    formatDate(date) {
      if (!date) return '-'
      try {
        const d = new Date(date)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
      } catch { // ignore
        return date
      }
    },
    formatTime(time) {
      if (!time) return '-'
      return time.substring(0, 5)
    },
    formatDateForAPI(date) {
      if (!date || isNaN(date.getTime())) {
        return null;
      }

      // ใช้ local date components โดยตรง (ไม่เพิ่มวันที่แล้วเพราะ parse แล้วเพิ่มไปแล้ว)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return null;
      }

      const formatted = `${year}-${month}-${day}`;
      return formatted;
    },
    formatTimeForAPI(time) {
      if (!time) return null
      return time.toTimeString().split(' ')[0]
    },
    getStatusLabel(value) {
      if (value === 'cancelled') return 'ยกเลิก'
      const status = this.statusOptions.find(s => s.value === value)
      if (status && status.label) {
        return status.label.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}-\u{3299}]/gu, '').trim()
      }
      return value
    },
    getStepColor(record) {
      // ถ้ามี record นี้แสดงว่ามีการลงงานแล้ว = กำลังดำเนินการ (ฟ้า)
      return '#3b82f6'
    },
    getStepLabel(record) {
      return 'กำลังดำเนินการ'
    },
    getStatusLabelFromOptions(value) {
      const status = this.statusOptions.find(s => s.value === value)
      if (status && status.label) {
        // Remove all emoji and special characters
        return status.label.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}-\u{3299}]/gu, '').trim()
      }
      return value
    },
    getStatusColor(value) {
      if (value === 'cancelled') return '#ef4444'
      const status = this.statusOptions.find(s => s.value === value)
      return status?.color || '#6c757d'
    },
    getCategoryLabel(value) {
      const category = this.categoryOptions.find(c => c.value === value)
      if (category && category.label) {
        // Remove all emoji and special characters
        return category.label.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}-\u{3299}]/gu, '').trim()
      }
      return value || 'งานทั่วไป'
    },
    getCategoryColor(value) {
      const category = this.categoryOptions.find(c => c.value === value)
      return category?.color || '#6c757d'
    },
    parseCategoryArray(category) {
      if (!category) return []
      if (Array.isArray(category)) return category
      return category.split(',').map(c => c.trim()).filter(c => c)
    },
    getCategorySeverity() {
      return 'contrast'
    },
    isImageFile(fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase()
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)
    },
    getFileUrl(fileName) {
      const token = localStorage.getItem('soc_token')
      return `/api/files/download/${fileName}?token=${token}`
    },
    viewFullImage(fileName) {
      this.fullImageUrl = this.getFileUrl(fileName)
      this.fullImageDialog = true
    },
    hasFiles(record) {
      let files = record.files
      if (typeof files === 'string') {
        try { files = JSON.parse(files) } catch { files = [] }
      }
      return files && Array.isArray(files) && files.length > 0
    },
    getFilesCount(record) {
      let files = record.files
      if (typeof files === 'string') {
        try { files = JSON.parse(files) } catch { files = [] }
      }
      return Array.isArray(files) ? files.length : 0
    },
    downloadFiles(record) {
      if (this.hasFiles(record)) {
        let files = record.files
        if (typeof files === 'string') {
          try { files = JSON.parse(files) } catch { files = [] }
        }
        this.selectedRecordFiles = files
        this.filesDialog = true
      }
    },
    async downloadFile(fileName) {
      try {
        const response = await this.$http.get(`/api/files/download/${fileName}`, {
          responseType: 'blob'
        })
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = fileName.split('-').slice(2).join('-') || fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch { // ignore
        
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถดาวน์โหลดไฟล์ได้',
          life: 3000
        })
      }
    },
    editRecord(record) {
      console.log('record.work_date:', record.work_date);

      // Parse date โดยแยกเฉพาะวันที่
      let workDate = new Date();
      if (record.work_date) {
        // แยกเอาเฉพาะส่วนวันที่จาก ISO string
        // "2025-10-14T17:00:00.000Z" -> "2025-10-14"
        const dateOnly = record.work_date.split('T')[0];
        console.log('dateOnly:', dateOnly);
        const [year, month, day] = dateOnly.split('-').map(Number);
        console.log('parsed:', year, month, day);

        // สร้าง Date ใหม่ (month ใน JS เริ่มจาก 0 แต่ใน ISO string เริ่มจาก 1)
        workDate = new Date(year, month - 1, day, 12, 0, 0);
        console.log('workDate:', workDate);
      }


      this.editFormData = {
        id: record.id,
        step_id: record.step_id,
        work_date: workDate,
        start_time: this.parseTime(record.start_time),
        end_time: this.parseTime(record.end_time),
        start_time_text: record.start_time?.substring(0, 5) || '',
        end_time_text: record.end_time?.substring(0, 5) || '',
        work_status: record.work_status,
        location: record.location || '',
        work_description: record.work_description || '',
        existingFiles: [...(record.files || [])],
        newFiles: []
      }
      this.editDialog = true
    },
    formatTimeInput(field) {
      let value = this.editFormData[field].replace(/\D/g, '')
      if (value.length >= 2) {
        value = value.slice(0, 2) + ':' + value.slice(2, 4)
      }
      this.editFormData[field] = value.slice(0, 5)
    },
    parseTime(timeString) {
      if (!timeString) return null
      const [hours, minutes, seconds] = timeString.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0))
      return date
    },
    handleEditFileUpload(event) {
      const files = Array.from(event.target.files)
      this.editFormData.newFiles = [...this.editFormData.newFiles, ...files]
    },
    removeExistingFile(index) {
      this.editFormData.existingFiles.splice(index, 1)
    },
    removeNewFile(index) {
      this.editFormData.newFiles.splice(index, 1)
    },
    async uploadNewFiles() {
      if (this.editFormData.newFiles.length === 0) return []

      const formData = new FormData()
      this.editFormData.newFiles.forEach(file => {
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
    async updateRecord() {
      try {
        // Validate วันที่
        if (!this.editFormData.work_date || isNaN(this.editFormData.work_date.getTime())) {
          this.$toast.add({
            severity: 'error',
            summary: 'ข้อผิดพลาด',
            detail: 'วันที่ไม่ถูกต้อง กรุณาเลือกวันที่ใหม่',
            life: 3000
          })
          return
        }

        // รองรับการทำงานข้ามวัน - ไม่ต้อง validate เวลา

        // Upload ไฟล์ใหม่
        const newUploadedFiles = await this.uploadNewFiles()

        // รวมไฟล์เดิมกับไฟล์ใหม่
        const allFiles = [...this.editFormData.existingFiles, ...newUploadedFiles]

        const formattedDate = this.formatDateForAPI(this.editFormData.work_date)

        if (!formattedDate) {
          this.$toast.add({
            severity: 'error',
            summary: 'ข้อผิดพลาด',
            detail: 'ไม่สามารถแปลงวันที่ได้ กรุณาเลือกวันที่ใหม่',
            life: 3000
          })
          return
        }

        const updateData = {
          step_id: this.editFormData.step_id,
          work_date: formattedDate,
          start_time: this.editFormData.start_time_text + ':00',
          end_time: this.editFormData.end_time_text + ':00',
          work_status: this.editFormData.work_status,
          location: this.editFormData.location,
          work_description: this.editFormData.work_description,
          files: allFiles
        }


        await this.$http.put(`/api/daily-work/${this.editFormData.id}`, updateData)

        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'แก้ไขรายการงานเรียบร้อยแล้ว',
          life: 3000
        })

        this.editDialog = false

        // Auto-refresh data
        await this.loadWorkRecords()

        // Emit event for parent component to refresh
        this.$emit('record-updated')

        // Dispatch global event for real-time update
        window.dispatchEvent(new CustomEvent('workRecordUpdated'))
        window.dispatchEvent(new CustomEvent('taskStatusChanged'))

      } catch (err) {
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: err.response?.data?.error || 'ไม่สามารถแก้ไขรายการงานได้',
          life: 5000
        })
      }
    },
    showDetails(record) {
      this.selectedRecord = record
      this.detailDialog = true
    },
    // Method สำหรับตัดข้อความให้สั้น
    truncateText(text, maxLength) {
      if (!text) return '-'
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    },
    // Method สำหรับ refresh ข้อมูลจากภายนอก
    async refreshData() {
      await this.loadWorkRecords()
    },
    // Method สำหรับตรวจสอบข้อมูลที่จำเป็น
    validateRecord(record) {
      const required = ['id', 'work_date', 'work_status']
      const missing = required.filter(field => !record[field])

      if (missing.length > 0) {
        return false
      }
      return true
    }
  }
}
</script>

<style scoped>
.history-card {
  width: 100%;
  margin: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.step-badge i {
  font-size: 0.75rem;
}

.text-muted {
  color: #9ca3af;
}

.step-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 0.5rem;
  border-left: 3px solid #9ca3af;
}

.step-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #333;
}

.step-badge-small {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.step-badge-small i {
  font-size: 0.7rem;
}

.step-status-tag {
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: 8px;
  color: white;
  margin-left: auto;
}
}

.step-name i {
  color: #6366f1;
  margin-right: 4px;
}

.step-detail {
  font-size: 0.8rem;
  color: #6c757d;
}

.step-detail i {
  margin-right: 4px;
  font-size: 0.75rem;
}

.badge-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 40px;
}

.badge-container :deep(.p-badge) {
  white-space: normal !important;
  word-break: keep-all !important;
  overflow-wrap: break-word !important;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.25rem 0.4rem !important;
  line-height: 1.5 !important;
  display: inline-block !important;
  max-width: 100%;
  height: auto !important;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 1rem;
}

.empty-state p {
  margin-top: 1rem;
  font-size: 1.1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.history-table :deep(.p-datatable) {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.history-table :deep(.p-datatable-thead > tr > th) {
  background: #f8f9fa;
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  padding: 1rem 0.75rem;
  font-size: 0.9rem;
}

.history-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #f1f3f4;
  vertical-align: middle;
}

.history-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f8f9fa;
}

.history-table :deep(.p-paginator) {
  background: #f8f9fa;
  border-top: 2px solid #e9ecef;
  padding: 1rem;
}

.employee-info {
  display: flex;
  flex-direction: column;
}

.employee-name {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.clickable-name {
  cursor: pointer;
  color: #667eea;
  transition: all 0.2s;
}

.clickable-name:hover {
  color: #764ba2;
  text-decoration: underline;
}

.position-text {
  color: #6c757d;
  font-size: 0.85rem;
  font-weight: 500;
}

.department-text {
  color: #868e96;
  font-size: 0.85rem;
  font-weight: 500;
}

.id-badge-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.custom-id-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
  color: white !important;
  font-weight: 700 !important;
  padding: 0.4rem 0.6rem !important;
  border-radius: 8px !important;
  font-size: 0.85rem !important;
  border: 2px solid rgba(59, 130, 246, 0.2) !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) !important;
  letter-spacing: 0.5px !important;
  min-width: 50px !important;
  text-align: center !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-name {
  font-weight: 600;
  color: #495057;
  word-wrap: break-word;
  white-space: normal;
}

.so-number {
  font-size: 0.8rem;
  color: #6c757d;
  background: #e3f2fd;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time-info i {
  margin-right: 0.5rem;
  color: #667eea;
}

.total-hours {
  font-size: 0.8rem;
  color: #28a745;
  font-weight: 600;
}

.sale-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #495057;
}

.sale-info i {
  color: #667eea;
}

.text-muted {
  color: #6c757d;
}

.description-preview {
  font-size: 0.9rem;
  color: #495057;
  line-height: 1.3;
}

/* Edit Form Styles */
.edit-form {
  padding: 0;
}

.edit-form-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.edit-row {
  width: 100%;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.edit-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-label i {
  color: #6366f1;
  font-size: 0.85rem;
}

.file-upload-area {
  margin-bottom: 0.75rem;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.file-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 0.85rem;
}

.file-chip.new {
  background: #dbeafe;
}

.file-chip .remove-file {
  cursor: pointer;
  color: #ef4444;
  font-size: 0.75rem;
}

.file-chip .remove-file:hover {
  color: #dc2626;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group.full-width {
  grid-column: 1 / -1;
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

.input-label {
  font-weight: 500;
  color: #333;
}

.corporate-input,
.corporate-dropdown {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.file-upload-section {
  margin-bottom: 1rem;
}

.existing-files,
.new-files {
  margin-top: 1rem;
}

.existing-files h4,
.new-files h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.disabled-text {
  color: #6c757d;
  font-size: 0.8rem;
  font-style: italic;
}

.attachments-info {
  display: flex;
  justify-content: center;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #f9f9f9;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-preview {
  width: 50px;
  height: 50px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  cursor: pointer;
}

.file-preview:hover {
  opacity: 0.8;
}

.file-icon {
  font-size: 1.5rem;
  color: #6c757d;
}

.file-name {
  font-weight: 500;
}

.full-image {
  width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.no-files-dialog {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.file-upload-section {
  margin-bottom: 1rem;
}

.existing-files,
.new-files {
  margin-top: 1rem;
}

.existing-files h4,
.new-files h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
}

.no-files {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 0.9rem;
  width: 100%;
  text-align: center;
}

.file-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #667eea;
  font-size: 0.9rem;
}

.file-indicator i {
  color: #667eea;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: dialogSlideIn 0.3s ease-out;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.dialog-header h3 {
  margin: 0;
  color: #495057;
  font-size: 1.25rem;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.dialog-close:hover {
  background: #e9ecef;
  color: #495057;
}

.dialog-body {
  padding: 1.5rem;
}

.work-description {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #667eea;
  white-space: pre-wrap;
  line-height: 1.6;
  color: #495057;
  font-size: 0.95rem;
}

.detail-content {
  line-height: 1.6;
}

.detail-content p {
  margin: 0.5rem 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  :deep(.hide-mobile) {
    display: none !important;
  }

  .history-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }

  .history-table :deep(.p-datatable-thead > tr > th) {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }

  .task-info {
    max-width: 150px;
  }

  .task-name {
    font-size: 0.9rem;
    line-height: 1.2;
  }
}

@media (max-width: 480px) {
  .history-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.5rem 0.25rem;
    font-size: 0.8rem;
  }

  .history-table :deep(.p-datatable-thead > tr > th) {
    padding: 0.5rem 0.25rem;
    font-size: 0.8rem;
  }

  .custom-id-badge {
    font-size: 0.7rem;
    padding: 0.3rem 0.5rem;
  }
}
</style>
