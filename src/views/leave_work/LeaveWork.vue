<template>
  <div class="leave-work-container">
    <Toast />
    <Card class="header-card">
      <template #header>
        <div class="main-header">
          <h1><i class="pi pi-sign-out"></i> ระบบแจ้งลางาน</h1>
        </div>
      </template>
    </Card>

    <!-- Action Buttons -->
    <div class="action-buttons" v-if="permissionsLoaded">
      <Button @click="showLeaveForm" class="leave-btn" icon="pi pi-plus" raised>
        <span class="btn-text">แจ้งลางาน</span>
      </Button>
      <Button v-if="canApproveLeave" @click="showApprovalForm" class="approval-btn" icon="pi pi-check-circle" raised>
        <span class="btn-text">อนุมัติการลา</span>
        <Badge v-if="pendingLeaveCount > 0" :value="pendingLeaveCount" severity="danger" class="pending-badge" />
      </Button>
    </div>

    <!-- Main Content - History -->
    <div class="main-content">
      <LeaveHistory 
        :records="filteredLeaveRecords" 
        @view-attachments="viewAttachments" 
        @request-deleted="loadLeaveRecords" 
      />
    </div>

    <!-- Leave Form Dialog -->
    <Dialog v-model:visible="showLeaveDialog" modal header="แจ้งลางาน" :style="{ width: '95vw', maxWidth: '900px' }" class="leave-dialog" :draggable="false">
      <LeaveForm @submit-leave="submitLeave" @close-form="showLeaveDialog = false" />
    </Dialog>

    <!-- Approval Dialog -->
    <Dialog v-if="canApproveLeave" v-model:visible="showApprovalDialog" modal header="อนุมัติการลา" :style="{ width: '98vw', maxWidth: '1600px' }" class="approval-dialog" :draggable="false">
      <LeaveApproval 
        :records="pendingLeaveRecords" 
        :approver-level="approverLevel"
        @approve-leave="approveLeave" 
        @reject-leave="rejectLeave" 
        @close-form="showApprovalDialog = false"
      />
    </Dialog>
  </div>
</template>

<script>
import LeaveForm from './LeaveForm.vue'
import LeaveHistory from './LeaveHistory.vue'
import LeaveApproval from './LeaveApproval.vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { usePermissions } from '@/composables/usePermissions'
import axios from '@/utils/axiosConfig'

export default {
  name: 'LeaveWork',
  components: {
    LeaveForm,
    LeaveHistory,
    LeaveApproval
  },
  setup() {
    const { hasAccess, loadPermissions, permissionsLoaded } = usePermissions()
    return { hasAccess, loadPermissions, permissionsLoaded }
  },
  provide() {
    return {
      $confirm: useConfirm(),
      $toast: useToast()
    }
  },
  data() {
    return {
      leaveRecords: [],
      loading: false,
      approving: false,
      showLeaveDialog: false,
      showApprovalDialog: false,
      isLeaveApprover: false,
      approverLevel: 0  // 0 = ไม่มีสิทธิ์, 1 = level 1, 2 = level 2, 3 = ทั้งสองขั้น
    }
  },
  computed: {
    currentUserRole() {
      return localStorage.getItem('soc_role') || ''
    },
    currentUserId() {
      return localStorage.getItem('soc_user_id') || ''
    },
    isHROrAdmin() {
      const role = this.currentUserRole.toLowerCase()
      return role === 'hr' || role === 'admin'
    },
    canApproveLeave() {
      // ตรวจสอบ permission หรือ อยู่ใน leave approval settings
      return this.hasAccess('/leave_work/approve') || this.isLeaveApprover
    },
    filteredLeaveRecords() {
      
      if (this.isHROrAdmin || this.isLeaveApprover) {
        return this.leaveRecords
      }
      
      const currentUserName = `${localStorage.getItem('soc_firstname')} ${localStorage.getItem('soc_lastname')}`.trim()
      
      const filtered = this.leaveRecords.filter(record => record.employee_name === currentUserName)
      
      return filtered
    },
    pendingLeaveRecords() {
      return this.filteredLeaveRecords.filter(record => 
        record.status === 'pending' || record.status === 'pending_level2'
      )
    },
    pendingLeaveCount() {
      // นับเฉพาะ records ที่ user สามารถ approve ได้
      if (this.approverLevel === 0) return 0
      if (this.approverLevel === 3) return this.pendingLeaveRecords.length
      
      return this.pendingLeaveRecords.filter(record => {
        if (this.approverLevel === 1 && record.status === 'pending') return true
        if (this.approverLevel === 2 && record.status === 'pending_level2') return true
        return false
      }).length
    }
  },
  methods: {
    async checkLeaveApprover() {
      try {
        const userId = localStorage.getItem('soc_user_id')
        const role = localStorage.getItem('soc_role')?.toLowerCase()
        
        // Admin มีสิทธิ์ทั้งสอง level
        if (role === 'admin') {
          this.isLeaveApprover = true
          this.approverLevel = 3
          return
        }
        
        if (!userId) return
        
        const response = await this.$http.get('/api/settings/leave-approval')
        const level1 = response.data.level1 || []
        const level2 = response.data.level2 || []
        
        const isLevel1 = level1.some(a => a.user_id == userId && a.can_approve)
        const isLevel2 = level2.some(a => a.user_id == userId && a.can_approve)
        
        this.isLeaveApprover = isLevel1 || isLevel2
        
        if (isLevel1 && isLevel2) {
          this.approverLevel = 3
        } else if (isLevel1) {
          this.approverLevel = 1
        } else if (isLevel2) {
          this.approverLevel = 2
        } else {
          this.approverLevel = 0
        }
      } catch { // ignore
        
      }
    },
    showLeaveForm() {
      this.showLeaveDialog = true
    },

    showApprovalForm() {
      this.showApprovalDialog = true
    },

    async loadLeaveRecords() {
      this.loading = true
      try {
        const response = await this.$http.get('/api/leave')
        this.leaveRecords = response.data.map(record => {
          return {
            ...record,
            employee_name: record.user_name, // เพิ่ม mapping
            name: record.user_name,
            role: record.employee_role,
            leaveType: this.getLeaveTypeLabel(record.leave_type),
            startDate: this.formatDate(record.start_datetime),
            endDate: this.formatDate(record.end_datetime),
            submittedAt: new Date(record.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
          }
        })
      } catch { // ignore
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถโหลดข้อมูลการลาได้',
          life: 3000
        })
      } finally {
        this.loading = false
      }
    },

    async submitLeave() {
      try {
        await this.loadLeaveRecords()
        this.showLeaveDialog = false
        // Toast แสดงใน LeaveForm แล้ว ไม่ต้องแสดงซ้ำ
      } catch { // ignore
        // Ignore error
      }
    },

    async approveLeave(leaveId) {
      if (this.approving) return
      
      // Refresh ข้อมูลก่อนเพื่อให้ได้ status ล่าสุด
      await this.loadLeaveRecords()
      
      // Get current leave request to check its status
      const leaveRequest = this.pendingLeaveRecords.find(r => r.id === leaveId)
      if (!leaveRequest) {
        this.$toast.add({
          severity: 'warn',
          summary: 'ไม่พบข้อมูล',
          detail: 'คำขอลานี้ถูกดำเนินการแล้ว',
          life: 3000
        })
        return
      }
      
      const currentStatus = leaveRequest.status
      
      // Determine approval level based on current status
      let approvalLevel = 1
      let confirmMessage = 'คุณต้องการอนุมัติคำขอลางานนี้หรือไม่? (ขั้นที่ 1 - หัวหน้างาน)'
      
      if (currentStatus === 'pending_level2') {
        approvalLevel = 2
        confirmMessage = 'คุณต้องการอนุมัติคำขอลางานนี้หรือไม่? (ขั้นที่ 2 - HR)'
      }

      this.$confirm.require({
        message: confirmMessage,
        header: 'ยืนยันการอนุมัติ',
        icon: 'pi pi-check-circle',
        acceptClass: 'p-button-success',
        acceptLabel: 'อนุมัติ',
        rejectLabel: 'ยกเลิก',
        draggable: false,
        accept: async () => {
          if (this.approving) return
          this.approving = true
          try {
            const approverId = localStorage.getItem('soc_user_id')
            const approverName = `${localStorage.getItem('soc_firstname')} ${localStorage.getItem('soc_lastname')}`.trim()
            const approverPosition = localStorage.getItem('soc_position') || 'ไม่ระบุตำแหน่ง'
            const approverInfo = `${approverName} (${approverPosition})`
            
            
            await this.$http.put(`/api/leave/${leaveId}/status`, {
              status: 'approved',
              approved_by: approverInfo,
              approved_by_id: approverId,
              approval_level: approvalLevel
            })
            
            await this.loadLeaveRecords()

            this.$toast.add({
              severity: 'success',
              summary: 'สำเร็จ',
              detail: approvalLevel === 1 ? 'อนุมัติขั้นที่ 1 เรียบร้อย - รอ HR อนุมัติ' : 'อนุมัติการลาเรียบร้อย',
              life: 3000
            })
          } catch { // ignore
            this.$toast.add({
              severity: 'error',
              summary: 'เกิดข้อผิดพลาด',
              detail: 'ไม่สามารถอนุมัติคำขอได้',
              life: 3000
            })
          } finally {
            this.approving = false
          }
        }
      })
    },

    async rejectLeave(leaveId) {
      this.$confirm.require({
        message: 'คุณต้องการปฏิเสธคำขอลางานนี้หรือไม่?',
        header: 'ยืนยันการปฏิเสธ',
        icon: 'pi pi-times-circle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'ปฏิเสธ',
        rejectLabel: 'ยกเลิก',
        draggable: false,
        accept: async () => {
          try {
            const approverName = `${localStorage.getItem('soc_firstname')} ${localStorage.getItem('soc_lastname')}`.trim()
            const approverPosition = localStorage.getItem('soc_position') || 'ไม่ระบุตำแหน่ง'
            const approverInfo = `${approverName} (${approverPosition})`
            
            
            await this.$http.put(`/api/leave/${leaveId}/status`, {
              status: 'rejected',
              approved_by: approverInfo
            })
            
            await this.loadLeaveRecords()

            this.$toast.add({
              severity: 'info',
              summary: 'สำเร็จ',
              detail: 'ไม่อนุมัติการลาเรียบร้อย',
              life: 3000
            })
          } catch { // ignore
            this.$toast.add({
              severity: 'error',
              summary: 'เกิดข้อผิดพลาด',
              detail: 'ไม่สามารถปฏิเสธคำขอได้',
              life: 3000
            })
          }
        }
      })
    },

    viewAttachments(attachments) {
      if (attachments && attachments.length > 0) {
        this.$toast.add({
          severity: 'info',
          summary: 'ไฟล์แนบ',
          detail: `มีไฟล์แนบ ${attachments.length} ไฟล์`,
          life: 3000
        })
      }
    },

    getLeaveTypeLabel(value) {
      const types = {
        'sick': 'ลาป่วย',
        'personal': 'ลากิจ',
        'vacation': 'ลาพักร้อน',
        'maternity': 'ลาคลอด',
        'other': 'ลาอื่นๆ'
      }
      return types[value] || value
    },

    formatDate(dateTime) {
      if (!dateTime) return ''
      const date = new Date(dateTime)
      date.setHours(date.getHours() + 7)
      return date.toLocaleDateString('th-TH')
    }
  },

  created() {
    this.$http = axios
  },

  async mounted() {
    this.loadPermissions()
    await this.checkLeaveApprover()
    this.loadLeaveRecords()
  }
}
</script>

<style scoped>
.leave-work-container {
  padding: 1rem;
  padding-bottom: 0;
  max-width: 100%;
  margin: 0 auto;
  
  background: #e5e7eb;
  height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: auto;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.leave-btn {
  background: #3b82f6 !important;
  border: none !important;
  color: white !important;
  padding: 1rem 2rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4) !important;
  transition: all 0.3s ease !important;
  position: relative !important;
  overflow: hidden !important;
  min-width: 200px !important;
  font-size: 1rem !important;
}

.leave-btn:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.6) !important;
}

.leave-btn:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.leave-btn:hover:before {
  left: 100%;
}

.approval-btn {
  background: #22c55e !important;
  border: none !important;
  color: white !important;
  padding: 1rem 2rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4) !important;
  transition: all 0.3s ease !important;
  position: relative !important;
  overflow: hidden !important;
  min-width: 200px !important;
  font-size: 1rem !important;
}

.approval-btn:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.6) !important;
}

.approval-btn:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.approval-btn:hover:before {
  left: 100%;
}

.btn-text {
  margin-left: 0.5rem;
  font-size: 1rem;
  letter-spacing: 0.5px;
}

.pending-badge {
  margin-left: 2rem !important;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  color: white !important;
  font-weight: 700 !important;
  padding: 0.3rem !important;
  border-radius: 50% !important;
  font-size: 0.7rem !important;
  border: 2px solid rgba(239, 68, 68, 0.3) !important;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4) !important;
  animation: pulse 2s infinite;
  width: 22px !important;
  height: 22px !important;
  text-align: center !important;
  letter-spacing: 0.5px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
  min-height: 500px;
}

.header-card {
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.header-card :deep(.p-card-body) {
  padding: 0;
}

.header-card :deep(.p-card-content) {
  padding: 0;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border-radius: 15px 15px 0 0;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  overflow: hidden;
  min-height: 80px;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.main-header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.main-header i {
  font-size: 1.5rem;
}

.datetime-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

@media (max-width: 768px) {
  .leave-work-container {
    padding: 1rem;
  }

  .main-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 1.5rem;
  }

  .main-header h1 {
    font-size: 1.5rem;
  }

  .main-content {
    padding: 1rem;
  }

  .action-buttons {
    justify-content: center;
    flex-direction: column;
  }

  .leave-btn, .approval-btn {
    width: 100% !important;
    min-width: auto !important;
  }
}

@media (max-width: 480px) {
  .leave-work-container {
    padding: 0.5rem;
  }

  .main-header {
    padding: 1rem;
  }

  .main-header h1 {
    font-size: 1.3rem;
  }

  .datetime-display {
    font-size: 0.9rem;
  }

  .main-content {
    padding: 0.75rem;
  }

  .action-buttons {
    gap: 0.75rem;
  }
}
:deep(.leave-dialog.p-dialog),
:deep(.approval-dialog.p-dialog) {
  height: auto !important;
  max-height: 95vh !important;
}

:deep(.leave-dialog .p-dialog-content),
:deep(.approval-dialog .p-dialog-content) {
  height: auto !important;
  max-height: calc(95vh - 80px) !important;
  overflow-y: auto !important;
}
</style>
