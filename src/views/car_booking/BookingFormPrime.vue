<template>
  <Dialog :visible="showForm" modal :header="getFormTitle()" :style="{ width: '700px' }"
    @update:visible="handleDialogClose" :closable="true" :draggable="false" class="corporate-dialog">
    <div class="p-fluid dialog-content">
      <!-- แจ้งใช้รถ -->
      <form v-if="activeForm === 'borrow'" @submit.prevent="confirmSubmit('borrow')" class="form-container">
        <div class="form-grid">
          <div class="input-group">
            <label for="name" class="input-label">ชื่อ-นามสกุล</label>
            <InputText id="name" :value="currentUserName" readonly class="corporate-input readonly-field" />
          </div>

          <div class="input-group">
            <label for="license" class="input-label">ทะเบียนรถ</label>
            <InputText id="license" :value="borrowForm.license" readonly class="corporate-input readonly-field" />
          </div>

          <div class="input-group">
            <label for="time" class="input-label">เวลา *</label>
            <InputText id="time" :value="borrowForm.time" @input="updateBorrowForm('time', $event.target.value)"
              type="time" required class="corporate-input" />
          </div>

          <div class="input-group">
            <label for="location" class="input-label">สถานที่ *</label>
            <InputText id="location" :value="borrowForm.location"
              @input="updateBorrowForm('location', $event.target.value)" required class="corporate-input" />
          </div>

          <div class="input-group">
            <label for="project" class="input-label">โครงการ *</label>
            <Dropdown id="project" v-model="selectedProject" :options="projectOptions" 
              optionLabel="label" optionValue="value" placeholder="เลือกโครงการ"
              required class="corporate-input" filter />
          </div>



          <div class="input-group">
            <label for="description" class="input-label">ข้อมูลเพิ่มเติม</label>
            <Textarea 
              id="description" 
              :value="borrowForm.discription" 
              @input="$emit('update-borrow-form', { field: 'discription', value: $event.target.value })"
              placeholder="ระบุข้อมูลเพิ่มเติม (ถ้ามี)"
              rows="3"
              class="corporate-input"
            />
          </div>

          <div class="input-group full-width">
            <label class="input-label">ผู้ร่วมงาน</label>
            <div class="colleagues-section">
              <div class="colleague-search">
                <AutoComplete v-model="selectedColleague" :suggestions="filteredUsers" @complete="searchUsers"
                  @item-select="onColleagueSelect" @dropdown-click="showAllUsers" optionLabel="displayName"
                  placeholder="ค้นหาหรือเลือกผู้ร่วมงาน..." class="corporate-input" :dropdown="true"
                  :forceSelection="false" :scrollHeight="200">
                  <template #option="slotProps">
                    <div class="user-option">
                      <div class="user-name">{{ slotProps.option.displayName }}</div>
                      <div class="user-role">{{ slotProps.option.position }} - {{ slotProps.option.department }}</div>
                    </div>
                  </template>
                </AutoComplete>
              </div>

              <div v-if="borrowForm.colleagues && borrowForm.colleagues.length > 0" class="selected-colleagues">
                <h6 class="colleagues-title">ผู้ร่วมงานที่เลือก:</h6>
                <div class="colleagues-list">
                  <div v-for="(colleague, index) in borrowForm.colleagues" :key="index" class="colleague-card">
                    <div class="colleague-details">
                      <div class="colleague-name">{{ colleague.name }}</div>
                      <div class="colleague-position">
                        <i class="pi pi-briefcase"></i>
                        {{ colleague.position }}
                      </div>
                      <div class="colleague-department">
                        <i class="pi pi-building"></i>
                        {{ colleague.department }}
                      </div>
                    </div>
                    <Button type="button" icon="pi pi-times" severity="danger" text rounded size="small"
                      @click="removeColleague(index)" class="remove-btn" />
                  </div>
                </div>
              </div>

              <div v-else class="no-colleagues">
                <i class="pi pi-users"></i>
                <span>ยังไม่มีผู้ร่วมงาน</span>
              </div>
            </div>
          </div>

          <div class="file-upload-section">
            <label class="upload-label">รูปภาพ</label>
            <div class="file-upload-wrapper">
              <input ref="borrowFileInput" @change="$emit('handle-image-upload', $event, 'borrow')" type="file"
                accept="image/*" multiple class="file-input" id="borrowImages">
              <Button type="button"
                :label="borrowForm.images?.length > 0 ? `เลือกแล้ว ${borrowForm.images.length} รูป` : 'เลือกรูปภาพ'"
                icon="pi pi-upload" severity="secondary" outlined @click="$refs.borrowFileInput.click()" />
            </div>
          </div>
        </div>

        <Divider />

        <div class="form-actions">
          <Button type="button" label="ยกเลิก" icon="pi pi-times" severity="secondary" outlined
            @click="handleDialogClose" />
          <Button type="submit" label="บันทึกการแจ้งใช้รถ" icon="pi pi-check" severity="success" />
        </div>
      </form>

      <!-- แจ้งคืนรถ -->
      <form v-if="activeForm === 'return'" @submit.prevent="confirmSubmit('return')" class="form-container">
        <div class="form-grid">
          <div class="input-group full-width">
            <label class="input-label">เลือกการแจ้งใช้รถที่ต้องการคืน *</label>
            <Dropdown v-model="selectedReturnBorrow" :options="formattedAvailableBorrows" optionLabel="displayText"
              optionValue="id" class="corporate-dropdown" />
          </div>

          <div class="input-group">
            <label for="returnName" class="input-label">ชื่อ-นามสกุล</label>
            <InputText id="returnName" :value="currentUserName" readonly class="corporate-input readonly-field" />
          </div>

          <div class="input-group">
            <label for="returnLicense" class="input-label">ทะเบียนรถ</label>
            <InputText id="returnLicense" :value="returnForm.license" readonly class="corporate-input readonly-field" />
          </div>

          <div class="input-group">
            <label for="returnTime" class="input-label">เวลาคืนรถ</label>
            <InputText id="returnTime" :value="currentReturnTime" readonly class="corporate-input readonly-field" />
          </div>

          <div class="input-group">
            <label for="returnLocation" class="input-label">สถานที่คืนรถ *</label>
            <InputText id="returnLocation" :value="returnForm.location"
              @input="$emit('updateReturnForm', 'location', $event.target.value)" required class="corporate-input" />
          </div>

          <div class="input-group">
            <label for="returnDescription" class="input-label">ข้อมูลเพิ่มเติม</label>
            <Textarea 
              id="returnDescription" 
              :value="returnForm.discription || selectedBorrowDescription" 
              @input="$emit('updateReturnForm', 'discription', $event.target.value)"
              :disabled="!selectedReturnBorrow"
              placeholder="กรุณาเลือกการแจ้งใช้รถที่ต้องการคืนก่อน"
              rows="3"
              class="corporate-input"
            />
          </div>

          <div class="input-group">
            <label for="returnProject" class="input-label">โครงการ</label>
            <InputText id="returnProject" :value="selectedBorrowProject" readonly
              class="corporate-input readonly-field" />
          </div>

          <div class="file-upload-section">
            <label class="upload-label">รูปภาพ</label>
            <div class="file-upload-wrapper">
              <input ref="returnFileInput" @change="$emit('handle-image-upload', $event, 'return')" type="file"
                accept="image/*" multiple class="file-input" id="returnImages">
              <Button type="button"
                :label="returnForm.images?.length > 0 ? `เลือกแล้ว ${returnForm.images.length} รูป` : 'เลือกรูปภาพ'"
                icon="pi pi-upload" severity="secondary" outlined @click="$refs.returnFileInput.click()" />
            </div>
          </div>
        </div>

        <Divider />

        <div class="form-actions">
          <Button type="button" label="ยกเลิก" icon="pi pi-times" severity="secondary" outlined
            @click="handleDialogClose" />
          <Button type="submit" label="บันทึกการแจ้งคืนรถ" icon="pi pi-check" severity="success" />
        </div>
      </form>

      <!-- ยกเลิกการจอง -->
      <form v-if="activeForm === 'cancel'" @submit.prevent="confirmSubmit('cancel')" class="form-container">
        <div class="form-grid">
          <div class="input-group full-width">
            <label class="input-label">เลือกการจองที่ต้องการยกเลิก *</label>
            <Dropdown v-model="selectedCancelBorrow" :options="formattedPendingBorrows" optionLabel="displayText"
              optionValue="id" class="corporate-dropdown" />
          </div>
        </div>

        <Divider />

        <div class="form-actions">
          <Button type="button" label="ยกเลิก" icon="pi pi-times" severity="secondary" outlined
            @click="handleDialogClose" />
          <Button type="submit" label="ยืนยันการยกเลิก" icon="pi pi-trash" severity="danger" />
        </div>
      </form>
    </div>
  </Dialog>

  <!-- Confirmation Dialog -->
  <Dialog :visible="showConfirm" modal header="ยืนยันการดำเนินการ" :style="{ width: '450px' }" :closable="false"
    :draggable="false" class="confirm-dialog">
    <div class="confirm-content">
      <div class="confirm-icon">
        <i class="pi pi-question-circle"></i>
      </div>
      <p class="confirm-message">{{ confirmMessage }}</p>
      <div class="confirm-buttons">
        <Button @click="handleConfirm" label="ยืนยัน" icon="pi pi-check" severity="success" />
        <Button @click="showConfirm = false" label="ยกเลิก" icon="pi pi-times" severity="secondary" outlined />
      </div>
    </div>
  </Dialog>
</template>

<script>
import AutoComplete from 'primevue/autocomplete'
import Dropdown from 'primevue/dropdown'
import axios from '@/utils/axiosConfig'
import { isActive } from '@/utils/statusHelper'

export default {
  name: 'BookingFormPrime',
  components: {
    AutoComplete,
    Dropdown
  },
  emits: ['close-form', 'submit-borrow', 'submit-return', 'submit-cancel', 'handle-image-upload', 'update-borrow-form', 'updateReturnForm', 'update-cancel-form'],
  props: {
    showForm: Boolean,
    selectedDate: Date,
    activeForm: String,
    borrowForm: Object,
    returnForm: Object,
    cancelForm: Object,
    availableBorrows: Array,
    pendingBorrows: Array,
    currentReturnTime: String,
    selectedBorrowProject: String,
    selectedBorrowDescription: String
  },
  data() {
    return {
      selectedReturnBorrow: '',
      selectedCancelBorrow: '',
      showConfirm: false,
      confirmMessage: '',
      pendingAction: null,
      users: [],
      filteredUsers: [],
      maxDisplayUsers: 50,
      selectedColleague: null,
      projectOptions: []
    }
  },
  async created() {
    this.$http = axios.create({
      baseURL: process.env.VUE_APP_API_URL || ''
    });
    await this.loadUsers();
    await this.loadProjects();
    this.filteredUsers = this.users.slice(0, this.maxDisplayUsers);
  },
  computed: {
    currentUserName() {
      const firstName = localStorage.getItem('soc_firstname') || ''
      const lastName = localStorage.getItem('soc_lastname') || ''
      return `${firstName} ${lastName}`.trim()
    },
    formattedAvailableBorrows() {
      return this.availableBorrows.map(borrow => ({
        id: borrow.id,
        displayText: `${borrow.id} - ${borrow.name} (${borrow.project}) - ${this.formatDate(borrow.selected_date)} ${borrow.time}`
      }))
    },
    formattedPendingBorrows() {
      return this.pendingBorrows.map(borrow => ({
        id: borrow.id,
        displayText: `${borrow.id} - ${borrow.name} (${borrow.project}) - ${this.formatDate(borrow.selected_date)} ${borrow.time}`
      }))
    },
    selectedProject: {
      get() {
        return this.borrowForm.project
      },
      set(value) {
        this.$emit('update-borrow-form', { field: 'project', value })
      }
    }
  },
  watch: {
    selectedReturnBorrow(newVal) {
      this.$emit('updateReturnForm', 'borrowId', newVal)
      if (newVal && this.selectedBorrowDescription) {
        this.$emit('updateReturnForm', 'discription', this.selectedBorrowDescription)
      }
    },
    selectedCancelBorrow(newVal) {
      this.$emit('update-cancel-form', { field: 'borrowId', value: newVal })
    }
  },
  methods: {
    async loadProjects() {
      try {
        const response = await this.$http.get('/api/tasks')
        if (response.data && Array.isArray(response.data)) {
          this.projectOptions = response.data
            .filter(task => isActive(task.status))
            .map(task => ({
              label: task.task_name,
              value: task.task_name
            }))
        }
      } catch (error) {
        console.error(error)
      }
    },
    async loadUsers() {
      try {
        const response = await this.$http.get('/api/users')
        if (response.data && Array.isArray(response.data)) {
          // กรองผู้ใช้ปัจจุบันออก
          const currentUserName = this.currentUserName
          this.users = response.data
            .filter(user => {
              const userName = `${user.firstname} ${user.lastname}`.trim()
              return userName !== currentUserName
            })
            .map(user => ({
              ...user,
              displayName: `${user.firstname} ${user.lastname}`.trim()
            }))
          this.filteredUsers = this.users.slice(0, this.maxDisplayUsers)
        }
      } catch (error) {
        console.error(error)
      }
    },

    searchUsers(event) {
      const query = event.query.toLowerCase().trim()

      // Get already selected colleagues
      const selectedColleagues = this.borrowForm?.colleagues || []
      const selectedNames = selectedColleagues.map(c => c.name)

      // Filter out already selected colleagues
      let availableUsers = this.users.filter(user =>
        !selectedNames.includes(user.displayName)
      )

      if (query === '') {
        this.filteredUsers = availableUsers.slice(0, this.maxDisplayUsers)
      } else {
        const filtered = availableUsers.filter(user =>
          user.displayName.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query) ||
          (user.position && user.position.toLowerCase().includes(query)) ||
          (user.department && user.department.toLowerCase().includes(query))
        )
        this.filteredUsers = filtered.slice(0, this.maxDisplayUsers)
      }
    },

    showAllUsers() {
      // Get already selected colleagues
      const selectedColleagues = this.borrowForm?.colleagues || []
      const selectedNames = selectedColleagues.map(c => c.name)

      // Filter out already selected colleagues
      const availableUsers = this.users.filter(user =>
        !selectedNames.includes(user.displayName)
      )

      this.filteredUsers = availableUsers.slice(0, this.maxDisplayUsers)
    },

    onColleagueSelect(event) {
      const user = event.value
      if (user && user.displayName) {
        // ตรวจสอบว่าไม่ได้เลือกซ้ำ
        const colleagues = this.borrowForm?.colleagues || []
        const alreadySelected = colleagues.some(c => c.name === user.displayName)

        if (!alreadySelected) {
          const newColleagues = [...colleagues, {
            name: user.displayName,
            position: user.position || '',
            department: user.department || ''
          }]
          this.$emit('update-borrow-form', { field: 'colleagues', value: newColleagues })
        }

        // Clear selection
        this.selectedColleague = null
      }
    },

    removeColleague(index) {
      const colleagues = [...(this.borrowForm?.colleagues || [])]
      colleagues.splice(index, 1)
      this.$emit('update-borrow-form', { field: 'colleagues', value: colleagues })
    },

    getFormTitle() {
      const titles = {
        borrow: 'แจ้งใช้รถ',
        return: 'แจ้งคืนรถ',
        cancel: 'ยกเลิกการจอง'
      }
      return titles[this.activeForm] || 'ฟอร์ม'
    },
    handleDialogClose() {
      this.$emit('close-form')
    },
    confirmSubmit(type) {
      const messages = {
        borrow: 'ยืนยันการแจ้งใช้รถ?',
        return: 'ยืนยันการแจ้งคืนรถ?',
        cancel: 'ยืนยันการยกเลิกการจอง?'
      }

      this.confirmMessage = messages[type]
      this.pendingAction = type
      this.showConfirm = true
    },
    handleConfirm() {
      this.showConfirm = false

      if (this.pendingAction === 'borrow') {
        this.$emit('submit-borrow')
      } else if (this.pendingAction === 'return') {
        this.$emit('submit-return')
      } else if (this.pendingAction === 'cancel') {
        this.$emit('submit-cancel')
      }

      this.pendingAction = null
    },
    updateBorrowForm(field, value) {
      this.$emit('update-borrow-form', { field, value })
    },
    updateReturnForm(field, value) {
      this.$emit('update-return-form', { field, value })
    },
    updateCancelForm(field, value) {
      this.$emit('update-cancel-form', { field, value })
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.colleagues-section {
  margin-top: 0.5rem;
}

.colleague-search {
  margin-bottom: 1rem;
}

.colleagues-title {
  margin: 1rem 0 0.5rem 0;
  color: #495057;
  font-weight: 600;
}

.colleagues-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.colleague-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.2s ease;
}

.colleague-card:hover {
  border-color: #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.colleague-details {
  flex: 1;
}

.colleague-name {
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.25rem;
}

.colleague-position,
.colleague-department {
  font-size: 0.875rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.125rem;
}

.colleague-position i,
.colleague-department i {
  font-size: 0.75rem;
}

.remove-btn {
  margin-left: 0.5rem;
}

.no-colleagues {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

.no-colleagues i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: block;
}

.user-option {
  padding: 0.5rem;
}

.user-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.user-role {
  font-size: 0.875rem;
  color: #6c757d;
}
</style>

<style scoped>
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-weight: 500;
  color: #495057;
  font-size: 0.9rem;
}

.corporate-dialog {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.corporate-dialog :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
  padding: 1.5rem;
}

.corporate-dialog :deep(.p-dialog-title) {
  font-weight: 600;
  font-size: 1.25rem;
}

.dialog-content {
  padding: 2rem;
  background: #fafafa;
}

.form-container {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.full-width {
  grid-column: 1 / -1;
}

.corporate-input,
.corporate-dropdown {
  border: 2px solid #e9ecef;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.corporate-input:focus,
.corporate-dropdown:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.readonly-field {
  background: #f8f9fa;
  color: #6c757d;
}

.file-upload-section {
  grid-column: 1 / -1;
}

.upload-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.file-input {
  display: none;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.form-actions .p-button {
  min-width: 140px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
}

/* Confirmation Dialog */
.confirm-dialog :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
  padding: 1.5rem;
}

.confirm-content {
  text-align: center;
  padding: 2rem;
}

.confirm-icon {
  margin-bottom: 1rem;
}

.confirm-icon i {
  font-size: 3rem;
  color: #667eea;
}

.confirm-message {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  color: #495057;
}

.confirm-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.confirm-buttons .p-button {
  min-width: 120px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .corporate-dialog {
    width: 95vw !important;
    max-width: none !important;
  }

  .dialog-content {
    padding: 1rem;
  }

  .form-container {
    padding: 1rem;
  }

  .confirm-content {
    padding: 1.5rem;
  }

  .confirm-buttons {
    flex-direction: column;
  }
}
</style>
