<template>
  <div class="app-container">
    <div class="main-tabs">
      <div class="tabs-header">
        <div class="header-title">
          <i class="pi pi-car"></i>
          <h1>ระบบแจ้งใช้รถ/แจ้งคืนรถ</h1>
        </div>
        
        <TabView v-model:activeIndex="activeTabIndex" class="tab-navigation">
          <TabPanel>
            <template #header>
              <div class="tab-header">
                <i class="pi pi-calendar"></i>
                <span>ปฏิทิน</span>
              </div>
            </template>
          </TabPanel>

          <TabPanel>
            <template #header>
              <div class="tab-header">
                <i class="pi pi-history"></i>
                <span>ประวัติการใช้รถ</span>
                <Badge v-if="borrowRecordsCount > 0" :value="borrowRecordsCount" severity="info" />
              </div>
            </template>
          </TabPanel>
        </TabView>

        <div v-if="activeTabIndex === 0" class="action-buttons-header">
          <Button @click="showReturnForm" :disabled="availableBorrows.length === 0" severity="warning"
            icon="pi pi-upload" label="แจ้งคืนรถ" raised>
            <i class="pi pi-upload"></i>
            <Badge v-if="availableBorrows.length > 0" :value="availableBorrows.length" severity="warning" />
            แจ้งคืนรถ
          </Button>

          <Button @click="showCancelForm" :disabled="pendingBorrows.length === 0" severity="danger"
            icon="pi pi-times-circle" label="ยกเลิกการจอง" raised>
            <i class="pi pi-times-circle"></i>
            ยกเลิกการจอง
            <Badge v-if="pendingBorrows.length > 0" :value="pendingBorrows.length" 
                   :style="{ backgroundColor: 'white', color: 'black', fontSize: 'max(0.75rem, var(--min-fs))', 
                            width: '1.2rem', height: '1.2rem', borderRadius: '50%',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            lineHeight: '1', fontWeight: 'bold', border: '2px solid white' }" />
          </Button>
        </div>
      </div>

      <div class="tab-content-area">
        <div v-if="activeTabIndex === 0" class="tab-content">
          <Calendar :records="records" :available-borrows="availableBorrows" :pending-borrows="pendingBorrows"
            :has-active-borrow="hasActiveBorrow" @select-date="selectDate" @show-return-form="showReturnForm"
            @show-cancel-form="showCancelForm" />
        </div>

        <div v-if="activeTabIndex === 1" class="tab-content">
          <History :records="records" @view-images="viewImages"
            @upload-images="handleAdditionalImageUploadFromHistory" />
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <BookingForm ref="bookingForm" v-if="showForm" :show-form="showForm" :selected-date="selectedDate"
      :active-form="activeForm" :borrow-form="borrowForm" :return-form="returnForm" :cancel-form="cancelForm"
      :available-borrows="availableBorrows" :pending-borrows="pendingBorrows" :current-return-time="currentReturnTime"
      :selected-borrow-project="selectedBorrowProject" :selected-borrow-description="selectedBorrowDescription" @close-form="closeForm" @submit-borrow="submitBorrow"
      @submit-return="submitReturn" @submit-cancel="submitCancel" @handle-image-upload="handleImageUpload"
      @remove-image="removeImage" @update-borrow-form="updateBorrowForm" @updateReturnForm="updateReturnForm"
      @update-cancel-form="updateCancelForm" />

    <!-- Image Modal -->
    <Dialog v-model:visible="showImageModal" modal header="รูปภาพ" :style="{ width: '80vw' }" :draggable="false">
      <div v-if="selectedImages.length === 0" class="no-images-state">
        <i class="pi pi-image" style="font-size: 4rem; color: #55657a;"></i>
        <p>ไม่มีรูปภาพ</p>
      </div>

      <div v-else class="image-viewer">
        <div v-for="imageType in groupedImages" :key="imageType.type"
          :class="['image-section', imageType.type.includes('ใช้') ? 'borrow-section' : 'return-section']">
          <div class="section-header">
            <i :class="imageType.type.includes('ใช้') ? 'pi pi-download' : 'pi pi-upload'"></i>
            รูปภาพตอน{{ imageType.type }}
          </div>
          <div class="images-grid">
            <div v-for="(image, index) in imageType.images" :key="index" class="image-container">
              <img :src="image.src?.src || image.src" class="grid-image" @click="viewFullImage(image)" alt="รูปภาพ" />
            </div>
          </div>
        </div>
      </div>

      <!-- Upload section -->
      <div v-if="currentBookingData && canUploadForBooking(currentBookingData)" class="upload-section">
        <Divider />
        <div class="upload-controls">
          <input type="file" id="modal-upload" @change="handleModalImageUpload" accept="image/*" multiple
            style="display: none" />
          <Button label="อัปโหลดรูปเพิ่ม" icon="pi pi-camera" @click="triggerFileUpload" severity="secondary" />
        </div>
      </div>

    </Dialog>
    <!-- Full Size Image Modal -->
    <Dialog v-model:visible="showFullImageModal" modal header="รูปภาพขนาดใหญ่" :style="{ width: '90vw' }"
      :draggable="false">
      <div v-if="!fullSizeImage" class="no-image-placeholder">
        <p>ไม่สามารถโหลดรูปภาพได้</p>
      </div>
      <img v-else :src="typeof fullSizeImage === 'string' ? fullSizeImage : fullSizeImage.src" class="full-size-image"
        @error="handleImageError" @load="handleImageLoad" />
    </Dialog>

    <!-- Toast for notifications -->
  </div>
</template>

<script>
import Calendar from './Calendar.vue'
import History from './History.vue'
import BookingFormPrime from './BookingFormPrime.vue'
import axios from '@/utils/axiosConfig'

export default {
  components: {
    Calendar,
    History,
    BookingForm: BookingFormPrime
  },
  data() {
    return {
      activeTabIndex: 0,
      selectedDate: null,
      showForm: false,
      activeForm: 'borrow',
      borrowForm: {
        license: 'ชฮ-3706',
        time: '',
        location: '',
        task_id: null,
        discription: '',
        colleagues: [],
        images: [],
        expected_return_time: '',
        expected_return_date: null
      },
      returnForm: {
        borrowId: '',
        license: 'ชฮ-3706',
        location: '',
        discription: '',
        images: []
      },
      cancelForm: {
        borrowId: '',
        reason: ''
      },
      records: [],
      currentTime: new Date(),
      serverTimeOffset: 0,
      currentBookingData: null,
      showImageModal: false,
      selectedImages: [],
      showFullImageModal: false,
      fullSizeImage: '',
      teamsWebhookUrl: 'YOUR_TEAMS_WEBHOOK_URL_HERE',
      notifiedActiveBookings: new Set(),
      refreshInterval: null,
      timeInterval: null,
      syncInterval: null
    }
  },
  computed: {
    currentDateTime() {
      return this.currentTime.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },
    hasActiveBorrow() {
      return this.records.some(r => r.status === 'active')
    },
    // ใครเข้าหน้านี้ได้ (สิทธิ์ /car_booking) แจ้งคืน/ยกเลิก/เพิ่มรูปให้การจองของทุกคนได้ — backend ใช้สิทธิ์เดียวกัน
    availableBorrows() {
      // active = เลยเวลารับรถแล้วและยังไม่คืน
      return this.records.filter(r => r.status === 'active')
    },
    pendingBorrows() {
      // pending = จองล่วงหน้า ยังไม่ถึงเวลา
      return this.records.filter(r => r.status === 'pending')
    },
    currentReturnTime() {
      return this.currentTime.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    selectedBorrowProject() {
      if (!this.returnForm.borrowId) return ''
      const selectedBorrow = this.records.find(r => r.id == this.returnForm.borrowId)
      return selectedBorrow ? selectedBorrow.project : ''
    },
    selectedBorrowDescription() {
      if (!this.returnForm.borrowId) return ''
      const selectedBorrow = this.records.find(r => r.id == this.returnForm.borrowId)
      return selectedBorrow ? selectedBorrow.discription : ''
    },
    borrowRecordsCount() {
      return this.records.filter(r => r.status !== 'returned').length
    },
    bookingsAllowingImageUpload() {
      return this.records.filter(r => r.status === 'active')
    },
    groupedImages() {
      const groups = {}
      this.selectedImages.forEach(image => {
        if (!groups[image.type]) {
          groups[image.type] = []
        }
        groups[image.type].push(image)
      })
      return Object.keys(groups).map(type => ({
        type,
        images: groups[type]
      }))
    }
  },
  mounted() {
    this.loadRecords()
    this.syncServerTime()
    
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date(Date.now() + this.serverTimeOffset)
    }, 1000)
    
    // Auto refresh ทุก 30 วินาที
    this.refreshInterval = setInterval(() => {
      this.loadRecords(true)
    }, 30000)
    
    this.syncInterval = setInterval(() => {
      this.syncServerTime()
    }, 300000)
  },
  beforeUnmount() {
    // Clear intervals เมื่อออกจากหน้านี้
    if (this.refreshInterval) clearInterval(this.refreshInterval)
    if (this.timeInterval) clearInterval(this.timeInterval)
    if (this.syncInterval) clearInterval(this.syncInterval)
  },
  created() {
    this.$http = axios
    
  },
  methods: {
    async syncServerTime() {
      try {
        const response = await axios.get('/api/server-time', { silent: true })
        const serverTime = new Date(response.data.serverTime)
        const clientTime = new Date()
        this.serverTimeOffset = serverTime.getTime() - clientTime.getTime()
        this.currentTime = new Date(Date.now() + this.serverTimeOffset)
      } catch { // ignore
      }
    },
    getCurrentUserName() {
      const firstName = localStorage.getItem('soc_firstname') || ''
      const lastName = localStorage.getItem('soc_lastname') || ''
      return `${firstName} ${lastName}`.trim()
    },
    async loadRecords(silent = false) {
      try {
        const response = await axios.get('/api/car-booking', { silent })
        this.records = response.data
      } catch { // ignore
        if (!silent) {
          this.$toast.add({
            severity: 'error',
            summary: 'โหลดข้อมูลไม่สำเร็จ',
            detail: 'กรุณารีเฟรชหน้าเว็บ',
            life: 4000
          })
        }
      }
    },
    triggerFileUpload() {
      document.getElementById('modal-upload').click()
    },
    selectDate(date) {
      this.selectedDate = date
      this.showForm = true
      this.activeForm = 'borrow'
    },
    showReturnForm() {
      this.selectedDate = new Date(Date.now() + this.serverTimeOffset)
      this.showForm = true
      this.activeForm = 'return'
    },
    showCancelForm() {
      this.selectedDate = new Date(Date.now() + this.serverTimeOffset)
      this.showForm = true
      this.activeForm = 'cancel'
    },
    closeForm() {
      this.showForm = false
      this.selectedDate = null
      this.resetForms()
    },
    handleImageUpload(event, formType) {
      const files = Array.from(event.target.files)
      if (formType === 'borrow') {
        this.borrowForm.images = [...(this.borrowForm.images || []), ...files]
      } else {
        this.returnForm.images = [...(this.returnForm.images || []), ...files]
      }
    },
    removeImage(index, formType) {
      if (formType === 'borrow') {
        this.borrowForm.images.splice(index, 1)
      } else {
        this.returnForm.images.splice(index, 1)
      }
    },
    async convertImagesToBase64(images) {
      const promises = images.map(img => {
        if (img instanceof File) {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.readAsDataURL(img)
          })
        }
        return Promise.resolve(img)
      })
      return Promise.all(promises)
    },
    openImageModal(imageSrc) {
      this.selectedImages = [{ src: imageSrc, type: 'รูปภาพ' }]
      this.showImageModal = true
    },
    calculateUsageDuration(borrowDate, borrowTime, returnDate) {
      const borrowDateTime = new Date(borrowDate)
      const [hour, minute] = borrowTime.split(':').map(Number)
      borrowDateTime.setHours(hour, minute, 0, 0)

      const diffMs = returnDate - borrowDateTime
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

      if (diffHours > 0) {
        return `${diffHours} ชั่วโมง ${diffMinutes} นาที`
      } else {
        return `${diffMinutes} นาที`
      }
    },
    viewImages(images, bookingData = null) {
      this.selectedImages = images
      this.currentBookingData = bookingData
      this.showImageModal = true
    },
    handleImageError() {
      this.$toast.add({
        severity: 'error',
        summary: 'โหลดรูปไม่สำเร็จ',
        detail: 'รูปภาพอาจถูกลบหรือไม่พร้อมใช้งาน',
        life: 4000
      })
    },
    handleImageLoad() {
    },
    viewFullImage(imageSrc) {
      // Handle nested proxy objects
      let imageUrl = imageSrc
      if (typeof imageSrc === 'object' && imageSrc.src) {
        imageUrl = typeof imageSrc.src === 'string' ? imageSrc.src : imageSrc.src.src
      }
      this.fullSizeImage = imageUrl
      this.showFullImageModal = true
    },
    formatDateForDB(date) {
      const d = new Date(date)
      // Convert to Bangkok timezone
      const bangkokTime = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
      const year = bangkokTime.getFullYear()
      const month = String(bangkokTime.getMonth() + 1).padStart(2, '0')
      const day = String(bangkokTime.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    async submitBorrow(payload = {}) {
      try {
        const images = await this.convertImagesToBase64(this.borrowForm.images || [])
        const borrowData = {
          type: 'borrow',
          location: this.borrowForm.location,
          task_id: this.borrowForm.task_id,
          description: this.borrowForm.discription,
          selected_date: this.formatDateForDB(this.selectedDate),
          time: this.borrowForm.time,
          license: 'ชฮ-3706',
          colleagues: this.borrowForm.colleagues || [],
          images,
          user_id: localStorage.getItem('soc_user_id'),
          fuel_level_borrow: payload.fuelLevelBorrow || null,
          easy_pass_borrow: payload.easyPassBorrow || null,
          expected_return_date: this.borrowForm.expected_return_date
            ? this.formatDateForDB(this.borrowForm.expected_return_date)
            : this.formatDateForDB(this.selectedDate),
          expected_return_time: this.borrowForm.expected_return_time || null
        }

        await this.$http.post('/api/car-booking', borrowData)


        await this.loadRecords()
        this.closeForm()

        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'บันทึกการจองรถเรียบร้อยแล้ว',
          life: 3000
        })
      } catch (err) {
        // Handle conflict error (409)
        if (err.response?.status === 409) {
          this.$toast.add({
            severity: 'warn',
            summary: 'ไม่สามารถจองได้',
            detail: err.response.data.details || err.response.data.error,
            life: 5000
          })
        } else {
          this.$toast.add({
            severity: 'error',
            summary: 'บันทึกไม่สำเร็จ',
            detail: 'กรุณาลองใหม่อีกครั้ง',
            life: 4000
          })
        }
      }
    },
    async submitReturn(payload = {}) {
      const borrowId = this.returnForm.borrowId || this.$refs.bookingForm?.selectedReturnBorrow

      if (!borrowId) {
        this.$toast.add({ severity: 'error', summary: 'กรุณาเลือกข้อมูล', detail: 'เลือกการแจ้งใช้รถที่ต้องการคืน', life: 4000 })
        return
      }

      try {
        const firstName = localStorage.getItem('soc_firstname') || ''
        const lastName = localStorage.getItem('soc_lastname') || ''
        const currentUserName = `${firstName} ${lastName}`.trim()

        const bangkokTime = new Date(Date.now() + this.serverTimeOffset)
        const currentTime = bangkokTime.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })

        const images = await this.convertImagesToBase64(this.returnForm.images || [])
        const returnData = {
          return_name: currentUserName,
          return_location: this.returnForm.location,
          return_description: this.returnForm.discription,
          return_time: currentTime,
          return_date: this.formatDateForDB(bangkokTime),
          images,
          fuel_level_return: payload.fuelLevelReturn || null,
          easy_pass_return: payload.easyPassReturn || null
        }

        await axios.put(`/api/car-booking/${borrowId}`, returnData)

        await this.loadRecords()
        
        // Reload fuel level in child component before closing
        if (this.$refs.bookingForm) {
          await this.$refs.bookingForm.loadLatestFuelLevel()
        }
        
        this.closeForm()

        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'บันทึกการคืนรถเรียบร้อยแล้ว',
          life: 3000
        })
      } catch { // ignore
        this.$toast.add({
          severity: 'error',
          summary: 'บันทึกไม่สำเร็จ',
          detail: 'กรุณาลองใหม่อีกครั้ง',
          life: 4000
        })
      }
    },
    async submitCancel() {

      if (!this.cancelForm.borrowId) {
        this.$toast.add({ severity: 'error', summary: 'กรุณาเลือกข้อมูล', detail: 'เลือกการจองที่ต้องการยกเลิก', life: 4000 })
        return
      }

      try {
        await this.$http.delete(`/api/car-booking/${this.cancelForm.borrowId}`)

        await this.loadRecords()
        this.closeForm()

        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'ยกเลิกการจองเรียบร้อยแล้ว',
          life: 3000
        })
      } catch { // ignore
        this.$toast.add({
          severity: 'error',
          summary: 'ยกเลิกไม่สำเร็จ',
          detail: 'กรุณาลองใหม่อีกครั้ง',
          life: 4000
        })
      }
    },
    updateBorrowForm({ field, value }) {
      this.borrowForm[field] = value
    },
    updateReturnForm(field, value) {
      this.returnForm[field] = value
    },
    updateCancelForm({ field, value }) {
      this.cancelForm[field] = value
    },
    async handleAdditionalImageUploadFromHistory({ files, bookingId }) {
      if (files.length === 0) return

      try {
        // Find the booking record
        const booking = this.records.find(r => r.id === bookingId)
        if (!booking) return

        // Convert files to base64
        const newImages = []
        for (const file of files) {
          const reader = new FileReader()
          const base64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result)
            reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
            reader.readAsDataURL(file)
          })
          newImages.push({
            name: file.name,
            src: base64,
            type: 'เพิ่มเติม',
            timestamp: new Date(Date.now() + this.serverTimeOffset).toLocaleString('th-TH')
          })
        }

        // ส่ง "เฉพาะรูปใหม่" ไป endpoint append — server merge กับรูปเดิมเอง (ไม่ทับรูปเดิม)
        await this.$http.post(`/api/car-booking/${bookingId}/images`, {
          images: newImages
        }, { timeout: 300000 })

        await this.loadRecords()

        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: `อัปโหลดรูปภาพ ${files.length} ไฟล์เรียบร้อย`,
          life: 3000
        })
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'อัปโหลดไม่สำเร็จ',
          detail: error.response?.data?.error || 'ไฟล์อาจใหญ่เกินไป หรือรูปแบบไม่รองรับ',
          life: 4000
        })
      }
    },
    resetForms() {
      this.borrowForm = {
        license: 'ชฮ-3706',
        time: '',
        location: '',
        task_id: null,
        discription: '',
        colleagues: [],
        images: [],
        expected_return_time: '',
        expected_return_date: null
      }
      this.returnForm = {
        borrowId: '',
        license: 'ชฮ-3706',
        location: '',
        discription: '',
        images: []
      }
      this.cancelForm = {
        borrowId: '',
        reason: ''
      }
    },
    canUploadForBooking(bookingData) {
      if (!bookingData) return false
      
      // Find the actual record from this.records
      const record = this.records.find(r => r.id === bookingData.id)
      if (!record) return false
      
      // Can upload if status is active
      return record.status === 'active'
    },
    async handleModalImageUpload(event) {
      if (!this.currentBookingData) return

      const files = Array.from(event.target.files)
      if (files.length === 0) return

      await this.handleAdditionalImageUploadFromHistory({
        files,
        bookingId: this.currentBookingData.id
      })

      // Clear file input and close modal
      event.target.value = ''
      this.showImageModal = false
    }
  }
}
</script>

<style scoped>
.calendar-card {
  width: 100%;
  margin: 0;
  box-shadow: none;
  border: 1px solid #e9ecef;
}

.app-container {
  padding: 1rem;
  padding-bottom: 0;
  max-width: 100%;
  margin: 0 auto;
  
  background: transparent; /* พื้นหลังหน้ามาจาก body (theme.css) */
  height: 100%;
  font-family: inherit;
  overflow: auto;
}

.main-tabs {
  margin-top: 0;
  box-shadow: none;
  border-radius: 15px;
  overflow: hidden;
  border: 1px solid rgba(74, 144, 226, 0.2);
  background: white;
}

.tabs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -1px -1px 0;
  padding: 0.75rem 1.5rem;
  background: var(--brand-gradient);
  position: relative;
  flex-wrap: wrap;
  gap: 1rem;
}

/* เดิมวางชื่อหน้าแบบ absolute กลางแบนเนอร์ → ซ้อนทับกับแท็บ/ปุ่มเมื่อจอแคบหรือฟอนต์กว้างขึ้น
   เปลี่ยนเป็นอยู่ในแถวเดียวกัน ถ้าที่ไม่พอจะขึ้นบรรทัดใหม่เอง */
.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  position: relative;
  z-index: 2;
}

.header-title h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.header-title i {
  font-size: 1.5rem;
}

.tab-navigation {
  background: transparent;
  max-width: 100%;
  overflow: hidden;
  margin-right: auto;
}

.tab-navigation :deep(.p-tabview-nav) {
  background: transparent;
  border: none;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
  justify-content: center;
}

.tab-navigation :deep(.p-tabview-nav-link) {
  color: white;
  border: none;
  font-weight: 500;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  border-radius: 8px;
  margin: 0.25rem;
  white-space: nowrap;
}

.tab-navigation :deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  box-shadow: none;
  transform: translateY(-2px);
  border-bottom: none !important;
}

.tab-navigation :deep(.p-tabview-nav-link:hover) {
  background: rgba(255, 255, 255, 0.15);
}

.tab-navigation :deep(.p-tabview-ink-bar) {
  display: none !important;
}

.tab-navigation :deep(.p-tabview-panels) {
  display: none;
}

.action-buttons-header {
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
  z-index: 1;
  margin-left: auto;
}

.action-buttons-header .p-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 700;
  padding: 0.55rem 1.25rem;
  font-size: 0.95rem;
  border-radius: var(--radius-md);
  min-width: 140px;
  min-height: 2.6rem;
  box-shadow: none;
  border: 2px solid white;
}

.action-buttons-header .p-button:hover {
  box-shadow: none;
  border: 2px solid white;
}

.tab-content-area {
  background: white;
}

.tab-content {
  padding: 0;
}

.main-tabs :deep(.p-tabview-nav) {
  background: transparent;
  border: none;
  margin: 0;
  padding: 0;
  gap: 0.5rem;
}

.main-tabs :deep(.p-tabview-nav-link) {
  color: black !important;
  border: none;
  font-weight: 800 !important;
  padding: 0.6rem 1.25rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  border-radius: 8px;
  margin: 0 0.25rem;
  background: rgba(255, 255, 255, 0.4
  )
}

.tab-header {
  font-weight: 800 !important;
  color: black !important;
}

.tab-header span {
  font-weight: 800 !important;
  color: black !important;
}

.tab-header i {
  font-size: 1.2rem;
  font-weight: 900;
}

.main-tabs :deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  background: white;
  color: #2f66b3;
  box-shadow: none;
  transform: translateY(-2px);
  border-bottom: none !important;
  font-weight: 700;
  border-radius: 8px;
}

.main-tabs :deep(.p-tabview-nav-link:hover) {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

.main-tabs :deep(.p-tabview-ink-bar) {
  display: none !important;
}

.main-tabs :deep(.p-tabview-panels) {
  background: white;
  padding: 0;
  border-radius: 0 0 15px 15px;
}

.main-tabs :deep(.p-tabview-panel) {
  padding: 0;
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.tab-header i {
  font-size: 1.1rem;
}

.tab-content {
  padding: 0;
}

.image-viewer {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.image-section {
  border-radius: 8px;
  overflow: hidden;
}

.borrow-section {
  border: 2px solid #dc3545;
}

.borrow-section .section-header {
  background: #f8d7da;
  color: #721c24;
  border-bottom: 1px solid #f5c6cb;
}

.borrow-section .grid-image {
  border: 3px solid #dc3545;
}

.return-section {
  border: 2px solid #28a745;
}

.return-section .section-header {
  background: #d4edda;
  color: #155724;
  border-bottom: 1px solid #c3e6cb;
}

.return-section .grid-image {
  border: 3px solid #28a745;
}

.section-header {
  background: #f8f9fa;
  padding: 1rem;
  font-weight: 600;
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 120px));
  gap: 0.5rem;
  padding: 0.5rem;
}

.image-container {
  position: relative;
  width: 100%;
  height: 100px;
}

.grid-image {
  width: 100%;
  height: 100px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 200px;
  background: #f8f9fa;
  border: 1px dashed #dee2e6;
  border-radius: 6px;
  color: #525f70;
}

.full-size-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  display: block;
  margin: 0 auto;
}

.no-images-state {
  text-align: center;
  padding: 3rem;
  color: #525f70;
}

.no-images-state p {
  margin-top: 1rem;
  font-size: 1.1rem;
}

.upload-section {
  margin-top: 1rem;
}

.upload-controls {
  text-align: center;
  padding: 1rem;
}

@media (max-width: 768px) {
  .app-container {
    padding: 1rem;
  }

  .main-header {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }

  .main-header h1 {
    font-size: 1.5rem;
  }

  .car-status {
    margin-bottom: 1rem !important;
  }

  .status-card {
    min-width: 100%;
    max-width: 100%;
  }

  .status-content {
    padding: 1rem;
    gap: 1rem;
    flex-direction: column;
    text-align: center;
  }

  .status-icon {
    font-size: 2rem;
  }

  .status-text {
    align-items: center;
  }

  /* มือถือ: ชื่อหน้าอยู่แถวบนชิดซ้าย (เหมือนแบนเนอร์หน้าอื่น) — แท็บและปุ่มวางเป็นแถวเรียงกัน ไม่ซ้อนเป็นคอลัมน์สูง ๆ */
  .tabs-header {
    flex-direction: row;
    gap: 0.5rem;
    padding: 0.6rem 1rem !important;
    text-align: left;
  }

  .header-title {
    order: 1;
    position: static;
    transform: none;
    justify-content: flex-start;
    width: 100%;
  }

  .tab-navigation {
    order: 2;
    width: 100%;
    margin-right: 0;
  }

  .tab-navigation :deep(.p-tabview-nav) {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 0.5rem;
    padding: 0;
  }

  .tab-navigation :deep(.p-tabview-nav li) {
    flex: 1 1 0;
    min-width: 0;
  }

  .tab-navigation :deep(.p-tabview-nav-link) {
    padding: 0.5rem 0.5rem;
    font-size: 0.9rem;
    margin: 0;
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .action-buttons-header {
    order: 3;
    width: 100%;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: nowrap;
  }

  .action-buttons-header .p-button {
    flex: 1 1 0;
    min-width: 0;
    padding: 0.5rem 0.5rem;
    font-size: 0.9rem;
    min-height: 2.7rem;
  }

}

@media (max-width: 480px) {
  .app-container {
    padding: 0.5rem;
  }

  .main-header h1 {
    font-size: 1.25rem;
  }

  .header-title h1 {
    font-size: 1.2rem;
  }

  .status-card {
    min-width: 100%;
  }

  .status-content {
    padding: 0.8rem;
  }

  .status-icon {
    font-size: 1.8rem;
  }

  .status-text strong {
    font-size: 1rem;
  }

  .action-buttons-header .p-button {
    font-size: max(0.85rem, var(--min-fs));
  }

  .tab-navigation :deep(.p-tabview-nav-link) {
    padding: 0.6rem 0.8rem;
    font-size: max(0.85rem, var(--min-fs));
  }

  .tab-header {
    gap: 0.5rem;
  }

  .tab-header span {
    font-size: max(0.8rem, var(--min-fs));
  }
}

/* จอเล็ก (≤480px เช่น iPhone SE 375px): แท็บ "ประวัติการใช้รถ" มี ไอคอน + ข้อความ + ป้ายจำนวน กว้างเกินช่องแท็บ (~141px) ~8px
 * และ .p-tabview-nav-link เป็น overflow:hidden → ป้ายตัวเลขท้ายแท็บโดนตัดหายไป → ลด padding/ช่องไฟ ให้ไอคอน/ป้ายคงขนาด
 * ส่วนข้อความยอมตัดด้วย … เมื่อแคบจริง ๆ (แทนที่จะตัดป้ายทิ้ง) */
@media (max-width: 480px) {
  .tab-navigation :deep(.p-tabview-nav-link) {
    padding: 0.6rem 0.4rem;
    justify-content: center;
  }

  .tab-header {
    gap: 0.35rem;
    min-width: 0;
    max-width: 100%;
  }

  .tab-header i,
  .tab-header :deep(.p-badge) {
    flex: none;
  }

  .tab-header span:not(.p-badge) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
