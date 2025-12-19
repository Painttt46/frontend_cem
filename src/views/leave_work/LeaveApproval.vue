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

        <Column header="จำนวนวัน">
          <template #body="slotProps">
            {{ slotProps.data.total_days }} วัน
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

        <Column header="วันที่ส่งคำขอ" :sortable="true">
          <template #body="slotProps">
            {{ formatDateTime(slotProps.data.created_at) }}
          </template>
        </Column>

        <Column header="การดำเนินการ" :frozen="true" alignFrozen="right">
          <template #body="slotProps">
            <div class="action-buttons">
              <Button 
                icon="pi pi-check" 
                severity="success" 
                size="small"
                @click="$emit('approve-leave', slotProps.data.id)"
                v-tooltip="'อนุมัติ'"
              />
              <Button 
                icon="pi pi-times" 
                severity="danger" 
                size="small"
                @click="$emit('reject-leave', slotProps.data.id)"
                v-tooltip="'ไม่อนุมัติ'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <!-- Work Details Dialog -->
  <Dialog v-model:visible="showWorkDetailsDialog" modal header="รายละเอียดงานที่มอบหมาย" style="width: 50rem;" :draggable="false">
    <div class="work-details-content">
      <p>{{ selectedWorkDetails }}</p>
    </div>
    <template #footer>
      <Button label="ปิด" icon="pi pi-times" @click="showWorkDetailsDialog = false" />
    </template>
  </Dialog>

  <!-- Attachments Dialog -->
  <Dialog v-model:visible="showAttachmentsDialog" modal header="เอกสารแนบ" style="width: 60rem;" :draggable="false">
    <div class="attachments-content">
      <div v-if="selectedAttachments.length === 0" class="no-attachments">
        <i class="pi pi-file" style="font-size: 3rem; color: #ccc;"></i>
        <p>ไม่มีเอกสารแนบ</p>
      </div>
      <div v-else class="attachments-list">
        <div v-for="(file, index) in selectedAttachments" :key="index" class="attachment-item">
          <div class="file-info">
            <i :class="getFileIcon(file)" class="file-icon"></i>
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

  <UserInfoDialog v-model:visible="showUserDialog" :userId="selectedUserId" />
</template>

<script>
import axios from '@/utils/axiosConfig'
import UserInfoDialog from '@/components/UserInfoDialog.vue'

export default {
  name: 'LeaveApproval',
  components: {
    UserInfoDialog
  },
  props: {
    records: Array
  },
  created() {
    this.$http = axios
  },
  data() {
    return {
      showWorkDetailsDialog: false,
      selectedWorkDetails: '',
      showAttachmentsDialog: false,
      selectedAttachments: [],
      leaveTypes: [],
      showUserDialog: false,
      selectedUserId: null
    }
  },
  async mounted() {
    await this.loadLeaveTypes()
  },
  methods: {
    showUserInfo(userId) {
      if (userId) {
        this.selectedUserId = userId
        this.showUserDialog = true
      }
    },
    async loadLeaveTypes() {
      try {
        const response = await this.$http.get('/api/leave/leave-types')
        this.leaveTypes = response.data
      } catch (error) {
        console.error('Error loading leave types:', error)
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

    downloadFile(fileName) {
      this.$toast.add({
        severity: 'success',
        summary: 'ดาวน์โหลด',
        detail: `กำลังดาวน์โหลด: ${fileName}`,
        life: 3000
      })
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
      if (!datetime.includes('Z') && !datetime.includes('+')) {
        date.setHours(date.getHours() + 7)
      }
      return date.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatDate(datetime) {
      if (!datetime) return '-'
      const date = new Date(datetime)
      if (!datetime.includes('Z') && !datetime.includes('+')) {
        date.setHours(date.getHours() + 7)
      }
      return date.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit'
      })
    },
    calculateDays(startDateTime, endDateTime) {
      if (!startDateTime || !endDateTime) return 0
      const start = new Date(startDateTime)
      const end = new Date(endDateTime)
      const diffTime = Math.abs(end - start)
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
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
</style>
