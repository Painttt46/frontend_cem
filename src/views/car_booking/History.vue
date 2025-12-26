<template>
  <Card class="history-card">
    <template #content>
      <div v-if="groupedRecordsWithDuration.length === 0" class="empty-state">
        <i class="pi pi-car" style="font-size: 4rem; color: #ccc;"></i>
        <p>ยังไม่มีข้อมูลการใช้รถ</p>
      </div>

      <EnhancedDataTable v-else :data="groupedRecordsWithDuration" :paginator="true" :rows="10"
        :rowsPerPageOptions="[5, 10, 20]" responsiveLayout="scroll" class="history-table" stripedRows>
        <Column field="id" header="Ticket ID" :sortable="true">
          <template #body="slotProps">
            <span class="ticket-id">{{ slotProps.data.id }}</span>
          </template>
        </Column>

        <Column field="borrowDate" header="วันที่" :sortable="true">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.borrowDate) }}
          </template>
        </Column>

        <Column field="borrowRecord.name" header="ผู้ใช้" :sortable="true">
          <template #body="slotProps">
            <span class="clickable-name" @click="showUserInfo(slotProps.data.borrowRecord.user_id)">
              {{ slotProps.data.borrowRecord.name }}
            </span>
          </template>
        </Column>
        <Column field="borrowRecord.time" header="เวลาใช้" />
        <Column field="borrowRecord.location" header="สถานที่" />
        <Column field="borrowRecord.project" header="โครงการ" />
        
        <Column header="ผู้ร่วมงาน" style="min-width: 120px;">
          <template #body="slotProps">
            <Button 
              v-if="hasColleagues(slotProps.data.borrowRecord)" 
              @click="showColleaguesDialog(slotProps.data.borrowRecord.colleagues)"
              severity="info" 
              size="small"
              outlined
            >
              <i class="pi pi-users"></i>
              <Badge :value="slotProps.data.borrowRecord.colleagues.length" severity="info" />
            </Button>
            <span v-else class="no-colleagues">
              <i class="pi pi-user-minus"></i> ไม่มี
            </span>
          </template>
        </Column>

        <Column header="ผู้คืน">
          <template #body="slotProps">
            <span v-if="slotProps.data.returned && slotProps.data.returnRecord.name" 
                  class="clickable-name" 
                  @click="showUserByName(slotProps.data.returnRecord.name)">
              {{ slotProps.data.returnRecord.name }}
            </span>
            <span v-else>-</span>
          </template>
        </Column>

        <Column header="วันที่คืน">
          <template #body="slotProps">
            <span v-if="slotProps.data.returned && slotProps.data.returnRecord.date">
              {{ formatDate(slotProps.data.returnRecord.date) }}
            </span>
            <span v-else-if="slotProps.data.returned">
              {{ formatDate(slotProps.data.borrowRecord.updated_at) }}
            </span>
            <span v-else>-</span>
          </template>
        </Column>

        <Column header="เวลาคืน">
          <template #body="slotProps">
            <span v-if="slotProps.data.returned">
              {{ slotProps.data.returnRecord.time || formatTime(slotProps.data.borrowRecord.updated_at) }}
            </span>
            <span v-else>-</span>
          </template>
        </Column>

        <Column header="สถานที่คืน">
          <template #body="slotProps">
            {{ slotProps.data.returned ? slotProps.data.returnRecord.location : '-' }}
          </template>
        </Column>

        <Column field="duration" header="ระยะเวลา" />

        <Column header="รูปภาพ">
          <template #body="slotProps">
            <i v-if="(slotProps.data.borrowRecord.images?.length > 0) || (slotProps.data.returned && slotProps.data.returnRecord.images?.length > 0)" 
               class="pi pi-eye view-icon" 
               @click="viewImages(slotProps.data)"></i>
            <span v-else>-</span>
          </template>
        </Column>

        <Column header="ข้อมูลเพิ่มเติม">
          <template #body="slotProps">
            <Button 
              v-if="slotProps.data.borrowRecord.discription" 
              icon="pi pi-info-circle" 
              severity="info" 
              text 
              rounded 
              size="small"
              @click="viewDescription(slotProps.data.borrowRecord.discription)"
              v-tooltip="'ดูข้อมูลเพิ่มเติม'"
            />
            <span v-else class="no-description">-</span>
          </template>
        </Column>

        <Column header="สถานะ">
          <template #body="slotProps">
            <Badge v-if="slotProps.data.returned" value="คืนแล้ว" severity="success" icon="pi pi-check" />
            <Badge v-else-if="isWaitingToUse(slotProps.data)" value="รอใช้งาน" severity="info" icon="pi pi-clock" />
            <Badge v-else value="ยังไม่คืน" severity="warning" icon="pi pi-clock" />
          </template>
        </Column>
      </EnhancedDataTable>
    </template>
  </Card>

  <!-- Colleagues Dialog -->
  <Dialog v-model:visible="showColleaguesModal" modal header="รายชื่อผู้ร่วมงาน" :style="{ width: '90vw', maxWidth: '600px' }" :draggable="false">
    <div class="colleagues-list">
      <div v-for="(colleague, index) in selectedColleagues" :key="index" class="colleague-card clickable-card" @click="showColleagueInfo(colleague)">
        <div class="colleague-details">
          <div class="colleague-name">
            {{ getColleagueName(colleague) }}
          </div>
          <div v-if="getColleaguePosition(colleague) || getColleagueDepartment(colleague)" class="colleague-info">
            <span v-if="getColleaguePosition(colleague)" class="position">{{ getColleaguePosition(colleague) }}</span>
            <span v-if="getColleagueDepartment(colleague)" class="department">{{ getColleagueDepartment(colleague) }}</span>
          </div>
        </div>
      </div>
    </div>
  </Dialog>

  <!-- Description Dialog -->
  <Dialog v-model:visible="showDescriptionModal" modal header="ข้อมูลเพิ่มเติม" :style="{ width: '90vw', maxWidth: '500px' }" :draggable="false">
    <div class="description-content">
      <p>{{ selectedDescription }}</p>
    </div>
  </Dialog>

  <UserInfoDialog v-model:visible="showUserDialog" :userId="selectedUserId" :userName="selectedUserName" />
</template>

<script>
import UserInfoDialog from '@/components/UserInfoDialog.vue'
import EnhancedDataTable from '@/components/EnhancedDataTable.vue'

export default {
  name: 'CarHistory',
  components: {
    UserInfoDialog,
    EnhancedDataTable
  },
  props: {
    records: Array
  },
  data() {
    return {
      showColleaguesModal: false,
      selectedColleagues: [],
      showDescriptionModal: false,
      selectedDescription: '',
      showUserDialog: false,
      selectedUserId: null,
      selectedUserName: null
    }
  },
  computed: {
    groupedRecords() {
      if (!this.records || !Array.isArray(this.records)) return []
      
      const borrowRecords = this.records.filter(r => r && r.status !== undefined)
      const groups = borrowRecords.map(borrow => {
        const returned = borrow.status === 'returned'
        const imgs = borrow.images || {}
        const borrowImages = Array.isArray(imgs) ? imgs : (imgs.borrow || [])
        const returnImages = imgs.return || []
        return {
          id: borrow.id,
          license: borrow.license,
          borrowDate: borrow.selected_date,
          borrowRecord: { ...borrow, images: borrowImages },
          returnRecord: returned ? {
            name: borrow.return_name,
            location: borrow.return_location,
            time: borrow.return_time,
            date: borrow.return_date,
            created_at: borrow.updated_at,
            images: returnImages
          } : null,
          returned: returned
        }
      })
      return groups.sort((a, b) => b.id - a.id)
    },
    groupedRecordsWithDuration() {
      return this.groupedRecords.map(group => {
        let duration = 'ยังไม่คืน'
        if (group.returned) {
          const borrowDate = new Date(group.borrowDate)
          const [borrowHour, borrowMin] = group.borrowRecord.time.split(':').map(Number)
          const borrowTime = new Date(borrowDate)
          borrowTime.setHours(borrowHour, borrowMin, 0, 0)

          const returnTime = group.returnRecord.created_at
            ? new Date(group.returnRecord.created_at)
            : new Date()

          const diffMs = returnTime - borrowTime
          if (diffMs > 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
            if (diffHours > 0) {
              duration = `${diffHours} ชั่วโมง ${diffMinutes} นาที`
            } else {
              duration = `${diffMinutes} นาที`
            }
          } else {
            duration = 'ข้อมูลเวลาไม่ถูกต้อง'
          }
        }
        return { ...group, duration }
      })
    }
  },
  methods: {
    showUserInfo(userId) {
      if (userId) {
        this.selectedUserId = userId
        this.showUserDialog = true
      }
    },
    showUserByName(name) {
      if (name) {
        this.selectedUserId = null
        this.selectedUserName = name
        this.showUserDialog = true
      }
    },

    showColleagueInfo(colleague) {
      // colleague อาจเป็น object {id, name, value} หรือ string (ชื่อ)
      if (typeof colleague === 'object') {
        // ถ้ามี id ใช้ id
        if (colleague.id) {
          this.selectedUserId = colleague.id
          this.showUserDialog = true
        } else {
          // ถ้าไม่มี id ใช้ name หรือ value
          const name = colleague.name || colleague.value
          if (name) {
            this.selectedUserId = null
            this.selectedUserName = name
            this.showUserDialog = true
          }
        }
      } else if (typeof colleague === 'string') {
        // ถ้าเป็น string ค้นหาจากชื่อ
        this.selectedUserId = null
        this.selectedUserName = colleague
        this.showUserDialog = true
      }
    },

    showColleaguesDialog(colleagues) {
      this.selectedColleagues = colleagues || []
      this.showColleaguesModal = true
    },
    
    hasColleagues(record) {
      return record.colleagues && Array.isArray(record.colleagues) && record.colleagues.length > 0
    },
    
    getColleagueName(colleague) {
      if (typeof colleague === 'string') return colleague
      return colleague?.name || colleague
    },
    
    getColleaguePosition(colleague) {
      if (typeof colleague === 'string') return ''
      return colleague?.position || ''
    },
    
    getColleagueDepartment(colleague) {
      if (typeof colleague === 'string') return ''
      return colleague?.department || ''
    },
    
    formatTime(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    },
    canUploadImages(group) {
      return group.borrowRecord.status === 'active'
    },
    handleImageUpload(event, bookingId) {
      const files = Array.from(event.target.files)
      if (files.length === 0) return

      this.$emit('upload-images', { files, bookingId })
      
      // Clear file input
      event.target.value = ''
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    hasImages(data) {
      return (data.borrowRecord.images?.length > 0) ||
        (data.returned && data.returnRecord.images?.length > 0)
    },
    isWaitingToUse(data) {
      const now = new Date()
      const borrowDate = new Date(data.borrowDate)
      const [hour, minute] = data.borrowRecord.time.split(':').map(Number)
      const borrowDateTime = new Date(borrowDate)
      borrowDateTime.setHours(hour, minute, 0, 0)
      
      // If current time is before booking time, show "รอใช้งาน"
      return now < borrowDateTime
    },
    viewImages(data) {
      const images = []
      if (data.borrowRecord.images?.length > 0) {
        images.push(...data.borrowRecord.images.map(img => ({ src: img, type: 'ใช้รถ' })))
      }
      if (data.returned && data.returnRecord.images?.length > 0) {
        images.push(...data.returnRecord.images.map(img => ({ src: img, type: 'คืนรถ' })))
      }
      this.$emit('view-images', images, data)
    },
    
    viewDescription(description) {
      this.selectedDescription = description
      this.showDescriptionModal = true
    }
  }
}
</script>

<style scoped>
.colleagues-compact {
  padding: 0.25rem;
}

.colleagues-names {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.colleague-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.25rem 0.375rem;
}

.colleague-name {
  font-weight: 600;
  color: #495057;
  font-size: 0.75rem;
  margin-bottom: 0.125rem;
}

.colleague-info {
  color: #6c757d;
  font-size: 0.65rem;
  line-height: 1.2;
}

.no-colleagues {
  color: #a0aec0;
  font-size: 0.75rem;
  text-align: center;
}

.no-colleagues i {
  font-size: 0.8rem;
  margin-right: 0.25rem;
}

.colleagues-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 450px;
  overflow-y: auto;
}

.colleague-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.clickable-card {
  cursor: pointer;
}

.clickable-card:hover {
  background: #e3f2fd;
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}


.colleague-avatar {
  width: 50px;
  height: 50px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.colleague-details {
  flex: 1;
}

.colleague-name {
  font-weight: 600;
  color: #495057;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.colleague-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.position {
  color: #6c757d;
  font-size: 0.95rem;
  font-weight: 500;
}

.department {
  color: #868e96;
  font-size: 0.9rem;
}
</style>
<style scoped>
.history-card {
  width: 100%;
  margin: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.card-header {
  background: #87CEEB;
  color: white;
  padding: 1.5rem;
  text-align: center;
  border-radius: 8px 8px 0 0;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.card-header i {
  margin-right: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 1rem;
}

.empty-state p {
  margin-top: 1rem;
  font-size: 1.1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.history-table :deep(.p-datatable) {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.history-table :deep(.p-datatable-header) {
  background: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  padding: 1rem;
}

.history-table :deep(.p-datatable-thead > tr > th) {
  background: #f8f9fa;
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  padding: 1rem 0.75rem;
  font-size: 0.9rem;
}

.history-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #f1f3f4;
  vertical-align: middle;
  text-align: center;
}

.history-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f8f9fa;
}

.history-table :deep(.p-paginator) {
  background: #f8f9fa;
  border-top: 2px solid #e9ecef;
  padding: 1rem;
}

.history-table :deep(.p-badge) {
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  white-space: normal;
  text-align: center;
  line-height: 1.2;
}

.view-icon {
  font-size: 1.2rem;
  color: #667eea;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-icon:hover {
  color: #5a67d8;
  transform: scale(1.1);
}

.ticket-id {
  font-weight: 600;
  color: #495057;
  padding: 0.25rem 0.5rem;
  background: #e3f2fd;
  border-radius: 4px;
  border: 1px solid #bbdefb;
}

@media (max-width: 768px) {
  .history-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }
}

.description-content {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.description-content p {
  margin: 0;
  line-height: 1.6;
  color: #495057;
}

.no-description {
  color: #6c757d;
  font-style: italic;
}

.clickable-name {
  cursor: pointer;
  color: #667eea;
  font-weight: 600;
  transition: all 0.2s;
}

.clickable-name:hover {
  color: #764ba2;
  text-decoration: underline;
}
</style>
