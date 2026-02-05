<template>
  <div class="settings-container">
    <Toast />

    <!-- Header -->
    <Card class="header-card mb-4">
      <template #content>
        <div class="header-content">
          <Button icon="pi pi-arrow-left" text rounded @click="$router.push('/management/settings')" class="back-btn" />
          <div class="header-title">
            <i class="pi pi-users"></i>
            <h1>ตั้งค่าผู้อนุมัติการลา</h1>
          </div>
        </div>
      </template>
    </Card>

    <div class="approval-levels">
      <!-- Level 1: หัวหน้างาน -->
      <Card class="level-card">
        <template #header>
          <div class="level-header level-1">
            <i class="pi pi-user-edit"></i>
            <span>ขั้นที่ 1: หัวหน้างาน อนุมัติ</span>
          </div>
        </template>
        <template #content>
          <p class="level-desc">เมื่อมีคำขอลาใหม่ ระบบจะส่ง Email แจ้งหัวหน้างานที่กำหนดไว้</p>

          <div class="add-approver">
            <Dropdown v-model="newApproverLevel1" :options="availableUsers" optionLabel="name" optionValue="id"
              placeholder="เลือกผู้อนุมัติ" class="w-full" filter />
            <Button icon="pi pi-plus" label="เพิ่ม" @click="addApprover(1)" :disabled="!newApproverLevel1" />
          </div>

          <DataTable :value="level1Approvers" class="mt-3" stripedRows>
            <Column field="user_name" header="ชื่อ-นามสกุล" />
            <Column field="position" header="ตำแหน่ง" />
            <Column field="email" header="Email" />
            <Column header="รับ Email">
              <template #body="{ data }">
                <InputSwitch v-model="data.receive_email" @change="updateApprover(1, data)" />
              </template>
            </Column>
            <Column header="สิทธิ์อนุมัติ">
              <template #body="{ data }">
                <InputSwitch v-model="data.can_approve" @change="updateApprover(1, data)" />
              </template>
            </Column>
            <Column header="แผนกที่ดูแล" style="width: 180px">
              <template #body="{ data }">
                <MultiSelect 
                  v-model="data.department_ids" 
                  :options="departments" 
                  optionLabel="name" 
                  optionValue="name"
                  placeholder="ทุกแผนก" 
                  @change="onDepartmentChange(1, data)" 
                  class="w-full custom-multiselect"
                  :maxSelectedLabels="1"
                  selectedItemsLabel="{0} แผนก"
                  emptyMessage="ไม่พบข้อมูล"
                  :showToggleAll="false"
                />
              </template>
            </Column>

            <Column header="ตำแหน่งที่ดูแล" style="width: 180px">
              <template #body="{ data }">
                <MultiSelect 
                  v-model="data.position_ids" 
                  :options="getFilteredPositions(data.department_ids)" 
                  optionLabel="name" 
                  optionValue="name"
                  placeholder="ทุกตำแหน่ง" 
                  @change="updateApprover(1, data)" 
                  class="w-full custom-multiselect"
                  :maxSelectedLabels="1"
                  selectedItemsLabel="{0} ตำแหน่ง"
                  emptyMessage="ไม่พบข้อมูล"
                  :showToggleAll="false"
                />
              </template>
            </Column>
            <Column header="">
              <template #body="{ data }">
                <Button icon="pi pi-trash" severity="danger" text @click="removeApprover(1, data.user_id)" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Level 2: HR -->
      <Card class="level-card">
        <template #header>
          <div class="level-header level-2">
            <i class="pi pi-verified"></i>
            <span>ขั้นที่ 2: HR อนุมัติ</span>
          </div>
        </template>
        <template #content>
          <p class="level-desc">หลังจากหัวหน้างานอนุมัติขั้นที่ 1 ระบบจะส่ง Email แจ้ง HR ที่กำหนดไว้</p>

          <div class="add-approver">
            <Dropdown v-model="newApproverLevel2" :options="availableUsers" optionLabel="name" optionValue="id"
              placeholder="เลือกผู้อนุมัติ" class="w-full" filter />
            <Button icon="pi pi-plus" label="เพิ่ม" @click="addApprover(2)" :disabled="!newApproverLevel2" />
          </div>

          <DataTable :value="level2Approvers" class="mt-3" stripedRows>
            <Column field="user_name" header="ชื่อ-นามสกุล" />
            <Column field="position" header="ตำแหน่ง" />
            <Column field="email" header="Email" />
            <Column header="รับ Email">
              <template #body="{ data }">
                <InputSwitch v-model="data.receive_email" @change="updateApprover(2, data)" />
              </template>
            </Column>
            <Column header="สิทธิ์อนุมัติ">
              <template #body="{ data }">
                <InputSwitch v-model="data.can_approve" @change="updateApprover(2, data)" />
              </template>
            </Column>
            <Column header="">
              <template #body="{ data }">
                <Button icon="pi pi-trash" severity="danger" text @click="removeApprover(2, data.user_id)" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { useDragScroll } from '@/composables/useDragScroll'
useDragScroll('.p-datatable-wrapper')

import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import axios from '@/utils/axiosConfig'

const toast = useToast()

const level1Approvers = ref([])
const level2Approvers = ref([])
const allUsers = ref([])
const newApproverLevel1 = ref(null)
const newApproverLevel2 = ref(null)
const departments = ref([])
const positions = ref([])

const loadDepartments = async () => {
  try {
    const res = await axios.get('/api/settings/departments')
    departments.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const loadPositions = async () => {
  try {
    const res = await axios.get('/api/settings/positions')
    positions.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const availableUsers = computed(() => {
  return allUsers.value.map(u => ({
    id: u.id,
    name: `${u.firstname} ${u.lastname} (${u.position || 'ไม่ระบุตำแหน่ง'})`
  }))
})

const loadSettings = async () => {
  try {
    const res = await axios.get('/api/settings/leave-approval')
    level1Approvers.value = res.data.level1 || []
    level2Approvers.value = res.data.level2 || []
  } catch { // ignore

  }
}

const loadUsers = async () => {
  try {
    const res = await axios.get('/api/users')
    allUsers.value = res.data.filter(u => u.is_active)
  } catch { // ignore

  }
}

const addApprover = async (level) => {
  const userId = level === 1 ? newApproverLevel1.value : newApproverLevel2.value
  if (!userId) return

  try {
    await axios.post('/api/settings/leave-approval', {
      approval_level: level,
      user_id: userId,
      receive_email: true,
      can_approve: true
    })

    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'เพิ่มผู้อนุมัติแล้ว', life: 3000 })

    if (level === 1) newApproverLevel1.value = null
    else newApproverLevel2.value = null

    await loadSettings()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: err.response?.data?.error || 'ไม่สามารถเพิ่มได้', life: 3000 })
  }
}

const updateApprover = async (level, data) => {
  try {
    await axios.put(`/api/settings/leave-approval/${level}/${data.user_id}`, {
      receive_email: data.receive_email,
      can_approve: data.can_approve,
      department_ids: data.department_ids || [],
      position_ids: data.position_ids || []
    })
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'อัพเดทแล้ว', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'ไม่สามารถอัพเดทได้', life: 3000 })
  }
}

const getFilteredPositions = (selectedDepartments) => {
  if (!selectedDepartments || selectedDepartments.length === 0) {
    return positions.value
  }
  // กรองตำแหน่งตามแผนกที่เลือก
  const usersInDepts = allUsers.value.filter(u => selectedDepartments.includes(u.department))
  const positionNames = [...new Set(usersInDepts.map(u => u.position).filter(p => p))]
  return positions.value.filter(p => positionNames.includes(p.name))
}

const onDepartmentChange = async (level, data) => {
  // เคลียร์ตำแหน่งที่ไม่อยู่ในแผนกที่เลือก
  if (data.position_ids && data.position_ids.length > 0) {
    const validPositions = getFilteredPositions(data.department_ids).map(p => p.name)
    data.position_ids = data.position_ids.filter(p => validPositions.includes(p))
  }
  await updateApprover(level, data)
}

const removeApprover = async (level, userId) => {
  try {
    await axios.delete(`/api/settings/leave-approval/${level}/${userId}`)
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'ลบผู้อนุมัติแล้ว', life: 3000 })
    await loadSettings()
  } catch { // ignore
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'ไม่สามารถลบได้', life: 3000 })
  }
}

onMounted(() => {
  loadSettings()
  loadUsers()
  loadDepartments()
  loadPositions()
})
</script>

<style scoped>
.settings-container {
  padding: 0.6rem 1rem;
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

.header-card :deep(.p-card-body) {
  padding: 1.4rem;
}

.header-card :deep(.p-card-content) {
  padding: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.approval-levels {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.level-card {
  border-radius: 12px;
  overflow: hidden;
}

.level-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

.level-header i {
  font-size: 1.25rem;
}

.level-1 {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.level-2 {
  background: linear-gradient(135deg, #10b981, #059669);
}

.level-desc {
  color: #6b7280;
  margin-bottom: 1rem;
}

.add-approver {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.add-approver .p-dropdown {
  flex: 1;
}

@media (max-width: 768px) {
  .add-approver {
    flex-direction: column;
  }

  .add-approver .p-button {
    width: 100%;
  }
}

/* Custom MultiSelect Styling */
.custom-multiselect {
  border-radius: 8px;
}

:deep(.custom-multiselect .p-multiselect-label) {
  padding: 0.5rem 0.75rem;
}

:deep(.custom-multiselect .p-multiselect-token) {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
  margin: 2px;
}

:deep(.custom-multiselect .p-multiselect-token-icon) {
  color: white;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  padding: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem 1rem;
  vertical-align: middle;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #f1f5f9 !important;
}

:deep(.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider) {
  background: #10b981;
}

:deep(.p-multiselect-panel .p-multiselect-header) {
  padding: 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.p-multiselect-panel .p-multiselect-items .p-multiselect-item) {
  padding: 0.75rem 1rem;
}

:deep(.p-multiselect-panel .p-multiselect-items .p-multiselect-item.p-highlight) {
  background: #eff6ff;
  color: #1d4ed8;
}
</style>
