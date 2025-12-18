<template>
  <Card class="form-card">
    <template #content>
      <form @submit.prevent="submitForm" class="add-task-form">
        <div class="form-grid">
          <div class="input-group">
            <label for="taskName" class="input-label">ชื่องาน / โครงการ *</label>
            <InputText id="taskName" v-model="formData.taskName" required class="corporate-input" />
          </div>

          <div class="input-group">
            <label for="soNumber" class="input-label">เลข SO (Project)</label>
            <InputText id="soNumber" v-model="formData.soNumber" class="corporate-input" />
          </div>

          <div class="input-group">
            <label for="contractNumber" class="input-label">เลขที่สัญญา</label>
            <InputText id="contractNumber" v-model="formData.contractNumber" class="corporate-input" />
          </div>

          <div class="input-group">
            <label for="saleOwner" class="input-label">Sale เจ้าของงาน</label>
            <InputText id="saleOwner" v-model="formData.saleOwner" class="corporate-input" />
          </div>

          <div class="input-group">
            <label for="projectStartDate" class="input-label">เวลาเริ่มโครงการ</label>
            <Calendar id="projectStartDate" v-model="formData.projectStartDate" dateFormat="dd/mm/yy" class="corporate-input" />
          </div>

          <div class="input-group">
            <label for="projectEndDate" class="input-label">สิ้นสุดโครงการ</label>
            <Calendar id="projectEndDate" v-model="formData.projectEndDate" dateFormat="dd/mm/yy" 
                      :minDate="formData.projectStartDate" class="corporate-input" />
          </div>

          <div class="input-group">
            <label for="category" class="input-label">หมวดหมู่งาน *</label>
            <Dropdown id="category" v-model="formData.category" :options="categoryOptions" 
                      optionLabel="label" optionValue="value" placeholder="เลือกหมวดหมู่งาน" 
                      class="corporate-input category-dropdown" required>
              <template #value="slotProps">
                <span v-if="slotProps.value">{{ getCategoryLabel(slotProps.value) }}</span>
                <span v-else>เลือกหมวดหมู่งาน</span>
              </template>
              <template #option="slotProps">
                <span>{{ slotProps.option.label }}</span>
              </template>
            </Dropdown>
          </div>

          <div class="input-group full-width">
            <label for="description" class="input-label">รายละเอียดงาน</label>
            <Textarea id="description" v-model="formData.description" rows="3" class="corporate-input" />
          </div>

          <div class="input-group full-width">
            <label class="input-label">แนบไฟล์ (รูปภาพ, เอกสาร)</label>
            <div class="file-upload-wrapper">
              <input ref="fileInput" @change="handleFileUpload" type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple class="file-input" id="fileUpload">
              <Button type="button"
                :label="formData.files?.length > 0 ? `เลือกแล้ว ${formData.files.length} ไฟล์` : 'เลือกไฟล์'"
                icon="pi pi-upload" severity="secondary" outlined @click="$refs.fileInput.click()" />
            </div>
            <div v-if="formData.files?.length > 0" class="file-list">
              <div v-for="(file, index) in formData.files" :key="index" class="file-item">
                <i class="pi pi-file"></i>
                <span class="file-name">{{ file.name }}</span>
                <Button icon="pi pi-times" size="small" severity="danger" text @click="removeFile(index)" />
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <Button type="button" label="ล้างข้อมูล" icon="pi pi-refresh" severity="secondary" outlined @click="resetForm" />
          <Button type="submit" label="เพิ่มงาน" icon="pi pi-plus" severity="success" />
        </div>
      </form>
    </template>
  </Card>
</template>

<script>
import axios from '@/utils/axiosConfig'

export default {
  name: 'AddTaskForm',
  created() {
    this.$http = axios.create({
      baseURL: ''
    })
  },
  data() {
    return {
      formData: {
        taskName: '',
        soNumber: '',
        contractNumber: '',
        saleOwner: '',
        projectStartDate: null,
        projectEndDate: null,
        description: '',
        category: '',
        files: []
      },
      categoryOptions: []
    }
  },
  mounted() {
    this.loadCategories()
  },
  methods: {
    loadCategories() {
      this.$http.get('/api/settings/categories')
        .then(response => {
          this.categoryOptions = response.data
          // Set default to first category
          if (this.categoryOptions.length > 0 && !this.formData.category) {
            this.formData.category = this.categoryOptions[0].value
          }
        })
        .catch(error => {
          console.error(error)
          // Fallback to default
          this.categoryOptions = [
            { label: '💼 งานทั่วไป', value: 'งานทั่วไป', icon: 'emoji:💼' },
            { label: '💻 งานพัฒนาระบบ', value: 'งานพัฒนาระบบ', icon: 'emoji:💻' },
            { label: '🔧 งานบำรุงรักษา', value: 'งานบำรุงรักษา', icon: 'emoji:🔧' }
          ]
          if (this.categoryOptions.length > 0 && !this.formData.category) {
            this.formData.category = this.categoryOptions[0].value
          }
        })
    },
    getDefaultIcon(value) {
      const iconMap = {
        'งานทั่วไป': 'pi pi-briefcase',
        'งานพัฒนาระบบ': 'pi pi-code',
        'งานบำรุงรักษา': 'pi pi-wrench',
        'งานประชุม': 'pi pi-users',
        'งานฝึกอบรม': 'pi pi-book',
        'งานวิจัย': 'pi pi-search',
        'งานเอกสาร': 'pi pi-file-edit',
        'งานลูกค้า': 'pi pi-user-plus'
      }
      return iconMap[value] || 'pi pi-briefcase'
    },
    getCategoryIcon(value) {
      const category = this.categoryOptions.find(cat => cat.value === value)
      return category ? category.icon : 'pi pi-briefcase'
    },
    getCategoryLabel(value) {
      const category = this.categoryOptions.find(cat => cat.value === value)
      return category ? category.label : value
    },
    handleFileUpload(event) {
      const files = Array.from(event.target.files)
      this.formData.files = [...this.formData.files, ...files]
    },
    removeFile(index) {
      this.formData.files.splice(index, 1)
    },
    async uploadFiles() {
      if (this.formData.files.length === 0) return []
      
      const formData = new FormData()
      this.formData.files.forEach(file => {
        formData.append('files', file)
      })
      
      try {
        const response = await this.$http.post('/api/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data.files || []
      } catch (error) {
        return []
      }
    },
    async submitForm() {
      try {
        const uploadedFiles = await this.uploadFiles()
        
        // Format dates to YYYY-MM-DD (local date only, no time)
        const formatDate = (date) => {
          if (!date) return null
          const d = new Date(date)
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        
        const taskData = {
          task_name: this.formData.taskName,
          so_number: this.formData.soNumber,
          contract_number: this.formData.contractNumber,
          sale_owner: this.formData.saleOwner,
          project_start_date: formatDate(this.formData.projectStartDate),
          project_end_date: formatDate(this.formData.projectEndDate),
          description: this.formData.description,
          category: this.formData.category,
          files: uploadedFiles
        }

        await this.$http.post('/api/tasks', taskData)
        
        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'เพิ่มงานใหม่เรียบร้อยแล้ว',
          life: 3000
        })

        // Emit to parent component
        this.$emit('task-added')
        
        // Dispatch global event for real-time update
        window.dispatchEvent(new CustomEvent('taskUpdated'))
        
        this.resetForm()
      } catch (error) {
        
        const errorMessage = error.response?.data?.error || error.message || 'ไม่สามารถเพิ่มงานได้'
        
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: errorMessage,
          life: 5000
        })
      }
    },
    resetForm() {
      this.formData = {
        taskName: '',
        soNumber: '',
        contractNumber: '',
        saleOwner: '',
        projectStartDate: null,
        projectEndDate: null,
        description: '',
        category: this.categoryOptions.length > 0 ? this.categoryOptions[0].value : '',
        files: []
      }
      const fileInput = document.getElementById('fileUpload')
      if (fileInput) fileInput.value = ''
    }
  }
}
</script>

<style scoped>
.category-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.emoji {
  font-size: 1.2rem;
}

.form-card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.add-task-form {
  padding: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.full-width {
  grid-column: 1 / -1;
}

.input-label {
  font-weight: 500;
  color: #495057;
  font-size: 0.9rem;
}

.corporate-input {
  border: 2px solid #e9ecef;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.corporate-input:focus {
  border-color: #28a745;
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
  outline: none;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 2px solid #e9ecef;
}

.form-actions .p-button {
  min-width: 120px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
}

.file-upload-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-input {
  display: none;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.file-item i {
  color: #6c757d;
  font-size: 1rem;
}

.file-name {
  flex: 1;
  font-size: 0.9rem;
  color: #495057;
  word-break: break-all;
}

@media (max-width: 768px) {
  .add-task-form {
    padding: 0.75rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .p-button {
    width: 100%;
  }
}

.category-dropdown :deep(.p-dropdown-panel) {
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.category-item i {
  font-size: 1rem;
  width: 20px;
  text-align: center;
  color: #495057;
}

.category-dropdown :deep(.p-dropdown-item) {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin: 2px;
}

.category-dropdown :deep(.p-dropdown-item:hover) {
  background: #f8f9fa;
}
</style>
