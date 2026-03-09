<template>
  <Card class="history-card">
    <template #content>
      <div v-if="records.length === 0" class="empty-state">
        <i class="pi pi-calendar-times" style="font-size: 4rem; color: #ccc;"></i>
        <p>ยังไม่มีข้อมูลการลางาน</p>
      </div>

      <EnhancedDataTable v-else :data="dateFilteredRecords" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]"
        responsiveLayout="scroll" class="history-table" stripedRows>

        <template #extraControls>
          <div class="date-search-controls">
            <Calendar v-model="dateSearchStart" dateFormat="dd/mm/yy" placeholder="วันเริ่มต้น" showIcon showButtonBar class="date-search-cal" />
            <span class="date-search-sep">—</span>
            <Calendar v-model="dateSearchEnd" dateFormat="dd/mm/yy" placeholder="วันสิ้นสุด" showIcon showButtonBar class="date-search-cal" />
            <Button v-if="dateSearchStart || dateSearchEnd" icon="pi pi-times" size="small" severity="secondary" text rounded @click="dateSearchStart = null; dateSearchEnd = null" v-tooltip="'ล้างการค้นหาวันที่'" />
          </div>
        </template>

        <Column field="id" header="รหัสคำขอ" :sortable="true">
          <template #body="slotProps">
            <Badge :value="`#${slotProps.data.id}`" class="custom-id-badge" />
          </template>
        </Column>

        <Column field="user_name" header="ชื่อ-นามสกุล" :sortable="true">
          <template #body="slotProps">
            <span class="clickable-name" @click="showUserInfo(slotProps.data.user_name, slotProps.data.user_id)">
              {{ slotProps.data.user_name }}
            </span>
          </template>
        </Column>
        <Column field="position" header="ตำแหน่ง" :sortable="true" />

        <Column field="leave_type" header="ประเภทการลา" :sortable="true">
          <template #body="slotProps">
            <Badge :value="getLeaveTypeLabel(slotProps.data.leave_type)"
              :style="{ backgroundColor: getLeaveTypeColor(slotProps.data.leave_type), color: '#fff', fontWeight: 'bold' }" />
          </template>
        </Column>

        <Column header="วันเวลาเริ่มลา" :sortable="true">
          <template #body="slotProps">
            {{ formatDateTime(slotProps.data.start_datetime) }}
          </template>
        </Column>

        <Column header="วันเวลาสิ้นสุด" :sortable="true">
          <template #body="slotProps">
            {{ formatDateTime(slotProps.data.end_datetime) }}
          </template>
        </Column>

        <Column header="จำนวน" :sortable="true">
          <template #body="slotProps">
            {{ slotProps.data.total_days }} วัน ({{ calculateHours(slotProps.data) }} ชม.)
          </template>
        </Column>

        <Column header="ผู้รับผิดชอบแทน" style="min-width: 200px;">
          <template #body="slotProps">
            <div v-if="slotProps.data.has_delegation" class="delegate-info">
              <div class="delegate-name">
                <i class="pi pi-user"></i>
                <strong>{{ slotProps.data.delegate_name || 'ไม่ระบุ' }}</strong>
              </div>
              <div class="delegate-position">
                <i class="pi pi-briefcase"></i>
                <small>{{ slotProps.data.delegate_position || 'ไม่ระบุตำแหน่ง' }}</small>
              </div>
              <div class="delegate-department">
                <i class="pi pi-building"></i>
                <small>{{ slotProps.data.delegate_department || 'ไม่ระบุแผนก' }}</small>
              </div>
              <div class="delegate-contact">
                <i class="pi pi-phone"></i>
                <small class="contact-info">{{ slotProps.data.delegate_contact || 'ไม่ระบุ' }}</small>
              </div>
              <div v-if="slotProps.data.work_details" class="work-details-btn">
                <Button icon="pi pi-list" label="ดูรายละเอียดงาน" size="small" severity="info" outlined
                  @click="showWorkDetails(slotProps.data.work_details)" />
              </div>
            </div>
            <span v-else class="no-delegation">
              <i class="pi pi-times-circle"></i>
              ไม่มีการมอบหมายงาน
            </span>
          </template>
        </Column>

        <Column v-if="showSensitiveColumns" field="reason" header="เหตุผล" style="min-width: 160px; width: 160px;">
          <template #body="slotProps">
            <span class="reason-text-wrap">{{ slotProps.data.reason }}</span>
          </template>
        </Column>

        <Column v-if="showSensitiveColumns" header="เอกสารแนบ" style="width: 80px;">
          <template #body="slotProps">
            <div v-if="slotProps.data.attachments && slotProps.data.attachments.length > 0 || canEditRecord(slotProps.data)" class="attachments-info">
              <Button icon="pi pi-paperclip" size="small"
                :severity="canEditRecord(slotProps.data) ? 'info' : 'secondary'" outlined
                @click="showAttachments(slotProps.data)"
                v-tooltip="slotProps.data.attachments && slotProps.data.attachments.length > 0
                  ? `${slotProps.data.attachments.length} ไฟล์${canEditRecord(slotProps.data) ? ' · แนบเพิ่มได้' : ''}`
                  : 'เพิ่มเอกสาร'" />
            </div>
            <span v-else>-</span>
          </template>
        </Column>

        <Column header="สถานะ" style="min-width: 200px;">
          <template #body="slotProps">
            <div class="status-container-vertical">
              <Badge
                :value="getStatusLabel(slotProps.data.status)"
                :style="getStatusStyle(slotProps.data.status)"
                class="status-badge-large"
              />
              <div class="action-buttons-row">
                <Button v-if="canDeleteRequest(slotProps.data)" icon="pi pi-trash" label="ลบคำขอ" size="small"
                  severity="danger" @click="confirmDelete(slotProps.data)" class="action-btn" />
                <Button v-if="canRequestCancel(slotProps.data)" icon="pi pi-times-circle" label="ขอยกเลิก" size="small"
                  severity="warning" @click="requestCancel(slotProps.data)" class="action-btn" />
              </div>
              <div v-if="slotProps.data.cancel_reason" class="cancel-reason-eye-row">
                <Button
                  icon="pi pi-eye"
                  size="small"
                  text
                  rounded
                  v-tooltip="'ดูเหตุผลขอยกเลิก'"
                  @click="showCancelReason(slotProps.data.cancel_reason)"
                />
              </div>
            </div>
          </template>
        </Column>

        <Column header="ผู้อนุมัติ" style="min-width: 280px;">
          <template #body="slotProps">
            <div class="approver-container">
              <!-- Step 1: หัวหน้างาน -->
              <div class="approver-item" :class="{
                'approved': slotProps.data.approved_by_level1,
                'rejected': slotProps.data.status === 'rejected' && slotProps.data.rejected_level === 1
              }">
                <div class="approver-badge-wrapper">
                  <i v-if="slotProps.data.approved_by_level1" class="pi pi-check-circle" style="color: #10b981;"></i>
                  <i v-else-if="slotProps.data.status === 'rejected' && slotProps.data.rejected_level === 1"
                    class="pi pi-times-circle" style="color: #ef4444;"></i>
                  <i v-else class="pi pi-clock" style="color: #94a3b8;"></i>
                  <Badge value="หัวหน้างาน"
                    :severity="slotProps.data.approved_by_level1 ? 'info' : (slotProps.data.status === 'rejected' && slotProps.data.rejected_level === 1 ? 'danger' : 'secondary')" />
                </div>
                <span v-if="slotProps.data.approved_by_level1" class="approver-text clickable-name"
                  @click="showUserInfo(slotProps.data.approved_by_level1, slotProps.data.approved_by_level1_id)">
                  {{ slotProps.data.approved_by_level1 }}
                </span>
                <span v-else-if="slotProps.data.status === 'rejected' && slotProps.data.rejected_level === 1"
                  class="approver-text rejected-text clickable-name"
                  @click="showApproverInfo(slotProps.data.rejected_by)">
                  {{ slotProps.data.rejected_by }}
                  <Button v-if="slotProps.data.reject_reason" icon="pi pi-info-circle" severity="danger" text
                    size="small" @click.stop="showRejectReason(slotProps.data.reject_reason)" v-tooltip="'ดูเหตุผล'" />
                </span>
                <span v-else class="approver-text pending-text">รอดำเนินการ</span>
              </div>

              <!-- Step 2: HR (ไม่แสดงถ้าถูกปฏิเสธตั้งแต่ step 1) -->
              <div v-if="!(slotProps.data.status === 'rejected' && slotProps.data.rejected_level === 1)"
                class="approver-item" :class="{
                  'approved': slotProps.data.approved_by_level2,
                  'rejected': slotProps.data.status === 'rejected' && slotProps.data.rejected_level === 2,
                  'pending-cancel': slotProps.data.status === 'cancel' && slotProps.data.approved_by_level1,
                  'disabled': !slotProps.data.approved_by_level1 && !(slotProps.data.status === 'rejected' && slotProps.data.rejected_level === 2) && slotProps.data.status !== 'cancel'
                }">
                <div class="approver-badge-wrapper">
                  <i v-if="slotProps.data.approved_by_level2" class="pi pi-check-circle" style="color: #10b981;"></i>
                  <i v-else-if="slotProps.data.status === 'rejected' && slotProps.data.rejected_level === 2"
                    class="pi pi-times-circle" style="color: #ef4444;"></i>
                  <i v-else-if="slotProps.data.status === 'cancel' && slotProps.data.approved_by_level1"
                    class="pi pi-exclamation-triangle" style="color: #f59e0b;"></i>
                  <i v-else class="pi pi-clock" style="color: #94a3b8;"></i>
                  <Badge value="HR"
                    :severity="slotProps.data.approved_by_level2 ? 'success' : (slotProps.data.status === 'rejected' && slotProps.data.rejected_level === 2 ? 'danger' : (slotProps.data.status === 'cancel' && slotProps.data.approved_by_level1 ? 'warning' : 'secondary'))" />
                </div>
                <span v-if="slotProps.data.approved_by_level2" class="approver-text clickable-name"
                  @click="showUserInfo(slotProps.data.approved_by_level2, slotProps.data.approved_by_level2_id)">
                  {{ slotProps.data.approved_by_level2 }}
                </span>
                <span v-else-if="slotProps.data.status === 'rejected' && slotProps.data.rejected_level === 2"
                  class="approver-text rejected-text clickable-name"
                  @click="showApproverInfo(slotProps.data.rejected_by)">
                  {{ slotProps.data.rejected_by }}
                  <Button v-if="slotProps.data.reject_reason" icon="pi pi-info-circle" severity="danger" text
                    size="small" @click.stop="showRejectReason(slotProps.data.reject_reason)" v-tooltip="'ดูเหตุผล'" />
                </span>
                <span v-else-if="slotProps.data.status === 'cancel' && slotProps.data.approved_by_level1" class="approver-text cancel-pending-text">รอยกเลิก</span>
                <span v-else class="approver-text pending-text">รอดำเนินการ</span>
              </div>
            </div>
          </template>
        </Column>
        <Column header="ลบ/คืนโควต้า" style="width: 250px;">
          <template #body="slotProps">
            <div v-if="canHrResetQuota(slotProps.data)" class="hr-action-row">
              <Button icon="pi pi-undo" label="ลบ/คืนโควต้า" size="small" severity="danger" outlined
                class="action-btn hr-reset-btn" @click="confirmHrReset(slotProps.data)" />
            </div>
          </template>
        </Column>

        <Column header="วันที่ส่งคำขอ" :sortable="true">
          <template #body="slotProps">
            {{ formatDateTime(slotProps.data.created_at) }}
          </template>
        </Column>
      </EnhancedDataTable>
    </template>
  </Card>

  <!-- Work Details Dialog -->
  <Dialog v-model:visible="showWorkDetailsDialog" modal header="รายละเอียดงานที่มอบหมาย"
    :style="{ width: '90vw', maxWidth: '800px' }" :draggable="false">
    <div class="work-details-content">
      <p>{{ selectedWorkDetails }}</p>
    </div>
    <template #footer>
      <Button label="ปิด" icon="pi pi-times" @click="showWorkDetailsDialog = false" />
    </template>
  </Dialog>

  <!-- Attachments Dialog -->
  <Dialog v-model:visible="showAttachmentsDialog" modal header="เอกสารแนบ" :style="{ width: '90vw', maxWidth: '900px' }"
    :draggable="false">
    <div class="attachments-content">
      <!-- Upload zone (เจ้าของ + ช่วงเวลาที่อนุญาต) -->
      <div v-if="canEditAttachments" class="upload-zone">
        <label class="upload-label">
          <i class="pi pi-upload"></i>
          <span>{{ uploadingAttachments ? 'กำลังอัปโหลด...' : 'คลิกเพื่อเพิ่มเอกสาร' }}</span>
          <input type="file" multiple :disabled="uploadingAttachments"
            @change="uploadAttachmentFiles" class="upload-input" />
        </label>
        <small class="upload-hint">สามารถเพิ่มได้ถึง {{ attachmentDeadlineText }}</small>
      </div>

      <div v-if="selectedAttachments.length === 0" class="no-attachments">
        <i class="pi pi-file" style="font-size: 3rem; color: #ccc;"></i>
        <p>ไม่มีเอกสารแนบ</p>
      </div>
      <div v-else class="attachments-list">
        <div v-for="(file, index) in selectedAttachments" :key="index" class="attachment-item">
          <div class="file-info">
            <img v-if="isImageFile(file)" :src="getFileUrl(file)" class="file-preview" @click="viewFullImage(file)" />
            <i v-else :class="getFileIcon(file)" class="file-icon"></i>
            <div class="file-details">
              <span class="file-name">{{ file }}</span>
              <small class="file-type">{{ getFileType(file) }}</small>
            </div>
          </div>
          <div class="file-actions">
            <Button icon="pi pi-download" size="small" severity="success" outlined @click="downloadFile(file)"
              v-tooltip="'ดาวน์โหลด'" />
            <Button v-if="canEditAttachments" icon="pi pi-trash" size="small" severity="danger" outlined
              @click="deleteAttachment(file)" v-tooltip="'ลบเอกสาร'" />
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <Button label="ปิด" icon="pi pi-times" @click="showAttachmentsDialog = false" />
    </template>
  </Dialog>

  <!-- Full Image Dialog -->
  <Dialog v-model:visible="fullImageDialog" modal header="รูปภาพ" :style="{ width: '90vw', maxWidth: '900px' }"
    :draggable="false">
    <img :src="fullImageUrl" class="full-image" />
  </Dialog>

  <!-- User Info Dialog -->
  <UserInfoDialog v-model:visible="showUserInfoDialog" :user-name="selectedUserName" :user-id="selectedUserId" />

  <!-- Reject Reason Dialog -->
  <Dialog v-model:visible="showRejectReasonDialog" modal header="เหตุผลที่ไม่อนุมัติ" :style="{ width: '400px' }"
    :draggable="false">
    <div class="reject-reason-content">
      <i class="pi pi-info-circle"></i>
      <p>{{ selectedRejectReason }}</p>
    </div>
  </Dialog>

  <!-- Cancel Leave Reason Dialog -->
  <Dialog v-model:visible="showCancelDialog" modal header="ขอยกเลิกการลา" :style="{ width: '480px' }"
    :draggable="false">
    <div class="cancel-reason-content">
      <p class="cancel-reason-label">กรุณาระบุเหตุผลในการขอยกเลิกการลา *</p>
      <Textarea v-model="cancelReason" rows="4" autoResize class="cancel-reason-textarea"
        placeholder="เช่น ลาไม่จำเป็นแล้ว, มีการเปลี่ยนแผนงาน, ฯลฯ" />
    </div>
    <template #footer>
      <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="closeCancelDialog" />
      <Button label="ส่งคำขอยกเลิก" icon="pi pi-check" severity="danger" @click="submitCancelRequest" />
    </template>
  </Dialog>

  <!-- View Cancel Reason Dialog -->
  <Dialog v-model:visible="showCancelViewDialog" modal header="เหตุผลขอยกเลิกการลา" :style="{ width: '400px' }"
    :draggable="false">
    <div class="cancel-reason-view-content">
      <i class="pi pi-info-circle"></i>
      <p>{{ selectedCancelReason || '-' }}</p>
    </div>
  </Dialog>
</template>

<script>
import axios from '@/utils/axiosConfig'
import UserInfoDialog from '@/components/UserInfoDialog.vue'
import EnhancedDataTable from '@/components/EnhancedDataTable.vue'

export default {
  name: 'LeaveHistory',
  components: {
    UserInfoDialog,
    EnhancedDataTable
  },
  emits: ['view-attachments', 'request-deleted'],
  inject: ['$confirm', '$toast'],
  props: {
    records: Array,
    showSensitiveColumns: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showWorkDetailsDialog: false,
      selectedWorkDetails: '',
      showAttachmentsDialog: false,
      selectedAttachments: [],
      selectedRecord: null,
      uploadingAttachments: false,
      fullImageDialog: false,
      fullImageUrl: '',
      leaveTypes: [],
      showUserInfoDialog: false,
      selectedUserName: '',
      selectedUserId: null,
      showRejectReasonDialog: false,
      selectedRejectReason: '',
      showCancelDialog: false,
      cancelReason: '',
      cancelRecord: null,
      showCancelViewDialog: false,
      selectedCancelReason: '',
      isLevel2Approver: false,
      workHours: {
        start_time: '09:00',
        end_time: '18:00',
        lunch_start: '12:00',
        lunch_end: '13:00'
      },
      workHoursCache: {},
      // Date search
      dateSearchStart: null,
      dateSearchEnd: null
    }
  },
  computed: {
    dateFilteredRecords() {
      if (!this.dateSearchStart && !this.dateSearchEnd) return this.records
      const toStr = (d) => {
        const dt = new Date(d)
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
      }
      const s = this.dateSearchStart ? toStr(this.dateSearchStart) : '0000-00-00'
      const e = this.dateSearchEnd ? toStr(this.dateSearchEnd) : '9999-12-31'
      return (this.records || []).filter(r => {
        if (!r.start_datetime) return false
        const rStart = r.start_datetime.substring(0, 10)
        const rEnd = (r.end_datetime || r.start_datetime).substring(0, 10)
        return rStart <= e && rEnd >= s
      })
    },
    hoursPerDay() {
      const [wsH, wsM] = this.workHours.start_time.split(':').map(Number)
      const [weH, weM] = this.workHours.end_time.split(':').map(Number)
      const [lsH, lsM] = this.workHours.lunch_start.split(':').map(Number)
      const [leH, leM] = this.workHours.lunch_end.split(':').map(Number)
      const morning = (lsH * 60 + (lsM || 0)) - (wsH * 60 + (wsM || 0))
      const afternoon = (weH * 60 + (weM || 0)) - (leH * 60 + (leM || 0))
      return (morning + afternoon) / 60
    },
    canEditAttachments() {
      if (!this.selectedRecord) return false
      const currentUserId = localStorage.getItem('soc_user_id')
      const currentUserName = `${localStorage.getItem('soc_firstname')} ${localStorage.getItem('soc_lastname')}`.trim()
      const isOwner = (this.selectedRecord.user_id == currentUserId) || (this.selectedRecord.employee_name === currentUserName)
      if (!isOwner) return false
      const now = new Date()
      const createdAt = new Date(this.selectedRecord.created_at)
      createdAt.setHours(0, 0, 0, 0)
      const deadline = new Date(this.selectedRecord.end_datetime)
      deadline.setDate(deadline.getDate() + 15)
      deadline.setHours(23, 59, 59, 999)
      return now >= createdAt && now <= deadline
    },
    attachmentDeadlineText() {
      if (!this.selectedRecord) return ''
      const deadline = new Date(this.selectedRecord.end_datetime)
      deadline.setDate(deadline.getDate() + 15)
      return deadline.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    }
  },
  async mounted() {
    await this.loadLeaveTypes()
    await this.loadWorkHours()
    await this.checkIsLevel2Approver()
    if (this.records?.length) await this.preloadWorkHoursForRecords(this.records)
  },
  watch: {
    records(newRecords) {
      if (newRecords?.length) this.preloadWorkHoursForRecords(newRecords)
    }
  },
  created() {
    this.$http = axios
  },
  methods: {
    isValidIntId(id) {
      return typeof id === 'number' ? Number.isInteger(id) : /^\d+$/.test(String(id || ''))
    },
    async loadWorkHours() {
      try {
        const role = localStorage.getItem('soc_role') || 'user'
        const response = await this.$http.get(`/api/settings/role-work-hours/${role}`)
        this.workHours = {
          start_time: response.data.start_time?.substring(0, 5) || '09:00',
          end_time: response.data.end_time?.substring(0, 5) || '18:00',
          lunch_start: response.data.lunch_start?.substring(0, 5) || '12:00',
          lunch_end: response.data.lunch_end?.substring(0, 5) || '13:00'
        }
      } catch { /* ignore */ }
    },
    async getWorkHoursForRole(role) {
      if (!role) return this.workHours
      if (this.workHoursCache[role]) return this.workHoursCache[role]
      try {
        const response = await this.$http.get(`/api/settings/role-work-hours/${role}`)
        const wh = {
          start_time: response.data.start_time?.substring(0, 5) || '09:00',
          end_time: response.data.end_time?.substring(0, 5) || '18:00',
          lunch_start: response.data.lunch_start?.substring(0, 5) || '12:00',
          lunch_end: response.data.lunch_end?.substring(0, 5) || '13:00'
        }
        this.workHoursCache[role] = wh
        return wh
      } catch { /* ignore */ }
      return this.workHours
    },
    async preloadWorkHoursForRecords(records) {
      const roles = [...new Set(records.map(r => r.employee_role).filter(Boolean))]
      await Promise.all(roles.map(role => this.getWorkHoursForRole(role)))
    },
    async checkIsLevel2Approver() {
      try {
        const userId = localStorage.getItem('soc_user_id')
        if (!userId) return
        const res = await this.$http.get(`/api/leave/is-level2-approver/${userId}`)
        this.isLevel2Approver = !!res.data?.isLevel2Approver
      } catch {
        this.isLevel2Approver = false
      }
    },
    calculateHours(data) {
      const wh = this.workHoursCache[data.employee_role] || this.workHours
      if (data.employee_role && !this.workHoursCache[data.employee_role]) {
        this.getWorkHoursForRole(data.employee_role)
      }
      const start = new Date(data.start_datetime)
      const end = new Date(data.end_datetime)
      const [ws, wsm = 0] = wh.start_time.split(':').map(Number)
      const [we, wem = 0] = wh.end_time.split(':').map(Number)
      const [ls, lsm = 0] = wh.lunch_start.split(':').map(Number)
      const [le, lem = 0] = wh.lunch_end.split(':').map(Number)

      const wsMin = ws * 60 + wsm, weMin = we * 60 + wem
      const lsMin = ls * 60 + lsm, leMin = le * 60 + lem
      const fullDayMinutes = (lsMin - wsMin) + (weMin - leMin)

      const startDate = new Date(start); startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(end); endDate.setHours(0, 0, 0, 0)
      let totalMinutes = 0

      const calcDayMinutes = (s, e) => {
        const sMin = s.getHours() * 60 + s.getMinutes()
        const eMin = e.getHours() * 60 + e.getMinutes()
        let mins = 0
        const mStart = Math.max(sMin, wsMin), mEnd = Math.min(eMin, lsMin)
        if (mEnd > mStart) mins += mEnd - mStart
        const aStart = Math.max(sMin, leMin), aEnd = Math.min(eMin, weMin)
        if (aEnd > aStart) mins += aEnd - aStart
        if (mins >= fullDayMinutes * 0.9) return fullDayMinutes
        return Math.max(0, mins)
      }

      if (startDate.getTime() === endDate.getTime()) {
        totalMinutes = calcDayMinutes(start, end)
      } else {
        const current = new Date(startDate)
        while (current <= endDate) {
          const day = current.getDay()
          if (day !== 0 && day !== 6) {
            if (current.getTime() === startDate.getTime()) {
              const dayEnd = new Date(current); dayEnd.setHours(we, wem, 0, 0)
              totalMinutes += calcDayMinutes(start, dayEnd)
            } else if (current.getTime() === endDate.getTime()) {
              const dayStart = new Date(current); dayStart.setHours(ws, wsm, 0, 0)
              totalMinutes += calcDayMinutes(dayStart, end)
            } else {
              totalMinutes += fullDayMinutes
            }
          }
          current.setDate(current.getDate() + 1)
        }
      }
      const hours = totalMinutes / 60
      return Number.isInteger(hours) ? hours : hours.toFixed(1)
    },
    async loadLeaveTypes() {
      try {
        const response = await this.$http.get('/api/leave/leave-types')
        this.leaveTypes = response.data
      } catch { // ignore

      }
    },
    getLeaveTypeColor(type) {
      const leaveType = this.leaveTypes.find(lt => lt.value === type)
      return leaveType?.color || '#6c757d'
    },
    canDeleteRequest(record) {
      // ตรวจสอบว่าเป็นคำขอของตัวเองและยัง pending
      const currentUserName = `${localStorage.getItem('soc_firstname')} ${localStorage.getItem('soc_lastname')}`.trim()
      return record.employee_name === currentUserName && record.status === 'pending'
    },

    confirmDelete(record) {
      this.$confirm.require({
        message: `คุณต้องการลบคำขอลางานนี้หรือไม่?\n\nประเภท: ${this.getLeaveTypeLabel(record.leave_type)}\nวันที่: ${this.formatDateTime(record.start_datetime)}`,
        header: 'ยืนยันการลบ',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'ลบ',
        rejectLabel: 'ยกเลิก',
        accept: () => {
          this.deleteRequest(record.id)
        }
      })
    },

    async deleteRequest(id) {
      try {
        if (!this.isValidIntId(id)) {
          this.$toast.add({
            severity: 'error',
            summary: 'ลบไม่สำเร็จ',
            detail: 'ข้อมูลรหัสคำขอไม่ถูกต้อง',
            life: 4000
          })
          return
        }

        await this.$http.delete(`/api/leave/${id}`, {
          headers: {
          }
        })

        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'ลบคำขอลางานเรียบร้อยแล้ว',
          life: 3000
        })

        // Emit event เพื่อ refresh ข้อมูล
        this.$emit('request-deleted')

      } catch (err) {
        this.$toast.add({
          severity: 'error',
          summary: 'ลบไม่สำเร็จ',
          detail: err.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง',
          life: 4000
        })
      }
    },

    showWorkDetails(workDetails) {
      this.selectedWorkDetails = workDetails
      this.showWorkDetailsDialog = true
    },

    isOwnerRecord(record) {
      const currentUserId = localStorage.getItem('soc_user_id')
      const currentUserName = `${localStorage.getItem('soc_firstname')} ${localStorage.getItem('soc_lastname')}`.trim()
      return (record.user_id == currentUserId) || (record.employee_name === currentUserName)
    },

    canEditRecord(record) {
      if (!this.isOwnerRecord(record)) return false
      const now = new Date()
      const createdAt = new Date(record.created_at)
      createdAt.setHours(0, 0, 0, 0)
      const deadline = new Date(record.end_datetime)
      deadline.setDate(deadline.getDate() + 15)
      deadline.setHours(23, 59, 59, 999)
      return now >= createdAt && now <= deadline
    },

    showAttachments(record) {
      this.selectedRecord = record
      this.selectedAttachments = record.attachments ? [...record.attachments] : []
      this.showAttachmentsDialog = true
    },

    async uploadAttachmentFiles(event) {
      const files = event.target.files
      if (!files || files.length === 0) return
      this.uploadingAttachments = true
      try {
        const formData = new FormData()
        for (const file of files) formData.append('files', file)
        const uploadRes = await this.$http.post('/api/files/upload?type=leave', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const newFiles = uploadRes.data.files || []
        const updated = [...this.selectedAttachments, ...newFiles]
        await this.$http.put(`/api/leave/${this.selectedRecord.id}/attachments`, { attachments: updated })
        this.selectedAttachments = updated
        this.selectedRecord.attachments = updated
        this.$toast.add({ severity: 'success', summary: 'สำเร็จ', detail: `เพิ่มเอกสาร ${newFiles.length} ไฟล์`, life: 3000 })
      } catch (err) {
        this.$toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: err.response?.data?.error || 'อัปโหลดไม่สำเร็จ', life: 3000 })
      } finally {
        this.uploadingAttachments = false
        event.target.value = ''
      }
    },

    async deleteAttachment(fileName) {
      try {
        await this.$confirm.require({
          message: 'ต้องการลบเอกสารแนบนี้ใช่หรือไม่?',
          header: 'ยืนยันการลบ',
          icon: 'pi pi-exclamation-triangle',
          acceptClass: 'p-button-danger',
          acceptLabel: 'ลบ',
          rejectLabel: 'ยกเลิก',
          accept: async () => {
            try {
              await this.$http.delete(`/api/files/${fileName}`)
            } catch { /* ไม่หยุดแม้ลบไฟล์ไม่สำเร็จ */ }
            const updated = this.selectedAttachments.filter(f => f !== fileName)
            await this.$http.put(`/api/leave/${this.selectedRecord.id}/attachments`, { attachments: updated })
            this.selectedAttachments = updated
            this.selectedRecord.attachments = updated
            this.$toast.add({ severity: 'success', summary: 'ลบสำเร็จ', detail: 'ลบเอกสารแนบแล้ว', life: 3000 })
          }
        })
      } catch { /* user ยกเลิก */ }
    },

    async downloadFile(fileName) {
      try {
        const response = await this.$http.get(`/api/files/download/${fileName}`, {
          responseType: 'blob'
        })

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        // Extract original filename (remove timestamp prefix)
        const originalName = fileName.split('-').slice(2).join('-') || fileName
        link.download = originalName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        this.$toast.add({
          severity: 'success',
          summary: 'ดาวน์โหลดสำเร็จ',
          detail: originalName,
          life: 3000
        })
      } catch {
        this.$toast.add({
          severity: 'error',
          summary: 'ดาวน์โหลดไม่สำเร็จ',
          detail: 'ไฟล์อาจถูกลบหรือไม่พร้อมใช้งาน',
          life: 4000
        })
      }
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

    handleImageError(e) {
      e.target.style.display = 'none'
      e.target.nextElementSibling?.style?.removeProperty('display')
    },

    getFileIcon(fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase()
      const icons = {
        pdf: 'pi pi-file-pdf',
        doc: 'pi pi-file-word',
        docx: 'pi pi-file-word',
        xls: 'pi pi-file-excel',
        xlsx: 'pi pi-file-excel',
        jpg: 'pi pi-image',
        jpeg: 'pi pi-image',
        png: 'pi pi-image',
        gif: 'pi pi-image'
      }
      return icons[extension] || 'pi pi-file'
    },

    getFileType(fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase()
      const types = {
        pdf: 'PDF Document',
        doc: 'Word Document',
        docx: 'Word Document',
        xls: 'Excel Spreadsheet',
        xlsx: 'Excel Spreadsheet',
        jpg: 'JPEG Image',
        jpeg: 'JPEG Image',
        png: 'PNG Image',
        gif: 'GIF Image'
      }
      return types[extension] || 'Unknown File'
    },
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Bangkok'
      })
    },
    formatDateTime(datetime) {
      if (!datetime) return '-'
      const date = new Date(datetime)
      return date.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok'
      })
    },
    calculateDays(startDateTime, endDateTime) {
      if (!startDateTime || !endDateTime) return 0
      const start = new Date(startDateTime)
      const end = new Date(endDateTime)
      const diffMs = end - start
      const diffHours = diffMs / (1000 * 60 * 60)
      return diffHours / 8
    },
    getLeaveTypeLabel(type) {
      const types = {
        sick: 'ลาป่วย',
        personal: 'ลากิจ',
        vacation: 'ลาพักร้อน',
        maternity: 'ลาคลอด',
        other: 'ลาอื่นๆ'
      }
      return types[type] || type
    },
    getStatusStyle(status) {
      const styles = {
        pending: {
          backgroundColor: '#facc15', // เหลือง - รอหัวหน้า
          color: '#1f2937'
        },
        pending_level2: {
          backgroundColor: '#3b82f6', // ฟ้า - รอ HR
          color: '#ffffff'
        },
        approved: {
          backgroundColor: '#22c55e', // เขียว - อนุมัติแล้ว
          color: '#ffffff'
        },
        rejected: {
          backgroundColor: '#ef4444', // แดง - ไม่อนุมัติ
          color: '#ffffff'
        },
        cancel: {
          backgroundColor: '#a855f7', // ม่วง - รออนุมัติการยกเลิก
          color: '#ffffff'
        },
        cancelled: {
          backgroundColor: '#9ca3af', // เทา - ยกเลิกแล้ว
          color: '#111827'
        }
      }
      return styles[status] || {
        backgroundColor: '#e5e7eb',
        color: '#111827'
      }
    },

    canRequestCancel(record) {
      const currentUserId = localStorage.getItem('soc_user_id')
      const currentUserName = `${localStorage.getItem('soc_firstname')} ${localStorage.getItem('soc_lastname')}`.trim()

      // ตรวจสอบว่าเป็นของตัวเอง
      const isOwner = (record.user_id == currentUserId) || (record.employee_name === currentUserName)
      if (!isOwner) return false

      // กรณีอนุมัติขั้นที่ 1 แล้ว (รอ HR) ให้ขอยกเลิกได้เสมอ
      if (record.status === 'pending_level2') {
        return true
      }

      // อนุมัติครบ 2 ขั้นแล้วเท่านั้นค่อยเช็ค "เวลาเริ่มลา" ต้องอยู่ในอนาคต
      if (record.status !== 'approved') return false

      const now = new Date()
      const startDateTime = new Date(record.start_datetime)

      // แสดงปุ่มเฉพาะกรณีที่เวลาเริ่มลา > เวลาปัจจุบัน (รวมเคสวันเดียวกันแต่ยังไม่ถึงเวลา)
      return startDateTime > now
    },

    requestCancel(record) {
      this.cancelRecord = record
      this.cancelReason = ''
      this.showCancelDialog = true
    },

    async submitCancelRequest() {
      if (!this.cancelReason || !this.cancelReason.trim()) {
        this.$toast.add({
          severity: 'error',
          summary: 'กรุณาระบุเหตุผล',
          detail: 'โปรดกรอกเหตุผลในการขอยกเลิกการลา',
          life: 3000
        })
        return
      }

      if (!this.cancelRecord) return

      try {
        await this.$http.post(`/api/leave/${this.cancelRecord.id}/request-cancel`, {
          reason: this.cancelReason.trim()
        })

        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'ส่งคำขอยกเลิกเรียบร้อย รอ HR อนุมัติ',
          life: 3000
        })

        this.showCancelDialog = false
        this.cancelRecord = null
        this.cancelReason = ''

        this.$emit('request-deleted')
      } catch (err) {
        this.$toast.add({
          severity: 'error',
          summary: 'ส่งคำขอไม่สำเร็จ',
          detail: err.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง',
          life: 4000
        })
      }
    },

    closeCancelDialog() {
      this.showCancelDialog = false
      this.cancelRecord = null
      this.cancelReason = ''
    },

    showCancelReason(reason) {
      this.selectedCancelReason = reason
      this.showCancelViewDialog = true
    },

    canHrResetQuota(record) {
      if (!this.isLevel2Approver || !record) return false
      // ให้ Level 2 Approver จัดการเฉพาะคำขอที่เคยอนุมัติแล้วหรืออยู่ระหว่างกระบวนการยกเลิก
      return ['approved', 'cancel', 'cancelled', 'pending_level2'].includes(record.status)
    },

    confirmHrReset(record) {
      this.$confirm.require({
        message: `คุณต้องการลบคำขอนี้และคืนโควต้าการลาหรือไม่?\n\nประเภท: ${this.getLeaveTypeLabel(record.leave_type)}\nช่วงวันที่ลา: ${this.formatDateTime(record.start_datetime)} - ${this.formatDateTime(record.end_datetime)}\nจำนวน: ${record.total_days} วัน (${this.calculateHours(record)} ชม.)`,
        header: 'ยืนยันลบและคืนโควต้า (HR)',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'ลบและคืนโควต้า',
        rejectLabel: 'ยกเลิก',
        accept: () => this.hrResetQuota(record)
      })
    },

    async hrResetQuota(record) {
      try {
        if (!this.isValidIntId(record?.id)) {
          this.$toast.add({
            severity: 'error',
            summary: 'ดำเนินการไม่สำเร็จ',
            detail: 'ข้อมูลรหัสคำขอไม่ถูกต้อง',
            life: 4000
          })
          return
        }

        await this.$http.delete(`/api/leave/${record.id}/admin-reset`)

        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'ลบคำขอและคืนโควต้าการลาเรียบร้อยแล้ว',
          life: 3000
        })

        this.$emit('request-deleted')
      } catch (err) {
        this.$toast.add({
          severity: 'error',
          summary: 'ดำเนินการไม่สำเร็จ',
          detail: err.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง',
          life: 4000
        })
      }
    },

    getStatusLabel(status) {
      const labels = {
        'pending': 'รอหัวหน้างานอนุมัติ',
        'pending_level2': 'รอ HR อนุมัติ',
        'approved': 'อนุมัติแล้ว',
        'rejected': 'ไม่อนุมัติ',
        'cancel': 'รอ HR อนุมัติการยกเลิก',
        'cancelled': 'ยกเลิกแล้ว'
      }
      return labels[status] || status
    },
    viewAttachments(attachments) {
      this.$emit('view-attachments', attachments)
    },

    showUserInfo(userName, userId) {
      this.selectedUserName = userName
      this.selectedUserId = userId
      this.showUserInfoDialog = true
    },

    showApproverInfo(approverInfo) {
      // approved_by format: "ชื่อ นามสกุล (ตำแหน่ง)"
      // แยกเอาแค่ชื่อออกมา
      const approverName = approverInfo.split('(')[0].trim()
      this.selectedUserName = approverName
      this.selectedUserId = null
      this.showUserInfoDialog = true
    },

    showRejectReason(reason) {
      this.selectedRejectReason = reason
      this.showRejectReasonDialog = true
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

.history-table :deep(th.text-center) {
  text-align: center;
}

.history-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #f1f3f4;
  vertical-align: middle;
  text-align: center;
}

.history-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f8f9fa;
}

.history-table :deep(.p-badge) {
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  white-space: normal;
  text-align: center;
  line-height: 1.2;
}

.reason-text {
  max-width: 200px;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reason-text-wrap {
  width: 100%;
  display: block;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.4;
  text-align: left;
}

.delegate-info {
  text-align: left;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.delegate-info>div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.delegate-info>div:last-child {
  margin-bottom: 0;
}

.delegate-info i {
  color: #6c757d;
  width: 16px;
  text-align: center;
}

.delegate-name strong {
  color: #495057;
  font-size: 0.95rem;
}

.delegate-role small {
  color: #6c757d;
  font-weight: 500;
}

.delegate-contact .contact-info {
  color: #28a745 !important;
  font-weight: 500;
}

.work-details-btn {
  margin-top: 0.5rem;
}

.work-details-btn .p-button {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.work-details-content {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #17a2b8;
  line-height: 1.6;
  font-size: 0.95rem;
}

.attachments-content {
  padding: 1rem;
}

.upload-zone {
  border: 2px dashed #0ea5e9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f0f9ff;
  text-align: center;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  color: #0369a1;
  font-weight: 500;
}

.upload-input {
  display: none;
}

.upload-hint {
  color: #6c757d;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.no-attachments {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-preview {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  cursor: pointer;
}

.file-preview:hover {
  opacity: 0.8;
}

.full-image {
  width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.file-icon {
  font-size: 2rem;
  color: #6c757d;
}

.file-details {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 600;
  color: #495057;
}

.file-type {
  color: #6c757d;
  font-size: 0.85rem;
}

.file-actions {
  display: flex;
  gap: 0.5rem;
}

.approver-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #28a745;
  font-weight: 500;
}

.approver-info i {
  color: #28a745;
}

.no-approver {
  color: #6c757d;
  font-style: italic;
}

.no-delegation {
  color: #6c757d;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.attachments-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #495057;
  font-size: 0.9rem;
}

.attachments-info i {
  color: #6c757d;
}

.view-icon {
  font-size: 1.2rem;
  color: #28a745;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-icon:hover {
  color: #20c997;
  transform: scale(1.1);
}

.custom-id-badge :deep(.p-badge) {
  background: #87CEEB !important;
  color: #2c3e50 !important;
  font-weight: 600 !important;
  border-radius: 20px !important;
  padding: 0.5rem 0.75rem !important;
  font-size: 0.875rem !important;
}

.clickable-name {
  color: #4A90E2;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.clickable-name:hover {
  color: #2563eb;
  text-decoration: underline;
}

.no-delegation {
  color: #6c757d;
  font-style: italic;
}

.approver-info {
  text-align: left;
}

.approver-info strong {
  color: #495057;
}

.approval-comment {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #28a745;
}

.approval-comment small {
  color: #495057;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .history-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }

  .reason-text {
    max-width: 150px;
  }

  .delegate-info {
    font-size: 0.85rem;
  }

  .history-table :deep(.p-datatable-thead > tr > th) {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }

  .history-table :deep(.p-badge) {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }

  .empty-state {
    padding: 3rem 1rem;
  }

  .empty-state p {
    font-size: 1rem;
  }

  .approver-info {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .history-card {
    margin: 0;
    border-radius: 8px;
  }

  .history-table :deep(.p-datatable) {
    font-size: 0.8rem;
  }

  .history-table :deep(.p-datatable-wrapper) {
    overflow-x: auto;
  }

  .history-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.5rem 0.25rem;
    font-size: 0.8rem;
    min-width: 100px;
  }

  .history-table :deep(.p-datatable-thead > tr > th) {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
    min-width: 100px;
  }

  .reason-text {
    max-width: 100px;
  }

  .delegate-info {
    font-size: 0.75rem;
    padding: 0.25rem;
  }

  .history-table :deep(.p-badge) {
    padding: 0.3rem 0.5rem;
    font-size: 0.7rem;
  }

  .empty-state {
    padding: 2rem 0.5rem;
  }

  .empty-state i {
    font-size: 3rem !important;
  }

  .empty-state p {
    font-size: 0.9rem;
  }

  .approver-info {
    font-size: 0.75rem;
  }

  .history-table :deep(.p-paginator) {
    padding: 0.5rem;
    flex-wrap: wrap;
  }

  .history-table :deep(.p-paginator .p-paginator-pages .p-paginator-page) {
    min-width: 2rem;
    height: 2rem;
    font-size: 0.8rem;
  }
}

.status-container-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.action-buttons-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.hr-action-row {
  margin-top: 0.25rem;
  display: flex;
  justify-content: center;
}

.action-btn {
  min-width: 100px !important;
  font-size: 0.85rem !important;
  padding: 0.5rem 1rem !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  border: none !important;
}

.action-btn.p-button-danger {
  background: #ef4444 !important;
  color: white !important;
}

.action-btn.p-button-warning {
  background: #f59e0b !important;
  color: white !important;
}

.status-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.status-badge-large {
  font-size: 0.9rem !important;
  padding: 0.5rem 1rem !important;
  font-weight: 600 !important;
  border-radius: 20px !important;
}

.delete-btn {
  width: 2rem !important;
  height: 2rem !important;
  padding: 0 !important;
}

.delete-btn .p-button-icon {
  font-size: 0.9rem;
}

.cancel-btn {
  width: 2rem !important;
  height: 2rem !important;
  padding: 0 !important;
}

.cancel-btn .p-button-icon {
  font-size: 0.9rem;
}

.approver-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.approver-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border-left: 3px solid #94a3b8;
}

.approver-item.approved {
  border-left-color: #10b981;
}

.approver-item.rejected {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.approver-badge-wrapper {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.approver-badge-wrapper i {
  color: #10b981;
  font-size: 1rem;
}

.approver-badge-wrapper .p-badge {
  font-size: 0.75rem !important;
  padding: 0.3rem 0.6rem !important;
  font-weight: 600 !important;
}

.approver-text {
  font-size: 0.9rem;
  color: #1e293b;
  font-weight: 500;
}

.no-approver {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #94a3b8;
  font-size: 0.85rem;
  font-style: italic;
  padding: 0.5rem;
}

.no-approver i {
  font-size: 1rem;
}

.approver-name {
  font-size: 0.85rem;
  color: #495057;
}

.no-approver {
  color: #adb5bd;
}

.approver-item.disabled {
  opacity: 0.5;
}

.rejected-text {
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pending-text {
  color: #94a3b8;
  font-style: italic;
}

.cancel-pending-text {
  color: #f59e0b;
  font-weight: 600;
  font-style: italic;
}

.approver-item.pending-cancel {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.reject-reason-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef2f2;
  border-radius: 8px;
  border-left: 3px solid #ef4444;
}

.reject-reason-content i {
  color: #ef4444;
  font-size: 1.25rem;
  margin-top: 2px;
}

.reject-reason-content p {
  margin: 0;
  color: #991b1b;
  line-height: 1.5;
}

.cancel-reason-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cancel-reason-label {
  margin: 0;
  font-weight: 600;
  color: #374151;
}

.cancel-reason-textarea :deep(.p-inputtextarea) {
  width: 100%;
}

.cancel-reason-view-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #eff6ff;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}

.cancel-reason-view-content i {
  color: #2563eb;
  font-size: 1.25rem;
  margin-top: 2px;
}

.cancel-reason-view-content p {
  margin: 0;
  color: #1e3a8a;
  line-height: 1.5;
}

.cancel-reason-eye-row {
  margin-top: 0.25rem;
}

.date-search-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.date-search-cal {
  width: 165px;
}

.date-search-sep {
  color: #94a3b8;
  font-weight: 300;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .date-search-controls {
    width: 100%;
  }

  .date-search-cal {
    width: 100%;
  }
}
</style>
