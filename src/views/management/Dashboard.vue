<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="dashboard-container">

    <!-- Header -->
    <Card class="header-card mb-4">
      <template #content>
        <div class="header-content">
          <div class="header-left">
            <Button icon="pi pi-arrow-left" @click="$router.go(-1)" text rounded class="back-btn"
              v-tooltip.bottom="'ย้อนกลับ'" />
            <div class="header-title">
              <i class="pi pi-chart-bar header-icon"></i>
              <h1>Dashboard</h1>
            </div>
          </div>
          <div class="header-right">
            <span v-if="lastLoadedAtText" class="data-time">ข้อมูล ณ {{ lastLoadedAtText }}</span>
            <Button icon="pi pi-refresh" text rounded class="refresh-btn" :loading="loading" @click="loadData"
              v-tooltip.bottom="'โหลดข้อมูลใหม่'" aria-label="โหลดข้อมูลใหม่" />
            <Button label="Analytics" icon="pi pi-chart-line" class="analytics-btn mr-3"
              @click="$router.push('/management/analytics')" />
            <Dropdown v-model="selectedUser" :options="userOptions" optionLabel="label" optionValue="value"
              placeholder="เลือกพนักงาน" class="user-filter" :showClear="true" @change="onUserChange" filter
              filterPlaceholder="ค้นหาชื่อพนักงาน" />
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
            <Button label="ดูภาพรวมทั้งหมด" icon="pi pi-times" severity="secondary" size="small"
              @click="clearUserFilter" />
          </div>
        </template>
      </Card>

      <!-- User Leave Chart -->
      <Card class="mb-4">
        <template #content>
          <h3>สรุปการลาประจำปี {{ currentYear }}</h3>
          <div class="user-leave-summary">
            <div v-for="(days, type) in userLeaveData" :key="type" class="leave-item">
              <span class="leave-type" :style="{ backgroundColor: leaveTypeColors[type] || '#6c757d' }">{{ leaveTypeLabels[type] || type }}</span>
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
          <div class="user-ts-head">
            <h3>Timesheet</h3>
            <div class="timesheet-filter">
              <label>ช่วงเวลา:</label>
              <Dropdown v-model="timesheetPeriod" :options="periodOptions" optionLabel="label" optionValue="value"
                class="period-dropdown" />
            </div>
          </div>
          <div class="timesheet-summary">
            <div class="summary-item">
              <i class="pi pi-calendar-times" :style="{ color: userTimesheetSummary.att && userTimesheetSummary.att.missingDays > 0 ? '#dc2626' : '#047857' }"></i>
              <div>
                <h4>{{ userTimesheetSummary.att ? `${userTimesheetSummary.att.loggedDays}/${userTimesheetSummary.att.requiredDays} วัน` : '—' }}</h4>
                <p>ลงงาน<template v-if="userTimesheetSummary.att"> (ขาด {{ userTimesheetSummary.att.missingDays }} วัน)</template></p>
              </div>
            </div>
            <div class="summary-item">
              <i class="pi pi-clock" style="color: #1d4ed8"></i>
              <div>
                <h4>{{ formatHoursMinutes(userTimesheetSummary.totalHours) }}</h4>
                <p>ชั่วโมงทำงานจริง</p>
              </div>
            </div>
            <div class="summary-item">
              <i class="pi pi-calendar" style="color: #b45309"></i>
              <div>
                <h4>{{ userTimesheetSummary.expectedHours === null ? '—' : formatHoursMinutes(userTimesheetSummary.expectedHours) }}</h4>
                <p>ชั่วโมงที่ควรทำ</p>
              </div>
            </div>
            <div class="summary-item">
              <i class="pi pi-percentage"
                :style="{ color: userTimesheetSummary.percentage === null ? '#526074' : userTimesheetSummary.percentage >= 100 ? '#047857' : '#dc2626' }"></i>
              <div>
                <h4 :style="{ color: userTimesheetSummary.percentage === null ? '#526074' : userTimesheetSummary.percentage >= 100 ? '#047857' : '#dc2626' }">
                  {{ userTimesheetSummary.percentage === null ? '—' : userTimesheetSummary.percentage + '%' }}
                </h4>
                <p>ทำจริงเทียบที่ควรทำ</p>
              </div>
            </div>
            <div class="summary-item">
              <i class="pi pi-briefcase" style="color: #7c3aed"></i>
              <div>
                <h4>{{ userTimesheetSummary.totalTasks }}</h4>
                <p>รายการลงงาน<template v-if="userTimesheetSummary.lateDays"> (ลงหลัง 10:00 {{ userTimesheetSummary.lateDays }} วัน)</template></p>
              </div>
            </div>
          </div>
          <p class="calc-note">
            <template v-if="userTimesheetSummary.att">ควรทำ = วันทำงาน (จ.–ศ. ไม่รวมวันหยุดและวันลา นับตั้งแต่วันเริ่มงานถึงเมื่อวาน — วันนี้นับเมื่อลงงานแล้ว) × ชั่วโมงทำงานต่อวัน</template>
            <template v-else>ตำแหน่งนี้ไม่ได้กำหนดให้ลงงานทุกวัน จึงไม่คิดวันขาดและชั่วโมงที่ควรทำ</template>
            · ไม่นับรายการที่ยกเลิกและงานที่ลงล่วงหน้า
          </p>

          <h4 class="mt-3">Timesheet รายวัน</h4>
          <DataTable :value="userTimesheetDaily" paginator :rows="15" sortField="work_date" :sortOrder="-1">
            <Column field="work_date" header="วันที่" sortable style="min-width: 120px">
              <template #body="{ data }">
                {{ formatDate(data.work_date) }}
              </template>
            </Column>
            <Column field="task_name" header="งาน/โครงการ" sortable style="min-width: 200px" />
            <Column header="ขั้นตอน" style="min-width: 150px">
              <template #body="{ data }">
                <div v-if="data.steps_data && data.steps_data.length > 0" class="steps-mini">
                  <span v-for="step in data.steps_data" :key="step.id" class="step-tag step-tag-link"
                    :class="'step-status-' + (step.status || 'pending')"
                    @click="goToStepProgress(data.task_id, step.id)">
                    {{ step.step_name }}
                  </span>
                </div>
                <span v-else class="text-muted">-</span>
              </template>
            </Column>
            <Column field="category" header="หมวดหมู่" style="min-width: 120px">
              <template #body="{ data }">
                <div class="category-badges-small">
                  <span v-for="cat in parseCategoryArray(data.category)" :key="cat" class="cat-badge"
                    :style="{ backgroundColor: $accessibleBg(getCategoryColor(cat)), color: '#fff' }">{{ cat }}</span>
                </div>
              </template>
            </Column>
            <Column header="สถานะ" style="min-width: 100px">
              <template #body="{ data }">
                <template v-if="data.steps_data && data.steps_data.length > 0">
                  <div v-for="step in data.steps_data" :key="'st-' + step.id">
                    <Badge v-for="ps in (step.project_statuses || [])" :key="ps" :value="ps"
                      :style="{ backgroundColor: $accessibleBg(getStatusColor(ps)), color: '#fff', fontSize: 'max(0.75rem, var(--min-fs))' }" />
                    <span v-if="!step.project_statuses || step.project_statuses.length === 0"
                      class="text-muted">-</span>
                  </div>
                </template>
                <Badge v-else-if="data.work_status" :value="data.work_status"
                  :style="{ backgroundColor: $accessibleBg(getStatusColor(data.work_status)), color: '#fff' }" />
                <span v-else class="text-muted">-</span>
              </template>
            </Column>
            <Column field="location" header="สถานที่" style="min-width: 120px" />
            <Column field="start_time" header="เริ่ม" style="min-width: 70px" />
            <Column field="end_time" header="สิ้นสุด" style="min-width: 70px" />
            <Column field="hours" header="ชั่วโมง" sortable style="min-width: 100px">
              <template #body="{ data }">
                <span style="font-weight: 600; color: #047857">{{ formatHoursMinutes(data.hours) }}</span>
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
          <Card v-for="i in 6" :key="i" class="summary-card">
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

        <!-- Actual Data: เรื่องที่ต้องดู/ตามก่อน อยู่แถวแรก -->
        <template v-else>
          <Card class="summary-card clickable" :class="{ 'card-alert': notWorkingUsers.length > 0 }" @click="showWorkingDialog = true">
            <template #content>
              <div class="summary-content">
                <i class="pi pi-user-minus summary-icon" :style="{ color: notWorkingUsers.length > 0 ? '#dc2626' : '#047857' }"></i>
                <div class="summary-info">
                  <h3><CountUp :value="notWorkingUsers.length" /></h3>
                  <p>Engineer ยังไม่ลงงานวันนี้</p>
                  <small class="card-hint">ลงแล้ว {{ stats.workingToday }}/{{ stats.totalEngineers }} คน (ไม่นับคนที่ลา)</small>
                </div>
              </div>
            </template>
          </Card>

          <Card class="summary-card clickable" @click="showLeavesDialog = true">
            <template #content>
              <div class="summary-content">
                <i class="pi pi-calendar-times summary-icon" style="color: #b45309"></i>
                <div class="summary-info">
                  <h3><CountUp :value="stats.todayLeaves" /></h3>
                  <p>ลางานวันนี้</p>
                  <small class="card-hint">ใบลาที่อนุมัติแล้วครอบคลุมวันนี้</small>
                </div>
              </div>
            </template>
          </Card>

          <Card class="summary-card clickable" :class="{ 'card-alert': stats.overdue > 0 }" @click="showOverdueDialog = true">
            <template #content>
              <div class="summary-content">
                <i class="pi pi-exclamation-triangle summary-icon" style="color: #dc2626"></i>
                <div class="summary-info">
                  <h3><CountUp :value="stats.overdue" /></h3>
                  <p>โครงการเลยกำหนดตามสัญญา</p>
                  <small class="card-hint">ยังไม่เสร็จ และเลยวันสิ้นสุดโครงการแล้ว</small>
                </div>
              </div>
            </template>
          </Card>

          <Card class="summary-card clickable" @click="showDueSoonDialog = true">
            <template #content>
              <div class="summary-content">
                <i class="pi pi-clock summary-icon" style="color: #1d4ed8"></i>
                <div class="summary-info">
                  <h3><CountUp :value="stats.dueSoon" /></h3>
                  <p>โครงการครบกำหนดใน 7 วัน</p>
                  <small class="card-hint">วันสิ้นสุดโครงการตั้งแต่วันนี้ถึงอีก 7 วัน</small>
                </div>
              </div>
            </template>
          </Card>

          <Card class="summary-card clickable" @click="showActiveTasksDialog = true">
            <template #content>
              <div class="summary-content">
                <i class="pi pi-briefcase summary-icon" style="color: #7c3aed"></i>
                <div class="summary-info">
                  <h3><CountUp :value="stats.activeTasks" /></h3>
                  <p>โครงการที่กำลังดำเนินการ</p>
                  <small class="card-hint">มี workflow {{ stats.activeWithWorkflow }} · ยังไม่มี workflow {{ stats.activeWithoutWorkflow }}</small>
                </div>
              </div>
            </template>
          </Card>

          <Card class="summary-card clickable" @click="showCompletedDialog = true">
            <template #content>
              <div class="summary-content">
                <i class="pi pi-check-circle summary-icon" style="color: #15803d"></i>
                <div class="summary-info">
                  <h3><CountUp :value="stats.completedTasks" /></h3>
                  <p>โครงการเสร็จสิ้น</p>
                  <small class="card-hint">ทุก step เสร็จ หรือสถานะโครงการเป็นเสร็จ</small>
                </div>
              </div>
            </template>
          </Card>
        </template>
      </div>

      <!-- ต้องดูวันนี้: รายชื่อคนที่ยังไม่ลงงาน + ข้อมูลทั่วไป -->
      <div v-if="!loading" class="attention-strip mb-4">
        <template v-if="notWorkingUsers.length">
          <span class="attention-label"><i class="pi pi-exclamation-circle"></i> ยังไม่ลงงานวันนี้:</span>
          <button v-for="u in notWorkingUsers.slice(0, 12)" :key="u.id" type="button" class="attention-chip"
            @click="selectedUserId = u.id; showUserDialog = true">
            {{ u.firstname }} {{ u.lastname }}{{ u.nickname ? ` (${u.nickname})` : '' }}
          </button>
          <button v-if="notWorkingUsers.length > 12" type="button" class="attention-more" @click="showWorkingDialog = true">
            +{{ notWorkingUsers.length - 12 }} คน
          </button>
        </template>
        <span v-else class="attention-ok"><i class="pi pi-check-circle"></i> {{ isWorkdayToday ? 'Engineer ที่ไม่ได้ลาลงงานวันนี้ครบแล้ว' : 'วันนี้เป็นวันหยุด ไม่ต้องลงงาน' }}</span>
        <span class="attention-meta">ผู้ใช้งานทั้งหมด {{ stats.totalUsers }} คน · รถกำลังใช้งาน {{ stats.activeCars }} คัน</span>
      </div>

      <!-- วันนี้ใครทำอะไร ที่ไหน + งานที่ถืออยู่ -->
      <TeamTodayBoard v-if="activeUsersList.length" :users="activeUsersList" :workload-by-user="workloadByUser"
        :leaves="allLeaves" :holidays="holidaySet" :leave-type-labels="leaveTypeLabels" :refresh-key="lastLoadedAt"
        @select-user="selectedUser = $event" @open-step="goToStepProgress" />

      <!-- Charts with Swipe Support -->
      <div class="charts-container mb-4" v-if="!loading">
        <div class="charts-wrapper" ref="chartsWrapper" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
          @touchend="handleTouchEnd">
          <Card class="chart-card" :class="{ active: currentChart === 0 }">
            <template #content>
              <h3>จำนวนวันลาของพนักงาน ปี {{ currentYear }} <small class="chart-sub">(15 คนที่ลามากที่สุด · กดแท่งเพื่อดูรายคน)</small></h3>
              <canvas ref="leaveChart"></canvas>
            </template>
          </Card>

          <Card class="chart-card" :class="{ active: currentChart === 1 }">
            <template #content>
              <h3>สถานะโครงการที่กำลังดำเนินการ <small class="chart-sub">(สูตรเดียวกับหน้าโครงการ · กดแท่งเพื่อดูรายการ)</small></h3>
              <canvas ref="taskChart"></canvas>
            </template>
          </Card>
        </div>

        <!-- Chart Navigation Dots (Mobile) -->
        <div class="chart-dots">
          <span v-for="i in 2" :key="i" :class="{ active: currentChart === i - 1 }"
            @click="currentChart = i - 1"></span>
        </div>
      </div>

      <!-- Work Statistics -->
      <Card>
        <template #content>
          <div class="stats-header mb-3">
            <h3>สถิติการลงงานของพนักงาน</h3>
            <div style="display:flex;gap:0.6rem;align-items:center;flex-wrap:wrap">
              <InputText v-model="statsSearch" placeholder="ค้นหา ชื่อ / ชื่อเล่น / โครงการ / step..." style="font-size:max(0.85rem, var(--min-fs));min-width:min(260px,100%);flex:1 1 200px;height:36px" />
              <Dropdown v-model="selectedStatsMonth" :options="statsMonthOptions" optionLabel="label" optionValue="value" style="min-width:110px" aria-label="เดือน" />
              <Dropdown v-model="selectedStatsYear" :options="statsYearOptions" optionLabel="label" optionValue="value" style="min-width:110px" aria-label="ปี" />
            </div>
          </div>
          <p class="calc-note">
            คิดวันขาดเฉพาะ Engineer · วันที่ควรลงงาน = จ.–ศ. ไม่รวมวันหยุดและวันลาทั้งวัน นับตั้งแต่วันเริ่มงานถึงเมื่อวาน (วันนี้นับเมื่อลงงานแล้ว)
            · ควรทำ = ชั่วโมงทำงานต่อวันของแต่ละคน (หักชั่วโมงลาบางส่วน) · ลงหลัง 10:00 = จำนวนวันที่รายการแรกถูกบันทึกหลัง 10:00 น. ของวันนั้น
            · ไม่นับรายการที่ยกเลิกและงานที่ลงล่วงหน้า · เลื่อนเมาส์ที่ช่อง "ขาด" เพื่อดูวันที่
          </p>
          <DataTable :value="workStatisticsFiltered" :loading="loading" paginator :rows="10" sortField="missingDays"
            :sortOrder="-1" v-model:expandedRows="expandedRows" dataKey="userId">
            <Column :expander="true" style="width: 3rem" />
            <Column field="userName" header="ชื่อพนักงาน" sortable style="min-width: 150px">
              <template #body="{ data }">
                <span class="clickable-name" @click="selectedUserId = data.userId; showUserDialog = true">
                  {{ data.userName }}
                </span>
              </template>
            </Column>
            <Column field="department" header="แผนก" sortable style="min-width: 100px" />
            <Column field="loggedDays" header="ลงงาน (วัน)" sortable style="min-width: 90px">
              <template #body="{ data }">
                <span v-if="data.required">{{ data.loggedDays }}/{{ data.requiredDays }}</span>
                <span v-else class="text-muted" v-tooltip.top="'ตำแหน่งนี้ไม่ได้กำหนดให้ลงงานทุกวัน'">{{ data.loggedDays }} <small>(ไม่บังคับ)</small></span>
              </template>
            </Column>
            <Column field="missingDays" header="ขาด" sortable style="min-width: 70px">
              <template #body="{ data }">
                <span v-if="data.missingDays === null" class="text-muted">—</span>
                <span v-else-if="data.missingDays > 0" class="missing-days" v-tooltip.top="missingTooltip(data)">{{ data.missingDays }} วัน</span>
                <span v-else class="ok-days">0</span>
              </template>
            </Column>
            <Column field="lateDays" header="ลงหลัง 10:00" sortable style="min-width: 90px">
              <template #body="{ data }">
                <span v-if="data.lateDays === null" class="text-muted">—</span>
                <span v-else :class="data.lateDays > 0 ? 'late-days' : 'ok-days'">{{ data.lateDays }} วัน</span>
              </template>
            </Column>
            <Column field="totalHours" header="ทำจริง" sortable style="min-width: 100px">
              <template #body="{ data }">
                <span style="font-weight: 600; color: #1d4ed8; white-space: nowrap">{{ formatHoursMinutes(data.totalHours) }}</span>
              </template>
            </Column>
            <Column field="expectedHours" header="ควรทำ" sortable style="min-width: 100px">
              <template #body="{ data }">
                <span v-if="data.expectedHours === null" class="text-muted">—</span>
                <span v-else style="font-weight: 600; color: #b45309; white-space: nowrap">{{ formatHoursMinutes(data.expectedHours) }}</span>
              </template>
            </Column>
            <Column field="percentage" header="%" sortable style="min-width: 70px">
              <template #body="{ data }">
                <span v-if="data.percentage === null" class="text-muted">—</span>
                <span v-else :style="{ fontWeight: 600, color: data.percentage >= 100 ? '#047857' : '#dc2626' }">{{ data.percentage }}%</span>
              </template>
            </Column>
            <Column field="taskCount" header="รายการ" sortable style="min-width: 70px" />
            <Column header="Workload" style="min-width: 220px">
              <template #body="{ data }">
                <span v-if="!data.workload || data.workload.length === 0" class="text-muted" style="font-size:max(0.8rem, var(--min-fs))">ไม่มีงาน</span>
                <div v-else class="workload-dropdown-wrap">
                  <button class="wl-toggle" @click.stop="openWorkloadUserId = openWorkloadUserId === data.userId ? null : data.userId">
                    <span>โครงการ {{ data.workload.length }} รายการ</span>
                    <i :class="openWorkloadUserId === data.userId ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" style="font-size:max(0.7rem, var(--min-fs));margin-left:auto"></i>
                  </button>
                  <div v-if="openWorkloadUserId === data.userId" class="wl-dropdown">
                    <div v-for="proj in data.workload" :key="proj.taskId" class="project-group">
                      <div class="project-header" @click.stop="proj._expanded = !proj._expanded">
                        <div class="project-info">
                          <span class="project-name">{{ proj.taskName }}</span>
                          <span class="project-progress">{{ proj.progress }}% ({{ proj.completedSteps }}/{{ proj.totalSteps }})</span>
                        </div>
                        <div class="progress-bar">
                          <div class="progress-fill" :style="{ width: proj.progress + '%' }"></div>
                        </div>
                        <i :class="proj._expanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" style="font-size:max(0.65rem, var(--min-fs));color:#525f70"></i>
                      </div>
                      <div v-if="proj._expanded" class="steps-list">
                        <div v-for="step in proj.steps" :key="step.stepId" class="workload-item"
                          :class="'wl-' + step.stepStatus"
                          @click="goToStepProgress(step.taskId, step.stepId)"
                          :title="step.stepName">
                          <span class="wl-dot"></span>
                          <div class="wl-info">
                            <div class="wl-step">{{ step.stepOrder }}. {{ step.stepName }}</div>
                            <div v-if="step.projectStatuses && step.projectStatuses.length" class="wl-status-badges">
                              <span v-for="status in step.projectStatuses" :key="status" class="status-mini" :style="{ backgroundColor: $accessibleBg(getStatusColor(status)) }">{{ status }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Column>

            <template #expansion="{ data }">
              <div class="task-breakdown">
                <h4>รายละเอียดงานทั้งหมด</h4>
                <DataTable :value="data.taskDetails" class="p-datatable-sm">
                  <Column field="taskName" header="ชื่องาน" style="min-width: 200px" />
                  <Column field="hours" header="ชั่วโมง" sortable>
                    <template #body="{ data: task }">
                      <span style="font-weight: 600; color: #047857">{{ formatHoursMinutes(task.hours) }}</span>
                    </template>
                  </Column>
                  <Column field="percentage" header="สัดส่วน" sortable>
                    <template #body="{ data: task }">
                      <div style="display: flex; align-items: center; gap: 0.5rem">
                        <div style="flex: 1; background: #e9ecef; border-radius: 4px; height: 20px; overflow: hidden">
                          <div :style="{ width: task.percentage + '%', background: '#2563eb', height: '100%' }"></div>
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

  <UserInfoDialog v-if="showUserDialog" :visible="true" @update:visible="showUserDialog = false"
    :userId="selectedUserId" />

  <!-- Task Status Dialog -->
  <Dialog v-model:visible="showTaskStatusDialog" modal :header="'โครงการสถานะ: ' + statusLabel(selectedTaskStatus)"
    :style="{ width: '90vw', maxWidth: '900px' }" :draggable="false" position="center">
    <DataTable :value="filteredTasksByStatus" paginator :rows="10" sortField="task_name" :sortOrder="1">
      <Column field="task_name" header="ชื่องาน/โครงการ" sortable style="min-width: 200px" />
      <Column field="so_number" header="SO Number" sortable style="min-width: 120px" />
      <Column field="category" header="หมวดหมู่" style="min-width: 150px">
        <template #body="{ data }">
          <div class="category-badges-small">
            <span v-for="cat in parseCategoryArray(data.category)" :key="cat" class="cat-badge"
              :style="{ backgroundColor: $accessibleBg(getCategoryColor(cat)), color: '#fff' }">{{ cat }}</span>
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

  <!-- Overdue Projects Dialog -->
  <Dialog v-model:visible="showOverdueDialog" modal header="โครงการที่เลยกำหนดตามสัญญา"
    :style="{ width: '90vw', maxWidth: '900px' }" :draggable="false" position="center">
    <DataTable :value="overdueProjects" paginator :rows="10" sortField="project_end_date" :sortOrder="1">
      <Column field="task_name" header="ชื่องาน/โครงการ" sortable style="min-width: 200px" />
      <Column field="so_number" header="SO Number" sortable style="min-width: 120px" />
      <Column field="project_end_date" header="กำหนดส่ง" sortable style="min-width: 120px">
        <template #body="{ data }">
          {{ data.project_end_date ? formatDate(data.project_end_date) : '-' }}
        </template>
      </Column>
      <Column header="เกินกำหนด (วัน)" sortable style="min-width: 100px">
        <template #body="{ data }">
          <span class="text-red-500 font-bold">{{ calcOverdueDays(data.project_end_date) }}</span>
        </template>
      </Column>
    </DataTable>
  </Dialog>


  <!-- Working Today Dialog -->
  <Dialog v-model:visible="showWorkingDialog" modal header="การลงงานของ Engineer วันนี้ (ไม่นับคนที่ลา)"
    :style="{ width: '90vw', maxWidth: '800px' }" :draggable="false" position="center">
    <div class="work-status-section">
      <h4 style="color: #047857; margin-bottom: 10px;">✅ ลงงานแล้ว ({{ workingTodayUsers.length }})</h4>
      <DataTable :value="workingTodayUsers" :rows="5" :paginator="workingTodayUsers.length > 5">
        <Column field="firstname" header="ชื่อ" sortable />
        <Column field="lastname" header="นามสกุล" sortable />
        <Column field="department" header="แผนก" sortable />
      </DataTable>
    </div>
    <div class="work-status-section" style="margin-top: 20px;">
      <h4 style="color: #dc2626; margin-bottom: 10px;">❌ ยังไม่ได้ลงงาน ({{ notWorkingUsers.length }})</h4>
      <DataTable :value="notWorkingUsers" :rows="5" :paginator="notWorkingUsers.length > 5">
        <Column field="firstname" header="ชื่อ" sortable />
        <Column field="lastname" header="นามสกุล" sortable />
        <Column field="department" header="แผนก" sortable />
      </DataTable>
    </div>
  </Dialog>

  <!-- Leaves Today Dialog -->
  <Dialog v-model:visible="showLeavesDialog" modal header="ลางานวันนี้"
    :style="{ width: '90vw', maxWidth: '700px' }" :draggable="false" position="center">
    <DataTable :value="leavesTodayList" paginator :rows="10">
      <Column header="ชื่อ-นามสกุล">
        <template #body="{ data }">{{ data.firstname }} {{ data.lastname }}{{ data.nickname ? ` (${data.nickname})` : '' }}</template>
      </Column>
      <Column field="leave_type" header="ประเภทการลา">
        <template #body="{ data }">{{ leaveTypeLabels[data.leave_type] || data.leave_type }}</template>
      </Column>
    </DataTable>
  </Dialog>

  <!-- Due Soon Dialog -->
  <Dialog v-model:visible="showDueSoonDialog" modal header="โครงการครบกำหนดใน 7 วัน"
    :style="{ width: '90vw', maxWidth: '900px' }" :draggable="false" position="center">
    <DataTable :value="dueSoonProjects" paginator :rows="10" sortField="project_end_date" :sortOrder="1">
      <Column field="task_name" header="ชื่องาน/โครงการ" sortable style="min-width: 200px" />
      <Column field="so_number" header="SO Number" sortable style="min-width: 120px" />
      <Column field="project_end_date" header="กำหนดส่ง" sortable style="min-width: 120px">
        <template #body="{ data }">{{ data.project_end_date ? formatDate(data.project_end_date) : '-' }}</template>
      </Column>
    </DataTable>
  </Dialog>

  <!-- Active Tasks Dialog -->
  <Dialog v-model:visible="showActiveTasksDialog" modal header="โครงการที่กำลังดำเนินการ"
    :style="{ width: '90vw', maxWidth: '900px' }" :draggable="false" position="center">
    <DataTable :value="activeTasksList" paginator :rows="10" sortField="task_name" :sortOrder="1">
      <Column field="task_name" header="ชื่องาน/โครงการ" sortable style="min-width: 200px" />
      <Column field="so_number" header="SO Number" sortable style="min-width: 120px" />
      <Column field="project_end_date" header="กำหนดส่ง" sortable style="min-width: 120px">
        <template #body="{ data }">{{ data.project_end_date ? formatDate(data.project_end_date) : '-' }}</template>
      </Column>
    </DataTable>
  </Dialog>

  <!-- Completed Tasks Dialog -->
  <Dialog v-model:visible="showCompletedDialog" modal header="โครงการเสร็จสิ้น"
    :style="{ width: '90vw', maxWidth: '900px' }" :draggable="false" position="center">
    <DataTable :value="completedTasksList" paginator :rows="10" sortField="task_name" :sortOrder="1">
      <Column field="task_name" header="ชื่องาน/โครงการ" sortable style="min-width: 200px" />
      <Column field="so_number" header="SO Number" sortable style="min-width: 120px" />
      <Column field="project_end_date" header="กำหนดส่ง" sortable style="min-width: 120px">
        <template #body="{ data }">{{ data.project_end_date ? formatDate(data.project_end_date) : '-' }}</template>
      </Column>
    </DataTable>
  </Dialog>
</template>

<script setup>
/* eslint-disable no-unused-vars */
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { Chart } from 'chart.js/auto'
import axios from '@/utils/axiosConfig'
import userService from '@/services/userService'
import UserInfoDialog from '@/components/UserInfoDialog.vue'
import CountUp from '@/components/CountUp.vue'
import TeamTodayBoard from './TeamTodayBoard.vue'
import { getCurrentStatusStep, projectState } from '@/utils/projectStatus'
import { recordHours, dayHours, attendance } from '@/utils/workTime'
import { buildWorkloadByUser, isRequiredToLog } from '@/utils/workload'
import { toDateKey } from '@/utils/dateUtils'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { usePermissions } from '@/composables/usePermissions'
import { accessibleBg } from '@/utils/color'

const { handleError } = useErrorHandler()
const router = useRouter()
const toast = useToast()
const { hasAccess } = usePermissions()

// ไปหน้า "ขั้นตอนการดำเนินการโครงการ" ได้เฉพาะ role ที่ถูกติ๊กสิทธิ์หน้านั้น (ไม่งั้น route guard จะเด้งไปหน้าอื่นโดยไม่บอกเหตุผล)
const goToStepProgress = (taskId, stepId) => {
  if (!hasAccess('/project-progress')) {
    toast.add({ severity: 'warn', summary: 'ไม่มีสิทธิ์เข้าถึง', detail: 'บัญชีนี้ไม่มีสิทธิ์เปิดหน้า "ขั้นตอนการดำเนินการโครงการ"', life: 3000 })
    return
  }
  router.push({ path: '/project-progress', query: { taskId, stepId } })
}
const loading = ref(false)
const leaveTypeColors = ref({})
// ค่าที่เก็บในใบลาคือ "รหัส" ประเภท (เช่น sick, vacation) — แสดงเป็นชื่อประเภทที่ตั้งไว้ (ลาป่วย, ลาพักร้อน) ไม่ใช่รหัสดิบ
const leaveTypeLabels = ref({})
const showUserDialog = ref(false)
const selectedUserId = ref(null)

// ===== กติกาการนับ (ใช้ทั้งภาพรวมและรายคน) =====
// เวลาทำงานเมื่อไม่ได้ตั้งค่าไว้ (เหมือนหน้าแจ้งลา)
const DEFAULT_WORK_HOURS = { start_time: '09:00', end_time: '18:00', lunch_start: '12:00', lunch_end: '13:00' }
const todayKey = () => toDateKey(new Date())
const pad2 = (n) => String(n).padStart(2, '0')

// Task status dialog
const allTasks = ref([])
const workingTodayUsers = ref([])
const notWorkingUsers = ref([])
const isWorkdayToday = ref(true)
const leavesTodayList = ref([])
const showTaskStatusDialog = ref(false)
const showOverdueDialog = ref(false)
const showWorkingDialog = ref(false)
const showLeavesDialog = ref(false)
const showDueSoonDialog = ref(false)
const showActiveTasksDialog = ref(false)
const showCompletedDialog = ref(false)
const selectedTaskStatus = ref(null)

// ===== สถานะโครงการ (สูตรเดียวกับหน้า "โครงการ") =====
const STATUS_NO_STATUS = '__no_status__'
const STATUS_NO_WORKFLOW = '__no_workflow__'
const statusLabelMap = ref({})
// คีย์สถานะปัจจุบันของโครงการ (step หนึ่งตั้งได้หลายสถานะ → โครงการนับในทุกสถานะนั้น)
const taskStatusKeys = (t) => {
  if (t.steps && t.steps.length > 0) {
    const current = getCurrentStatusStep(t.steps)
    return current ? current.project_statuses : [STATUS_NO_STATUS]
  }
  return [t.status && t.status !== '-' ? t.status : STATUS_NO_WORKFLOW]
}
const statusLabel = (key) => {
  if (key === STATUS_NO_STATUS) return 'มี workflow แต่ยังไม่ระบุสถานะ'
  if (key === STATUS_NO_WORKFLOW) return 'ยังไม่มี workflow'
  return statusLabelMap.value[key] || key
}

const filteredTasksByStatus = computed(() => {
  if (!selectedTaskStatus.value) return []
  return allTasks.value.filter(t => t._state === 'active' && taskStatusKeys(t).includes(selectedTaskStatus.value))
})

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null
  return new Date(String(dateStr).split('T')[0] + 'T00:00:00')
}

const overdueProjects = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return allTasks.value.filter(t => t._state === 'active' && t.project_end_date && parseLocalDate(t.project_end_date) < today)
})

// ครบกำหนดภายใน 7 วันข้างหน้า (รวมวันนี้)
const dueSoonProjects = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekFromNow = new Date(today)
  weekFromNow.setDate(weekFromNow.getDate() + 7)
  return allTasks.value.filter(t => {
    if (t._state !== 'active' || !t.project_end_date) return false
    const endDate = parseLocalDate(t.project_end_date)
    return endDate >= today && endDate <= weekFromNow
  })
})

const activeTasksList = computed(() => allTasks.value.filter(t => t._state === 'active'))
const completedTasksList = computed(() => allTasks.value.filter(t => t._state === 'completed'))

// User filter
const selectedUser = ref(null)
const userOptions = ref([])
const userNameMap = ref({})
const allLeaves = ref([])
const allDailyWork = ref([])
const activeUsersList = ref([])
const holidaySet = ref(new Set())
const workHoursByUser = ref({})
const workloadByUser = ref({})
const lastLoadedAt = ref(null)
const lastLoadedAtText = computed(() => lastLoadedAt.value
  ? lastLoadedAt.value.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
  : '')
const currentYear = new Date().getFullYear()
const userLeaveChart = ref(null)
let userLeaveChartInstance = null

// รายการลงงานที่นับ: ไม่รวมที่ยกเลิก และไม่รวมงานที่ลงล่วงหน้า (วันที่ยังมาไม่ถึง) — จัดกลุ่ม ผู้ใช้ → วัน → รายการ
const workByUserDay = computed(() => {
  const today = todayKey()
  const map = new Map()
  for (const w of allDailyWork.value) {
    if (!w.user_id || w.work_status === 'cancelled') continue
    const day = String(w.work_date || '').slice(0, 10)
    if (!day || day > today) continue
    if (!map.has(w.user_id)) map.set(w.user_id, new Map())
    const days = map.get(w.user_id)
    if (!days.has(day)) days.set(day, [])
    days.get(day).push(w)
  }
  return map
})

const approvedLeavesByUser = computed(() => {
  const map = {}
  for (const l of allLeaves.value) {
    if (l.status !== 'approved' || !l.user_id) continue
    if (!map[l.user_id]) map[l.user_id] = []
    map[l.user_id].push(l)
  }
  return map
})

// สรุปการลงงานของผู้ใช้หนึ่งคนในช่วง from–to ('YYYY-MM-DD')
const summarizeUser = (user, from, to) => {
  const today = todayKey()
  const end = to < today ? to : today
  const days = workByUserDay.value.get(user.id) || new Map()
  let totalHours = 0
  let taskCount = 0
  let lateDays = 0
  let hasCreatedAt = false
  const taskHours = {}
  const loggedDays = new Set()
  for (const [day, records] of days) {
    if (day < from || day > end) continue
    loggedDays.add(day)
    taskCount += records.length
    const { total, shares } = dayHours(records)
    totalHours += total
    shares.forEach((hours, record) => {
      const name = record.task_name || 'ไม่ระบุ'
      taskHours[name] = (taskHours[name] || 0) + hours
    })
    // ลงหลัง 10:00 = รายการแรกของวันนั้นถูกบันทึกหลัง 10:00 น. ของวันนั้น (รวมการลงย้อนหลัง)
    const created = records.map(r => new Date(r.created_at).getTime()).filter(Number.isFinite)
    if (created.length) {
      hasCreatedAt = true
      if (Math.min(...created) > new Date(`${day}T10:00:00`).getTime()) lateDays++
    }
  }
  const att = isRequiredToLog(user)
    ? attendance({
        from, to, today,
        joinDate: user.created_at ? toDateKey(user.created_at) : null,
        holidays: holidaySet.value,
        loggedDays,
        leaves: approvedLeavesByUser.value[user.id] || [],
        workHours: workHoursByUser.value[user.id] || DEFAULT_WORK_HOURS
      })
    : null
  const expectedHours = att ? att.expectedHours : null
  return {
    totalHours, taskCount, taskHours, loggedDays, att, expectedHours,
    lateDays: hasCreatedAt || loggedDays.size === 0 ? lateDays : null,
    percentage: expectedHours > 0 ? Math.round(totalHours / expectedHours * 100) : null
  }
}

const selectedUserObj = computed(() => activeUsersList.value.find(u => u.id === selectedUser.value) || null)
const selectedUserName = computed(() => {
  const user = userOptions.value.find(u => u.value === selectedUser.value)
  return user ? user.label : ''
})

// Period filter (หน้ารายคน)
const timesheetPeriod = ref('month')
const periodOptions = [
  { label: 'วันนี้', value: 'today' },
  { label: 'สัปดาห์นี้', value: 'week' },
  { label: 'เดือนนี้', value: 'month' },
  { label: 'ปีนี้', value: 'year' },
  { label: 'ทั้งหมด', value: 'all' }
]

const dateRange = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let startDate = today
  switch (timesheetPeriod.value) {
    case 'week': {
      // สัปดาห์เริ่มวันจันทร์
      startDate = new Date(today)
      startDate.setDate(today.getDate() - ((today.getDay() + 6) % 7))
      break
    }
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      break
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1)
      break
    case 'all':
      startDate = new Date(2000, 0, 1)
      break
  }
  return { from: toDateKey(startDate), to: toDateKey(today) }
})

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
  const user = selectedUserObj.value
  if (!user) return { totalHours: 0, expectedHours: null, percentage: null, totalTasks: 0, att: null, lateDays: null }
  const { from, to } = dateRange.value
  const s = summarizeUser(user, from, to)
  return { totalHours: s.totalHours, expectedHours: s.expectedHours, percentage: s.percentage, totalTasks: s.taskCount, att: s.att, lateDays: s.lateDays }
})

const userTimesheetDaily = computed(() => {
  if (!selectedUser.value) return []
  const { from, to } = dateRange.value
  const days = workByUserDay.value.get(selectedUser.value) || new Map()
  const rows = []
  for (const [day, records] of days) {
    if (day < from || day > to) continue
    records.forEach(w => rows.push({ ...w, hours: recordHours(w.start_time, w.end_time) }))
  }
  return rows.sort((a, b) => String(b.work_date).localeCompare(String(a.work_date)))
})

const parseCategoryArray = (category) => {
  if (!category) return []
  if (Array.isArray(category)) return category
  return category.split(',').map(c => c.trim()).filter(c => c)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}

const calcOverdueDays = (dateStr) => {
  if (!dateStr) return 0
  const endDate = parseLocalDate(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today - endDate) / (1000 * 60 * 60 * 24))
}

// รายการวันที่ขาดสำหรับ tooltip (สูงสุด 15 วันล่าสุด)
const missingTooltip = (row) => {
  if (!row.missingDates || row.missingDates.length === 0) return ''
  const list = row.missingDates.slice(-15).map(d => parseLocalDate(d).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' }))
  const more = row.missingDates.length > 15 ? ` และอีก ${row.missingDates.length - 15} วัน` : ''
  return `วันที่ยังไม่ลงงาน: ${list.join(', ')}${more}`
}

// Watch selectedUser: handle both select and clear (X button)
watch(selectedUser, async (val) => {
  await nextTick()
  if (val) {
    await nextTick()
    renderUserLeaveChart()
  } else {
    // User cleared - re-render main charts
    await nextTick()
    await nextTick()
    renderCharts(allLeaves.value, allTasks.value)
  }
})

const onUserChange = async () => { /* handled by watch */ }

// Re-render chart when leave data changes (e.g. after data load)
watch(userLeaveData, async () => {
  if (selectedUser.value) {
    await nextTick()
    renderUserLeaveChart()
  }
})

const clearUserFilter = () => {
  selectedUser.value = null
}

const renderUserLeaveChart = () => {
  if (userLeaveChartInstance) userLeaveChartInstance.destroy()
  if (!userLeaveChart.value || Object.keys(userLeaveData.value).length === 0) return

  const labels = Object.keys(userLeaveData.value)
  const data = Object.values(userLeaveData.value)
  const colors = labels.map((type, i) => leaveTypeColors.value[type] || FALLBACK_COLORS[i % FALLBACK_COLORS.length])

  userLeaveChartInstance = new Chart(userLeaveChart.value, {
    type: 'doughnut',
    data: {
      labels: labels.map(l => leaveTypeLabels.value[l] || l),
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
  totalEngineers: 0,
  todayLeaves: 0,
  activeCars: 0,
  activeTasks: 0,
  activeWithWorkflow: 0,
  activeWithoutWorkflow: 0,
  completedTasks: 0,
  dueSoon: 0,
  overdue: 0
})

// ===== สถิติการลงงาน (ตามปี/เดือนที่เลือก) =====
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const openWorkloadUserId = ref(null)
const expandedRows = ref([])
const selectedStatsYear = ref(new Date().getFullYear())
const selectedStatsMonth = ref(new Date().getMonth() + 1) // 0 = ทั้งปี
const statsYearOptions = computed(() => {
  const thisYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({ label: String(thisYear - i), value: thisYear - i }))
})
const statsMonthOptions = [{ label: 'ทั้งปี', value: 0 }, ...THAI_MONTHS.map((m, i) => ({ label: m, value: i + 1 }))]
const statsPeriod = computed(() => {
  const y = selectedStatsYear.value
  const m = selectedStatsMonth.value
  if (!m) return { from: `${y}-01-01`, to: `${y}-12-31` }
  return { from: `${y}-${pad2(m)}-01`, to: `${y}-${pad2(m)}-${pad2(new Date(y, m, 0).getDate())}` }
})
const statsSearch = ref('')

const workStatistics = computed(() => {
  const { from, to } = statsPeriod.value
  const isCurrentYear = selectedStatsYear.value === new Date().getFullYear()
  return activeUsersList.value
    .filter(u => {
      if (isRequiredToLog(u)) return true
      const days = workByUserDay.value.get(u.id)
      if (days && [...days.keys()].some(d => d >= from && d <= to)) return true
      return isCurrentYear && (workloadByUser.value[u.id] || []).length > 0
    })
    .map(u => {
      const s = summarizeUser(u, from, to)
      const taskDetails = Object.entries(s.taskHours)
        .map(([taskName, hours]) => ({ taskName, hours, percentage: s.totalHours > 0 ? (hours / s.totalHours) * 100 : 0 }))
        .sort((a, b) => b.hours - a.hours)
      return {
        userId: u.id,
        userName: `${u.firstname} ${u.lastname}`,
        nickname: u.nickname || '',
        department: u.department || 'N/A',
        required: !!s.att,
        requiredDays: s.att ? s.att.requiredDays : null,
        loggedDays: s.att ? s.att.loggedDays : s.loggedDays.size,
        missingDays: s.att ? s.att.missingDays : null,
        missingDates: s.att ? s.att.missingDates : [],
        lateDays: s.lateDays,
        totalHours: s.totalHours,
        expectedHours: s.expectedHours,
        percentage: s.percentage,
        taskCount: s.taskCount,
        taskDetails,
        workload: workloadByUser.value[u.id] || []
      }
    })
})

const workStatisticsFiltered = computed(() => {
  const q = statsSearch.value.trim().toLowerCase()
  if (!q) return workStatistics.value
  return workStatistics.value.filter(r => {
    if (r.userName?.toLowerCase().includes(q)) return true
    if (r.nickname?.toLowerCase().includes(q)) return true
    if (r.department?.toLowerCase().includes(q)) return true
    return r.workload?.some(proj =>
      proj.taskName?.toLowerCase().includes(q) ||
      proj.steps?.some(s => s.stepName?.toLowerCase().includes(q))
    )
  })
})
const leaveChart = ref(null)
const taskChart = ref(null)
let leaveChartInstance = null
let taskChartInstance = null
const workStatusColors = ref({})
const categoryColors = ref({})
// สีสำรองเมื่อประเภทลาไม่ได้ตั้งสีไว้ (เดิมสุ่มสีใหม่ทุกครั้งที่โหลด)
const FALLBACK_COLORS = ['#2563eb', '#d97706', '#059669', '#7c3aed', '#dc2626', '#0891b2', '#db2777', '#4b5563']

onMounted(async () => {
  await Promise.all([loadLeaveTypeColors(), loadWorkStatusColors(), loadCategoryColors()])
  loadData()
  document.addEventListener('click', closeWorkloadDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeWorkloadDropdown)
})

const closeWorkloadDropdown = () => {
  openWorkloadUserId.value = null
}

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
    const labelMap = {}
    response.data.forEach(type => {
      colorMap[type.value] = type.color
      labelMap[type.value] = type.label
    })
    leaveTypeColors.value = colorMap
    leaveTypeLabels.value = labelMap
  } catch (error) {
    handleError(error, {
      customMessage: 'ไม่สามารถโหลดสีประเภทการลาได้',
      showToast: false
    })
  }
}

const loadWorkStatusColors = async () => {
  try {
    const response = await axios.get('/api/settings/statuses')
    const colorMap = { 'ไม่ระบุ': '#9e9e9e' }
    const labelMap = {}
    response.data.forEach(status => {
      colorMap[status.value] = status.color
      // ตัด emoji ออกจากชื่อสถานะ (เหมือนหน้า "โครงการ")
      if (status.label) labelMap[status.value] = status.label.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}-\u{3299}]/gu, '').trim()
    })
    workStatusColors.value = colorMap
    statusLabelMap.value = labelMap
  } catch (error) {
    workStatusColors.value = {
      'pending': '#f59e0b',
      'in_progress': '#2563eb',
      'completed': '#10b981',
      'cancelled': '#ef4444',
      'ไม่ระบุ': '#9e9e9e'
    }
  }
}

const loadCategoryColors = async () => {
  try {
    const response = await axios.get('/api/settings/categories')
    const colorMap = {}
    response.data.forEach(cat => {
      colorMap[cat.value] = cat.color
    })
    categoryColors.value = colorMap
  } catch (error) {
    categoryColors.value = {}
  }
}

const getCategoryColor = (cat) => {
  return accessibleBg(categoryColors.value[cat] || '#6c757d')
}

const getStatusColor = (status) => {
  return accessibleBg(workStatusColors.value[status] || '#6c757d')
}

const loadData = async () => {
  loading.value = true

  try {
    // ใช้ service layer พร้อม cache + โหลด steps ทั้งหมดในครั้งเดียว
    // silent: true - หน้านี้มี skeleton ของตัวเองแล้ว ไม่ต้องซ้อนทับ overlay เต็มจอ
    const [activeUsers, leaves, dashSummary, tasks, dailyWork, allSteps, roleWorkHours, userWorkHours, holidays] = await Promise.all([
      userService.getActiveUsers(true),
      axios.get('/api/leave', { silent: true }).then(r => r.data),
      axios.get('/api/settings/dashboard-summary', { silent: true }).then(r => r.data),
      axios.get('/api/tasks', { silent: true }).then(r => r.data),
      axios.get('/api/daily-work/summary', { silent: true }).then(r => r.data),
      axios.get('/api/task-steps/all', { silent: true }).then(r => r.data),
      axios.get('/api/settings/role-work-hours', { silent: true }).then(r => r.data).catch(() => []),
      axios.get('/api/settings/user-work-hours', { silent: true }).then(r => r.data).catch(() => []),
      axios.get('/api/leave/holidays', { silent: true }).then(r => r.data).catch(() => [])
    ])

    // เวลาทำงานของแต่ละคน: ตั้งรายคน > ตาม role > ค่าเริ่มต้น
    const fmtT = (t, fallback) => (t ? String(t).slice(0, 5) : fallback)
    const toWorkHours = (r) => ({
      start_time: fmtT(r.start_time, DEFAULT_WORK_HOURS.start_time),
      end_time: fmtT(r.end_time, DEFAULT_WORK_HOURS.end_time),
      lunch_start: fmtT(r.lunch_start, DEFAULT_WORK_HOURS.lunch_start),
      lunch_end: fmtT(r.lunch_end, DEFAULT_WORK_HOURS.lunch_end)
    })
    const roleHours = {}
    roleWorkHours.forEach(r => { roleHours[String(r.role || '').toLowerCase()] = toWorkHours(r) })
    const userHours = {}
    userWorkHours.forEach(u => { userHours[u.user_id] = toWorkHours(u) })
    const hoursByUser = {}
    activeUsers.forEach(u => {
      hoursByUser[u.id] = userHours[u.id] || roleHours[String(u.role || '').toLowerCase()] || DEFAULT_WORK_HOURS
    })

    // จัดกลุ่ม steps ตาม task_id แล้วคำนวณสถานะภาพรวมของแต่ละโครงการครั้งเดียว
    const stepsByTask = {}
    allSteps.forEach(step => {
      if (!stepsByTask[step.task_id]) stepsByTask[step.task_id] = []
      stepsByTask[step.task_id].push(step)
    })
    tasks.forEach(task => {
      task.steps = stepsByTask[task.id] || []
      task._state = projectState(task)
    })

    // Store for user filter
    allLeaves.value = leaves
    allDailyWork.value = dailyWork
    activeUsersList.value = activeUsers
    workHoursByUser.value = hoursByUser
    holidaySet.value = new Set(holidays.map(h => String(h.holiday_date || '').slice(0, 10)).filter(Boolean))
    workloadByUser.value = buildWorkloadByUser(tasks)
    allTasks.value = tasks
    userOptions.value = activeUsers.map(u => ({
      label: `${u.firstname} ${u.lastname}${u.nickname ? ` (${u.nickname})` : ''}`,
      value: u.id
    })).sort((a, b) => a.label.localeCompare(b.label, 'th'))

    userNameMap.value = activeUsers.reduce((acc, u) => {
      acc[u.id] = `${u.firstname} ${u.lastname}`
      return acc
    }, {})

    // Calculate stats
    stats.value.totalUsers = activeUsers.length

    const today = todayKey()
    const todayDate = new Date(today + 'T00:00:00') // Local midnight
    const weekFromNow = new Date(todayDate)
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    // ผู้ใช้ที่มีใบลาอนุมัติครอบคลุมวันนี้
    const todayLeavesUsers = leaves.filter(l => {
      if (l.status !== 'approved') return false
      if (!l.start_datetime || !l.end_datetime) return false
      const startDate = new Date(l.start_datetime)
      const endDate = new Date(l.end_datetime)
      const startLocalDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      const endLocalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
      return startLocalDate <= todayDate && endLocalDate >= todayDate
    })
    const uniqueUserIds = [...new Set(todayLeavesUsers.map(l => l.user_id))]
    stats.value.todayLeaves = uniqueUserIds.length

    // Engineer ที่ลงงานวันนี้ (ไม่นับคนที่ลาวันนี้ และไม่นับรายการที่ยกเลิก)
    const engineers = activeUsers.filter(isRequiredToLog)
    const availableEngineers = engineers.filter(u => !uniqueUserIds.includes(u.id))
    stats.value.totalEngineers = availableEngineers.length
    const uniqueWorkUserIds = [...new Set(dailyWork
      .filter(w => String(w.work_date || '').slice(0, 10) === today && w.work_status !== 'cancelled')
      .map(w => w.user_id))]
    const engineersWorked = availableEngineers.filter(u => uniqueWorkUserIds.includes(u.id))
    stats.value.workingToday = engineersWorked.length

    stats.value.activeCars = parseInt(dashSummary.active_cars) || 0

    workingTodayUsers.value = engineersWorked
    // วันหยุด/เสาร์อาทิตย์ไม่ต้องลงงาน — ไม่ขึ้นเตือนว่า "ยังไม่ลงงาน"
    isWorkdayToday.value = ![0, 6].includes(todayDate.getDay()) && !holidaySet.value.has(today)
    notWorkingUsers.value = isWorkdayToday.value ? availableEngineers.filter(u => !uniqueWorkUserIds.includes(u.id)) : []

    leavesTodayList.value = todayLeavesUsers.map(l => {
      const user = activeUsers.find(u => u.id === l.user_id) || {}
      return { ...l, firstname: user.firstname, lastname: user.lastname, nickname: user.nickname }
    })

    // สถานะโครงการ (ดู utils/projectStatus.js)
    const activeTasks = tasks.filter(t => t._state === 'active')
    stats.value.activeTasks = activeTasks.length
    stats.value.activeWithWorkflow = activeTasks.filter(t => t.steps.length > 0).length
    stats.value.activeWithoutWorkflow = activeTasks.length - stats.value.activeWithWorkflow
    stats.value.completedTasks = tasks.filter(t => t._state === 'completed').length
    stats.value.dueSoon = activeTasks.filter(t => {
      if (!t.project_end_date) return false
      const endDate = parseLocalDate(t.project_end_date)
      return endDate >= todayDate && endDate <= weekFromNow
    }).length
    stats.value.overdue = activeTasks.filter(t => t.project_end_date && parseLocalDate(t.project_end_date) < todayDate).length

    lastLoadedAt.value = new Date()
    // ปิด loading ก่อน renderCharts เพื่อให้ canvas แสดง
    loading.value = false
    await nextTick()
    await nextTick()
    renderCharts(leaves, tasks)
  } catch (error) {
    loading.value = false
    // บันทึกสาเหตุจริงลง console — เดิมกลืนข้อผิดพลาดไว้หมด เหลือแต่ toast ทั่วไป ทำให้หาต้นเหตุไม่ได้
    console.error('[Dashboard] load failed:', error)
    handleError(error, {
      customMessage: 'ไม่สามารถโหลดข้อมูล Dashboard ได้ กรุณาลองใหม่อีกครั้ง'
    })
  }
}

const formatHoursMinutes = (hours) => {
  const h = parseFloat(hours) || 0
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return mins === 60 ? `${hrs + 1} ชม. 0 นาที` : `${hrs} ชม. ${mins} นาที`
}

const renderCharts = (leaves, tasks) => {
  // Leave Chart - แสดงจำนวนวันลาของแต่ละคนแยกตามประเภท (รายปี)
  if (leaveChartInstance) leaveChartInstance.destroy()
  if (!leaveChart.value || !taskChart.value) return

  const currentYear = new Date().getFullYear()
  const users = {}
  const leaveTypes = new Set()

  leaves.forEach(l => {
    if (l.status !== 'approved') return
    const leaveYear = new Date(l.start_datetime).getFullYear()
    if (leaveYear !== currentYear) return

    const userId = l.user_id
    const userName = userNameMap.value[userId] || l.employee_name || 'ไม่ระบุ'
    const leaveType = l.leave_type || 'อื่นๆ'
    const days = parseFloat(l.total_days) || 0

    // Prefer grouping by user_id when available to enable click -> user details
    const key = (userId !== null && userId !== undefined) ? String(userId) : `unknown:${userName}`

    if (!users[key]) {
      users[key] = { total: 0, userId: userId ?? null, userName }
    }
    if (!users[key][leaveType]) {
      users[key][leaveType] = 0
    }
    users[key][leaveType] += days
    users[key].total += days
    leaveTypes.add(leaveType)
  })

  // Sort by total leave days and limit to top 15
  const sortedUserKeys = Object.entries(users)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15)
    .map(([key]) => key)

  const labels = sortedUserKeys.map(key => users[key].userName)

  const datasets = Array.from(leaveTypes).map((type, i) => ({
    label: leaveTypeLabels.value[type] || type,
    data: sortedUserKeys.map(key => users[key][type] || 0),
    backgroundColor: leaveTypeColors.value[type] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
  }))

  leaveChartInstance = new Chart(leaveChart.value, {
    type: 'bar',
    data: {
      labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          stacked: true,
          title: { display: true, text: 'จำนวนวัน' }
        },
        y: { stacked: true }
      },
      plugins: {
        legend: { display: true, position: 'top' }
      },
      onHover: (event, elements) => {
        const canvas = event?.native?.target
        if (canvas && canvas.style) {
          canvas.style.cursor = elements && elements.length ? 'pointer' : 'default'
        }
      },
      onClick: (event, elements) => {
        if (!elements || elements.length === 0) return
        const index = elements[0].index
        const key = sortedUserKeys[index]
        const userId = users[key]?.userId

        // If we have a real user_id, switch to per-user dashboard
        if (userId !== null && userId !== undefined) {
          selectedUser.value = userId
          onUserChange()
        }
      }
    }
  })

  // สถานะโครงการที่กำลังดำเนินการ (สูตรเดียวกับหน้า "โครงการ") — แท่งแนวนอนเรียงจากมากไปน้อย
  if (taskChartInstance) taskChartInstance.destroy()
  const counts = {}
  tasks.filter(t => t._state === 'active').forEach(t => {
    taskStatusKeys(t).forEach(key => { counts[key] = (counts[key] || 0) + 1 })
  })
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const statusKeys = entries.map(([key]) => key)
  const isSpecial = (key) => key === STATUS_NO_STATUS || key === STATUS_NO_WORKFLOW

  taskChartInstance = new Chart(taskChart.value, {
    type: 'bar',
    data: {
      labels: entries.map(([key, n]) => `${statusLabel(key)} (${n})`),
      datasets: [{
        label: 'จำนวนโครงการ',
        data: entries.map(([, n]) => n),
        backgroundColor: statusKeys.map(key => isSpecial(key) ? '#94a3b8' : accessibleBg(workStatusColors.value[key] || '#6c757d'))
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'จำนวนโครงการ' } }
      },
      plugins: { legend: { display: false } },
      onHover: (event, elements) => {
        const canvas = event?.native?.target
        if (canvas && canvas.style) {
          canvas.style.cursor = elements && elements.length ? 'pointer' : 'default'
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          selectedTaskStatus.value = statusKeys[elements[0].index]
          showTaskStatusDialog.value = true
        }
      }
    }
  })
}
</script>

<style scoped>
.analytics-btn {
  background-color: #2563eb !important;
  border: none !important;
  color: #fff !important;
  font-weight: 500;
  padding: 0.6rem 1.25rem;
  font-size: 0.9rem;
  border-radius: 6px;
  box-shadow: none;
}

.analytics-btn:hover {
  filter: brightness(0.93);
}

.clickable-name {
  cursor: pointer;
  color: #1d4ed8;
  font-weight: 600;
  transition: all 0.2s;
}

.clickable-name:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.dashboard-container {
  padding: 0.6rem 1rem;
  padding-bottom: 0;
  max-width: 100%;
  margin: 0 auto;

  background: transparent; /* พื้นหลังหน้ามาจาก body (theme.css) */
  height: 100%;
  overflow: auto;
}

.header-card {
  background: var(--brand-gradient);
  color: white;
  border: none;
  box-shadow: none;
}

.header-card :deep(.p-card-content) {
  padding: 0;
}

.header-card :deep(.p-card-body) {
  padding: 1.05rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
  width: 2rem !important;
  height: 2rem !important;
  background: rgba(255, 255, 255, 0.15) !important;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-filter {
  min-width: 180px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
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
  color: #1d4ed8;
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
  font-size: max(0.85rem, var(--min-fs));
}

.leave-days {
  font-weight: 600;
}

.no-data {
  color: #525f70;
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
  color: #525f70;
  font-size: max(0.85rem, var(--min-fs));
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
  font-size: max(0.75rem, var(--min-fs));
}

.steps-mini {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f1f5f9;
  border-left: 3px solid;
  border-radius: 4px;
  font-size: max(0.75rem, var(--min-fs));
}

.step-tag-link {
  cursor: pointer;
  transition: background 0.2s;
}

.step-tag-link:hover {
  background: #dbeafe;
  text-decoration: underline;
}

.step-status-completed { border-left-color: #10b981 !important; background: #f0fdf4; color: #065f46; }
.step-status-working   { border-left-color: #f59e0b !important; background: #fefce8; color: #92400e; }
.step-status-overdue   { border-left-color: #ef4444 !important; background: #fef2f2; color: #991b1b; }
.step-status-in_progress { border-left-color: #2563eb !important; background: #eff6ff; color: #1e40af; }
.step-status-pending   { border-left-color: #9ca3af !important; background: #f9fafb; color: #374151; }

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

/* คำอธิบายสั้น ๆ ว่าตัวเลขนับอย่างไร */
.card-hint {
  display: block;
  margin-top: 0.2rem;
  color: #526074;
  font-size: max(0.75rem, var(--min-fs));
  line-height: 1.35;
}

.summary-card.card-alert {
  border: 1.5px solid #fca5a5;
  background: #fef2f2;
}

.data-time {
  color: #ffffff;
  font-size: max(0.8rem, var(--min-fs));
  white-space: nowrap;
}

.refresh-btn {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.15) !important;
}

.attention-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.5rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
}

.attention-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 700;
  color: #b91c1c;
  font-size: max(0.85rem, var(--min-fs));
}

.attention-chip,
.attention-more {
  border: 1px solid #fca5a5;
  background: #fef2f2;
  color: #991b1b;
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: max(0.8rem, var(--min-fs));
  font-weight: 600;
  cursor: pointer;
}

.attention-chip:hover,
.attention-more:hover {
  background: #fee2e2;
}

.attention-ok {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #047857;
  font-weight: 700;
  font-size: max(0.85rem, var(--min-fs));
}

.attention-meta {
  margin-left: auto;
  color: #526074;
  font-size: max(0.8rem, var(--min-fs));
}

.chart-sub {
  font-weight: 500;
  color: #526074;
  font-size: max(0.75rem, var(--min-fs));
}

.calc-note {
  margin: 0 0 0.75rem;
  color: #526074;
  font-size: max(0.78rem, var(--min-fs));
  line-height: 1.5;
}

.missing-days {
  font-weight: 700;
  color: #b91c1c;
  cursor: help;
  border-bottom: 1px dashed #b91c1c;
}

.late-days {
  font-weight: 600;
  color: #b45309;
}

.ok-days {
  color: #047857;
  font-weight: 600;
}

.user-ts-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin-bottom: 0.75rem;
}

.user-ts-head h3 {
  margin: 0;
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
  background: #2563eb;
  width: 24px;
  border-radius: 4px;
}

/* Desktop: Show grid */
.summary-card.clickable {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card.clickable:hover {
  border-color: #bcd6f6;
}
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

  /* แบนเนอร์: ชื่อหน้า + (ปุ่ม Analytics, เลือกพนักงาน) เดิมอยู่แถวเดียว ล้นกรอบขวาบนมือถือ → ให้ตัดลงบรรทัดใหม่และใช้เต็มความกว้าง */
  .header-content {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .header-right {
    width: 100%;
    flex-wrap: wrap;
  }

  .header-right .analytics-btn {
    margin-right: 0 !important;
  }

  .header-right .user-filter {
    flex: 1 1 10rem;
    min-width: 0;
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
    font-size: max(0.8rem, var(--min-fs));
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
    overflow-y: visible;
  }

  :deep(.p-datatable) {
    font-size: max(0.85rem, var(--min-fs));
  }

  :deep(.p-datatable-tbody > tr) {
    overflow: visible;
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

.stats-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.6rem 0.9rem; margin-bottom: 0.75rem; }
/* จอแคบ: หัวข้อและช่องค้นหา/ตัวเลือกปีอยู่แถวเดียวกันทำให้หัวข้อถูกบีบเหลือ ~100px แตก 3 บรรทัด → ให้ห่อลงบรรทัดใหม่ */
.stats-header h3 { margin: 0; flex: 1 1 14rem; min-width: 0; }

.workload-dropdown-wrap { position: relative; }
.wl-toggle { display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 10px; cursor: pointer; font-size: max(0.8rem, var(--min-fs)); width: 100%; text-align: left; color: #374151; font-weight: 500; }
.wl-toggle:hover { background: #f1f5f9; border-color: #cbd5e1; }
.wl-badges { display: flex; gap: 3px; flex-wrap: wrap; }
.wl-badge { padding: 1px 6px; border-radius: 10px; font-size: max(0.7rem, var(--min-fs)); font-weight: 600; }
.wl-dropdown { position: absolute; top: calc(100% + 4px); left: 0; z-index: 9999; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: none; min-width: 260px; max-height: 320px; overflow-y: auto; padding: 4px; }
.workload-item { display: flex; align-items: flex-start; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: max(0.78rem, var(--min-fs)); transition: opacity 0.2s; margin-bottom: 2px; }
.workload-item:hover { opacity: 0.8; filter: brightness(0.96); }
.wl-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: currentColor; margin-top: 3px; }
.wl-info { display: flex; flex-direction: column; overflow: hidden; flex: 1; }
.wl-task { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wl-step { font-size: max(0.78rem, var(--min-fs)); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wl-working    { background: #fefce8; color: #92400e; }
.wl-in_progress { background: #eff6ff; color: #1e40af; }
.wl-overdue    { background: #fef2f2; color: #991b1b; }
.wl-pending    { background: #f9fafb; color: #525f70; }
.wl-completed  { background: #f0fdf4; color: #065f46; }


.project-group { margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
.project-header { padding: 8px 10px; background: #f9fafb; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; }
.project-header:hover { background: #f3f4f6; }
.project-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.project-name { font-weight: 600; font-size: max(0.8rem, var(--min-fs)); color: #1f2937; }
.project-progress { font-size: max(0.7rem, var(--min-fs)); color: #525f70; }
.progress-bar { flex: 0 0 80px; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #10b981); transition: width 0.3s; }
.steps-list { padding: 4px; background: white; }
.wl-status-badges { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 2px; }
.status-mini { padding: 1px 5px; border-radius: 8px; font-size: max(0.65rem, var(--min-fs)); color: white; font-weight: 500; }

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
    font-size: max(0.8rem, var(--min-fs));
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
    font-size: max(0.85rem, var(--min-fs));
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
    font-size: max(0.8rem, var(--min-fs));
  }

  .chart-card {
    min-height: 300px;
  }

  canvas {
    max-height: 250px;
  }

  :deep(.p-datatable) {
    font-size: max(0.8rem, var(--min-fs));
  }

  :deep(.p-datatable .p-column-title) {
    font-size: max(0.8rem, var(--min-fs));
  }

  :deep(.p-paginator) {
    font-size: max(0.8rem, var(--min-fs));
  }
}

@media (max-width: 360px) {
  .summary-info h3 {
    font-size: 1.2rem;
  }

  .summary-info p {
    font-size: max(0.8rem, var(--min-fs));
  }

  .header-title h1 {
    font-size: 1rem;
  }
}
</style>
