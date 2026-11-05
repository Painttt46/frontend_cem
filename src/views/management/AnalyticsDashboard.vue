<template>
  <div class="analytics-container">
    
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

    <div v-if="loadFailures.length" class="load-error mb-4" role="alert">
      <span><i class="pi pi-exclamation-triangle"></i> โหลดข้อมูลบางส่วนไม่สำเร็จ: {{ loadFailures.join(', ') }} — ตัวเลขที่เกี่ยวข้องอาจไม่ครบ</span>
      <Button label="ลองใหม่" icon="pi pi-refresh" size="small" severity="danger" outlined :loading="loading" @click="loadData" />
    </div>

    <!-- Tab Navigation -->
    <TabView v-model:activeIndex="activeTab">
      <!-- Tab 1: Workload -->
      <TabPanel header="📊 Workload">
        <div class="chart-section">
          <!-- Workload Stats -->
          <div class="stats-grid mb-4">
            <template v-if="loading">
              <Card v-for="i in 4" :key="i" class="stat-card">
                <template #content>
                  <div class="stat-content">
                    <div class="skeleton skeleton-icon"></div>
                    <div>
                      <div class="skeleton skeleton-text" style="width: 60px; height: 28px;"></div>
                      <div class="skeleton skeleton-text" style="width: 100px; height: 14px; margin-top: 8px;"></div>
                    </div>
                  </div>
                </template>
              </Card>
            </template>
            <template v-else>
              <Card class="stat-card">
                <template #content>
                  <div class="stat-content">
                    <i class="pi pi-clock" style="color: #1d4ed8"></i>
                    <div>
                      <h3><CountUp :value="workloadStats.totalHours" /></h3>
                      <p>ชั่วโมงทำงานรวม</p>
                    </div>
                  </div>
                </template>
              </Card>
              <Card class="stat-card">
                <template #content>
                  <div class="stat-content">
                    <i class="pi pi-users" style="color: #047857"></i>
                    <div>
                      <h3><CountUp :value="workloadStats.activeUsers" /></h3>
                      <p>พนักงานที่บันทึกงาน</p>
                    </div>
                  </div>
                </template>
              </Card>
              <Card class="stat-card">
                <template #content>
                  <div class="stat-content">
                    <i class="pi pi-chart-bar" style="color: #b45309"></i>
                    <div>
                      <h3><CountUp :value="workloadStats.avgHours" /></h3>
                      <p>เฉลี่ยต่อคน/เดือน</p>
                    </div>
                  </div>
                </template>
              </Card>
              <Card class="stat-card">
                <template #content>
                  <div class="stat-content">
                    <i class="pi pi-calendar" style="color: #7c3aed"></i>
                    <div>
                      <h3><CountUp :value="workloadStats.workDays" /></h3>
                      <p>วันทำงานรวม</p>
                    </div>
                  </div>
                </template>
              </Card>
            </template>
          </div>

          <Card class="mb-4">
            <template #content>
              <div class="chart-header">
                <h3>งานที่แต่ละคนถืออยู่ตอนนี้</h3>
                <InputText v-model="workloadSearch" placeholder="ค้นหา ชื่อ / แผนก / โครงการ..." class="workload-search" aria-label="ค้นหางานที่ถืออยู่" />
              </div>
              <p class="workload-note">
                นับเฉพาะขั้นตอนที่ยังไม่เสร็จของโครงการที่ยังดำเนินการอยู่ · กำลังทำ = มีการลงงานแล้ว · เกินกำหนด = เลยวันสิ้นสุดของขั้นตอน
                · ชั่วโมงเป็นของเดือน{{ workloadMonthLabel }} {{ selectedYear }} · กดลูกศรเพื่อดูโครงการและขั้นตอน
              </p>
              <DataTable v-model:expandedRows="expandedWorkload" :value="currentWorkload" :loading="loading" dataKey="userId"
                paginator :rows="10" sortField="overdue" :sortOrder="-1" class="p-datatable-sm">
                <template #empty>ไม่มีข้อมูลงานตามตัวกรองที่เลือก</template>
                <Column :expander="true" style="width: 3rem" />
                <Column field="userName" header="ชื่อพนักงาน" sortable style="min-width: 160px" />
                <Column field="department" header="แผนก" sortable style="min-width: 100px" />
                <Column field="projects" header="โครงการ" sortable style="min-width: 80px" />
                <Column field="working" header="กำลังทำ" sortable style="min-width: 80px" />
                <Column field="overdue" header="เกินกำหนด" sortable style="min-width: 90px">
                  <template #body="{ data }">
                    <span :class="data.overdue > 0 ? 'wl-overdue' : ''">{{ data.overdue }}</span>
                  </template>
                </Column>
                <Column field="dueSoon" header="ครบใน 7 วัน" sortable style="min-width: 90px" />
                <Column field="pending" header="ยังไม่เริ่ม" sortable style="min-width: 80px" />
                <Column field="monthHours" :header="`ชั่วโมง ${workloadMonthLabel}`" sortable style="min-width: 110px">
                  <template #body="{ data }">{{ data.monthHours.toFixed(1) }} ชม.</template>
                </Column>
                <Column field="lastDate" header="ลงงานล่าสุด" sortable style="min-width: 170px">
                  <template #body="{ data }">
                    <template v-if="data.lastDate">
                      <div>{{ formatLeaveDate(data.lastDate) }}</div>
                      <small v-if="data.lastLocation" class="wl-last-place"><i class="pi pi-map-marker"></i> {{ data.lastLocation }}</small>
                    </template>
                    <span v-else>-</span>
                  </template>
                </Column>
                <template #expansion="{ data }">
                  <div class="wl-expansion">
                    <p v-if="!data.projectList.length" class="wl-empty">ไม่มีขั้นตอนที่ได้รับมอบหมายและยังไม่เสร็จ</p>
                    <div v-for="proj in data.projectList" :key="proj.taskId" class="wl-project">
                      <div class="wl-project-name">
                        <span v-if="proj.soNumber" class="wl-so">{{ proj.soNumber }}</span>{{ proj.taskName }}
                        <small>คืบหน้า {{ proj.progress }}% ({{ proj.completedSteps }}/{{ proj.totalSteps }})</small>
                      </div>
                      <template v-for="step in proj.steps" :key="step.stepId">
                        <div v-if="step.stepStatus !== 'completed'" class="wl-step">
                          <span class="wl-dot" :class="`wl-dot-${step.stepStatus}`"></span>
                          <span class="wl-step-name">{{ step.stepName }}</span>
                          <span class="wl-step-state" :class="`wl-state-${step.stepStatus}`">{{ STEP_LABELS[step.stepStatus] }}</span>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
              </DataTable>
            </template>
          </Card>

          <Card class="mb-4">
            <template #content>
              <div class="chart-header">
                <h3>Workload รายบุคคล (ชั่วโมง/เดือน)</h3>
                <Dropdown v-model="workloadMonth" :options="monthOptions" optionLabel="label" optionValue="value" class="month-filter" />
              </div>
              <div class="chart-container" style="height: 400px;">
                <canvas ref="workloadChart"></canvas>
                <div v-if="!loading && !workloadChartData.length" class="chart-empty">{{ workDataFailed ? 'โหลดข้อมูลการลงงานไม่สำเร็จ' : `ไม่มีการลงงานในเดือน${workloadMonthLabel} ${selectedYear}` }}</div>
              </div>
            </template>
          </Card>

          <Card>
            <template #content>
              <h3>Workload รายทีม/แผนก</h3>
              <div class="chart-container" style="height: 350px;">
                <canvas ref="teamWorkloadChart"></canvas>
                <div v-if="!loading && !teamWorkloadData.length" class="chart-empty">{{ workDataFailed ? 'โหลดข้อมูลการลงงานไม่สำเร็จ' : `ไม่มีการลงงานในปี ${selectedYear}` }}</div>
              </div>
            </template>
          </Card>
        </div>
      </TabPanel>

      <!-- Tab 2: Leave Statistics -->
      <TabPanel header="📅 สถิติการลา">
        <div class="chart-section">
          <div class="stats-grid mb-4">
            <template v-if="loading">
              <Card v-for="i in 4" :key="i" class="stat-card">
                <template #content>
                  <div class="stat-content">
                    <div class="skeleton skeleton-icon"></div>
                    <div>
                      <div class="skeleton skeleton-text" style="width: 60px; height: 28px;"></div>
                      <div class="skeleton skeleton-text" style="width: 100px; height: 14px; margin-top: 8px;"></div>
                    </div>
                  </div>
                </template>
              </Card>
            </template>
            <template v-else>
              <Card v-for="(stat, key) in leaveStats" :key="key" class="stat-card" @click="showLeaveDetail()" style="cursor: pointer;">
                <template #content>
                  <div class="stat-content">
                    <i :class="stat.icon" :style="{ color: stat.color }"></i>
                    <div>
                      <h3><CountUp :value="stat.value" /></h3>
                      <p>{{ stat.label }}</p>
                    </div>
                  </div>
                </template>
              </Card>
            </template>
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
                    <span class="leave-badge" :style="{ background: (leaveTypeColors[data.leave_type] || '#6c757d') + '20', color: $accessibleText(leaveTypeColors[data.leave_type] || '#6c757d') }">
                      {{ leaveTypeLabels[data.leave_type] || data.leave_type }}
                    </span>
                  </template>
                </Column>
                <Column header="วันที่" sortable>
                  <template #body="{ data }">
                    {{ formatLeaveDate(data.start_datetime) }} - {{ formatLeaveDate(data.end_datetime) }}
                  </template>
                </Column>
                <Column field="total_days" header="จำนวนวัน" sortable>
                  <template #body="{ data }">{{ formatLeaveDays(data.total_days) }}</template>
                </Column>
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
                    <span class="legend-label">{{ leaveTypeLabels[type] || type }}</span>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Chart } from 'chart.js/auto'
import axios from '@/utils/axiosConfig'
import { formatLeaveDays, toDateKey } from '@/utils/dateUtils'
import { dayHours } from '@/utils/workTime'
import { buildWorkloadByUser, workloadSummary } from '@/utils/workload'
import { useErrorHandler } from '@/composables/useErrorHandler'
import CountUp from '@/components/CountUp.vue'

const { handleError } = useErrorHandler()
const loading = ref(true)
const loadFailures = ref([])

// Filters
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const selectedDepartment = ref(null)
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)
const departmentOptions = ref([])
const activeTab = ref(0)

// Workload
const STEP_LABELS = { working: 'กำลังทำ', overdue: 'เกินกำหนด', pending: 'ยังไม่เริ่ม' }
const workloadSearch = ref('')
const expandedWorkload = ref([])
const workloadByUser = ref({})
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
// รหัสประเภทลา (sick, vacation, …) → ชื่อที่ตั้งไว้ในระบบ
const leaveTypeLabels = ref({})

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

// Computed
const filteredUsers = computed(() => {
  if (!selectedDepartment.value) return users.value
  return users.value.filter(u => u.department === selectedDepartment.value)
})

// รายการลงงานที่นับ: ไม่รวมที่ยกเลิก และไม่รวมงานที่ลงล่วงหน้า (วันที่ยังมาไม่ถึง)
const countedWork = computed(() => {
  const today = toDateKey(new Date())
  return dailyWork.value.filter(w => w.work_status !== 'cancelled' && w.work_date && String(w.work_date).slice(0, 10) <= today)
})

const filteredDailyWork = computed(() => {
  const userIds = new Set(filteredUsers.value.map(u => u.id))
  const year = String(selectedYear.value)
  return countedWork.value.filter(w => String(w.work_date).slice(0, 4) === year && userIds.has(w.user_id))
})

// ชั่วโมงรวมต่อกลุ่ม: รวมรายการของคนเดียววันเดียวกันก่อน (ช่วงเวลาที่ทับกันนับครั้งเดียว, สูตรเดียวกับระบบลงงาน)
const sumHoursBy = (records, groupOf) => {
  const days = new Map()
  records.forEach(w => {
    const key = `${w.user_id}_${String(w.work_date).slice(0, 10)}`
    if (!days.has(key)) days.set(key, [])
    days.get(key).push(w)
  })
  const totals = {}
  days.forEach(list => {
    const group = groupOf(list[0])
    if (group === null || group === undefined) return
    totals[group] = (totals[group] || 0) + dayHours(list).total
  })
  return totals
}

const workloadMonthKey = computed(() => `${selectedYear.value}-${String(workloadMonth.value + 1).padStart(2, '0')}`)
const workloadMonthLabel = computed(() => monthOptions.find(m => m.value === workloadMonth.value)?.label || '')
const monthHoursByUser = computed(() => sumHoursBy(
  filteredDailyWork.value.filter(w => String(w.work_date).slice(0, 7) === workloadMonthKey.value),
  w => w.user_id
))

const filteredLeaves = computed(() => {
  const userIds = new Set(filteredUsers.value.map(u => u.id))
  const filtered = leaves.value.filter(l => {
    if (l.status !== 'approved') return false
    const leaveYear = new Date(l.start_datetime).getFullYear()
    return leaveYear === selectedYear.value && userIds.has(l.user_id)
  })
  return filtered
})

// โหลดการลงงานไม่สำเร็จและไม่มีข้อมูลเดิม — แยกจากกรณี "ไม่มีการลงงานจริง"
const workDataFailed = computed(() => loadFailures.value.includes('การลงงาน') && dailyWork.value.length === 0)

// Workload Stats
const workloadStats = computed(() => {
  // โหลดการลงงานไม่ได้: แสดง "—" ไม่ใช่ 0
  if (workDataFailed.value) {
    return { totalHours: '—', activeUsers: '—', avgHours: '—', workDays: '—' }
  }
  const records = filteredDailyWork.value
  const userSet = new Set(records.map(w => w.user_id))
  const daySet = new Set(records.map(w => String(w.work_date).slice(0, 10)))
  const totalHours = Object.values(sumHoursBy(records, () => 'all')).reduce((a, b) => a + b, 0)
  // เฉลี่ยตามจำนวนเดือนที่ผ่านมาจริง (ปีปัจจุบันยังไม่ครบ 12 เดือน — เดิมหาร 12 เสมอ)
  const months = selectedYear.value === currentYear ? new Date().getMonth() + 1 : 12
  const avgHours = userSet.size > 0 ? (totalHours / userSet.size / months).toFixed(1) : '0'

  return {
    totalHours: totalHours.toFixed(0) + ' ชม.',
    activeUsers: userSet.size + ' คน',
    avgHours: avgHours + ' ชม.',
    workDays: daySet.size + ' วัน'
  }
})

// งานที่แต่ละคนถืออยู่ตอนนี้ (ไม่ขึ้นกับปี/เดือนที่เลือก ยกเว้นคอลัมน์ชั่วโมง)
const lastWorkByUser = computed(() => {
  const map = {}
  countedWork.value.forEach(w => {
    const date = String(w.work_date).slice(0, 10)
    const cur = map[w.user_id]
    const stamp = `${date} ${w.start_time || ''}`
    if (!cur || stamp > cur.stamp) map[w.user_id] = { stamp, date, location: (w.location || '').trim() }
  })
  return map
})

const currentWorkload = computed(() => {
  const q = workloadSearch.value.trim().toLowerCase()
  return filteredUsers.value
    .filter(u => u.is_active !== false)
    .map(u => {
      const projectList = workloadByUser.value[u.id] || []
      const last = lastWorkByUser.value[u.id]
      return {
        userId: u.id,
        userName: `${u.firstname} ${u.lastname}${u.nickname ? ` (${u.nickname})` : ''}`,
        department: u.department || '-',
        ...workloadSummary(projectList),
        projectList,
        monthHours: monthHoursByUser.value[u.id] || 0,
        lastDate: last?.date || null,
        lastLocation: last?.location || ''
      }
    })
    .filter(r => r.projects > 0 || r.monthHours > 0)
    .filter(r => !q || r.userName.toLowerCase().includes(q) || r.department.toLowerCase().includes(q)
      || r.projectList.some(p => `${p.taskName} ${p.soNumber || ''}`.toLowerCase().includes(q)))
    .sort((a, b) => (b.overdue - a.overdue) || (b.openSteps - a.openSteps))
})

// Workload chart data
const workloadChartData = computed(() => {
  const names = {}
  users.value.forEach(u => { names[u.id] = `${u.firstname} ${u.lastname}` })
  return Object.entries(monthHoursByUser.value)
    .filter(([id]) => names[id])
    .map(([id, hours]) => [names[id], hours])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
})

// Team workload data
const teamWorkloadData = computed(() => {
  const deptOf = {}
  users.value.forEach(u => { deptOf[u.id] = u.department })
  return Object.entries(sumHoursBy(filteredDailyWork.value, w => deptOf[w.user_id] || null))
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
    total: { value: total.toFixed(1) + ' วัน', label: 'วันลาทั้งหมด', icon: 'pi pi-calendar', color: '#2563eb' },
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
let loadRequestId = 0
const loadData = async () => {
  const requestId = ++loadRequestId
  loading.value = true
  // แต่ละแหล่งข้อมูลล้มเหลวแยกกัน: ส่วนที่โหลดได้ยังแสดงปกติ ส่วนที่ล้มเหลวใช้ข้อมูลชุดเดิม (ถ้ามี) และแจ้งบนหน้า
  const failed = []
  const fetchOr = (label, url, fallback) => axios.get(url, { silent: true }).then(r => r.data).catch(error => {
    console.error(`[Analytics] load failed (${label}):`, error)
    failed.push(label)
    return fallback
  })
  try {
    // silent: true - หน้านี้มี skeleton ของตัวเองแล้ว ไม่ต้องซ้อนทับ overlay เต็มจอ
    const [usersData, workData, leavesData, tasksData, leaveTypes, stepsData] = await Promise.all([
      fetchOr('รายชื่อพนักงาน', '/api/users', users.value),
      fetchOr('การลงงาน', '/api/daily-work', dailyWork.value),
      fetchOr('การลา', '/api/leave', leaves.value),
      fetchOr('โครงการ', '/api/tasks', tasks.value),
      fetchOr('ประเภทการลา', '/api/leave/leave-types', null),
      fetchOr('ขั้นตอนโครงการ', '/api/task-steps/all', null)
    ])
    // กดลองใหม่ซ้อนกัน: ใช้เฉพาะผลของคำขอล่าสุด
    if (requestId !== loadRequestId) return

    users.value = usersData // ไม่ filter status เพราะอาจไม่มี field นี้
    dailyWork.value = workData
    leaves.value = leavesData
    tasks.value = tasksData

    if (stepsData && !failed.includes('โครงการ')) {
      const stepsByTask = {}
      stepsData.forEach(s => { (stepsByTask[s.task_id] = stepsByTask[s.task_id] || []).push(s) })
      workloadByUser.value = buildWorkloadByUser(tasks.value.map(t => ({ ...t, steps: stepsByTask[t.id] || [] })))
    }

    // Department options
    const depts = [...new Set(users.value.map(u => u.department).filter(Boolean))]
    departmentOptions.value = depts.map(d => ({ label: d, value: d }))

    // Leave type colors
    if (leaveTypes) leaveTypes.forEach(t => { leaveTypeColors.value[t.value] = t.color; leaveTypeLabels.value[t.value] = t.label })

    loadFailures.value = failed
    loading.value = false
    await nextTick()
    if (requestId !== loadRequestId) return
    try {
      renderCharts()
    } catch (chartError) {
      console.error('[Analytics] chart render failed:', chartError)
    }
  } catch (error) {
    if (requestId !== loadRequestId) return
    loading.value = false
    console.error('[Analytics] load failed:', error)
    loadFailures.value = ['ข้อมูลรายงาน']
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
        backgroundColor: '#2563eb',
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
  const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

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
      labels: types.map(t => leaveTypeLabels.value[t] || t),
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
.analytics-container { padding: 0.6rem 1rem; background: transparent; min-height: 100%; }

/* Header - เหมือน ManagementView */
.header-card { 
  background: var(--brand-gradient);
  color: white;
  border: none;
  box-shadow: none;
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
  box-shadow: none;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover { box-shadow: none; }
.stat-card .stat-content { display: flex; align-items: center; gap: 1rem; padding: 0.5rem; }
.stat-content i { font-size: 2.5rem; opacity: 0.9; }
.stat-content h3 { margin: 0; font-size: 1.75rem; font-weight: 700; color: #1a1a2e; }
.stat-content p { margin: 0.25rem 0 0; color: #525f70; font-size: max(0.875rem, var(--min-fs)); }

/* Charts */
.chart-section h3 { color: #1a1a2e; font-weight: 600; margin-bottom: 1rem; }
.chart-container { position: relative; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
.chart-header h3 { margin: 0; color: #1a1a2e; }
.workload-search { flex: 0 1 18rem; min-width: 0; }
.load-error { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem 1rem; padding: 0.65rem 0.85rem; border: 1.5px solid #fca5a5; border-radius: 10px; background: #fef2f2; color: #991b1b; font-size: max(0.875rem, var(--min-fs)); font-weight: 600; }
.chart-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 1rem; color: #526074; font-size: max(0.9rem, var(--min-fs)); text-align: center; }
.workload-note { margin: 0 0 0.75rem; color: #526074; font-size: max(0.78rem, var(--min-fs)); line-height: 1.5; }
.wl-overdue { font-weight: 700; color: #b91c1c; }
.wl-last-place { display: block; color: #526074; font-size: max(0.78rem, var(--min-fs)); overflow-wrap: anywhere; }
.wl-expansion { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr)); gap: 0.75rem; padding: 0.5rem; }
.wl-empty { margin: 0; color: #526074; }
.wl-project { min-width: 0; padding: 0.5rem 0.6rem; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; }
.wl-project-name { color: #0f172a; font-weight: 600; font-size: max(0.88rem, var(--min-fs)); overflow-wrap: anywhere; }
.wl-project-name small { display: block; color: #526074; font-weight: 500; font-size: max(0.75rem, var(--min-fs)); }
.wl-so { display: inline-block; margin-right: 0.35rem; padding: 0 0.35rem; border-radius: 5px; background: #e0e7ff; color: #3730a3; font-family: monospace; font-size: max(0.75rem, var(--min-fs)); font-weight: 700; }
.wl-step { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.25rem; font-size: max(0.82rem, var(--min-fs)); color: #334155; }
.wl-step-name { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.wl-dot { flex: 0 0 auto; width: 8px; height: 8px; border-radius: 50%; background: #64748b; }
.wl-dot-working { background: #059669; }
.wl-dot-overdue { background: #dc2626; }
.wl-step-state { flex: 0 0 auto; color: #526074; font-size: max(0.75rem, var(--min-fs)); }
.wl-state-working { color: #047857; font-weight: 600; }
.wl-state-overdue { color: #b91c1c; font-weight: 700; }
.chart-row { display: flex; gap: var(--section-gap); align-items: flex-start; }

/* Legend */
.leave-type-legend { min-width: 220px; background: #f8f9fa; border-radius: 8px; padding: 1rem; }
.legend-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0; border-bottom: 1px solid #e9ecef; transition: background 0.2s; }
.legend-item:hover { background: #e9ecef; margin: 0 -0.5rem; padding-left: 0.5rem; padding-right: 0.5rem; border-radius: 4px; }
.legend-item:last-child { border-bottom: none; }
.legend-color { width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0; }
.legend-label { flex: 1; font-weight: 500; color: #333; }
.legend-value { color: #525f70; font-size: max(0.8rem, var(--min-fs)); }

/* Leave Detail */
.leave-detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.leave-detail-header h3 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
.leave-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: max(0.8rem, var(--min-fs)); font-weight: 500; }
.leave-detail-table { font-size: max(0.875rem, var(--min-fs)); }

/* Gantt */



.task-info { display: flex; flex-direction: column; gap: 0.125rem; overflow: hidden; }
.task-name { font-size: max(0.875rem, var(--min-fs)); font-weight: 500; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.task-name:hover { color: #1d4ed8; text-decoration: underline; }
.task-dates { font-size: max(0.7rem, var(--min-fs)); color: #525f70; }

.gantt-bar {
  position: absolute; height: 28px; border-radius: 6px; 
  display: flex; align-items: center; overflow: hidden;
  box-shadow: none;
  transition: transform 0.2s;
}
.bar-progress { height: 100%; background: rgba(255,255,255,0.25); }

/* Task Tooltip */
.task-tooltip {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: none;
  padding: 0.75rem 1rem;
  max-width: 350px;
  min-width: 200px;
}
.tooltip-close {
  position: absolute;
  top: 4px;
  right: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: #525f70;
  padding: 0.25rem;
  border-radius: 4px;
}

.no-data { padding: 3rem; text-align: center; color: #525f70; }
.no-data i { font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.5; }
.no-data p { margin: 0; font-size: 1rem; }

/* Cards */
:deep(.p-card) { border-radius: 12px; box-shadow: none; }

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
