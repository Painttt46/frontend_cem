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

        <Column field="employee_position" header="ตำแหน่ง" :sortable="true" class="hide-mobile">
          <template #body="slotProps">
            <span class="position-text">{{ slotProps.data.employee_position || 'ไม่ระบุ' }}</span>
          </template>
        </Column>

        <!-- <Column field="employee_department" header="แผนก" :sortable="true" class="hide-mobile">
          <template #body="slotProps">
            <span class="department-text">{{ slotProps.data.employee_department || 'ไม่ระบุ' }}</span>
          </template>
        </Column> -->

        <Column field="task_name" header="โครงการ" :sortable="true">
          <template #body="slotProps">
            <div class="task-info">
              <div class="task-name">{{ slotProps.data.task_name || 'ไม่ระบุชื่องาน' }}</div>
              <div v-if="slotProps.data.so_number" class="so-number">{{ slotProps.data.so_number }}</div>
            </div>
          </template>
        </Column>

        <Column field="work_status" header="สถานะงาน" :sortable="true" style="text-align: center; min-width: 140px;">
          <template #body="slotProps">
            <div class="badge-container">
              <Badge :value="getStatusLabel(slotProps.data.work_status)"
                :style="{ backgroundColor: getStatusColor(slotProps.data.work_status), color: '#fff' }" />
            </div>
          </template>
        </Column>

        <Column field="location" header="สถานที่" class="hide-mobile" />

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

        <Column header="รายละเอียดงาน" class="hide-mobile">
          <template #body="slotProps">
            <Button label="ดูรายละเอียด" icon="pi pi-info-circle" size="small" severity="info" outlined
              @click="showDetails(slotProps.data)" />
          </template>
        </Column>

        <Column header="จัดการ" style="width: 80px;">
          <template #body="slotProps">
            <div class="action-buttons" v-if="slotProps.data">
              <Button v-if="!isEditDisabled(slotProps.data)" icon="pi pi-pencil" size="small" severity="warning"
                outlined @click="editRecord(slotProps.data)" v-tooltip="'แก้ไข'" />
              <span v-else class="disabled-text">ไม่สามารถแก้ไขได้</span>
            </div>
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
  <Dialog v-model:visible="editDialog" modal header="แก้ไขรายการงาน" :style="{ width: '90vw', maxWidth: '800px' }" position="center" :draggable="false">
    <form @submit.prevent="updateRecord" class="edit-form">
      <div class="form-grid">
        <div class="input-group">
          <label class="input-label">วันที่ลงงาน *</label>
          <Calendar v-model="editFormData.work_date" dateFormat="dd/mm/yy" class="corporate-input" required />
        </div>

        <div class="input-group">
          <label class="input-label">เวลาเริ่มงาน *</label>
          <Calendar v-model="editFormData.start_time" timeOnly hourFormat="24" class="corporate-input" required />
        </div>

        <div class="input-group">
          <label class="input-label">เวลาสิ้นสุดงาน *</label>
          <Calendar v-model="editFormData.end_time" timeOnly hourFormat="24" class="corporate-input" required />
        </div>

        <div class="input-group">
          <label class="input-label">สถานะงาน *</label>
          <Dropdown v-model="editFormData.work_status" :options="statusOptions" optionLabel="label" optionValue="value"
            class="corporate-dropdown" required>
            <template #value="slotProps">
              <span v-if="slotProps.value">{{ getStatusLabelFromOptions(slotProps.value) }}</span>
              <span v-else>เลือกสถานะ</span>
            </template>
            <template #option="slotProps">
              <span>{{ slotProps.option.label }}</span>
            </template>
          </Dropdown>
        </div>

        <div class="input-group full-width">
          <label class="input-label">สถานที่ *</label>
          <InputText v-model="editFormData.location" required class="corporate-input" />
        </div>

        <div class="input-group full-width">
          <label class="input-label">รายละเอียดงาน *</label>
          <Textarea v-model="editFormData.work_description" rows="4" required class="corporate-input" />
        </div>

        <div class="input-group full-width">
          <label class="input-label">ไฟล์แนบ</label>
          <div class="file-upload-section">
            <input type="file" ref="editFileInput" @change="handleEditFileUpload"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple class="file-input" style="display: none;">
            <Button type="button" label="เพิ่มไฟล์" icon="pi pi-upload" severity="secondary" outlined
              @click="$refs.editFileInput.click()" />
          </div>

          <!-- แสดงไฟล์เดิม -->
          <div v-if="editFormData.existingFiles?.length > 0" class="existing-files">
            <h4>ไฟล์เดิม:</h4>
            <div v-for="(file, index) in editFormData.existingFiles" :key="index" class="file-item">
              <i class="pi pi-file"></i>
              <span class="file-name">{{ file }}</span>
              <Button icon="pi pi-times" size="small" severity="danger" text @click="removeExistingFile(index)" />
            </div>
          </div>

          <!-- แสดงไฟล์ใหม่ -->
          <div v-if="editFormData.newFiles?.length > 0" class="new-files">
            <h4>ไฟล์ใหม่:</h4>
            <div v-for="(file, index) in editFormData.newFiles" :key="index" class="file-item">
              <i class="pi pi-file"></i>
              <span class="file-name">{{ file.name }}</span>
              <Button icon="pi pi-times" size="small" severity="danger" text @click="removeNewFile(index)" />
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
      const status = this.statusOptions.find(s => s.value === value)
      if (status && status.label) {
        return status.label.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}-\u{3299}]/gu, '').trim()
      }
      return value
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

      // Parse date โดยแยกเฉพาะวันที่
      let workDate = new Date();
      if (record.work_date) {
        // แยกเอาเฉพาะส่วนวันที่จาก ISO string
        // "2025-10-14T17:00:00.000Z" -> "2025-10-14"
        const dateOnly = record.work_date.split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);

        // สร้าง Date ใหม่ (month ใน JS เริ่มจาก 0 แต่ใน ISO string เริ่มจาก 1)
        workDate = new Date(year, month - 1, day);

        // เพิ่มวันที่ขึ้น 1 วัน เพื่อชดเชย timezone offset
        workDate.setDate(workDate.getDate() + 1);

      }


      this.editFormData = {
        id: record.id,
        work_date: workDate,
        start_time: this.parseTime(record.start_time),
        end_time: this.parseTime(record.end_time),
        work_status: record.work_status,
        location: record.location || '',
        work_description: record.work_description || '',
        existingFiles: [...(record.files || [])],
        newFiles: []
      }
      this.editDialog = true
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
          work_date: formattedDate,
          start_time: this.formatTimeForAPI(this.editFormData.start_time),
          end_time: this.formatTimeForAPI(this.editFormData.end_time),
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
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.badge-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40px;
}

.badge-container :deep(.p-badge) {
  white-space: normal;
  text-align: center;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.25rem 0.4rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-secondary);
  background: #f8f9fa;
  border-radius: var(--radius-md);
  margin: 1rem;
}

.empty-state p {
  margin-top: 1rem;
  font-size: 1rem;
}

.history-table :deep(.p-datatable-thead > tr > th) {
  background: #f8f9fa;
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid var(--border-color);
  padding: 0.75rem;
  font-size: 0.85rem;
}

.history-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.75rem;
  border-bottom: 1px solid #f1f3f4;
  vertical-align: middle;
}

.history-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f8f9fa;
}

.history-table :deep(.p-paginator) {
  background: #f8f9fa;
  border-top: 2px solid var(--border-color);
  padding: 0.75rem;
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
  color: var(--primary-color);
}

.clickable-name:hover {
  text-decoration: underline;
}

.position-text,
.department-text {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.custom-id-badge {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  font-weight: 700;
  padding: 0.4rem 0.6rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-name {
  font-weight: 600;
  color: #495057;
}

.so-number {
  font-size: 0.8rem;
  color: var(--text-secondary);
  background: #e3f2fd;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
}

.sale-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #495057;
}

.sale-info i {
  color: var(--primary-color);
}

.text-muted {
  color: var(--text-secondary);
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

.input-label {
  font-weight: 500;
  color: #333;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
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
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: #f9f9f9;
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
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  cursor: pointer;
}

.file-icon {
  font-size: 1.5rem;
  color: var(--text-secondary);
}

.full-image {
  width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.no-files {
  display: flex;
  justify-content: center;
  color: #999;
  font-size: 0.9rem;
}

.file-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
  font-size: 0.9rem;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  background: #f8f9fa;
}

.dialog-header h3 {
  margin: 0;
  color: #495057;
  font-size: 1.1rem;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  border-radius: 50%;
}

.dialog-close:hover {
  background: var(--border-color);
}

.dialog-body {
  padding: 1rem;
}

.work-description {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--primary-color);
  white-space: pre-wrap;
  line-height: 1.6;
  color: #495057;
}

@media (max-width: 768px) {
  :deep(.hide-mobile) {
    display: none;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
