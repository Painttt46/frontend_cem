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
      <Dialog v-model:visible="showCarDialog" modal header="🚗 รายละเอียดการใช้รถ" :style="{ width: '90vw', maxWidth: '500px' }"
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
      <Dialog v-model:visible="showBookingDialog" modal header="📅 รายละเอียดการจองรถ" :style="{ width: '90vw', maxWidth: '500px' }"
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
.calendar-container {
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  margin: 1rem;
}

.calendar-header {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.month-title-container {
  text-align: center;
  flex: 1;
}

.month-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.calendar-subtitle {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-top: 1px solid var(--border-color);
}

.day-header {
  background: #f8f9fa;
  color: #495057;
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.85rem;
  border-bottom: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
}

.day-header:last-child {
  border-right: none;
}

.calendar-day {
  background: white;
  padding: 0.5rem;
  text-align: center;
  cursor: pointer;
  position: relative;
  border: 1px solid var(--border-color);
  border-top: none;
  border-left: none;
  font-size: 0.95rem;
  font-weight: 500;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 0.5rem;
  color: var(--text-primary);
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.calendar-day:hover {
  background: #f0f7ff;
}

.calendar-day.other-month {
  background: #fafafa;
  color: #bbb;
  cursor: default;
}

.calendar-day.today {
  background: var(--primary-color);
  color: white;
  font-weight: 600;
}

.calendar-day.has-booking {
  background: #e8f5e9;
  border-color: #c8e6c9;
}

.calendar-day.active-usage {
  background: #fff8e1;
  border-color: #ffecb3;
}

.calendar-day.past-date {
  background: #fafafa;
  color: #bbb;
  cursor: default;
}

.booking-indicator {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
}

.booking-text-center {
  margin-top: auto;
  padding-bottom: 0.25rem;
}

.booking-text {
  font-size: 0.7rem;
  font-weight: 600;
  color: #2e7d32;
  background: #c8e6c9;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.car-indicator {
  margin-top: auto;
  padding-bottom: 0.25rem;
}

.car-indicator p {
  font-size: 0.65rem;
  margin: 0;
  color: #f57c00;
  font-weight: 600;
}

/* Dialog Styles */
.car-header,
.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}

.booking-header {
  background: linear-gradient(135deg, #43a047, #2e7d32);
}

.car-plate-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
}

.details-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: var(--radius-md);
  border-left: 3px solid var(--primary-color);
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.detail-value {
  font-weight: 500;
  color: var(--text-primary);
}

.dialog-footer {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
}

@media (max-width: 768px) {
  .calendar-container {
    margin: 0.5rem;
  }

  .calendar-header {
    padding: 1rem;
  }

  .month-title {
    font-size: 1.2rem;
  }

  .nav-btn {
    width: 2rem;
    height: 2rem;
  }

  .day-header {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
  }

  .calendar-day {
    min-height: 60px;
    font-size: 0.85rem;
    padding: 0.25rem;
  }
}
</style>
