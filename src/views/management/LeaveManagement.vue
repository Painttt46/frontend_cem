<template>
  <div class="leave-management-container">
    <Toast />
    
    <!-- Header -->
    <Card class="header-card mb-4">
      <template #content>
        <div class="header-content">
          <Button icon="pi pi-arrow-left" text rounded @click="$router.push('/management')" class="back-btn" />
          <div class="header-title">
            <i class="pi pi-calendar-times"></i>
            <h1>จัดการการลางาน</h1>
          </div>
        </div>
      </template>
    </Card>

    <!-- User Leave Quota Table -->
    <Card>
      <template #content>
        <div class="table-header">
          <h3>โควต้าการลาของพนักงาน</h3>
          <Button label="เพิ่มประเภทการลา" icon="pi pi-plus" @click="showAddLeaveTypeDialog = true" />
        </div>
        <div class="table-wrapper">
          <DataTable :value="users" :paginator="true" :rows="10" stripedRows class="p-datatable-sm" scrollable scrollHeight="600px">
            <Column field="firstname" header="ชื่อ" :sortable="true" frozen style="min-width: 150px">
              <template #body="{ data }">
                {{ data.firstname }} {{ data.lastname }}
              </template>
            </Column>
            <Column field="department" header="แผนก" :sortable="true" frozen style="min-width: 120px" />
            <Column field="position" header="ตำแหน่ง" :sortable="true" frozen style="min-width: 120px" />
            <Column v-for="type in leaveTypes" :key="type.value" style="min-width: 120px">
              <template #header>
                <div class="leave-type-header">
                  <Badge :value="type.label" :style="{ backgroundColor: type.color, color: '#fff', fontWeight: 'bold' }" />
                  <Button icon="pi pi-trash" size="small" text severity="danger" @click="confirmDeleteLeaveType(type)" />
                </div>
              </template>
              <template #body="{ data }">
                <div class="quota-cell">
                  <small>โควต้า: {{ data[`${type.value}_quota`] || 0 }} วัน</small>
                  <small>คงเหลือ: {{ data[`${type.value}_remaining`] || 0 }} วัน</small>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>

    <!-- Add Leave Type Dialog -->
    <Dialog v-model:visible="showAddLeaveTypeDialog" header="เพิ่มประเภทการลาใหม่" :modal="true" :draggable="false" style="width: 400px">
      <div class="leave-type-form">
        <div class="field">
          <label>ชื่อประเภทการลา *</label>
          <InputText v-model="newLeaveTypeName" placeholder="เช่น ลาบวช, ลาอุปสมบท" class="w-full" />
        </div>
        <div class="field">
          <label>โควต้าเริ่มต้น (วัน/ปี) *</label>
          <InputNumber v-model="newLeaveTypeQuota" :min="0" :max="365" showButtons class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" @click="closeAddDialog" severity="secondary" />
        <Button label="เพิ่ม" icon="pi pi-check" @click="addLeaveType" :loading="adding" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import axios from 'axios'
import InputNumber from 'primevue/inputnumber'

const toast = useToast()
const confirm = useConfirm()
const users = ref([])
const leaveTypes = ref([])
const showAddLeaveTypeDialog = ref(false)
const adding = ref(false)
const newLeaveTypeName = ref('')
const newLeaveTypeQuota = ref(0)

onMounted(() => {
  loadLeaveTypes()
  loadUsers()
})

const loadLeaveTypes = async () => {
  try {
    const response = await axios.get('/api/leave/leave-types')
    leaveTypes.value = response.data
  } catch (error) {
    console.error('Error loading leave types:', error)
  }
}

const loadUsers = async () => {
  try {
    const token = localStorage.getItem('soc_token')
    const usersRes = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
    
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
      } catch (error) {
        console.error(`Error loading quota for user ${user.id}:`, error)
        return { ...user }
      }
    }))
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: 'ไม่สามารถโหลดข้อมูลได้',
      life: 3000
    })
  }
}

const closeAddDialog = () => {
  showAddLeaveTypeDialog.value = false
  newLeaveTypeName.value = ''
  newLeaveTypeQuota.value = 0
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
      default_quota: newLeaveTypeQuota.value
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
  } catch (error) {
    console.error('Add leave type error:', error)
    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: error.response?.data?.error || 'ไม่สามารถเพิ่มประเภทการลาได้',
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
  } catch (error) {
    console.error('Delete leave type error:', error)
    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: error.response?.data?.error || 'ไม่สามารถลบประเภทการลาได้',
      life: 3000
    })
  }
}
</script>

<style scoped>
.leave-management-container {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
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

.table-wrapper {
  overflow-x: auto;
}

.leave-type-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
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
}
</style>
