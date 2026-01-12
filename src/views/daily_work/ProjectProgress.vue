<template>
  <div class="project-progress">
    <Toast />
    
    <Card class="header-card">
      <template #content>
        <div class="header-content">
          <div class="header-left">
            <Button icon="pi pi-arrow-left" @click="$router.go(-1)" text class="back-btn" />
            <div class="header-title">
              <i class="pi pi-chart-line header-icon"></i>
              <h1>ขั้นตอนการดำเนินการโครงการ</h1>
            </div>
          </div>
          <div class="header-right">
            <span class="p-input-icon-left search-box">
              <i class="pi pi-search" />
              <InputText v-model="searchQuery" placeholder="ค้นหาโครงการ..." @input="onSearch" />
            </span>
            <span class="stat-item">
              <i class="pi pi-folder"></i>
              {{ filteredProjects.length }} โครงการ
            </span>
          </div>
        </div>
      </template>
    </Card>

    <Card class="content-card">
      <template #content>
        <DataTable :value="filteredProjects" v-model:expandedRows="expandedRows" @rowExpand="onRowExpand"
          dataKey="id" :loading="loading" responsiveLayout="scroll" stripedRows
          :paginator="true" :rows="10" :rowsPerPageOptions="[10, 25, 50]">
          
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

          <Column field="status" header="สถานะโครงการ" :sortable="true" style="min-width: 140px;">
            <template #body="slotProps">
              <Badge :value="slotProps.data.status || 'ไม่ระบุ'"
                :style="{ backgroundColor: getStatusColor(slotProps.data.status), color: '#fff' }" />
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
              
              <div v-if="slotProps.data.steps && slotProps.data.steps.length > 0" class="steps-timeline">
                <div v-for="(step, index) in slotProps.data.steps" :key="step.id" 
                     class="step-item" :class="{ 'completed': step.status === 'completed', 'in-progress': step.status === 'in_progress' }">
                  <div class="step-number">{{ index + 1 }}</div>
                  <div class="step-content">
                    <div class="step-header">
                      <span class="step-name">{{ step.step_name }}</span>
                      <Badge :value="getStepStatusLabel(step.status)" 
                             :style="{ backgroundColor: getStepStatusColor(step.status), color: '#fff' }" />
                    </div>
                    <div v-if="step.description" class="step-description">{{ step.description }}</div>
                    <div class="step-meta">
                      <span v-if="step.start_date || step.end_date" class="meta-item">
                        <i class="pi pi-calendar"></i>
                        {{ formatDateRange(step.start_date, step.end_date) }}
                      </span>
                      <span v-if="step.assigned_users && step.assigned_users.length > 0" class="meta-item">
                        <i class="pi pi-users"></i>
                        {{ formatAssignedUsers(step.assigned_users) }}
                      </span>
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
      expandedRows: [],
      loading: false,
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
    this.loadProjects()
    this.loadCategories()
    this.loadStatuses()
  },
  methods: {
    async loadProjects() {
      this.loading = true
      try {
        const response = await this.$http.get('/api/tasks')
        this.projects = response.data
        
        // Load steps for each project
        for (const project of this.projects) {
          try {
            const stepsResponse = await this.$http.get(`/api/task-steps/task/${project.id}`)
            project.steps = stepsResponse.data || []
          } catch {
            project.steps = []
          }
        }
      } catch (error) {
        console.error('Error loading projects:', error)
      } finally {
        this.loading = false
      }
    },
    async loadCategories() {
      try {
        const response = await this.$http.get('/api/settings/categories')
        this.categories = response.data
      } catch { /* ignore */ }
    },
    async loadStatuses() {
      try {
        const response = await this.$http.get('/api/settings/statuses')
        this.statuses = response.data
      } catch { /* ignore */ }
    },
    onSearch() {
      // Search is handled by computed property
    },
    onRowExpand() {
      // Optional: Load steps on expand if not already loaded
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
    getStepStatusLabel(status) {
      const labels = {
        'pending': 'รอดำเนินการ',
        'in_progress': 'กำลังดำเนินการ',
        'completed': 'เสร็จสิ้น',
        'cancelled': 'ยกเลิก'
      }
      return labels[status] || status || 'ไม่ระบุ'
    },
    getStepStatusColor(status) {
      const colors = {
        'pending': '#f59e0b',
        'in_progress': '#3b82f6',
        'completed': '#10b981',
        'cancelled': '#ef4444'
      }
      return colors[status] || '#6c757d'
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
  border-radius: 12px;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title h1 {
  margin: 0;
  font-size: 1.25rem;
  color: white;
}

.header-icon {
  font-size: 1.5rem;
  color: white;
}

.back-btn {
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 8px !important;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.search-box {
  position: relative;
}

.search-box input {
  padding-left: 2.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  width: 250px;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.7);
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
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}
  color: #6366f1;
}

.content-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.project-name {
  font-weight: 600;
  color: #1f2937;
}
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
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  margin: 0.5rem 0;
}

.workflow-expansion h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.steps-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #d1d5db;
  transition: all 0.2s;
}

.step-item.completed {
  border-left-color: #10b981;
}

.step-item.in-progress {
  border-left-color: #3b82f6;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
}

.step-item.completed .step-number {
  background: #10b981;
  color: white;
}

.step-item.in-progress .step-number {
  background: #3b82f6;
  color: white;
}

.step-content {
  flex: 1;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.step-name {
  font-weight: 600;
  color: #1f2937;
}

.step-description {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.step-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #9ca3af;
}

.meta-item i {
  font-size: 0.75rem;
}

.no-steps {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
  font-style: italic;
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
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .step-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
