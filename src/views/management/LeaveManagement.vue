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
        <DataTable :value="users" :paginator="true" :rows="10" stripedRows class="p-datatable-sm">
          <Column field="firstname" header="ชื่อ" :sortable="true">
            <template #body="{ data }">
              {{ data.firstname }} {{ data.lastname }}
            </template>
          </Column>
          <Column field="department" header="แผนก" :sortable="true" />
          <Column field="position" header="ตำแหน่ง" :sortable="true" />
          <Column header="ลาป่วย" style="width: 150px">
            <template #body="{ data }">
              <div class="quota-cell">
                <small>ใช้ไป: {{ data.sick_used || 0 }} วัน</small>
                <small>คงเหลือ: {{ (data.sick_leave_quota || 30) - (data.sick_used || 0) }} วัน</small>
              </div>
            </template>
          </Column>
          <Column header="ลากิจ" style="width: 150px">
            <template #body="{ data }">
              <div class="quota-cell">
                <small>ใช้ไป: {{ data.personal_used || 0 }} วัน</small>
                <small>คงเหลือ: {{ (data.personal_leave_quota || 10) - (data.personal_used || 0) }} วัน</small>
              </div>
            </template>
          </Column>
          <Column header="ลาพักร้อน" style="width: 150px">
            <template #body="{ data }">
              <div class="quota-cell">
                <small>ใช้ไป: {{ data.vacation_used || 0 }} วัน</small>
                <small>คงเหลือ: {{ (data.vacation_leave_quota || 10) - (data.vacation_used || 0) }} วัน</small>
              </div>
            </template>
          </Column>
          <Column header="ตั้งค่าโควต้า" style="width: 120px">
            <template #body="{ data }">
              <Button icon="pi pi-cog" size="small" @click="openQuotaDialog(data)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Quota Edit Dialog -->
    <Dialog v-model:visible="showQuotaDialog" header="ตั้งค่าโควต้าการลา" :modal="true" :draggable="false" style="width: 500px">
      <div class="quota-form" v-if="selectedUser">
        <h4>{{ selectedUser.firstname }} {{ selectedUser.lastname }}</h4>
        <div class="field">
          <label>ลาป่วย (วัน/ปี)</label>
          <InputNumber v-model="selectedUser.sick_leave_quota" :min="0" :max="365" showButtons class="w-full" />
        </div>
        <div class="field">
          <label>ลากิจ (วัน/ปี)</label>
          <InputNumber v-model="selectedUser.personal_leave_quota" :min="0" :max="365" showButtons class="w-full" />
        </div>
        <div class="field">
          <label>ลาพักร้อน (วัน/ปี)</label>
          <InputNumber v-model="selectedUser.vacation_leave_quota" :min="0" :max="365" showButtons class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" @click="showQuotaDialog = false" severity="secondary" />
        <Button label="บันทึก" icon="pi pi-check" @click="saveQuota" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import axios from 'axios'

const toast = useToast()
const users = ref([])
const saving = ref(false)
const showQuotaDialog = ref(false)
const selectedUser = ref(null)

onMounted(() => {
  loadUsers()
})

const loadUsers = async () => {
  try {
    const token = localStorage.getItem('soc_token')
    const [usersRes, leaveRes] = await Promise.all([
      axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get('/api/leave', {
        headers: { Authorization: `Bearer ${token}` }
      })
    ])
    
    // Calculate used leave days for each user
    const leaveData = leaveRes.data
    
    users.value = usersRes.data.map(user => {
      const userLeaves = leaveData.filter(leave => 
        leave.user_id === user.id && leave.status === 'approved'
      )
      
      const sick_used = userLeaves
        .filter(l => l.leave_type === 'sick')
        .reduce((sum, l) => sum + (parseFloat(l.days) || 0), 0)
      
      const personal_used = userLeaves
        .filter(l => l.leave_type === 'personal')
        .reduce((sum, l) => sum + (parseFloat(l.days) || 0), 0)
      
      const vacation_used = userLeaves
        .filter(l => l.leave_type === 'vacation')
        .reduce((sum, l) => sum + (parseFloat(l.days) || 0), 0)
      
      return {
        ...user,
        sick_leave_quota: user.sick_leave_quota || 30,
        personal_leave_quota: user.personal_leave_quota || 10,
        vacation_leave_quota: user.vacation_leave_quota || 10,
        sick_used,
        personal_used,
        vacation_used
      }
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: 'ไม่สามารถโหลดข้อมูลได้',
      life: 3000
    })
  }
}

const openQuotaDialog = (user) => {
  selectedUser.value = { ...user }
  showQuotaDialog.value = true
}

const saveQuota = async () => {
  saving.value = true
  try {
    const token = localStorage.getItem('soc_token')
    
    await axios.put(`/api/users/${selectedUser.value.id}/leave-quota`, {
      sick_leave_quota: selectedUser.value.sick_leave_quota,
      personal_leave_quota: selectedUser.value.personal_leave_quota,
      vacation_leave_quota: selectedUser.value.vacation_leave_quota
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: 'บันทึกโควต้าการลาเรียบร้อยแล้ว',
      life: 3000
    })
    
    showQuotaDialog.value = false
    loadUsers()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: 'ไม่สามารถบันทึกข้อมูลได้',
      life: 3000
    })
  } finally {
    saving.value = false
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

.quota-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.quota-cell small {
  font-size: 0.85rem;
  color: #6c757d;
}

.quota-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
}

.quota-form h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.quota-form .field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quota-form label {
  font-weight: 600;
  color: #2c3e50;
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
