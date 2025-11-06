<template>
  <div>
    <Toast />
    <Card class="form-card">
    <template #content>
      <form @submit.prevent="submitForm" class="leave-form">
        <div class="form-grid">
          <div class="input-group">
            <label for="name" class="input-label">ชื่อ-นามสกุล</label>
            <InputText id="name" :value="currentUserName" readonly class="corporate-input readonly-field" />
          </div>

          <div class="input-group">
            <label for="position" class="input-label">ตำแหน่ง</label>
            <InputText id="position" :value="currentUserPosition" readonly class="corporate-input readonly-field" />
          </div>

          <div class="input-group">
            <label for="leaveType" class="input-label">ประเภทการลา *</label>
            <Dropdown v-model="formData.leaveType" :options="leaveTypesWithQuota" optionLabel="label" optionValue="value"
              :optionDisabled="optionDisabled" class="corporate-dropdown" required @change="onLeaveTypeChange">
              <template #option="slotProps">
                <div class="leave-type-option" :class="{ 'disabled-option': slotProps.option.disabled }">
                  <span>{{ slotProps.option.label }}</span>
                  <span v-if="slotProps.option.disabled" class="quota-status">หมดโควต้า</span>
                </div>
              </template>
            </Dropdown>
          </div>

          <!-- Quota Display -->
          <div class="quota-display" :class="{ 'quota-placeholder': !selectedQuota }">
            <div v-if="selectedQuota" class="quota-info">
              <span class="quota-label">โควต้าคงเหลือ:</span>
              <span class="quota-value" :class="getQuotaClass(selectedQuota.remainingDays)">
                {{ selectedQuota.remainingDays }} วัน
              </span>
              <span class="quota-total">(จาก {{ selectedQuota.quota }} วัน)</span>
            </div>
            <div v-else class="quota-placeholder-text">
              เลือกประเภทการลาเพื่อดูโควต้า
            </div>
          </div>

          <div class="input-group date-range-group">
            <div class="date-field">
              <label for="startDateTime" class="input-label">วันเวลาเริ่มลา *</label>
              <Calendar v-model="formData.startDateTime" showTime hourFormat="24" dateFormat="dd/mm/yy"
                class="corporate-input" :manualInput="true" :stepHour="1" :stepMinute="1" required />
            </div>
            <div class="date-field">
              <label for="endDateTime" class="input-label">วันเวลาสิ้นสุดการลา *</label>
              <Calendar v-model="formData.endDateTime" showTime hourFormat="24" dateFormat="dd/mm/yy"
                :minDate="formData.startDateTime" class="corporate-input" :manualInput="true" :stepHour="1" :stepMinute="1" required />
            </div>
          </div>

          <div class="input-group">
            <label for="totalDays" class="input-label">จำนวนวันลา</label>
            <InputText id="totalDays" :value="calculateDays" readonly class="corporate-input readonly-field" />
          </div>

          <div class="input-group full-width">
            <label for="reason" class="input-label">เหตุผลการลา</label>
            <Textarea id="reason" v-model="formData.reason" rows="3" class="corporate-input" />
          </div>

          <div class="input-group full-width">
            <label class="input-label">แนบเอกสารประกอบ (Attachments)</label>
            <div class="file-upload-wrapper">
              <input ref="fileInput" @change="handleFileUpload" type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" multiple class="file-input" id="attachments">
              <Button type="button"
                :label="formData.attachments?.length > 0 ? `เลือกแล้ว ${formData.attachments.length} ไฟล์` : 'เลือกไฟล์'"
                icon="pi pi-upload" severity="secondary" outlined @click="$refs.fileInput.click()" />
            </div>
            <div v-if="formData.attachments?.length > 0" class="file-list">
              <div v-for="(file, index) in formData.attachments" :key="index" class="file-item">
                <i class="pi pi-file"></i>
                <span class="file-name">{{ file.name }}</span>
                <Button icon="pi pi-times" severity="danger" text size="small" @click="removeFile(index)" />
              </div>
            </div>
          </div>

          <div class="input-group">
            <label for="delegationOption" class="input-label">มอบหมายงานระหว่างลา *</label>
            <Dropdown v-model="formData.delegationOption" :options="delegationOptions" optionLabel="label"
              optionValue="value" class="corporate-dropdown" required />
          </div>

          <template v-if="formData.delegationOption === 'yes'">
            <div class="input-group">
              <label for="delegateUser" class="input-label">ชื่อผู้รับผิดชอบงานแทน *</label>
              <AutoComplete 
                v-model="selectedDelegate" 
                :suggestions="filteredUsers" 
                @complete="searchUsers" 
                @item-select="onDelegateSelect"
                @dropdown-click="showAllUsers"
                optionLabel="displayName" 
                placeholder="ค้นหาหรือเลือกพนักงาน..." 
                class="corporate-input"
                :dropdown="true"
                :forceSelection="true"
                :scrollHeight="200"
                required
              >
                <template #option="slotProps">
                  <div class="user-option">
                    <div class="user-name">{{ slotProps.option.displayName }}</div>
                    <div class="user-role">{{ slotProps.option.position }} - {{ slotProps.option.department }}</div>
                  </div>
                </template>
              </AutoComplete>
            </div>

            <div class="input-group">
              <label for="delegatePosition" class="input-label">ตำแหน่ง</label>
              <InputText 
                id="delegatePosition" 
                :value="formData.delegatePosition" 
                readonly 
                class="corporate-input readonly-field" 
              />
            </div>

            <div class="input-group">
              <label for="delegateDepartment" class="input-label">แผนก</label>
              <InputText 
                id="delegateDepartment" 
                :value="formData.delegateDepartment" 
                readonly 
                class="corporate-input readonly-field" 
              />
            </div>
            <div class="input-group full-width">
              <label for="delegateContact" class="input-label">ช่องทางติดต่อ *</label>
              <InputText id="delegateContact" v-model="formData.delegateContact"
                placeholder="เบอร์โทร, อีเมล, หรือช่องทางอื่นๆ" required class="corporate-input" />
            </div>

            <div class="input-group full-width">
              <label for="workDetails" class="input-label">รายละเอียดงานที่มอบหมาย *</label>
              <Textarea id="workDetails" v-model="formData.workDetails" rows="4" 
                placeholder="ระบุรายละเอียดงานที่ต้องดำเนินการระหว่างลา..." 
                required class="corporate-input" />
            </div>

          </template>
        </div>

        <Divider />

        <div class="form-actions">
          <Button type="button" label="ล้างข้อมูล" icon="pi pi-refresh" severity="secondary" outlined
            @click="resetForm" />
          <Button type="submit" label="ส่งคำขอลางาน" icon="pi pi-check" severity="success" />
        </div>
      </form>
    </template>
  </Card>
  </div>
</template>

<script>
import axios from 'axios'
import AutoComplete from 'primevue/autocomplete'

export default {
  name: 'LeaveForm',
  components: {
    AutoComplete
  },
  async created() {
    await this.loadUsers();
    await this.loadQuotaData();
    // Initialize with limited users
    this.filteredUsers = this.users.slice(0, this.maxDisplayUsers);
  },
  data() {
    return {
      formData: {
        leaveType: '',
        startDateTime: null,
        endDateTime: null,
        reason: '',
        delegationOption: 'no',
        delegateName: '',
        delegatePosition: '',
        delegateDepartment: '',
        delegateContact: '',
        workDetails: '',
        attachments: []
      },
      leaveTypes: [
        { label: 'ลาป่วย', value: 'sick' },
        { label: 'ลากิจ', value: 'personal' },
        { label: 'ลาพักร้อน', value: 'vacation' },
        { label: 'ลาคลอด', value: 'maternity' },
        { label: 'ลาอื่นๆ', value: 'other' }
      ],
      delegationOptions: [
        { label: 'ไม่มีการมอบหมายงาน', value: 'no' },
        { label: 'มีการมอบหมายงาน', value: 'yes' }
      ],
      users: [],
      filteredUsers: [],
      selectedDelegate: null,
      maxDisplayUsers: 50,
      quotaData: {},
      selectedQuota: null
    }
  },
  computed: {
    currentUserName() {
      const firstName = localStorage.getItem('soc_firstname') || ''
      const lastName = localStorage.getItem('soc_lastname') || ''
      return `${firstName} ${lastName}`.trim()
    },
    currentUserRole() {
      return localStorage.getItem('soc_role') || ''
    },
    currentUserPosition() {
      return localStorage.getItem('soc_position') || 'ไม่ระบุตำแหน่ง'
    },
    calculateDays() {
      if (this.formData.startDateTime && this.formData.endDateTime) {
        const start = new Date(this.formData.startDateTime)
        const end = new Date(this.formData.endDateTime)
        
        // Set time to start of day for accurate day calculation
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)
        
        const diffTime = end - start
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
        return diffDays + ' วัน'
      }
      return '0 วัน'
    },
    leaveTypesWithQuota() {
      return this.leaveTypes.map(type => {
        const quota = this.quotaData[type.value];
        const disabled = quota && quota.remainingDays <= 0;
        return {
          ...type,
          disabled: disabled
        };
      });
    }
  },
  methods: {
    optionDisabled(option) {
      return option.disabled;
    },

    async loadQuotaData() {
      try {
        const userId = localStorage.getItem('soc_user_id');
        const response = await axios.get(`/api/leave/quota/${userId}`);
        this.quotaData = response.data;
        
        // Update selected quota if leave type is already selected
        if (this.formData.leaveType) {
          this.selectedQuota = this.quotaData[this.formData.leaveType];
        }
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'ข้อผิดพลาด',
          detail: 'ไม่สามารถโหลดข้อมูลโควต้าได้',
          life: 3000
        });
      }
    },

    onLeaveTypeChange() {
      if (this.formData.leaveType && this.quotaData[this.formData.leaveType]) {
        this.selectedQuota = this.quotaData[this.formData.leaveType];
      } else {
        this.selectedQuota = null;
      }
    },

    getQuotaClass(remainingDays) {
      if (remainingDays <= 0) return 'quota-zero';
      if (remainingDays <= 2) return 'quota-low';
      return 'quota-normal';
    },

    async submitForm() {
      if (!this.formData.leaveType) {
        this.$toast.add({
          severity: 'error',
          summary: 'ข้อผิดพลาด',
          detail: 'กรุณาเลือกประเภทการลา',
          life: 3000
        })
        return
      }

      // Check quota before submitting
      if (this.selectedQuota && this.selectedQuota.remainingDays <= 0) {
        this.$toast.add({
          severity: 'error',
          summary: 'ข้อผิดพลาด',
          detail: 'โควต้าการลาประเภทนี้หมดแล้ว',
          life: 3000
        })
        return
      }

      // Check if requested days exceed remaining quota
      const requestedDays = this.calculateTotalDays();
      if (this.selectedQuota && requestedDays > this.selectedQuota.remainingDays) {
        this.$toast.add({
          severity: 'error',
          summary: 'ข้อผิดพลาด',
          detail: `จำนวนวันที่ขอลา (${requestedDays} วัน) เกินโควต้าคงเหลือ (${this.selectedQuota.remainingDays} วัน)`,
          life: 3000
        })
        return
      }

      if (this.formData.startDateTime && this.formData.endDateTime) {
        if (new Date(this.formData.endDateTime) < new Date(this.formData.startDateTime)) {
          this.$toast.add({
            severity: 'error',
            summary: 'ข้อผิดพลาด',
            detail: 'วันสิ้นสุดการลาต้องไม่เป็นวันก่อนวันเริ่มลา',
            life: 3000
          })
          return
        }
      }

      try {
        // Upload files first if any
        let uploadedFiles = []
        if (this.formData.attachments && this.formData.attachments.length > 0) {
          const formData = new FormData()
          this.formData.attachments.forEach(file => {
            formData.append('files', file)
          })
          
          const uploadResponse = await axios.post('/api/files/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          uploadedFiles = uploadResponse.data.files
        }

        // Calculate total days
        const totalDays = this.calculateTotalDays();
        
        // Prepare data for API
        const leaveData = {
          user_id: localStorage.getItem('soc_user_id'),
          leave_type: this.formData.leaveType,
          start_datetime: this.formatDateTime(this.formData.startDateTime),
          end_datetime: this.formatDateTime(this.formData.endDateTime),
          total_days: totalDays,
          reason: this.formData.reason || 'ไม่ระบุ',
          has_delegation: this.formData.delegationOption === 'yes',
          delegate_name: this.formData.delegateName || null,
          delegate_position: this.formData.delegatePosition || null,
          delegate_department: this.formData.delegateDepartment || null,
          delegate_contact: this.formData.delegateContact || null,
          work_details: this.formData.workDetails || null,
          attachments: uploadedFiles
        }

        // Send to backend
        const response = await axios.post('/api/leave', leaveData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('soc_token')}`
          }
        })
        
        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'บันทึกคำขอลางานเรียบร้อยแล้ว',
          life: 3000
        })

        this.$emit('submit-leave', response.data)
        this.resetForm()
        
      } catch (error) {
        
        let errorMessage = 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
        
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.message) {
          errorMessage = error.message
        }
        
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: errorMessage,
          life: 5000
        })
      }
    },
    calculateTotalDays() {
      if (this.formData.startDateTime && this.formData.endDateTime) {
        const start = new Date(this.formData.startDateTime)
        const end = new Date(this.formData.endDateTime)
        const diffTime = Math.abs(end - start)
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      }
      return 0
    },
    formatDateTime(date) {
      if (!date) return null
      return new Date(date).toISOString()
    },
    resetForm() {
      this.formData = {
        leaveType: '',
        startDateTime: null,
        endDateTime: null,
        reason: '',
        delegationOption: 'no',
        delegateName: '',
        delegatePosition: '',
        delegateDepartment: '',
        delegateContact: '',
        workDetails: '',
        attachments: []
      }
      this.selectedDelegate = null
    },
    handleFileUpload(event) {
      const files = Array.from(event.target.files)
      this.formData.attachments = [...this.formData.attachments, ...files]
    },
    removeFile(index) {
      this.formData.attachments.splice(index, 1)
    },
    async loadUsers() {
      try {
        const response = await axios.get('/api/users')
        
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
        } else {
          this.setFallbackUsers()
        }
      } catch (error) {
        this.setFallbackUsers()
      }
    },
    setFallbackUsers() {
      this.users = [
        { id: 1, username: 'admin', firstname: 'Admin', lastname: 'User', role: 'admin', displayName: 'Admin User' },
        { id: 2, username: 'hr', firstname: 'HR', lastname: 'Manager', role: 'hr', displayName: 'HR Manager' },
        { id: 3, username: 'john', firstname: 'John', lastname: 'Doe', role: 'user', displayName: 'John Doe' }
      ]
      this.filteredUsers = this.users
    },
    searchUsers(event) {
      const query = event.query.toLowerCase().trim()
      
      if (query === '') {
        // แสดงแค่ 50 คนแรกเมื่อไม่มีการค้นหา
        this.filteredUsers = this.users.slice(0, this.maxDisplayUsers)
      } else {
        // ค้นหาและจำกัดผลลัพธ์
        const filtered = this.users.filter(user => 
          user.displayName.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query) ||
          (user.position && user.position.toLowerCase().includes(query)) ||
          (user.department && user.department.toLowerCase().includes(query))
        )
        this.filteredUsers = filtered.slice(0, this.maxDisplayUsers)
      }
    },
    showAllUsers() {
      // แสดงแค่ 50 คนแรกเมื่อคลิก dropdown
      this.filteredUsers = this.users.slice(0, this.maxDisplayUsers)
    },
    onDelegateSelect(event) {
      const user = event.value
      if (user) {
        this.formData.delegateName = user.displayName
        this.formData.delegatePosition = user.position || ''
        this.formData.delegateDepartment = user.department || ''
      }
    }
  }
}
</script>

<style scoped>
.quota-display {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.quota-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.quota-label {
  color: #6c757d;
  font-weight: 500;
}

.quota-value {
  font-weight: bold;
  font-size: 1rem;
}

.quota-value.quota-normal {
  color: #28a745;
}

.quota-value.quota-low {
  color: #ffc107;
}

.quota-value.quota-zero {
  color: #dc3545;
}

.quota-total {
  color: #6c757d;
  font-size: 0.85rem;
}

.form-card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.leave-form {
  padding: 1rem;
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

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-range-group {
  display: flex;
  flex-direction: row;
  gap: 1rem;
}

.date-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .date-range-group {
    flex-direction: column;
    gap: 0.5rem;
  }
}

.input-label {
  font-weight: 500;
  color: #495057;
  font-size: 0.9rem;
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
  border-color: #28a745;
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
}

.readonly-field {
  background: #f8f9fa;
  color: #6c757d;
}

.section-divider {
  grid-column: 1 / -1;
  margin: 1rem 0;
  padding: 1rem 0;
  border-top: 2px solid #e9ecef;
}

.section-title {
  margin: 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
}

.checkbox-label {
  font-weight: 600;
  color: #495057;
  font-size: 1rem;
  cursor: pointer;
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

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .leave-form {
    padding: 0.5rem;
  }

  .corporate-input,
  .corporate-dropdown {
    padding: 0.6rem;
    font-size: 0.9rem;
  }

  .input-label {
    font-size: 0.85rem;
  }

  .checkbox-label {
    font-size: 0.9rem;
  }

  .file-list {
    padding: 0.5rem;
  }

  .file-item {
    padding: 0.4rem;
  }

  .file-name {
    font-size: 0.85rem;
  }
}

/* DateTime input styling */
.datetime-inputs {
  display: flex;
  gap: 0.5rem;
}

.date-input {
  flex: 2;
}

.time-input {
  flex: 1;
}

@media (max-width: 768px) {
  .datetime-inputs {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .date-input, .time-input {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .leave-form {
    padding: 0.25rem;
  }

  .form-grid {
    gap: 1rem;
  }

  .corporate-input,
  .corporate-dropdown {
    padding: 0.5rem;
    font-size: 0.85rem;
  }

  .input-label {
    font-size: 0.8rem;
  }

  .form-actions .p-button {
    min-width: 100%;
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
  }

  .checkbox-group {
    padding: 0.75rem 0;
  }

  .checkbox-label {
    font-size: 0.85rem;
  }
}

.user-option {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
}

.user-name {
  font-weight: 500;
  color: #495057;
}

.user-role {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.corporate-input :deep(.p-autocomplete-panel) {
  max-height: 250px;
  overflow-y: auto;
}

.quota-display {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
  min-height: 3rem;
  display: flex;
  align-items: center;
}

.quota-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.quota-label {
  font-weight: 500;
  color: #495057;
}

.quota-value {
  font-weight: bold;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.quota-normal {
  background: #d4edda;
  color: #155724;
}

.quota-low {
  background: #fff3cd;
  color: #856404;
}

.quota-zero {
  background: #f8d7da;
  color: #721c24;
}

.quota-total {
  color: #6c757d;
  font-size: 0.85rem;
}

.leave-type-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  gap: 1rem;
}

.disabled-option {
  background-color: #f8f9fa !important;
  color: #6c757d !important;
  cursor: not-allowed !important;
}

.quota-status {
  font-size: 0.75rem;
  color: #dc3545;
  font-weight: 500;
  background: #f8d7da;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
}

.quota-placeholder {
  background: #f8f9fa;
  border-left: 4px solid #dee2e6;
}

.quota-placeholder-text {
  color: #6c757d;
  font-style: italic;
  font-size: 0.9rem;
}
</style>
