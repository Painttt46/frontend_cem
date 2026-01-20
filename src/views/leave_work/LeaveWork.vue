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
      <div class="left-buttons">
        <Button @click="showLeaveForm" class="leave-btn" icon="pi pi-plus" raised>
          <span class="btn-text">แจ้งลางาน</span>
        </Button>
        <Button v-if="canApproveLeave" @click="showApprovalForm" class="approval-btn" icon="pi pi-check-circle" raised>
          <span class="btn-text">อนุมัติการลา</span>
          <Badge v-if="pendingLeaveCount > 0" :value="pendingLeaveCount" severity="danger" class="pending-badge" />
        </Button>
      </div>
      <Button v-if="canApproveLeave" @click="exportReport" class="export-btn" icon="pi pi-file-excel" severity="warning" size="small">
        <span class="btn-text">Export</span>
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
        :disabled="approving"
        @approve-leave="approveLeave" 
        @reject-leave="openRejectDialog" 
        @close-form="showApprovalDialog = false"
      />
    </Dialog>

    <!-- Reject Dialog -->
    <Dialog v-model:visible="showRejectDialog" modal header="ไม่อนุมัติการลา" :style="{ width: '400px' }" :draggable="false">
      <div class="reject-form">
        <label class="input-label">เหตุผลที่ไม่อนุมัติ *</label>
        <Textarea v-model="rejectReason" rows="3" class="w-full" placeholder="กรุณาระบุเหตุผล..." />
      </div>
      <template #footer>
        <Button label="ยกเลิก" severity="secondary" @click="showRejectDialog = false" />
        <Button label="ยืนยันไม่อนุมัติ" severity="danger" @click="confirmReject" :disabled="!rejectReason.trim()" />
      </template>
    </Dialog>

    <!-- Export Dialog -->
    <Dialog v-model:visible="showExportDialog" modal header="Export รายงานการลา" :style="{ width: '400px' }" :draggable="false">
      <div class="export-form">
        <label class="input-label">ช่วงวันที่</label>
        <div class="date-range">
          <Calendar v-model="exportStartDate" dateFormat="dd/mm/yy" placeholder="วันเริ่มต้น" showIcon class="w-full" />
          <span class="mx-2">ถึง</span>
          <Calendar v-model="exportEndDate" dateFormat="dd/mm/yy" placeholder="วันสิ้นสุด" showIcon class="w-full" />
        </div>
        <small class="text-500">*เว้นว่างเพื่อ export ทั้งหมด</small>
      </div>
      <template #footer>
        <Button label="ยกเลิก" severity="secondary" @click="showExportDialog = false" />
        <Button label="Export" icon="pi pi-file-excel" severity="success" @click="doExport" />
      </template>
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
      approverLevel: 0,  // 0 = ไม่มีสิทธิ์, 1 = level 1, 2 = level 2, 3 = ทั้งสองขั้น
      // Reject dialog
      showRejectDialog: false,
      rejectLeaveId: null,
      rejectReason: '',
      // Export dialog
      showExportDialog: false,
      exportStartDate: null,
      exportEndDate: null
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
      return this.hasAccess('/leave_work/approve')
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
    exportReport() {
      this.exportStartDate = null
      this.exportEndDate = null
      this.showExportDialog = true
    },
    doExport() {
      let records = this.filteredLeaveRecords

      // Filter by date range
      if (this.exportStartDate || this.exportEndDate) {
        records = records.filter(r => {
          const date = new Date(r.start_datetime)
          if (this.exportStartDate && date < this.exportStartDate) return false
          if (this.exportEndDate) {
            const endDate = new Date(this.exportEndDate)
            endDate.setHours(23, 59, 59)
            if (date > endDate) return false
          }
          return true
        })
      }

      if (records.length === 0) {
        this.$toast.add({ severity: 'warn', summary: 'ไม่มีข้อมูล', detail: 'ไม่มีข้อมูลการลาในช่วงเวลาที่เลือก', life: 3000 })
        return
      }

      // เรียงตามวันที่เริ่มลา
      records = [...records].sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))

      // คำนวณชั่วโมงจาก total_days * 8 แล้วปัดเศษ
      const calcHours = (r) => Math.round((parseFloat(r.total_days) || 0) * 8)

      // สรุปภาพรวม (นับเฉพาะอนุมัติ)
      const approvedRecords = records.filter(r => r.status === 'approved')
      const summary = {
        total: records.length,
        totalHours: approvedRecords.reduce((sum, r) => sum + calcHours(r), 0),
        approved: approvedRecords.length,
        pending: records.filter(r => r.status === 'pending').length,
        rejected: records.filter(r => r.status === 'rejected').length,
        byType: {}
      }
      approvedRecords.forEach(r => {
        const type = r.leave_type || 'อื่นๆ'
        if (!summary.byType[type]) summary.byType[type] = { count: 0, hours: 0 }
        summary.byType[type].count++
        summary.byType[type].hours += calcHours(r)
      })

      const statusMap = { pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ไม่อนุมัติ' }
      const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
      const dateRange = this.exportStartDate || this.exportEndDate 
        ? `${this.exportStartDate ? this.exportStartDate.toLocaleDateString('th-TH') : 'ไม่ระบุ'} - ${this.exportEndDate ? this.exportEndDate.toLocaleDateString('th-TH') : 'ไม่ระบุ'}`
        : 'ทั้งหมด'
      
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="UTF-8">
        <style>
          body { font-family: 'TH Sarabun New', 'Sarabun', sans-serif; margin: 20px; }
          .report-header { display: flex; align-items: center; border-bottom: 3px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { width: 80px; height: 80px; margin-right: 20px; }
          .company-info { flex: 1; }
          .company-name { font-size: 24pt; font-weight: bold; color: #1e40af; margin: 0; }
          .report-title { font-size: 18pt; color: #475569; margin: 5px 0 0 0; }
          .meta-info { text-align: right; font-size: 12pt; color: #64748b; }
          .meta-info div { margin: 3px 0; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; }
          th { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; font-weight: bold; padding: 12px 10px; border: 1px solid #1e40af; font-size: 13pt; }
          td { padding: 10px; border: 1px solid #cbd5e1; font-size: 13pt; }
          tr:nth-child(even) { background-color: #f8fafc; }
          tr:hover { background-color: #e0f2fe; }
          .status-approved { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          .status-pending { background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          .status-rejected { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          .summary-box { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .summary-title { font-size: 16pt; font-weight: bold; color: #1e40af; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
          .summary-grid { display: flex; flex-wrap: wrap; gap: 15px; }
          .stat-card { background: white; border-radius: 8px; padding: 12px 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); min-width: 120px; }
          .stat-label { font-size: 11pt; color: #64748b; }
          .stat-value { font-size: 18pt; font-weight: bold; color: #1e293b; }
          .stat-approved .stat-value { color: #059669; }
          .stat-pending .stat-value { color: #d97706; }
          .stat-rejected .stat-value { color: #dc2626; }
          .type-summary { margin-top: 15px; padding-top: 15px; border-top: 1px solid #93c5fd; font-size: 12pt; }
          .footer { margin-top: 25px; padding-top: 15px; border-top: 2px solid #e2e8f0; font-size: 12pt; color: #64748b; display: flex; justify-content: space-between; }
        </style>
        </head><body>
        
        <div class="report-header">
          <img src="${window.location.origin}/NGENT.png" class="logo" onerror="this.style.display='none'"/>
          <div class="company-info">
            <div class="company-name">GENT SOLUTION CO., LTD.</div>
            <div class="report-title">📋 รายงานสรุปการลางานของพนักงาน</div>
          </div>
          <div class="meta-info">
            <div>📅 วันที่พิมพ์: ${today}</div>
            <div>📆 ช่วงเวลา: ${dateRange}</div>
          </div>
        </div>
        
        <div class="summary-box">
          <div class="summary-title">📊 สรุปภาพรวม</div>
          <div class="summary-grid">
            <div class="stat-card"><div class="stat-label">รายการทั้งหมด</div><div class="stat-value">${summary.total}</div></div>
            <div class="stat-card"><div class="stat-label">รวมชั่วโมงลา</div><div class="stat-value">${summary.totalHours} ชม.</div></div>
            <div class="stat-card stat-approved"><div class="stat-label">อนุมัติแล้ว</div><div class="stat-value">${summary.approved}</div></div>
            <div class="stat-card stat-pending"><div class="stat-label">รออนุมัติ</div><div class="stat-value">${summary.pending}</div></div>
            <div class="stat-card stat-rejected"><div class="stat-label">ไม่อนุมัติ</div><div class="stat-value">${summary.rejected}</div></div>
          </div>
          <div class="type-summary">📁 แยกตามประเภท: ${Object.entries(summary.byType).map(([type, data]) => `<strong>${type}</strong> ${data.count} ครั้ง (${data.hours} ชม.)`).join(' | ')}</div>
        </div>

        <table>
          <tr>
            <th>ลำดับ</th>
            <th>ชื่อ-นามสกุล</th>
            <th>ตำแหน่ง</th>
            <th>ประเภทการลา</th>
            <th>วันที่เริ่มลา</th>
            <th>วันที่สิ้นสุด</th>
            <th>จำนวน</th>
            <th>เหตุผล</th>
            <th>สถานะ</th>
          </tr>`

      records.forEach((r, i) => {
        const statusClass = r.status === 'approved' ? 'status-approved' : r.status === 'rejected' ? 'status-rejected' : 'status-pending'
        html += `<tr>
          <td style="text-align:center">${i + 1}</td>
          <td><strong>${r.user_name || '-'}</strong></td>
          <td>${r.employee_position || '-'}</td>
          <td>${r.leave_type || '-'}</td>
          <td style="text-align:center">${r.start_datetime ? new Date(r.start_datetime).toLocaleDateString('th-TH') : '-'}</td>
          <td style="text-align:center">${r.end_datetime ? new Date(r.end_datetime).toLocaleDateString('th-TH') : '-'}</td>
          <td style="text-align:center"><strong>${calcHours(r)} ชม.</strong></td>
          <td>${r.reason || '-'}</td>
          <td style="text-align:center"><span class="${statusClass}">${statusMap[r.status] || r.status}</span></td>
        </tr>`
      })

      html += `</table>
        <div class="footer">
          <div>📝 จำนวนรายการทั้งหมด: <strong>${records.length}</strong> รายการ</div>
          <div>🏢 GENT SOLUTION CO., LTD.</div>
        </div>
        </body></html>`

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `รายงานการลา_${new Date().toISOString().slice(0, 10)}.xls`
      link.click()
      URL.revokeObjectURL(link.href)

      this.showExportDialog = false
      this.$toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'Export รายงานเรียบร้อย', life: 3000 })
    },
    async checkLeaveApprover() {
      try {
        const userId = localStorage.getItem('soc_user_id')
        
        // เช็คจาก permission แทน hardcode role
        if (this.hasAccess('/leave_work/approve')) {
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
        const response = await this.$http.get('/api/leave', { params: { _t: Date.now() } })
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
          summary: 'โหลดข้อมูลไม่สำเร็จ',
          detail: 'กรุณารีเฟรชหน้าเว็บ หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
          life: 4000
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
      
      // Determine confirm message based on current status
      const confirmMessage = currentStatus === 'pending_level2' 
        ? 'คุณต้องการอนุมัติคำขอลางานนี้หรือไม่? (ขั้นที่ 2 - HR)'
        : 'คุณต้องการอนุมัติคำขอลางานนี้หรือไม่? (ขั้นที่ 1 - หัวหน้างาน)'

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
            
            // ส่งไป backend โดยไม่ระบุ approval_level - ให้ backend ตรวจสอบ status จริงจาก DB
            const response = await this.$http.put(`/api/leave/${leaveId}/status`, {
              status: 'approved',
              approved_by: approverInfo,
              approved_by_id: approverId
            })
            
            await this.loadLeaveRecords()

            const newStatus = response.data?.status
            this.$toast.add({
              severity: 'success',
              summary: 'สำเร็จ',
              detail: newStatus === 'pending_level2' ? 'อนุมัติขั้นที่ 1 เรียบร้อย - รอ HR อนุมัติ' : 'อนุมัติการลาเรียบร้อย',
              life: 3000
            })
          } catch { // ignore
            this.$toast.add({
              severity: 'error',
              summary: 'อนุมัติไม่สำเร็จ',
              detail: 'กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ',
              life: 4000
            })
          } finally {
            this.approving = false
          }
        }
      })
    },

    async rejectLeave(leaveId) {
      this.rejectLeaveId = leaveId
      this.rejectReason = ''
      this.showRejectDialog = true
    },

    openRejectDialog(leaveId) {
      this.rejectLeaveId = leaveId
      this.rejectReason = ''
      this.showRejectDialog = true
    },

    async confirmReject() {
      if (!this.rejectReason.trim()) return
      
      try {
        const approverName = `${localStorage.getItem('soc_firstname')} ${localStorage.getItem('soc_lastname')}`.trim()
        const approverPosition = localStorage.getItem('soc_position') || 'ไม่ระบุตำแหน่ง'
        const approverInfo = `${approverName} (${approverPosition})`
        
        await this.$http.put(`/api/leave/${this.rejectLeaveId}/status`, {
          status: 'rejected',
          approved_by: approverInfo,
          reject_reason: this.rejectReason.trim()
        })
        
        this.showRejectDialog = false
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
          summary: 'ปฏิเสธไม่สำเร็จ',
          detail: 'กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ',
          life: 4000
        })
      }
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
      return date.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok'
      })
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
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.action-buttons .left-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.export-btn {
  padding: 0.5rem 1rem !important;
  border-radius: 8px !important;
}

.export-btn .btn-text {
  margin-left: 0.3rem;
  font-size: 0.875rem;
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

.export-btn {
  min-width: 160px;
  padding: 0.75rem 1.5rem !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
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
  border: none;
  background: transparent;
}

.header-card :deep(.p-card-body) {
  padding: 0;
  background: transparent;
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
    flex-direction: column;
  }

  .action-buttons .left-buttons {
    width: 100%;
    flex-direction: column;
  }

  .leave-btn, .approval-btn {
    width: 100% !important;
    min-width: auto !important;
  }

  .export-btn {
    align-self: flex-end;
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

.reject-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reject-form .input-label {
  font-weight: 500;
  color: #374151;
}

.reject-form textarea {
  width: 100%;
}

.export-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.export-form .input-label {
  font-weight: 500;
  color: #374151;
}

.export-form .date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.export-form .date-range .p-calendar {
  flex: 1;
}
</style>
