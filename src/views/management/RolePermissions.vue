<template>
  <div class="permissions-container">
    <Toast />
    
    <!-- Header -->
    <Card class="header-card mb-4">
      <template #content>
        <div class="header-content">
          <Button icon="pi pi-arrow-left" text rounded @click="$router.push('/management/settings')" class="back-btn" />
          <div class="header-title">
            <i class="pi pi-shield"></i>
            <h1>จัดการสิทธิ์การเข้าถึง</h1>
          </div>
        </div>
      </template>
    </Card>

    <!-- Role Selector -->
    <Card class="mb-4">
      <template #content>
        <div class="role-selector">
          <label>เลือก Role:</label>
          <Dropdown v-model="selectedRole" :options="roles" optionLabel="label" optionValue="value" 
                    placeholder="เลือก Role" class="w-full md:w-14rem" />
        </div>
      </template>
    </Card>

    <!-- Permissions Table -->
    <Card v-if="selectedRole">
      <template #content>
        <div class="table-header">
          <Button label="เพิ่ม Permission" icon="pi pi-plus" @click="showAddDialog = true" severity="success" size="small" />
        </div>
        <DataTable :value="pages" class="p-datatable-sm" stripedRows>
          <Column field="name" header="หน้า (Double-click เพื่อแก้ไข)" style="min-width: 200px">
            <template #body="{ data }">
              <div class="page-info" @dblclick="editCell(data, 'name')">
                <i :class="data.icon" class="page-icon"></i>
                <span v-if="!data.editingName">{{ data.name }}</span>
                <InputText v-else v-model="data.name" @blur="saveEdit(data, 'name')" @keyup.enter="saveEdit(data, 'name')" autofocus />
              </div>
            </template>
          </Column>
          <Column field="path" header="Path (Double-click เพื่อแก้ไข)" style="min-width: 200px">
            <template #body="{ data }">
              <code v-if="!data.editingPath" @dblclick="editCell(data, 'path')">{{ data.path }}</code>
              <InputText v-else v-model="data.path" @blur="saveEdit(data, 'path')" @keyup.enter="saveEdit(data, 'path')" autofocus />
            </template>
          </Column>
          <Column field="icon" header="Icon (Double-click เพื่อแก้ไข)" style="min-width: 150px">
            <template #body="{ data }">
              <div v-if="!data.editingIcon" @dblclick="editCell(data, 'icon')">
                <i :class="data.icon" style="font-size: 1.2rem; color: #4A90E2;"></i>
                <span style="margin-left: 0.5rem; font-size: 0.85rem; color: #6c757d;">{{ data.icon }}</span>
              </div>
              <InputText v-else v-model="data.icon" placeholder="pi pi-home" @blur="saveEdit(data, 'icon')" @keyup.enter="saveEdit(data, 'icon')" autofocus />
            </template>
          </Column>
          <Column header="สิทธิ์การเข้าถึง" style="width: 150px">
            <template #body="{ data }">
              <InputSwitch v-model="data.hasAccess" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Save Button -->
    <div class="action-bar" v-if="selectedRole">
      <Button label="บันทึกการเปลี่ยนแปลง" icon="pi pi-save" @click="confirmSave" :loading="saving" />
    </div>

    <!-- Add Permission Dialog -->
    <Dialog v-model:visible="showAddDialog" header="เพิ่ม Permission ใหม่" :modal="true" :draggable="false" style="width: 500px">
      <div class="add-permission-form">
        <div class="field">
          <label>ชื่อหน้า</label>
          <InputText v-model="newPermission.name" placeholder="เช่น: จัดการสินค้า" class="w-full" />
        </div>
        <div class="field">
          <label>Path</label>
          <InputText v-model="newPermission.path" placeholder="เช่น: /management/products" class="w-full" />
        </div>
        <div class="field">
          <label>Icon</label>
          <InputText v-model="newPermission.icon" placeholder="เช่น: pi pi-box" class="w-full" />
        </div>
        <div class="field">
          <label>สิทธิ์การเข้าถึง</label>
          <InputSwitch v-model="newPermission.hasAccess" />
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" @click="showAddDialog = false" severity="secondary" />
        <Button label="เพิ่ม" icon="pi pi-check" @click="addPermission" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import axios from 'axios'

const toast = useToast()
const confirm = useConfirm()
const selectedRole = ref(null)
const saving = ref(false)
const roles = ref([])
const editingCell = ref(null)
const showAddDialog = ref(false)
const newPermission = ref({
  name: '',
  path: '',
  icon: 'pi pi-circle',
  hasAccess: true
})

const pages = ref([
  { id: 1, name: 'งานรายวัน', path: '/daily_work', icon: 'pi pi-home', hasAccess: false },
  { id: 2, name: 'โครงการ', path: '/projects', icon: 'pi pi-briefcase', hasAccess: false },
  { id: 3, name: 'โปรไฟล์', path: '/profile', icon: 'pi pi-user', hasAccess: false },
  { id: 4, name: 'จองรถ', path: '/car_booking', icon: 'pi pi-car', hasAccess: false },
  { id: 5, name: 'ลางาน', path: '/leave_work', icon: 'pi pi-calendar-times', hasAccess: false },
  { id: 6, name: 'อนุมัติลางาน', path: '/leave_work/approve', icon: 'pi pi-check-circle', hasAccess: false },
  { id: 7, name: 'ระบบจัดการ', path: '/management', icon: 'pi pi-cog', hasAccess: false },
  { id: 8, name: 'จัดการผู้ใช้งาน', path: '/management/users', icon: 'pi pi-users', hasAccess: false },
  { id: 9, name: 'จัดการงาน', path: '/management/tasks', icon: 'pi pi-briefcase', hasAccess: false },
  { id: 10, name: 'ตั้งค่าระบบ', path: '/management/settings', icon: 'pi pi-cog', hasAccess: false },
  { id: 11, name: 'จัดการสิทธิ์', path: '/management/settings/role-permissions', icon: 'pi pi-shield', hasAccess: false }
])

onMounted(async () => {
  await loadRoles()
})

const loadRoles = async () => {
  try {
    const token = localStorage.getItem('soc_token')
    const response = await axios.get('/api/users/roles', {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    roles.value = response.data.roles.map(role => ({
      label: role.charAt(0).toUpperCase() + role.slice(1),
      value: role
    }))
  } catch (error) {
    console.error('Error loading roles:', error)
    // Fallback to default roles
    roles.value = [
      { label: 'Superadmin', value: 'superadmin' },
      { label: 'Admin', value: 'admin' },
      { label: 'Manager', value: 'manager' },
      { label: 'User', value: 'user' }
    ]
  }
}

watch(selectedRole, async (newRole) => {
  if (newRole) {
    await loadPermissions(newRole)
  }
})

const loadPermissions = async (role) => {
  try {
    const token = localStorage.getItem('soc_token')
    const response = await axios.get(`/api/role-permissions/${role}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (response.data.permissions) {
      pages.value.forEach(page => {
        const permission = response.data.permissions.find(p => p.page_path === page.path)
        page.hasAccess = permission ? permission.has_access : false
      })
    }
  } catch (error) {
    // If no permissions exist yet, set defaults based on role
    setDefaultPermissions(role)
  }
}

const setDefaultPermissions = (role) => {
  pages.value.forEach(page => {
    if (role === 'superadmin') {
      page.hasAccess = true
    } else if (role === 'admin') {
      page.hasAccess = !page.path.includes('role-permissions')
    } else if (role === 'manager') {
      page.hasAccess = !['/management/users', '/management/settings'].some(p => page.path.includes(p))
    } else {
      page.hasAccess = ['/daily_work', '/profile', '/car_booking', '/leave_work'].includes(page.path)
    }
  })
}

const editCell = (data, field) => {
  editingCell.value = { ...data }
  if (field === 'name') data.editingName = true
  if (field === 'path') data.editingPath = true
  if (field === 'icon') data.editingIcon = true
}

const saveEdit = (data, field) => {
  const oldValue = editingCell.value[field]
  const newValue = data[field]
  
  if (oldValue !== newValue) {
    confirm.require({
      message: `ต้องการเปลี่ยน ${field === 'name' ? 'ชื่อ' : field === 'path' ? 'Path' : 'Icon'} จาก "${oldValue}" เป็น "${newValue}" หรือไม่?`,
      header: 'ยืนยันการแก้ไข',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'ยืนยัน',
      rejectLabel: 'ยกเลิก',
      blockScroll: true,
      draggable: false,
      accept: () => {
        toast.add({
          severity: 'success',
          summary: 'แก้ไขสำเร็จ',
          detail: 'กรุณากดบันทึกเพื่อบันทึกการเปลี่ยนแปลง',
          life: 3000
        })
      },
      reject: () => {
        data[field] = oldValue
      }
    })
  }
  
  data.editingName = false
  data.editingPath = false
  data.editingIcon = false
}

const confirmSave = () => {
  confirm.require({
    message: `ต้องการบันทึกสิทธิ์การเข้าถึงสำหรับ Role "${selectedRole.value}" หรือไม่?`,
    header: 'ยืนยันการบันทึก',
    icon: 'pi pi-save',
    acceptLabel: 'บันทึก',
    rejectLabel: 'ยกเลิก',
    blockScroll: true,
    draggable: false,
    accept: () => {
      savePermissions()
    }
  })
}

const addPermission = () => {
  if (!newPermission.value.name || !newPermission.value.path) {
    toast.add({
      severity: 'warn',
      summary: 'กรุณากรอกข้อมูล',
      detail: 'กรุณากรอกชื่อหน้าและ Path',
      life: 3000
    })
    return
  }

  const newId = Math.max(...pages.value.map(p => p.id)) + 1
  pages.value.push({
    id: newId,
    name: newPermission.value.name,
    path: newPermission.value.path,
    icon: newPermission.value.icon || 'pi pi-circle',
    hasAccess: newPermission.value.hasAccess
  })

  toast.add({
    severity: 'success',
    summary: 'เพิ่มสำเร็จ',
    detail: 'กรุณากดบันทึกเพื่อบันทึกการเปลี่ยนแปลง',
    life: 3000
  })

  showAddDialog.value = false
  newPermission.value = {
    name: '',
    path: '',
    icon: 'pi pi-circle',
    hasAccess: true
  }
}

const savePermissions = async () => {
  saving.value = true
  try {
    const token = localStorage.getItem('soc_token')
    const permissions = pages.value.map(page => ({
      role: selectedRole.value,
      page_path: page.path,
      page_name: page.name,
      page_icon: page.icon,
      has_access: page.hasAccess
    }))

    await axios.post('/api/role-permissions', 
      { permissions },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: 'บันทึกสิทธิ์การเข้าถึงเรียบร้อยแล้ว',
      life: 3000
    })

    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: 'ไม่สามารถบันทึกสิทธิ์ได้',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.permissions-container {
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

.role-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.role-selector label {
  font-weight: 600;
  min-width: 100px;
  color: #2c3e50;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.table-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.add-permission-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
}

.add-permission-form .field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-permission-form label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.page-info:hover {
  background: #f8f9fa;
}

.page-icon {
  color: #4A90E2;
  font-size: 1.1rem;
  min-width: 20px;
}

code {
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #e83e8c;
  cursor: pointer;
  display: inline-block;
  transition: background 0.2s;
}

code:hover {
  background: #e9ecef;
}

.action-bar {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

:deep(.p-confirm-dialog) {
  max-width: 90vw;
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
}

:deep(.p-confirm-dialog .p-dialog-header) {
  cursor: default !important;
  user-select: none;
  pointer-events: none;
}

:deep(.p-confirm-dialog .p-dialog-header .p-dialog-header-icon) {
  pointer-events: auto;
}

:deep(.p-confirm-dialog .p-dialog-title) {
  pointer-events: none;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8f9fa;
  color: #2c3e50;
  font-weight: 600;
  padding: 1rem;
  border-bottom: 2px solid #dee2e6;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem 1rem;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #f8f9fa;
}

@media (max-width: 1024px) {
  .permissions-container {
    padding: 0.75rem;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }

  :deep(.p-datatable) {
    font-size: 0.9rem;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th) {
    padding: 0.75rem;
  }

  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.5rem 0.75rem;
  }
}

@media (max-width: 768px) {
  .permissions-container {
    padding: 0.5rem;
  }

  .header-content {
    padding: 0.75rem;
  }

  .header-title h1 {
    font-size: 1.25rem;
  }

  .header-title i {
    font-size: 1.25rem;
  }

  .role-selector {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .role-selector label {
    min-width: auto;
  }

  :deep(.p-dropdown) {
    width: 100% !important;
  }

  .table-header {
    margin-bottom: 0.75rem;
  }

  .table-header h3 {
    font-size: 1rem;
  }

  :deep(.p-datatable) {
    font-size: 0.85rem;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th) {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.5rem;
  }

  .page-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .page-icon {
    font-size: 1rem;
  }

  code {
    font-size: 0.75rem;
    word-break: break-all;
    max-width: 100%;
  }

  :deep(.p-inputswitch) {
    transform: scale(0.85);
  }

  .action-bar {
    margin-top: 1rem;
    flex-direction: column;
  }

  .action-bar button {
    width: 100%;
  }

  :deep(.p-dialog) {
    width: 95vw !important;
    margin: 0.5rem;
  }

  :deep(.p-confirm-dialog) {
    width: 90vw !important;
  }

  .add-permission-form {
    padding: 0.5rem 0;
  }

  .add-permission-form .field label {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .permissions-container {
    padding: 0.25rem;
  }

  .header-title h1 {
    font-size: 1.1rem;
  }

  :deep(.p-datatable) {
    font-size: 0.75rem;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th) {
    padding: 0.4rem;
    font-size: 0.75rem;
  }

  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.4rem;
  }

  :deep(.p-button) {
    font-size: 0.85rem;
    padding: 0.5rem 1rem;
  }

  :deep(.p-inputswitch) {
    transform: scale(0.75);
  }

  .table-header h3 {
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) and (orientation: landscape) {
  .header-content {
    padding: 0.5rem;
  }

  .header-title h1 {
    font-size: 1rem;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th),
  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.4rem;
  }
}
</style>
