<template>
  <Card class="history-card">
    <template #content>
      <div v-if="tasks.length === 0" class="empty-state">
        <i class="pi pi-briefcase" style="font-size: 4rem; color: #ccc;"></i>
        <p>ยังไม่มีงานที่เพิ่มไว้</p>
      </div>

      <EnhancedDataTable v-else-if="categories.length > 0" :data="enrichedTasks" 
        :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]" 
        responsiveLayout="scroll" class="history-table" stripedRows>
        
        <Column field="id" header="รหัสงาน" :sortable="true">
          <template #body="slotProps">
            <div style="text-align: center;">
              <Badge :value="slotProps.data.id" class="custom-id-badge" />
            </div>
          </template>
        </Column>

        <Column field="task_name" header="ชื่อโครงการ" :sortable="true" style="min-width: 250px;">
          <template #body="slotProps">
            <div class="task-name">{{ slotProps.data.task_name }}</div>
          </template>
        </Column>

        <Column field="so_number" header="เลข SO">
          <template #body="slotProps">
            <div v-if="slotProps.data.so_number" class="so-number">
              {{ slotProps.data.so_number }}
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </Column>

        <Column field="contract_number" header="เลขที่สัญญา" style="min-width: 150px;">
          <template #body="slotProps">
            {{ slotProps.data.contract_number || '-' }}
          </template>
        </Column>

        <Column field="customer_info" header="ข้อมูลลูกค้า" style="min-width: 150px;">
          <template #body="slotProps">
            {{ slotProps.data.customer_info || '-' }}
          </template>
        </Column>

        <Column field="sale_owner" header="Sale เจ้าของงาน" style="min-width: 150px;">
          <template #body="slotProps">
            <div v-if="slotProps.data.sale_owner" class="sale-info">
              <i class="pi pi-user"></i>
              <span class="clickable-name" @click="showSaleUserInfo(slotProps.data.sale_owner)">
                {{ slotProps.data.sale_owner }}
              </span>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </Column>

        <Column field="category" header="หมวดหมู่" :sortable="true" style="min-width: 120px; text-align: center;">
          <template #body="slotProps">
            <div class="category-badges">
              <Badge v-for="cat in parseCategoryArray(slotProps.data.category)" :key="cat"
                     :value="getCategoryLabel(cat)" 
                     :style="{ backgroundColor: getCategoryColor(cat), color: '#fff', fontWeight: 'bold', margin: '2px' }" 
                     class="category-badge" />
            </div>
          </template>
        </Column>

        <Column field="project_start_date" header="วันเริ่มโครงการ" :sortable="true">
          <template #body="slotProps">
            {{ slotProps.data.project_start_date ? formatDate(slotProps.data.project_start_date) : '-' }}
          </template>
        </Column>

        <Column field="project_end_date" header="วันสิ้นสุดโครงการ" :sortable="true">
          <template #body="slotProps">
            {{ slotProps.data.project_end_date ? formatDate(slotProps.data.project_end_date) : '-' }}
          </template>
        </Column>

        <Column header="รายละเอียด">
          <template #body="slotProps">
            <Button 
              label="ดูรายละเอียด" 
              icon="pi pi-info-circle" 
              size="small" 
              severity="info" 
              outlined 
              @click="showTaskDetails(slotProps.data)"
              :disabled="!slotProps.data.description" />
          </template>
        </Column>

        <Column header="สถานะ" style="text-align: center; min-width: 180px;">
          <template #body="slotProps">
            <div class="status-badges-column">
              <!-- ถ้า task เสร็จสิ้นแล้ว แสดง completed -->
              <Badge v-if="slotProps.data.status === 'completed'" value="เสร็จสิ้น" 
                     :style="{ backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold' }" />
              <!-- ถ้ามี project_statuses จาก workflow -->
              <template v-else-if="getLatestProjectStatuses(slotProps.data).length > 0">
                <Badge v-for="ps in getLatestProjectStatuses(slotProps.data)" :key="ps"
                  :value="getProjectStatusLabel(ps)" 
                  :style="{ backgroundColor: getProjectStatusColor(ps), color: '#fff', fontWeight: 'bold' }" />
              </template>
              <!-- ไม่มี project_statuses แสดง - -->
              <span v-else class="no-status">-</span>
            </div>
          </template>
        </Column>

        <Column header="จัดการ" style="width: 200px;">
          <template #body="slotProps">
            <div class="action-buttons">
              <Button 
                icon="pi pi-eye" 
                size="small" 
                severity="info" 
                outlined
                @click="viewTaskWorks(slotProps.data)"
                v-tooltip="'ดูงานรายวัน'"
              />
              <Button 
                icon="pi pi-pencil" 
                size="small" 
                severity="warning" 
                outlined
                @click="editTask(slotProps.data)"
                v-tooltip="'แก้ไข'"
              />
              <Button 
                icon="pi pi-trash" 
                size="small" 
                severity="danger" 
                outlined
                @click="confirmDeleteTask(slotProps.data)"
                v-tooltip="'ลบ'"
              />
            </div>
          </template>
        </Column>

        <Column header="ไฟล์แนบ" style="width: 80px;">
          <template #body="slotProps">
            <div v-if="hasFiles(slotProps.data)" class="attachments-info">
              <Button icon="pi pi-paperclip" size="small" severity="info" outlined
                @click="downloadTaskFiles(slotProps.data)" v-tooltip="`${slotProps.data.files.length} ไฟล์`" />
            </div>
            <span v-else class="no-files">-</span>
          </template>
        </Column>
      </EnhancedDataTable>
    </template>
  </Card>

  <!-- Dialog สำหรับแสดงรายละเอียดงาน -->
  <div v-if="detailDialog" class="dialog-overlay" @click="detailDialog = false">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>รายละเอียดงาน</h3>
        <button class="dialog-close" @click="detailDialog = false">&times;</button>
      </div>
      <div class="dialog-body">
        <div class="work-description">
          {{ selectedTask?.description || 'ไม่มีรายละเอียด' }}
        </div>
      </div>
    </div>
  </div>

  <!-- Files Dialog -->
  <Dialog v-model:visible="filesDialog" modal header="ไฟล์แนบ" :style="{ width: '90vw', maxWidth: '800px' }" :draggable="false">
    <div v-if="selectedTaskFiles && selectedTaskFiles.length > 0" class="files-list">
      <div v-for="(file, index) in selectedTaskFiles" :key="index" class="file-item">
        <div class="file-info">
          <img v-if="isImageFile(file)" :src="getFileUrl(file)" class="file-preview" @click="viewFullImage(file)" />
          <i v-else class="pi pi-file file-icon"></i>
          <span class="file-name">{{ file }}</span>
        </div>
        <Button 
          icon="pi pi-download" 
          size="small" 
          severity="success" 
          outlined
          @click="downloadFile(file)"
          v-tooltip="'ดาวน์โหลด'"
        />
      </div>
    </div>
    <div v-else class="no-files">
      <p>ไม่มีไฟล์แนบ</p>
    </div>
  </Dialog>

  <!-- Full Image Dialog -->
  <Dialog v-model:visible="fullImageDialog" modal header="รูปภาพ" :style="{ width: '90vw', maxWidth: '900px' }" :draggable="false">
    <img :src="fullImageUrl" class="full-image" />
  </Dialog>

  <!-- Task Works Dialog -->
  <Dialog v-model:visible="taskWorksDialog" modal :header="`งานรายวันของโครงการ: ${selectedTask?.task_name || ''}`" 
          :style="{ width: '90vw', maxWidth: '1200px' }" :draggable="false" position="center">
    <div v-if="loadingWorks" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
      <p>กำลังโหลดข้อมูล...</p>
    </div>
    
    <div v-else-if="taskWorks.length === 0" class="empty-works">
      <i class="pi pi-inbox" style="font-size: 3rem; color: #ccc;"></i>
      <p>ยังไม่มีการลงงานรายวันสำหรับโครงการนี้</p>
    </div>
    
    <div v-else class="works-container">
      <div class="works-summary">
        <div class="summary-item">
          <i class="pi pi-calendar"></i>
          <span>ทั้งหมด: <strong>{{ getActiveWorksCount() }}</strong> รายการ</span>
        </div>
        <div class="summary-item">
          <i class="pi pi-clock"></i>
          <span>รวม: <strong>{{ getTotalHours() }}</strong></span>
        </div>
      </div>
      
      <div class="works-filters">
        <div class="filter-group">
          <label>กรองตามสถานะ:</label>
          <Dropdown v-model="workStatusFilter" :options="workStatusFilterOptions" 
                    optionLabel="label" optionValue="value" placeholder="ทั้งหมด" 
                    class="filter-dropdown" />
        </div>
        <div class="filter-group">
          <label>เรียงตาม:</label>
          <Dropdown v-model="workSortBy" :options="workSortOptions" 
                    optionLabel="label" optionValue="value" 
                    class="filter-dropdown" />
        </div>
      </div>
      
      <div class="works-table-wrapper">
        <table class="works-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>วันที่</th>
              <th>ผู้ปฏิบัติงาน</th>
              <th>ขั้นตอน</th>
              <th>เวลา</th>
              <th>ชั่วโมง</th>
              <th>สถานะ</th>
              <th>สถานที่</th>
              <th>ไฟล์แนบ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="work in filteredAndSortedWorks" :key="work.id">
              <td class="text-center">
                <Badge :value="work.id" severity="info" />
              </td>
              <td>{{ formatDate(work.work_date) }}</td>
              <td>
                <span class="clickable-name" @click="showUserInfo(work.employee_name, work.user_id)">
                  {{ work.employee_name || 'ไม่ระบุ' }}
                </span>
              </td>
              <td>
                <!-- Multiple steps -->
                <div v-if="work.steps_data && work.steps_data.length > 0" class="steps-container-mini">
                  <div v-for="step in work.steps_data" :key="step.id" class="step-badge-inline"
                    :style="{ borderLeftColor: getStepColorFromWork(step) }">
                    <span class="step-num" :style="{ background: getStepColorFromWork(step) }">{{ (step.step_order || 0) + 1 }}</span>
                    <span>{{ step.step_name }}</span>
                    <span class="step-status-mini" :style="{ color: getStepColorFromWork(step) }">{{ getStepLabelFromWork(step) }}</span>
                  </div>
                </div>
                <!-- Single step -->
                <div v-else-if="work.step_name" class="step-badge-inline" :style="{ borderLeftColor: '#3b82f6' }">
                  <i class="pi pi-sitemap"></i> {{ work.step_name }}
                </div>
                <span v-else class="text-muted">-</span>
              </td>
              <td>{{ work.start_time }} - {{ work.end_time }}</td>
              <td class="text-center">{{ formatHoursMinutes(work.total_hours) }}</td>
              <td class="text-center">
                <!-- ถ้ามี workflow step ให้แสดง project_statuses แยกตาม step -->
                <template v-if="work.steps_data && work.steps_data.length > 0">
                  <div v-for="step in work.steps_data" :key="'status-'+step.id" class="step-statuses-row">
                    <template v-if="step.project_statuses && step.project_statuses.length > 0">
                      <Badge v-for="ps in step.project_statuses" :key="ps"
                        :value="getStatusLabel(ps)" 
                        :style="{ backgroundColor: getStatusColor(ps), color: '#fff', fontWeight: 'bold', fontSize: '0.75rem' }" />
                    </template>
                    <Badge v-else value="-" :style="{ backgroundColor: '#9e9e9e', color: '#fff', fontWeight: 'bold', fontSize: '0.75rem' }" />
                  </div>
                </template>
                <!-- ถ้าไม่มี workflow ให้แสดง work_status -->
                <Badge v-else-if="work.work_status" :value="getStatusLabel(work.work_status)" 
                       :style="{ backgroundColor: getStatusColor(work.work_status), color: '#fff', fontWeight: 'bold' }" />
                <Badge v-else value="-" :style="{ backgroundColor: '#9e9e9e', color: '#fff', fontWeight: 'bold' }" />
              </td>
              <td>{{ work.location || '-' }}</td>
              <td class="text-center">
                <Button v-if="work.files && work.files.length > 0"
                        icon="pi pi-paperclip" 
                        :label="work.files.length.toString()"
                        size="small" 
                        severity="success" 
                        outlined
                        @click="showWorkFiles(work)"
                        v-tooltip="`${work.files.length} ไฟล์`" />
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <template #footer>
      <Button label="ปิด" icon="pi pi-times" @click="taskWorksDialog = false" />
    </template>
  </Dialog>

  <!-- Work Files Dialog -->
  <Dialog v-model:visible="workFilesDialog" modal header="ไฟล์แนบ" 
          :style="{ width: '500px' }" :draggable="false">
    <div v-if="selectedWorkFiles && selectedWorkFiles.length > 0" class="files-list">
      <div v-for="(file, index) in selectedWorkFiles" :key="index" class="file-item">
        <div class="file-info">
          <img v-if="isImageFile(file)" :src="getFileUrl(file)" class="file-preview" @click="viewFullImage(file)" />
          <i v-else class="pi pi-file file-icon"></i>
          <span class="file-name">{{ file }}</span>
        </div>
        <Button icon="pi pi-download" size="small" severity="success" outlined
                @click="downloadWorkFile(file)" v-tooltip="'ดาวน์โหลด'" />
      </div>
    </div>
  </Dialog>

  <!-- Edit Task Dialog -->
  <Dialog v-model:visible="editDialog" modal header="แก้ไขรายการงาน" :style="{ width: '95vw', maxWidth: '1200px' }" :draggable="false" position="center">
    <form @submit.prevent="updateTask" class="edit-form">
      <div class="form-grid">
        <div class="input-group">
          <label class="input-label">ชื่อโครงการ *</label>
          <InputText v-model="editFormData.task_name" required class="corporate-input" />
        </div>

        <div class="input-group">
          <label class="input-label">เลข SO (Project)</label>
          <InputText v-model="editFormData.so_number" class="corporate-input" />
        </div>
        
        <div class="input-group">
          <label class="input-label">เลขที่สัญญา</label>
          <InputText v-model="editFormData.contract_number" class="corporate-input" />
        </div>
        
        <div class="input-group">
          <label class="input-label">Sale เจ้าของงาน</label>
          <Dropdown v-model="editFormData.sale_owner" :options="saleUsers" 
            optionLabel="label" optionValue="value" placeholder="เลือก Sale" 
            :filter="true" filterPlaceholder="ค้นหา..." :showClear="true"
            class="corporate-input w-full">
            <template #option="{ option }">
              <div style="line-height:1.4">
                <div><i class="pi pi-user" style="font-size:0.8rem;margin-right:4px"></i><b>{{ option.label }}</b></div>
                <small v-if="option.position || option.department" style="color:#888">{{ option.position }}<span v-if="option.position && option.department"> · </span>{{ option.department }}</small>
              </div>
            </template>
          </Dropdown>
        </div>

        <div class="input-group">
          <label class="input-label">วันเริ่มโครงการ</label>
          <Calendar v-model="editFormData.project_start_date" dateFormat="dd/mm/yy" class="corporate-input" />
        </div>

        <div class="input-group">
          <label class="input-label">วันสิ้นสุดโครงการ</label>
          <Calendar v-model="editFormData.project_end_date" dateFormat="dd/mm/yy" 
                    :minDate="editFormData.project_start_date" class="corporate-input" />
        </div>

        <div class="input-group">
          <label class="input-label">ข้อมูลลูกค้า</label>
          <InputText v-model="editFormData.customer_info" class="corporate-input" />
        </div>

        <div class="input-group">
          <label class="input-label">หมวดหมู่งาน *</label>
          <MultiSelect v-model="editFormData.category" :options="categories" 
                    optionLabel="label" optionValue="value" placeholder="เลือกหมวดหมู่งาน" 
                    class="corporate-input" display="chip" :maxSelectedLabels="3" :showToggleAll="false">
          </MultiSelect>
        </div>

        <div class="input-group full-width">
          <label class="input-label">รายละเอียด</label>
          <Textarea v-model="editFormData.description" rows="4" class="corporate-input" />
        </div>

        <div class="input-group full-width">
          <label class="input-label">
            <i class="pi pi-sitemap"></i> Workflow Steps
          </label>
          <WorkflowBuilder v-model="editFormData.steps" :taskId="editFormData.id" :showCompleteButton="false" />
        </div>

        <div class="input-group full-width">
          <label class="input-label">ไฟล์แนบ</label>
          <div class="file-upload-section">
            <input type="file" ref="editFileInput" @change="handleEditFileUpload" 
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple class="file-input" style="display: none;">
            <Button type="button" 
              label="เพิ่มไฟล์" 
              icon="pi pi-upload" 
              severity="secondary" 
              outlined 
              @click="$refs.editFileInput.click()" />
          </div>
          
          <!-- แสดงไฟล์เดิม -->
          <div v-if="editFormData.existingFiles?.length > 0" class="existing-files">
            <h4>ไฟล์เดิม:</h4>
            <div v-for="(file, index) in editFormData.existingFiles" :key="index" class="file-item">
              <i class="pi pi-file"></i>
              <span class="file-name">{{ file }}</span>
              <Button icon="pi pi-times" size="small" severity="danger" text @click="removeExistingFile(index)" />
            </div>
          </div>
          
          <!-- แสดงไฟล์ใหม่ -->
          <div v-if="editFormData.newFiles?.length > 0" class="new-files">
            <h4>ไฟล์ใหม่:</h4>
            <div v-for="(file, index) in editFormData.newFiles" :key="index" class="file-item">
              <i class="pi pi-file"></i>
              <span class="file-name">{{ file.name }}</span>
              <Button icon="pi pi-times" size="small" severity="danger" text @click="removeNewFile(index)" />
            </div>
          </div>
        </div>
      </div>
      
      <div class="form-actions">
        <Button type="button" label="ยกเลิก" severity="secondary" outlined @click="editDialog = false" />
        <Button type="submit" label="บันทึก" severity="success" />
      </div>
    </form>
  </Dialog>

  <!-- User Info Dialog -->
  <UserInfoDialog 
    v-model:visible="showUserInfoDialog" 
    :userId="selectedUserId"
    :userName="selectedUserName"
  />
</template>

<script>
import axios from '@/utils/axiosConfig'
import EnhancedDataTable from '@/components/EnhancedDataTable.vue'
import UserInfoDialog from '@/components/UserInfoDialog.vue'
import WorkflowBuilder from '@/components/WorkflowBuilder.vue'

export default {
  name: 'TaskList',
  components: {
    EnhancedDataTable,
    UserInfoDialog,
    WorkflowBuilder
  },
  created() {
    this.$http = axios
  },
  async mounted() {
    // Listen for task updates
    window.addEventListener('taskUpdated', this.handleTaskUpdate)
    window.addEventListener('workRecordUpdated', this.handleTaskUpdate)
    window.addEventListener('taskStatusChanged', this.handleTaskUpdate)
    window.addEventListener('categoriesUpdated', this.handleCategoriesUpdate)
    window.addEventListener('statusesUpdated', this.handleStatusesUpdate)
    
    // Load categories and statuses first, then tasks
    await this.loadCategoriesFromStorage()
    await this.loadStatusesFromStorage()
    this.loadTasks()
    this.loadSaleUsers()
  },
  beforeUnmount() {
    window.removeEventListener('taskUpdated', this.handleTaskUpdate)
    window.removeEventListener('workRecordUpdated', this.handleTaskUpdate)
    window.removeEventListener('taskStatusChanged', this.handleTaskUpdate)
    window.removeEventListener('categoriesUpdated', this.handleCategoriesUpdate)
    window.removeEventListener('statusesUpdated', this.handleStatusesUpdate)
  },
  data() {
    return {
      tasks: [],
      detailDialog: false,
      selectedTask: null,
      filesDialog: false,
      selectedTaskFiles: [],
      fullImageDialog: false,
      fullImageUrl: '',
      editDialog: false,
      taskWorksDialog: false,
      taskWorks: [],
      loadingWorks: false,
      workFilesDialog: false,
      selectedWorkFiles: [],
      showUserInfoDialog: false,
      selectedUserId: null,
      selectedUserName: '',
      workStatusFilter: null,
      workSortBy: 'date_desc',
      workSortOptions: [
        { label: 'วันที่ล่าสุด', value: 'date_desc' },
        { label: 'วันที่เก่าสุด', value: 'date_asc' },
        { label: 'สถานะ', value: 'status' }
      ],
      editFormData: {
        id: null,
        task_name: '',
        so_number: '',
        contract_number: '',
        sale_owner: '',
        customer_info: '',
        description: '',
        category: [],
        project_start_date: null,
        project_end_date: null,
        existingFiles: [],
        newFiles: []
      },
      categoryOptions: [
        { label: 'งานทั่วไป', value: 'งานทั่วไป' },
        { label: 'งานพัฒนาระบบ', value: 'งานพัฒนาระบบ' },
        { label: 'งานบำรุงรักษา', value: 'งานบำรุงรักษา' },
        { label: 'งานประชุม', value: 'งานประชุม' },
        { label: 'งานฝึกอบรม', value: 'งานฝึกอบรม' },
        { label: 'งานวิจัย', value: 'งานวิจัย' },
        { label: 'งานเอกสาร', value: 'งานเอกสาร' },
        { label: 'งานลูกค้า', value: 'งานลูกค้า' }
      ],
      categories: [],
      workStatuses: [],
      saleUsers: [],
      allUsers: []
    }
  },
  computed: {
    workStatusFilterOptions() {
      const options = [
        { label: 'ทั้งหมด', value: null },
        { label: 'ไม่มีสถานะ (-)', value: 'no_status' }
      ]
      
      // เอาเฉพาะ statuses ที่มีใน taskWorks
      const existingValues = []
      this.taskWorks.forEach(w => {
        // เช็ค project_statuses จาก steps_data
        if (w.steps_data) {
          w.steps_data.forEach(step => {
            if (step.project_statuses) {
              step.project_statuses.forEach(ps => {
                if (!existingValues.includes(ps)) {
                  options.push({
                    label: this.getProjectStatusLabel(ps),
                    value: ps
                  })
                  existingValues.push(ps)
                }
              })
            }
          })
        }
        // fallback work_status
        if (w.work_status && !existingValues.includes(w.work_status)) {
          options.push({
            label: this.getStatusLabel(w.work_status),
            value: w.work_status
          })
          existingValues.push(w.work_status)
        }
      })
      
      return options
    },
    enrichedTasks() {
      // Add status and category labels to tasks for better search
      return this.tasks.map(task => ({
        ...task,
        statusLabel: this.getStatusLabel(task.status),
        categoryLabel: this.getCategoryLabel(task.category)
      }))
    },
    filteredAndSortedWorks() {
      let works = [...this.taskWorks]
      
      // Filter by status
      if (this.workStatusFilter) {
        if (this.workStatusFilter === 'no_status') {
          // กรองเฉพาะที่ไม่มี project_statuses
          works = works.filter(work => {
            if (!work.steps_data) return !work.work_status
            const hasProjectStatus = work.steps_data.some(s => s.project_statuses && s.project_statuses.length > 0)
            return !hasProjectStatus && !work.work_status
          })
        } else {
          // กรองตาม project_statuses หรือ work_status
          works = works.filter(work => {
            if (work.steps_data) {
              const hasStatus = work.steps_data.some(s => 
                s.project_statuses && s.project_statuses.includes(this.workStatusFilter)
              )
              if (hasStatus) return true
            }
            return work.work_status === this.workStatusFilter
          })
        }
      }
      
      // Sort
      if (this.workSortBy === 'date_desc') {
        works.sort((a, b) => new Date(b.work_date) - new Date(a.work_date))
      } else if (this.workSortBy === 'date_asc') {
        works.sort((a, b) => new Date(a.work_date) - new Date(b.work_date))
      } else if (this.workSortBy === 'status') {
        const statusOrder = { 'completed': 1, 'in_progress': 2, 'pending': 3, 'on_hold': 4 }
        works.sort((a, b) => (statusOrder[a.work_status] || 5) - (statusOrder[b.work_status] || 5))
      }
      
      return works
    }
  },
  methods: {
    confirmDeleteTask(task) {
      this.$confirm.require({
        message: `คุณต้องการลบงาน "${task.task_name}" ใช่หรือไม่?`,
        header: 'ยืนยันการลบ',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'ลบ',
        rejectLabel: 'ยกเลิก',
        acceptClass: 'p-button-danger',
        accept: () => {
          this.deleteTask(task.id)
        }
      })
    },
    async deleteTask(taskId) {
      try {
        await this.$http.delete(`/api/tasks/${taskId}`)
        
        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'ลบงานเรียบร้อยแล้ว',
          life: 3000
        })
        
        this.loadTasks()
        window.dispatchEvent(new CustomEvent('taskUpdated'))
      } catch (error) {
        
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: error.response?.data?.error || 'ไม่สามารถลบงานได้',
          life: 5000
        })
      }
    },
    async loadCategoriesFromStorage() {
      try {
        const response = await this.$http.get('/api/settings/categories')
        this.categories = response.data
      } catch (error) {
        
        // Fallback to default
        this.categories = [
          { label: '💼 งานทั่วไป', value: 'งานทั่วไป', icon: 'emoji:💼', color: '#6366f1' },
          { label: '💻 งานพัฒนา', value: 'งานพัฒนา', icon: 'emoji:💻', color: '#14b8a6' },
          { label: '🔧 งานบำรุงรักษา', value: 'งานบำรุงรักษา', icon: 'emoji:🔧', color: '#f97316' }
        ]
      }
    },
    async loadStatusesFromStorage() {
      try {
        const response = await this.$http.get('/api/settings/statuses')
        
        this.workStatuses = response.data
      } catch (error) {
        
        // Fallback to default
        this.workStatuses = [
          { label: '⏳ รอดำเนินการ', value: 'pending', icon: 'emoji:⏳', color: '#f59e0b' },
          { label: '🔄 กำลังดำเนินการ', value: 'in_progress', icon: 'emoji:🔄', color: '#3b82f6' },
          { label: '✅ เสร็จสิ้น', value: 'completed', icon: 'emoji:✅', color: '#10b981' },
          { label: '⏸️ ระงับ', value: 'on_hold', icon: 'emoji:⏸️', color: '#6c757d' }
        ]
      }
    },
    getCategoryIcon(categoryValue) {
      const category = this.categories.find(cat => cat.value === categoryValue)
      return category ? category.icon : 'pi pi-tag'
    },
    getCategoryLabel(categoryValue) {
      const category = this.categories.find(cat => cat.value === categoryValue)
      if (category && category.label) {
        // Remove all emoji and special characters
        return category.label.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}-\u{3299}]/gu, '').trim()
      }
      return categoryValue
    },
    getCategoryColor(categoryValue) {
      if (!this.categories || this.categories.length === 0) {
        return '#6c757d'
      }
      const category = this.categories.find(cat => cat.value === categoryValue)
      return category && category.color ? category.color : '#6c757d'
    },
    parseCategoryArray(category) {
      if (!category) return []
      if (Array.isArray(category)) return category
      return category.split(',').map(c => c.trim()).filter(c => c)
    },
    getStatusIcon(statusValue) {
      const status = this.workStatuses.find(s => s.value === statusValue)
      return status ? status.icon : 'pi pi-circle'
    },
    getStatusLabel(statusValue) {
      if (!statusValue) return '-'
      if (statusValue === 'cancelled') return 'ยกเลิก'
      // ลอง match ด้วย value ก่อน
      let status = this.workStatuses.find(s => s.value === statusValue)
      // ถ้าไม่เจอ ลอง match ด้วย label
      if (!status) {
        status = this.workStatuses.find(s => s.label && s.label.includes(statusValue))
      }
      if (status && status.label) {
        // Remove all emoji and special characters
        return status.label.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}-\u{3299}]/gu, '').trim()
      }
      // ถ้าไม่เจอใน workStatuses ให้แสดงค่าจริง
      return statusValue
    },
    getStatusColor(statusValue) {
      if (!statusValue) return '#9e9e9e'
      if (statusValue === 'cancelled') return '#ef4444'
      // ลอง match ด้วย value ก่อน
      let status = this.workStatuses.find(s => s.value === statusValue)
      // ถ้าไม่เจอ ลอง match ด้วย label
      if (!status) {
        status = this.workStatuses.find(s => s.label && s.label.includes(statusValue))
      }
      return status?.color || '#9e9e9e'
    },
    getLatestProjectStatuses(task) {
      if (!task.steps || task.steps.length === 0) return []
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // หา step ที่มีการลงงานจริง และวันที่ลงงานไม่เกินวันนี้
      const workingSteps = task.steps.filter(s => {
        if (!s.has_work_logged) return false
        // รองรับทั้ง project_statuses (array) และ project_status (single)
        const hasStatus = (s.project_statuses && s.project_statuses.length > 0) || s.project_status
        if (!hasStatus) return false
        if (s.latest_work_date) {
          const workDate = new Date(s.latest_work_date)
          workDate.setHours(0, 0, 0, 0)
          return workDate <= today
        }
        return true
      })
      
      if (workingSteps.length === 0) return []
      const latestStep = workingSteps.sort((a, b) => 
        new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
      )[0]
      if (latestStep.project_statuses && latestStep.project_statuses.length > 0) {
        return latestStep.project_statuses
      }
      return []
    },
    getProjectStatusLabel(status) {
      const found = this.workStatuses.find(s => s.value === status)
      if (found && found.label) {
        return found.label.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}-\u{3299}]/gu, '').trim()
      }
      return status || '-'
    },
    getProjectStatusColor(status) {
      const found = this.workStatuses.find(s => s.value === status)
      return found?.color || '#6b7280'
    },
    hasWorkflowWithWork(task) {
      if (!task.steps || task.steps.length === 0) return false
      return task.steps.some(s => s.has_work_logged)
    },
    getStepColorFromWork(step) {
      if (step.status === 'completed') return '#10b981'
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      // เกินกำหนด - เช็คก่อนเสมอ
      if (step.end_date) {
        const endDate = new Date(step.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return '#ef4444'
      }
      if (step.latest_work_date) {
        const workDate = new Date(step.latest_work_date)
        workDate.setHours(0, 0, 0, 0)
        if (workDate <= today) return '#f59e0b'
      }
      return '#3b82f6'
    },
    getStepLabelFromWork(step) {
      if (step.status === 'completed') return '(เสร็จสิ้น)'
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      // เกินกำหนด - เช็คก่อนเสมอ
      if (step.end_date) {
        const endDate = new Date(step.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return '(เกินกำหนด)'
      }
      if (step.latest_work_date) {
        const workDate = new Date(step.latest_work_date)
        workDate.setHours(0, 0, 0, 0)
        if (workDate <= today) return '(กำลังดำเนินการ)'
      }
      return '(รอดำเนินการ)'
    },
    getWorkStatusesFromWork(work) {
      if (!work.steps_data || work.steps_data.length === 0) return []
      const allStatuses = []
      work.steps_data.forEach(s => {
        if (s.project_statuses && s.project_statuses.length > 0) {
          s.project_statuses.forEach(ps => {
            if (!allStatuses.includes(ps)) allStatuses.push(ps)
          })
        }
      })
      return allStatuses
    },
    getLatestWorkingStep(task) {
      if (!task.steps || task.steps.length === 0) return '-'
      const workingSteps = task.steps.filter(s => s.assigned_users && s.assigned_users.length > 0)
      if (workingSteps.length === 0) return '-'
      return workingSteps[workingSteps.length - 1].step_name
    },
    getLatestStepColor(task) {
      if (!task.steps || task.steps.length === 0) return '#9ca3af'
      const workingSteps = task.steps.filter(s => s.assigned_users && s.assigned_users.length > 0)
      if (workingSteps.length === 0) return '#9ca3af'
      const latestStep = workingSteps[workingSteps.length - 1]
      if (latestStep.status === 'completed') return '#10b981'
      return '#3b82f6'
    },
    async loadTasks() {
      try {
        // โหลด tasks และ steps พร้อมกัน
        const [tasksRes, stepsRes] = await Promise.all([
          this.$http.get('/api/tasks'),
          this.$http.get('/api/task-steps/all', { silent: true }).catch(() => ({ data: [] }))
        ])
        
        const tasks = tasksRes.data.data || tasksRes.data || []
        const allSteps = stepsRes.data || []
        
        // จัดกลุ่ม steps ตาม task_id
        const stepsByTask = {}
        allSteps.forEach(step => {
          if (!stepsByTask[step.task_id]) stepsByTask[step.task_id] = []
          stepsByTask[step.task_id].push(step)
        })
        
        // assign steps ให้แต่ละ task
        tasks.forEach(task => {
          task.steps = stepsByTask[task.id] || []
        })
        
        this.tasks = tasks
      } catch (error) {
        this.tasks = []
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถโหลดข้อมูลงานได้',
          life: 5000
        })
      }
    },
    formatDate(date) {
      if (!date) return '-'
      try {
        // For date-only strings (YYYY-MM-DD), parse manually to avoid timezone issues
        if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = date.split('-')
          const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
          return d.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }
        return new Date(date).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } catch (error) {
        return date
      }
    },
    showTaskDetails(task) {
      this.selectedTask = task
      this.detailDialog = true
    },
    isImageFile(fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase()
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)
    },
    getFileUrl(fileName) {
      const token = localStorage.getItem('soc_token')
      return `/api/files/download/${fileName}?token=${token}`
    },
    viewFullImage(fileName) {
      this.fullImageUrl = this.getFileUrl(fileName)
      this.fullImageDialog = true
    },
    hasFiles(task) {
      return task.files && Array.isArray(task.files) && task.files.length > 0
    },
    downloadTaskFiles(task) {
      if (this.hasFiles(task)) {
        this.selectedTaskFiles = task.files
        this.filesDialog = true
      }
    },
    async downloadFile(fileName) {
      try {
        const response = await this.$http.get(`/api/files/download/${fileName}`, {
          responseType: 'blob'
        })
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = fileName.split('-').slice(2).join('-') || fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถดาวน์โหลดไฟล์ได้',
          life: 3000
        })
      }
    },
    editTask(task) {
      // Parse dates from string to Date object
      const parseDate = (dateStr) => {
        if (!dateStr) return null
        if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateStr.split('-')
          // Create date at noon to avoid timezone issues
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0)
        }
        return new Date(dateStr)
      }
      
      this.editFormData = {
        id: task.id,
        task_name: task.task_name,
        so_number: task.so_number || '',
        contract_number: task.contract_number || '',
        sale_owner: task.sale_owner || '',
        customer_info: task.customer_info || '',
        description: task.description || '',
        category: this.parseCategoryArray(task.category),
        status: task.status || null,
        project_start_date: parseDate(task.project_start_date),
        project_end_date: parseDate(task.project_end_date),
        existingFiles: [...(task.files || [])],
        newFiles: [],
        steps: []
      }
      this.editDialog = true
    },
    handleEditFileUpload(event) {
      const files = Array.from(event.target.files)
      console.log('Files selected:', files.length, files.map(f => f.name))
      this.editFormData.newFiles = [...this.editFormData.newFiles, ...files]
      console.log('Total new files:', this.editFormData.newFiles.length)
    },
    removeExistingFile(index) {
      this.editFormData.existingFiles.splice(index, 1)
    },
    removeNewFile(index) {
      this.editFormData.newFiles.splice(index, 1)
    },
    async uploadNewFiles() {
      console.log('uploadNewFiles called, files:', this.editFormData.newFiles?.length)
      if (!this.editFormData.newFiles || this.editFormData.newFiles.length === 0) return []
      
      const formData = new FormData()
      this.editFormData.newFiles.forEach(file => {
        formData.append('files', file)
      })
      
      try {
        const response = await this.$http.post('/api/files/upload?type=tasks', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        console.log('Upload response:', response.data)
        return response.data.files || []
      } catch (error) {
        console.error('Upload error:', error)
        return []
      }
    },
    async updateTask() {
      try {
        // Upload ไฟล์ใหม่
        const newUploadedFiles = await this.uploadNewFiles()
        
        // รวมไฟล์เดิมกับไฟล์ใหม่
        const allFiles = [...this.editFormData.existingFiles, ...newUploadedFiles]
        
        // Format dates to YYYY-MM-DD
        const formatDate = (date) => {
          if (!date) return null
          const d = new Date(date)
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        
        const updateData = {
          task_name: this.editFormData.task_name,
          so_number: this.editFormData.so_number,
          contract_number: this.editFormData.contract_number,
          sale_owner: this.editFormData.sale_owner,
          customer_info: this.editFormData.customer_info,
          description: this.editFormData.description,
          category: Array.isArray(this.editFormData.category) ? this.editFormData.category.join(',') : this.editFormData.category,
          status: this.editFormData.status,
          project_start_date: formatDate(this.editFormData.project_start_date),
          project_end_date: formatDate(this.editFormData.project_end_date),
          files: allFiles
        }
        
        await this.$http.put(`/api/tasks/${this.editFormData.id}`, updateData)
        
        // Save workflow steps - update existing, create new, delete removed
        const existingSteps = await this.$http.get(`/api/task-steps/task/${this.editFormData.id}`)
        const existingIds = existingSteps.data.map(s => s.id)
        const newStepIds = this.editFormData.steps.filter(s => s.id).map(s => s.id)
        
        // Delete removed steps
        for (const step of existingSteps.data) {
          if (!newStepIds.includes(step.id)) {
            await this.$http.delete(`/api/task-steps/${step.id}`)
          }
        }
        
        // Update or create steps
        if (this.editFormData.steps && this.editFormData.steps.length > 0) {
          for (const step of this.editFormData.steps) {
            const stepData = {
              ...step,
              task_id: this.editFormData.id,
              start_date: formatDate(step.start_date),
              end_date: formatDate(step.end_date)
            }
            if (step.id && existingIds.includes(step.id)) {
              // Update existing
              await this.$http.put(`/api/task-steps/${step.id}`, stepData)
            } else {
              // Create new
              await this.$http.post('/api/task-steps', stepData)
            }
          }
        }
        
        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'แก้ไขงานเรียบร้อยแล้ว',
          life: 3000
        })
        
        this.editDialog = false
        
        // Auto-refresh data
        await this.loadTasks()
        
        // Dispatch global event for real-time update
        window.dispatchEvent(new CustomEvent('taskUpdated'))
        
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: error.response?.data?.error || 'ไม่สามารถแก้ไขงานได้',
          life: 5000
        })
      }
    },
    handleTaskUpdate() {
      // Auto-refresh tasks when updated
      this.loadTasks()
    },
    handleCategoriesUpdate() {
      this.loadCategoriesFromStorage()
    },
    handleStatusesUpdate() {
      this.loadStatusesFromStorage()
    },
    async refreshData() {
      // Method for external refresh calls
      await this.loadTasks()
    },
    async viewTaskWorks(task) {
      this.selectedTask = task
      this.taskWorks = []
      this.loadingWorks = true
      this.taskWorksDialog = true
      this.workStatusFilter = null
      this.workSortBy = 'date_desc'
      
      try {
        const response = await this.$http.get(`/api/daily-work?task_id=${task.id}`)
        this.taskWorks = response.data || []
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถโหลดข้อมูลงานรายวันได้',
          life: 3000
        })
        this.taskWorks = []
      } finally {
        this.loadingWorks = false
      }
    },
    formatDateTime(date) {
      try {
        return new Date(date).toLocaleString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (error) {
        return date
      }
    },
    getActiveWorksCount() {
      if (!this.taskWorks || this.taskWorks.length === 0) return 0
      return this.taskWorks.filter(work => work.work_status !== 'cancelled').length
    },
    getTotalHours() {
      if (!this.taskWorks || this.taskWorks.length === 0) return '0 ชม. 0 นาที'
      const total = this.taskWorks
        .filter(work => work.work_status !== 'cancelled')
        .reduce((sum, work) => sum + (parseFloat(work.total_hours) || 0), 0)
      const hours = Math.floor(total)
      const minutes = Math.round((total - hours) * 60)
      return `${hours} ชม. ${minutes} นาที`
    },
    showWorkFiles(work) {
      this.selectedWorkFiles = work.files || []
      this.workFilesDialog = true
    },
    async downloadWorkFile(fileName) {
      try {
        const response = await this.$http.get(`/api/files/download/${fileName}`, {
          responseType: 'blob'
        })
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถดาวน์โหลดไฟล์ได้',
          life: 3000
        })
      }
    },
    formatHoursMinutes(hours) {
      const h = parseFloat(hours) || 0
      const hrs = Math.floor(h)
      const mins = Math.round((h - hrs) * 60)
      return `${hrs} ชม. ${mins} นาที`
    },
    showSaleUserInfo(saleName) {
      const user = this.allUsers.find(u => `${u.firstname} ${u.lastname}` === saleName)
      if (user) {
        this.selectedUserName = saleName
        this.selectedUserId = user.id
        this.showUserInfoDialog = true
      }
    },
    async loadSaleUsers() {
      try {
        const response = await this.$http.get('/api/users')
        this.allUsers = response.data
        this.saleUsers = response.data
          .filter(u => u.is_active && u.role && u.role.toLowerCase().includes('sale'))
          .map(u => ({ 
            label: `${u.firstname} ${u.lastname}${u.nickname ? ` (${u.nickname})` : ''}`, 
            value: `${u.firstname} ${u.lastname}`,
            position: u.position || '',
            department: u.department || '',
            email: u.email || '',
            phone: u.phone || ''
          }))
      } catch { /* ignore */ }
    },
    showUserInfo(name, userId) {
      this.selectedUserName = name
      this.selectedUserId = userId
      this.showUserInfoDialog = true
    }
  }
}
</script>

<style scoped>
:deep(.p-dropdown-clear-icon) { margin-right: 1.2rem; }
.history-card {
  width: 100%;
  margin: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 1rem;
}

.empty-state p {
  margin-top: 1rem;
  font-size: 1.1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.history-table :deep(.p-datatable) {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.history-table :deep(.p-datatable-thead > tr > th) {
  background: #f8f9fa;
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  padding: 1rem 0.75rem;
  font-size: 0.9rem;
}

.history-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #f1f3f4;
  vertical-align: middle;
}

.history-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f8f9fa;
}

.history-table :deep(.p-paginator) {
  background: #f8f9fa;
  border-top: 2px solid #e9ecef;
  padding: 1rem;
}

.custom-id-badge {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

.task-name {
  font-weight: 600;
  color: #495057;
}

.so-number {
  font-size: 0.9rem;
  color: #6c757d;
  background: #e3f2fd;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
}

.sale-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #495057;
}

.sale-info i {
  color: #667eea;
}

.text-muted {
  color: #6c757d;
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
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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
  color: #6c757d;
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
  border-left: 4px solid #28a745;
  white-space: pre-wrap;
  line-height: 1.6;
  color: #495057;
  font-size: 0.95rem;
}

/* Mobile Responsive */
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
  gap: 0.5rem;
}

.file-preview {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid #ddd;
  cursor: pointer;
}

.file-preview:hover {
  opacity: 0.8;
}

.file-icon {
  font-size: 1.5rem;
  color: #666;
}

.file-name {
  font-weight: 500;
}

.full-image {
  width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.no-files {
  text-align: center;
  padding: 2rem;
  color: #666;
}

@media (max-width: 768px) {
  :deep(.hide-mobile) {
    display: none !important;
  }
  
  .history-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }
  
  .history-table :deep(.p-datatable-thead > tr > th) {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }
  
  .task-name {
    font-size: 0.9rem;
    line-height: 1.2;
  }
}

.edit-form {
  padding: 1rem 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 2rem;
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

.input-label {
  font-weight: 500;
  color: #333;
}

.corporate-input, .corporate-dropdown {
  width: 100%;
}

.file-upload-section {
  margin-bottom: 1rem;
}

.existing-files, .new-files {
  margin-top: 1rem;
}

.existing-files h4, .new-files h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  background-color: #f9f9f9;
}

.file-name {
  flex: 1;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.loading-state,
.empty-works {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
}

.loading-state p,
.empty-works p {
  margin-top: 1rem;
  font-size: 1rem;
}

.works-container {
  max-height: 70vh;
  overflow-y: auto;
}

.works-summary {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.works-filters {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #495057;
  white-space: nowrap;
}

.filter-dropdown {
  min-width: 180px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #495057;
}

.summary-item i {
  color: #4A90E2;
  font-size: 1.1rem;
}

.summary-item strong {
  color: #4A90E2;
  font-size: 1.1rem;
}

.works-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.works-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.works-table thead {
  background: #f8f9fa;
}

.works-table th {
  padding: 1rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
  white-space: nowrap;
}

.works-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f1f3f4;
  color: #495057;
}

.works-table tbody tr:hover {
  background: #f8f9fa;
}

.works-table .text-center {
  text-align: center;
}

.step-badge-small {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.step-badge-small i {
  font-size: 0.75rem;
}

.steps-container-mini {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-badge-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #f8fafc;
  border-left: 3px solid;
  border-radius: 4px;
  font-size: 0.8rem;
}

.step-badge-inline .step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: #fff;
  font-size: 0.7rem;
  font-weight: bold;
}

.step-status-mini {
  font-size: 0.7rem;
  font-weight: 500;
}

.step-statuses-row {
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-bottom: 4px;
}

.step-statuses-row:last-child {
  margin-bottom: 0;
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
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #f8f9fa;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.file-info i {
  color: #6c757d;
  font-size: 1rem;
}

.file-name {
  font-size: 0.9rem;
  color: #495057;
  word-break: break-all;
}

.description-preview {
  font-size: 0.9rem;
  color: #666;
}

.attachments-info {
  display: flex;
  justify-content: center;
}

.no-files,
.no-status {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 0.9rem;
  width: 100%;
  text-align: center;
}

.category-badge {
  white-space: nowrap;
  overflow: visible;
  text-overflow: unset;
  max-width: none;
  width: auto;
  color: white !important;
}

.category-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
}

@media (max-width: 480px) {
  .history-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.5rem 0.25rem;
    font-size: 0.8rem;
  }
  
  .history-table :deep(.p-datatable-thead > tr > th) {
    padding: 0.5rem 0.25rem;
    font-size: 0.8rem;
  }
  
  .custom-id-badge {
    font-size: 0.7rem;
    padding: 0.3rem 0.5rem;
  }
}

.badge-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 40px;
}

.status-badges-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
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

.category-display,
.category-option,
.status-display,
.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-display .emoji,
.category-option .emoji,
.status-display .emoji,
.status-option .emoji {
  font-size: 16px;
}

.category-display i,
.category-option i,
.status-display i,
.status-option i {
  color: #4A90E2;
  font-size: 14px;
}

/* Lock edit dialog position */
.p-dialog .p-dialog-header {
  cursor: default !important;
}

.p-dialog .p-dialog-header .p-dialog-title {
  cursor: default !important;
}

.clickable-name {
  color: #2563eb;
  cursor: pointer;
  text-decoration: underline;
}

.clickable-name:hover {
  color: #1d4ed8;
}
</style>
