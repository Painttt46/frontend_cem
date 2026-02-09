<template>
  <div class="project-progress">
    <Toast />
    
    <Card class="header-card">
      <template #header>
        <div class="main-header">
          <h1><i class="pi pi-chart-line"></i> ขั้นตอนการดำเนินการโครงการ</h1>
        </div>
      </template>
    </Card>

    <div class="search-section">
      <span class="p-input-icon-left search-box">
        <i class="pi pi-search" />
        <InputText v-model="searchQuery" placeholder="ค้นหาโครงการ..." />
      </span>
      <span class="stat-item">
        <i class="pi pi-folder"></i>
        {{ filteredProjects.length }} โครงการ
      </span>
    </div>

    <Card class="content-card">
      <template #content>
        <DataTable :value="sortedProjects" v-model:expandedRows="expandedRows" @rowExpand="onRowExpand"
          dataKey="id" responsiveLayout="scroll"
          :paginator="true" :rows="10" :rowsPerPageOptions="[10, 25, 50]"
          @row-click="onRowClick" class="clickable-rows" :rowClass="getRowClass">
          
          <Column :expander="true" style="width: 3rem" />
          
          <Column field="task_name" header="ชื่อโครงการ" :sortable="true" style="min-width: 200px;">
            <template #body="slotProps">
              <div class="project-info">
                <div class="project-name">{{ slotProps.data.task_name }}</div>
                <Badge v-if="slotProps.data.so_number" :value="slotProps.data.so_number" severity="info" />
              </div>
            </template>
          </Column>

          <Column field="category" header="หมวดหมู่" :sortable="true" style="min-width: 120px;">
            <template #body="slotProps">
              <Badge v-if="slotProps.data.category" :value="slotProps.data.category"
                :style="{ backgroundColor: getCategoryColor(slotProps.data.category), color: '#fff' }" />
              <span v-else class="text-muted">-</span>
            </template>
          </Column>

          <Column header="ความคืบหน้า" style="min-width: 180px;">
            <template #body="slotProps">
              <div class="progress-info">
                <ProgressBar :value="getProjectProgress(slotProps.data)" :showValue="false" style="height: 8px;" />
                <span class="progress-text">{{ getProgressText(slotProps.data) }}</span>
              </div>
            </template>
          </Column>

          <Column field="sale_owner" header="เจ้าของโครงการ" :sortable="true" style="min-width: 120px;">
            <template #body="slotProps">
              <span v-if="slotProps.data.sale_owner" class="clickable-name" @click="showSaleUserInfo(slotProps.data.sale_owner)">
                {{ slotProps.data.sale_owner }}
              </span>
              <span v-else>-</span>
            </template>
          </Column>

          <template #expansion="slotProps">
            <div class="workflow-expansion">
              <h4><i class="pi pi-sitemap"></i> ขั้นตอนการดำเนินงาน</h4>
              
              <div v-if="slotProps.data.steps && slotProps.data.steps.length > 0" class="workflow-timeline">
                <div v-for="(step, index) in slotProps.data.steps" :key="step.id" class="workflow-step">
                  <div class="step-card" :class="getStepClass(step)" @click="openStepDetail(step, index)" style="cursor: pointer;" :title="'คลิกเพื่อดูรายละเอียด: ' + step.step_name">
                    <div class="step-header">
                      <div class="step-number">{{ index + 1 }}</div>
                      <div class="step-status-badge" :class="getStepClass(step)">
                        <i :class="getStepIcon(step)"></i>
                        {{ getStepStatusLabel(step) }}
                      </div>
                      <button v-if="canCompleteStep(step)" class="complete-btn"
                        @click="confirmCompleteStep(step)" :disabled="completingStepId === step.id">
                        <i :class="completingStepId === step.id ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
                        {{ completingStepId === step.id ? 'กำลังบันทึก...' : 'เสร็จสิ้น' }}
                      </button>
                    </div>

                    <div class="step-content">
                      <h4>{{ step.step_name }}</h4>
                      <p v-if="step.description" class="step-description">{{ step.description }}</p>
                      
                      <div class="step-info">
                        <div class="info-item" v-if="step.project_statuses && step.project_statuses.length > 0">
                          <span v-for="ps in step.project_statuses" :key="ps" class="project-badge" 
                                :style="{ background: getProjectStatusColor(ps) + '20', color: getProjectStatusColor(ps) }">
                            <i class="pi pi-folder"></i> {{ getProjectStatusLabel(ps) }}
                          </span>
                        </div>

                        <div class="info-item" v-if="step.start_date || step.end_date">
                          <i class="pi pi-calendar"></i>
                          <span>{{ formatDateRange(step.start_date, step.end_date) }}</span>
                        </div>
                        
                        <div class="info-item" v-if="step.created_by_name || step.completed_by_name">
                          <span v-if="step.created_by_name"><i class="pi pi-user-plus"></i> สร้างโดย: {{ step.created_by_name }}</span>
                          <span v-if="step.created_by_name && step.status === 'completed' && step.completed_by_name"> | </span>
                          <span v-if="step.status === 'completed' && step.completed_by_name" class="completed-text"><i class="pi pi-check-circle"></i> เสร็จสิ้นโดย: {{ step.completed_by_name }}{{ step.completed_at ? ` (${formatCompletedDate(step.completed_at)})` : '' }}</span>
                        </div>
                        
                        <div class="info-item" v-if="step.assigned_users && step.assigned_users.length > 0">
                          <i class="pi pi-users"></i>
                          <div class="assigned-users">
                            <span v-for="(user, idx) in step.assigned_users" :key="idx" class="user-badge">
                              {{ typeof user === 'object' ? user.name : user }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="no-steps">
                <i class="pi pi-info-circle"></i>
                <span>ยังไม่มีขั้นตอนการดำเนินงาน</span>
              </div>
            </div>
          </template>

          <template #empty>
            <div class="empty-state">
              <i class="pi pi-folder-open"></i>
              <p>ไม่พบข้อมูลโครงการ</p>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
  <UserInfoDialog 
    v-model:visible="showUserInfoDialog" 
    :userId="selectedUserId"
    :userName="selectedUserName"
  />

  <!-- Step Detail Dialog -->
  <Dialog v-model:visible="showStepDetail" :modal="true" :draggable="false" :closable="true"
    :style="{ width: '720px', maxHeight: '90vh' }" :breakpoints="{ '960px': '80vw', '640px': '95vw' }"
    :contentStyle="{ overflow: 'auto' }" class="step-detail-dlg" :showHeader="false">
    <div v-if="selectedStep" class="step-detail-dialog">
      <!-- Custom Header -->
      <div class="dlg-header" :class="getStepClass(selectedStep)">
        <div class="dlg-header-top">
          <span class="dlg-step-badge">STEP {{ selectedStep._index }}</span>
          <button class="dlg-close-btn" @click="showStepDetail = false"><i class="pi pi-times"></i></button>
        </div>
        <h3 class="dlg-title">{{ selectedStep.step_name }}</h3>
        <span class="dlg-status-chip" :class="getStepClass(selectedStep)">
          <i :class="getStepIcon(selectedStep)"></i>
          {{ getStepStatusLabel(selectedStep) }}
        </span>
      </div>

      <!-- Body -->
      <div class="dlg-body">
        <div v-if="selectedStep.description" class="dlg-section">
          <div class="dlg-label"><i class="pi pi-align-left"></i> รายละเอียด</div>
          <div class="dlg-desc">{{ selectedStep.description }}</div>
        </div>

        <div class="dlg-grid">
          <div v-if="selectedStep.start_date || selectedStep.end_date" class="dlg-grid-item">
            <div class="dlg-label"><i class="pi pi-calendar"></i> ระยะเวลา</div>
            <div class="dlg-value">{{ formatDateRange(selectedStep.start_date, selectedStep.end_date) }}</div>
          </div>
          <div v-if="selectedStep.created_by_name" class="dlg-grid-item">
            <div class="dlg-label"><i class="pi pi-user-plus"></i> สร้างโดย</div>
            <div class="dlg-value">{{ selectedStep.created_by_name }}</div>
          </div>
          <div v-if="selectedStep.status === 'completed' && selectedStep.completed_by_name" class="dlg-grid-item">
            <div class="dlg-label"><i class="pi pi-check-circle"></i> เสร็จสิ้นโดย</div>
            <div class="dlg-value">{{ selectedStep.completed_by_name }}{{ selectedStep.completed_at ? ` (${formatCompletedDate(selectedStep.completed_at)})` : '' }}</div>
          </div>
        </div>

        <div v-if="selectedStep.project_statuses && selectedStep.project_statuses.length > 0" class="dlg-section">
          <div class="dlg-label"><i class="pi pi-folder"></i> สถานะโครงการ</div>
          <div class="dlg-chips">
            <span v-for="ps in selectedStep.project_statuses" :key="ps" class="dlg-chip"
              :style="{ background: getProjectStatusColor(ps) + '18', color: getProjectStatusColor(ps), border: '1px solid ' + getProjectStatusColor(ps) + '40' }">
              {{ getProjectStatusLabel(ps) }}
            </span>
          </div>
        </div>

        <div v-if="selectedStep.assigned_users && selectedStep.assigned_users.length > 0" class="dlg-section">
          <div class="dlg-label"><i class="pi pi-users"></i> ผู้รับผิดชอบ</div>
          <div class="dlg-chips">
            <span v-for="(user, idx) in selectedStep.assigned_users" :key="idx" class="dlg-user-chip">
              <i class="pi pi-user"></i>
              {{ typeof user === 'object' ? user.name : user }}
            </span>
          </div>
        </div>

        <div v-if="canCompleteStep(selectedStep)" class="dlg-action-footer">
          <div class="dlg-action-divider"></div>
          <button class="dlg-complete-btn" @click="confirmCompleteStep(selectedStep)" :disabled="completingStepId === selectedStep.id">
            <i :class="completingStepId === selectedStep.id ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'"></i>
            {{ completingStepId === selectedStep.id ? 'กำลังบันทึก...' : 'อนุมัติ — ทำเครื่องหมายเสร็จสิ้น' }}
          </button>
        </div>
      </div>
    </div>
  </Dialog>
  </div>
</template>

<script>
import { useConfirm } from 'primevue/useconfirm'
import UserInfoDialog from '@/components/UserInfoDialog.vue'
import axios from '@/utils/axiosConfig'

export default {
  name: 'ProjectProgress',
  components: { UserInfoDialog },
  setup() {
    return { $confirm: useConfirm() }
  },
  data() {
    return {
      projects: [],
      expandedRows: {},
      categories: [],
      statuses: [],
      searchQuery: '',
      completingStepId: null,
      currentUserId: parseInt(localStorage.getItem('soc_user_id')) || null,
      showUserInfoDialog: false,
      selectedUserId: null,
      selectedUserName: '',
      allUsers: [],
      showStepDetail: false,
      selectedStep: null
    }
  },
  computed: {
    filteredProjects() {
      // แสดงเฉพาะโครงการที่มี workflow steps
      let projects = this.projects.filter(p => p.steps && p.steps.length > 0)
      
      if (!this.searchQuery) return projects
      const query = this.searchQuery.toLowerCase()
      return projects.filter(p => 
        p.task_name?.toLowerCase().includes(query) ||
        p.so_number?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.sale_owner?.toLowerCase().includes(query)
      )
    },
    sortedProjects() {
      // เรียงโครงการที่มีชื่อตัวเองใน workflow step ไว้บนสุด
      return [...this.filteredProjects].sort((a, b) => {
        const aHasMe = this.hasMyAssignment(a)
        const bHasMe = this.hasMyAssignment(b)
        if (aHasMe && !bHasMe) return -1
        if (!aHasMe && bHasMe) return 1
        return 0
      })
    }
  },
  mounted() {
    this.setupDragScroll()
    this.loadProjects()
    this.loadCategories()
    this.loadStatuses()
    this.loadUsers()
  },
  watch: {
    projects() {
      // เมื่อโหลด projects เสร็จ ให้เช็ค query params
      this.handleQueryParams()
    }
  },
  methods: {
    async loadUsers() {
      try {
        const response = await axios.get('/api/users')
        this.allUsers = response.data
      } catch { /* ignore */ }
    },
    openStepDetail(step, index) {
      this.selectedStep = { ...step, _index: index + 1 }
      this.showStepDetail = true
    },
    showSaleUserInfo(saleName) {
      const user = this.allUsers.find(u => `${u.firstname} ${u.lastname}` === saleName)
      if (user) {
        this.selectedUserName = saleName
        this.selectedUserId = user.id
        this.showUserInfoDialog = true
      }
    },
    handleQueryParams() {
      const taskId = parseInt(this.$route.query.taskId)
      if (taskId && this.projects.length > 0) {
        const project = this.projects.find(p => p.id === taskId)
        if (project) {
          this.expandedRows = { [taskId]: true }
        }
      }
    },
    setupDragScroll() {
      let isDragging = false
      let startX = 0, startY = 0, scrollLeft = 0, scrollTop = 0

      const handleMouseDown = (e) => {
        const target = e.target.closest('.p-datatable-wrapper')
        if (!target || e.target.closest('input, button, a, .p-checkbox, .p-dropdown, .p-calendar, .p-button')) return
        
        // ถ้าคลิกที่ Badge หรือ icon ให้ drag ได้
        if (e.target.closest('.p-badge, i')) {
          isDragging = true
          startX = e.pageX - target.offsetLeft
          startY = e.pageY - target.offsetTop
          scrollLeft = target.scrollLeft
          scrollTop = target.scrollTop
          return
        }
        
        // ถ้าคลิกที่ span หรือ div ที่มี text โดยตรง ให้ select ได้
        if (e.target.tagName === 'SPAN' || e.target.tagName === 'DIV') {
          const hasDirectText = Array.from(e.target.childNodes).some(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
          )
          if (hasDirectText) return
        }
        
        isDragging = true
        startX = e.pageX - target.offsetLeft
        startY = e.pageY - target.offsetTop
        scrollLeft = target.scrollLeft
        scrollTop = target.scrollTop
      }

      const handleMouseMove = (e) => {
        if (!isDragging) return
        const target = e.target.closest('.p-datatable-wrapper')
        if (!target) return
        
        const moveX = Math.abs(e.pageX - (startX + target.offsetLeft))
        const moveY = Math.abs(e.pageY - (startY + target.offsetTop))
        
        if (moveX > 5 || moveY > 5) {
          e.preventDefault()
          target.style.cursor = 'grabbing'
          target.style.userSelect = 'none'
          
          const x = e.pageX - target.offsetLeft
          const y = e.pageY - target.offsetTop
          target.scrollLeft = scrollLeft - (x - startX) * 1.5
          target.scrollTop = scrollTop - (y - startY) * 1.5
        }
      }

      const handleMouseUp = (e) => {
        if (!isDragging) return
        const target = e.target.closest('.p-datatable-wrapper')
        if (target) {
          target.style.cursor = 'grab'
          target.style.userSelect = 'text'
        }
        isDragging = false
      }

      document.addEventListener('mousedown', handleMouseDown)
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      if (!document.getElementById('drag-scroll-style-project')) {
        const style = document.createElement('style')
        style.id = 'drag-scroll-style-project'
        style.textContent = `
          .p-datatable-wrapper * {
            cursor: default !important;
          }
        `
        document.head.appendChild(style)
      }
    },
    async loadProjects() {
      try {
        const response = await this.$http.get('/api/tasks')
        this.projects = response.data
        
        // Load steps for each project (silent to prevent loading flicker)
        for (const project of this.projects) {
          try {
            const stepsResponse = await this.$http.get(`/api/task-steps/task/${project.id}`, { silent: true })
            project.steps = (stepsResponse.data || []).map(step => ({
              ...step,
              assigned_users: typeof step.assigned_users === 'string' 
                ? JSON.parse(step.assigned_users) 
                : (step.assigned_users || [])
            }))
          } catch {
            project.steps = []
          }
        }
      } catch (error) {
        console.error('Error loading projects:', error)
      }
    },
    async loadCategories() {
      try {
        const response = await this.$http.get('/api/settings/categories', { silent: true })
        this.categories = response.data
      } catch { /* ignore */ }
    },
    async loadStatuses() {
      try {
        const response = await this.$http.get('/api/settings/statuses', { silent: true })
        this.statuses = response.data
      } catch { /* ignore */ }
    },
    onSearch() {
      // Search is handled by computed property
    },
    onRowExpand() {
      // Optional: Load steps on expand if not already loaded
    },
    onRowClick(event) {
      const row = event.data
      if (this.expandedRows[row.id]) {
        delete this.expandedRows[row.id]
        this.expandedRows = { ...this.expandedRows }
      } else {
        this.expandedRows = { ...this.expandedRows, [row.id]: true }
      }
    },
    getProjectProgress(project) {
      if (!project.steps || project.steps.length === 0) return 0
      const completed = project.steps.filter(s => s.status === 'completed').length
      return Math.round((completed / project.steps.length) * 100)
    },
    getProgressText(project) {
      if (!project.steps || project.steps.length === 0) return 'ไม่มีขั้นตอน'
      const completed = project.steps.filter(s => s.status === 'completed').length
      return `${completed}/${project.steps.length} ขั้นตอน`
    },
    getCategoryColor(category) {
      const cat = this.categories.find(c => c.label === category || c.value === category)
      return cat?.color || '#6c757d'
    },
    getStatusColor(status) {
      const st = this.statuses.find(s => s.value === status || s.label === status)
      return st?.color || '#6c757d'
    },
    getLatestWorkingStep(project) {
      if (!project.steps || project.steps.length === 0) return []
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // หา step ที่มีการลงงานจริง และวันที่ลงงานไม่เกินวันนี้
      const workingSteps = project.steps.filter(s => {
        if (!s.has_work_logged || !s.project_statuses || s.project_statuses.length === 0) return false
        // เช็คว่า latest_work_date ไม่เกินวันนี้
        if (s.latest_work_date) {
          const workDate = new Date(s.latest_work_date)
          workDate.setHours(0, 0, 0, 0)
          return workDate <= today
        }
        return true
      })
      
      if (workingSteps.length === 0) return []
      // เรียงตามเวลาที่อัปเดตล่าสุด
      const latestStep = workingSteps.sort((a, b) => 
        new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
      )[0]
      return latestStep.project_statuses || []
    },
    getStepStatusLabel(step) {
      if (step.status === 'completed') return 'เสร็จสิ้น'
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // เกินกำหนด - เช็คก่อนเสมอ
      if (step.end_date) {
        const endDate = new Date(step.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return 'เกินกำหนด'
      }
      
      if (step.has_work_logged) {
        if (step.latest_work_date) {
          const wDate = new Date(step.latest_work_date)
          wDate.setHours(0, 0, 0, 0)
          if (wDate <= today) return 'กำลังดำเนินการ'
        } else {
          return 'กำลังดำเนินการ'
        }
      }
      
      return 'รอดำเนินการ'
    },
    getStepClass(step) {
      if (step.status === 'completed') return 'status-completed'
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // เกินกำหนด - เช็คก่อนเสมอ
      if (step.end_date) {
        const endDate = new Date(step.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return 'status-overdue'
      }
      
      if (step.has_work_logged) {
        if (step.latest_work_date) {
          const wDate = new Date(step.latest_work_date)
          wDate.setHours(0, 0, 0, 0)
          if (wDate <= today) return 'status-working'
        } else {
          return 'status-working'
        }
      }
      
      return 'status-pending'
    },
    hasMyAssignment(project) {
      if (!project.steps || project.steps.length === 0) return false
      return project.steps.some(step => 
        step.assigned_users && step.assigned_users.some(u => u.id === this.currentUserId)
      )
    },
    getRowClass(data) {
      return this.hasMyAssignment(data) ? 'my-project-row' : ''
    },
    canCompleteStep(step) {
      if (step.status === 'completed') return false
      if (!step.assigned_users || step.assigned_users.length === 0) return false
      return step.assigned_users.some(u => u.id === this.currentUserId)
    },
    confirmCompleteStep(step) {
      this.$confirm.require({
        message: `ยืนยันว่าขั้นตอน "${step.step_name}" เสร็จสิ้นแล้ว?`,
        header: 'ยืนยันการดำเนินการ',
        icon: 'pi pi-check-circle',
        acceptLabel: 'ยืนยัน',
        rejectLabel: 'ยกเลิก',
        accept: () => this.completeStep(step)
      })
    },
    async completeStep(step) {
      this.completingStepId = step.id
      try {
        await this.$http.put(`/api/task-steps/${step.id}`, {
          step_name: step.step_name,
          step_order: step.step_order,
          start_date: step.start_date,
          end_date: step.end_date,
          assigned_users: step.assigned_users,
          description: step.description,
          project_statuses: step.project_statuses,
          status: 'completed'
        })
        step.status = 'completed'
        window.dispatchEvent(new CustomEvent('taskUpdated'))
        this.$toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'อัปเดตสถานะเสร็จสิ้นแล้ว', life: 3000 })
      } catch (error) {
        console.error(error)
        this.$toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: error.response?.data?.error || 'ไม่สามารถอัปเดตสถานะได้', life: 3000 })
      }
      this.completingStepId = null
    },
    getStepIcon(step) {
      if (step.status === 'completed') return 'pi pi-check-circle'
      if (step.status === 'in_progress') return 'pi pi-spin pi-spinner'
      return 'pi pi-circle'
    },
    formatDateRange(start, end) {
      const formatDate = (date) => {
        if (!date) return ''
        return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
      }
      if (start && end) return `${formatDate(start)} - ${formatDate(end)}`
      if (start) return `เริ่ม ${formatDate(start)}`
      if (end) return `ถึง ${formatDate(end)}`
      return ''
    },
    formatCompletedDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
    },
    formatAssignedUsers(users) {
      if (!users || users.length === 0) return ''
      return users.map(u => u.name || u).join(', ')
    },
    getProjectStatusLabel(status) {
      const found = this.statuses.find(s => s.value === status)
      return found ? found.label : status
    },
    getProjectStatusColor(status) {
      const found = this.statuses.find(s => s.value === status)
      return found?.color || '#6b7280'
    }
  }
}
</script>

<style scoped>
.project-progress {
  padding: 1.5rem;
  width: 100%;
  margin: 0;
}

.header-card {
  width: 100%;
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
  min-height: 80px;
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

.search-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-box {
  position: relative;
}

.search-box input {
  padding-left: 2.5rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  width: 250px;
}

.search-box i {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.95rem;
}

.content-card {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.project-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.project-name {
  font-weight: 600;
  color: #1f2937;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.progress-text {
  font-size: 0.8rem;
  color: #6b7280;
}

.text-muted {
  color: #9ca3af;
}

.status-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

/* Workflow Expansion */
.workflow-expansion {
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  margin: 0.5rem 0;
}

.workflow-expansion h4 {
  margin: 0 0 1.5rem 0;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
}

.workflow-expansion h4 i {
  color: #4A90E2;
}

.steps-timeline {
  position: relative;
  padding-left: 1rem;
}

.steps-timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 20px;
  bottom: 20px;
  width: 2px;
  background: linear-gradient(to bottom, #e2e8f0, #cbd5e1);
}

.step-item {
  display: flex;
  gap: 1.25rem;
  padding: 1.25rem;
  background: white;
  border-radius: 12px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
}

.step-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateX(4px);
}

.step-item:last-child {
  margin-bottom: 0;
}

.step-item.completed {
  border-color: #10b981;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
}

.step-item.in-progress {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
}

.step-item.pending {
  border-color: #9ca3af;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
}

.step-item.warning {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
}

.step-item.overdue {
  border-color: #ef4444;
  background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
}

.step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: #64748b;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.step-item.completed .step-number {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.step-item.in-progress .step-number {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
}

.step-item.pending .step-number {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  color: white;
}

.step-item.warning .step-number {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.step-item.overdue .step-number {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.75rem;
}

.step-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
}

.step-description {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.step-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.meta-item i {
  font-size: 0.8rem;
  color: #94a3b8;
}

.no-steps {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #94a3b8;
  padding: 2rem;
  text-align: center;
}

.no-steps i {
  font-size: 2.5rem;
  color: #cbd5e1;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .project-progress {
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

  .search-section {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box input {
    width: 100%;
  }

  .step-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .step-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
}

@media (max-width: 480px) {
  .project-progress {
    padding: 0.5rem;
  }

  .main-header {
    padding: 1rem;
  }

  .main-header h1 {
    font-size: 1.3rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stat-item {
    font-size: 0.85rem;
  }
}

.clickable-rows :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

.project-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Workflow Block Style */
.workflow-timeline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-left: 0.5rem;
  align-items: center;
}

.workflow-step {
  position: relative;
  flex: 0 0 auto;
  margin-left: 25px;
  display: flex;
  align-items: center;
}

.workflow-step:first-child {
  margin-left: 0;
}

.workflow-step:not(:first-child)::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 50%;
  transform: translateY(-50%);
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 10px solid #3b82f6;
}

.workflow-step:not(:first-child)::after {
  content: '';
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 3px;
  background: #3b82f6;
}

.step-card {
  background: white;
  border-radius: 10px;
  padding: 0.75rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-left: 3px solid #9ca3af;
  min-width: 180px;
}

.step-card.status-completed {
  border-left-color: #10b981;
  background: linear-gradient(to right, #f0fdf4 0%, white 10%);
}

.step-card.status-working {
  border-left-color: #f59e0b;
  background: linear-gradient(to right, #fefce8 0%, white 10%);
}

.step-card.status-overdue {
  border-left-color: #ef4444;
  background: linear-gradient(to right, #fef2f2 0%, white 10%);
}

.step-card.status-in_progress {
  border-left-color: #3b82f6;
  background: linear-gradient(to right, #eff6ff 0%, white 10%);
}

.step-card.status-pending {
  border-left-color: #9ca3af;
  background: linear-gradient(to right, #f9fafb 0%, white 10%);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.75rem;
}

.status-completed .step-number {
  background: linear-gradient(135deg, #10b981, #059669);
}

.status-working .step-number {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.status-overdue .step-number {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.status-in_progress .step-number {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.step-status-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  background: #e5e7eb;
  color: #374151;
}

.step-status-badge.status-completed {
  background: #d1fae5;
  color: #047857;
}

.step-status-badge.status-working {
  background: #fef3c7;
  color: #b45309;
}

.step-status-badge.status-overdue {
  background: #fee2e2;
  color: #dc2626;
}

.step-status-badge.status-in_progress {
  background: #dbeafe;
  color: #1d4ed8;
}

.step-content h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.85rem;
  color: #1e293b;
}

.step-description {
  color: #64748b;
  font-size: 0.7rem;
  margin: 0 0 0.5rem 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.step-info {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: #475569;
}

.info-item i {
  color: #94a3b8;
  font-size: 0.65rem;
}

.assigned-users {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.user-badge {
  background: #3b82f6;
  color: #fff;
  padding: 0.1rem 0.4rem;
  border-radius: 8px;
  font-size: 0.65rem;
}

.complete-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.complete-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.complete-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.complete-btn i {
  font-size: 0.9rem;
}

:deep(.my-project-row) {
  background: linear-gradient(90deg, #fef3c7 0%, #fefce8 100%) !important;
  border-left: 4px solid #f59e0b !important;
}

:deep(.my-project-row:hover) {
  background: linear-gradient(90deg, #fde68a 0%, #fef9c3 100%) !important;
}
.clickable-name { color: #4A90E2; cursor: pointer; font-weight: 500; }
.clickable-name:hover { text-decoration: underline; color: #2563eb; }
.completed-text { color: #16a34a; }
.completed-text i { color: #16a34a; }

/* Step Detail Dialog */
.step-detail-dlg :deep(.p-dialog) {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05);
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
  border: none;
}
.step-detail-dlg :deep(.p-dialog-content) {
  padding: 0 !important;
  border: none;
  border-radius: 20px;
}
.step-detail-dialog {
  display: flex;
  flex-direction: column;
}

/* Dialog Header */
.dlg-header {
  padding: 1.75rem 2rem 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
  position: relative;
}
.dlg-header.status-completed { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-bottom-color: #bbf7d0; }
.dlg-header.status-working { background: linear-gradient(135deg, #fffbeb, #fef3c7); border-bottom-color: #fde68a; }
.dlg-header.status-overdue { background: linear-gradient(135deg, #fef2f2, #fee2e2); border-bottom-color: #fecaca; }
.dlg-header.status-pending { background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-bottom-color: #e2e8f0; }

.dlg-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.dlg-step-badge {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #64748b;
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.dlg-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.2s;
  font-size: 1rem;
}
.dlg-close-btn:hover {
  background: rgba(0,0,0,0.08);
  color: #334155;
}
.dlg-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.4;
}
.dlg-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.85rem;
  border-radius: 20px;
  background: #e5e7eb;
  color: #374151;
}
.dlg-status-chip.status-completed { background: #d1fae5; color: #047857; }
.dlg-status-chip.status-working { background: #fef3c7; color: #b45309; }
.dlg-status-chip.status-overdue { background: #fee2e2; color: #dc2626; }
.dlg-status-chip.status-pending { background: #e5e7eb; color: #6b7280; }

/* Dialog Body */
.dlg-body {
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.dlg-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.dlg-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.dlg-label i { font-size: 0.75rem; }
.dlg-desc {
  font-size: 0.95rem;
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: #f8fafc;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
.dlg-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
.dlg-grid-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  background: #f8fafc;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
}
.dlg-value {
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 500;
}
.dlg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.dlg-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}
.dlg-user-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.25);
}
.dlg-user-chip i { font-size: 0.75rem; }

/* Approve Button Footer */
.dlg-action-footer {
  padding: 0 2rem 1.75rem;
}
.dlg-action-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
  margin-bottom: 1.25rem;
}
.dlg-complete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.9rem 1.5rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
  letter-spacing: 0.3px;
}
.dlg-complete-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
}
.dlg-complete-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}
.dlg-complete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.dlg-complete-btn i {
  font-size: 1.1rem;
}

/* Responsive */
@media (max-width: 640px) {
  .dlg-header { padding: 1.25rem 1.25rem 1rem; }
  .dlg-title { font-size: 1.15rem; }
  .dlg-body { padding: 1.25rem; gap: 1rem; }
  .dlg-grid { grid-template-columns: 1fr; gap: 0.75rem; }
  .dlg-desc { font-size: 0.9rem; padding: 0.75rem; }
  .dlg-action-footer { padding: 0 1.25rem 1.25rem; }
  .dlg-complete-btn { padding: 0.8rem 1rem; font-size: 0.95rem; border-radius: 12px; }
}

.step-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}
</style>
