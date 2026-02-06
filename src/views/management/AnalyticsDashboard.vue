<template>
  <div class="analytics-container">
    <Toast />
    
    <!-- Header -->
    <Card class="header-card mb-4">
      <template #content>
        <div class="header-content">
          <div class="header-left">
            <Button icon="pi pi-arrow-left" @click="$router.go(-1)" text rounded class="back-btn" v-tooltip.bottom="'ย้อนกลับ'" />
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
          <!-- Workload Stats -->
          <div class="stats-grid mb-4">
            <Card class="stat-card">
              <template #content>
                <div class="stat-content">
                  <i class="pi pi-clock" style="color: #4A90E2"></i>
                  <div>
                    <h3>{{ workloadStats.totalHours }}</h3>
                    <p>ชั่วโมงทำงานรวม</p>
                  </div>
                </div>
              </template>
            </Card>
            <Card class="stat-card">
              <template #content>
                <div class="stat-content">
                  <i class="pi pi-users" style="color: #10b981"></i>
                  <div>
                    <h3>{{ workloadStats.activeUsers }}</h3>
                    <p>พนักงานที่บันทึกงาน</p>
                  </div>
                </div>
              </template>
            </Card>
            <Card class="stat-card">
              <template #content>
                <div class="stat-content">
                  <i class="pi pi-chart-bar" style="color: #f59e0b"></i>
                  <div>
                    <h3>{{ workloadStats.avgHours }}</h3>
                    <p>เฉลี่ยต่อคน/เดือน</p>
                  </div>
                </div>
              </template>
            </Card>
            <Card class="stat-card">
              <template #content>
                <div class="stat-content">
                  <i class="pi pi-calendar" style="color: #8b5cf6"></i>
                  <div>
                    <h3>{{ workloadStats.workDays }}</h3>
                    <p>วันทำงานรวม</p>
                  </div>
                </div>
              </template>
            </Card>
          </div>

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
            <Card v-for="(stat, key) in leaveStats" :key="key" class="stat-card" @click="showLeaveDetail()" style="cursor: pointer;">
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

          <!-- Leave Detail Table -->
          <Card v-if="showLeaveTable" class="mb-4">
            <template #content>
              <div class="leave-detail-header">
                <h3><i class="pi pi-list"></i> รายละเอียดการลา</h3>
                <Button icon="pi pi-times" text rounded @click="showLeaveTable = false" />
              </div>
              <DataTable :value="leaveDetailList" :paginator="true" :rows="10" class="leave-detail-table">
                <Column field="employee_name" header="พนักงาน" sortable />
                <Column field="leave_type" header="ประเภท" sortable>
                  <template #body="{ data }">
                    <span class="leave-badge" :style="{ background: (leaveTypeColors[data.leave_type] || '#6c757d') + '20', color: leaveTypeColors[data.leave_type] || '#6c757d' }">
                      {{ data.leave_type }}
                    </span>
                  </template>
                </Column>
                <Column header="วันที่" sortable>
                  <template #body="{ data }">
                    {{ formatLeaveDate(data.start_datetime) }} - {{ formatLeaveDate(data.end_datetime) }}
                  </template>
                </Column>
                <Column field="total_days" header="จำนวนวัน" sortable />
                <Column field="reason" header="เหตุผล">
                  <template #body="{ data }">
                    <span :title="data.reason">{{ (data.reason || '-').substring(0, 30) }}{{ data.reason?.length > 30 ? '...' : '' }}</span>
                  </template>
                </Column>
              </DataTable>
            </template>
          </Card>

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
                  <div v-for="(data, type) in leaveByType" :key="type" class="legend-item" @click="filterLeaveByType(type)" style="cursor: pointer;">
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

    </TabView>
    
    <!-- Task Name Tooltip -->
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

// Tooltip

// Leave Detail
const showLeaveTable = ref(false)
const leaveFilterType = ref(null)

// Charts
const workloadChart = ref(null)
const teamWorkloadChart = ref(null)
const monthlyLeaveChart = ref(null)
const leaveTypeChart = ref(null)
let charts = {}

// Gantt

// Helper functions
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

// Computed
const filteredUsers = computed(() => {
  if (!selectedDepartment.value) return users.value
  return users.value.filter(u => u.department === selectedDepartment.value)
})

const filteredDailyWork = computed(() => {
  const userIds = new Set(filteredUsers.value.map(u => u.id))
  const filtered = dailyWork.value.filter(w => {
    const workYear = new Date(w.work_date).getFullYear()
    return workYear === selectedYear.value && userIds.has(w.user_id)
  })
  console.log('filteredDailyWork:', filtered.length, 'selectedYear:', selectedYear.value, 'total:', dailyWork.value.length)
  return filtered
})

const filteredLeaves = computed(() => {
  const userIds = new Set(filteredUsers.value.map(u => u.id))
  const filtered = leaves.value.filter(l => {
    if (l.status !== 'approved') return false
    const leaveYear = new Date(l.start_datetime).getFullYear()
    return leaveYear === selectedYear.value && userIds.has(l.user_id)
  })
  console.log('filteredLeaves:', filtered.length, 'total leaves:', leaves.value.length)
  return filtered
})

// Workload Stats
const workloadStats = computed(() => {
  let totalHours = 0
  const userSet = new Set()
  const daySet = new Set()
  
  filteredDailyWork.value.forEach(w => {
    totalHours += calcHours(w.start_time, w.end_time)
    userSet.add(w.user_id)
    daySet.add(w.work_date)
  })
  
  const avgHours = userSet.size > 0 ? (totalHours / userSet.size / 12).toFixed(1) : '0'
  
  return {
    totalHours: totalHours.toFixed(0) + ' ชม.',
    activeUsers: userSet.size + ' คน',
    avgHours: avgHours + ' ชม.',
    workDays: daySet.size + ' วัน'
  }
})

// Workload chart data
const workloadChartData = computed(() => {
  const monthData = {}
  filteredDailyWork.value.forEach(w => {
    const d = new Date(w.work_date)
    if (d.getMonth() !== workloadMonth.value) return
    const user = users.value.find(u => u.id === w.user_id)
    if (!user) return
    const name = `${user.firstname} ${user.lastname}`
    monthData[name] = (monthData[name] || 0) + calcHours(w.start_time, w.end_time)
  })
  return Object.entries(monthData).sort((a, b) => b[1] - a[1]).slice(0, 15)
})

// Team workload data
const teamWorkloadData = computed(() => {
  const deptData = {}
  filteredDailyWork.value.forEach(w => {
    const user = users.value.find(u => u.id === w.user_id)
    if (!user?.department) return
    deptData[user.department] = (deptData[user.department] || 0) + calcHours(w.start_time, w.end_time)
  })
  return Object.entries(deptData)
})

// Has leave data
const hasLeaveData = computed(() => filteredLeaves.value.length > 0)

const leaveDetailList = computed(() => {
  let list = filteredLeaves.value.map(l => ({
    ...l,
    employee_name: users.value.find(u => u.id === l.user_id)?.firstname + ' ' + users.value.find(u => u.id === l.user_id)?.lastname || 'ไม่ระบุ'
  }))
  if (leaveFilterType.value) {
    list = list.filter(l => l.leave_type === leaveFilterType.value)
  }
  return list.sort((a, b) => new Date(b.start_datetime) - new Date(a.start_datetime))
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

    users.value = usersRes.data // ไม่ filter status เพราะอาจไม่มี field นี้
    dailyWork.value = workRes.data
    leaves.value = leavesRes.data
    tasks.value = tasksRes.data

    console.log('Loaded data:', {
      users: users.value.length,
      dailyWork: dailyWork.value.length,
      leaves: leaves.value.length,
      tasks: tasks.value.length
    })

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

const showLeaveDetail = () => {
  leaveFilterType.value = null
  showLeaveTable.value = true
}

const filterLeaveByType = (type) => {
  leaveFilterType.value = type
  showLeaveTable.value = true
}

const formatLeaveDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })
}

const renderCharts = () => {
  renderWorkloadChart()
  renderTeamWorkloadChart()
  renderMonthlyLeaveChart()
  renderLeaveTypeChart()
}

const renderWorkloadChart = () => {
  if (charts.workload) charts.workload.destroy()
  if (!workloadChart.value || workloadChartData.value.length === 0) return

  charts.workload = new Chart(workloadChart.value, {
    type: 'bar',
    data: {
      labels: workloadChartData.value.map(([n]) => n),
      datasets: [{
        label: 'ชั่วโมงทำงาน',
        data: workloadChartData.value.map(([, h]) => h.toFixed(1)),
        backgroundColor: '#4A90E2',
        borderRadius: 4
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
  if (!teamWorkloadChart.value || teamWorkloadData.value.length === 0) return

  const labels = teamWorkloadData.value.map(([d]) => d)
  const data = teamWorkloadData.value.map(([, h]) => h.toFixed(1))
  const colors = ['#4A90E2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

  charts.teamWorkload = new Chart(teamWorkloadChart.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors }]
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
  if (!monthlyLeaveChart.value || !hasLeaveData.value) return

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
onMounted(loadData)
</script>

<style scoped>
.analytics-container { padding: 0.6rem 1rem; background: #e5e7eb; min-height: 100%; }

/* Header - เหมือน ManagementView */
.header-card { 
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
.header-card :deep(.p-card-content) { padding: 0; }
.header-card :deep(.p-card-body) { padding: 1.05rem; }
.header-content { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1rem; }
.header-left { display: flex; align-items: center; gap: 0.75rem; }
.header-title { display: flex; align-items: center; gap: 0.75rem; }
.header-title h1 { margin: 0; color: #fff; font-size: 1.25rem; font-weight: 600; }
.header-icon { font-size: 1.25rem; color: #fff; }
.back-btn { 
  color: #fff !important; 
  width: 2rem !important;
  height: 2rem !important;
  background: rgba(255, 255, 255, 0.15) !important;
}
.back-btn:hover { background: rgba(255,255,255,0.3) !important; }
.header-right { display: flex; gap: 0.75rem; align-items: center; }

/* Filters */
.year-filter, .dept-filter, .month-filter { 
  min-width: 120px; 
  background: rgba(255,255,255,0.9);
  border-radius: 6px;
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
.legend-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0; border-bottom: 1px solid #e9ecef; transition: background 0.2s; }
.legend-item:hover { background: #e9ecef; margin: 0 -0.5rem; padding-left: 0.5rem; padding-right: 0.5rem; border-radius: 4px; }
.legend-item:last-child { border-bottom: none; }
.legend-color { width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0; }
.legend-label { flex: 1; font-weight: 500; color: #333; }
.legend-value { color: #6c757d; font-size: 0.8rem; }

/* Leave Detail */
.leave-detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.leave-detail-header h3 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
.leave-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 500; }
.leave-detail-table { font-size: 0.875rem; }

/* Gantt */



.task-info { display: flex; flex-direction: column; gap: 0.125rem; overflow: hidden; }
.task-name { font-size: 0.875rem; font-weight: 500; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.task-name:hover { color: #4A90E2; text-decoration: underline; }
.task-dates { font-size: 0.7rem; color: #6c757d; }

  position: absolute; height: 28px; border-radius: 6px; 
  display: flex; align-items: center; overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  transition: transform 0.2s;
}
.bar-progress { height: 100%; background: rgba(255,255,255,0.25); }

/* Task Tooltip */
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  padding: 0.75rem 1rem;
  max-width: 350px;
  min-width: 200px;
}
  position: absolute;
  top: 4px;
  right: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
  padding: 0.25rem;
  border-radius: 4px;
}

.no-data { padding: 3rem; text-align: center; color: #6c757d; }
.no-data i { font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.5; }
.no-data p { margin: 0; font-size: 1rem; }

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
  .year-filter, .dept-filter, .month-filter { min-width: 100px; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
  .header-title h1 { font-size: 1.1rem; }
}
</style>
