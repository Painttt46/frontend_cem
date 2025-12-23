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
      <!-- Level 1: HR -->
      <Card class="level-card">
        <template #header>
          <div class="level-header level-1">
            <i class="pi pi-user-edit"></i>
            <span>ขั้นที่ 1: HR อนุมัติ</span>
          </div>
        </template>
        <template #content>
          <p class="level-desc">เมื่อมีคำขอลาใหม่ ระบบจะส่ง Email แจ้งผู้ที่กำหนดไว้</p>
          
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
            <Column header="">
              <template #body="{ data }">
                <Button icon="pi pi-trash" severity="danger" text @click="removeApprover(1, data.user_id)" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Level 2: Manager -->
      <Card class="level-card">
        <template #header>
          <div class="level-header level-2">
            <i class="pi pi-verified"></i>
            <span>ขั้นที่ 2: ผู้บริหารอนุมัติ</span>
          </div>
        </template>
        <template #content>
          <p class="level-desc">หลังจาก HR อนุมัติขั้นที่ 1 ระบบจะส่ง Email แจ้งผู้บริหารที่กำหนดไว้</p>
          
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
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import axios from '@/utils/axiosConfig'

const toast = useToast()

const level1Approvers = ref([])
const level2Approvers = ref([])
const allUsers = ref([])
const newApproverLevel1 = ref(null)
const newApproverLevel2 = ref(null)

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
  } catch { // ignore
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: error.response?.data?.error || 'ไม่สามารถเพิ่มได้', life: 3000 })
  }
}

const updateApprover = async (level, data) => {
  try {
    await axios.put(`/api/settings/leave-approval/${level}/${data.user_id}`, {
      receive_email: data.receive_email,
      can_approve: data.can_approve
    })
    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'อัพเดทแล้ว', life: 2000 })
  } catch { // ignore
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'ไม่สามารถอัพเดทได้', life: 3000 })
  }
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
})
</script>

<style scoped>
.settings-container {
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
</style>
