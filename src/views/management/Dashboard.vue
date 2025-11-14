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
        </div>
      </template>
    </Card>

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
              <p>งานครบกำหนดสัปดาห์นี้</p>
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
              <p>งานเลยกำหนด</p>
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
              <p>งานกำลังดำเนินการ</p>
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
              <p>งานเสร็จสิ้น</p>
            </div>
          </div>
        </template>
      </Card>
      </template>
    </div>

    <!-- Charts -->
    <div class="charts-grid mb-4">
      <Card class="chart-card">
        <template #content>
          <h3>จำนวนวันลาของพนักงาน (รายปี)</h3>
          <canvas ref="leaveChart"></canvas>
        </template>
      </Card>

      <Card class="chart-card">
        <template #content>
          <h3>สถานะงาน</h3>
          <canvas ref="taskChart"></canvas>
        </template>
      </Card>
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
          <Column field="totalHours" header="รวมชั่วโมง" sortable style="min-width: 120px">
            <template #body="{ data }">
              <span style="font-weight: 600; color: #4A90E2">{{ data.totalHours.toFixed(1) }} ชม.</span>
            </template>
          </Column>
          <Column field="taskCount" header="จำนวนงาน" sortable style="min-width: 100px" />
          <Column field="avgHoursPerTask" header="เฉลี่ย/งาน" sortable style="min-width: 100px">
            <template #body="{ data }">
              {{ data.avgHoursPerTask.toFixed(1) }} ชม.
            </template>
          </Column>
          
          <template #expansion="{ data }">
            <div class="task-breakdown">
              <h4>รายละเอียดงานทั้งหมด</h4>
              <DataTable :value="data.taskDetails" class="p-datatable-sm">
                <Column field="taskName" header="ชื่องาน" style="min-width: 200px" />
                <Column field="hours" header="ชั่วโมง" sortable>
                  <template #body="{ data: task }">
                    <span style="font-weight: 600; color: #10b981">{{ task.hours.toFixed(1) }} ชม.</span>
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
  </div>

  <UserInfoDialog v-if="showUserDialog" :visible="true" @update:visible="showUserDialog = false" :userId="selectedUserId" />
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { Chart } from 'chart.js/auto'
import axios from 'axios'
import userService from '@/services/userService'
import dailyWorkService from '@/services/dailyWorkService'
import UserInfoDialog from '@/components/UserInfoDialog.vue'

const { handleError } = useErrorHandler()
const loading = ref(false)
const leaveTypeColors = ref({})
const showUserDialog = ref(false)
const selectedUserId = ref(null)


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
    stats.value.activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'done').length
    stats.value.completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done').length
    
    // งานที่ครบกำหนดสัปดาห์นี้
    stats.value.dueSoon = tasks.filter(t => {
      if (!t.project_end_date) return false
      const endDate = parseLocalDate(t.project_end_date)
      return endDate >= todayDate && endDate <= weekFromNow && (t.status !== 'completed' && t.status !== 'done')
    }).length
    
    // งานที่เลยกำหนด
    stats.value.overdue = tasks.filter(t => {
      if (!t.project_end_date) return false
      const endDate = parseLocalDate(t.project_end_date)
      return endDate < todayDate && (t.status !== 'completed' && t.status !== 'done')
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
      users[userName] = {}
    }
    if (!users[userName][leaveType]) {
      users[userName][leaveType] = 0
    }
    users[userName][leaveType] += days
    leaveTypes.add(leaveType)
  })

  // สร้าง datasets สำหรับแต่ละประเภทการลา
  const datasets = Array.from(leaveTypes).map(type => ({
    label: type,
    data: Object.keys(users).map(userName => users[userName][type] || 0),
    backgroundColor: leaveTypeColors.value[type] || '#' + Math.floor(Math.random()*16777215).toString(16)
  }))

  leaveChartInstance = new Chart(leaveChart.value, {
    type: 'bar',
    data: {
      labels: Object.keys(users),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: false
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'จำนวนวัน'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      }
    }
  })

  // Task Chart
  if (taskChartInstance) taskChartInstance.destroy()
  
  const taskStatus = {}
  tasks.forEach(t => {
    taskStatus[t.status || 'pending'] = (taskStatus[t.status || 'pending'] || 0) + 1
  })

  taskChartInstance = new Chart(taskChart.value, {
    type: 'doughnut',
    data: {
      labels: Object.keys(taskStatus),
      datasets: [{
        data: Object.values(taskStatus),
        backgroundColor: ['#f59e0b', '#4A90E2', '#10b981', '#ef4444']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
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
  max-width: 1400px;
  margin: 0 auto;
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

.summary-card {
  border: 1px solid #e9ecef;
  transition: all 0.3s;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.summary-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-icon {
  font-size: 2.5rem;
}

.summary-info h3 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.summary-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1rem;
}

.chart-card {
  border: 1px solid #e9ecef;
  min-height: 350px;
}

.chart-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

canvas {
  max-height: 300px;
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
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
