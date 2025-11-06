<template>
  <div class="user-management">
    <Toast />
    
    <!-- Header Card -->
    <Card class="header-card mb-4">
      <template #content>
        <div class="header-content">
          <div class="header-left">
            <Button icon="pi pi-arrow-left" @click="$router.go(-1)" text class="back-btn" />
            <div class="header-title">
              <i class="pi pi-users header-icon"></i>
              <h1>จัดการผู้ใช้งาน</h1>
            </div>
          </div>
          <div class="header-stats">
            <div class="user-count">
              ผู้ใช้ทั้งหมด: {{ users.length }}
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Search and Filter Card -->
    <Card class="filter-card mb-4">
      <template #content>
        <div class="filter-content">
          <div class="search-wrapper">
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText v-model="filters['global'].value" placeholder="ค้นหาผู้ใช้..." class="search-input" />
            </IconField>
          </div>
          <div class="filter-actions">
            <Button label="เพิ่มผู้ใช้" icon="pi pi-plus" @click="addUser" class="add-btn" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Data Table Card -->
    <Card class="table-card">
      <template #content>
        <DataTable :value="users" :loading="loading" paginator :rows="10" 
                   :globalFilterFields="['firstname', 'lastname', 'username', 'email', 'employee_id', 'position', 'department', 'statusText']"
                   v-model:filters="filters" filterDisplay="menu"
                   :rowsPerPageOptions="[5, 10, 20, 50]"
                   paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                   currentPageReportTemplate="{first} ถึง {last} จาก {totalRecords} รายการ"
                   class="responsive-table">
          
          <Column field="employee_id" header="รหัสพนักงาน" class="employee-id-col">
            <template #body="slotProps">
              <Badge :value="slotProps.data.employee_id" severity="info" />
            </template>
          </Column>
          
          <Column field="firstname" header="ชื่อ-นามสกุล" class="name-col">
            <template #body="slotProps">
              <div class="user-info">
                <div class="user-name">{{ slotProps.data.firstname }} {{ slotProps.data.lastname }}</div>
                <div class="user-username">@{{ slotProps.data.username }}</div>
              </div>
            </template>
          </Column>
          
          <Column field="email" header="Email" class="email-col">
            <template #body="slotProps">
              <div class="email-wrapper">
                <i class="pi pi-envelope email-icon"></i>
                {{ slotProps.data.email }}
              </div>
            </template>
          </Column>
          
          <Column field="position" header="ตำแหน่ง" class="position-col">
            <template #body="slotProps">
              <div class="position-info">
                <div class="position">{{ slotProps.data.position || '-' }}</div>
                <div class="department">{{ slotProps.data.department || '-' }}</div>
              </div>
            </template>
          </Column>
          
          <Column field="role" header="Role" class="role-col">
            <template #body="slotProps">
              <Badge :value="slotProps.data.role" 
                     :severity="getRoleSeverity(slotProps.data.role)" />
            </template>
          </Column>
          
          <Column field="is_active" header="สถานะ" class="status-col">
            <template #body="slotProps">
              <Badge :value="slotProps.data.is_active ? 'Active' : 'Inactive'" 
                     :severity="slotProps.data.is_active ? 'success' : 'danger'" />
            </template>
          </Column>
          
          <Column header="จัดการ" class="action-col">
            <template #body="slotProps">
              <div class="action-buttons">
                <Button icon="pi pi-pencil" size="small" severity="info" 
                        @click="editUser(slotProps.data)" v-tooltip="'แก้ไข'" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Add/Edit User Dialog -->
    <Dialog v-model:visible="showAddUser" :header="editMode ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน'" 
            modal :style="{ width: '90vw', maxWidth: '600px' }" class="user-dialog" 
            :draggable="false" :resizable="false" position="center">
      <div class="user-form">
        <div class="form-row">
          <div class="field">
            <label>Username *</label>
            <InputText v-model="userForm.username" required />
          </div>
          <div class="field" v-if="!editMode">
            <label>Password *</label>
            <div class="password-wrapper">
              <InputText v-model="userForm.password" :type="showPassword ? 'text' : 'password'" 
                         required placeholder="กรอก password" />
              <Button :icon="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                      @click="showPassword = !showPassword" text size="small" class="password-toggle" />
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label>ชื่อ *</label>
            <InputText v-model="userForm.firstname" required />
          </div>
          <div class="field">
            <label>นามสกุล *</label>
            <InputText v-model="userForm.lastname" required />
          </div>
        </div>
        <div class="field">
          <label>Email *</label>
          <InputText v-model="userForm.email" type="email" required />
        </div>
        <div class="form-row">
          <div class="field">
            <label>ตำแหน่ง</label>
            <InputText v-model="userForm.position" />
          </div>
          <div class="field">
            <label>แผนก</label>
            <InputText v-model="userForm.department" />
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label>Role *</label>
            <div class="role-input-group">
              <Dropdown v-model="userForm.role" :options="roleOptions" optionLabel="label" optionValue="value" 
                        placeholder="เลือก role" class="role-dropdown" />
              <InputText v-model="newRoleInput" placeholder="พิมพ์ role ใหม่" class="new-role-input" />
              <Button icon="pi pi-plus" @click="addNewRole" :disabled="!newRoleInput" 
                      severity="success" class="add-role-btn" v-tooltip="'เพิ่ม role ใหม่'" />
            </div>
          </div>
          <div class="field">
            <label>สถานะ</label>
            <Dropdown v-model="userForm.is_active" :options="statusOptions" optionLabel="label" optionValue="value" />
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <Button label="ยกเลิก" @click="closeDialog" text />
          <Button label="บันทึก" @click="saveUser" :loading="saving" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { FilterMatchMode } from 'primevue/api'
import axios from 'axios'

const toast = useToast()

const users = ref([])
const loading = ref(false)
const saving = ref(false)
const showAddUser = ref(false)
const editMode = ref(false)
const showPassword = ref(false)
const newRoleInput = ref('')

const userForm = ref({
  firstname: '',
  lastname: '',
  username: '',
  password: '',
  email: '',
  position: '',
  department: '',
  role: 'user',
  is_active: true
})

const roleOptions = ref([
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' },
  { label: 'HR', value: 'hr' }
])

const statusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false }
]

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

const addNewRole = () => {
  const newRole = newRoleInput.value.trim().toLowerCase()
  if (newRole && !roleOptions.value.find(opt => opt.value === newRole)) {
    roleOptions.value.push({
      label: newRole.charAt(0).toUpperCase() + newRole.slice(1),
      value: newRole
    })
    userForm.value.role = newRole
    newRoleInput.value = ''
    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: `เพิ่ม role "${newRole}" แล้ว`,
      life: 2000
    })
  }
}

const getRoleSeverity = (role) => {
  switch (role) {
    case 'admin': return 'danger'
    case 'hr': return 'warning'
    default: return 'info'
  }
}

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/users')
    users.value = response.data.map(user => ({
      ...user,
      statusText: user.status === 'active' ? 'Active' : 'Inactive'
    }))
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'ข้อผิดพลาด',
      detail: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const addUser = () => {
  resetForm()
  editMode.value = false
  showAddUser.value = true
}

const saveUser = async () => {
  saving.value = true
  try {
    const userData = { ...userForm.value }
    
    // Remove password from update if in edit mode
    if (editMode.value) {
      delete userData.password
    }
    
    if (editMode.value) {
      await axios.put(`/api/users/${userForm.value.id}`, userData)
    } else {
      await axios.post('/api/users', userData)
    }
    
    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: editMode.value ? 'แก้ไขผู้ใช้เรียบร้อย' : 'เพิ่มผู้ใช้เรียบร้อย',
      life: 3000
    })
    
    showAddUser.value = false
    resetForm()
    loadUsers()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'ข้อผิดพลาด',
      detail: error.response?.data?.error || 'ไม่สามารถบันทึกข้อมูลได้',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const editUser = (user) => {
  userForm.value = { ...user }
  editMode.value = true
  showAddUser.value = true
}

const resetForm = () => {
  userForm.value = {
    firstname: '',
    lastname: '',
    username: '',
    password: '',
    email: '',
    position: '',
    department: '',
    role: 'user',
    is_active: true
  }
  editMode.value = false
}

const closeDialog = () => {
  showAddUser.value = false
  showPassword.value = false
  resetForm()
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Styles */
.header-card {
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
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
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 8px !important;
  padding: 0.5rem !important;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
}

.header-stats {
  display: flex;
  align-items: center;
}

.user-count {
  font-size: 0.875rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Action Section */
.action-section {
  display: flex;
  justify-content: flex-start;
}

.add-btn {
  background: #4A90E2;
  border: 1px solid #4A90E2;
  color: white;
}

.add-btn:hover {
  background: #357ABD;
  border-color: #357ABD;
}

/* Filter Card */
.filter-card {
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.filter-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.search-wrapper {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.add-btn {
  background: #4A90E2;
  border: 1px solid #4A90E2;
  color: white;
}

.add-btn:hover {
  background: #357ABD;
  border-color: #357ABD;
}

/* Table Styles */
.table-card {
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.responsive-table {
  font-size: 0.875rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  font-weight: 600;
  color: #2c3e50;
}

.user-username {
  font-size: 0.75rem;
  color: #6c757d;
}

.email-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.email-icon {
  color: #6c757d;
  font-size: 0.75rem;
}

.position-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.position {
  font-weight: 500;
  color: #2c3e50;
}

.department {
  font-size: 0.75rem;
  color: #6c757d;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

/* Dialog Styles */
.user-dialog {
  margin: 1rem;
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 500;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper .p-inputtext {
  flex: 1;
  padding-right: 3rem;
}

.password-toggle {
  position: absolute;
  right: 0.5rem;
  z-index: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .user-management {
    padding: 0.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-left {
    flex-direction: column;
    gap: 0.5rem;
  }

  .header-stats {
    margin-top: 0.5rem;
  }

  .filter-content {
    flex-direction: column;
    gap: 1rem;
  }

  .search-wrapper {
    max-width: none;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  /* Hide less important columns on mobile */
  .employee-id-col,
  .email-col,
  .position-col {
    display: none;
  }

  .responsive-table :deep(.p-datatable-wrapper) {
    overflow-x: auto;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
}

@media (max-width: 480px) {
  .header-title h1 {
    font-size: 1.25rem;
  }

  .user-dialog {
    margin: 0.5rem;
  }

  .dialog-footer {
    flex-direction: column;
  }

  /* Show only essential columns on very small screens */
  .role-col,
  .status-col {
    display: none;
  }
}

/* Loading and Empty States */
.p-datatable .p-datatable-loading-overlay {
  background: rgba(255, 255, 255, 0.8);
}

.p-datatable .p-datatable-emptymessage {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

/* Badge Customization */
.p-badge {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Tooltip Styling */
.p-tooltip .p-tooltip-text {
  font-size: 0.75rem;
}

/* Role Input Group */
.role-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.role-dropdown {
  flex: 1;
}

.new-role-input {
  flex: 1;
}

.add-role-btn {
  padding: 0.5rem 0.75rem !important;
}
</style>
