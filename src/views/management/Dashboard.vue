<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="dashboard-container">
    <Toast />
    
    <!-- Header -->
    <Card class="header-card mb-4">
      <template #content>
        <div class="header-content">
          <div class="header-left">
            <Button icon="pi pi-arrow-left" @click="$router.go(-1)" text class="back-btn" />
            <div class="header-title">
              <i class="pi pi-chart-bar header-icon"></i>
              <h1>Dashboard</h1>
            </div>
          </div>
          <div class="header-right">
            <Dropdown v-model="selectedUser" :options="userOptions" optionLabel="label" optionValue="value"
                      placeholder="เลือกพนักงาน" class="user-filter" :showClear="true" @change="onUserChange" 
                      filter filterPlaceholder="ค้นหาชื่อพนักงาน" />
          </div>
        </div>
      </template>
    </Card>

    <!-- User Dashboard (when user selected) -->
    <template v-if="selectedUser">
      <Card class="mb-4">
        <template #content>
          <div class="user-dashboard-header">
            <h2><i class="pi pi-user"></i> {{ selectedUserName }}</h2>
            <Button label="ดูภาพรวมทั้งหมด" icon="pi pi-times" severity="secondary" size="small" @click="clearUserFilter" />
          </div>
        </template>
      </Card>

      <!-- User Leave Chart -->
      <Card class="mb-4">
        <template #content>
          <h3>สรุปการลาประจำปี {{ currentYear }}</h3>
          <div class="user-leave-summary">
            <div v-for="(days, type) in userLeaveData" :key="type" class="leave-item">
              <span class="leave-type" :style="{ backgroundColor: leaveTypeColors[type] || '#6c757d' }">{{ type }}</span>
              <span class="leave-days">{{ days }} วัน</span>
            </div>
            <div v-if="Object.keys(userLeaveData).length === 0" class="no-data">ไม่มีข้อมูลการลา</div>
          </div>
          <div class="chart-container" style="height: 250px;">
            <canvas ref="userLeaveChart"></canvas>
          </div>
        </template>
      </Card>

      <!-- User Timesheet -->
      <Card class="mb-4">
        <template #content>
          <h3>Timesheet ประจำปี {{ currentYear }}</h3>
          <div class="timesheet-summary">
            <div class="summary-item">
              <i class="pi pi-clock" style="color: #4A90E2"></i>
              <div>
                <h4>{{ formatHoursMinutes(userTimesheetSummary.totalHours) }}</h4>
                <p>ชั่วโมงทำงานรวม</p>
              </div>
            </div>
            <div class="summary-item">
              <i class="pi pi-briefcase" style="color: #10b981"></i>
              <div>
                <h4>{{ userTimesheetSummary.totalTasks }}</h4>
                <p>จำนวนงานทั้งหมด</p>
              </div>
            </div>
            <div class="summary-item">
              <i class="pi pi-folder" style="color: #8b5cf6"></i>
              <div>
                <h4>{{ userTimesheetSummary.totalProjects }}</h4>
                <p>โครงการที่ทำ</p>
              </div>
            </div>
          </div>
          
          <div class="timesheet-filter mt-4">
            <label>ช่วงเวลา:</label>
            <Dropdown v-model="timesheetPeriod" :options="periodOptions" optionLabel="label" optionValue="value" class="period-dropdown" />
          </div>

          <h4 class="mt-3">Timesheet รายวัน</h4>
          <DataTable :value="userTimesheetDaily" paginator :rows="15" sortField="work_date" :sortOrder="-1">
            <Column field="work_date" header="วันที่" sortable style="min-width: 120px">
              <template #body="{ data }">
                {{ formatDate(data.work_date) }}
              </template>
            </Column>
            <Column field="task_name" header="งาน/โครงการ" sortable style="min-width: 200px" />
            <Column field="category" header="หมวดหมู่" style="min-width: 120px">
              <template #body="{ data }">
                <div class="category-badges-small">
                  <span v-for="cat in parseCategoryArray(data.category)" :key="cat" class="cat-badge">{{ cat }}</span>
                </div>
              </template>
            </Column>
            <Column field="work_status" header="สถานะ" style="min-width: 100px">
              <template #body="{ data }">
                <Badge :value="data.work_status || '-'" :severity="getStatusSeverity(data.work_status)" />
              </template>
            </Column>
            <Column field="location" header="สถานที่" style="min-width: 120px" />
            <Column field="start_time" header="เริ่ม" style="min-width: 70px" />
            <Column field="end_time" header="สิ้นสุด" style="min-width: 70px" />
            <Column field="hours" header="ชั่วโมง" sortable style="min-width: 100px">
              <template #body="{ data }">
                <span style="font-weight: 600; color: #10b981">{{ formatHoursMinutes(data.hours) }}</span>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </template>

    <!-- Overall Dashboard (when no user selected) -->
    <template v-else>
    <!-- Summary Cards -->
    <div class="summary-grid mb-4">
      <!-- Loading Skeleton -->
      <template v-if="loading">
        <Card v-for="i in 8" :key="i" class="summary-card">
          <template #content>
            <div class="summary-content">
              <div class="skeleton skeleton-icon"></div>
              <div class="summary-info">
                <div class="skeleton skeleton-text" style="width: 60px; height: 32px;"></div>
                <div class="skeleton skeleton-text" style="width: 120px; height: 16px; margin-top: 8px;"></div>
              </div>
            </div>
          </template>
        </Card>
      </template>
      
      <!-- Actual Data -->
      <template v-else>
        <Card class="summary-card">
        <template #content>
          <div class="summary-content">
            <i class="pi pi-users summary-icon" style="color: #4A90E2"></i>
            <div class="summary-info">
              <h3>{{ stats.totalUsers }}</h3>
              <p>ผู้ใช้งานทั้งหมด</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="summary-card">
        <template #content>
          <div class="summary-content">
            <i class="pi pi-user-plus summary-icon" style="color: #10b981"></i>
            <div class="summary-info">
              <h3>{{ stats.workingToday }}</h3>
              <p>พนักงานทำงานวันนี้</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="summary-card">
        <template #content>
          <div class="summary-content">
            <i class="pi pi-calendar-times summary-icon" style="color: #f59e0b"></i>
            <div class="summary-info">
              <h3>{{ stats.todayLeaves }}</h3>
              <p>ลางานวันนี้</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="summary-card">
        <template #content>
          <div class="summary-content">
            <i class="pi pi-car summary-icon" style="color: #06b6d4"></i>
            <div class="summary-info">
              <h3>{{ stats.activeCars }}</h3>
              <p>รถกำลังใช้งาน</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="summary-card">
        <template #content>
          <div class="summary-content">
            <i class="pi pi-clock summary-icon" style="color: #3b82f6"></i>
            <div class="summary-info">
              <h3>{{ stats.dueSoon }}</h3>
              <p>โครงการครบกำหนดสัปดาห์นี้</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="summary-card">
        <template #content>
          <div class="summary-content">
            <i class="pi pi-exclamation-triangle summary-icon" style="color: #ef4444"></i>
            <div class="summary-info">
              <h3>{{ stats.overdue }}</h3>
              <p>โครงการที่พ้นกําหนดระยะเวลาตามสัญญา</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="summary-card">
        <template #content>
          <div class="summary-content">
            <i class="pi pi-briefcase summary-icon" style="color: #8b5cf6"></i>
            <div class="summary-info">
              <h3>{{ stats.activeTasks }}</h3>
              <p>โครงการที่กำลังดำเนินการ</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="summary-card">
        <template #content>
          <div class="summary-content">
            <i class="pi pi-check-circle summary-icon" style="color: #22c55e"></i>
            <div class="summary-info">
              <h3>{{ stats.completedTasks }}</h3>
              <p>โครงการเสร็จสิ้น</p>
            </div>
          </div>
        </template>
      </Card>
      </template>
    </div>

    <!-- Charts with Swipe Support -->
    <div class="charts-container mb-4">
      <div class="charts-wrapper" 
           ref="chartsWrapper"
           @touchstart="handleTouchStart"
           @touchmove="handleTouchMove"
           @touchend="handleTouchEnd">
        <Card class="chart-card" :class="{ active: currentChart === 0 }">
          <template #content>
            <h3>จำนวนวันลาของพนักงาน (รายปี)</h3>
            <canvas ref="leaveChart"></canvas>
          </template>
        </Card>

        <Card class="chart-card" :class="{ active: currentChart === 1 }">
          <template #content>
            <h3>สถานะงาน</h3>
            <canvas ref="taskChart"></canvas>
          </template>
        </Card>
      </div>
      
      <!-- Chart Navigation Dots (Mobile) -->
      <div class="chart-dots">
        <span v-for="i in 2" :key="i" 
              :class="{ active: currentChart === i - 1 }"
              @click="currentChart = i - 1"></span>
      </div>
    </div>

    <!-- Work Statistics -->
    <Card>
      <template #content>
        <h3 class="mb-3">สถิติเวลาทำงานของพนักงาน (รายปี)</h3>
        <DataTable :value="workStatistics" :loading="loading" paginator :rows="10" sortField="totalHours" :sortOrder="-1"
                   :expandedRows="expandedRows">
          <Column :expander="true" style="width: 3rem" />
          <Column field="userName" header="ชื่อพนักงาน" sortable style="min-width: 150px">
            <template #body="{ data }">
              <span class="clickable-name" @click="selectedUserId = data.userId; showUserDialog = true">
                {{ data.userName }}
              </span>
            </template>
          </Column>
          <Column field="department" header="แผนก" sortable style="min-width: 120px" />
          <Column field="taskCount" header="จำนวนงาน" sortable style="min-width: 100px" />
          <Column field="totalHours" header="รวมชั่วโมง" sortable style="min-width: 120px">
            <template #body="{ data }">
              <span style="font-weight: 600; color: #4A90E2">{{ formatHoursMinutes(data.totalHours) }}</span>
            </template>
          </Column>
          <!-- <Column field="avgHoursPerTask" header="เฉลี่ย/งาน" sortable style="min-width: 100px">
            <template #body="{ data }">
              {{ data.avgHoursPerTask.toFixed(1) }} ชม.
            </template>
          </Column> -->
          
          <template #expansion="{ data }">
            <div class="task-breakdown">
              <h4>รายละเอียดงานทั้งหมด</h4>
              <DataTable :value="data.taskDetails" class="p-datatable-sm">
                <Column field="taskName" header="ชื่องาน" style="min-width: 200px" />
                <Column field="hours" header="ชั่วโมง" sortable>
                  <template #body="{ data: task }">
                    <span style="font-weight: 600; color: #10b981">{{ formatHoursMinutes(task.hours) }}</span>
                  </template>
                </Column>
                <Column field="percentage" header="สัดส่วน" sortable>
                  <template #body="{ data: task }">
                    <div style="display: flex; align-items: center; gap: 0.5rem">
                      <div style="flex: 1; background: #e9ecef; border-radius: 4px; height: 20px; overflow: hidden">
                        <div :style="{ width: task.percentage + '%', background: '#4A90E2', height: '100%' }"></div>
                      </div>
                      <span style="min-width: 50px; text-align: right">{{ task.percentage.toFixed(1) }}%</span>
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
    </template>
  </div>

  <UserInfoDialog v-if="showUserDialog" :visible="true" @update:visible="showUserDialog = false" :userId="selectedUserId" />
  
  <!-- Task Status Dialog -->
  <Dialog v-model:visible="showTaskStatusDialog" modal :header="'งานสถานะ: ' + selectedTaskStatus" :style="{ width: '90vw', maxWidth: '900px' }">
    <DataTable :value="filteredTasksByStatus" paginator :rows="10" sortField="task_name" :sortOrder="1">
      <Column field="task_name" header="ชื่องาน/โครงการ" sortable style="min-width: 200px" />
      <Column field="so_number" header="SO Number" sortable style="min-width: 120px" />
      <Column field="category" header="หมวดหมู่" style="min-width: 150px">
        <template #body="{ data }">
          <div class="category-badges-small">
            <span v-for="cat in parseCategoryArray(data.category)" :key="cat" class="cat-badge">{{ cat }}</span>
          </div>
        </template>
      </Column>
      <Column field="project_end_date" header="กำหนดส่ง" sortable style="min-width: 120px">
        <template #body="{ data }">
          {{ data.project_end_date ? formatDate(data.project_end_date) : '-' }}
        </template>
      </Column>
    </DataTable>
  </Dialog>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { Chart } from 'chart.js/auto'
import axios from '@/utils/axiosConfig'
import userService from '@/services/userService'
import dailyWorkService from '@/services/dailyWorkService'
import UserInfoDialog from '@/components/UserInfoDialog.vue'
import { isCompleted, isActive } from '@/utils/statusHelper'

const { handleError } = useErrorHandler()
const loading = ref(false)
const leaveTypeColors = ref({})
const showUserDialog = ref(false)
const selectedUserId = ref(null)

// Task status dialog
const allTasks = ref([])
const showTaskStatusDialog = ref(false)
const selectedTaskStatus = ref(null)

const filteredTasksByStatus = computed(() => {
  if (!selectedTaskStatus.value) return []
  return allTasks.value.filter(t => (t.status || 'pending') === selectedTaskStatus.value)
})

// User filter
const selectedUser = ref(null)
const userOptions = ref([])
const allLeaves = ref([])
const allDailyWork = ref([])
const currentYear = new Date().getFullYear()
const userLeaveChart = ref(null)
let userLeaveChartInstance = null

const selectedUserName = computed(() => {
  const user = userOptions.value.find(u => u.value === selectedUser.value)
  return user ? user.label : ''
})

// Period filter
const timesheetPeriod = ref('month')
const periodOptions = [
  { label: 'วันนี้', value: 'today' },
  { label: 'สัปดาห์นี้', value: 'week' },
  { label: 'เดือนนี้', value: 'month' },
  { label: 'ปีนี้', value: 'year' }
]

const getDateRange = () => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let startDate = today
  
  switch (timesheetPeriod.value) {
    case 'today':
      startDate = today
      break
    case 'week': {
      const dayOfWeek = today.getDay()
      startDate = new Date(today)
      startDate.setDate(today.getDate() - dayOfWeek)
      break
    }
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      break
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1)
      break
  }
  return { startDate, endDate: now }
}

const userLeaveData = computed(() => {
  if (!selectedUser.value) return {}
  const data = {}
  allLeaves.value.forEach(l => {
    if (l.user_id !== selectedUser.value || l.status !== 'approved') return
    const leaveYear = new Date(l.start_datetime).getFullYear()
    if (leaveYear !== currentYear) return
    const type = l.leave_type || 'อื่นๆ'
    data[type] = (data[type] || 0) + (parseFloat(l.total_days) || 0)
  })
  return data
})

const userTimesheetSummary = computed(() => {
  if (!selectedUser.value) return { totalHours: 0, totalTasks: 0, totalProjects: 0 }
  const { startDate, endDate } = getDateRange()
  let totalHours = 0
  let taskCount = 0
  const projects = new Set()
  
  allDailyWork.value.forEach(w => {
    if (w.user_id !== selectedUser.value) return
    const workDate = new Date(w.work_date)
    if (workDate < startDate || workDate > endDate) return
    
    if (w.start_time && w.end_time) {
      const [startH, startM] = w.start_time.split(':').map(Number)
      const [endH, endM] = w.end_time.split(':').map(Number)
      totalHours += (endH + endM/60) - (startH + startM/60)
    }
    taskCount++
    if (w.task_name) projects.add(w.task_name)
  })
  
  return { totalHours, totalTasks: taskCount, totalProjects: projects.size }
})

const userTimesheetDaily = computed(() => {
  if (!selectedUser.value) return []
  const { startDate, endDate } = getDateRange()
  
  return allDailyWork.value
    .filter(w => {
      if (w.user_id !== selectedUser.value) return false
      const workDate = new Date(w.work_date)
      return workDate >= startDate && workDate <= endDate
    })
    .map(w => {
      let hours = 0
      if (w.start_time && w.end_time) {
        const [startH, startM] = w.start_time.split(':').map(Number)
        const [endH, endM] = w.end_time.split(':').map(Number)
        hours = (endH + endM/60) - (startH + startM/60)
      }
      return { ...w, hours }
    })
    .sort((a, b) => new Date(b.work_date) - new Date(a.work_date))
})

const parseCategoryArray = (category) => {
  if (!category) return []
  if (Array.isArray(category)) return category
  return category.split(',').map(c => c.trim()).filter(c => c)
}

const getStatusSeverity = (status) => {
  const map = { 'completed': 'success', 'in_progress': 'info', 'pending': 'warning' }
  return map[status] || 'secondary'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}

const onUserChange = async () => {
  await nextTick()
  if (selectedUser.value) {
    renderUserLeaveChart()
  }
}

const clearUserFilter = () => {
  selectedUser.value = null
  loadData()
}

const renderUserLeaveChart = () => {
  if (userLeaveChartInstance) userLeaveChartInstance.destroy()
  if (!userLeaveChart.value || Object.keys(userLeaveData.value).length === 0) return
  
  const labels = Object.keys(userLeaveData.value)
  const data = Object.values(userLeaveData.value)
  const colors = labels.map(type => leaveTypeColors.value[type] || '#6c757d')
  
  userLeaveChartInstance = new Chart(userLeaveChart.value, {
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

// Swipe functionality
const currentChart = ref(0)
const chartsWrapper = ref(null)
let touchStartX = 0
let touchEndX = 0

const stats = ref({
  totalUsers: 0,
  workingToday: 0,
  todayLeaves: 0,
  activeCars: 0,
  activeTasks: 0,
  completedTasks: 0,
  dueSoon: 0,
  overdue: 0
})

const workStatistics = ref([])
const expandedRows = ref([])
const leaveChart = ref(null)
const taskChart = ref(null)
let leaveChartInstance = null
let taskChartInstance = null

onMounted(() => {
  loadLeaveTypeColors()
  loadData()
})

// Swipe handlers
const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX
}

const handleTouchMove = (e) => {
  touchEndX = e.touches[0].clientX
}

const handleTouchEnd = () => {
  const diff = touchStartX - touchEndX
  const threshold = 50
  
  if (Math.abs(diff) > threshold) {
    if (diff > 0 && currentChart.value < 1) {
      currentChart.value++
    } else if (diff < 0 && currentChart.value > 0) {
      currentChart.value--
    }
  }
}

// Watch chart changes for smooth transition
watch(currentChart, (newVal) => {
  if (chartsWrapper.value) {
    chartsWrapper.value.style.transform = `translateX(-${newVal * 100}%)`
  }
})

const loadLeaveTypeColors = async () => {
  try {
    const response = await axios.get('/api/leave/leave-types')
    const colorMap = {}
    response.data.forEach(type => {
      colorMap[type.value] = type.color
    })
    leaveTypeColors.value = colorMap
  } catch (error) {
    handleError(error, {
      customMessage: 'ไม่สามารถโหลดสีประเภทการลาได้',
      showToast: false // ไม่แสดง toast เพราะไม่สำคัญมาก
    })
  }
}

const loadData = async () => {
  loading.value = true
  
  try {
    // ใช้ service layer พร้อม cache
    const [activeUsers, leaves, cars, tasks, dailyWork] = await Promise.all([
      userService.getActiveUsers(),  // มี cache 5 นาที + filter is_active
      axios.get('/api/leave').then(r => r.data),
      axios.get('/api/car-booking').then(r => r.data),
      axios.get('/api/tasks').then(r => r.data),
      dailyWorkService.getDailyWork()  // มี cache 2 นาที
    ])

    // Store for user filter
    allLeaves.value = leaves
    allDailyWork.value = dailyWork
    userOptions.value = activeUsers.map(u => ({
      label: `${u.firstname} ${u.lastname}`,
      value: u.id
    })).sort((a, b) => a.label.localeCompare(b.label, 'th'))

    // Calculate stats
    stats.value.totalUsers = activeUsers.length
    
    const today = new Date().toISOString().split('T')[0]
    const todayDate = new Date(today + 'T00:00:00') // Local midnight
    const weekFromNow = new Date(todayDate)
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    
    // Helper function to parse date as local
    const parseLocalDate = (dateStr) => {
      if (!dateStr) return null
      const datePart = dateStr.split('T')[0]
      return new Date(datePart + 'T00:00:00')
    }
    
    // Get unique user IDs who have approved leave today
    const todayLeavesUsers = leaves.filter(l => {
      if (l.status !== 'approved') return false
      if (!l.start_datetime || !l.end_datetime) return false
      
      // แปลง UTC เป็น local date
      const startDate = new Date(l.start_datetime)
      const endDate = new Date(l.end_datetime)
      
      // เปรียบเทียบแบบ local date (ไม่สนเวลา)
      const startLocalDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      const endLocalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
      
      return startLocalDate <= todayDate && endLocalDate >= todayDate
    })
    
    // Count unique users (DISTINCT user_id)
    const uniqueUserIds = [...new Set(todayLeavesUsers.map(l => l.user_id))]
    stats.value.todayLeaves = uniqueUserIds.length
    
    // พนักงานที่ทำงานวันนี้ = คนที่ลงงานรายวันวันนี้
    const todayWorkUsers = dailyWork.filter(w => {
      const workDate = w.work_date?.split('T')[0]
      return workDate === today
    })
    const uniqueWorkUserIds = [...new Set(todayWorkUsers.map(w => w.user_id))]
    stats.value.workingToday = uniqueWorkUserIds.length
    
    stats.value.activeCars = cars.filter(c => c.status === 'active').length
    stats.value.activeTasks = tasks.filter(t => isActive(t.status)).length
    stats.value.completedTasks = tasks.filter(t => isCompleted(t.status)).length
    
    // งานที่ครบกำหนดสัปดาห์นี้
    stats.value.dueSoon = tasks.filter(t => {
      if (!t.project_end_date) return false
      const endDate = parseLocalDate(t.project_end_date)
      return endDate >= todayDate && endDate <= weekFromNow && isActive(t.status)
    }).length
    
    // งานที่เลยกำหนด
    stats.value.overdue = tasks.filter(t => {
      if (!t.project_end_date) return false
      const endDate = parseLocalDate(t.project_end_date)
      return endDate < todayDate && isActive(t.status)
    }).length

    // Work Statistics - คำนวณเวลาทำงานของแต่ละคน (รายปี)
    const currentYear = new Date().getFullYear()
    const userWorkData = {}
    
    dailyWork.forEach(w => {
      const workYear = new Date(w.work_date).getFullYear()
      if (workYear !== currentYear) return
      
      const userId = w.user_id
      if (!userId) return // ข้ามถ้าไม่มี userId
      
      if (!userWorkData[userId]) {
        const user = activeUsers.find(u => u.id === userId)
        if (!user) return // ข้ามถ้าไม่เจอ user ใน activeUsers
        
        userWorkData[userId] = {
          userId: userId,
          userName: `${user.firstname} ${user.lastname}`,
          department: user.department || 'N/A',
          totalHours: 0,
          taskCount: 0,
          taskHours: {} // เก็บชั่วโมงของแต่ละงาน
        }
      }
      
      // คำนวณชั่วโมงจาก start_time และ end_time
      if (w.start_time && w.end_time) {
        const [startH, startM] = w.start_time.split(':').map(Number)
        const [endH, endM] = w.end_time.split(':').map(Number)
        const hours = (endH + endM/60) - (startH + startM/60)
        
        if (hours > 0) {
          userWorkData[userId].totalHours += hours
          
          // เก็บชั่วโมงของแต่ละงาน
          const taskName = w.task_name || w.project_name || 'ไม่ระบุ'
          if (!userWorkData[userId].taskHours[taskName]) {
            userWorkData[userId].taskHours[taskName] = 0
          }
          userWorkData[userId].taskHours[taskName] += hours
        }
      }
      
      userWorkData[userId].taskCount += 1
    })
    
    workStatistics.value = Object.values(userWorkData).map(data => {
      // สร้างรายละเอียดงานทั้งหมด
      const taskDetails = Object.entries(data.taskHours)
        .map(([taskName, hours]) => ({
          taskName: taskName,
          hours: hours,
          percentage: (hours / data.totalHours) * 100
        }))
        .sort((a, b) => b.hours - a.hours)
      
      return {
        userId: data.userId,
        userName: data.userName,
        department: data.department,
        totalHours: data.totalHours,
        taskCount: data.taskCount,
        avgHoursPerTask: data.taskCount > 0 ? data.totalHours / data.taskCount : 0,
        taskDetails: taskDetails
      }
    }).sort((a, b) => b.totalHours - a.totalHours)

    await nextTick()
    renderCharts(leaves, tasks)
  } catch (error) {
    handleError(error, {
      customMessage: 'ไม่สามารถโหลดข้อมูล Dashboard ได้ กรุณาลองใหม่อีกครั้ง'
    })
  } finally {
    loading.value = false
  }
}

const formatHoursMinutes = (hours) => {
  const h = parseFloat(hours) || 0
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return `${hrs} ชม. ${mins} นาที`
}

const renderCharts = (leaves, tasks) => {
  // Leave Chart - แสดงจำนวนวันลาของแต่ละคนแยกตามประเภท (รายปี)
  if (leaveChartInstance) leaveChartInstance.destroy()
  
  const currentYear = new Date().getFullYear()
  const users = {}
  const leaveTypes = new Set()
  
  // รวบรวมข้อมูล
  leaves.forEach(l => {
    if (l.status !== 'approved') return
    const leaveYear = new Date(l.start_datetime).getFullYear()
    if (leaveYear !== currentYear) return
    
    const userName = l.user_name || 'ไม่ระบุ'
    const leaveType = l.leave_type || 'อื่นๆ'
    const days = parseFloat(l.total_days) || 0
    
    if (!users[userName]) {
      users[userName] = { total: 0 }
    }
    if (!users[userName][leaveType]) {
      users[userName][leaveType] = 0
    }
    users[userName][leaveType] += days
    users[userName].total += days
    leaveTypes.add(leaveType)
  })

  // Sort by total leave days and limit to top 15
  const sortedUsers = Object.entries(users)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15)
    .map(([name]) => name)

  // สร้าง datasets สำหรับแต่ละประเภทการลา
  const datasets = Array.from(leaveTypes).map(type => ({
    label: type,
    data: sortedUsers.map(userName => users[userName][type] || 0),
    backgroundColor: leaveTypeColors.value[type] || '#' + Math.floor(Math.random()*16777215).toString(16)
  }))

  leaveChartInstance = new Chart(leaveChart.value, {
    type: 'bar',
    data: {
      labels: sortedUsers,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: 'จำนวนวัน' }
        }
      },
      plugins: {
        legend: { display: true, position: 'top' }
      }
    }
  })

  // Task Chart - store tasks for click event
  if (taskChartInstance) taskChartInstance.destroy()
  
  allTasks.value = tasks
  const taskStatus = {}
  tasks.forEach(t => {
    const status = t.status || 'pending'
    taskStatus[status] = (taskStatus[status] || 0) + 1
  })

  const statusLabels = Object.keys(taskStatus)
  const statusColors = {
    'pending': '#f59e0b',
    'in_progress': '#4A90E2', 
    'completed': '#10b981',
    'cancelled': '#ef4444'
  }

  taskChartInstance = new Chart(taskChart.value, {
    type: 'doughnut',
    data: {
      labels: statusLabels,
      datasets: [{
        data: Object.values(taskStatus),
        backgroundColor: statusLabels.map(s => statusColors[s] || '#6c757d')
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index
          selectedTaskStatus.value = statusLabels[index]
          showTaskStatusDialog.value = true
        }
      }
    }
  })
}
</script>

<style scoped>
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

.dashboard-container {
  padding: 1rem;
  padding-bottom: 0;
  max-width: 100%;
  margin: 0 auto;
  
  background: #e5e7eb;
  height: 100%;
  overflow: auto;
}

.header-card {
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border: none;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-filter {
  min-width: 200px;
  background: rgba(255,255,255,0.9);
  border-radius: 8px;
}

.user-dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-dashboard-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4A90E2;
}

.user-leave-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.leave-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.leave-type {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  color: white;
  font-size: 0.85rem;
}

.leave-days {
  font-weight: 600;
}

.no-data {
  color: #6c757d;
  font-style: italic;
}

.timesheet-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.summary-item i {
  font-size: 2rem;
}

.summary-item h4 {
  margin: 0;
  font-size: 1.5rem;
}

.summary-item p {
  margin: 0;
  color: #6c757d;
  font-size: 0.85rem;
}

.chart-container {
  position: relative;
}

.timesheet-filter {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.timesheet-filter label {
  font-weight: 600;
  color: #374151;
}

.period-dropdown {
  min-width: 150px;
}

.category-badges-small {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cat-badge {
  background: #e5e7eb;
  color: #374151;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  font-size: 1.5rem;
}

.header-title h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.back-btn {
  color: white !important;
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 8px !important;
  padding: 0.5rem !important;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

/* Charts Container with Swipe */
.charts-container {
  position: relative;
  overflow: hidden;
}

.charts-wrapper {
  display: flex;
  transition: transform 0.3s ease-out;
}

.chart-card {
  flex: 0 0 100%;
  min-width: 100%;
  border: 1px solid #e9ecef;
  min-height: 350px;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.chart-card.active {
  opacity: 1;
}

.chart-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

canvas {
  max-height: 300px;
}

.chart-dots {
  display: none;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.chart-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
  cursor: pointer;
  transition: all 0.3s;
}

.chart-dots span.active {
  background: #4A90E2;
  width: 24px;
  border-radius: 4px;
}

/* Desktop: Show grid */
@media (min-width: 769px) {
  .charts-wrapper {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .chart-card {
    flex: none;
    min-width: auto;
    opacity: 1;
  }
}

/* Mobile: Show swipe */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 0.5rem;
  }
  
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .summary-card {
    padding: 0.5rem;
  }
  
  .summary-content {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .summary-icon {
    font-size: 1.8rem;
  }
  
  .summary-info h3 {
    font-size: 1.5rem;
  }
  
  .summary-info p {
    font-size: 0.75rem;
  }
  
  .chart-dots {
    display: flex;
  }
  
  .header-title h1 {
    font-size: 1.2rem;
  }
  
  .header-icon {
    font-size: 1.2rem;
  }
  
  /* Hide table columns on mobile */
  :deep(.p-datatable-wrapper) {
    overflow-x: auto;
  }
  
  :deep(.p-datatable) {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    padding: 0.5rem;
  }
  
  .back-btn {
    padding: 0.4rem !important;
  }
}

.task-breakdown {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.task-breakdown h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.skeleton-text {
  border-radius: 4px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 0.75rem;
  }
  
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .summary-card:hover {
    transform: none;
  }
  
  .summary-content {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .summary-icon {
    font-size: 2rem;
  }
  
  .summary-info h3 {
    font-size: 1.5rem;
  }
  
  .summary-info p {
    font-size: 0.8rem;
  }
  
  .chart-dots {
    display: flex;
  }
  
  .header-title h1 {
    font-size: 1.25rem;
  }
  
  .header-icon {
    font-size: 1.25rem;
  }
  
  :deep(.p-datatable-wrapper) {
    overflow-x: auto;
  }
  
  :deep(.p-datatable) {
    font-size: 0.9rem;
  }
  
  :deep(.p-datatable .p-column-title) {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    padding: 0.5rem;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .header-content {
    padding: 0.5rem;
  }
  
  .header-left {
    gap: 0.5rem;
  }
  
  .header-title {
    gap: 0.5rem;
  }
  
  .header-title h1 {
    font-size: 1.1rem;
  }
  
  .header-icon {
    font-size: 1.1rem;
  }
  
  .back-btn {
    padding: 0.4rem !important;
  }
  
  .summary-icon {
    font-size: 1.8rem;
  }
  
  .summary-info h3 {
    font-size: 1.3rem;
  }
  
  .summary-info p {
    font-size: 0.75rem;
  }
  
  .chart-card {
    min-height: 300px;
  }
  
  canvas {
    max-height: 250px;
  }
  
  :deep(.p-datatable) {
    font-size: 0.8rem;
  }
  
  :deep(.p-datatable .p-column-title) {
    font-size: 0.75rem;
  }
  
  :deep(.p-paginator) {
    font-size: 0.8rem;
  }
}

@media (max-width: 360px) {
  .summary-info h3 {
    font-size: 1.2rem;
  }
  
  .summary-info p {
    font-size: 0.7rem;
  }
  
  .header-title h1 {
    font-size: 1rem;
  }
}
</style>
