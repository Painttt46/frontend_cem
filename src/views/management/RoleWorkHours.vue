<template>
  <div class="work-hours-container">
    <Toast />
    
    <!-- Header -->
    <Card class="header-card mb-4">
      <template #content>
        <div class="header-content">
          <Button icon="pi pi-arrow-left" text rounded @click="$router.push('/management/settings')" class="back-btn" />
          <div class="header-title">
            <i class="pi pi-clock"></i>
            <h1>ตั้งค่าเวลาทำงานตาม Role</h1>
          </div>
        </div>
      </template>
    </Card>

    <!-- Add/Edit Form -->
    <Card class="mb-4">
      <template #content>
        <h3 class="section-title">{{ editingRole ? 'แก้ไขเวลาทำงาน' : 'เพิ่มเวลาทำงานใหม่' }}</h3>
        <div class="form-grid">
          <div class="field">
            <label>Role *</label>
            <Dropdown v-model="form.role" :options="availableRoles" optionLabel="label" optionValue="value" 
                      placeholder="เลือก Role" class="w-full" :disabled="!!editingRole" />
          </div>
          <div class="field">
            <label>เวลาเริ่มงาน *</label>
            <Dropdown v-model="form.start_time" :options="timeOptions" optionLabel="label" optionValue="value" 
                      placeholder="เลือกเวลา" class="w-full" />
          </div>
          <div class="field">
            <label>เวลาเลิกงาน *</label>
            <Dropdown v-model="form.end_time" :options="timeOptions" optionLabel="label" optionValue="value" 
                      placeholder="เลือกเวลา" class="w-full" />
          </div>
          <div class="field">
            <label>เริ่มพักเที่ยง</label>
            <Dropdown v-model="form.lunch_start" :options="timeOptions" optionLabel="label" optionValue="value" 
                      placeholder="เลือกเวลา" class="w-full" />
          </div>
          <div class="field">
            <label>สิ้นสุดพักเที่ยง</label>
            <Dropdown v-model="form.lunch_end" :options="timeOptions" optionLabel="label" optionValue="value" 
                      placeholder="เลือกเวลา" class="w-full" />
          </div>
          <div class="field actions">
            <Button :label="editingRole ? 'บันทึก' : 'เพิ่ม'" icon="pi pi-check" @click="saveWorkHours" :loading="saving" />
            <Button v-if="editingRole" label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="cancelEdit" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Work Hours Table -->
    <Card>
      <template #content>
        <h3 class="section-title">รายการเวลาทำงานตาม Role</h3>
        <DataTable :value="workHoursList" :loading="loading" class="p-datatable-sm" stripedRows>
          <Column field="role" header="Role" style="min-width: 120px">
            <template #body="{ data }">
              <span class="role-badge">{{ data.role }}</span>
            </template>
          </Column>
          <Column field="start_time" header="เริ่มงาน" style="min-width: 100px">
            <template #body="{ data }">
              <span class="time-badge">{{ formatTime(data.start_time) }}</span>
            </template>
          </Column>
          <Column field="end_time" header="เลิกงาน" style="min-width: 100px">
            <template #body="{ data }">
              <span class="time-badge">{{ formatTime(data.end_time) }}</span>
            </template>
          </Column>
          <Column field="lunch_start" header="พักเที่ยง" style="min-width: 150px">
            <template #body="{ data }">
              <span class="time-badge secondary">{{ formatTime(data.lunch_start) }} - {{ formatTime(data.lunch_end) }}</span>
            </template>
          </Column>
          <Column header="ชั่วโมงทำงาน/วัน" style="min-width: 120px">
            <template #body="{ data }">
              <span class="hours-badge">{{ calculateWorkHours(data) }} ชม.</span>
            </template>
          </Column>
          <Column header="จัดการ" style="width: 120px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button icon="pi pi-pencil" severity="warning" text rounded @click="editWorkHours(data)" />
                <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data)" />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-clock"></i>
              <p>ยังไม่มีการตั้งค่าเวลาทำงาน</p>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { useDragScroll } from '@/composables/useDragScroll'
useDragScroll('.p-datatable-wrapper')

import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import axios from '@/utils/axiosConfig'

const toast = useToast()
const confirm = useConfirm()

const loading = ref(false)
const saving = ref(false)
const workHoursList = ref([])
const roles = ref([])
const editingRole = ref(null)

const form = ref({
  role: null,
  start_time: '09:00',
  end_time: '18:00',
  lunch_start: '12:00',
  lunch_end: '13:00'
})

const timeOptions = computed(() => {
  const times = []
  for (let h = 6; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      times.push({ label: time, value: time })
    }
  }
  return times
})

const availableRoles = computed(() => {
  const usedRoles = workHoursList.value.map(w => w.role)
  return roles.value.filter(r => !usedRoles.includes(r.value) || r.value === editingRole.value)
})

onMounted(async () => {
  await loadRoles()
  await loadWorkHours()
})

const loadRoles = async () => {
  try {
    const response = await axios.get('/api/users/roles')
    roles.value = response.data.roles.map(role => ({
      label: role,
      value: role
    }))
  } catch {
    roles.value = [
      { label: 'superadmin', value: 'superadmin' },
      { label: 'admin', value: 'admin' },
      { label: 'manager', value: 'manager' },
      { label: 'user', value: 'user' }
    ]
  }
}

const loadWorkHours = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/settings/role-work-hours')
    console.log('API Response:', response.data)
    workHoursList.value = response.data
  } catch {
    workHoursList.value = []
  } finally {
    loading.value = false
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return time.substring(0, 5)
}

const calculateWorkHours = (data) => {
  const [startH, startM] = data.start_time.split(':').map(Number)
  const [endH, endM] = data.end_time.split(':').map(Number)
  const [lunchStartH, lunchStartM] = (data.lunch_start || '12:00').split(':').map(Number)
  const [lunchEndH, lunchEndM] = (data.lunch_end || '13:00').split(':').map(Number)
  
  const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM)
  const lunchMinutes = (lunchEndH * 60 + lunchEndM) - (lunchStartH * 60 + lunchStartM)
  
  return ((totalMinutes - lunchMinutes) / 60).toFixed(1)
}

const saveWorkHours = async () => {
  if (!form.value.role || !form.value.start_time || !form.value.end_time) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูล', detail: 'กรุณาเลือก Role และเวลาทำงาน', life: 3000 })
    return
  }

  saving.value = true
  try {
    await axios.post('/api/settings/role-work-hours', form.value)
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'บันทึกเวลาทำงานเรียบร้อย', life: 3000 })
    await loadWorkHours()
    resetForm()
  } catch {
    toast.add({ severity: 'error', summary: 'เกิดข้อผิดพลาด', detail: 'ไม่สามารถบันทึกได้', life: 3000 })
  } finally {
    saving.value = false
  }
}

const editWorkHours = (data) => {
  editingRole.value = data.role
  form.value = {
    role: data.role,
    start_time: formatTime(data.start_time),
    end_time: formatTime(data.end_time),
    lunch_start: formatTime(data.lunch_start),
    lunch_end: formatTime(data.lunch_end)
  }
}

const cancelEdit = () => {
  resetForm()
}

const resetForm = () => {
  editingRole.value = null
  form.value = {
    role: null,
    start_time: '09:00',
    end_time: '18:00',
    lunch_start: '12:00',
    lunch_end: '13:00'
  }
}

const confirmDelete = (data) => {
  confirm.require({
    message: `ต้องการลบเวลาทำงานของ Role "${data.role}" หรือไม่?`,
    header: 'ยืนยันการลบ',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'ลบ',
    rejectLabel: 'ยกเลิก',
    acceptClass: 'p-button-danger',
    accept: () => deleteWorkHours(data.role)
  })
}

const deleteWorkHours = async (role) => {
  try {
    await axios.delete(`/api/settings/role-work-hours/${role}`)
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'ลบเวลาทำงานเรียบร้อย', life: 3000 })
    await loadWorkHours()
  } catch {
    toast.add({ severity: 'error', summary: 'เกิดข้อผิดพลาด', detail: 'ไม่สามารถลบได้', life: 3000 })
  }
}
</script>

<style scoped>
.work-hours-container {
  padding: 1rem;
  max-width: 100%;
  background: #e5e7eb;
  min-height: 100%;
  overflow: auto;
}

.header-card {
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border: none;
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

.section-title {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.field.actions {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: flex-end;
}

.time-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.9rem;
}

.time-badge.secondary {
  background: #f5f5f5;
  color: #666;
}

.role-badge {
  background: #e3f2fd;
  color: #1565c0;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
}

.hours-badge {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .field.actions {
    grid-column: 1 / -1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
