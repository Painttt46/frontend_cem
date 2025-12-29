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
            icon="pi pi-upload" raised>
            <Badge v-if="availableBorrows.length > 0" :value="availableBorrows.length" severity="warning" />
            แจ้งคืนรถ
          </Button>

          <Button @click="showCancelForm" :disabled="pendingBorrows.length === 0" severity="danger"
            icon="pi pi-times-circle" raised>
            ยกเลิกการจอง
            <Badge v-if="pendingBorrows.length > 0" :value="pendingBorrows.length" 
                   :style="{ backgroundColor: 'white', color: 'black', fontSize: '0.75rem', 
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
        <i class="pi pi-image" style="font-size: 4rem; color: #ccc;"></i>
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
    <Toast />
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
        project: '',
        discription: '',
        colleagues: [],
        images: []
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
    availableBorrows() {
      const currentUserName = this.getCurrentUserName()
      
      return this.records.filter(r => {
        // Must be active status (past borrow time, not returned)
        if (r.status !== 'active') return false

        // Only borrower can return
        return r.name === currentUserName
      })
    },
    pendingBorrows() {
      const currentUserName = this.getCurrentUserName()

      return this.records.filter(r => {
        // Must be pending status (future booking, not started yet)
        if (r.status !== 'pending') return false

        // Check if current user is authorized to cancel this booking
        const isBorrower = r.name === currentUserName
        const isColleague = r.colleagues && Array.isArray(r.colleagues) &&
          r.colleagues.some(colleague => {
            const colleagueName = typeof colleague === 'string' ? colleague : colleague?.name
            return colleagueName === currentUserName
          })

        return isBorrower || isColleague
      })
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
      const currentUserName = this.getCurrentUserName()
      
      return this.records.filter(r => {
        // Must be active status and user is authorized
        if (r.status !== 'active') return false

        const isBorrower = r.name === currentUserName
        const isColleague = r.colleagues && Array.isArray(r.colleagues) &&
          r.colleagues.some(colleague => {
            const colleagueName = typeof colleague === 'string' ? colleague : colleague?.name
            return colleagueName === currentUserName
          })

        return isBorrower || isColleague
      })
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
    this.loadRecords()
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
    async handleAdditionalImageUpload(event, bookingId) {
      const files = Array.from(event.target.files)
      if (files.length === 0) return

      try {
        // Find the booking record
        const booking = this.records.find(r => r.id === bookingId)
        if (!booking) return

        // Convert files to base64
        const newImages = []
        for (const file of files) {
          const reader = new FileReader()
          const base64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result)
            reader.readAsDataURL(file)
          })
          newImages.push({
            name: file.name,
            src: base64,
            type: 'เพิ่มเติม',
            timestamp: new Date(Date.now() + this.serverTimeOffset).toLocaleString('th-TH')
          })
        }

        // Update booking with new images
        const currentImages = booking.images || []
        const updatedImages = [...currentImages, ...newImages]

        // Update in database via API (need to add PUT endpoint)
        await this.$http.put(`/api/car-booking/${bookingId}`, {
          images: updatedImages
        })

        await this.loadRecords()

        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: `อัปโหลดรูปภาพ ${files.length} ไฟล์เรียบร้อย`,
          life: 3000
        })

        // Clear file input
        event.target.value = ''
      } catch { // ignore
        this.$toast.add({
          severity: 'error',
          summary: 'อัปโหลดไม่สำเร็จ',
          detail: 'ไฟล์อาจใหญ่เกินไป หรือรูปแบบไม่รองรับ',
          life: 4000
        })
      }
    },
    async submitBorrow() {
      try {
        const images = await this.convertImagesToBase64(this.borrowForm.images || [])
        const borrowData = {
          type: 'borrow',
          location: this.borrowForm.location,
          project: this.borrowForm.project,
          description: this.borrowForm.discription,
          selected_date: this.formatDateForDB(this.selectedDate),
          time: this.borrowForm.time,
          license: 'ชฮ-3706',
          colleagues: this.borrowForm.colleagues || [],
          images,
          user_id: localStorage.getItem('soc_user_id')
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
    async submitReturn() {
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
          images
        }

        await axios.put(`/api/car-booking/${borrowId}`, returnData)

        await this.loadRecords()
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
          const base64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result)
            reader.readAsDataURL(file)
          })
          newImages.push({
            name: file.name,
            src: base64,
            type: 'เพิ่มเติม',
            timestamp: new Date(Date.now() + this.serverTimeOffset).toLocaleString('th-TH')
          })
        }

        // Update booking with new images
        const currentImages = booking.images || []
        const updatedImages = [...currentImages, ...newImages]

        // Update in database via API
        await this.$http.put(`/api/car-booking/${bookingId}`, {
          images: updatedImages
        })

        await this.loadRecords()

        this.$toast.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: `อัปโหลดรูปภาพ ${files.length} ไฟล์เรียบร้อย`,
          life: 3000
        })
      } catch { // ignore
        this.$toast.add({
          severity: 'error',
          summary: 'อัปโหลดไม่สำเร็จ',
          detail: 'ไฟล์อาจใหญ่เกินไป หรือรูปแบบไม่รองรับ',
          life: 4000
        })
      }
    },
    resetForms() {
      this.borrowForm = {
        license: 'ชฮ-3706',
        time: '',
        location: '',
        project: '',
        discription: '',
        colleagues: [],
        images: []
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
.main-tabs {
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.tabs-header {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  gap: 1rem;
  flex-wrap: wrap;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.header-title h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.header-title i {
  font-size: 1.25rem;
}

.tab-navigation {
  background: transparent;
  margin-left: auto;
}

.tab-navigation :deep(.p-tabview-nav) {
  background: transparent;
  border: none;
  gap: 0.5rem;
}

.tab-navigation :deep(.p-tabview-nav-link) {
  color: rgba(255, 255, 255, 0.8);
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border-radius: var(--radius-sm);
}

.tab-navigation :deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.tab-navigation :deep(.p-tabview-ink-bar),
.tab-navigation :deep(.p-tabview-panels) {
  display: none;
}

.action-buttons-header {
  display: flex;
  gap: 0.75rem;
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-content-area {
  background: #f8f9fa;
  min-height: 400px;
}

/* Image Modal */
.image-viewer {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.image-section {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.borrow-section {
  border-color: #f5c6cb;
}

.borrow-section .section-header {
  background: #f8d7da;
  color: #721c24;
}

.return-section {
  border-color: #c3e6cb;
}

.return-section .section-header {
  background: #d4edda;
  color: #155724;
}

.section-header {
  padding: 0.75rem 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  padding: 0.75rem;
}

.image-container {
  position: relative;
}

.grid-image {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.grid-image:hover {
  transform: scale(1.02);
}

.full-size-image {
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
  border-radius: 8px;
  display: block;
  margin: 0 auto;
}

.no-images-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.upload-section {
  margin-top: 1rem;
}

.upload-controls {
  text-align: center;
  padding: 0.75rem;
}

@media (max-width: 768px) {
  .tabs-header {
    flex-direction: column;
    padding: 1rem;
    gap: 0.75rem;
  }

  .header-title {
    width: 100%;
    justify-content: center;
  }

  .header-title h1 {
    font-size: 1.1rem;
  }

  .tab-navigation {
    width: 100%;
    margin-left: 0;
  }

  .tab-navigation :deep(.p-tabview-nav) {
    justify-content: center;
  }

  .action-buttons-header {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header-title h1 {
    font-size: 1rem;
  }

  .action-buttons-header {
    flex-direction: column;
  }
}
</style>
