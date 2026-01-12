<template>
  <div class="task-management">
    <Toast />
    
    <!-- Header Card -->
    <Card class="header-card mb-4">
      <template #content>
        <div class="header-content">
          <div class="header-left">
            <Button icon="pi pi-arrow-left" @click="$router.go(-1)" text class="back-btn" />
            <div class="header-title">
              <i class="pi pi-briefcase header-icon"></i>
              <h1>จัดการงาน</h1>
            </div>
          </div>
          <div class="header-stats">
            <div class="task-count">
              หมวดหมู่: {{ categories.length }} | สถานะ: {{ workStatuses.length }}
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Action Cards -->
    <div class="action-grid">
      <!-- All Projects Card -->
      <Card class="action-card" @click="$router.push('/management/projects')">
        <template #content>
          <div class="action-content">
            <div class="action-header">
              <i class="pi pi-folder action-icon"></i>
              <h3>รายการงาน</h3>
            </div>
            <p>ดูและจัดการรายการงานทั้งหมด</p>
            <div class="action-stats">
              <span class="stat-label">ดูรายละเอียด</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Daily Work Card -->
      <Card class="action-card" @click="$router.push('/management/daily-work')">
        <template #content>
          <div class="action-content">
            <div class="action-header">
              <i class="pi pi-calendar action-icon"></i>
              <h3>งานรายวัน</h3>
            </div>
            <p>ดูและจัดการงานรายวัน</p>
            <div class="action-stats">
              <span class="stat-label">ดูรายละเอียด</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Categories Management Card -->
      <Card class="action-card" @click="showCategoriesDialog = true">
        <template #content>
          <div class="action-content">
            <div class="action-header">
              <i class="pi pi-tags action-icon"></i>
              <h3>จัดการหมวดหมู่งาน</h3>
            </div>
            <p>เพิ่ม แก้ไข หรือลบหมวดหมู่งาน</p>
            <div class="action-stats">
              <span class="stat-number">{{ categories.length }}</span>
              <span class="stat-label">หมวดหมู่</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Status Management Card -->
      <Card class="action-card" @click="$router.push('/management/settings/workflow-status')">
        <template #content>
          <div class="action-content">
            <div class="action-header">
              <i class="pi pi-flag action-icon"></i>
              <h3>จัดการสถานะงาน</h3>
            </div>
            <p>ตั้งค่าสถานะที่แสดงตามเงื่อนไข Workflow</p>
            <div class="action-stats">
              <span class="stat-number">5</span>
              <span class="stat-label">เงื่อนไข</span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Manage Categories Dialog -->
    <Dialog v-model:visible="showCategoriesDialog" header="จัดการหมวดหมู่งาน" 
            :style="{width: '600px'}" modal :draggable="false" position="center">
      <div class="dialog-content">
        <div class="add-section mb-4">
          <div class="flex flex-column gap-3">
            <div class="flex gap-2">
              <InputText v-model="newCategory" placeholder="ชื่อหมวดหมู่ใหม่" class="flex-1" />
              <Dropdown v-model="newCategoryIcon" :options="categoryIcons" 
                        optionLabel="label" placeholder="เลือกสีและหมวดหมู่" 
                        class="icon-dropdown" style="min-width: 200px;">
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="icon-display">
                    <Badge :value="slotProps.value.label" 
                           :style="{ backgroundColor: slotProps.value.color, color: '#fff' }" />
                  </div>
                  <span v-else>เลือกสีและหมวดหมู่</span>
                </template>
                <template #option="slotProps">
                  <Badge :value="slotProps.option.label" 
                         :style="{ backgroundColor: slotProps.option.color, color: '#fff' }" />
                </template>
              </Dropdown>
              <Button icon="pi pi-plus" @click="addCategory" :disabled="!newCategory.trim() || !newCategoryIcon" />
            </div>
            <div class="color-preview" v-if="newCategoryIcon">
              <span>ตัวอย่าง:</span>
              <Badge :value="newCategory || 'หมวดหมู่ใหม่'" 
                     :style="{ backgroundColor: newCategoryIcon.color, color: '#fff' }" />
            </div>
          </div>
        </div>
        
        <div class="list-section">
          <h4>หมวดหมู่ที่มีอยู่</h4>
          <div class="category-list">
            <div v-for="(category, index) in categories" :key="category.value" 
                 class="category-item">
              <div class="category-info">
                <Badge :value="category.label" :style="{ backgroundColor: category.color || '#6c757d', color: '#fff' }" />
              </div>
              <div class="item-actions">
                <Button icon="pi pi-pencil" class="p-button-text p-button-sm" 
                        @click="editCategory(category)" v-tooltip="'แก้ไข'" />
                <Button icon="pi pi-arrow-up" class="p-button-text p-button-sm" 
                        @click="moveCategoryUp(index)" :disabled="index === 0" 
                        v-tooltip="'เลื่อนขึ้น'" />
                <Button icon="pi pi-arrow-down" class="p-button-text p-button-sm" 
                        @click="moveCategoryDown(index)" :disabled="index === categories.length - 1" 
                        v-tooltip="'เลื่อนลง'" />
                <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" 
                        @click="removeCategory(category.value)" v-tooltip="'ลบ'" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button label="ปิด" @click="closeCategoryDialog" />
      </template>
    </Dialog>

    <!-- Manage Status Dialog -->
    <Dialog v-model:visible="showStatusDialog" header="จัดการสถานะงาน" 
            :style="{width: '600px'}" modal :draggable="false" position="center">
      <div class="dialog-content">
        <div class="add-section mb-4">
          <div class="flex flex-column gap-3">
            <div class="flex gap-2">
              <InputText v-model="newStatus" placeholder="ชื่อสถานะใหม่" class="flex-1" />
              <Dropdown v-model="newStatusIcon" :options="statusIcons" 
                        optionLabel="label" placeholder="เลือกสีและไอคอน" 
                        class="icon-dropdown" style="min-width: 200px;">
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="icon-display">
                    <Badge :value="slotProps.value.label" 
                           :style="{ backgroundColor: slotProps.value.color, color: '#fff' }" />
                  </div>
                  <span v-else>เลือกสีและไอคอน</span>
                </template>
                <template #option="slotProps">
                  <div class="icon-option">
                    <Badge :value="slotProps.option.label" 
                           :style="{ backgroundColor: slotProps.option.color, color: '#fff' }" />
                  </div>
                </template>
              </Dropdown>
              <Button icon="pi pi-plus" @click="addStatus" :disabled="!newStatus.trim() || !newStatusIcon" />
            </div>
            <div class="color-preview" v-if="newStatusIcon">
              <span>ตัวอย่าง:</span>
              <Badge :value="newStatus || 'สถานะใหม่'" 
                     :style="{ backgroundColor: newStatusIcon.color, color: '#fff' }" />
            </div>
          </div>
        </div>
        
        <div class="list-section">
          <h4>สถานะที่มีอยู่</h4>
          <div class="status-list">
            <div v-for="(status, index) in workStatuses" :key="status.value" 
                 class="status-item">
              <div class="status-info">
                <Badge :value="status.label" :style="{ backgroundColor: status.color || '#6c757d', color: '#fff' }" />
              </div>
              <div class="item-actions">
                <Button icon="pi pi-pencil" class="p-button-text p-button-sm" 
                        @click="editStatus(status)" v-tooltip="'แก้ไข'" />
                <Button icon="pi pi-arrow-up" class="p-button-text p-button-sm" 
                        @click="moveStatusUp(index)" :disabled="index === 0" 
                        v-tooltip="'เลื่อนขึ้น'" />
                <Button icon="pi pi-arrow-down" class="p-button-text p-button-sm" 
                        @click="moveStatusDown(index)" :disabled="index === workStatuses.length - 1" 
                        v-tooltip="'เลื่อนลง'" />
                <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" 
                        @click="removeStatus(status.value)" v-tooltip="'ลบ'" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button label="ปิด" @click="closeStatusDialog" />
      </template>
    </Dialog>

    <!-- Edit Category Dialog -->
    <Dialog v-model:visible="showEditCategoryDialog" header="แก้ไขหมวดหมู่" 
            :style="{width: '450px'}" modal :draggable="false" position="center">
      <div class="edit-dialog-content">
        <div class="edit-field">
          <label class="edit-label">ชื่อหมวดหมู่ (ไม่ต้องใส่ icon)</label>
          <InputText v-model="editingCategoryName" class="w-full" placeholder="กรอกชื่อหมวดหมู่" />
        </div>
        
        <div class="edit-field">
          <label class="edit-label">เลือก Icon และสี</label>
          <Dropdown v-model="editingCategoryColor" :options="categoryIcons" 
                    optionLabel="label" class="w-full" placeholder="เลือก icon และสี">
            <template #value="slotProps">
              <div v-if="slotProps.value" class="color-selected">
                <span class="color-dot" :style="{ backgroundColor: slotProps.value.color }"></span>
                <span>{{ slotProps.value.label }}</span>
              </div>
              <span v-else>เลือก icon และสี</span>
            </template>
            <template #option="slotProps">
              <div class="color-option">
                <span class="color-dot" :style="{ backgroundColor: slotProps.option.color }"></span>
                <span>{{ slotProps.option.label }}</span>
              </div>
            </template>
          </Dropdown>
        </div>

        <div class="edit-preview" v-if="editingCategoryName">
          <label class="edit-label">ตัวอย่าง</label>
          <Badge :value="getIconFromLabel(editingCategoryColor?.label) + ' ' + editingCategoryName" 
                 :style="{ backgroundColor: editingCategoryColor?.color || '#6c757d', color: '#fff' }" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <Button label="ยกเลิก" @click="showEditCategoryDialog = false" severity="secondary" outlined />
          <Button label="บันทึก" @click="saveEditCategory" :disabled="!editingCategoryName || !editingCategoryColor" />
        </div>
      </template>
    </Dialog>

    <!-- Edit Status Dialog -->
    <Dialog v-model:visible="showEditStatusDialog" header="แก้ไขสถานะ" 
            :style="{width: '450px'}" modal :draggable="false" position="center">
      <div class="edit-dialog-content">
        <div class="edit-field">
          <label class="edit-label">ชื่อสถานะ (ไม่ต้องใส่ icon)</label>
          <InputText v-model="editingStatusName" class="w-full" placeholder="กรอกชื่อสถานะ" />
        </div>
        
        <div class="edit-field">
          <label class="edit-label">เลือก Icon และสี</label>
          <Dropdown v-model="editingStatusColor" :options="statusIcons" 
                    optionLabel="label" class="w-full" placeholder="เลือก icon และสี">
            <template #value="slotProps">
              <div v-if="slotProps.value" class="color-selected">
                <span class="color-dot" :style="{ backgroundColor: slotProps.value.color }"></span>
                <span>{{ slotProps.value.label }}</span>
              </div>
              <span v-else>เลือก icon และสี</span>
            </template>
            <template #option="slotProps">
              <div class="color-option">
                <span class="color-dot" :style="{ backgroundColor: slotProps.option.color }"></span>
                <span>{{ slotProps.option.label }}</span>
              </div>
            </template>
          </Dropdown>
        </div>

        <div class="edit-preview" v-if="editingStatusName">
          <label class="edit-label">ตัวอย่าง</label>
          <Badge :value="getIconFromLabel(editingStatusColor?.label) + ' ' + editingStatusName" 
                 :style="{ backgroundColor: editingStatusColor?.color || '#6c757d', color: '#fff' }" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <Button label="ยกเลิก" @click="showEditStatusDialog = false" severity="secondary" outlined />
          <Button label="บันทึก" @click="saveEditStatus" :disabled="!editingStatusName || !editingStatusColor" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import axios from '@/utils/axiosConfig'

const toast = useToast()
const http = axios

// Data
const showCategoriesDialog = ref(false)
const showStatusDialog = ref(false)
const showEditCategoryDialog = ref(false)
const showEditStatusDialog = ref(false)
const newCategory = ref('')
const newStatus = ref('')
const editingCategory = ref({ label: '', value: '', color: '' })
const editingCategoryColor = ref(null)
const editingCategoryName = ref('')
const editingStatus = ref({ label: '', value: '', color: '' })
const editingStatusColor = ref(null)
const editingStatusName = ref('')
const newCategoryIcon = ref(null)
const newStatusIcon = ref(null)

// Categories and Status
const categories = ref([])
const workStatuses = ref([])

// Icon Options
const categoryIcons = ref([
  { label: '💼 งานทั่วไป', value: 'emoji:💼', color: '#6366f1' },
  { label: '💻 งานพัฒนา', value: 'emoji:💻', color: '#14b8a6' },
  { label: '🔧 งานบำรุงรักษา', value: 'emoji:🔧', color: '#f97316' },
  { label: '👥 งานทีม', value: 'emoji:👥', color: '#a855f7' },
  { label: '📚 งานวิจัย', value: 'emoji:📚', color: '#06b6d4' },
  { label: '🔍 งานตรวจสอบ', value: 'emoji:🔍', color: '#84cc16' },
  { label: '📝 งานเอกสาร', value: 'emoji:📝', color: '#d946ef' },
  { label: '👤 งานลูกค้า', value: 'emoji:👤', color: '#0ea5e9' },
  { label: '💰 งานการเงิน', value: 'emoji:💰', color: '#22c55e' },
  { label: '📢 งานประชาสัมพันธ์', value: 'emoji:📢', color: '#eab308' },
  { label: '🏠 งานภายใน', value: 'emoji:🏠', color: '#64748b' },
  { label: '🚗 งานขนส่ง', value: 'emoji:🚗', color: '#78716c' },
  { label: '📱 งานดิจิทัล', value: 'emoji:📱', color: '#0891b2' },
  { label: '🎯 งานเป้าหมาย', value: 'emoji:🎯', color: '#6366f1' },
  { label: '📊 งานรายงาน', value: 'emoji:📊', color: '#14b8a6' },
  { label: '🎨 งานออกแบบ', value: 'emoji:🎨', color: '#f97316' },
  { label: '🔒 งานความปลอดภัย', value: 'emoji:🔒', color: '#a855f7' },
  { label: '🌐 งานออนไลน์', value: 'emoji:🌐', color: '#06b6d4' },
  { label: '📈 งานวิเคราะห์', value: 'emoji:📈', color: '#84cc16' },
  { label: '🏆 งานพิเศษ', value: 'emoji:🏆', color: '#d946ef' }
])

const statusIcons = ref([
  { label: '⏳ รอดำเนินการ', value: 'emoji:⏳', color: '#f59e0b' },
  { label: '🔄 กำลังดำเนินการ', value: 'emoji:🔄', color: '#3b82f6' },
  { label: '✅ เสร็จสิ้น', value: 'emoji:✅', color: '#10b981' },
  { label: '⏸️ ระงับ', value: 'emoji:⏸️', color: '#6c757d' },
  { label: '❌ ยกเลิก', value: 'emoji:❌', color: '#ef4444' },
  { label: '⚠️ เตือน', value: 'emoji:⚠️', color: '#f97316' },
  { label: '📝 ร่าง', value: 'emoji:📝', color: '#84cc16' },
  { label: '🚀 เร่งด่วน', value: 'emoji:🚀', color: '#ec4899' },
  { label: '🎯 เป้าหมาย', value: 'emoji:🎯', color: '#8b5cf6' },
  { label: '💡 ไอเดีย', value: 'emoji:💡', color: '#eab308' },
  { label: '🔥 สำคัญ', value: 'emoji:🔥', color: '#dc2626' },
  { label: '⚡ ด่วนมาก', value: 'emoji:⚡', color: '#f43f5e' },
  { label: '🌟 พิเศษ', value: 'emoji:🌟', color: '#a855f7' },
  { label: '🎉 สำเร็จ', value: 'emoji:🎉', color: '#22c55e' },
  { label: '🏁 เสร็จสมบูรณ์', value: 'emoji:🏁', color: '#14b8a6' },
  { label: '🔔 แจ้งเตือน', value: 'emoji:🔔', color: '#06b6d4' },
  { label: '📌 ปักหมุด', value: 'emoji:📌', color: '#0ea5e9' },
  { label: '💤 พักงาน', value: 'emoji:💤', color: '#64748b' },
  { label: '🤔 รอพิจารณา', value: 'emoji:🤔', color: '#78716c' },
  { label: '🔒 ล็อค', value: 'emoji:🔒', color: '#0891b2' }
])

// Methods
const loadCategories = async () => {
  try {
    // Update labels for existing categories
    await http.put('/api/settings/categories/update-labels')
    
    const response = await http.get('/api/settings/categories')
    categories.value = response.data
  } catch { // ignore
    
  }
}

const loadStatuses = async () => {
  try {
    // Update colors for existing statuses
    await http.put('/api/settings/statuses/update-colors')
    
    const response = await http.get('/api/settings/statuses')
    workStatuses.value = response.data
  } catch { // ignore
    
  }
}

const addCategory = async () => {
  if (newCategory.value.trim() && newCategoryIcon.value) {
    try {
      const emoji = newCategoryIcon.value.value.replace('emoji:', '')
      await http.post('/api/settings/categories', {
        label: `${emoji} ${newCategory.value.trim()}`,
        value: newCategory.value.trim().toLowerCase().replace(/\s+/g, '_'),
        icon: newCategoryIcon.value.value,
        color: newCategoryIcon.value.color
      })
      newCategory.value = ''
      newCategoryIcon.value = null
      await loadCategories()
      window.dispatchEvent(new CustomEvent('categoriesUpdated'))
      toast.add({
        severity: 'success',
        summary: 'สำเร็จ',
        detail: 'เพิ่มหมวดหมู่เรียบร้อย',
        life: 3000
      })
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'ข้อผิดพลาด',
        detail: err.response?.data?.error || 'ไม่สามารถเพิ่มหมวดหมู่ได้',
        life: 3000
      })
    }
  }
}

// Helper function to extract icon from label
const getIconFromLabel = (label) => {
  if (!label) return ''
  const match = label.match(/^(\p{Emoji})/u)
  return match ? match[1] : ''
}

// Helper function to extract name without icon
const getNameFromLabel = (label) => {
  if (!label) return ''
  return label.replace(/^(\p{Emoji})\s*/u, '').trim()
}

const editCategory = (category) => {
  editingCategory.value = { ...category }
  editingCategoryName.value = getNameFromLabel(category.label)
  editingCategoryColor.value = categoryIcons.value.find(c => c.color === category.color) || null
  showEditCategoryDialog.value = true
}

const saveEditCategory = async () => {
  try {
    const icon = getIconFromLabel(editingCategoryColor.value?.label)
    const newLabel = icon ? `${icon} ${editingCategoryName.value}` : editingCategoryName.value
    const updatedCategory = {
      ...editingCategory.value,
      label: newLabel,
      color: editingCategoryColor.value?.color || editingCategory.value.color
    }
    await http.put(`/api/settings/categories/${editingCategory.value.value}`, updatedCategory)
    await loadCategories()
    window.dispatchEvent(new CustomEvent('categoriesUpdated'))
    showEditCategoryDialog.value = false
    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: 'แก้ไขหมวดหมู่เรียบร้อย',
      life: 3000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'ข้อผิดพลาด',
      detail: 'ไม่สามารถแก้ไขหมวดหมู่ได้',
      life: 3000
    })
  }
}

const removeCategory = async (categoryValue) => {
  try {
    await http.delete(`/api/settings/categories/${categoryValue}`)
    await loadCategories()
    window.dispatchEvent(new CustomEvent('categoriesUpdated'))
    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: 'ลบหมวดหมู่เรียบร้อย',
      life: 3000
    })
  } catch (err) { // ignore
    toast.add({
      severity: 'error',
      summary: 'ข้อผิดพลาด',
      detail: 'ไม่สามารถลบหมวดหมู่ได้',
      life: 3000
    })
  }
}

const moveCategoryUp = async (index) => {
  if (index > 0) {
    const temp = categories.value[index]
    categories.value[index] = categories.value[index - 1]
    categories.value[index - 1] = temp
    await http.put('/api/settings/categories/reorder', { categories: categories.value })
    window.dispatchEvent(new CustomEvent('categoriesUpdated'))
  }
}

const moveCategoryDown = async (index) => {
  if (index < categories.value.length - 1) {
    const temp = categories.value[index]
    categories.value[index] = categories.value[index + 1]
    categories.value[index + 1] = temp
    await http.put('/api/settings/categories/reorder', { categories: categories.value })
    window.dispatchEvent(new CustomEvent('categoriesUpdated'))
  }
}

const addStatus = async () => {
  if (newStatus.value.trim() && newStatusIcon.value) {
    try {
      const emoji = newStatusIcon.value.value.replace('emoji:', '')
      await http.post('/api/settings/statuses', {
        label: `${emoji} ${newStatus.value.trim()}`,
        value: newStatus.value.trim().toLowerCase().replace(/\s+/g, '_'),
        icon: newStatusIcon.value.value,
        color: newStatusIcon.value.color
      })
      newStatus.value = ''
      newStatusIcon.value = null
      await loadStatuses()
      window.dispatchEvent(new CustomEvent('statusesUpdated'))
      toast.add({
        severity: 'success',
        summary: 'สำเร็จ',
        detail: 'เพิ่มสถานะเรียบร้อย',
        life: 3000
      })
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'ข้อผิดพลาด',
        detail: err.response?.data?.error || 'ไม่สามารถเพิ่มสถานะได้',
        life: 3000
      })
    }
  }
}

const editStatus = (status) => {
  editingStatus.value = { ...status }
  editingStatusName.value = getNameFromLabel(status.label)
  editingStatusColor.value = statusIcons.value.find(s => s.color === status.color) || null
  showEditStatusDialog.value = true
}

const saveEditStatus = async () => {
  try {
    const icon = getIconFromLabel(editingStatusColor.value?.label)
    const newLabel = icon ? `${icon} ${editingStatusName.value}` : editingStatusName.value
    const updatedStatus = {
      ...editingStatus.value,
      label: newLabel,
      color: editingStatusColor.value?.color || editingStatus.value.color
    }
    await http.put(`/api/settings/statuses/${editingStatus.value.value}`, updatedStatus)
    await loadStatuses()
    window.dispatchEvent(new CustomEvent('statusesUpdated'))
    showEditStatusDialog.value = false
    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: 'แก้ไขสถานะเรียบร้อย',
      life: 3000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'ข้อผิดพลาด',
      detail: 'ไม่สามารถแก้ไขสถานะได้',
      life: 3000
    })
  }
}

const removeStatus = async (statusValue) => {
  try {
    await http.delete(`/api/settings/statuses/${statusValue}`)
    await loadStatuses()
    window.dispatchEvent(new CustomEvent('statusesUpdated'))
    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: 'ลบสถานะเรียบร้อย',
      life: 3000
    })
  } catch { // ignore
    toast.add({
      severity: 'error',
      summary: 'ข้อผิดพลาด',
      detail: 'ไม่สามารถลบสถานะได้',
      life: 3000
    })
  }
}

const moveStatusUp = async (index) => {
  if (index > 0) {
    const temp = workStatuses.value[index]
    workStatuses.value[index] = workStatuses.value[index - 1]
    workStatuses.value[index - 1] = temp
    await http.put('/api/settings/statuses/reorder', { statuses: workStatuses.value })
    window.dispatchEvent(new CustomEvent('statusesUpdated'))
  }
}

const moveStatusDown = async (index) => {
  if (index < workStatuses.value.length - 1) {
    const temp = workStatuses.value[index]
    workStatuses.value[index] = workStatuses.value[index + 1]
    workStatuses.value[index + 1] = temp
    await http.put('/api/settings/statuses/reorder', { statuses: workStatuses.value })
    window.dispatchEvent(new CustomEvent('statusesUpdated'))
  }
}

const closeCategoryDialog = () => {
  showCategoriesDialog.value = false
  newCategory.value = ''
  newCategoryIcon.value = null
}

const closeStatusDialog = () => {
  showStatusDialog.value = false
  newStatus.value = ''
  newStatusIcon.value = ''
}

onMounted(() => {
  loadCategories()
  loadStatuses()
})
</script>

<style scoped>
.task-management {
  padding: 1rem;
  padding-bottom: 0;
  max-width: 100%;
  margin: 0 auto;
  
  background: #e5e7eb;
  height: 100%;
  overflow: auto;
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

.back-btn {
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 8px !important;
  padding: 0.5rem !important;
  transition: all 0.3s ease !important;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
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

.header-stats {
  display: flex;
  align-items: center;
}

.task-count {
  font-size: 0.875rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  white-space: nowrap;
}

/* Action Grid */
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.action-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  border-color: #4A90E2;
}

.action-content {
  padding: 1.5rem;
}

.action-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.action-icon {
  font-size: 2rem;
  color: #4A90E2;
  transition: color 0.3s ease;
}

.action-card:hover .action-icon {
  color: #D73527;
}

.action-content h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.action-content p {
  margin: 0 0 1rem 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
}

.action-stats {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4A90E2;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
}

/* Dialog Styles */
.dialog-content {
  padding: 1rem 0;
}

.add-section {
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.icon-dropdown {
  min-width: 120px;
}

.icon-display, .icon-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.emoji {
  font-size: 1.4rem;
}

.icon-option {
  justify-content: center;
  padding: 0.5rem;
}

.icon-display {
  justify-content: center;
}

.list-section h4 {
  margin: 1rem 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
}

.category-list,
.status-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.category-item,
.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
}

.category-info,
.status-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.status-info .emoji {
  min-width: 1.5rem;
  text-align: center;
}

.category-info i,
.status-info i {
  color: #4A90E2;
}

.color-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.color-preview span {
  font-size: 0.9rem;
  color: #495057;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .task-management {
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

  .action-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .action-content {
    padding: 1.25rem;
  }
  
  .action-icon {
    font-size: 1.75rem;
  }

  .action-content h3 {
    font-size: 1.1rem;
  }
}

/* Edit Dialog Styles */
.edit-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem 0;
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
}

.edit-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  align-items: flex-start;
}

.color-selected,
.color-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
