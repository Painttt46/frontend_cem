<template>
  <div class="leave-management-container">
    <Toast />
    
    <!-- Header -->
    <div class="header-card mb-4">
      <div class="header-content">
        <Button icon="pi pi-arrow-left" text rounded @click="$router.push('/management')" class="back-btn" />
        <div class="header-title">
          <i class="pi pi-calendar-times"></i>
          <h1>จัดการการลางาน</h1>
        </div>
      </div>
    </div>

    <!-- User Leave Quota Table -->
    <Card>
      <template #content>
        <div class="table-header">
          <h3>โควต้าการลาของพนักงาน</h3>
          <div class="header-actions">
            <Button label="กำหนดวันหยุด" icon="pi pi-calendar" @click="showHolidayDialog = true" severity="warning" />
            <Button label="เพิ่มประเภทการลา" icon="pi pi-plus" @click="showAddLeaveTypeDialog = true" />
          </div>
        </div>
        
        <!-- Search and Filter -->
        <div class="filters-section">
          <IconField iconPosition="left" class="search-field">
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="ค้นหาชื่อ, แผนก, ตำแหน่ง..." class="w-full" />
          </IconField>
          
          <Dropdown v-model="selectedDepartment" :options="departments" optionLabel="label" optionValue="value" 
                    placeholder="ทุกแผนก" class="filter-dropdown" showClear />
          
          <Dropdown v-model="selectedPosition" :options="positions" optionLabel="label" optionValue="value" 
                    placeholder="ทุกตำแหน่ง" class="filter-dropdown" showClear />
        </div>
        
        <div class="table-wrapper">
          <DataTable :value="filteredUsers" :paginator="true" :rows="10" stripedRows class="p-datatable-sm" scrollable scrollHeight="600px">
            <Column field="firstname" header="ชื่อ" :sortable="true" frozen style="min-width: 150px">
              <template #body="{ data }">
                {{ data.firstname }} {{ data.lastname }}
              </template>
            </Column>
            <Column field="department" header="แผนก" :sortable="true" frozen style="min-width: 120px" />
            <Column field="position" header="ตำแหน่ง" :sortable="true" frozen style="min-width: 120px" />
            <Column v-for="type in leaveTypes" :key="type.value" style="min-width: 180px">
              <template #header>
                <div class="leave-type-header">
                  <Badge :value="type.label" :style="{ backgroundColor: type.color, color: '#fff', fontWeight: 'bold' }" />
                  <div class="leave-type-actions">
                    <Button icon="pi pi-pencil" size="small" text severity="info" @click="editLeaveType(type)" v-tooltip="'แก้ไข'" />
                    <Button icon="pi pi-trash" size="small" text severity="danger" @click="confirmDeleteLeaveType(type)" v-tooltip="'ลบ'" />
                  </div>
                </div>
                <small v-if="type.advance_days > 0" class="advance-days-hint">ลาล่วงหน้า {{ type.advance_days }} วัน</small>
              </template>
              <template #body="{ data }">
                <div class="quota-cell">
                  <div class="quota-row">
                    <small>โควต้า:</small>
                    <span class="quota-value">{{ data[`${type.value}_quota`] || 0 }} วัน ({{ (data[`${type.value}_quota`] || 0) * 8 }} ชม.)</span>
                    <Button icon="pi pi-pencil" size="small" text @click="editQuota(data, type)" />
                  </div>
                  <small class="remaining">คงเหลือ: {{ data[`${type.value}_remaining`] || 0 }} วัน ({{ (data[`${type.value}_remaining`] || 0) * 8 }} ชม.)</small>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>

    <!-- Add Leave Type Dialog -->
    <Dialog v-model:visible="showAddLeaveTypeDialog" header="เพิ่มประเภทการลาใหม่" :modal="true" :draggable="false" :style="{ width: '90vw', maxWidth: '500px' }">
      <div class="leave-type-form">
        <div class="field">
          <label>ชื่อประเภทการลา *</label>
          <InputText v-model="newLeaveTypeName" placeholder="เช่น ลาบวช, ลาอุปสมบท" class="w-full" />
        </div>
        <div class="field">
          <label>โควต้าเริ่มต้น (ชม./ปี) *</label>
          <InputNumber v-model="newLeaveTypeQuotaHours" :min="0" :max="2920" showButtons class="w-full" suffix=" ชม." :step="1" />
          <small class="field-hint">{{ (newLeaveTypeQuotaHours / 8).toFixed(1) }} วัน (1 วัน = 8 ชม.)</small>
        </div>
        <div class="field">
          <label>ต้องลาล่วงหน้า (วัน)</label>
          <InputNumber v-model="newLeaveTypeAdvanceDays" :min="0" :max="30" showButtons class="w-full" suffix=" วัน" />
          <small class="field-hint">0 = ไม่ต้องลาล่วงหน้า</small>
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" @click="closeAddDialog" severity="secondary" />
        <Button label="เพิ่ม" icon="pi pi-check" @click="addLeaveType" :loading="adding" />
      </template>
    </Dialog>

    <!-- Edit Leave Type Dialog -->
    <Dialog v-model:visible="showEditLeaveTypeDialog" header="แก้ไขประเภทการลา" :modal="true" :draggable="false" :style="{ width: '90vw', maxWidth: '500px' }">
      <div class="leave-type-form" v-if="editingLeaveTypeData">
        <div class="field">
          <label>ชื่อประเภทการลา</label>
          <InputText v-model="editingLeaveTypeData.label" class="w-full" />
        </div>
        <div class="field">
          <label>สี</label>
          <div class="color-picker-row">
            <div v-for="c in colorOptions" :key="c" 
                 class="color-option" 
                 :style="{ backgroundColor: c }"
                 :class="{ selected: editingLeaveTypeData.color === c }"
                 @click="editingLeaveTypeData.color = c">
            </div>
          </div>
        </div>
        <div class="field">
          <label>โควต้าเริ่มต้น (วัน/ปี)</label>
          <InputNumber v-model="editingLeaveTypeData.default_quota" :min="0" :max="365" showButtons class="w-full" suffix=" วัน" />
          <small class="field-hint">โควต้าที่พนักงานใหม่จะได้รับ</small>
        </div>
        <div class="field">
          <label>ต้องลาล่วงหน้า (วัน)</label>
          <InputNumber v-model="editingLeaveTypeData.advance_days" :min="0" :max="30" showButtons class="w-full" suffix=" วัน" />
          <small class="field-hint">0 = ไม่ต้องลาล่วงหน้า, เช่น ลากิจ = 3 วัน</small>
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" @click="showEditLeaveTypeDialog = false" severity="secondary" />
        <Button label="บันทึก" icon="pi pi-check" @click="saveLeaveType" :loading="savingLeaveType" />
      </template>
    </Dialog>
    
    <!-- Edit Quota Dialog -->
    <Dialog v-model:visible="showEditQuotaDialog" header="แก้ไขโควต้าการลา" :modal="true" :draggable="false" :style="{ width: '90vw', maxWidth: '550px' }">
      <div class="edit-quota-form" v-if="editingUser">
        <div class="user-info">
          <i class="pi pi-user"></i>
          <div>
            <h4>{{ editingUser.firstname }} {{ editingUser.lastname }}</h4>
            <small>{{ editingUser.department }} - {{ editingUser.position }}</small>
          </div>
        </div>
        
        <Divider />
        
        <div class="field">
          <label>ประเภทการลา</label>
          <Badge :value="editingLeaveType?.label" :style="{ backgroundColor: editingLeaveType?.color, color: '#fff' }" />
        </div>
        
        <div class="field">
          <label>โควต้าทั้งหมด (ชม./ปี) *</label>
          <InputNumber v-model="newQuotaHours" :min="0" :max="2920" showButtons class="w-full" suffix=" ชม." :step="1" />
          <small class="field-hint">ปัจจุบัน: {{ currentQuota * 8 }} ชม. ({{ currentQuota }} วัน)</small>
        </div>
        
        <div class="field">
          <label>โควต้าคงเหลือ (ชม.) *</label>
          <InputNumber v-model="newRemainingHours" :min="0" :max="newQuotaHours" showButtons class="w-full" suffix=" ชม." :step="1" />
          <small class="field-hint">ปัจจุบัน: {{ currentRemaining * 8 }} ชม. ({{ currentRemaining }} วัน)</small>
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" @click="closeEditDialog" severity="secondary" />
        <Button label="บันทึก" icon="pi pi-check" @click="saveQuota" :loading="saving" />
      </template>
    </Dialog>

    <!-- Holiday Management Dialog -->
    <Dialog v-model:visible="showHolidayDialog" header="กำหนดวันหยุด" :modal="true" :draggable="false" :style="{ width: '95vw', maxWidth: '700px' }">
      <div class="holiday-form">
        <div class="field">
          <label>เลือกวันหยุด (คลิกวันที่ในปฏิทิน)</label>
          <Calendar v-model="selectedHolidayDates" selectionMode="multiple" :inline="true" class="w-full holiday-calendar" dateFormat="dd/mm/yy" :disabledDates="existingHolidayDates">
            <template #date="slotProps">
              <span :class="getHolidayDateClass(slotProps.date)" class="date-cell">
                {{ slotProps.date.day }}
              </span>
            </template>
          </Calendar>
        </div>
        
        <Divider />
        
        <div class="existing-holidays">
          <h4>วันหยุดที่กำหนดไว้</h4>
          <div v-if="holidays.length === 0" class="no-holidays">ยังไม่มีวันหยุดที่กำหนด</div>
          <div v-else class="holiday-chips">
            <Chip v-for="h in holidays" :key="h.id" :label="formatHolidayDate(h.holiday_date)" removable @remove="removeHoliday(h.id)" class="holiday-chip" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="ปิด" icon="pi pi-times" @click="showHolidayDialog = false" severity="secondary" />
        <Button label="บันทึกวันหยุด" icon="pi pi-check" @click="saveHolidays" :loading="savingHolidays" :disabled="!selectedHolidayDates?.length" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import axios from '@/utils/axiosConfig'
import Calendar from 'primevue/calendar'
import Chip from 'primevue/chip'
import InputNumber from 'primevue/inputnumber'
import Divider from 'primevue/divider'

const toast = useToast()
const confirm = useConfirm()
const users = ref([])
const leaveTypes = ref([])
const showAddLeaveTypeDialog = ref(false)
const showEditQuotaDialog = ref(false)
const showEditLeaveTypeDialog = ref(false)
const showHolidayDialog = ref(false)
const holidays = ref([])
const selectedHolidayDates = ref([])
const savingHolidays = ref(false)
const adding = ref(false)
const saving = ref(false)
const savingLeaveType = ref(false)
const newLeaveTypeName = ref('')
const newLeaveTypeQuotaHours = ref(0)
const newLeaveTypeAdvanceDays = ref(0)

// Color options for leave types
const colorOptions = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

// Edit leave type states
const editingLeaveTypeData = ref(null)

// Filter states
const searchQuery = ref('')
const selectedDepartment = ref(null)
const selectedPosition = ref(null)
const departments = ref([])
const positions = ref([])

// Edit quota states
const editingUser = ref(null)
const editingLeaveType = ref(null)
const currentQuota = ref(0)
const currentRemaining = ref(0)
const newQuotaHours = ref(0)
const newRemainingHours = ref(0)

// Computed filtered users
const filteredUsers = computed(() => {
  let filtered = users.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.firstname?.toLowerCase().includes(query) ||
      user.lastname?.toLowerCase().includes(query) ||
      user.department?.toLowerCase().includes(query) ||
      user.position?.toLowerCase().includes(query)
    )
  }

  // Department filter
  if (selectedDepartment.value) {
    filtered = filtered.filter(user => user.department === selectedDepartment.value)
  }

  // Position filter
  if (selectedPosition.value) {
    filtered = filtered.filter(user => user.position === selectedPosition.value)
  }

  return filtered
})

const existingHolidayDates = computed(() => {
  return holidays.value.map(h => new Date(h.holiday_date))
})

const existingHolidayTimestamps = computed(() => {
  return holidays.value.map(h => {
    const d = new Date(h.holiday_date)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  })
})

const getHolidayDateClass = (dateObj) => {
  const checkDate = new Date(dateObj.year, dateObj.month, dateObj.day)
  checkDate.setHours(0, 0, 0, 0)
  if (existingHolidayTimestamps.value.includes(checkDate.getTime())) {
    return 'holiday-date'
  }
  return ''
}

onMounted(() => {
  loadLeaveTypes()
  loadUsers()
  loadHolidays()
})

const loadHolidays = async () => {
  try {
    const response = await axios.get('/api/leave/holidays')
    holidays.value = response.data
  } catch { /* ignore */ }
}

const formatHolidayDate = (date) => {
  return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

const saveHolidays = async () => {
  if (!selectedHolidayDates.value?.length) return
  savingHolidays.value = true
  try {
    const dates = selectedHolidayDates.value.map(d => {
      const date = new Date(d)
      return date.toISOString().split('T')[0]
    })
    await axios.post('/api/leave/holidays', { dates })
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'บันทึกวันหยุดเรียบร้อย', life: 3000 })
    selectedHolidayDates.value = []
    await loadHolidays()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'เกิดข้อผิดพลาด', detail: err.response?.data?.error || 'ไม่สามารถบันทึกได้', life: 3000 })
  } finally {
    savingHolidays.value = false
  }
}

const removeHoliday = async (id) => {
  try {
    await axios.delete(`/api/leave/holidays/${id}`)
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'ลบวันหยุดเรียบร้อย', life: 3000 })
    await loadHolidays()
  } catch { /* ignore */ }
}

const loadLeaveTypes = async () => {
  try {
    const response = await axios.get('/api/leave/leave-types')
    leaveTypes.value = response.data
  } catch { // ignore
    
  }
}

const loadUsers = async () => {
  try {
    const usersRes = await axios.get('/api/users')
    
    users.value = await Promise.all(usersRes.data.map(async (user) => {
      try {
        const quotaRes = await axios.get(`/api/leave/quota/${user.id}`)
        const quotaData = quotaRes.data
        
        const userData = { ...user }
        
        // Add quota data for each leave type dynamically
        for (const [leaveType, data] of Object.entries(quotaData)) {
          userData[`${leaveType}_quota`] = data?.quota || 0
          userData[`${leaveType}_used`] = data?.usedDays || 0
          userData[`${leaveType}_remaining`] = data?.remainingDays || 0
        }
        
        return userData
      } catch { // ignore
        
        return { ...user }
      }
    }))
    
    // Extract unique departments and positions
    extractFilters()
  } catch { // ignore
    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: 'ไม่สามารถโหลดข้อมูลได้',
      life: 3000
    })
  }
}

const extractFilters = () => {
  // Extract unique departments
  const depts = [...new Set(users.value.map(u => u.department).filter(Boolean))]
  departments.value = depts.map(d => ({ label: d, value: d }))
  
  // Extract unique positions
  const pos = [...new Set(users.value.map(u => u.position).filter(Boolean))]
  positions.value = pos.map(p => ({ label: p, value: p }))
}

const editQuota = (user, leaveType) => {
  editingUser.value = user
  editingLeaveType.value = leaveType
  currentQuota.value = user[`${leaveType.value}_quota`] || 0
  currentRemaining.value = user[`${leaveType.value}_remaining`] || 0
  newQuotaHours.value = currentQuota.value * 8
  newRemainingHours.value = currentRemaining.value * 8
  showEditQuotaDialog.value = true
}

const closeEditDialog = () => {
  showEditQuotaDialog.value = false
  editingUser.value = null
  editingLeaveType.value = null
  currentQuota.value = 0
  currentRemaining.value = 0
  newQuotaHours.value = 0
  newRemainingHours.value = 0
}

const saveQuota = async () => {
  const newQuota = newQuotaHours.value / 8
  const newRemaining = newRemainingHours.value / 8
  
  if (newQuota === currentQuota.value && newRemaining === currentRemaining.value) {
    toast.add({
      severity: 'info',
      summary: 'ไม่มีการเปลี่ยนแปลง',
      detail: 'โควต้าไม่ได้เปลี่ยนแปลง',
      life: 3000
    })
    return
  }

  if (newRemainingHours.value > newQuotaHours.value) {
    toast.add({
      severity: 'error',
      summary: 'ข้อผิดพลาด',
      detail: 'โควต้าคงเหลือต้องไม่เกินโควต้าทั้งหมด',
      life: 3000
    })
    return
  }

  saving.value = true
  try {
    await axios.put(`/api/leave/quota/${editingUser.value.id}/${editingLeaveType.value.value}`, {
      quota: newQuota,
      remaining: newRemaining
    })

    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: 'แก้ไขโควต้าเรียบร้อยแล้ว',
      life: 3000
    })

    closeEditDialog()
    await loadUsers()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: err.response?.data?.error || 'ไม่สามารถแก้ไขโควต้าได้',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const closeAddDialog = () => {
  showAddLeaveTypeDialog.value = false
  newLeaveTypeName.value = ''
  newLeaveTypeQuotaHours.value = 0
  newLeaveTypeAdvanceDays.value = 0
}

const addLeaveType = async () => {
  if (!newLeaveTypeName.value.trim()) {
    toast.add({
      severity: 'error',
      summary: 'ข้อผิดพลาด',
      detail: 'กรุณากรอกชื่อประเภทการลา',
      life: 3000
    })
    return
  }

  adding.value = true
  try {
    await axios.post('/api/leave/leave-types', {
      name: newLeaveTypeName.value.trim(),
      default_quota: newLeaveTypeQuotaHours.value / 8,
      advance_days: newLeaveTypeAdvanceDays.value
    })

    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: 'เพิ่มประเภทการลาใหม่เรียบร้อยแล้ว',
      life: 3000
    })

    closeAddDialog()
    await loadLeaveTypes()
    await loadUsers()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: err.response?.data?.error || 'ไม่สามารถเพิ่มประเภทการลาได้',
      life: 3000
    })
  } finally {
    adding.value = false
  }
}

const confirmDeleteLeaveType = (type) => {
  confirm.require({
    message: `ต้องการลบประเภทการลา "${type.label}" ใช่หรือไม่?\n\nข้อมูลโควต้าของพนักงานทุกคนจะถูกลบด้วย`,
    header: 'ยืนยันการลบ',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'ลบ',
    rejectLabel: 'ยกเลิก',
    acceptClass: 'p-button-danger',
    accept: () => {
      deleteLeaveType(type.value)
    }
  })
}

const deleteLeaveType = async (leaveType) => {
  try {
    await axios.delete(`/api/leave/leave-types/${encodeURIComponent(leaveType)}`)

    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: 'ลบประเภทการลาเรียบร้อยแล้ว',
      life: 3000
    })

    await loadLeaveTypes()
    await loadUsers()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: err.response?.data?.error || 'ไม่สามารถลบประเภทการลาได้',
      life: 3000
    })
  }
}

const editLeaveType = (type) => {
  editingLeaveTypeData.value = { ...type }
  showEditLeaveTypeDialog.value = true
}

const saveLeaveType = async () => {
  if (!editingLeaveTypeData.value) return

  savingLeaveType.value = true
  try {
    await axios.put(`/api/leave/leave-types/${encodeURIComponent(editingLeaveTypeData.value.value)}`, {
      display_name: editingLeaveTypeData.value.label,
      color: editingLeaveTypeData.value.color,
      advance_days: editingLeaveTypeData.value.advance_days,
      default_quota: editingLeaveTypeData.value.default_quota
    })

    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: 'แก้ไขประเภทการลาเรียบร้อยแล้ว',
      life: 3000
    })

    showEditLeaveTypeDialog.value = false
    editingLeaveTypeData.value = null
    await loadLeaveTypes()
    await loadUsers()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: err.response?.data?.error || 'ไม่สามารถแก้ไขประเภทการลาได้',
      life: 3000
    })
  } finally {
    savingLeaveType.value = false
  }
}
</script>

<style scoped>
.leave-management-container {
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.back-btn {
  color: white !important;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title i {
  font-size: 1.5rem;
}

.header-title h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-header h3 {
  margin: 0;
  color: #2c3e50;
}

.filters-section {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-field {
  width: 100%;
}

.filter-dropdown {
  width: 100%;
}

.table-wrapper {
  overflow-x: auto;
}

.leave-type-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.leave-type-actions {
  display: flex;
  gap: 0;
}

.advance-days-hint {
  display: block;
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.color-picker-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #2c3e50;
}

.quota-cell {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quota-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quota-row small {
  font-size: 0.85rem;
  color: #6c757d;
  min-width: 60px;
}

.quota-value {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.remaining {
  font-size: 0.85rem;
  color: #6c757d;
  padding-left: 60px;
}

.edit-quota-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
}

.edit-quota-form .field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.edit-quota-form label {
  font-weight: 600;
  color: #2c3e50;
}

.field-hint {
  color: #6c757d;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.user-info i {
  font-size: 2rem;
  color: #4A90E2;
}

.user-info h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.user-info small {
  color: #6c757d;
}

.leave-type-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
}

.leave-type-form .field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.leave-type-form label {
  font-weight: 600;
  color: #2c3e50;
}

.leave-type-form small {
  color: #6c757d;
  font-size: 0.8rem;
}

.quota-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.quota-cell small {
  font-size: 0.85rem;
  color: #6c757d;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.holiday-form .field {
  margin-bottom: 1rem;
}

.holiday-form label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.holiday-calendar {
  width: 100%;
}

.holiday-calendar :deep(.p-datepicker-calendar td) {
  padding: 0.25rem;
}

.date-cell {
  display: flex;
  width: 2.5rem;
  height: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.holiday-date {
  background-color: #ef4444 !important;
  color: #fff !important;
  font-weight: 600;
}

.existing-holidays h4 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
}

.no-holidays {
  color: #6c757d;
  font-style: italic;
}

.holiday-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.holiday-chip {
  background: #ef4444 !important;
  color: white !important;
}

@media (max-width: 768px) {
  .leave-management-container {
    padding: 0.5rem;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .table-header button {
    width: 100%;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .header-actions button {
    width: 100%;
  }
  
  .filters-section {
    grid-template-columns: 1fr;
  }
}
</style>
