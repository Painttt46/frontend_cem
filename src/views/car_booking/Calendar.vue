<template>
  <Card>
    <template #content>
      <div class="calendar-header">
        <button @click="previousMonth" class="nav-btn">
          <i class="pi pi-chevron-left"></i>
        </button>
        <div class="month-title-container">
          <h2 class="month-title">{{ monthYear }}</h2>
          <div class="calendar-subtitle">ปฏิทินการใช้รถ</div>
        </div>
        <button @click="nextMonth" class="nav-btn">
          <i class="pi pi-chevron-right"></i>
        </button>
      </div>
      <div class="calendar-container">
        <div class="calendar">
          <div class="day-header" v-for="day in dayNames" :key="day">{{ day }}</div>
          <div v-for="date in calendarDates" :key="date.key" :class="['calendar-day', {
            'other-month': !date.isCurrentMonth,
            'has-booking': hasBookingOnDate(date.date),
            'active-usage': isActiveUsage(date.date),
            'today': isToday(date.date),
            'past-date': isPastDate(date.date)
          }]" @click="selectDate(date.date)">
            {{ date.day }}
            <div v-if="hasBookingOnDate(date.date) && !isActiveUsage(date.date)" class="booking-indicator">
              <span class="booking-emoji">📅</span>
            </div>
            <div v-if="hasBookingOnDate(date.date) && !isActiveUsage(date.date)" class="booking-text-center">
              <div class="booking-text">จองเเล้ว</div>
            </div>



            <div v-if="isActiveUsage(date.date)" class="car-indicator">

              <div>

                <span class="car-emoji">🚗</span>
              </div>
              <div>
                <p>กําลังใช้งาน</p>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- Car Details Dialog -->
      <Dialog v-model:visible="showCarDialog" modal header="🚗 รายละเอียดการใช้รถ" :style="{ width: '450px' }"
        :draggable="false" :closable="false">
        <div v-if="selectedCarRecord" class="car-details">
          <div class="car-header">
            <div class="car-plate-display">
              <i class="pi pi-car"></i>
              <span>FXAG-2032</span>
            </div>
            <div class="status-badge">
              <i class="pi pi-circle-fill"></i>
              กำลังใช้งาน
            </div>
          </div>

          <div class="details-grid">
            <div class="detail-row">
              <div class="detail-label">
                <i class="pi pi-user"></i>
                ผู้ใช้งาน
              </div>
              <div class="detail-value">
                {{ selectedCarRecord.user_name || selectedCarRecord.username || selectedCarRecord.name || 'ไม่ระบุ' }}
              </div>
            </div>

            <div class="detail-row">
              <div class="detail-label">
                <i class="pi pi-calendar"></i>
                วันที่ใช้งาน
              </div>
              <div class="detail-value">
                {{ formatDate(selectedCarRecord.selected_date) }}
              </div>
            </div>

            <div class="detail-row">
              <div class="detail-label">
                <i class="pi pi-clock"></i>
                เวลา
              </div>
              <div class="detail-value">
                {{ selectedCarRecord.time || 'ไม่ระบุ' }}
              </div>
            </div>

            <div class="detail-row">
              <div class="detail-label">
                <i class="pi pi-briefcase"></i>
                โครงการ
              </div>
              <div class="detail-value">
                {{ selectedCarRecord.project || 'ไม่ระบุ' }}
              </div>
            </div>

            <div v-if="selectedCarRecord.colleagues?.length > 0" class="detail-row">
              <div class="detail-label">
                <i class="pi pi-users"></i>
                ผู้ร่วมงาน
              </div>
              <div class="detail-value">
                {{ formatColleagues(selectedCarRecord.colleagues) }}
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="dialog-footer">
            <Button label="ปิด" icon="pi pi-times" @click="showCarDialog = false" class="p-button-secondary" />
          </div>
        </template>
      </Dialog>

      <!-- Booking Details Dialog -->
      <Dialog v-model:visible="showBookingDialog" modal header="📅 รายละเอียดการจองรถ" :style="{ width: '450px' }"
        :draggable="false" :closable="false">
        <div v-if="selectedCarRecord" class="car-details">
          <div class="booking-header">
            <div class="car-plate-display">
              <i class="pi pi-calendar"></i>
              <span>FXAG-2032</span>
            </div>
            <div class="status-badge booking-status">
              <i class="pi pi-clock"></i>
              จองแล้ว
            </div>
          </div>

          <div class="details-grid">
            <div class="detail-row">
              <div class="detail-label">
                <i class="pi pi-user"></i>
                ผู้จอง
              </div>
              <div class="detail-value">
                {{ selectedCarRecord.user_name || selectedCarRecord.username || selectedCarRecord.name || 'ไม่ระบุ' }}
              </div>
            </div>

            <div class="detail-row">
              <div class="detail-label">
                <i class="pi pi-calendar"></i>
                วันที่จอง
              </div>
              <div class="detail-value">
                {{ formatDate(selectedCarRecord.selected_date) }}
              </div>
            </div>

            <div class="detail-row">
              <div class="detail-label">
                <i class="pi pi-clock"></i>
                เวลา
              </div>
              <div class="detail-value">
                {{ selectedCarRecord.time || 'ไม่ระบุ' }}
              </div>
            </div>

            <div class="detail-row">
              <div class="detail-label">
                <i class="pi pi-briefcase"></i>
                โครงการ
              </div>
              <div class="detail-value">
                {{ selectedCarRecord.project || 'ไม่ระบุ' }}
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="dialog-footer">
            <Button label="ปิด" icon="pi pi-times" @click="showBookingDialog = false" class="p-button-secondary" />
          </div>
        </template>
      </Dialog>
    </template>
  </Card>
</template>

<script>
export default {
  name: 'CarCalendar',
  props: {
    records: Array,
    availableBorrows: Array,
    pendingBorrows: Array,
    hasActiveBorrow: Boolean
  },
  data() {
    return {
      currentDate: new Date(),
      dayNames: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
      showCarDialog: false,
      showBookingDialog: false,
      selectedCarRecord: null
    }
  },
  computed: {
    monthYear() {
      return this.currentDate.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long'
      })
    },
    calendarDates() {
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth()

      const firstDay = new Date(year, month, 1)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())

      const dates = []
      const currentDate = new Date(startDate)

      for (let i = 0; i < 42; i++) {
        dates.push({
          date: new Date(currentDate),
          day: currentDate.getDate(),
          isCurrentMonth: currentDate.getMonth() === month,
          key: `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }

      return dates
    }
  },
  methods: {
    formatColleagues(colleagues) {
      if (!colleagues?.length) return '-'
      return colleagues.map(c => typeof c === 'object' ? (c.name || c.value) : c).join(', ')
    },
    previousMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1)
    },
    nextMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1)
    },
    selectDate(date) {
      if (this.isActiveUsage(date)) {
        this.showCarDetails(date)
      } else if (this.hasBookingOnDate(date)) {
        this.showBookingDetails(date)
      } else if (!this.isPastDate(date) && !this.hasBookingOnDate(date)) {
        this.$emit('select-date', date)
      }
    },
    showCarDetails(date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)

      if (checkDate.getTime() !== today.getTime()) return

      const activeBooking = this.records.find(r => r.status === 'active')
      if (activeBooking) {
        this.selectedCarRecord = activeBooking
        this.showCarDialog = true
      }
    },
    showBookingDetails(date) {
      const dateStr = date.toDateString()
      const borrowRecord = this.records.find(r =>
        (r.status === 'pending' || r.status === 'active') &&
        new Date(r.selected_date).toDateString() === dateStr
      )

      if (borrowRecord) {
        this.selectedCarRecord = borrowRecord
        this.showBookingDialog = true
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('th-TH')
    },
    isPastDate(date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)
      return checkDate < today
    },
    hasBookingOnDate(date) {
      const dateStr = date.toDateString()

      return this.records.some(r =>
        (r.status === 'pending' || r.status === 'active') &&
        new Date(r.selected_date).toDateString() === dateStr
      )
    },
    isActiveUsage(date) {
      // Find active booking
      const activeBooking = this.records.find(r => r.status === 'active')
      if (!activeBooking) return false

      const borrowDate = new Date(activeBooking.selected_date)
      const today = new Date()

      // If there's a return_date, use it as end date
      let endDate
      if (activeBooking.return_date) {
        endDate = new Date(activeBooking.return_date)
      } else {
        // If no return date, only show up to today (no future dates)
        endDate = today
      }

      // Show active status from borrow date to end date (but not beyond today)
      return date >= borrowDate && date <= endDate && date <= today
    },
    isToday(date) {
      const today = new Date()
      return date.toDateString() === today.toDateString()
    }
  }
}
</script>

<style scoped>
.status-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

@keyframes carMove {

  0%,
  100% {
    transform: translateX(0);
  }

  50% {
    transform: translateX(10px);
  }
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.car-plate {
  background: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: bold;
  display: inline-block;
  width: fit-content;
}

.calendar-container {
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 2rem 0 0 0;
  width: 100%;
}

.calendar-header {
  background: linear-gradient(135deg, #4A90E2 0%, #D73527 100%);
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
}

.month-title-container {
  text-align: center;
  flex: 1;
}

.month-title {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.calendar-subtitle {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 0.25rem;
  font-weight: 400;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #f0f0f0;
  padding: 1px;
  height: calc(80vh - 120px);
}

.day-header {
  background: #6c757d;
  color: white;
  padding: 1rem 0.5rem;
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.calendar-day {
  background: #f8f9fa;
  padding: 0.5rem;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s ease;
  border: 2px solid transparent;
  font-size: 1.2rem;
  font-weight: 500;
  min-height: 60px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.75rem;
  color: #212529;
}

.calendar-day:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.calendar-day.other-month {
  background: #f1f3f4;
  color: #9aa0a6;
  cursor: not-allowed;
}

.calendar-day.today {
  background: #007bff;
  color: white;
  font-weight: bold;
}

.calendar-day.has-booking {
  background: #d4edda;
  border-color: #28a745;
}

.calendar-day.active-usage {
  background: #fff3cd;
  border-color: #ffc107;
  color: #856404;
  font-weight: 600;
}

.calendar-day.past-date {
  background: #f1f3f4;
  color: #9aa0a6;
  cursor: not-allowed;
}

.booking-indicator {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
}

.booking-text-center {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.booking-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: #5f5f5f;
  margin-top: 0.1rem;
  text-align: center;
}

.booking-emoji {
  font-size: 1.3rem;
  animation: bookingPulse 2s ease-in-out infinite;
}

@keyframes bookingPulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.booking-status {
  background: rgba(255, 255, 255, 0.2);
}

.booked-dot {
  width: 8px;
  height: 8px;
  background: #ff5722;
  border-radius: 50%;
  display: block;
}

.car-indicator {
  position: absolute;
  bottom: 2rem;
  left: 0;
  right: 0;
  overflow: visible;
  height: 20px;
}

.car-emoji {
  font-size: 1em;
  animation: carSlide 1.5s linear infinite;
  display: inline-block;
}

@keyframes carSlide {
  0% {
    transform: translateX(120%);
  }

  100% {
    transform: translateX(-120%);
  }
}

@media (max-width: 768px) {
  .calendar-container {
    margin: 1rem 0 0 0;
  }

  .calendar-header {
    padding: 1rem;
  }

  .month-title {
    font-size: 1.2rem;
  }

  .nav-btn {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1rem;
  }

  .calendar {
    height: calc(60vh - 80px);
  }

  .day-header {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .calendar-day {
    padding: 0.8rem 0.5rem;
    font-size: 0.9rem;
  }

  .booking-indicator {
    top: 0.3rem;
    right: 0.3rem;
  }

  .booked-dot {
    width: 6px;
    height: 6px;
  }
}

@media (max-width: 480px) {
  .calendar-header {
    padding: 0.8rem;
  }

  .month-title {
    font-size: 1rem;
  }

  .nav-btn {
    width: 2rem;
    height: 2rem;
    font-size: 0.9rem;
  }

  .calendar {
    height: calc(50vh - 60px);
  }

  .day-header {
    padding: 0.4rem;
    font-size: 0.7rem;
  }

  .calendar-day {
    padding: 0.6rem 0.3rem;
    font-size: 0.8rem;
  }
}

.car-details {
  padding: 0;
}

.car-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.car-plate-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  font-weight: bold;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
}

.status-badge .pi-circle-fill {
  color: #28a745;
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.details-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #4A90E2;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #495057;
  min-width: 120px;
}

.detail-value {
  font-weight: 500;
  color: #212529;
  text-align: right;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
}

.detail-item {
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.status-active {
  color: #ffc107;
  font-weight: bold;
}
</style>
