<template>
  <div class="analytics-container">
    <Toast />
    
    <!-- Header -->
    <Card class="header-card mb-4">
      <template #content>
        <div class="header-content">
          <div class="header-left">
            <Button icon="pi pi-arrow-left" @click="$router.go(-1)" text class="back-btn" />
            <div class="header-title">
              <i class="pi pi-chart-line header-icon"></i>
              <h1>Analytics & Reports</h1>
            </div>
          </div>
          <div class="header-right">
            <Dropdown v-model="selectedYear" :options="yearOptions" placeholder="ปี" class="year-filter" />
            <Dropdown v-model="selectedDepartment" :options="departmentOptions" optionLabel="label" optionValue="value"
                      placeholder="ทุกแผนก" :showClear="true" class="dept-filter" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Tab Navigation -->
    <TabView v-model:activeIndex="activeTab">
      <!-- Tab 1: Workload -->
      <TabPanel header="📊 Workload">
        <div class="chart-section">
          <Card class="mb-4">
            <template #content>
              <div class="chart-header">
                <h3>Workload รายบุคคล (ชั่วโมง/เดือน)</h3>
                <Dropdown v-model="workloadMonth" :options="monthOptions" optionLabel="label" optionValue="value" class="month-filter" />
              </div>
              <div class="chart-container" style="height: 400px;">
                <canvas ref="workloadChart"></canvas>
              </div>
            </template>
          </Card>

          <Card>
            <template #content>
              <h3>Workload รายทีม/แผนก</h3>
              <div class="chart-container" style="height: 350px;">
                <canvas ref="teamWorkloadChart"></canvas>
              </div>
            </template>
          </Card>
        </div>
      </TabPanel>

      <!-- Tab 2: Leave Statistics -->
      <TabPanel header="📅 สถิติการลา">
        <div class="chart-section">
          <div class="stats-grid mb-4">
            <Card v-for="(stat, key) in leaveStats" :key="key" class="stat-card">
              <template #content>
                <div class="stat-content">
                  <i :class="stat.icon" :style="{ color: stat.color }"></i>
                  <div>
                    <h3>{{ stat.value }}</h3>
                    <p>{{ stat.label }}</p>
                  </div>
                </div>
              </template>
            </Card>
          </div>

          <Card class="mb-4">
            <template #content>
              <h3>สถิติการลารายเดือน ปี {{ selectedYear }}</h3>
              <div class="chart-container" style="height: 350px;">
                <canvas ref="monthlyLeaveChart"></canvas>
              </div>
            </template>
          </Card>

          <Card>
            <template #content>
              <h3>สัดส่วนประเภทการลา</h3>
              <div class="chart-row">
                <div class="chart-container" style="height: 300px; flex: 1;">
                  <canvas ref="leaveTypeChart"></canvas>
                </div>
                <div class="leave-type-legend">
                  <div v-for="(data, type) in leaveByType" :key="type" class="legend-item">
                    <span class="legend-color" :style="{ backgroundColor: leaveTypeColors[type] || '#6c757d' }"></span>
                    <span class="legend-label">{{ type }}</span>
                    <span class="legend-value">{{ data.days }} วัน ({{ data.count }} ครั้ง)</span>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </TabPanel>

      <!-- Tab 3: Gantt Chart -->
      <TabPanel header="📈 Project Timeline">
        <Card>
          <template #content>
            <div class="gantt-header">
              <h3>Project Timeline (Gantt Chart)</h3>
              <div class="gantt-controls">
                <Dropdown v-model="ganttFilter" :options="ganttFilterOptions" optionLabel="label" optionValue="value" />
              </div>
            </div>
            <div class="gantt-container" ref="ganttContainer">
              <div class="gantt-timeline">
                <div class="gantt-months">
                  <div v-for="month in visibleMonths" :key="month.key" class="gantt-month" :style="{ width: month.width + 'px' }">
                    {{ month.label }}
                  </div>
                </div>
                <div class="gantt-grid">
                  <div v-for="month in visibleMonths" :key="'g-'+month.key" class="gantt-grid-col" :style="{ width: month.width + 'px' }"></div>
                </div>
              </div>
              <div class="gantt-tasks">
                <div v-for="task in ganttTasks" :key="task.id" class="gantt-row">
                  <div class="gantt-task-name" :title="task.name">{{ task.name }}</div>
                  <div class="gantt-task-bar-container">
                    <div class="gantt-task-bar" 
                         :style="{ left: task.left + 'px', width: task.width + 'px', backgroundColor: task.color }"
                         :title="`${task.startDate} - ${task.endDate}`">
                      <span class="gantt-progress" :style="{ width: task.progress + '%' }"></span>
                    </div>
                  </div>
                </div>
                <div v-if="ganttTasks.length === 0" class="no-data">ไม่มีโครงการที่มีกำหนดเวลา</div>
              </div>
            </div>
          </template>
        </Card>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Chart } from 'chart.js/auto'
import axios from '@/utils/axiosConfig'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleError } = useErrorHandler()

// Filters
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const selectedDepartment = ref(null)
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)
const departmentOptions = ref([])
const activeTab = ref(0)

// Workload
const workloadMonth = ref(new Date().getMonth())
const monthOptions = [
  { label: 'มกราคม', value: 0 }, { label: 'กุมภาพันธ์', value: 1 }, { label: 'มีนาคม', value: 2 },
  { label: 'เมษายน', value: 3 }, { label: 'พฤษภาคม', value: 4 }, { label: 'มิถุนายน', value: 5 },
  { label: 'กรกฎาคม', value: 6 }, { label: 'สิงหาคม', value: 7 }, { label: 'กันยายน', value: 8 },
  { label: 'ตุลาคม', value: 9 }, { label: 'พฤศจิกายน', value: 10 }, { label: 'ธันวาคม', value: 11 }
]

// Data
const users = ref([])
const dailyWork = ref([])
const leaves = ref([])
const tasks = ref([])
const leaveTypeColors = ref({})

// Charts
const workloadChart = ref(null)
const teamWorkloadChart = ref(null)
const monthlyLeaveChart = ref(null)
const leaveTypeChart = ref(null)
let charts = {}

// Gantt
const ganttFilter = ref('active')
const ganttFilterOptions = [
  { label: 'กำลังดำเนินการ', value: 'active' },
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'เสร็จสิ้น', value: 'completed' }
]
const ganttContainer = ref(null)

// Computed
const filteredUsers = computed(() => {
  if (!selectedDepartment.value) return users.value
  return users.value.filter(u => u.department === selectedDepartment.value)
})

const filteredDailyWork = computed(() => {
  const userIds = new Set(filteredUsers.value.map(u => u.id))
  return dailyWork.value.filter(w => {
    const workYear = new Date(w.work_date).getFullYear()
    return workYear === selectedYear.value && userIds.has(w.user_id)
  })
})

const filteredLeaves = computed(() => {
  const userIds = new Set(filteredUsers.value.map(u => u.id))
  return leaves.value.filter(l => {
    if (l.status !== 'approved') return false
    const leaveYear = new Date(l.start_datetime).getFullYear()
    return leaveYear === selectedYear.value && userIds.has(l.user_id)
  })
})

const leaveStats = computed(() => {
  const total = filteredLeaves.value.reduce((sum, l) => sum + (parseFloat(l.total_days) || 0), 0)
  const count = filteredLeaves.value.length
  const avgPerPerson = filteredUsers.value.length > 0 ? (total / filteredUsers.value.length).toFixed(1) : 0
  
  return {
    total: { value: total.toFixed(1) + ' วัน', label: 'วันลาทั้งหมด', icon: 'pi pi-calendar', color: '#4A90E2' },
    count: { value: count + ' ครั้ง', label: 'จำนวนครั้งที่ลา', icon: 'pi pi-list', color: '#f59e0b' },
    avg: { value: avgPerPerson + ' วัน', label: 'เฉลี่ยต่อคน', icon: 'pi pi-user', color: '#10b981' },
    people: { value: new Set(filteredLeaves.value.map(l => l.user_id)).size + ' คน', label: 'พนักงานที่ลา', icon: 'pi pi-users', color: '#8b5cf6' }
  }
})

const leaveByType = computed(() => {
  const data = {}
  filteredLeaves.value.forEach(l => {
    const type = l.leave_type || 'อื่นๆ'
    if (!data[type]) data[type] = { days: 0, count: 0 }
    data[type].days += parseFloat(l.total_days) || 0
    data[type].count++
  })
  Object.keys(data).forEach(k => { data[k].days = parseFloat(data[k].days.toFixed(1)) })
  return data
})

// Gantt computed
const visibleMonths = computed(() => {
  const months = []
  const width = 80 // px per month
  for (let i = 0; i < 12; i++) {
    months.push({
      key: i,
      label: monthOptions[i].label.substring(0, 3),
      width,
      start: new Date(selectedYear.value, i, 1),
      end: new Date(selectedYear.value, i + 1, 0)
    })
  }
  return months
})

const ganttTasks = computed(() => {
  const yearStart = new Date(selectedYear.value, 0, 1)
  const yearEnd = new Date(selectedYear.value, 11, 31)
  const totalDays = (yearEnd - yearStart) / (1000 * 60 * 60 * 24)
  const containerWidth = 80 * 12 // 12 months

  return tasks.value
    .filter(t => {
      if (!t.project_start_date && !t.project_end_date) return false
      if (ganttFilter.value === 'active') return t.status !== 'completed' && t.status !== 'cancelled'
      if (ganttFilter.value === 'completed') return t.status === 'completed'
      return true
    })
    .map(t => {
      const start = t.project_start_date ? new Date(t.project_start_date) : new Date(t.created_at)
      const end = t.project_end_date ? new Date(t.project_end_date) : new Date()
      
      const startDay = Math.max(0, (start - yearStart) / (1000 * 60 * 60 * 24))
      const endDay = Math.min(totalDays, (end - yearStart) / (1000 * 60 * 60 * 24))
      
      const left = (startDay / totalDays) * containerWidth
      const width = Math.max(20, ((endDay - startDay) / totalDays) * containerWidth)
      
      const progress = t.status === 'completed' ? 100 : (t.progress || 0)
      const color = t.status === 'completed' ? '#10b981' : t.status === 'cancelled' ? '#ef4444' : '#4A90E2'

      return {
        id: t.id,
        name: t.task_name || t.so_number || 'ไม่ระบุ',
        left, width, progress, color,
        startDate: start.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }),
        endDate: end.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })
      }
    })
    .slice(0, 30) // Limit to 30 tasks
})

// Methods
const loadData = async () => {
  try {
    const [usersRes, workRes, leavesRes, tasksRes, leaveTypesRes] = await Promise.all([
      axios.get('/api/users'),
      axios.get('/api/daily-work'),
      axios.get('/api/leave'),
      axios.get('/api/tasks'),
      axios.get('/api/leave/leave-types')
    ])

    users.value = usersRes.data.filter(u => u.status === 'active')
    dailyWork.value = workRes.data
    leaves.value = leavesRes.data
    tasks.value = tasksRes.data

    // Department options
    const depts = [...new Set(users.value.map(u => u.department).filter(Boolean))]
    departmentOptions.value = depts.map(d => ({ label: d, value: d }))

    // Leave type colors
    leaveTypesRes.data.forEach(t => { leaveTypeColors.value[t.value] = t.color })

    await nextTick()
    renderCharts()
  } catch (error) {
    handleError(error, { customMessage: 'ไม่สามารถโหลดข้อมูลได้' })
  }
}

const parseTime = (timeStr) => {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h + (m || 0) / 60
}

const calcHours = (start, end) => {
  const s = parseTime(start), e = parseTime(end)
  let h = e - s
  if (s < 13 && e > 12) h -= 1 // lunch break
  return Math.max(0, h)
}

const renderCharts = () => {
  renderWorkloadChart()
  renderTeamWorkloadChart()
  renderMonthlyLeaveChart()
  renderLeaveTypeChart()
}

const renderWorkloadChart = () => {
  if (charts.workload) charts.workload.destroy()
  if (!workloadChart.value) return

  const monthData = {}
  filteredDailyWork.value.forEach(w => {
    const d = new Date(w.work_date)
    if (d.getMonth() !== workloadMonth.value) return
    const user = users.value.find(u => u.id === w.user_id)
    if (!user) return
    const name = `${user.firstname} ${user.lastname}`
    monthData[name] = (monthData[name] || 0) + calcHours(w.start_time, w.end_time)
  })

  const sorted = Object.entries(monthData).sort((a, b) => b[1] - a[1]).slice(0, 15)

  charts.workload = new Chart(workloadChart.value, {
    type: 'bar',
    data: {
      labels: sorted.map(([n]) => n),
      datasets: [{
        label: 'ชั่วโมงทำงาน',
        data: sorted.map(([, h]) => h.toFixed(1)),
        backgroundColor: '#4A90E2'
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  })
}

const renderTeamWorkloadChart = () => {
  if (charts.teamWorkload) charts.teamWorkload.destroy()
  if (!teamWorkloadChart.value) return

  const deptData = {}
  filteredDailyWork.value.forEach(w => {
    const user = users.value.find(u => u.id === w.user_id)
    if (!user?.department) return
    deptData[user.department] = (deptData[user.department] || 0) + calcHours(w.start_time, w.end_time)
  })

  const labels = Object.keys(deptData)
  const colors = ['#4A90E2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

  charts.teamWorkload = new Chart(teamWorkloadChart.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: Object.values(deptData).map(h => h.toFixed(1)), backgroundColor: colors }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right' } }
    }
  })
}

const renderMonthlyLeaveChart = () => {
  if (charts.monthlyLeave) charts.monthlyLeave.destroy()
  if (!monthlyLeaveChart.value) return

  const monthlyData = Array(12).fill(0)
  filteredLeaves.value.forEach(l => {
    const month = new Date(l.start_datetime).getMonth()
    monthlyData[month] += parseFloat(l.total_days) || 0
  })

  charts.monthlyLeave = new Chart(monthlyLeaveChart.value, {
    type: 'bar',
    data: {
      labels: monthOptions.map(m => m.label),
      datasets: [{
        label: 'วันลา',
        data: monthlyData.map(d => d.toFixed(1)),
        backgroundColor: '#f59e0b'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  })
}

const renderLeaveTypeChart = () => {
  if (charts.leaveType) charts.leaveType.destroy()
  if (!leaveTypeChart.value) return

  const types = Object.keys(leaveByType.value)
  const data = types.map(t => leaveByType.value[t].days)
  const colors = types.map(t => leaveTypeColors.value[t] || '#6c757d')

  charts.leaveType = new Chart(leaveTypeChart.value, {
    type: 'pie',
    data: {
      labels: types,
      datasets: [{ data, backgroundColor: colors }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  })
}

// Watchers
watch([selectedYear, selectedDepartment], () => { 
  nextTick(renderCharts) 
})
watch(workloadMonth, () => { 
  nextTick(renderWorkloadChart) 
})
watch(activeTab, (newTab) => { 
  nextTick(() => {
    if (newTab === 0) {
      renderWorkloadChart()
      renderTeamWorkloadChart()
    } else if (newTab === 1) {
      renderMonthlyLeaveChart()
      renderLeaveTypeChart()
    }
  })
})
watch(ganttFilter, () => {
  // ganttTasks is computed, will auto update
})

onMounted(loadData)
</script>

<style scoped>
.analytics-container { padding: 1rem; }

/* Header - เหมือน Dashboard */
.header-card { 
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
}
.header-card :deep(.p-card-content) { padding: 1rem 1.5rem; }
.header-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.header-title { display: flex; align-items: center; gap: 0.75rem; }
.header-title h1 { margin: 0; color: #fff; font-size: 1.5rem; font-weight: 600; }
.header-icon { font-size: 1.75rem; color: #fff; }
.back-btn { color: #fff !important; }
.back-btn:hover { background: rgba(255,255,255,0.1) !important; }
.header-right { display: flex; gap: 0.75rem; align-items: center; }

/* Filters */
.year-filter, .dept-filter, .month-filter { 
  min-width: 130px; 
  background: rgba(255,255,255,0.95);
  border-radius: 8px;
}

/* Tab styling */
:deep(.p-tabview) { background: transparent; }
:deep(.p-tabview-nav) { 
  background: #f8f9fa; 
  border-radius: 8px 8px 0 0;
  padding: 0.5rem 0.5rem 0;
  border: none;
}
:deep(.p-tabview-nav-link) { 
  border-radius: 8px 8px 0 0 !important;
  font-weight: 500;
}
:deep(.p-tabview-panels) { 
  background: #fff; 
  border-radius: 0 0 8px 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  border-top: none;
}

/* Stats Cards */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.stat-card { 
  border-radius: 12px; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
.stat-card .stat-content { display: flex; align-items: center; gap: 1rem; padding: 0.5rem; }
.stat-content i { font-size: 2.5rem; opacity: 0.9; }
.stat-content h3 { margin: 0; font-size: 1.75rem; font-weight: 700; color: #1a1a2e; }
.stat-content p { margin: 0.25rem 0 0; color: #6c757d; font-size: 0.875rem; }

/* Charts */
.chart-section h3 { color: #1a1a2e; font-weight: 600; margin-bottom: 1rem; }
.chart-container { position: relative; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
.chart-header h3 { margin: 0; color: #1a1a2e; }
.chart-row { display: flex; gap: 2rem; align-items: flex-start; }

/* Legend */
.leave-type-legend { min-width: 220px; background: #f8f9fa; border-radius: 8px; padding: 1rem; }
.legend-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0; border-bottom: 1px solid #e9ecef; }
.legend-item:last-child { border-bottom: none; }
.legend-color { width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0; }
.legend-label { flex: 1; font-weight: 500; color: #333; }
.legend-value { color: #6c757d; font-size: 0.8rem; }

/* Gantt */
.gantt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
.gantt-header h3 { margin: 0; color: #1a1a2e; }
.gantt-container { overflow-x: auto; border: 1px solid #e9ecef; border-radius: 8px; background: #fff; }
.gantt-timeline { position: sticky; top: 0; background: linear-gradient(135deg, #f8f9fa, #e9ecef); z-index: 1; }
.gantt-months { display: flex; border-bottom: 2px solid #dee2e6; }
.gantt-month { padding: 0.75rem 0.5rem; text-align: center; font-weight: 600; font-size: 0.75rem; border-right: 1px solid #dee2e6; color: #495057; }
.gantt-grid { display: flex; position: absolute; top: 0; left: 200px; right: 0; bottom: 0; pointer-events: none; }
.gantt-grid-col { border-right: 1px dashed #e9ecef; }
.gantt-tasks { min-height: 200px; }
.gantt-row { display: flex; align-items: center; border-bottom: 1px solid #f0f0f0; height: 44px; }
.gantt-row:hover { background: #f8f9fa; }
.gantt-task-name { 
  width: 200px; min-width: 200px; padding: 0 1rem; 
  font-size: 0.875rem; font-weight: 500; color: #333;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
  background: #fff; border-right: 1px solid #dee2e6; 
}
.gantt-task-bar-container { flex: 1; position: relative; height: 100%; min-width: 960px; }
.gantt-task-bar { 
  position: absolute; top: 10px; height: 24px; border-radius: 6px; 
  display: flex; align-items: center; overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
}
.gantt-progress { height: 100%; background: rgba(255,255,255,0.3); }
.no-data { padding: 3rem; text-align: center; color: #6c757d; font-size: 1rem; }

/* Cards */
:deep(.p-card) { border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

/* Responsive */
@media (max-width: 992px) {
  .chart-row { flex-direction: column; }
  .leave-type-legend { width: 100%; }
}

@media (max-width: 768px) {
  .analytics-container { padding: 0.5rem; }
  .header-content { flex-direction: column; align-items: stretch; }
  .header-left { justify-content: flex-start; }
  .header-right { flex-wrap: wrap; }
  .header-title h1 { font-size: 1.25rem; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .stat-content h3 { font-size: 1.25rem; }
  .stat-content i { font-size: 1.75rem; }
  .gantt-task-name { width: 120px; min-width: 120px; font-size: 0.75rem; padding: 0 0.5rem; }
  .gantt-task-bar-container { min-width: 720px; }
  .year-filter, .dept-filter, .month-filter { min-width: 100px; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
  .header-title h1 { font-size: 1.1rem; }
}
</style>
