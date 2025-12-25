<template>
  <Card class="history-card">
    <template #content>
      <div v-if="records.length === 0" class="empty-state">
        <i class="pi pi-calendar-times" style="font-size: 4rem; color: #ccc;"></i>
        <p>ยังไม่มีข้อมูลการลางาน</p>
      </div>

      <EnhancedDataTable v-else :data="records"  :paginator="true" :rows="10" 
        :rowsPerPageOptions="[5, 10, 20]" responsiveLayout="scroll" class="history-table" stripedRows>

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
        <Column field="employee_position" header="ตำแหน่ง" :sortable="true" />

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
            {{ slotProps.data.total_days }} วัน ({{ (slotProps.data.total_days * 8).toFixed(1) }} ชม.)
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

        <Column field="reason" header="เหตุผล" style="min-width: 160px; width: 160px;">
          <template #body="slotProps">
            <span class="reason-text-wrap">{{ slotProps.data.reason }}</span>
          </template>
        </Column>

        <Column header="เอกสารแนบ" style="width: 80px;">
          <template #body="slotProps">
            <div v-if="slotProps.data.attachments && slotProps.data.attachments.length > 0" class="attachments-info">
              <Button icon="pi pi-paperclip" size="small" severity="info" outlined
                @click="showAttachments(slotProps.data.attachments)"
                v-tooltip="`${slotProps.data.attachments.length} ไฟล์`" />
            </div>
            <span v-else>-</span>
          </template>
        </Column>

        <Column header="สถานะ" style="min-width: 180px;">
          <template #body="slotProps">
            <div class="status-container">
              <Badge :value="getStatusLabel(slotProps.data.status)"
                :severity="getStatusSeverity(slotProps.data.status)" 
                class="status-badge-large" />
              <Button v-if="canDeleteRequest(slotProps.data)" 
                icon="pi pi-trash" 
                size="small" 
                severity="danger" 
                text
                @click="confirmDelete(slotProps.data)" 
                v-tooltip="'ลบคำขอ'" 
                class="delete-btn" />
            </div>
          </template>
        </Column>

        <Column header="ผู้อนุมัติ" style="min-width: 250px;">
          <template #body="slotProps">
            <div class="approver-container">
              <div v-if="slotProps.data.approved_by_level1" class="approver-item">
                <div class="approver-badge-wrapper">
                  <i class="pi pi-check-circle"></i>
                  <Badge value="หัวหน้างาน" severity="info" />
                </div>
                <span class="approver-text clickable-name" @click="showUserInfo(slotProps.data.approved_by_level1, slotProps.data.approved_by_level1_id)">
                  {{ slotProps.data.approved_by_level1 }}
                </span>
              </div>
              <div v-if="slotProps.data.approved_by_level2" class="approver-item">
                <div class="approver-badge-wrapper">
                  <i class="pi pi-check-circle"></i>
                  <Badge value="HR" severity="success" />
                </div>
                <span class="approver-text clickable-name" @click="showUserInfo(slotProps.data.approved_by_level2, slotProps.data.approved_by_level2_id)">
                  {{ slotProps.data.approved_by_level2 }}
                </span>
              </div>
              <span v-if="!slotProps.data.approved_by_level1 && !slotProps.data.approved_by_level2" class="no-approver">
                <i class="pi pi-clock"></i> รอการอนุมัติ
              </span>
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
            <Button icon="pi pi-download" size="small" severity="success" outlined @click="downloadFile(file)"
              v-tooltip="'ดาวน์โหลด'" />
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

  <!-- User Info Dialog -->
  <UserInfoDialog 
    v-model:visible="showUserInfoDialog" 
    :user-name="selectedUserName"
    :user-id="selectedUserId"
  />
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
    records: Array
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
      showUserInfoDialog: false,
      selectedUserName: '',
      selectedUserId: null
    }
  },
  async mounted() {
    await this.loadLeaveTypes()
  },
  created() {
    this.$http = axios
  },
  methods: {
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

    showAttachments(attachments) {
      this.selectedAttachments = attachments || []
      this.showAttachmentsDialog = true
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
    getStatusSeverity(status) {
      const severities = {
        'pending': 'warning',
        'pending_level2': 'info',
        'approved': 'success',
        'rejected': 'danger',
        'รอการอนุมัติ': 'warning',
        'อนุมัติ': 'success',
        'ไม่อนุมัติ': 'danger'
      }
      return severities[status] || 'secondary'
    },

    getStatusLabel(status) {
      const labels = {
        'pending': 'รอหัวหน้างานอนุมัติ',
        'pending_level2': 'รอ HR อนุมัติ',
        'approved': 'อนุมัติแล้ว',
        'rejected': 'ไม่อนุมัติ'
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
  border-left: 3px solid #10b981;
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
</style>
