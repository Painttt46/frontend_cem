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
      <Button v-if="canApproveLeave" @click="exportReport" class="export-btn" icon="pi pi-file-excel" severity="warning"
        size="small">
        <span class="btn-text">Export</span>
      </Button>
    </div>

    <!-- Main Content - History -->
    <div class="main-content">
      <LeaveHistory :records="filteredLeaveRecords" @view-attachments="viewAttachments"
        @request-deleted="loadLeaveRecords" />
    </div>

    <!-- Leave Form Dialog -->
    <Dialog v-model:visible="showLeaveDialog" modal header="แจ้งลางาน" :style="{ width: '95vw', maxWidth: '900px' }"
      class="leave-dialog" :draggable="false">
      <LeaveForm @submit-leave="submitLeave" @close-form="showLeaveDialog = false" />
    </Dialog>

    <!-- Approval Dialog -->
    <Dialog v-if="canApproveLeave" v-model:visible="showApprovalDialog" modal header="อนุมัติการลา"
      :style="{ width: '98vw', maxWidth: '1600px' }" class="approval-dialog" :draggable="false">
      <LeaveApproval :records="pendingLeaveRecords" :approver-level="approverLevel" :disabled="approving"
        :is-admin="currentUserRole === 'admin'" @approve-leave="approveLeave" @reject-leave="openRejectDialog"
        @close-form="showApprovalDialog = false" />
    </Dialog>

    <!-- Reject Dialog -->
    <Dialog v-model:visible="showRejectDialog" modal header="ไม่อนุมัติการลา" :style="{ width: '400px' }"
      :draggable="false">
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
    <Dialog v-model:visible="showExportDialog" modal header="Export รายงานการลา" :style="{ width: '400px' }"
      :draggable="false">
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
      approverDepartments: [],  // แผนกที่ดูแล
      approverPositions: [],    // ตำแหน่งที่ดูแล
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
      // เห็นปุ่มเฉพาะคนที่มี permission เท่านั้น
      return this.hasAccess('/leave_work/approve')
    },
    filteredLeaveRecords() {
      return this.leaveRecords

    },
    pendingLeaveRecords() {
      const pending = this.filteredLeaveRecords.filter(record =>
        record.status === 'pending' || record.status === 'pending_level2' || record.status === 'cancel'
      )

      // Admin เห็นทุกรายการ
      if (this.currentUserRole === 'admin') return pending

      // Filter ตาม approver level และ department/position
      if (this.approverLevel === 0) return []

      const filtered = pending.filter(record => {
        // Level 1 - เห็นเฉพาะ pending (ไม่เห็นรายการยกเลิก)
        if (this.approverLevel === 1) {
          return record.status === 'pending'
        }

        // Level 2 - เห็น pending_level2 และรายการยกเลิก
        if (this.approverLevel === 2) {
          return record.status === 'pending_level2' || record.status === 'cancel'
        }

        // Level 3 - ดูได้ทั้งหมด
        return true
      })

      // เช็ค department filter (ว่าง = ทุกแผนก) - case insensitive
      return filtered.filter(record => {
        const recordDept = (record.department || '').toLowerCase().trim()
        const deptMatch = this.approverDepartments.length === 0 ||
          this.approverDepartments.some(d => (d || '').toLowerCase() === recordDept)

        // เช็ค position filter (ว่าง = ทุกตำแหน่ง) - case insensitive
        const recordPos = (record.position || '').toLowerCase().trim()
        const posMatch = this.approverPositions.length === 0 ||
          this.approverPositions.some(p => (p || '').toLowerCase() === recordPos)

        return deptMatch && posMatch
      })
    },
    pendingLeaveCount() {
      return this.pendingLeaveRecords.length
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

      // กรองเฉพาะสถานะที่อนุมัติเท่านั้น
      records = records.filter(r => r.status === 'approved')

      // Filter by date range (ใช้วันที่เริ่มลา start_datetime)
      if (this.exportStartDate || this.exportEndDate) {
        records = records.filter(r => {
          if (!r.start_datetime) return false

          const recordDate = new Date(r.start_datetime)
          const recordDateOnly = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate())

          if (this.exportStartDate) {
            const start = new Date(this.exportStartDate)
            const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate())
            if (recordDateOnly < startOnly) return false
          }
          if (this.exportEndDate) {
            const end = new Date(this.exportEndDate)
            const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate())
            if (recordDateOnly > endOnly) return false
          }
          return true
        })
      }

      if (records.length === 0) {
        this.$toast.add({ severity: 'warn', summary: 'ไม่มีข้อมูล', detail: 'ไม่มีข้อมูลการลาที่อนุมัติแล้วในช่วงเวลาที่เลือก', life: 3000 })
        return
      }

      // เรียงจากวันล่าสุดไปเก่าสุด
      records = [...records].sort((a, b) => new Date(b.start_datetime) - new Date(a.start_datetime))

      // คำนวณชั่วโมงและวันจาก total_days
      const calcHours = (r) => Math.round((parseFloat(r.total_days) || 0) * 8)
      const calcDays = (r) => parseFloat(r.total_days) || 0

      // สรุปภาพรวม
      const totalHours = records.reduce((sum, r) => sum + calcHours(r), 0)
      const totalDays = records.reduce((sum, r) => sum + calcDays(r), 0)

      const summary = {
        total: records.length,
        totalHours: totalHours,
        totalDays: totalDays.toFixed(1),
        byType: {},
        byDepartment: {},
        byPosition: {}
      }

      // สรุปตามประเภทการลา
      records.forEach(r => {
        const type = r.leave_type || 'อื่นๆ'
        if (!summary.byType[type]) summary.byType[type] = { count: 0, hours: 0, days: 0 }
        summary.byType[type].count++
        summary.byType[type].hours += calcHours(r)
        summary.byType[type].days += calcDays(r)

        // สรุปตามแผนก
        const dept = r.department || 'ไม่ระบุแผนก'
        if (!summary.byDepartment[dept]) summary.byDepartment[dept] = { count: 0, hours: 0 }
        summary.byDepartment[dept].count++
        summary.byDepartment[dept].hours += calcHours(r)

        // สรุปตามตำแหน่ง
        const pos = r.position || 'ไม่ระบุตำแหน่ง'
        if (!summary.byPosition[pos]) summary.byPosition[pos] = { count: 0, hours: 0 }
        summary.byPosition[pos].count++
        summary.byPosition[pos].hours += calcHours(r)
      })

      let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'TH Sarabun New', Sarabun, Arial, sans-serif; font-size: 14pt; margin: 0; padding: 20px; }
            table { border-collapse: collapse; table-layout: fixed; width: 1200px; }
            td, th { border: 1px solid #cbd5e1; vertical-align: middle; padding: 8px; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
        </style>
    </head>
    <body>

    <table border="1" cellpadding="8" cellspacing="0" width="1200" style="width:1200px;">
        
        <tr style="height:0px; visibility:hidden;">
            <td width="60"></td>  <td width="110"></td> <td width="140"></td> <td width="110"></td> <td width="120"></td> <td width="120"></td> <td width="110"></td> <td width="110"></td> <td width="60"></td> <td width="70"></td> <td width="190"></td>
        </tr>

        <tr>
            <td colspan="11" align="center" style="text-align:center; padding:25px; border:3px solid #1e40af; background:#ffffff;">
                <div style="font-size:26pt; font-weight:bold; color:#1e40af; margin-bottom:8px;">GENT SOLUTION CO., LTD.</div>
                <div style="font-size:20pt; font-weight:bold; color:#3b82f6; border-top:2px solid #3b82f6; border-bottom:2px solid #3b82f6; padding:8px 0; margin:8px 0;">รายงานการลางาน (ที่ได้รับอนุมัติ)</div>
            </td>
        </tr>
        
        <tr style="height:15px; border:none;"><td colspan="11" style="border:none; background:none;"></td></tr>

        <tr>
            <td colspan="11" align="center" class="font-bold" style="background-color:#3b82f6; color:white; font-size:16pt; padding:12px; text-align:center;">
                📊 สรุปภาพรวมการลางาน
            </td>
        </tr>
        <tr align="center">
            <td colspan="3" align="center" style="padding:18px; text-align:center; background-color:#eff6ff;">
                <div style="color:#64748b; font-size:13pt; margin-bottom:6px;">รายการทั้งหมด</div>
                <div style="font-size:24pt; color:#1e40af; font-weight:bold;">${summary.total}</div>
                <div style="font-size:12pt; color:#64748b;">รายการ</div>
            </td>
            <td colspan="3" align="center" style="padding:18px; text-align:center; background-color:#eff6ff;">
                <div style="color:#64748b; font-size:13pt; margin-bottom:6px;">รวมวันลา</div>
                <div style="font-size:24pt; color:#0891b2; font-weight:bold;">${summary.totalDays}</div>
                <div style="font-size:12pt; color:#64748b;">วัน</div>
            </td>
            <td colspan="3" align="center" style="padding:18px; text-align:center; background-color:#eff6ff;">
                <div style="color:#64748b; font-size:13pt; margin-bottom:6px;">รวมชั่วโมง</div>
                <div style="font-size:24pt; color:#7c3aed; font-weight:bold;">${summary.totalHours}</div>
                <div style="font-size:12pt; color:#64748b;">ชั่วโมง</div>
            </td>
            <td colspan="2" align="center" style="padding:18px; background-color:#dcfce7; text-align:center;">
                <div style="color:#166534; font-size:13pt; margin-bottom:6px;">สถานะ</div>
                <div style="font-size:20pt; color:#16a34a; font-weight:bold;">✓ อนุมัติแล้ว</div>
            </td>
        </tr>

        <tr style="height:15px; border:none;"><td colspan="11" style="border:none; background:none;"></td></tr>

        <tr>
            <td colspan="11" align="center" class="font-bold" style="background-color:#3b82f6; color:white; font-size:16pt; padding:12px; text-align:center;">
                📋 สรุปตามประเภทการลา
            </td>
        </tr>
        <tr align="center" class="font-bold" style="text-align:center;">
            <td colspan="4" style="background-color:#1e40af; color:white; padding:10px;">ประเภท</td>
            <td colspan="2" style="background-color:#1e40af; color:white; padding:10px;">จำนวนครั้ง</td>
            <td colspan="2" style="background-color:#1e40af; color:white; padding:10px;">จำนวนวัน</td>
            <td colspan="3" style="background-color:#1e40af; color:white; padding:10px;">จำนวนชั่วโมง</td>
        </tr>
        ${Object.entries(summary.byType).map(([type, data], i) => {
        const bgColor = i % 2 === 0 ? '#ffffff' : '#f1f5f9';
        return `<tr style="background:${bgColor};">
                <td colspan="4" align="left" class="font-bold" style="padding:10px; text-align:left;">${type}</td>
                <td colspan="2" align="center" style="padding:10px; text-align:center;">${data.count} ครั้ง</td>
                <td colspan="2" align="center" style="padding:10px; text-align:center;">${data.days.toFixed(1)} วัน</td>
                <td colspan="3" align="center" class="font-bold" style="padding:10px; color:#3b82f6; text-align:center;">${data.hours} ชม.</td>
            </tr>`;
      }).join('')}

        <tr style="height:15px; border:none;"><td colspan="11" style="border:none; background:none;"></td></tr>

        <tr>
            <td colspan="11" align="center" class="font-bold" style="background-color:#3b82f6; color:white; font-size:16pt; padding:12px; text-align:center;">
                🏢 สรุปตามแผนก
            </td>
        </tr>
        <tr align="center" class="font-bold" style="text-align:center;">
            <td colspan="5" style="background-color:#1e40af; color:white; padding:10px;">แผนก</td>
            <td colspan="3" style="background-color:#1e40af; color:white; padding:10px;">จำนวนครั้ง</td>
            <td colspan="3" style="background-color:#1e40af; color:white; padding:10px;">รวมชั่วโมง</td>
        </tr>
        ${Object.entries(summary.byDepartment).map(([dept, data], i) => {
        const bgColor = i % 2 === 0 ? '#ffffff' : '#f1f5f9';
        return `<tr style="background:${bgColor};">
                <td colspan="5" align="left" class="font-bold" style="padding:10px; text-align:left;">${dept}</td>
                <td colspan="3" align="center" style="padding:10px; text-align:center;">${data.count} ครั้ง</td>
                <td colspan="3" align="center" class="font-bold" style="padding:10px; color:#3b82f6; text-align:center;">${data.hours} ชม.</td>
            </tr>`;
      }).join('')}

        <tr style="height:15px; border:none;"><td colspan="11" style="border:none; background:none;"></td></tr>

        <tr>
            <td colspan="11" align="center" class="font-bold" style="background-color:#3b82f6; color:white; font-size:16pt; padding:12px; text-align:center;">
                📄 รายละเอียดการลาแต่ละรายการ
            </td>
        </tr>
        <tr align="center" class="font-bold" style="font-size:12pt; text-align:center;">
            <td style="background-color:#1e40af; color:white; padding:10px;">ลำดับ</td>
            <td style="background-color:#1e40af; color:white; padding:10px;">วันที่ส่งคำขอ</td>
            <td style="background-color:#1e40af; color:white; padding:10px;">ชื่อ-นามสกุล</td>
            <td style="background-color:#1e40af; color:white; padding:10px;">แผนก</td>
            <td style="background-color:#1e40af; color:white; padding:10px;">ตำแหน่ง</td>
            <td style="background-color:#1e40af; color:white; padding:10px;">ประเภทการลา</td>
            <td style="background-color:#1e40af; color:white; padding:10px;">วันที่เริ่มลา</td>
            <td style="background-color:#1e40af; color:white; padding:10px;">วันที่สิ้นสุด</td>
            <td style="background-color:#1e40af; color:white; padding:10px;">วัน</td>
            <td style="background-color:#1e40af; color:white; padding:10px;">ชม.</td>
            <td style="background-color:#1e40af; color:white; padding:10px;">เหตุผล</td>
        </tr>

        ${records.map((r, i) => {
        const bgColor = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        const createdDate = r.created_at ? new Date(r.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

        return `<tr style="background:${bgColor}; font-size:12pt;">
                <td align="center" style="padding:8px; text-align:center;">${i + 1}</td>
                <td align="center" style="padding:8px; text-align:center;">${createdDate}</td>
                <td align="left" style="padding:8px; text-align:left;"><b>${r.user_name || '-'}</b></td>
                <td align="center" style="padding:8px; text-align:center;">${r.department || '-'}</td>
                <td align="center" style="padding:8px; text-align:center;">${r.position || '-'}</td>
                <td align="center" class="font-bold" style="padding:8px; color:#7c3aed; text-align:center;">${r.leave_type || '-'}</td>
                <td align="center" style="padding:8px; text-align:center;">${r.start_datetime ? new Date(r.start_datetime).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                <td align="center" style="padding:8px; text-align:center;">${r.end_datetime ? new Date(r.end_datetime).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                <td align="center" class="font-bold" style="padding:8px; text-align:center;">${calcDays(r)}</td>
                <td align="center" class="font-bold" style="padding:8px; color:#3b82f6; text-align:center;">${calcHours(r)}</td>
                <td align="left" style="padding:8px; text-align:left;">${r.reason || '-'}</td>
            </tr>`;
      }).join('')}

    </table>
    </body>
    </html>
`;

      // ส่วน Export ไฟล์
      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `รายงานการลา_อนุมัติแล้ว_${new Date().toISOString().slice(0, 10)}.xls`
      link.click()
      URL.revokeObjectURL(link.href)

      this.showExportDialog = false
      this.$toast.add({ severity: 'success', summary: 'สำเร็จ', detail: `Export รายงานเรียบร้อย (${records.length} รายการ)`, life: 3000 })
    },
    async checkLeaveApprover() {
      try {
        const userId = localStorage.getItem('soc_user_id')
        const hasPermission = this.hasAccess('/leave_work/approve')

        // ถ้ามี permission แสดงปุ่มได้
        if (hasPermission) {
          this.isLeaveApprover = true
        }

        if (!userId) {
          // มี permission แต่ไม่มี userId → เห็นปุ่มแต่ไม่มีรายการ
          this.approverLevel = 0
          this.approverDepartments = []
          this.approverPositions = []
          return
        }

        const response = await this.$http.get('/api/settings/leave-approval')
        const level1 = response.data.level1 || []
        const level2 = response.data.level2 || []

        const myLevel1 = level1.find(a => a.user_id == userId && a.can_approve)
        const myLevel2 = level2.find(a => a.user_id == userId && a.can_approve)

        // ถ้าอยู่ใน leave-approval settings ก็เป็น approver ได้
        if (myLevel1 || myLevel2) {
          this.isLeaveApprover = true
        }

        // รวม department/position filters จากทุก level ที่มีสิทธิ์
        let depts = []
        let positions = []

        if (myLevel1) {
          depts = depts.concat(myLevel1.department_ids || [])
          positions = positions.concat(myLevel1.position_ids || [])
        }
        if (myLevel2) {
          depts = depts.concat(myLevel2.department_ids || [])
          positions = positions.concat(myLevel2.position_ids || [])
        }

        this.approverDepartments = [...new Set(depts)]
        this.approverPositions = [...new Set(positions)]

        if (myLevel1 && myLevel2) {
          this.approverLevel = 3
        } else if (myLevel1) {
          this.approverLevel = 1
        } else if (myLevel2) {
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
            name: record.employee_name,
            user_name: record.employee_name,
            position: record.employee_position,
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
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
  }
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

  .leave-btn,
  .approval-btn {
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
