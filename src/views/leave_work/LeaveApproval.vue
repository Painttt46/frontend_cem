<template>
  <Card class="approval-card">
    <template #content>
      <div v-if="records.length === 0" class="empty-state">
        <i class="pi pi-check-circle" style="font-size: 4rem; color: #ccc;"></i>
        <p>ไม่มีคำขอลางานที่รอการอนุมัติ</p>
      </div>

      <DataTable v-else :value="records" :paginator="true" :rows="10"
        :rowsPerPageOptions="[5, 10, 20]" responsiveLayout="scroll" class="approval-table" stripedRows>
        
        <Column field="id" header="Ticket ID" :sortable="true" style="min-width: 120px;">
          <template #body="slotProps">
            <div class="ticket-id-container">
              <Badge :value="`#${String(slotProps.data.id).padStart(4, '0')}`" class="ticket-badge" />
            </div>
          </template>
        </Column>

        <Column field="employee_name" header="ชื่อ-นามสกุล" :sortable="true">
          <template #body="slotProps">
            <span class="clickable-name" @click="showUserInfo(slotProps.data.user_id)">
              {{ slotProps.data.employee_name }}
            </span>
          </template>
        </Column>
        <Column field="employee_position" header="ตำแหน่ง" :sortable="true" />
        
        <Column field="leave_type" header="ประเภทการลา" :sortable="true">
          <template #body="slotProps">
            <Badge :value="getLeaveTypeLabel(slotProps.data.leave_type)" :style="{ backgroundColor: getLeaveTypeColor(slotProps.data.leave_type), color: '#fff', fontWeight: 'bold' }" />
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

        <Column header="จำนวน">
          <template #body="slotProps">
            {{ slotProps.data.total_days }} วัน ({{ calculateHours(slotProps.data) }} ชม.)
          </template>
        </Column>

        <Column field="reason" header="เหตุผล" style="min-width: 160px; width: 160px;">
          <template #body="slotProps">
            <span class="reason-text-wrap">{{ slotProps.data.reason || '-' }}</span>
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
                <Button 
                  icon="pi pi-list" 
                  label="ดูรายละเอียดงาน" 
                  size="small" 
                  severity="info" 
                  outlined
                  @click="showWorkDetails(slotProps.data.work_details)"
                />
              </div>
            </div>
            <span v-else class="no-delegation">
              <i class="pi pi-times-circle"></i>
              ไม่มีการมอบหมายงาน
            </span>
          </template>
        </Column>

        <Column header="เอกสารแนบ" style="width: 80px;">
          <template #body="slotProps">
            <div v-if="slotProps.data.attachments && slotProps.data.attachments.length > 0" class="attachments-info">
              <Button 
                icon="pi pi-paperclip" 
                size="small" 
                severity="info" 
                outlined
                @click="showAttachments(slotProps.data.attachments)"
                v-tooltip="`${slotProps.data.attachments.length} ไฟล์`"
              />
            </div>
            <span v-else>-</span>
          </template>
        </Column>

        <Column header="สถานะการอนุมัติ" style="min-width: 180px;">
          <template #body="slotProps">
            <div v-if="slotProps.data.status === 'cancel'" class="cancel-status-box">
              <div class="cancel-info">
                <i class="pi pi-exclamation-triangle" style="color: #f59e0b; font-size: 1.2rem;"></i>
                <span style="color: #92400e; font-weight: 600;">ขอยกเลิกการลาที่อนุมัติแล้ว</span>
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
            <div v-else class="approval-status-box">
              <div class="approval-step" :class="{ 'completed': slotProps.data.approved_by_level1 }">
                <i :class="slotProps.data.approved_by_level1 ? 'pi pi-check-circle' : 'pi pi-clock'"></i>
                <div class="step-info">
                  <span class="step-label">ขั้นที่ 1 (หัวหน้างาน)</span>
                  <span v-if="slotProps.data.approved_by_level1" class="step-approver">{{ slotProps.data.approved_by_level1 }}</span>
                  <span v-else class="step-pending">รอดำเนินการ</span>
                </div>
              </div>
              <div class="approval-step" :class="{ 'completed': slotProps.data.approved_by_level2, 'disabled': !slotProps.data.approved_by_level1 }">
                <i :class="slotProps.data.approved_by_level2 ? 'pi pi-check-circle' : 'pi pi-clock'"></i>
                <div class="step-info">
                  <span class="step-label">ขั้นที่ 2 (HR)</span>
                  <span v-if="slotProps.data.approved_by_level2" class="step-approver">{{ slotProps.data.approved_by_level2 }}</span>
                  <span v-else class="step-pending">รอดำเนินการ</span>
                </div>
              </div>
            </div>
          </template>
        </Column>

        <Column header="วันที่ส่งคำขอ" :sortable="true">
          <template #body="slotProps">
            {{ formatDateTime(slotProps.data.created_at) }}
          </template>
        </Column>

        <Column header="การดำเนินการ" :frozen="true" alignFrozen="right">
          <template #body="slotProps">
            <div class="action-buttons" v-if="canApproveRecord(slotProps.data)">
              <Button 
                v-if="slotProps.data.status === 'cancel'"
                icon="pi pi-check" 
                severity="success" 
                size="small"
                :disabled="disabled"
                :loading="disabled"
                @click="approveCancellation(slotProps.data.id)"
                v-tooltip="'อนุมัติยกเลิก'"
              />
              <Button 
                v-if="slotProps.data.status === 'cancel'"
                icon="pi pi-times" 
                severity="danger" 
                size="small"
                :disabled="disabled"
                @click="rejectCancellation(slotProps.data.id)"
                v-tooltip="'ไม่อนุมัติยกเลิก'"
              />
              <Button 
                v-if="slotProps.data.status !== 'cancel'"
                icon="pi pi-check" 
                severity="success" 
                size="small"
                :disabled="disabled"
                :loading="disabled"
                @click="$emit('approve-leave', slotProps.data.id)"
                v-tooltip="getApproveTooltip(slotProps.data)"
              />
              <Button 
                v-if="slotProps.data.status !== 'cancel'"
                icon="pi pi-times" 
                severity="danger" 
                size="small"
                :disabled="disabled"
                @click="$emit('reject-leave', slotProps.data.id)"
                v-tooltip="'ไม่อนุมัติ'"
              />
            </div>
            <div v-else class="status-badge">
              <Badge v-if="slotProps.data.status === 'pending'" value="รอหัวหน้างานอนุมัติ" severity="warning" />
              <Badge v-else-if="slotProps.data.status === 'pending_level2'" value="รอ HR อนุมัติ" severity="info" />
              <Badge v-else-if="slotProps.data.status === 'cancel'" value="รอ HR อนุมัติยกเลิก" severity="contrast" />
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <!-- Work Details Dialog -->
  <Dialog v-model:visible="showWorkDetailsDialog" modal header="รายละเอียดงานที่มอบหมาย" :style="{ width: '90vw', maxWidth: '800px' }" :draggable="false">
    <div class="work-details-content">
      <p>{{ selectedWorkDetails }}</p>
    </div>
    <template #footer>
      <Button label="ปิด" icon="pi pi-times" @click="showWorkDetailsDialog = false" />
    </template>
  </Dialog>

  <!-- Attachments Dialog -->
  <Dialog v-model:visible="showAttachmentsDialog" modal header="เอกสารแนบ" :style="{ width: '90vw', maxWidth: '900px' }" :draggable="false">
    <div class="attachments-content">
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
            <Button 
              icon="pi pi-download" 
              size="small" 
              severity="success" 
              outlined
              @click="downloadFile(file)"
              v-tooltip="'ดาวน์โหลด'"
            />
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <Button label="ปิด" icon="pi pi-times" @click="showAttachmentsDialog = false" />
    </template>
  </Dialog>

  <!-- Full Image Dialog -->
  <Dialog v-model:visible="fullImageDialog" modal header="รูปภาพ" :style="{ width: '90vw', maxWidth: '900px' }" :draggable="false">
    <img :src="fullImageUrl" class="full-image" />
  </Dialog>

  <UserInfoDialog v-model:visible="showUserDialog" :userId="selectedUserId" />

  <!-- View Cancel Reason Dialog -->
  <Dialog v-model:visible="showCancelReasonDialog" modal header="เหตุผลขอยกเลิกการลา" :style="{ width: '400px' }" :draggable="false">
    <div class="cancel-reason-view-content">
      <i class="pi pi-info-circle"></i>
      <p>{{ selectedCancelReason || '-' }}</p>
    </div>
  </Dialog>
</template>

<script>
import axios from '@/utils/axiosConfig'
import UserInfoDialog from '@/components/UserInfoDialog.vue'

import dragScroll from '@/mixins/dragScroll'
export default {
  mixins: [dragScroll],
  name: 'LeaveApproval',
  components: {
    UserInfoDialog
  },
  props: {
    records: Array,
    approverLevel: {
      type: Number,
      default: 0
    },
    disabled: {
      type: Boolean,
      default: false
    },
    isAdmin: {
      type: Boolean,
      default: false
    }
  },
  inject: ['$toast'],
  created() {
    this.$http = axios
  },
  data() {
    return {
      showWorkDetailsDialog: false,
      selectedWorkDetails: '',
      showAttachmentsDialog: false,
      selectedAttachments: [],
      fullImageDialog: false,
      fullImageUrl: '',
      leaveTypes: [],
      showUserDialog: false,
      selectedUserId: null,
      showCancelReasonDialog: false,
      selectedCancelReason: '',
      workHours: {
        start_time: '09:00',
        end_time: '18:00',
        lunch_start: '12:00',
        lunch_end: '13:00'
      }
    }
  },
  async mounted() {
    await this.loadLeaveTypes()
    await this.loadWorkHours()
  },
  methods: {
    showUserInfo(userId) {
      if (userId) {
        this.selectedUserId = userId
        this.showUserDialog = true
      }
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
    calculateHours(data) {
      const start = new Date(data.start_datetime)
      const end = new Date(data.end_datetime)
      const [ws, wsm = 0] = this.workHours.start_time.split(':').map(Number)
      const [we, wem = 0] = this.workHours.end_time.split(':').map(Number)
      const [ls, lsm = 0] = this.workHours.lunch_start.split(':').map(Number)
      const [le, lem = 0] = this.workHours.lunch_end.split(':').map(Number)
      const wsMin = ws * 60 + wsm, weMin = we * 60 + wem
      const lsMin = ls * 60 + lsm, leMin = le * 60 + lem
      const fullDayMinutes = (lsMin - wsMin) + (weMin - leMin)
      const startDate = new Date(start); startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(end); endDate.setHours(0, 0, 0, 0)
      let totalMinutes = 0
      const calcMins = (s, e) => {
        const sMin = s.getHours() * 60 + s.getMinutes()
        const eMin = e.getHours() * 60 + e.getMinutes()
        let m = 0
        const mS = Math.max(sMin, wsMin), mE = Math.min(eMin, lsMin)
        if (mE > mS) m += mE - mS
        const aS = Math.max(sMin, leMin), aE = Math.min(eMin, weMin)
        if (aE > aS) m += aE - aS
        return Math.max(0, m)
      }
      if (startDate.getTime() === endDate.getTime()) {
        totalMinutes = calcMins(start, end)
      } else {
        const cur = new Date(startDate)
        while (cur <= endDate) {
          const day = cur.getDay()
          if (day !== 0 && day !== 6) {
            if (cur.getTime() === startDate.getTime()) {
              const de = new Date(cur); de.setHours(we, wem, 0, 0)
              totalMinutes += calcMins(start, de)
            } else if (cur.getTime() === endDate.getTime()) {
              const ds = new Date(cur); ds.setHours(ws, wsm, 0, 0)
              totalMinutes += calcMins(ds, end)
            } else {
              totalMinutes += fullDayMinutes
            }
          }
          cur.setDate(cur.getDate() + 1)
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
    showWorkDetails(workDetails) {
      this.selectedWorkDetails = workDetails
      this.showWorkDetailsDialog = true
    },

    showAttachments(attachments) {
      this.selectedAttachments = attachments || []
      this.showAttachmentsDialog = true
    },

    async downloadFile(fileName) {
      try {
        const response = await this.$http.get(`/api/files/download/${fileName}`, {
          responseType: 'blob'
        })
        
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
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
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถดาวน์โหลดไฟล์ได้',
          life: 3000
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

    formatDate(datetime) {
      if (!datetime) return '-'
      const date = new Date(datetime)
      return date.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'Asia/Bangkok'
      })
    },
    calculateDays(startDateTime, endDateTime) {
      if (!startDateTime || !endDateTime) return 0
      const start = new Date(startDateTime)
      const end = new Date(endDateTime)
      const diffMs = end - start
      const diffHours = diffMs / (1000 * 60 * 60)
      // คำนวณเป็นวัน (8 ชม. = 1 วัน)
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
    showCancelReason(reason) {
      this.selectedCancelReason = reason
      this.showCancelReasonDialog = true
    },
    canApproveRecord(record) {
      // ต้องเป็น status ที่รออนุมัติเท่านั้น
      if (record.status !== 'pending' && record.status !== 'pending_level2' && record.status !== 'cancel') return false
      
      // การยกเลิกต้องเป็น Level 2 เท่านั้น
      if (record.status === 'cancel') {
        return this.approverLevel === 2 || this.approverLevel === 3
      }
      
      // Admin approve/reject ได้ทุกรายการ
      if (this.isAdmin) return true
      
      // approverLevel: 0 = ไม่มีสิทธิ์, 1 = level 1 only, 2 = level 2 only, 3 = ทั้งสอง
      if (this.approverLevel === 0) return false
      
      // มีสิทธิ์ทั้งสอง level
      if (this.approverLevel === 3) return true
      
      // Level 1 approver สามารถ approve ได้เฉพาะ status = 'pending'
      if (this.approverLevel === 1 && record.status === 'pending') return true
      
      // Level 2 approver สามารถ approve ได้เฉพาะ status = 'pending_level2'
      if (this.approverLevel === 2 && record.status === 'pending_level2') return true
      
      return false
    },
    getApproveTooltip(record) {
      if (record.status === 'pending') return 'อนุมัติขั้นที่ 1 (หัวหน้างาน)'
      if (record.status === 'pending_level2') return 'อนุมัติขั้นที่ 2 (HR)'
      if (record.status === 'cancel') return 'อนุมัติยกเลิก'
      return 'อนุมัติ'
    },

    async approveCancellation(leaveId) {
      this.$confirm.require({
        message: 'คุณต้องการอนุมัติการยกเลิกนี้หรือไม่?',
        header: 'ยืนยันการอนุมัติยกเลิก',
        icon: 'pi pi-check-circle',
        acceptClass: 'p-button-success',
        acceptLabel: 'อนุมัติ',
        rejectLabel: 'ยกเลิก',
        draggable: false,
        accept: async () => {
          try {
            const approverName = `${localStorage.getItem('soc_firstname')} ${localStorage.getItem('soc_lastname')}`.trim()
            const approverPosition = localStorage.getItem('soc_position') || 'ไม่ระบุตำแหน่ง'
            const approverInfo = `${approverName} (${approverPosition})`

            await this.$http.put(`/api/leave/${leaveId}/cancel-status`, {
              action: 'approve',
              approved_by: approverInfo
            })

            this.$toast.add({
              severity: 'success',
              summary: 'สำเร็จ',
              detail: 'อนุมัติยกเลิกการลาเรียบร้อย',
              life: 3000
            })

            this.$emit('close-form')
          } catch (err) {
            this.$toast.add({
              severity: 'error',
              summary: 'อนุมัติไม่สำเร็จ',
              detail: err.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง',
              life: 4000
            })
          }
        }
      })
    },

    async rejectCancellation(leaveId) {
      this.$confirm.require({
        message: 'คุณต้องการไม่อนุมัติการยกเลิกนี้หรือไม่? (การลาจะยังคงอนุมัติอยู่)',
        header: 'ยืนยันไม่อนุมัติยกเลิก',
        icon: 'pi pi-times-circle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'ไม่อนุมัติ',
        rejectLabel: 'ยกเลิก',
        draggable: false,
        accept: async () => {
          try {
            await this.$http.put(`/api/leave/${leaveId}/cancel-status`, {
              action: 'reject'
            })

            this.$toast.add({
              severity: 'info',
              summary: 'สำเร็จ',
              detail: 'ไม่อนุมัติการยกเลิก',
              life: 3000
            })

            this.$emit('close-form')
          } catch (err) {
            this.$toast.add({
              severity: 'error',
              summary: 'ดำเนินการไม่สำเร็จ',
              detail: err.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง',
              life: 4000
            })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.ticket-id-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.ticket-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  font-weight: 700 !important;
  font-size: 0.9rem !important;
  padding: 0.5rem 0.75rem !important;
  border-radius: 8px !important;
  border: 2px solid rgba(102, 126, 234, 0.2) !important;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3) !important;
  letter-spacing: 0.5px !important;
  min-width: 80px !important;
  text-align: center !important;
}

.approval-card {
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

.approval-table :deep(.p-datatable) {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.approval-table :deep(.p-datatable-thead > tr > th) {
  background: #f8f9fa;
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  padding: 1rem 0.75rem;
  font-size: 0.9rem;
}

.delegate-info {
  text-align: left;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.delegate-info > div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.delegate-info > div:last-child {
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

.work-details {
  flex-direction: column !important;
  align-items: flex-start !important;
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.work-details i {
  margin-bottom: 0.25rem;
}

.work-details small {
  color: #495057 !important;
  line-height: 1.4;
  margin-left: 0;
}

.no-delegation {
  color: #6c757d;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.approval-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #f1f3f4;
  vertical-align: middle;
  text-align: center;
}

.approval-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f8f9fa;
}

.approval-table :deep(.p-badge) {
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

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-buttons .p-button {
  width: 2.5rem;
  height: 2.5rem;
}

.attachments-content {
  padding: 1rem;
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

.delegate-compact {
  text-align: left;
  font-size: 0.85rem;
}

.delegate-compact strong {
  color: #495057;
  display: block;
  margin-bottom: 0.25rem;
}

.delegate-compact .work-details-btn {
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .approval-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }
  
  .reason-text {
    max-width: 150px;
  }

  .delegate-info {
    font-size: 0.85rem;
  }

  .approval-table :deep(.p-datatable-thead > tr > th) {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }

  .action-buttons .p-button {
    width: 2rem;
    height: 2rem;
  }
}

.clickable-name {
  cursor: pointer;
  color: #667eea;
  font-weight: 600;
  transition: all 0.2s;
}

.clickable-name:hover {
  color: #764ba2;
  text-decoration: underline;
}
.status-badge {
  display: flex;
  justify-content: center;
}

.cancel-status-box {
  padding: 1rem;
  background: #fef3c7;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.cancel-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
}

.cancel-reason-eye-row {
  margin-top: 0.5rem;
  display: flex;
  justify-content: center;
}

.approval-status-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.approval-step {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.4rem;
  border-radius: 6px;
  background: #f8f9fa;
}

.approval-step.completed {
  background: #d1fae5;
}

.approval-step.completed i {
  color: #10b981;
}

.approval-step.disabled {
  opacity: 0.5;
}

.approval-step i {
  color: #f59e0b;
  margin-top: 2px;
}

.step-info {
  display: flex;
  flex-direction: column;
}

.step-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
}

.step-approver {
  font-size: 0.8rem;
  color: #047857;
}

.step-pending {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
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
</style>
