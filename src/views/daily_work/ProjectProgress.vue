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
        <DataTable :value="filteredProjects" v-model:expandedRows="expandedRows" @rowExpand="onRowExpand"
          dataKey="id" responsiveLayout="scroll" stripedRows
          :paginator="true" :rows="10" :rowsPerPageOptions="[10, 25, 50]"
          @row-click="onRowClick" class="clickable-rows">
          
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

          <Column field="status" header="สถานะโครงการ" :sortable="true" style="min-width: 180px;">
            <template #body="slotProps">
              <Badge :value="getLatestWorkingStep(slotProps.data)"
                :style="{ backgroundColor: getLatestStepColor(slotProps.data), color: '#fff' }" />
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

          <Column field="sale_owner" header="เจ้าของโครงการ" :sortable="true" style="min-width: 120px;" />

          <template #expansion="slotProps">
            <div class="workflow-expansion">
              <h4><i class="pi pi-sitemap"></i> ขั้นตอนการดำเนินงาน</h4>
              
              <div v-if="slotProps.data.steps && slotProps.data.steps.length > 0" class="workflow-timeline">
                <div v-for="(step, index) in slotProps.data.steps" :key="step.id" class="workflow-step">
                  <div class="step-card" :class="getStepClass(step)">
                    <div class="step-header">
                      <div class="step-number">{{ index + 1 }}</div>
                      <div class="step-status-badge" :class="getStepClass(step)">
                        <i :class="getStepIcon(step)"></i>
                        {{ getStepStatusLabel(step) }}
                      </div>
                    </div>

                    <div class="step-content">
                      <h4>{{ step.step_name }}</h4>
                      <p v-if="step.description" class="step-description">{{ step.description }}</p>
                      
                      <div class="step-info">
                        <div class="info-item" v-if="step.project_status">
                          <span class="project-badge" 
                                :style="{ background: getProjectStatusColor(step.project_status) + '20', color: getProjectStatusColor(step.project_status) }">
                            <i class="pi pi-folder"></i> {{ getProjectStatusLabel(step.project_status) }}
                          </span>
                        </div>

                        <div class="info-item" v-if="step.start_date || step.end_date">
                          <i class="pi pi-calendar"></i>
                          <span>{{ formatDateRange(step.start_date, step.end_date) }}</span>
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
  </div>
</template>

<script>
export default {
  name: 'ProjectProgress',
  data() {
    return {
      projects: [],
      expandedRows: {},
      categories: [],
      statuses: [],
      searchQuery: ''
    }
  },
  computed: {
    filteredProjects() {
      if (!this.searchQuery) return this.projects
      const query = this.searchQuery.toLowerCase()
      return this.projects.filter(p => 
        p.task_name?.toLowerCase().includes(query) ||
        p.so_number?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.sale_owner?.toLowerCase().includes(query)
      )
    }
  },
  mounted() {
    this.setupDragScroll()
    this.loadProjects()
    this.loadCategories()
    this.loadStatuses()
  },
  methods: {
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
            project.steps = stepsResponse.data || []
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
      if (!project.steps || project.steps.length === 0) return '-'
      // หา step ล่าสุดที่มีการลงงานจริง
      const workingSteps = project.steps.filter(s => s.has_work_logged)
      if (workingSteps.length === 0) return '-'
      const latestStep = workingSteps[workingSteps.length - 1]
      return latestStep.step_name
    },
    getLatestStepColor(project) {
      if (!project.steps || project.steps.length === 0) return '#9ca3af'
      const workingSteps = project.steps.filter(s => s.has_work_logged)
      if (workingSteps.length === 0) return '#9ca3af'
      const latestStep = workingSteps[workingSteps.length - 1]
      return this.getStepStatusColor(latestStep)
    },
    getStepStatusLabel(step) {
      // เสร็จสิ้น
      if (step.status === 'completed') return 'เสร็จสิ้น'
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // เกินวันสิ้นสุดแล้วยังไม่ complete
      if (step.end_date) {
        const endDate = new Date(step.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return 'เกินกำหนด'
      }
      
      // ถึงเวลาเริ่มแล้วยังไม่มีคนลงงาน
      if (step.start_date && (!step.assigned_users || step.assigned_users.length === 0)) {
        const startDate = new Date(step.start_date)
        startDate.setHours(0, 0, 0, 0)
        if (today >= startDate) return 'รอผู้รับผิดชอบ'
      }
      
      // มีการลงงานจริง = กำลังดำเนินการ
      if (step.has_work_logged) return 'กำลังดำเนินการ'
      // ยังไม่มีการลงงาน
      return 'รอดำเนินการ'
    },
    getStepStatusColor(step) {
      // เสร็จสิ้น = เขียว
      if (step.status === 'completed') return '#10b981'
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // เกินวันสิ้นสุดแล้วยังไม่ complete = แดง
      if (step.end_date) {
        const endDate = new Date(step.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return '#ef4444'
      }
      
      // ถึงเวลาเริ่มแล้วยังไม่มีคนลงงาน = เหลือง
      if (step.start_date && (!step.assigned_users || step.assigned_users.length === 0)) {
        const startDate = new Date(step.start_date)
        startDate.setHours(0, 0, 0, 0)
        if (today >= startDate) return '#f59e0b'
      }
      
      // มีการลงงานจริง = ฟ้า
      if (step.has_work_logged) return '#3b82f6'
      // ยังไม่มีการลงงาน = เทา
      return '#9ca3af'
    },
    getStepClass(step) {
      if (step.status === 'completed') return 'status-completed'
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // เกินกำหนด = แดง
      if (step.end_date) {
        const endDate = new Date(step.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return 'status-overdue'
      }
      
      // กำลังดำเนินการ = เขียว
      if (step.has_work_logged) return 'status-working'
      
      return 'status-pending'
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
  max-width: 1400px;
  margin: 0 auto;
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
  border-left-color: #10b981;
  background: linear-gradient(to right, #f0fdf4 0%, white 10%);
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
  background: linear-gradient(135deg, #10b981, #059669);
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
  background: #d1fae5;
  color: #047857;
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
</style>
