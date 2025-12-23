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
          :class="['image-section', imageType.type === 'ใช้' ? 'borrow-section' : 'return-section']">
          <div class="section-header">
            <i :class="imageType.type === 'ใช้' ? 'pi pi-download' : 'pi pi-upload'"></i>
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
        license: 'FXAG-2032',
        time: '',
        location: '',
        project: '',
        discription: '',
        colleagues: [],
        images: []
      },
      returnForm: {
        borrowId: '',
        license: 'FXAG-2032',
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
      notifiedActiveBookings: new Set()
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

        // Check if current user is authorized to return this booking
        const isBorrower = r.name === currentUserName
        const isColleague = r.colleagues && Array.isArray(r.colleagues) &&
          r.colleagues.some(colleague => {
            const colleagueName = typeof colleague === 'string' ? colleague : colleague?.name
            return colleagueName === currentUserName
          })

        return isBorrower || isColleague
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
    
    setInterval(() => {
      this.currentTime = new Date(Date.now() + this.serverTimeOffset)
    }, 1000)
    
    setInterval(() => {
      this.loadRecords()
    }, 30000)
    
    setInterval(() => {
      this.syncServerTime()
    }, 300000)
  },
  created() {
    this.$http = axios
    this.loadRecords()
  },
  methods: {
    async syncServerTime() {
      try {
        const response = await axios.get('/api/server-time')
        const serverTime = new Date(response.data.serverTime)
        const clientTime = new Date()
        this.serverTimeOffset = serverTime.getTime() - clientTime.getTime()
        this.currentTime = new Date(Date.now() + this.serverTimeOffset)
        console.log('[Time Sync] Server time:', serverTime.toLocaleString('th-TH'))
        console.log('[Time Sync] Offset:', this.serverTimeOffset, 'ms')
      } catch (error) {
        console.error('Failed to sync server time:', error)
      }
    },
    getCurrentUserName() {
      const firstName = localStorage.getItem('soc_firstname') || ''
      const lastName = localStorage.getItem('soc_lastname') || ''
      return `${firstName} ${lastName}`.trim()
    },
    async loadRecords() {
      try {
        const response = await axios.get('/api/car-booking')
        this.records = response.data
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถโหลดข้อมูลการจองรถได้',
          life: 3000
        })
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
        summary: 'เกิดข้อผิดพลาด',
        detail: 'ไม่สามารถโหลดรูปภาพได้',
        life: 3000
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
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถอัปโหลดรูปภาพได้',
          life: 3000
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
          license: 'FXAG-2032',
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
      } catch (error) {
        
        // Handle conflict error (409)
        if (error.response?.status === 409) {
          this.$toast.add({
            severity: 'warn',
            summary: 'ไม่สามารถจองได้',
            detail: error.response.data.details || error.response.data.error,
            life: 5000
          })
        } else {
          this.$toast.add({
            severity: 'error',
            summary: 'เกิดข้อผิดพลาด',
            detail: 'ไม่สามารถบันทึกการจองได้',
            life: 3000
          })
        }
      }
    },
    async submitReturn() {
      const borrowId = this.returnForm.borrowId || this.$refs.bookingForm?.selectedReturnBorrow

      if (!borrowId) {
        this.$toast.add({ severity: 'error', summary: 'ข้อผิดพลาด', detail: 'กรุณาเลือกการแจ้งใช้รถที่ต้องการคืน', life: 3000 })
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
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถบันทึกการคืนรถได้',
          life: 3000
        })
      }
    },
    async submitCancel() {

      if (!this.cancelForm.borrowId) {
        this.$toast.add({ severity: 'error', summary: 'ข้อผิดพลาด', detail: 'กรุณาเลือกการจองที่ต้องการยกเลิก', life: 3000 })
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
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถยกเลิกการจองได้',
          life: 3000
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
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'เกิดข้อผิดพลาด',
          detail: 'ไม่สามารถอัปโหลดรูปภาพได้',
          life: 3000
        })
      }
    },
    resetForms() {
      this.borrowForm = {
        license: 'FXAG-2032',
        time: '',
        location: '',
        project: '',
        discription: '',
        colleagues: [],
        images: []
      }
      this.returnForm = {
        borrowId: '',
        license: 'FXAG-2032',
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.app-container {
  padding: 1rem;
  padding-bottom: 0;
  max-width: 100%;
  margin: 0 auto;
  margin-left: 0.5%;
  background: #e5e7eb;
  height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: auto;
}

.main-tabs {
  margin-top: 0;
  box-shadow: 0 4px 20px rgba(74, 144, 226, 0.15);
  border-radius: 15px;
  overflow: hidden;
  border: 1px solid rgba(74, 144, 226, 0.2);
  background: white;
}

.tabs-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  position: relative;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  border-bottom: none !important;
}

.tab-navigation :deep(.p-tabview-nav-link:hover) {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
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
  font-weight: 700;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  border-radius: 8px;
  min-width: 140px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 3px solid white;
}

.action-buttons-header .p-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 3px solid white;
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
  padding: 0.5rem;
  gap: 0.5rem;
}

.main-tabs :deep(.p-tabview-nav-link) {
  color: black !important;
  border: none;
  font-weight: 800 !important;
  padding: 1rem 1.5rem;
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
  color: #4A90E2;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  transform: translateY(-2px);
  border-bottom: none !important;
  font-weight: 700;
  border-radius: 8px;
}

.main-tabs :deep(.p-tabview-nav-link:hover) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
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
  border: 2px solid #28a745;
}

.borrow-section .section-header {
  background: #d4edda;
  color: #155724;
  border-bottom: 1px solid #c3e6cb;
}

.return-section {
  border: 2px solid #ffc107;
}

.return-section .section-header {
  background: #fff3cd;
  color: #856404;
  border-bottom: 1px solid #ffeaa7;
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
  object-fit: cover;
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
  color: #6c757d;
}

.grid-image:hover {
  transform: scale(1.05);
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
  color: #6c757d;
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

  .tabs-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    text-align: center;
  }

  .header-title {
    order: 1;
    position: static;
    transform: none;
    justify-content: center;
    width: 100%;
  }

  .tab-navigation {
    order: 2;
    width: 100%;
    margin-right: 0;
  }

  .tab-navigation :deep(.p-tabview-nav) {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .tab-navigation :deep(.p-tabview-nav-link) {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    margin: 0;
    width: 100%;
    text-align: center;
  }

  .action-buttons-header {
    order: 3;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .action-buttons-header {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .action-buttons-header .p-button {
    flex: 1;
    font-size: 0.9rem;
    padding: 0.75rem 1rem;
    min-width: auto;
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

  .action-buttons-header {
    flex-direction: column;
    gap: 0.8rem;
  }

  .action-buttons-header .p-button {
    width: 100%;
    font-size: 0.85rem;
    padding: 0.75rem;
  }

  .tab-navigation :deep(.p-tabview-nav-link) {
    padding: 0.6rem 0.8rem;
    font-size: 0.8rem;
  }

  .tab-header {
    gap: 0.5rem;
  }

  .tab-header span {
    font-size: 0.8rem;
  }
}
</style>
