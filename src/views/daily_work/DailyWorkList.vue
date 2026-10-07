<template>
  <Card class="history-card">
    <template #content>
      <div v-if="records.length === 0" class="empty-state">
        <i class="pi pi-calendar-plus" style="font-size: 4rem; color: #55657a;"></i>
        <p>ยังไม่มีข้อมูลการลงงาน</p>
      </div>

      <EnhancedDataTable v-else :data="groupedRecords" :paginator="true" :rows="10" 
        :rowsPerPageOptions="[5, 10, 20]" responsiveLayout="scroll" class="history-table" stripedRows
        v-model:expandedRows="expandedRows" dataKey="_key">

        <Column style="width: 3rem;">
          <template #body="slotProps">
            <button v-if="slotProps.data.projects.length > 1"
              class="p-row-toggler p-link"
              @click="toggleRow(slotProps.data)">
              <i :class="expandedRows[slotProps.data._key] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
            </button>
          </template>
        </Column>

        <Column header="#" style="width: 70px; text-align: center;">
          <template #body="slotProps">
            <Badge :value="`#${slotProps.data.projects[0]?.id || slotProps.index + 1}`"
              style="background:#e5e7eb;color:#374151;font-size:max(0.75rem, var(--min-fs));font-weight:600" />
          </template>
        </Column>

        <Column field="work_date" header="วันที่ลงงาน" :sortable="true">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.work_date) }}
          </template>
        </Column>

        <Column field="start_time" header="เวลา" style="min-width: 120px;">
          <template #body="slotProps">
            <template v-if="slotProps.data.projects.length === 1">
              {{ formatTime(slotProps.data.projects[0].start_time) }} - {{ formatTime(slotProps.data.projects[0].end_time) }}
            </template>
            <span v-else class="text-muted"></span>
          </template>
        </Column>

        <Column field="employee_name" header="ชื่อ-นามสกุล" :sortable="true" style="min-width: 150px;">
          <template #body="slotProps">
            <div class="employee-info">
              <div class="employee-name clickable-name" @click="showUserInfo(slotProps.data.user_id)">
                {{ slotProps.data.employee_name || 'ไม่ระบุ' }}
              </div>
            </div>
          </template>
        </Column>

        <Column field="employee_position" header="ตำแหน่ง" :sortable="true">
          <template #body="slotProps">
            <span v-if="slotProps.data.employee_position" style="display:inline-block;padding:2px 10px;border-radius:12px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;font-size:max(0.75rem, var(--min-fs));font-weight:600;white-space:nowrap">
              {{ slotProps.data.employee_position }}
            </span>
            <span v-else style="color:#55657a;font-size:max(0.8rem, var(--min-fs))">ไม่ระบุ</span>
          </template>
        </Column>

        <Column header="โครงการ" style="min-width: 280px;">
          <template #body="slotProps">
            <template v-if="slotProps.data.projects.length === 1">
              <div class="task-info">
                <div class="task-name">{{ slotProps.data.projects[0].task_name || 'ไม่ระบุชื่องาน' }}</div>
                <span v-if="slotProps.data.projects[0].so_number" class="so-badge">{{ slotProps.data.projects[0].so_number }}</span>
                <span v-if="slotProps.data.projects[0].customer_info" class="customer-badge">{{ slotProps.data.projects[0].customer_info }}</span>
              </div>
            </template>
            <template v-else>
              <div class="multi-proj-summary" @click="toggleRow(slotProps.data)">
                <div class="multi-proj-header">
                  <i :class="expandedRows[slotProps.data._key] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="multi-proj-icon"></i>
                  <span class="multi-proj-count">{{ slotProps.data.projects.length }} โครงการ</span>
                </div>
                <div class="multi-proj-list">
                  <div v-for="(proj, idx) in slotProps.data.projects" :key="proj.id" class="multi-proj-item">
                    <span class="multi-proj-num">{{ idx + 1 }}.</span>
                    <span v-if="proj.so_number" class="so-badge">{{ proj.so_number }}</span>
                    <span class="multi-proj-name">{{ proj.task_name }}</span>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </Column>

        <Column field="step_name" header="ขั้นตอน" :sortable="true" style="min-width: 200px;">
          <template #body="slotProps">
            <template v-if="slotProps.data.projects.length === 1">
              <div v-if="slotProps.data.projects[0].steps_data && slotProps.data.projects[0].steps_data.length > 0" class="steps-container">
                <div v-for="step in slotProps.data.projects[0].steps_data" :key="step.id" class="step-card-mini clickable-step"
                  :style="{ borderLeftColor: getStepColorFromData(step) }"
                  @click="goToProjectProgress(slotProps.data.projects[0].task_id, step.id)">
                  <div class="step-header-mini">
                    <span class="step-number-mini" :style="{ background: getStepColorFromData(step) }">{{ (step.step_order || 0) + 1 }}</span>
                    <span class="step-name-mini">{{ step.step_name }}</span>
                    <span class="step-status-badge-mini" :style="{ background: getStepColorFromData(step) + '20', color: $accessibleText(getStepColorFromData(step)) }">{{ getStepLabelFromData(step) }}</span>
                  </div>
                </div>
              </div>
              <div v-else-if="slotProps.data.projects[0].step_name" class="step-card-mini clickable-step"
                :style="{ borderLeftColor: getStepColor(slotProps.data.projects[0]) }">
                <div class="step-header-mini">
                  <span class="step-number-mini" :style="{ background: getStepColor(slotProps.data.projects[0]) }">{{ (slotProps.data.projects[0].step_order || 0) + 1 }}</span>
                  <span class="step-name-mini">{{ slotProps.data.projects[0].step_name }}</span>
                  <span class="step-status-badge-mini" :style="{ background: getStepColor(slotProps.data.projects[0]) + '20', color: $accessibleText(getStepColor(slotProps.data.projects[0])) }">{{ getStepLabel(slotProps.data.projects[0]) }}</span>
                </div>
              </div>
              <span v-else class="text-muted"></span>
            </template>
            <span v-else class="text-muted"></span>
          </template>
        </Column>

        <Column field="work_status" header="สถานะงาน" :sortable="true" style="text-align: center; min-width: 140px;">
          <template #body="slotProps">
            <div class="status-badges-column">
              <template v-if="slotProps.data.projects.length === 1">
                <template v-if="slotProps.data.projects[0].work_status === 'cancelled'">
                <Badge :value="getStatusLabel('cancelled')"
                  :style="{ backgroundColor: $accessibleBg(getStatusColor('cancelled')), color: '#fff' }" />
              </template>
              <template v-else-if="getWorkflowStatuses(slotProps.data.projects[0]).length > 0">
                  <Badge v-for="ps in getWorkflowStatuses(slotProps.data.projects[0])" :key="ps" :value="getStatusLabel(ps)"
                    :style="{ backgroundColor: $accessibleBg(getStatusColor(ps)), color: '#fff' }" />
                </template>
                <span v-else-if="hasWorkflowStep(slotProps.data.projects[0])" class="text-muted"></span>
                <Badge v-else-if="slotProps.data.projects[0].work_status" :value="getStatusLabel(slotProps.data.projects[0].work_status)"
                  :style="{ backgroundColor: $accessibleBg(getStatusColor(slotProps.data.projects[0].work_status)), color: '#fff' }" />
                <span v-else class="text-muted"></span>
              </template>
              <span v-else class="text-muted"></span>
            </div>
          </template>
        </Column>

        <Column field="location" header="สถานที่" style="min-width: 100px;">
          <template #body="slotProps">
            <span v-if="slotProps.data.projects.length === 1">{{ slotProps.data.projects[0]?.location || '-' }}</span>
            <span v-else class="text-muted"></span>
          </template>
        </Column>

        <Column field="category" header="หมวดหมู่งาน" :sortable="true" style="text-align: center; min-width: 100px;">
          <template #body="slotProps">
            <template v-if="slotProps.data.projects.length === 1">
              <div class="badge-container category-badges">
                <Badge v-for="cat in parseCategoryArray(slotProps.data.projects[0].category)" :key="cat"
                  :value="getCategoryLabel(cat)"
                  :style="{ backgroundColor: $accessibleBg(getCategoryColor(cat)), color: '#fff', margin: '2px' }" />
              </div>
            </template>
            <span v-else class="text-muted"></span>
          </template>
        </Column>

        <Column header="รายละเอียดงาน">
          <template #body="slotProps">
            <Button v-if="slotProps.data.projects.length === 1" label="ดูรายละเอียด" icon="pi pi-info-circle" size="small" severity="info" outlined
              @click="showDetails(slotProps.data.projects[0], slotProps.data)" />
            <span v-else class="text-muted"></span>
          </template>
        </Column>

        <Column header="จัดการ" style="width: 120px; text-align: center;">
          <template #body="slotProps">
            <template v-if="slotProps.data.projects.length === 1">
              <div class="action-buttons" v-if="slotProps.data.projects[0] && (isAdmin() || (isOwner(slotProps.data.projects[0]) && !isEditDisabled(slotProps.data.projects[0]))) && slotProps.data.projects[0].work_status !== 'cancelled'">
                <Button icon="pi pi-pencil" size="small" severity="warning" outlined @click="editRecord(slotProps.data.projects[0])" v-tooltip="'แก้ไข'" />
                <Button icon="pi pi-times" size="small" severity="danger" outlined @click="confirmCancel(slotProps.data.projects[0])" v-tooltip="'ยกเลิก'" />
              </div>
              <span v-else style="display:block;text-align:center"></span>
            </template>
            <template v-else>
              <Button v-if="isOwner(slotProps.data.projects[0]) || isAdmin()" icon="pi pi-list" size="small" severity="info" outlined
                @click="openManageGroup(slotProps.data)" v-tooltip="'จัดการโครงการ'" />
            </template>
          </template>
        </Column>

        <Column header="ไฟล์แนบ" style="width: 80px;">
          <template #body="slotProps">
            <template v-if="slotProps.data.projects.length === 1">
              <div v-if="hasFiles(slotProps.data.projects[0])" class="attachments-info">
                <Button icon="pi pi-paperclip" size="small" severity="info" outlined
                  @click="downloadFiles(slotProps.data.projects[0])" v-tooltip="`${getFilesCount(slotProps.data.projects[0])} ไฟล์`" />
              </div>
              <span v-else class="no-files"></span>
            </template>
            <span v-else class="no-files"></span>
          </template>
        </Column>

        <!-- Expansion row: แสดงโครงการทั้งหมดเมื่อมีหลายโครงการ -->
        <template #expansion="slotProps">
          <div v-if="slotProps.data.projects.length > 1" class="expansion-projects">
            <!-- Header -->
            <div class="expansion-proj-row expansion-header">
              <div class="exp-cell">เวลา</div>
              <div class="exp-cell">โครงการ</div>
              <div class="exp-cell">ขั้นตอน</div>
              <div class="exp-cell">สถานะงาน</div>
              <div class="exp-cell">สถานที่</div>
              <div class="exp-cell">หมวดหมู่</div>
              <div class="exp-cell">รายละเอียด</div>
              <div class="exp-cell">จัดการ</div>
            </div>
            <!-- Data rows -->
            <div v-for="proj in slotProps.data.projects" :key="proj.id" class="expansion-proj-row">
              <div class="exp-cell exp-cell-time">
                {{ formatTime(proj.start_time) }} - {{ formatTime(proj.end_time) }}
              </div>
              <div class="exp-cell exp-cell-project">
                <div class="task-name">{{ proj.task_name || 'ไม่ระบุ' }}</div>
                <span v-if="proj.so_number" class="so-badge">{{ proj.so_number }}</span>
                <span v-if="proj.customer_info" class="customer-badge">{{ proj.customer_info }}</span>
              </div>
              <div class="exp-cell exp-cell-steps">
                <div v-if="proj.steps_data && proj.steps_data.length > 0" class="steps-container">
                  <div v-for="step in proj.steps_data" :key="step.id" class="step-card-mini clickable-step"
                    :style="{ borderLeftColor: getStepColorFromData(step) }"
                    @click="goToProjectProgress(proj.task_id, step.id)">
                    <div class="step-header-mini">
                      <span class="step-number-mini" :style="{ background: getStepColorFromData(step) }">{{ (step.step_order || 0) + 1 }}</span>
                      <span class="step-name-mini">{{ step.step_name }}</span>
                      <span class="step-status-badge-mini" :style="{ background: getStepColorFromData(step) + '20', color: $accessibleText(getStepColorFromData(step)) }">{{ getStepLabelFromData(step) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="exp-cell">
                <template v-if="proj.work_status === 'cancelled'">
                  <Badge :value="getStatusLabel('cancelled')"
                    :style="{ backgroundColor: $accessibleBg(getStatusColor('cancelled')), color: '#fff' }" />
                </template>
                <template v-else-if="getWorkflowStatuses(proj).length > 0">
                  <Badge v-for="ps in getWorkflowStatuses(proj)" :key="ps" :value="getStatusLabel(ps)"
                    :style="{ backgroundColor: $accessibleBg(getStatusColor(ps)), color: '#fff', margin: '1px' }" />
                </template>
                <Badge v-else-if="proj.work_status" :value="getStatusLabel(proj.work_status)"
                  :style="{ backgroundColor: $accessibleBg(getStatusColor(proj.work_status)), color: '#fff' }" />
              </div>
              <div class="exp-cell">{{ proj.location || '' }}</div>
              <div class="exp-cell">
                <template v-if="parseCategoryArray(proj.category).length > 0">
                  <Badge v-for="cat in parseCategoryArray(proj.category)" :key="cat"
                    :value="getCategoryLabel(cat)"
                    :style="{ backgroundColor: $accessibleBg(getCategoryColor(cat)), color: '#fff', margin: '1px' }" />
                </template>
              </div>
              <div class="exp-cell exp-cell-actions">
                <Button icon="pi pi-info-circle" size="small" severity="info" text @click="showDetails(proj, slotProps.data)" v-tooltip="'รายละเอียด'" />
                <Button v-if="hasFiles(proj)" icon="pi pi-paperclip" size="small" severity="secondary" text @click="downloadFiles(proj)" v-tooltip="`${getFilesCount(proj)} ไฟล์`" />
              </div>
              <div class="exp-cell exp-cell-actions">
                <Button v-if="isAdmin() || (isOwner(proj) && !isEditDisabled(proj))" icon="pi pi-pencil" size="small" severity="warning" text @click="editRecord(proj)" v-tooltip="'แก้ไข'" />
                <Button v-if="isAdmin() || (isOwner(proj) && !isEditDisabled(proj))" icon="pi pi-times" size="small" severity="danger" text @click="confirmCancel(proj)" v-tooltip="'ยกเลิก'" />
              </div>
            </div>
          </div>
        </template>

      </EnhancedDataTable>
    </template>
  </Card>

  <!-- Dialog สำหรับแสดงรายละเอียดงาน -->
  <Dialog v-model:visible="detailDialog" modal header="รายละเอียดงาน" :style="{ width: '92vw', maxWidth: '680px' }" position="center" :draggable="false" class="dt-dialog">
    <div v-if="selectedRecord" class="dt-wrap">
      <!-- โครงการ -->
      <div class="dt-header">
        <div class="dt-icon"><i class="pi pi-briefcase"></i></div>
        <div class="dt-title">
          <div class="dt-name">
            <span v-if="selectedRecord.so_number" class="dt-so">{{ selectedRecord.so_number }}</span>
            <span class="dt-task">{{ selectedRecord.task_name || 'ไม่ระบุโครงการ' }}</span>
          </div>
          <div v-if="selectedRecord.customer_info" class="dt-customer"><i class="pi pi-building"></i> {{ selectedRecord.customer_info }}</div>
        </div>
        <span v-if="selectedRecord.work_status" class="dt-status" :class="dtStatusClass(selectedRecord.work_status)">{{ getStatusLabel(selectedRecord.work_status) }}</span>
      </div>

      <!-- ข้อมูลทั่วไป -->
      <div class="dt-grid">
        <div class="dt-item">
          <div class="dt-label"><i class="pi pi-calendar"></i> วันที่</div>
          <div class="dt-value">{{ formatDate(selectedRecord.work_date) }}</div>
        </div>
        <div class="dt-item">
          <div class="dt-label"><i class="pi pi-clock"></i> เวลา</div>
          <div class="dt-value">{{ formatTime(selectedRecord.start_time) }} - {{ formatTime(selectedRecord.end_time) }}</div>
        </div>
        <div class="dt-item">
          <div class="dt-label"><i class="pi pi-map-marker"></i> สถานที่</div>
          <div class="dt-value">{{ selectedRecord.location || 'ไม่ระบุ' }}</div>
        </div>
        <div class="dt-item">
          <div class="dt-label"><i class="pi pi-users"></i> ผู้ลงงาน</div>
          <div class="dt-value">{{ detailEmployee || 'ไม่ระบุ' }}</div>
        </div>
      </div>

      <!-- ขั้นตอน -->
      <div v-if="(selectedRecord.steps_data && selectedRecord.steps_data.length) || selectedRecord.step_name" class="dt-section">
        <div class="dt-section-title"><i class="pi pi-list"></i> ขั้นตอน</div>
        <div v-if="selectedRecord.steps_data && selectedRecord.steps_data.length" class="steps-container">
          <div v-for="step in selectedRecord.steps_data" :key="step.id" class="step-card-mini clickable-step"
            :style="{ borderLeftColor: getStepColorFromData(step) }"
            @click="goToProjectProgress(selectedRecord.task_id, step.id)">
            <div class="step-header-mini">
              <span class="step-number-mini" :style="{ background: getStepColorFromData(step) }">{{ (step.step_order || 0) + 1 }}</span>
              <span class="step-name-mini">{{ step.step_name }}</span>
              <span class="step-status-badge-mini" :style="{ background: getStepColorFromData(step) + '20', color: $accessibleText(getStepColorFromData(step)) }">{{ getStepLabelFromData(step) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="steps-container">
          <div class="step-card-mini" :style="{ borderLeftColor: getStepColor(selectedRecord) }">
            <div class="step-header-mini">
              <span class="step-number-mini" :style="{ background: getStepColor(selectedRecord) }">{{ (selectedRecord.step_order || 0) + 1 }}</span>
              <span class="step-name-mini">{{ selectedRecord.step_name }}</span>
              <span class="step-status-badge-mini" :style="{ background: getStepColor(selectedRecord) + '20', color: $accessibleText(getStepColor(selectedRecord)) }">{{ getStepLabel(selectedRecord) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- หมวดหมู่ -->
      <div v-if="parseCategoryArray(selectedRecord.category).length" class="dt-section">
        <div class="dt-section-title"><i class="pi pi-tags"></i> หมวดหมู่</div>
        <div class="dt-cats">
          <Badge v-for="cat in parseCategoryArray(selectedRecord.category)" :key="cat"
            :value="getCategoryLabel(cat)"
            :style="{ backgroundColor: $accessibleBg(getCategoryColor(cat)), color: '#fff' }" />
        </div>
      </div>

      <!-- รายละเอียดงาน -->
      <div class="dt-section">
        <div class="dt-section-title"><i class="pi pi-align-left"></i> รายละเอียดงาน</div>
        <div class="dt-desc" :class="{ 'dt-desc-empty': !selectedRecord.work_description }">
          {{ selectedRecord.work_description || 'ไม่มีรายละเอียด' }}
        </div>
      </div>

      <!-- ไฟล์แนบ -->
      <div v-if="hasFiles(selectedRecord)" class="dt-section">
        <div class="dt-section-title"><i class="pi pi-paperclip"></i> ไฟล์แนบ ({{ getFilesCount(selectedRecord) }})</div>
        <div class="dt-files">
          <div v-for="(file, i) in parseFiles(selectedRecord.files)" :key="i" class="dt-file" @click="viewFullImage(file)">
            <img v-if="isImageFile(file)" :src="getFileUrl(file)" class="dt-thumb" alt="file" />
            <div v-else class="dt-file-icon"><i class="pi pi-file"></i></div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dt-footer">
        <Button v-if="hasFiles(selectedRecord)" icon="pi pi-download" label="ไฟล์แนบ" size="small" severity="info" outlined @click="downloadFiles(selectedRecord)" />
        <Button icon="pi pi-times" label="ปิด" size="small" severity="secondary" text @click="detailDialog = false" />
      </div>
    </template>
  </Dialog>

  <!-- Files Dialog -->
  <Dialog v-model:visible="filesDialog" modal header="ไฟล์แนบ" :style="{ width: '90vw', maxWidth: '800px' }" :draggable="false">
    <div v-if="selectedRecordFiles && selectedRecordFiles.length > 0" class="files-list">
      <div v-for="(file, index) in selectedRecordFiles" :key="index" class="file-item">
        <div class="file-info">
          <img v-if="isImageFile(file)" :src="getFileUrl(file)" class="file-preview" @click="viewFullImage(file)" />
          <i v-else class="pi pi-file file-icon"></i>
          <span class="file-name">{{ file }}</span>
        </div>
        <Button icon="pi pi-download" size="small" severity="success" outlined @click="downloadFile(file)"
          v-tooltip="'ดาวน์โหลด'" />
      </div>
    </div>
    <div v-else class="no-files-dialog">
      <p>ไม่มีไฟล์แนบ</p>
    </div>
  </Dialog>

  <!-- Full Image Dialog -->
  <Dialog v-model:visible="fullImageDialog" modal header="รูปภาพ" :style="{ width: '90vw', maxWidth: '900px' }" :draggable="false">
    <img :src="fullImageUrl" class="full-image" />
  </Dialog>

  <!-- Manage Group Dialog -->
  <Dialog v-model:visible="manageGroupDialog" modal header="จัดการโครงการในกลุ่ม" :style="{ width: '90vw', maxWidth: '700px' }" :draggable="false">
    <div v-if="manageGroupData" class="manage-group-wrap">
      <div class="manage-group-date">
        <i class="pi pi-calendar"></i> {{ formatDate(manageGroupData.work_date) }}
        <span class="manage-group-count">{{ manageGroupData.projects.length }} โครงการ</span>
        <Button icon="pi pi-plus" label="เพิ่มโครงการ" size="small" severity="success" outlined
          style="margin-left:auto"
          @click="$emit('add-to-group', manageGroupData.work_date); manageGroupDialog = false" />
      </div>
      <div class="manage-proj-list">
        <div v-for="proj in manageGroupData.projects" :key="proj.id" class="manage-proj-item">
          <div class="manage-proj-info">
            <span class="manage-proj-num">{{ manageGroupData.projects.indexOf(proj) + 1 }}</span>
            <div class="manage-proj-detail">
              <div class="manage-proj-name">
                <span v-if="proj.so_number" class="so-badge-sm">{{ proj.so_number }}</span>
                {{ proj.task_name }}
              </div>
              <div class="manage-proj-time">
                <i class="pi pi-clock"></i> {{ formatTime(proj.start_time) }} – {{ formatTime(proj.end_time) }}
              </div>
            </div>
          </div>
          <div class="manage-proj-actions">
            <Button icon="pi pi-pencil" size="small" severity="warning" text
              v-if="isAdmin() || (isOwner(proj) && !isEditDisabled(proj))"
              @click="editRecord(proj)" v-tooltip="'แก้ไข'" />
            <Button icon="pi pi-trash" size="small" severity="danger" text
              v-if="isAdmin() || (isOwner(proj) && !isEditDisabled(proj))"
              @click="confirmCancel(proj); manageGroupDialog = false" v-tooltip="'ลบ'" />
          </div>
        </div>
      </div>
    </div>
  </Dialog>

  <!-- Edit Record Dialog -->
  <Dialog v-model:visible="editDialog" modal header="แก้ไขรายการงาน" :style="{ width: '90vw', maxWidth: '600px' }" position="center" :draggable="false">
    <form @submit.prevent="updateRecord" class="edit-form">
      <div class="edit-form-content">
        <div class="edit-row">
          <div class="edit-field">
            <label class="edit-label"><i class="pi pi-briefcase"></i> โครงการ</label>
            <Dropdown
              v-model="editFormData.task_id"
              :options="tasks"
              optionLabel="display"
              optionValue="id"
              class="w-full"
              placeholder="เลือกโครงการ"
              filter
              filterPlaceholder="ค้นหาชื่อโครงการ / เลข SO"
              :filterFields="['task_name','so_number','display']"
              scrollHeight="300px"
              appendTo="body"
            >
              <template #value="{ value }">
                <div v-if="value" class="edit-val-row">
                  <span v-if="getTaskSO(value)" class="edit-so-tag">{{ getTaskSO(value) }}</span>
                  <span class="edit-task-txt">{{ getTaskName(value) }}</span>
                </div>
                <span v-else class="edit-ph">เลือกโครงการ</span>
              </template>
              <template #option="{ option }">
                <div class="edit-opt-row" :class="{ 'edit-opt-mine': option._assigned }">
                  <span v-if="option._assigned" class="edit-mine-tag"><i class="pi pi-star-fill"></i> งานของฉัน</span>
                  <span v-if="option.so_number" class="edit-so-tag">{{ option.so_number }}</span>
                  <span class="edit-task-txt">{{ option.task_name }}</span>
                </div>
              </template>
            </Dropdown>
          </div>
        </div>

        <div class="edit-row">
          <div class="edit-field">
            <label class="edit-label"><i class="pi pi-calendar"></i> วันที่ลงงาน</label>
            <Calendar v-model="editFormData.work_date" dateFormat="dd/mm/yy" class="w-full" required showIcon />
          </div>
        </div>

        <div class="edit-row">
          <div class="edit-field">
            <label class="edit-label"><i class="pi pi-clock"></i> ระยะเวลา</label>
            <div class="time-range-inputs">
              <InputText v-model="editFormData.start_time_text" class="time-input" placeholder="เริ่ม" maxlength="5" inputmode="numeric" @input="formatTimeInput('start_time_text')" required />
              <span class="time-separator">-</span>
              <InputText v-model="editFormData.end_time_text" class="time-input" placeholder="สิ้นสุด" maxlength="5" inputmode="numeric" @input="formatTimeInput('end_time_text')" required />
              <span class="time-total">{{ calculateEditHours }}</span>
            </div>
          </div>
        </div>

        <div class="edit-row">
          <div class="edit-field">
            <label class="edit-label"><i class="pi pi-map-marker"></i> สถานที่</label>
            <InputText v-model="editFormData.location" required class="w-full" placeholder="ระบุสถานที่" />
          </div>
        </div>

        <div class="edit-row">
          <div class="edit-field">
            <label class="edit-label"><i class="pi pi-align-left"></i> รายละเอียดงาน</label>
            <Textarea v-model="editFormData.work_description" rows="3" required class="w-full" placeholder="รายละเอียดงานที่ทำ" />
          </div>
        </div>

        <div class="edit-row">
          <div class="edit-field">
            <label class="edit-label"><i class="pi pi-paperclip"></i> ไฟล์แนบ</label>
            <div class="file-upload-area">
              <input type="file" ref="editFileInput" @change="handleEditFileUpload"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple style="display: none;">
              <Button type="button" label="เพิ่มไฟล์" icon="pi pi-upload" severity="secondary" outlined size="small"
                @click="$refs.editFileInput.click()" />
            </div>

            <div v-if="editFormData.existingFiles?.length > 0" class="file-list">
              <div v-for="(file, index) in editFormData.existingFiles" :key="'existing-'+index" class="file-chip">
                <i class="pi pi-file"></i>
                <span>{{ file }}</span>
                <i class="pi pi-times remove-file" @click="removeExistingFile(index)"></i>
              </div>
            </div>

            <div v-if="editFormData.newFiles?.length > 0" class="file-list new">
              <div v-for="(file, index) in editFormData.newFiles" :key="'new-'+index" class="file-chip new">
                <i class="pi pi-file"></i>
                <span>{{ file.name }}</span>
                <i class="pi pi-times remove-file" @click="removeNewFile(index)"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <Button type="button" label="ยกเลิก" severity="secondary" outlined @click="editDialog = false" />
        <Button type="button" icon="pi pi-plus" label="เพิ่มโครงการ" severity="info" outlined
          @click="$emit('add-to-group', String(editFormData.work_date instanceof Date ? editFormData.work_date.toISOString() : editFormData.work_date).substring(0, 10)); editDialog = false" />
        <Button type="submit" label="บันทึก" severity="success" />
      </div>
    </form>
  </Dialog>

  <Dialog v-model:visible="cancelDialog" modal header="ยืนยันการยกเลิก" :style="{ width: '90vw', maxWidth: '460px' }" position="center" :draggable="false">
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      <div>คุณต้องการยกเลิกงานนี้หรือไม่?</div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <Checkbox v-model="cancelDeletePermanently" inputId="deletePermanently" :binary="true" />
        <label for="deletePermanently">ลบรายการนี้ออกจากระบบ</label>
      </div>
    </div>
    <template #footer>
      <Button label="ปิด" severity="secondary" outlined @click="closeCancelDialog" />
      <Button label="ยืนยัน" severity="danger" @click="confirmCancelAction" />
    </template>
  </Dialog>

  <UserInfoDialog v-model:visible="showUserDialog" :userId="selectedUserId" />
</template>

<script>
import { isImageFile, fileUrlWithToken, downloadBlob, getOriginalFileName } from '@/utils/fileHelpers'
import axios from '@/utils/axiosConfig'
import UserInfoDialog from '@/components/UserInfoDialog.vue'
import EnhancedDataTable from '@/components/EnhancedDataTable.vue'
import Checkbox from 'primevue/checkbox'
import { usePermissions } from '@/composables/usePermissions'
import { accessibleBg } from '@/utils/color'

import { addDays, formatDayMonthTH } from '@/utils/dateUtils'
import { EDIT_CUTOFF_HOUR } from '@/constants/workConstants'

export default {
  name: 'DailyWorkList',
  setup() {
    const { hasAccess } = usePermissions()
    return { hasAccess }
  },
  components: {
    UserInfoDialog,
    EnhancedDataTable,
    Checkbox
  },
  // $toast/$confirm ใช้จาก globalProperties ของ PrimeVue — ห้าม inject เพราะจะ shadow เป็น undefined
  emits: ['refresh-data', 'add-to-group'],
  props: {
    records: {
      type: Array,
      default: () => []
    }
  },
  created() {
    this.$http = axios
    if (!this.records || this.records.length === 0) {
      this.loadWorkRecords()
    }
  },
  mounted() {
    // Load status options from localStorage
    this.loadStatusOptions()
    this.loadCategoryOptions()
    this.loadTasks()

    this._clockInterval = setInterval(() => {
      this.currentTime = new Date()
    }, 1000)
    
    this._onTaskUpdated = () => this.$emit('refresh-data')
    this._onStatusesUpdated = () => this.loadStatusOptions()
    this._onCategoriesUpdated = () => this.loadCategoryOptions()
    window.addEventListener('taskUpdated', this._onTaskUpdated)
    window.addEventListener('statusesUpdated', this._onStatusesUpdated)
    window.addEventListener('categoriesUpdated', this._onCategoriesUpdated)
  },
  beforeUnmount() {
    clearInterval(this._clockInterval)
    window.removeEventListener('taskUpdated', this._onTaskUpdated)
    window.removeEventListener('statusesUpdated', this._onStatusesUpdated)
    window.removeEventListener('categoriesUpdated', this._onCategoriesUpdated)
  },
  computed: {
    workRecords() {
      return this.records && this.records.length > 0 ? this.records : this.localRecords
    },
    groupedRecords() {
      const all = this.workRecords
      const groups = {}
      all.forEach(r => {
        const key = `${String(r.work_date).substring(0, 10)}_${r.user_id}`
        if (!groups[key]) {
          groups[key] = {
            _key: key,
            work_date: r.work_date,
            start_time: r.start_time,
            end_time: r.end_time,
            user_id: r.user_id,
            employee_name: r.employee_name,
            employee_position: r.employee_position,
            employee_department: r.employee_department,
            location: r.location,
            work_status: r.work_status,
            projects: []
          }
        }
        groups[key].projects.push(r)
      })
      return Object.values(groups).sort((a, b) => new Date(b.work_date) - new Date(a.work_date))
    },
    detailEmployee() {
      if (!this.detailGroup) return ''
      const g = this.detailGroup
      return [g.employee_name, g.employee_position].filter(Boolean).join(' · ')
    },
    calculateEditHours() {
      if (!this.editFormData.start_time_text || !this.editFormData.end_time_text) return '0.00 ชม.'
      const start = this.editFormData.start_time_text.split(':')
      const end = this.editFormData.end_time_text.split(':')
      if (start.length < 2 || end.length < 2) return '0.00 ชม.'
      const startMin = parseInt(start[0]) * 60 + parseInt(start[1])
      const endMin = parseInt(end[0]) * 60 + parseInt(end[1])
      let diff = endMin - startMin
      if (diff < 0) diff += 24 * 60
      // หัก lunch break 12:00-13:00
      const lunchStart = 12 * 60, lunchEnd = 13 * 60
      const overlapStart = Math.max(startMin, lunchStart)
      const overlapEnd = Math.min(endMin, lunchEnd)
      if (overlapEnd > overlapStart) diff -= (overlapEnd - overlapStart)
      return (diff / 60).toFixed(2) + ' ชม.'
    }
  },
  data() {
    return {
      localRecords: [],
      tasks: [],
      detailDialog: false,
      selectedRecord: null,
      detailGroup: null,
      filesDialog: false,
      selectedRecordFiles: [],
      fullImageDialog: false,
      fullImageUrl: '',
      manageGroupDialog: false,
      manageGroupData: null,
      editDialog: false,
      cancelDialog: false,
      cancelDeletePermanently: false,
      cancelRecordTarget: null,
      editFormData: {
        id: null,
        task_id: null,
        work_date: null,
        start_time: null,
        end_time: null,
        start_time_text: '',
        end_time_text: '',
        work_status: null,
        location: '',
        work_description: '',
        existingFiles: [],
        newFiles: []
      },
      statusOptions: [],
      categoryOptions: [],
      showUserDialog: false,
      selectedUserId: null,
      currentTime: new Date(),
      selectedProjMap: {},  // key = group._key, value = proj object
      openMap: {},           // key = group._key, value = boolean
      expandedRows: {}
    }
  },
  methods: {
    async loadTasks() {
      try {
        const userId = localStorage.getItem('soc_user_id')
        const [tasksRes, stepsRes] = await Promise.all([
          this.$http.get('/api/tasks'),
          this.$http.get('/api/task-steps/all').catch(() => ({ data: [] }))
        ])
        const assignedTaskIds = new Set(
          (stepsRes.data || []).filter(s => {
            const users = typeof s.assigned_users === 'string'
              ? JSON.parse(s.assigned_users)
              : (s.assigned_users || [])
            return users.some(u => String(u.id || u) === String(userId))
          }).map(s => s.task_id)
        )
        this.tasks = (tasksRes.data || []).map(task => ({
          ...task,
          _assigned: assignedTaskIds.has(task.id),
          display: task.so_number ? `[${task.so_number}] ${task.task_name}` : task.task_name
        })).sort((a, b) => (b._assigned ? 1 : 0) - (a._assigned ? 1 : 0))
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load tasks:', error)
      }
    },
    getTaskSO(id) { return this.tasks.find(t => t.id === id)?.so_number },
    getTaskName(id) { return this.tasks.find(t => t.id === id)?.task_name },
    showUserInfo(userId) {
      if (userId) {
        this.selectedUserId = userId
        this.showUserDialog = true
      }
    },
    loadStatusOptions() {
      this.$http.get('/api/settings/statuses')
        .then(response => {
          this.statusOptions = response.data.map(status => ({
            label: status.label,
            value: status.value,
            color: status.color
          }))
        })
        .catch(() => {
          // Fallback to default
          this.statusOptions = [
            { label: '⏳ รอดำเนินการ', value: 'pending', color: '#f59e0b' },
            { label: '🔄 กำลังดำเนินการ', value: 'in_progress', color: '#3a7bd0' },
            { label: '✅ เสร็จสิ้น', value: 'completed', color: '#10b981' },
            { label: '⏸️ ระงับ', value: 'on_hold', color: '#6c757d' }
          ]
        })
    },
    loadCategoryOptions() {
      this.$http.get('/api/settings/categories')
        .then(response => {
          this.categoryOptions = response.data
        })
        .catch(() => {
          this.categoryOptions = []
        })
    },
    formatStepDateRange(start, end) {
      const formatDate = formatDayMonthTH
      if (start && end) return `${formatDate(start)} - ${formatDate(end)}`
      if (start) return `เริ่ม ${formatDate(start)}`
      if (end) return `ถึง ${formatDate(end)}`
      return ''
    },
    formatAssignedUsers(users) {
      if (!users || users.length === 0) return ''
      return users.map(u => u.name || u).join(', ')
    },
    isOwner(record) {
      const currentUserId = localStorage.getItem('soc_user_id')
      return record.user_id == currentUserId
    },
    // แก้ไข/ลบงานรายวันของผู้อื่นได้: admin/superadmin หรือ role ที่ถูกติ๊กสิทธิ์ "แก้ไข/ลบงานรายวันของผู้อื่น" (เดิมเช็คเฉพาะ role === 'admin' → superadmin ใช้ไม่ได้)
    isAdmin() {
      return this.hasAccess('/daily_work#manage-all')
    },
    isEditDisabled(record) {
      if (!record || !record.work_date) {
        return true
      }

      // วันที่ลงงาน
      const workDate = new Date(record.work_date)

      // กำหนดเวลาล็อก = EDIT_CUTOFF_HOUR ของวันถัดไป
      const cutoff = addDays(workDate, 1)
      cutoff.setHours(EDIT_CUTOFF_HOUR, 0, 0, 0)

      // เวลาปัจจุบัน
      const now = this.currentTime

      // ปิดการแก้ไขหลัง EDIT_CUTOFF_HOUR ของวันถัดไป
      return now > cutoff
    },
    confirmCancel(record) {
      this.cancelRecordTarget = record
      this.cancelDeletePermanently = false
      this.cancelDialog = true
    },
    closeCancelDialog() {
      this.cancelDialog = false
      this.cancelDeletePermanently = false
      this.cancelRecordTarget = null
    },
    async confirmCancelAction() {
      if (!this.cancelRecordTarget) return
      const record = this.cancelRecordTarget

      try {
        if (this.cancelDeletePermanently) {
          await this.$http.delete(`/api/daily-work/${record.id}`)
          this.$toast.add({
            severity: 'success',
            summary: 'สำเร็จ',
            detail: 'ลบรายการเรียบร้อยแล้ว',
            life: 3000
          })
          this.$emit('refresh-data')
        } else {
          await this.cancelRecord(record)
        }

        this.closeCancelDialog()
      } catch {
        this.$toast.add({
          severity: 'error',
          summary: 'ผิดพลาด',
          detail: this.cancelDeletePermanently ? 'ไม่สามารถลบรายการได้' : 'ไม่สามารถยกเลิกงานได้',
          life: 3000
        })
      }
    },
    async cancelRecord(record) {
      try {
        await this.$http.put(`/api/daily-work/${record.id}`, {
          task_id: record.task_id,
        step_id: record.step_id,
        step_ids: record.step_ids || (record.step_id ? [record.step_id] : []),
          work_date: record.work_date,
          start_time: record.start_time,
          end_time: record.end_time,
          work_status: 'cancelled',
          location: record.location,
          work_description: record.work_description,
          files: record.files
        })
        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'ยกเลิกงานเรียบร้อยแล้ว',
          life: 3000
        })
        this.$emit('refresh-data')
        this.loadWorkRecords()
      } catch {
        throw new Error('cancel failed')
      }
    },

    async loadWorkRecords() {
      try {
        const response = await this.$http.get('/api/daily-work')
        this.localRecords = response.data || []

        // ตรวจสอบข้อมูลที่ได้รับ

        if (this.localRecords.length === 0) {
          this.$toast.add({
            severity: 'info',
            summary: 'ไม่มีข้อมูล',
            detail: 'ยังไม่มีการลงงานรายวัน',
            life: 3000
          })
        }
      } catch { // ignore
        this.localRecords = []

        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถโหลดข้อมูลการลงงานได้',
          life: 5000
        })
      }
    },
    formatDate(date) {
      if (!date) return '-'
      try {
        const d = new Date(date)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
      } catch { // ignore
        return date
      }
    },
    formatTime(time) {
      if (!time) return '-'
      return time.substring(0, 5)
    },
    formatDateForAPI(date) {
      if (!date || isNaN(date.getTime())) {
        return null;
      }

      // ใช้ local date components โดยตรง (ไม่เพิ่มวันที่แล้วเพราะ parse แล้วเพิ่มไปแล้ว)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return null;
      }

      const formatted = `${year}-${month}-${day}`;
      return formatted;
    },
    formatTimeForAPI(time) {
      if (!time) return null
      return time.toTimeString().split(' ')[0]
    },
    getStatusLabel(value) {
      if (value === 'cancelled') return 'ยกเลิก'
      const status = this.statusOptions.find(s => s.value === value)
      if (status && status.label) {
        return status.label.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}-\u{3299}]/gu, '').trim()
      }
      return value
    },
    getStepColor(data) {
      if (data?.step_status === 'completed') return accessibleBg('#10b981')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (data?.step_end_date) {
        const endDate = new Date(data.step_end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return accessibleBg('#ef4444')
      }
      if (data?.step_has_work_logged && data?.step_latest_work_date) {
        const wDate = new Date(data.step_latest_work_date)
        wDate.setHours(0, 0, 0, 0)
        if (wDate <= today) return accessibleBg('#f59e0b')
      }
      return accessibleBg('#9ca3af')
    },
    getStepLabel(data) {
      if (data?.step_status === 'completed') return 'เสร็จสิ้น'
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (data?.step_end_date) {
        const endDate = new Date(data.step_end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return 'เกินกำหนด'
      }
      if (data?.step_has_work_logged && data?.step_latest_work_date) {
        const wDate = new Date(data.step_latest_work_date)
        wDate.setHours(0, 0, 0, 0)
        if (wDate <= today) return 'กำลังดำเนินการ'
      }
      return 'รอดำเนินการ'
    },
    goToProjectProgress(taskId, stepId) {
      // เปิดได้เฉพาะ role ที่ถูกติ๊กสิทธิ์หน้า "ขั้นตอนการดำเนินการโครงการ" (ไม่งั้น route guard จะเด้งไปหน้าอื่นโดยไม่บอกเหตุผล)
      if (!this.hasAccess('/project-progress')) {
        this.$toast.add({ severity: 'warn', summary: 'ไม่มีสิทธิ์เข้าถึง', detail: 'บัญชีนี้ไม่มีสิทธิ์เปิดหน้า "ขั้นตอนการดำเนินการโครงการ"', life: 3000 })
        return
      }
      this.$router.push({ path: '/project-progress', query: { taskId, stepId } })
    },
    getWorkflowStatuses(record) {
      // ถ้ามี steps_data ให้รวม project_statuses จากทุก step
      if (record.steps_data && record.steps_data.length > 0) {
        const statuses = []
        for (const step of record.steps_data) {
          if (step.project_statuses && step.project_statuses.length > 0) {
            statuses.push(...step.project_statuses)
          }
        }
        return [...new Set(statuses)] // unique
      }
      return []
    },
    hasWorkflowStep(record) {
      return (record.steps_data && record.steps_data.length > 0) || record.step_id
    },
    getStepColorFromData(step) {
      if (step?.status === 'completed') return accessibleBg('#10b981')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (step?.end_date) {
        const endDate = new Date(step.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return accessibleBg('#ef4444')
      }
      if (step?.has_work_logged && step.latest_work_date) {
        const wDate = new Date(step.latest_work_date)
        wDate.setHours(0, 0, 0, 0)
        if (wDate <= today) return accessibleBg('#f59e0b')
      }
      return accessibleBg('#9ca3af')
    },
    getStepLabelFromData(step) {
      if (step?.status === 'completed') return 'เสร็จสิ้น'
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // เกินกำหนด - เช็คก่อนเสมอ
      if (step?.end_date) {
        const endDate = new Date(step.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return 'เกินกำหนด'
      }
      
      if (step?.has_work_logged && step.latest_work_date) {
        const wDate = new Date(step.latest_work_date)
        wDate.setHours(0, 0, 0, 0)
        if (wDate <= today) return 'กำลังดำเนินการ'
      }
      return 'รอดำเนินการ'
    },
    getProjectStatusLabel(status) {
      const found = this.statusOptions.find(s => s.value === status)
      return found ? found.label.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}-\u{3299}]/gu, '').trim() : status
    },
    getProjectStatusColor(status) {
      const found = this.statusOptions.find(s => s.value === status)
      return accessibleBg(found?.color || '#6b7280')
    },
    getStatusLabelFromOptions(value) {
      const status = this.statusOptions.find(s => s.value === value)
      if (status && status.label) {
        // Remove all emoji and special characters
        return status.label.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}-\u{3299}]/gu, '').trim()
      }
      return value
    },
    getStatusColor(value) {
      if (value === 'cancelled') return accessibleBg('#ef4444')
      const status = this.statusOptions.find(s => s.value === value)
      return accessibleBg(status?.color || '#6c757d')
    },
    getCategoryLabel(value) {
      const category = this.categoryOptions.find(c => c.value === value)
      if (category && category.label) {
        // Remove all emoji and special characters
        return category.label.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}-\u{3299}]/gu, '').trim()
      }
      return value || 'งานทั่วไป'
    },
    getCategoryColor(value) {
      const category = this.categoryOptions.find(c => c.value === value)
      return accessibleBg(category?.color || '#6c757d')
    },
    parseCategoryArray(category) {
      if (!category) return []
      if (Array.isArray(category)) return category
      return category.split(',').map(c => c.trim()).filter(c => c)
    },
    getCategorySeverity() {
      return 'contrast'
    },
    isImageFile(fileName) {
      return isImageFile(fileName)
    },
    getFileUrl(fileName) {
      return fileUrlWithToken(fileName)
    },
    viewFullImage(fileName) {
      this.fullImageUrl = this.getFileUrl(fileName)
      this.fullImageDialog = true
    },
    hasFiles(record) {
      let files = record.files
      if (typeof files === 'string') {
        try { files = JSON.parse(files) } catch { files = [] }
      }
      return files && Array.isArray(files) && files.length > 0
    },
    openManageGroup(group) {
      this.manageGroupData = group
      this.manageGroupDialog = true
    },
    getFilesCount(record) {
      let files = record.files
      if (typeof files === 'string') {
        try { files = JSON.parse(files) } catch { files = [] }
      }
      return Array.isArray(files) ? files.length : 0
    },
    downloadFiles(record) {
      if (this.hasFiles(record)) {
        let files = record.files
        if (typeof files === 'string') {
          try { files = JSON.parse(files) } catch { files = [] }
        }
        this.selectedRecordFiles = files
        this.filesDialog = true
      }
    },
    async downloadFile(fileName) {
      try {
        await downloadBlob(this.$http, `/api/files/download/${fileName}`, getOriginalFileName(fileName))
      } catch { // ignore
        
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถดาวน์โหลดไฟล์ได้',
          life: 3000
        })
      }
    },
    editRecord(record) {
      // Parse date โดยแยกเฉพาะวันที่
      let workDate = new Date();
      if (record.work_date) {
        const dateOnly = record.work_date.split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);
        workDate = new Date(year, month - 1, day, 12, 0, 0);
      }

      this.editFormData = {
        id: record.id,
        task_id: record.task_id,
        step_id: record.step_id,
        step_ids: record.step_ids || (record.step_id ? [record.step_id] : []),
        work_date: workDate,
        start_time: this.parseTime(record.start_time),
        end_time: this.parseTime(record.end_time),
        start_time_text: record.start_time?.substring(0, 5) || '',
        end_time_text: record.end_time?.substring(0, 5) || '',
        work_status: record.work_status,
        location: record.location || '',
        work_description: record.work_description || '',
        existingFiles: [...(record.files || [])],
        newFiles: []
      }
      this.editDialog = true
    },
    formatTimeInput(field) {
      let value = this.editFormData[field].replace(/\D/g, '')
      if (value.length >= 2) {
        value = value.slice(0, 2) + ':' + value.slice(2, 4)
      }
      this.editFormData[field] = value.slice(0, 5)
    },
    parseTime(timeString) {
      if (!timeString) return null
      const [hours, minutes, seconds] = timeString.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0))
      return date
    },
    handleEditFileUpload(event) {
      const files = Array.from(event.target.files || [])
      event.target.value = '' // reset ให้เลือกไฟล์เดิมซ้ำได้
      files.forEach(file => { if (this.editFormData.newFiles.length < 20) this.editFormData.newFiles.push(file) })
      if (files.length && this.editFormData.newFiles.length >= 20) {
        this.$toast.add({ severity: 'warn', summary: 'แนบได้สูงสุด 20 ไฟล์ต่อรายการ', life: 3000 })
      }
    },
    removeExistingFile(index) {
      this.editFormData.existingFiles.splice(index, 1)
    },
    removeNewFile(index) {
      this.editFormData.newFiles.splice(index, 1)
    },
    async uploadNewFiles() {
      if (this.editFormData.newFiles.length === 0) return []

      const formData = new FormData()
      this.editFormData.newFiles.forEach(file => {
        formData.append('files', file)
      })

      // throw เมื่อ fail — updateRecord จะหยุดบันทึกและแจ้งผู้ใช้ (ไม่เซฟงานโดยไฟล์หาย)
      const response = await this.$http.post('/api/files/upload?type=daily_work', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000 // 10 นาที สำหรับไฟล์ใหญ่
      })
      return response.data.files || []
    },
    async updateRecord() {
      try {
        // Validate วันที่
        if (!this.editFormData.work_date || isNaN(this.editFormData.work_date.getTime())) {
          this.$toast.add({
            severity: 'error',
            summary: 'ข้อผิดพลาด',
            detail: 'วันที่ไม่ถูกต้อง กรุณาเลือกวันที่ใหม่',
            life: 3000
          })
          return
        }

        // รองรับการทำงานข้ามวัน - ไม่ต้อง validate เวลา

        // Upload ไฟล์ใหม่ — ถ้า fail ให้หยุดบันทึก ไม่บันทึกงานโดยไฟล์หาย
        let newUploadedFiles
        try {
          newUploadedFiles = await this.uploadNewFiles()
        } catch (uploadErr) {
          this.$toast.add({
            severity: 'error',
            summary: 'อัปโหลดไฟล์ไม่สำเร็จ',
            detail: uploadErr.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง (งานยังไม่ถูกบันทึก)',
            life: 5000
          })
          return
        }

        // รวมไฟล์เดิมกับไฟล์ใหม่
        const allFiles = [...this.editFormData.existingFiles, ...newUploadedFiles]

        const formattedDate = this.formatDateForAPI(this.editFormData.work_date)

        if (!formattedDate) {
          this.$toast.add({
            severity: 'error',
            summary: 'ข้อผิดพลาด',
            detail: 'ไม่สามารถแปลงวันที่ได้ กรุณาเลือกวันที่ใหม่',
            life: 3000
          })
          return
        }

        const updateData = {
          task_id: this.editFormData.task_id,
          step_id: this.editFormData.step_id,
          step_ids: this.editFormData.step_ids || [],
          work_date: formattedDate,
          start_time: this.editFormData.start_time_text + ':00',
          end_time: this.editFormData.end_time_text + ':00',
          work_status: this.editFormData.work_status,
          location: this.editFormData.location,
          work_description: this.editFormData.work_description,
          files: allFiles
        }


        await this.$http.put(`/api/daily-work/${this.editFormData.id}`, updateData)

        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'แก้ไขรายการงานเรียบร้อยแล้ว',
          life: 3000
        })

        this.editDialog = false

        // Auto-refresh data
        await this.loadWorkRecords()

        // Emit event for parent component to refresh
        this.$emit('record-updated')

        // Dispatch global event for real-time update
        window.dispatchEvent(new CustomEvent('workRecordUpdated'))
        window.dispatchEvent(new CustomEvent('taskStatusChanged'))

      } catch (err) {
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: err.response?.data?.error || 'ไม่สามารถแก้ไขรายการงานได้',
          life: 5000
        })
      }
    },
    showDetails(record, group) {
      this.selectedRecord = record
      this.detailGroup = group || null
      this.detailDialog = true
    },
    // แปลง files (jsonb ที่อาจเป็น string) เป็น array
    parseFiles(files) {
      if (typeof files === 'string') {
        try { files = JSON.parse(files) } catch { files = [] }
      }
      return Array.isArray(files) ? files : []
    },
    dtStatusClass(status) {
      if (status === 'cancelled') return 'st-cancelled'
      if (status === 'completed') return 'st-completed'
      return 'st-active'
    },
    // Method สำหรับตัดข้อความให้สั้น
    truncateText(text, maxLength) {
      if (!text) return '-'
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    },
    // Method สำหรับ refresh ข้อมูลจากภายนอก
    async refreshData() {
      await this.loadWorkRecords()
    },
    // Method สำหรับตรวจสอบข้อมูลที่จำเป็น
    validateRecord(record) {
      const required = ['id', 'work_date', 'work_status']
      const missing = required.filter(field => !record[field])
      if (missing.length > 0) return false
      return true
    },
    selectProj(key, proj) {
      const current = this.selectedProjMap[key]
      this.selectedProjMap = {
        ...this.selectedProjMap,
        [key]: current?.id === proj.id ? null : proj
      }
    },
    toggleRow(data) {
      const key = data._key
      const newRows = { ...this.expandedRows }
      if (newRows[key]) {
        delete newRows[key]
      } else {
        newRows[key] = data
      }
      this.expandedRows = newRows
    }
  }
}
</script>

<style scoped>
.group-projects-wrap { position: relative; }

/* Multi-project summary ในปุ่ม expander */
.multi-proj-summary {
  cursor: pointer;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 10px;
  background: #f8fafc;
  transition: background 0.15s;
}
.multi-proj-summary:hover { background: #eff6ff; border-color: #bfdbfe; }
.multi-proj-header {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 6px;
}
.multi-proj-icon { color: #2f66b3; font-size: max(0.75rem, var(--min-fs)); }
.multi-proj-count { font-weight: 700; font-size: max(0.82rem, var(--min-fs)); color: #1e40af; }
.multi-proj-list { display: flex; flex-direction: column; gap: 4px; }
.multi-proj-item {
  display: flex; align-items: center; gap: 5px;
  padding: 3px 6px;
  background: white;
  border-radius: 5px;
  border: 1px solid #e5e7eb;
}
.multi-proj-num { font-size: max(0.72rem, var(--min-fs)); color: #55657a; font-weight: 600; min-width: 14px; }
.multi-proj-name { font-size: max(0.78rem, var(--min-fs)); color: #374151; font-weight: 500; }

/* Expansion row */
.expansion-projects {
  padding: 12px 16px 8px;
  background: #f8fafc;
  border-top: 2px solid #e2e8f0;
}
.expansion-proj-row {
  display: grid;
  grid-template-columns: 100px 2fr 2fr 1.2fr 0.8fr 1fr 0.7fr 0.6fr;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  margin-bottom: 5px;
}
.expansion-proj-row:last-child { margin-bottom: 0; border-bottom: none; }
.expansion-header {
  background: #e8f0fe !important;
  font-weight: 600;
  font-size: max(0.78rem, var(--min-fs));
  color: #1e40af;
  border-radius: 6px;
  margin-bottom: 6px;
  padding: 8px 12px;
  border: 1px solid #bfdbfe;
}
.exp-cell { font-size: max(0.82rem, var(--min-fs)); }
.exp-cell-time { font-size: max(0.82rem, var(--min-fs)); font-weight: 600; color: #374151; white-space: nowrap; }
.exp-cell-project { display: flex; flex-direction: column; gap: 3px; }
.exp-cell-steps { display: flex; flex-direction: column; gap: 4px; }
.exp-cell-actions { display: flex; gap: 2px; align-items: center; flex-wrap: wrap; }
.proj-preview-name {
  font-weight: 500;
  white-space: normal;
  word-break: break-word;
  flex: 1;
}
.proj-detail-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 4px;
  font-size: max(0.75rem, var(--min-fs));
}
.proj-detail-label {
  color: #525f70;
  font-weight: 500;
  white-space: nowrap;
  padding-top: 2px;
}

/* Multi-project row: JS จัดการ colspan และซ่อน td ผ่าน applyColspan() */
.history-table :deep(.col-project) {
  min-width: 280px;
}.group-proj-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 9999;
  background: white; border: 1px solid #e2e8f0; border-radius: 8px;
  box-shadow: none; min-width: 280px;
  max-height: 360px; overflow-y: auto; padding: 6px;
}
.group-proj-item {
  border: 1px solid #e5e7eb; border-radius: 6px;
  padding: 8px 10px; margin-bottom: 6px; background: #fafafa;
}
.group-proj-item:last-child { margin-bottom: 0; }
.proj-item-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap; }
.proj-steps { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
.step-tag-mini {
  font-size: max(0.7rem, var(--min-fs)); padding: 2px 6px; border-radius: 10px;
  border: 1px solid; cursor: pointer; white-space: nowrap;
}
.step-tag-mini:hover { opacity: 0.8; }
.proj-item-actions { display: flex; gap: 2px; justify-content: flex-end; }

.history-card {
  width: 100%;
  margin: 0;
  box-shadow: none;
  border: 1px solid #e9ecef;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: max(0.85rem, var(--min-fs));
  font-weight: 500;
}

.step-badge i {
  font-size: max(0.75rem, var(--min-fs));
}

.text-muted {
  color: #55657a;
}

.step-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 0.5rem;
  border-left: 3px solid #9ca3af;
}

.step-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #333;
}

.step-badge-small {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.step-badge-small i {
  font-size: max(0.7rem, var(--min-fs));
}

.step-status-tag {
  font-size: max(0.65rem, var(--min-fs));
  padding: 0.1rem 0.4rem;
  border-radius: 8px;
  color: white;
  margin-left: auto;
}

.step-name i {
  color: #6366f1;
  margin-right: 4px;
}

.step-detail {
  font-size: max(0.8rem, var(--min-fs));
  color: #525f70;
}

.step-detail i {
  margin-right: 4px;
  font-size: max(0.75rem, var(--min-fs));
}

.badge-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 40px;
}

.badge-container :deep(.p-badge) {
  white-space: normal !important;
  word-break: keep-all !important;
  overflow-wrap: break-word !important;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.25rem 0.4rem !important;
  line-height: 1.5 !important;
  display: inline-block !important;
  max-width: 100%;
  height: auto !important;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #525f70;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 1rem;
}

.empty-state p {
  margin-top: 1rem;
  font-size: 1.1rem;
  font-family: inherit;
}

.history-table :deep(.p-datatable) {
  font-family: inherit;
}

.history-table :deep(.p-datatable-thead > tr > th) {
  font-weight: 600;
  padding: 1rem 0.75rem;
  font-size: 0.9rem;
}

.history-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #f1f3f4;
  vertical-align: middle;
}

.employee-info {
  display: flex;
  flex-direction: column;
}

.employee-name {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.clickable-name {
  cursor: pointer;
  color: #2f66b3;
  transition: all 0.2s;
}

.clickable-name:hover {
  color: #2f66b3;
  text-decoration: underline;
}

.position-text {
  color: #525f70;
  font-size: max(0.85rem, var(--min-fs));
  font-weight: 500;
}

.department-text {
  color: #55657a;
  font-size: max(0.85rem, var(--min-fs));
  font-weight: 500;
}

.id-badge-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.custom-id-badge {
  background-color: #3369ac !important;
  color: white !important;
  font-weight: 700 !important;
  padding: 0.4rem 0.6rem !important;
  border-radius: 8px !important;
  font-size: max(0.85rem, var(--min-fs)) !important;
  border: 2px solid rgba(74, 144, 226, 0.2) !important;
  box-shadow: none !important;
  letter-spacing: 0.5px !important;
  min-width: 50px !important;
  text-align: center !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-name {
  font-weight: 600;
  color: #495057;
  word-wrap: break-word;
  white-space: normal;
}

.so-number {
  font-size: max(0.8rem, var(--min-fs));
  color: #525f70;
  background: #e3f2fd;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time-info i {
  margin-right: 0.5rem;
  color: #2f66b3;
}

.total-hours {
  font-size: max(0.8rem, var(--min-fs));
  color: #28a745;
  font-weight: 600;
}

.sale-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #495057;
}

.sale-info i {
  color: #2f66b3;
}

.text-muted {
  color: #525f70;
}

.description-preview {
  font-size: 0.9rem;
  color: #495057;
  line-height: 1.3;
}

/* Edit Form Styles */
.edit-form {
  padding: 0;
}

.edit-form-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.edit-row {
  width: 100%;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.edit-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-label i {
  color: #6366f1;
  font-size: max(0.85rem, var(--min-fs));
}

.file-upload-area {
  margin-bottom: 0.75rem;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.file-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: max(0.85rem, var(--min-fs));
}

.file-chip.new {
  background: #dbeafe;
}

.file-chip .remove-file {
  cursor: pointer;
  color: #dc2626;
  font-size: max(0.75rem, var(--min-fs));
}

.file-chip .remove-file:hover {
  color: #dc2626;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group.full-width {
  grid-column: 1 / -1;
}

.time-range-group .time-range-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-range-group .time-input {
  width: 80px;
  text-align: center;
}

.time-range-group .time-separator {
  font-weight: bold;
  color: #525f70;
}

.time-range-group .time-total {
  font-size: 0.9rem;
  color: #525f70;
  margin-left: 0.5rem;
}

.input-label {
  font-weight: 500;
  color: #333;
}

.corporate-input,
.corporate-dropdown {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.file-upload-section {
  margin-bottom: 1rem;
}

.existing-files,
.new-files {
  margin-top: 1rem;
}

.existing-files h4,
.new-files h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.disabled-text {
  color: #525f70;
  font-size: max(0.8rem, var(--min-fs));
  font-style: italic;
}

.attachments-info {
  display: flex;
  justify-content: center;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #f9f9f9;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-preview {
  width: 50px;
  height: 50px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  cursor: pointer;
}

.file-preview:hover {
  opacity: 0.8;
}

.file-icon {
  font-size: 1.5rem;
  color: #525f70;
}

.file-name {
  font-weight: 500;
}

.full-image {
  width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.no-files-dialog {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.file-upload-section {
  margin-bottom: 1rem;
}

.existing-files,
.new-files {
  margin-top: 1rem;
}

.existing-files h4,
.new-files h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
}

.no-files {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #55657a;
  font-size: 0.9rem;
  width: 100%;
  text-align: center;
}

.file-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2f66b3;
  font-size: 0.9rem;
}

.file-indicator i {
  color: #2f66b3;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 8px;
  box-shadow: none;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: dialogSlideIn 0.3s ease-out;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.dialog-header h3 {
  margin: 0;
  color: #495057;
  font-size: 1.25rem;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #525f70;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.dialog-close:hover {
  background: #e9ecef;
  color: #495057;
}

.dialog-body {
  padding: 1.5rem;
}

.work-description {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #3a7bd0;
  white-space: pre-wrap;
  line-height: 1.6;
  color: #495057;
  font-size: 0.95rem;
}

.detail-content {
  line-height: 1.6;
}

.detail-content p {
  margin: 0.5rem 0;
}

/* ===== Dialog รายละเอียดงาน (dt-*) ===== */
.dt-wrap { display: flex; flex-direction: column; gap: 1rem; }
.dt-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background-color: #e5f0fe;
  border: 1.5px solid #bfdbfe;
  border-radius: 12px;
  padding: 0.85rem 1rem;
}
.dt-icon {
  width: 40px; height: 40px; border-radius: 11px;
  background-color: #3369ac;
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 1rem; flex-shrink: 0;
}
.dt-title { flex: 1; min-width: 0; }
.dt-name { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.dt-so {
  font-family: monospace; font-weight: 800; font-size: max(0.7rem, var(--min-fs));
  color: #fff; background-color: #3369ac;
  padding: 0.12rem 0.45rem; border-radius: 5px; white-space: nowrap;
}
.dt-task { font-weight: 700; color: #0f172a; font-size: 0.95rem; }
.dt-customer {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: max(0.74rem, var(--min-fs)); color: #475569; margin-top: 0.25rem;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.dt-customer i { font-size: max(0.64rem, var(--min-fs)); color: #55657a; flex-shrink: 0; }
.dt-status {
  flex-shrink: 0; font-size: max(0.7rem, var(--min-fs)); font-weight: 700;
  padding: 0.2rem 0.6rem; border-radius: 20px; white-space: nowrap;
}
.dt-status.st-completed { background: #dcfce7; color: #166534; }
.dt-status.st-cancelled { background: #fee2e2; color: #b91c1c; }
.dt-status.st-active { background: #dbeafe; color: #2a5490; }
.dt-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;
}
.dt-item { background: #f8fafc; border: 1px solid #eef2f6; border-radius: 10px; padding: 0.6rem 0.8rem; }
.dt-label {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: max(0.66rem, var(--min-fs)); font-weight: 700; color: #55657a;
  text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.25rem;
}
.dt-label i { font-size: max(0.66rem, var(--min-fs)); }
.dt-value { font-size: max(0.86rem, var(--min-fs)); color: #0f172a; font-weight: 500; }
.dt-section { display: flex; flex-direction: column; gap: 0.5rem; }
.dt-section-title {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: max(0.78rem, var(--min-fs)); font-weight: 800; color: #334155;
}
.dt-section-title i { color: #2f66b3; font-size: max(0.78rem, var(--min-fs)); }
.dt-cats { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.dt-desc {
  background: #f8fafc; border: 1px solid #eef2f6; border-radius: 10px;
  padding: 0.75rem 1rem; font-size: max(0.88rem, var(--min-fs)); color: #334155;
  line-height: 1.65; white-space: pre-wrap; word-break: break-word;
}
.dt-desc-empty { color: #55657a; font-style: italic; }
.dt-files { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.dt-file {
  width: 72px; height: 72px; border-radius: 10px; overflow: hidden;
  border: 1.5px solid #e2e8f0; cursor: pointer; background: #f8fafc;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.dt-file:hover { border-color: #4A90E2; }
.dt-thumb { width: 100%; height: 100%; object-fit: cover; }
.dt-file-icon { font-size: 1.4rem; color: #55657a; }
.dt-footer { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap; }
@media (max-width: 640px) {
  .dt-grid { grid-template-columns: 1fr; }
  .dt-footer { flex-direction: column-reverse; }
  .dt-footer .p-button { width: 100%; }
  /* ปุ่มท้ายฟอร์มแก้ไขงาน (ยกเลิก / เพิ่มโครงการ / บันทึก): บน 375px 3 ปุ่ม + ช่องไฟ 1rem กว้างพอดีกล่อง ปุ่มโดนบีบ
     "เพิ่มโครงการ" ตัดเป็น 2 บรรทัด (ปุ่มอื่นยืดสูงตาม) และ "ยกเลิก" ล้นกรอบ → ห้ามตัดบรรทัดในปุ่ม ให้ปุ่มขยายเต็มแถว และขึ้นแถวใหม่ถ้าไม่พอ */
  .form-actions { flex-wrap: wrap; gap: 0.6rem; }
  .form-actions .p-button { flex: 1 1 auto; justify-content: center; white-space: nowrap; }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  :deep(.hide-mobile) {
    display: none !important;
  }

  .history-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 0.5rem;
    font-size: max(0.85rem, var(--min-fs));
  }

  .history-table :deep(.p-datatable-thead > tr > th) {
    padding: 0.75rem 0.5rem;
    font-size: max(0.8rem, var(--min-fs));
  }

  /* วันที่ลงงานหลายโครงการ — ส่วนขยาย (กดลูกศรที่แถว): เดิมเป็น grid 8 คอลัมน์แบบ fr ในกรอบกว้างแค่ ~200px บนมือถือ
     แต่ละคอลัมน์เหลือ 8–55px หัวตาราง/ข้อมูลถูกบีบจนอ่านไม่ออก → ให้คอลัมน์กว้างคงที่ (ไม่บีบ/ไม่ตัดบรรทัดแคบ ๆ)
     แล้วเลื่อนซ้าย-ขวาในส่วนขยายเพื่อดูข้อมูลที่เหลือ ไม่ต้องยัดให้หมดในหน้าจอเดียว */
  .expansion-projects {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    padding: 10px 10px 12px;
  }
  .expansion-projects::before {
    content: "↔ เลื่อนซ้าย-ขวาเพื่อดูข้อมูลต่อ";
    display: block;
    position: sticky;
    left: 0;
    width: max-content;
    margin-bottom: 8px;
    font-size: max(0.78rem, var(--min-fs));
    font-weight: 600;
    color: #2a5a96;
  }
  .expansion-proj-row {
    grid-template-columns: 110px 220px 230px 140px 110px 140px 90px 100px;
    width: max-content;
    min-width: 100%;
    box-sizing: border-box;
  }

  /* กล่องสรุป "N โครงการ" ในการ์ดมือถือ: เดิมอยู่ในช่องค่ากว้างแค่ ~140px → รหัส SO แตกเป็น "S O 2 51 01" ตั้งเรียง ชื่อโครงการเหลือคอลัมน์ ~50px
     ให้ช่องนี้กว้างเต็มการ์ด (ป้ายชื่ออยู่บน) แต่ละโครงการอยู่บรรทัดเดียว ไม่ตัดบรรทัด แล้วเลื่อนซ้าย-ขวาดูส่วนที่เหลือ */
  .history-card :deep(.p-datatable-tbody > tr > td:has(.multi-proj-summary)) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.35rem;
  }
  .history-card :deep(.p-datatable-tbody > tr > td:has(.multi-proj-summary) > .p-column-title) { text-align: left; }
  .multi-proj-summary {
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }
  .multi-proj-list { width: max-content; min-width: 100%; }
  .multi-proj-item { white-space: nowrap; }
  .multi-proj-item .so-badge,
  .multi-proj-name { white-space: nowrap; overflow-wrap: normal; word-break: normal; }

  .task-info {
    max-width: 150px;
  }

  .task-name {
    font-size: max(0.85rem, var(--min-fs));
    line-height: 1.2;
  }

  .step-info {
    padding-left: 0.4rem;
  }

  .step-name {
    font-size: max(0.8rem, var(--min-fs));
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .step-badge-small {
    width: 18px;
    height: 18px;
  }

  .step-status-tag {
    font-size: max(0.8rem, var(--min-fs));
    padding: 0.1rem 0.3rem;
  }

  .step-detail {
    font-size: max(0.8rem, var(--min-fs));
  }
}

@media (max-width: 480px) {
  .history-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.5rem 0.25rem;
    font-size: max(0.8rem, var(--min-fs));
  }

  .history-table :deep(.p-datatable-thead > tr > th) {
    padding: 0.5rem 0.25rem;
    font-size: max(0.8rem, var(--min-fs));
  }

  .custom-id-badge {
    font-size: max(0.8rem, var(--min-fs));
    padding: 0.25rem 0.4rem;
  }

  .step-name {
    font-size: max(0.8rem, var(--min-fs));
  }

  .step-status-tag {
    display: none;
  }
}

.status-badges-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.so-badge {
  /* chip รหัส SO: โทนน้ำเงินแบรนด์อ่อน (เดิมฟ้าสด ตัวขาว สีชนกับ chip อื่นในแถว) */
  background: #eaf3fe;
  color: #2f66b3;
  border: 1px solid #d5e5fa;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  font-size: max(0.75rem, var(--min-fs));
  font-weight: 500;
  display: block;
  width: fit-content;
  margin-top: 0.25rem;
}

.customer-badge {
  /* ข้อมูลลูกค้าเป็นข้อมูลรอง: เทาอ่อน (เดิมส้มสด ดึงสายตาเกินความสำคัญ) */
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  font-size: max(0.75rem, var(--min-fs));
  font-weight: 500;
  display: block;
  width: fit-content;
  margin-top: 0.25rem;
}

/* Steps Container for multiple steps */
.steps-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Step Card Mini */
.step-card-mini {
  background: white;
  border-radius: 8px;
  padding: 0.5rem;
  border-left: 3px solid #9ca3af;
  box-shadow: none;
}

.step-card-mini.clickable-step {
  cursor: pointer;
  transition: all 0.2s ease;
}

.step-card-mini.clickable-step:hover {
  background: #f0f9ff;
  box-shadow: none;
}

.step-header-mini {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.step-number-mini {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: max(0.7rem, var(--min-fs));
}

.step-name-mini {
  font-weight: 600;
  font-size: max(0.8rem, var(--min-fs));
  color: #1e293b;
}

.step-status-badge-mini {
  font-size: max(0.65rem, var(--min-fs));
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  font-weight: 500;
}

.step-desc-mini {
  font-size: max(0.7rem, var(--min-fs));
  color: #526074;
  margin: 0.3rem 0;
  white-space: pre-wrap;
}

.step-meta-mini {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.3rem;
}

.meta-item-mini {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-size: max(0.65rem, var(--min-fs));
  color: #526074;
}

.meta-item-mini i {
  font-size: max(0.6rem, var(--min-fs));
}

.user-badge-mini {
  background: #3d78bc;
  color: white;
  padding: 0.1rem 0.3rem;
  border-radius: 6px;
  font-size: max(0.6rem, var(--min-fs));
  margin-right: 0.2rem;
}

.project-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.15rem 0.4rem;
  border-radius: 8px;
  font-size: max(0.65rem, var(--min-fs));
  font-weight: 500;
}

/* ── Manage Group Dialog ── */
.manage-group-wrap { display: flex; flex-direction: column; gap: 1rem; }
.manage-group-date { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #374151; font-size: 0.95rem; flex-wrap: wrap; }
.manage-group-date .p-button { white-space: nowrap; }
.manage-group-count { background: #dbeafe; color: #2a5490; border-radius: 12px; padding: 2px 10px; font-size: max(0.78rem, var(--min-fs)); font-weight: 700; margin-left: 4px; white-space: nowrap; }
.manage-proj-list { display: flex; flex-direction: column; gap: 8px; }
.manage-proj-item {
  display: flex; align-items: center; justify-content: space-between;
  border: 1px solid #e2e8f0; border-left: 4px solid #4A90E2;
  border-radius: 8px; padding: 0.75rem 1rem;
  background: #f8fafc;
}
.manage-proj-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.manage-proj-num { width: 24px; height: 24px; border-radius: 50%; background: #3d78bc; color: #fff; font-size: max(0.72rem, var(--min-fs)); font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.manage-proj-detail { flex: 1; min-width: 0; }
.manage-proj-name { font-weight: 600; color: #1e293b; font-size: max(0.875rem, var(--min-fs)); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.manage-proj-time { font-size: max(0.78rem, var(--min-fs)); color: #526074; margin-top: 2px; display: flex; align-items: center; gap: 4px; }
.manage-proj-actions { display: flex; gap: 4px; flex-shrink: 0; }
.so-badge-sm { background: #eaf3fe; color: #2f66b3; border: 1px solid #d5e5fa; padding: 1px 6px; border-radius: 6px; font-size: max(0.68rem, var(--min-fs)); font-weight: 700; white-space: nowrap; }

/* ── Edit Dialog Dropdown custom styles ── */
.edit-val-row,
.edit-opt-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  max-width: 100%;
  overflow: hidden;
}

.edit-opt-mine {
  background: #fefce8;
  border-left: 3px solid #f59e0b;
  padding: 3px 6px;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
}

.edit-so-tag {
  background: #3d78bc;
  color: #fff;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: max(0.7rem, var(--min-fs));
  font-weight: 700;
  flex-shrink: 0;
  white-space: nowrap;
}

.edit-mine-tag {
  background: #a46a07;
  color: #fff;
  font-size: max(0.65rem, var(--min-fs));
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  flex-shrink: 0;
  white-space: nowrap;
}

.edit-task-txt {
  flex: 1;
  min-width: 0;
  word-break: break-word;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.edit-ph {
  color: #55657a;
}
</style>
