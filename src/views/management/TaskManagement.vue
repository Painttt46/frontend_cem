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
      <Card class="action-card" @click="showStatusDialog = true">
        <template #content>
          <div class="action-content">
            <div class="action-header">
              <i class="pi pi-flag action-icon"></i>
              <h3>จัดการสถานะงาน</h3>
            </div>
            <p>เพิ่ม แก้ไข หรือลบสถานะงาน</p>
            <div class="action-stats">
              <span class="stat-number">{{ workStatuses.length }}</span>
              <span class="stat-label">สถานะ</span>
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
                        optionLabel="label" optionValue="value" placeholder="เลือก Icon" 
                        class="icon-dropdown">
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="icon-display">
                    <span v-if="slotProps.value.startsWith('emoji:')" class="emoji">{{ slotProps.value.replace('emoji:', '') }}</span>
                    <i v-else :class="slotProps.value"></i>
                  </div>
                  <span v-else>Icon</span>
                </template>
                <template #option="slotProps">
                  <div class="icon-option">
                    <span v-if="slotProps.option.value.startsWith('emoji:')" class="emoji">{{ slotProps.option.value.replace('emoji:', '') }}</span>
                    <i v-else :class="slotProps.option.value"></i>
                  </div>
                </template>
              </Dropdown>
              <Button icon="pi pi-plus" @click="addCategory" :disabled="!newCategory.trim() || !newCategoryIcon" />
            </div>
          </div>
        </div>
        
        <div class="list-section">
          <h4>หมวดหมู่ที่มีอยู่</h4>
          <div class="category-list">
            <div v-for="(category, index) in categories" :key="category.value" 
                 class="category-item">
              <div class="category-info">
                <span v-if="category.icon && category.icon.startsWith('emoji:')" class="emoji">{{ category.icon.replace('emoji:', '') }}</span>
                <i v-else :class="category.icon || 'pi pi-tag'"></i>
                <span>{{ category.label }}</span>
              </div>
              <div class="item-actions">
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
              <InputText v-model="newStatus" placeholder="สถานะใหม่" class="flex-1" />
              <Dropdown v-model="newStatusIcon" :options="statusIcons" 
                        optionLabel="label" optionValue="value" placeholder="เลือก Icon" 
                        class="icon-dropdown">
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="icon-display">
                    <span v-if="slotProps.value.startsWith('emoji:')" class="emoji">{{ slotProps.value.replace('emoji:', '') }}</span>
                    <i v-else :class="slotProps.value"></i>
                  </div>
                  <span v-else>Icon</span>
                </template>
                <template #option="slotProps">
                  <div class="icon-option">
                    <span v-if="slotProps.option.value.startsWith('emoji:')" class="emoji">{{ slotProps.option.value.replace('emoji:', '') }}</span>
                    <i v-else :class="slotProps.option.value"></i>
                  </div>
                </template>
              </Dropdown>
              <Button icon="pi pi-plus" @click="addStatus" :disabled="!newStatus.trim() || !newStatusIcon" />
            </div>
          </div>
        </div>
        
        <div class="list-section">
          <h4>สถานะที่มีอยู่</h4>
          <div class="status-list">
            <div v-for="(status, index) in workStatuses" :key="status.value" 
                 class="status-item">
              <div class="status-info">
                <span v-if="status.icon && status.icon.startsWith('emoji:')" class="emoji">{{ status.icon.replace('emoji:', '') }}</span>
                <i v-else :class="status.icon || 'pi pi-flag'"></i>
                <span>{{ status.label }}</span>
              </div>
              <div class="item-actions">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

// Data
const showCategoriesDialog = ref(false)
const showStatusDialog = ref(false)
const newCategory = ref('')
const newStatus = ref('')
const newCategoryIcon = ref('')
const newStatusIcon = ref('')

// Icon Options
const categoryIcons = ref([
  { label: '💼', value: 'emoji:💼' },
  { label: '💻', value: 'emoji:💻' },
  { label: '🔧', value: 'emoji:🔧' },
  { label: '👥', value: 'emoji:👥' },
  { label: '📚', value: 'emoji:📚' },
  { label: '🔍', value: 'emoji:🔍' },
  { label: '📝', value: 'emoji:📝' },
  { label: '👤', value: 'emoji:👤' },
  { label: '💰', value: 'emoji:💰' },
  { label: '📢', value: 'emoji:📢' },
  { label: '🏠', value: 'emoji:🏠' },
  { label: '🚗', value: 'emoji:🚗' },
  { label: '📱', value: 'emoji:📱' },
  { label: '🎯', value: 'emoji:🎯' },
  { label: '📊', value: 'emoji:📊' },
  { label: '🎨', value: 'emoji:🎨' },
  { label: '🔒', value: 'emoji:🔒' },
  { label: '🌐', value: 'emoji:🌐' },
  { label: '📈', value: 'emoji:📈' },
  { label: '🏆', value: 'emoji:🏆' }
])

const statusIcons = ref([
  { label: '⏳', value: 'emoji:⏳' },
  { label: '🔄', value: 'emoji:🔄' },
  { label: '✅', value: 'emoji:✅' },
  { label: '⏸️', value: 'emoji:⏸️' },
  { label: '❌', value: 'emoji:❌' },
  { label: '⚠️', value: 'emoji:⚠️' },
  { label: '📝', value: 'emoji:📝' },
  { label: '🚀', value: 'emoji:🚀' },
  { label: '🎯', value: 'emoji:🎯' },
  { label: '💡', value: 'emoji:💡' },
  { label: '🔥', value: 'emoji:🔥' },
  { label: '⚡', value: 'emoji:⚡' },
  { label: '🌟', value: 'emoji:🌟' },
  { label: '🎉', value: 'emoji:🎉' },
  { label: '🏁', value: 'emoji:🏁' },
  { label: '🔔', value: 'emoji:🔔' },
  { label: '📌', value: 'emoji:📌' },
  { label: '💤', value: 'emoji:💤' },
  { label: '🤔', value: 'emoji:🤔' },
  { label: '🔒', value: 'emoji:🔒' }
])

// Categories and Status
const categories = ref([
  { label: 'งานทั่วไป', value: 'งานทั่วไป', icon: 'emoji:💼' },
  { label: 'งานพัฒนา', value: 'งานพัฒนา', icon: 'emoji:💻' },
  { label: 'งานบำรุงรักษา', value: 'งานบำรุงรักษา', icon: 'emoji:🔧' }
])

const workStatuses = ref([
  { label: 'รอดำเนินการ', value: 'pending', icon: 'emoji:⏳' },
  { label: 'กำลังดำเนินการ', value: 'in_progress', icon: 'emoji:🔄' },
  { label: 'เสร็จสิ้น', value: 'completed', icon: 'emoji:✅' },
  { label: 'ระงับ', value: 'on_hold', icon: 'emoji:⏸️' }
])

// Methods
const addCategory = () => {
  if (newCategory.value.trim() && newCategoryIcon.value) {
    categories.value.push({
      label: newCategory.value.trim(),
      value: newCategory.value.trim(),
      icon: newCategoryIcon.value
    })
    newCategory.value = ''
    newCategoryIcon.value = ''
    saveCategoriesToStorage()
    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: 'เพิ่มหมวดหมู่เรียบร้อย',
      life: 3000
    })
  }
}

const removeCategory = (categoryValue) => {
  categories.value = categories.value.filter(cat => cat.value !== categoryValue)
  saveCategoriesToStorage()
  toast.add({
    severity: 'success',
    summary: 'สำเร็จ',
    detail: 'ลบหมวดหมู่เรียบร้อย',
    life: 3000
  })
}

const moveCategoryUp = (index) => {
  if (index > 0) {
    const temp = categories.value[index]
    categories.value[index] = categories.value[index - 1]
    categories.value[index - 1] = temp
    saveCategoriesToStorage()
  }
}

const moveCategoryDown = (index) => {
  if (index < categories.value.length - 1) {
    const temp = categories.value[index]
    categories.value[index] = categories.value[index + 1]
    categories.value[index + 1] = temp
    saveCategoriesToStorage()
  }
}

const addStatus = () => {
  if (newStatus.value.trim() && newStatusIcon.value) {
    workStatuses.value.push({
      label: newStatus.value.trim(),
      value: newStatus.value.trim().toLowerCase().replace(/\s+/g, '_'),
      icon: newStatusIcon.value
    })
    newStatus.value = ''
    newStatusIcon.value = ''
    saveStatusesToStorage()
    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: 'เพิ่มสถานะเรียบร้อย',
      life: 3000
    })
  }
}

const removeStatus = (statusValue) => {
  workStatuses.value = workStatuses.value.filter(status => status.value !== statusValue)
  saveStatusesToStorage()
  toast.add({
    severity: 'success',
    summary: 'สำเร็จ',
    detail: 'ลบสถานะเรียบร้อย',
    life: 3000
  })
}

const moveStatusUp = (index) => {
  if (index > 0) {
    const temp = workStatuses.value[index]
    workStatuses.value[index] = workStatuses.value[index - 1]
    workStatuses.value[index - 1] = temp
    saveStatusesToStorage()
  }
}

const moveStatusDown = (index) => {
  if (index < workStatuses.value.length - 1) {
    const temp = workStatuses.value[index]
    workStatuses.value[index] = workStatuses.value[index + 1]
    workStatuses.value[index + 1] = temp
    saveStatusesToStorage()
  }
}

const closeCategoryDialog = () => {
  showCategoriesDialog.value = false
  newCategory.value = ''
  newCategoryIcon.value = ''
}

const closeStatusDialog = () => {
  showStatusDialog.value = false
  newStatus.value = ''
  newStatusIcon.value = ''
}

const saveCategoriesToStorage = () => {
  localStorage.setItem('task_categories', JSON.stringify(categories.value))
  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent('categoriesUpdated', { 
    detail: categories.value 
  }))
}

const saveStatusesToStorage = () => {
  localStorage.setItem('work_statuses', JSON.stringify(workStatuses.value))
  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent('statusesUpdated', { 
    detail: workStatuses.value 
  }))
}

const loadFromStorage = () => {
  const savedCategories = localStorage.getItem('task_categories')
  const savedStatuses = localStorage.getItem('work_statuses')
  
  if (savedCategories) {
    categories.value = JSON.parse(savedCategories)
  }
  
  if (savedStatuses) {
    workStatuses.value = JSON.parse(savedStatuses)
  }
}

onMounted(() => {
  loadFromStorage()
})
</script>

<style scoped>
.task-management {
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
</style>
