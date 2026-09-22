<template>

  <Dialog :visible="showForm" modal :header="getFormTitle()" :style="{ width: '90vw', maxWidth: '700px' }"

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

            <Calendar id="time" v-model="pickupTimeModel" timeOnly hourFormat="24"

              placeholder="เลือกเวลา (นาฬิกา 24 ชม.)" class="w-full" />

          </div>



          <div class="input-group">

            <label for="expectedReturnTime" class="input-label">เวลาคืนรถ (โดยประมาณ) *</label>

            <Calendar id="expectedReturnTime" v-model="expectedReturnTimeModel" timeOnly hourFormat="24"

              placeholder="เลือกเวลา (นาฬิกา 24 ชม.)" class="w-full" />

            <small class="field-hint">ครบเวลานี้ระบบจะปิดรายการให้อัตโนมัติ (คืนก่อนเวลาได้)</small>

          </div>



          <div class="input-group">

            <label for="expectedReturnDate" class="input-label">วันที่คืนรถ</label>

            <Calendar id="expectedReturnDate" :modelValue="borrowForm.expected_return_date || selectedDate"

              @update:modelValue="updateBorrowForm('expected_return_date', $event)"

              dateFormat="dd/mm/yy" :minDate="selectedDate" class="w-full" :showIcon="true" />

          </div>



          <div class="input-group">

            <label for="location" class="input-label">สถานที่ *</label>

            <InputText id="location" :value="borrowForm.location"

              @input="updateBorrowForm('location', $event.target.value)" required class="corporate-input" />

          </div>



          <div class="input-group">

            <label for="project" class="input-label">โครงการ *</label>

            <Dropdown id="project" v-model="selectedProject" :options="projectOptions" 

              optionLabel="display" optionValue="id" placeholder="เลือกโครงการ"

              required class="corporate-input task-dropdown" filter 

              filterPlaceholder="ค้นหาชื่อโครงการ / เลข SO"

              :filterFields="['task_name', 'so_number', 'display']">

              <template #value="slotProps">

                <div v-if="slotProps.value" class="task-selected">

                  <div class="proj-icon"><i class="pi pi-briefcase"></i></div>

                  <div class="task-selected-info">

                    <div class="task-selected-name">

                      <span v-if="getTaskSO(slotProps.value)" class="so-badge">{{ getTaskSO(slotProps.value) }}</span>

                      <span class="task-name-text">{{ getTaskName(slotProps.value) }}</span>

                    </div>

                    <small v-if="getTaskCustomer(slotProps.value)" class="proj-sub"><i class="pi pi-building"></i> {{ getTaskCustomer(slotProps.value) }}</small>

                  </div>

                </div>

                <span v-else class="return-placeholder">เลือกโครงการ</span>

              </template>

              <template #option="slotProps">

                <div class="task-option proj-option">

                  <div class="proj-icon"><i class="pi pi-briefcase"></i></div>

                  <div class="task-option-info">

                    <div class="task-option-name">

                      <span v-if="slotProps.option.so_number" class="so-badge">{{ slotProps.option.so_number }}</span>

                      <span class="task-name-text">{{ slotProps.option.task_name }}</span>

                    </div>

                    <div v-if="slotProps.option.sale_owner || slotProps.option.customer_info" class="proj-meta">

                      <span v-if="slotProps.option.sale_owner" class="proj-meta-item"><i class="pi pi-user"></i> {{ slotProps.option.sale_owner }}</span>

                      <span v-if="slotProps.option.customer_info" class="proj-meta-item"><i class="pi pi-building"></i> {{ slotProps.option.customer_info }}</span>

                    </div>

                  </div>

                </div>

              </template>

            </Dropdown>

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

                  :forceSelection="false" scrollHeight="200px">

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

                      <div class="colleague-info">

                        <span v-if="colleague.position">{{ colleague.position }}</span>

                        <span v-if="colleague.position && colleague.department"> - </span>

                        <span v-if="colleague.department">{{ colleague.department }}</span>

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



          <div class="input-group full-width">

            <label class="input-label">ระดับน้ำมัน (ก่อนใช้รถ)</label>

            <FuelGauge v-model="fuelLevelBorrow" :disabled="true" />

          </div>



          <div class="input-group full-width">

            <label class="input-label">Easy Pass (ก่อนใช้รถ)</label>

            <EasyPassCard v-model="easyPassBorrow" :maxAmount="3000" :disabled="true" />

          </div>



          <div class="file-upload-section">

            <label class="upload-label">รูปภาพ</label>

            <div class="file-upload-wrapper">

              <input ref="borrowFileInput" @change="handleBorrowUpload" type="file"

                accept="image/*" multiple class="file-input">

              <Button type="button"

                :label="borrowForm.images?.length > 0 ? `เลือกแล้ว ${borrowForm.images.length} รูป` : 'เลือกรูปภาพ'"

                icon="pi pi-upload" severity="secondary" outlined @click="triggerBorrowUpload" />

            </div>

            <div v-if="borrowForm.images?.length > 0" class="image-preview-list">

              <div v-for="(image, index) in borrowForm.images" :key="index" class="image-preview-item">

                <img :src="getImagePreview(image)" alt="preview" class="preview-img" />

                <span class="remove-btn" @click="$emit('remove-image', index, 'borrow')">

                  <i class="pi pi-times"></i>

                </span>

              </div>

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

              optionValue="id" class="corporate-dropdown return-dropdown" placeholder="เลือกรายการที่ต้องการคืน"

              filter filterPlaceholder="ค้นหาชื่อ / โครงการ / เลข Ticket">

              <template #value="slotProps">

                <div v-if="slotProps.value && getReturnOption(slotProps.value)" class="return-option">

                  <span class="ticket-chip">#{{ slotProps.value }}</span>

                  <span class="return-option-name">{{ getReturnOption(slotProps.value).name }}</span>

                  <span class="return-option-when">{{ getReturnOption(slotProps.value).dateText }} · {{ getReturnOption(slotProps.value).time }}</span>

                </div>

                <span v-else class="return-placeholder">เลือกรายการที่ต้องการคืน</span>

              </template>

              <template #option="slotProps">

                <div class="return-option">

                  <span class="ticket-chip">#{{ slotProps.option.id }}</span>

                  <div class="return-option-info">

                    <div class="return-option-top">

                      <span class="return-option-name">{{ slotProps.option.name }}</span>

                      <span v-if="slotProps.option.project" class="return-option-project">{{ slotProps.option.project }}</span>

                    </div>

                    <div class="return-option-meta">

                      <span><i class="pi pi-calendar"></i> {{ slotProps.option.dateText }}</span>

                      <span><i class="pi pi-clock"></i> รับ {{ slotProps.option.time }}</span>

                      <span v-if="slotProps.option.location"><i class="pi pi-map-marker"></i> {{ slotProps.option.location }}</span>

                    </div>

                  </div>

                </div>

              </template>

            </Dropdown>

            <div v-if="selectedReturnInfo" class="return-summary">

              <span class="rs-item"><i class="pi pi-calendar"></i> รับรถ {{ selectedReturnInfo.dateText }}</span>

              <span class="rs-item"><i class="pi pi-clock"></i> เวลารับ {{ selectedReturnInfo.time }}</span>

              <span class="rs-item"><i class="pi pi-map-marker"></i> {{ selectedReturnInfo.location || 'ไม่ระบุสถานที่' }}</span>

              <span class="rs-item"><i class="pi pi-briefcase"></i> {{ selectedReturnInfo.project || 'ไม่มีโครงการ' }}</span>

            </div>

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



          <div class="input-group full-width">

            <label class="input-label">ระดับน้ำมัน (หลังใช้รถ) *</label>

            <FuelGauge v-model="fuelLevelReturn" />

          </div>



          <div class="input-group full-width">

            <label class="input-label">Easy Pass (หลังใช้รถ) *</label>

            <EasyPassCard v-model="easyPassReturn" :maxAmount="3000" />

          </div>



          <div class="file-upload-section">

            <label class="upload-label">รูปภาพ</label>

            <div class="file-upload-wrapper">

              <input ref="returnFileInput" @change="handleReturnUpload" type="file"

                accept="image/*" multiple class="file-input">

              <Button type="button"

                :label="returnForm.images?.length > 0 ? `เลือกแล้ว ${returnForm.images.length} รูป` : 'เลือกรูปภาพ'"

                icon="pi pi-upload" severity="secondary" outlined @click="triggerReturnUpload" />

            </div>

            <div v-if="returnForm.images?.length > 0" class="image-preview-list">

              <div v-for="(image, index) in returnForm.images" :key="index" class="image-preview-item">

                <img :src="getImagePreview(image)" alt="preview" class="preview-img" />

                <span class="remove-btn" @click="$emit('remove-image', index, 'return')">

                  <i class="pi pi-times"></i>

                </span>

              </div>

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

              optionValue="id" class="corporate-dropdown return-dropdown" placeholder="เลือกรายการที่ต้องการยกเลิก"

              filter filterPlaceholder="ค้นหาชื่อ / โครงการ / เลข Ticket">

              <template #value="slotProps">

                <div v-if="slotProps.value && getCancelOption(slotProps.value)" class="return-option">

                  <span class="ticket-chip">#{{ slotProps.value }}</span>

                  <span class="return-option-name">{{ getCancelOption(slotProps.value).name }}</span>

                  <span class="return-option-when">{{ getCancelOption(slotProps.value).dateText }} · {{ getCancelOption(slotProps.value).time }}</span>

                </div>

                <span v-else class="return-placeholder">เลือกรายการที่ต้องการยกเลิก</span>

              </template>

              <template #option="slotProps">

                <div class="return-option">

                  <span class="ticket-chip">#{{ slotProps.option.id }}</span>

                  <div class="return-option-info">

                    <div class="return-option-top">

                      <span class="return-option-name">{{ slotProps.option.name }}</span>

                      <span v-if="slotProps.option.project" class="return-option-project">{{ slotProps.option.project }}</span>

                    </div>

                    <div class="return-option-meta">

                      <span><i class="pi pi-calendar"></i> {{ slotProps.option.dateText }}</span>

                      <span><i class="pi pi-clock"></i> รับ {{ slotProps.option.time }}</span>

                      <span v-if="slotProps.option.location"><i class="pi pi-map-marker"></i> {{ slotProps.option.location }}</span>

                    </div>

                  </div>

                </div>

              </template>

            </Dropdown>

            <div v-if="selectedCancelInfo" class="return-summary cancel-summary">

              <span class="rs-item"><i class="pi pi-calendar"></i> รับรถ {{ selectedCancelInfo.dateText }}</span>

              <span class="rs-item"><i class="pi pi-clock"></i> เวลารับ {{ selectedCancelInfo.time }}</span>

              <span class="rs-item"><i class="pi pi-map-marker"></i> {{ selectedCancelInfo.location || 'ไม่ระบุสถานที่' }}</span>

              <span class="rs-item"><i class="pi pi-briefcase"></i> {{ selectedCancelInfo.project || 'ไม่มีโครงการ' }}</span>

            </div>

            <small class="field-hint cancel-hint"><i class="pi pi-exclamation-triangle"></i> ยืนยันแล้วจะแจ้งเตือนทีมงานผ่าน Teams และรายการจะถูกลบถาวร</small>

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

  <Dialog :visible="showConfirm" modal header="ยืนยันการดำเนินการ" :style="{ width: '90vw', maxWidth: '450px' }" :closable="false"

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

import FuelGauge from '@/components/FuelGauge.vue'

import EasyPassCard from '@/components/EasyPassCard.vue'



export default {

  name: 'BookingFormPrime',

  components: {

    AutoComplete,

    Dropdown,

    FuelGauge,

    EasyPassCard

  },

  emits: ['close-form', 'submit-borrow', 'submit-return', 'submit-cancel', 'handle-image-upload', 'remove-image', 'update-borrow-form', 'updateReturnForm', 'update-cancel-form'],

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

      projectOptions: [],

      fuelLevelBorrow: 50,

      fuelLevelReturn: 50,

      easyPassBorrow: 500,

      easyPassReturn: 500

    }

  },

  async created() {

    this.$http = axios

    await Promise.all([

      this.loadUsers(),

      this.loadProjects(),

      this.loadLatestFuelLevel()

    ]);

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

        displayText: `${borrow.id} - ${borrow.name} (${borrow.project}) - ${this.formatDate(borrow.selected_date)} ${borrow.time}`,

        name: borrow.name,

        project: borrow.project || '',

        dateText: this.formatDate(borrow.selected_date),

        time: borrow.time,

        location: borrow.location || ''

      }))

    },

    selectedReturnInfo() {

      if (!this.selectedReturnBorrow) return null

      return this.formattedAvailableBorrows.find(b => b.id === this.selectedReturnBorrow) || null

    },

    selectedCancelInfo() {

      if (!this.selectedCancelBorrow) return null

      return this.formattedPendingBorrows.find(b => b.id === this.selectedCancelBorrow) || null

    },

    // เวลารับ/เวลาคืน: ผูก Calendar timeOnly (24 ชม.) — เก็บในรูป "HH:MM" เหมือนเดิม
    pickupTimeModel: {
      get() { return this.timeStringToDate(this.borrowForm.time) },
      set(v) { this.$emit('update-borrow-form', { field: 'time', value: this.dateToTimeString(v) }) }
    },

    expectedReturnTimeModel: {
      get() { return this.timeStringToDate(this.borrowForm.expected_return_time) },
      set(v) { this.$emit('update-borrow-form', { field: 'expected_return_time', value: this.dateToTimeString(v) }) }
    },

    formattedPendingBorrows() {

      return this.pendingBorrows.map(borrow => ({

        id: borrow.id,

        displayText: `${borrow.id} - ${borrow.name} (${borrow.project}) - ${this.formatDate(borrow.selected_date)} ${borrow.time}`,

        name: borrow.name,

        project: borrow.project || '',

        dateText: this.formatDate(borrow.selected_date),

        time: borrow.time,

        location: borrow.location || ''

      }))

    },

    selectedProject: {

      get() {

        return this.borrowForm.task_id

      },

      set(value) {

        this.$emit('update-borrow-form', { field: 'task_id', value })

      }

    }

  },

  watch: {

    showForm(newVal) {

      if (newVal && this.activeForm === 'borrow') {

        this.loadLatestFuelLevel()

      }

    },

    activeForm(newVal) {

      if (newVal === 'borrow' && this.showForm) {

        this.loadLatestFuelLevel()

      }

    },

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

    async loadLatestFuelLevel() {

      try {

        const response = await this.$http.get('/api/car-booking/latest-fuel')

        this.fuelLevelBorrow = response.data.fuel_level || 50

        this.fuelLevelReturn = response.data.fuel_level || 50

        this.easyPassBorrow = response.data.easy_pass_balance || 500

        this.easyPassReturn = response.data.easy_pass_balance || 500

      } catch {

        this.fuelLevelBorrow = 50

        this.fuelLevelReturn = 50

        this.easyPassBorrow = 500

        this.easyPassReturn = 500

      }

    },

    getTaskSO(taskId) {

      const task = this.projectOptions.find(t => t.id === taskId)

      return task?.so_number || ''

    },

    getReturnOption(id) {

      return this.formattedAvailableBorrows.find(b => b.id === id) || null

    },

    getCancelOption(id) {

      return this.formattedPendingBorrows.find(b => b.id === id) || null

    },

    timeStringToDate(s) {

      if (!s) return null

      const [h, m] = String(s).split(':').map(Number)

      const d = new Date()

      d.setHours(h || 0, m || 0, 0, 0)

      return d

    },

    dateToTimeString(d) {

      if (!d) return ''

      const p = n => String(n).padStart(2, '0')

      return `${p(d.getHours())}:${p(d.getMinutes())}`

    },

    getTaskName(taskId) {

      const task = this.projectOptions.find(t => t.id === taskId)

      return task?.task_name || ''

    },

    getTaskCustomer(taskId) {

      const task = this.projectOptions.find(t => t.id === taskId)

      return task?.customer_info || ''

    },

    getImagePreview(image) {

      if (image instanceof File) {

        return URL.createObjectURL(image)

      }

      return image

    },

    triggerBorrowUpload() {

      this.$refs.borrowFileInput.value = ''

      this.$refs.borrowFileInput.click()

    },

    triggerReturnUpload() {

      this.$refs.returnFileInput.value = ''

      this.$refs.returnFileInput.click()

    },

    handleBorrowUpload(event) {

      this.$emit('handle-image-upload', event, 'borrow')

      event.target.value = ''

    },

    handleReturnUpload(event) {

      this.$emit('handle-image-upload', event, 'return')

      event.target.value = ''

    },

    async loadProjects() {

      try {

        const response = await this.$http.get('/api/tasks')

        if (response.data && Array.isArray(response.data)) {

          this.projectOptions = response.data

            .filter(task => isActive(task.status))

            .map(task => ({

              ...task,

              display: `${task.task_name} ${task.so_number ? `(${task.so_number})` : ''}`

            }))

        }

      } catch { // ignore

        

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

              displayName: `${user.firstname} ${user.lastname}${user.nickname ? ` (${user.nickname})` : ''}`.trim()

            }))

          this.filteredUsers = this.users.slice(0, this.maxDisplayUsers)

        }

      } catch { // ignore

        

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

        const fullName = `${user.firstname} ${user.lastname}`.trim()



        if (!alreadySelected) {

          const newColleagues = [...colleagues, {

            id: user.id,

            name: user.displayName,

            fullName: fullName,

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

      // Validate selected booking for cancel form

      if (type === 'cancel' && !this.selectedCancelBorrow) {

        this.$toast.add({

          severity: 'error',

          summary: 'กรุณาเลือกรายการ',

          detail: 'เลือกการจองที่ต้องการยกเลิกก่อนยืนยัน',

          life: 3000

        })

        return

      }

      // Validate expected return time for borrow form

      if (type === 'borrow') {

        if (!this.borrowForm.time) {

          this.$toast.add({

            severity: 'error',

            summary: 'กรุณาระบุเวลารับรถ',

            detail: 'เลือกเวลารับรถก่อนบันทึก',

            life: 3000

          })

          return

        }

        if (!this.borrowForm.expected_return_time) {

          this.$toast.add({

            severity: 'error',

            summary: 'กรุณาระบุเวลาคืนรถ',

            detail: 'ระบุเวลาคืนโดยประมาณ เพื่อให้ระบบปิดรายการอัตโนมัติเมื่อครบเวลา',

            life: 3000

          })

          return

        }

        const pickup = new Date(this.selectedDate || new Date())

        const [ph, pm] = (this.borrowForm.time || '00:00').split(':').map(Number)

        pickup.setHours(ph || 0, pm || 0, 0, 0)

        const expDate = new Date(this.borrowForm.expected_return_date || this.selectedDate || new Date())

        const [eh, em] = this.borrowForm.expected_return_time.split(':').map(Number)

        expDate.setHours(eh, em, 0, 0)

        if (expDate <= pickup) {

          const p = n => String(n).padStart(2, '0')

          this.$toast.add({

            severity: 'error',

            summary: 'เวลาคืนไม่ถูกต้อง',

            detail: `เวลารับ ${p(ph)}:${p(pm)} แต่เวลาคืน ${p(eh)}:${p(em)} — เวลา/วันที่คืนต้องเป็นเวลาหลังจากเวลารับรถ`,

            life: 4000

          })

          return

        }

      }

      // Validate fuel level for return form

      if (type === 'return' && (this.fuelLevelReturn === null || this.fuelLevelReturn === undefined)) {

        this.$toast.add({

          severity: 'error',

          summary: 'กรุณาเลือกระดับน้ำมัน',

          detail: 'กรุณาเลือกระดับน้ำมันก่อนบันทึกการคืนรถ',

          life: 3000

        })

        return

      }



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

        this.$emit('submit-borrow', { fuelLevelBorrow: this.fuelLevelBorrow, easyPassBorrow: this.easyPassBorrow })

      } else if (this.pendingAction === 'return') {

        this.$emit('submit-return', { fuelLevelReturn: this.fuelLevelReturn, easyPassReturn: this.easyPassReturn })

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



.colleague-info {

  font-size: 0.8rem;

  color: #6c757d;

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

  display: block;

  margin-bottom: 0.35rem;

}

.field-hint {

  display: block;

  margin-top: 0.3rem;

  font-size: 0.72rem;

  color: #64748b;

}

.return-dropdown { width: 100%; }

.return-option {

  display: flex;

  align-items: center;

  gap: 0.55rem;

  width: 100%;

  min-width: 0;

  padding: 0.15rem 0;

}

.ticket-chip {

  font-family: monospace;

  font-weight: 800;

  font-size: 0.72rem;

  color: #4f46e5;

  background: #eef2ff;

  border: 1px solid #e0e7ff;

  border-radius: 6px;

  padding: 0.12rem 0.45rem;

  flex-shrink: 0;

}

.return-option-info { min-width: 0; flex: 1; }

.return-option-top { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }

.return-option-name { font-weight: 600; color: #1e293b; font-size: 0.84rem; }

.return-option-project {

  font-size: 0.66rem;

  font-weight: 700;

  color: #1d4ed8;

  background: #eff6ff;

  border: 1px solid #dbeafe;

  border-radius: 20px;

  padding: 0.08rem 0.45rem;

  max-width: 180px;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

}

.return-option-meta {

  display: flex;

  align-items: center;

  gap: 0.7rem;

  flex-wrap: wrap;

  margin-top: 0.2rem;

  font-size: 0.7rem;

  color: #64748b;

}

.return-option-meta i { font-size: 0.62rem; color: #94a3b8; }

.return-option-when { font-size: 0.74rem; color: #64748b; white-space: nowrap; margin-left: auto; }

.return-placeholder { color: #94a3b8; }

.return-summary {

  display: flex;

  align-items: center;

  flex-wrap: wrap;

  gap: 0.35rem 1rem;

  margin-top: 0.5rem;

  background: #f8fafc;

  border: 1px solid #eef2f6;

  border-radius: 10px;

  padding: 0.5rem 0.75rem;

  font-size: 0.76rem;

  color: #475569;

}

.rs-item { display: inline-flex; align-items: center; gap: 0.3rem; }

.rs-item i { font-size: 0.68rem; color: #94a3b8; }

/* ฟอร์มยกเลิก: summary + hint โทนแดง/ส้มเตือน */
.cancel-summary {
  background: #fef2f2;
  border-color: #fecaca;
  color: #7f1d1d;
}
.cancel-summary .rs-item i { color: #f87171; }
.cancel-hint {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.45rem;
  color: #b45309;
  font-weight: 600;
}
.cancel-hint i { color: #f59e0b; }



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



.image-preview-list {

  display: grid;

  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));

  gap: 0.5rem;

  margin-top: 0.75rem;

  max-width: 100%;

  overflow: hidden;

}



.image-preview-item {

  position: relative;

  width: 100%;

  aspect-ratio: 1;

  max-width: 80px;

}



.preview-img {

  width: 100%;

  height: 100%;

  object-fit: cover;

  border-radius: 8px;

  border: 1px solid #dee2e6;

}



.image-preview-list .remove-btn {

  position: absolute;

  top: -6px;

  right: -6px;

  width: 20px;

  height: 20px;

  background: #ef4444;

  border-radius: 50%;

  display: flex;

  align-items: center;

  justify-content: center;

  cursor: pointer;

  color: white;

  font-size: 10px;

}



.image-preview-list .remove-btn:hover {

  background: #dc2626;

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



/* Task Dropdown Styling */

.task-dropdown :deep(.p-dropdown-panel) {

  max-width: calc(100vw - 2rem) !important;

}



.task-selected,

.task-option {

  display: flex;

  align-items: flex-start;

  gap: 0.5rem;

  max-width: 100%;

  width: 100%;

}



.so-badge {

  flex-shrink: 0;

  background: linear-gradient(135deg, #3b82f6, #2563eb);

  color: white;

  padding: 0.2rem 0.5rem;

  border-radius: 4px;

  font-size: 0.75rem;

  font-weight: 600;

}



.task-name-text {

  flex: 1;

  min-width: 0;

  word-break: break-word;

  white-space: normal;

  line-height: 1.4;

}

/* Dropdown โครงการ (แจ้งใช้รถ) */
.task-selected {

  align-items: center !important;

  gap: 0.55rem !important;

}

.task-selected-info { min-width: 0; flex: 1; }

.task-selected-name { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }

.task-option-info { min-width: 0; flex: 1; }

.task-option-name { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }

.proj-icon {

  width: 32px;

  height: 32px;

  border-radius: 9px;

  background: linear-gradient(135deg, #dbeafe, #bfdbfe);

  color: #2563eb;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 0.8rem;

  flex-shrink: 0;

}

.proj-sub {

  display: flex;

  align-items: center;

  gap: 0.25rem;

  font-size: 0.68rem;

  color: #64748b;

  margin-top: 0.15rem;

  max-width: 100%;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

}

.proj-sub i { font-size: 0.6rem; color: #94a3b8; flex-shrink: 0; }

.proj-meta {

  display: flex;

  align-items: center;

  gap: 0.7rem;

  flex-wrap: wrap;

  margin-top: 0.2rem;

  font-size: 0.7rem;

  color: #64748b;

}

.proj-meta-item {

  display: inline-flex;

  align-items: center;

  gap: 0.25rem;

  max-width: 200px;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

}

.proj-meta-item i { font-size: 0.6rem; color: #94a3b8; flex-shrink: 0; }

/* Responsive: dialog แจ้งคืนรถบนมือถือ */
@media (max-width: 768px) {

  .form-actions {

    flex-direction: column-reverse;

  }

  .form-actions .p-button {

    width: 100%;

    min-width: 0;

  }

  .return-option-when {

    display: none;

  }

}

</style>

