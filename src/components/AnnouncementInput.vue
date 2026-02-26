<template>
  <div class="announcement-input-container">
    <button 
      class="announcement-toggle-btn"
      @click="toggleInput"
      :class="{ 'active': isExpanded }"
    >
      <i :class="isExpanded ? 'pi pi-times' : 'pi pi-megaphone'"></i>
    </button>
    
    <transition name="slide-up">
      <div v-if="isExpanded" class="announcement-input-panel">

        <div class="input-header">
          <div class="header-avatar">📢</div>
          <h3>เพิ่มข้อความประกาศ</h3>
        </div>

        <div class="input-form">

          <!-- Chat preview -->
          <div class="chat-preview" v-if="newAnnouncement.text">
            <span class="chat-icon">{{ newAnnouncement.icon }}</span>
            <div class="chat-body">
              <span class="chat-text">{{ newAnnouncement.text }}</span>
              <span v-if="senderDisplayName" class="chat-sender">— {{ senderDisplayName }}</span>
            </div>
          </div>

          <!-- ข้อความ -->
          <div class="form-group">
            <label>ข้อความ</label>
            <textarea 
              v-model="newAnnouncement.text"
              placeholder="กรอกข้อความประกาศ..."
              class="message-textarea"
              rows="3"
            ></textarea>
          </div>

          <!-- ชื่อผู้ส่ง -->
          <div class="form-group">
            <label>ชื่อผู้ส่ง <span class="label-optional">(ไม่บังคับ)</span></label>
            <input
              v-model="senderDisplayName"
              class="field-input"
              placeholder="ชื่อที่จะแสดงบน banner..."
            />
          </div>

          <!-- icon + type -->
          <div class="form-row">
            <div class="form-group">
              <label>ไอคอน</label>
              <select v-model="newAnnouncement.icon" class="field-select">
                <option value="📢">📢 ประกาศ</option>
                <option value="⚠️">⚠️ เตือน</option>
                <option value="✨">✨ ใหม่</option>
                <option value="🚀">🚀 อัปเดต</option>
                <option value="📅">📅 กำหนดการ</option>
                <option value="🎉">🎉 สำเร็จ</option>
              </select>
            </div>
            <div class="form-group">
              <label>ประเภท</label>
              <select v-model="newAnnouncement.type" class="field-select">
                <option value="">ปกติ</option>
                <option value="highlight">โดดเด่น</option>
                <option value="warning">เตือน</option>
                <option value="info">ข้อมูล</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button @click="clearForm" class="clear-btn">ล้าง</button>
            <button 
              @click="submitAnnouncement"
              class="submit-btn"
              :disabled="!newAnnouncement.text.trim() || isSubmitting"
            >
              <i class="pi pi-send"></i>
              <span>{{ isSubmitting ? 'กำลังบันทึก...' : 'ส่งประกาศ' }}</span>
            </button>
          </div>

        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useToast } from 'primevue/usetoast'

/* global defineEmits */
const emit = defineEmits(['message-added'])
const toast = useToast()

const isExpanded = ref(false)
const isSubmitting = ref(false)

// auto-fill ชื่อจาก localStorage
const firstname = localStorage.getItem('soc_firstname') || ''
const lastname = localStorage.getItem('soc_lastname') || ''
const senderDisplayName = ref(
  [firstname, lastname].filter(Boolean).join(' ') || localStorage.getItem('soc_user') || ''
)

const newAnnouncement = ref({
  icon: '📢',
  text: '',
  type: ''
})

const toggleInput = () => {
  isExpanded.value = !isExpanded.value
  if (!isExpanded.value) {
    clearForm()
  }
}

const clearForm = () => {
  newAnnouncement.value = { icon: '📢', text: '', type: '' }
}

const submitAnnouncement = async () => {
  if (!newAnnouncement.value.text.trim()) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูล', detail: 'กรุณากรอกข้อความประกาศ', life: 3000 })
    return
  }

  isSubmitting.value = true

  try {
    await axios.post('/api/banner', {
      text: newAnnouncement.value.text,
      type: newAnnouncement.value.type || 'info',
      icon: newAnnouncement.value.icon,
      sender_name: senderDisplayName.value.trim() || null
    })

    toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'บันทึกข้อความประกาศเรียบร้อยแล้ว', life: 3000 })
    emit('message-added')
    clearForm()

    setTimeout(() => { isExpanded.value = false }, 1500)
  } catch (error) {
    console.error('Error submitting announcement:', error)
    toast.add({ severity: 'error', summary: 'เกิดข้อผิดพลาด', detail: error.userMessage || 'ไม่สามารถบันทึกข้อความได้ กรุณาลองใหม่', life: 4000 })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.announcement-input-container {
  position: fixed;
  bottom: 90px;
  right: 24px;
  z-index: 1000;
}

.announcement-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border: none;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  cursor: pointer;
  font-size: 20px;
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.announcement-toggle-btn:hover { transform: scale(1.1); box-shadow: 0 8px 25px rgba(74,144,226,0.5); }
.announcement-toggle-btn.active { background: linear-gradient(135deg, #D73527, #4A90E2); transform: scale(0.95); }
.announcement-toggle-btn i { font-size: 20px; }

.announcement-input-panel {
  position: absolute;
  bottom: 68px;
  right: 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.18);
  width: 360px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.08);
}

.input-header {
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
}
.input-header h3 { margin: 0; font-size: 15px; font-weight: 600; }

.input-form { padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }

/* Chat preview */
.chat-preview {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #f0f4ff;
  border-radius: 10px;
  padding: 10px 12px;
  border-left: 3px solid #4A90E2;
}
.chat-icon { font-size: 1.3rem; line-height: 1.4; }
.chat-body { display: flex; flex-direction: column; gap: 2px; }
.chat-text { font-size: 0.88rem; color: #222; font-weight: 500; line-height: 1.4; }
.chat-sender { font-size: 0.75rem; color: #888; font-style: italic; }

.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group label { font-size: 13px; font-weight: 600; color: #444; }
.label-optional { font-weight: 400; color: #aaa; font-size: 12px; }

.field-input, .field-select, .message-textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: white;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.field-input:focus, .field-select:focus, .message-textarea:focus {
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74,144,226,0.1);
}
.message-textarea { resize: none; line-height: 1.5; }

.form-row { display: flex; gap: 10px; }
.form-row .form-group { flex: 1; }

.form-actions {
  display: flex;
  gap: 8px;
  padding-top: 4px;
}
.submit-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
}
.submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.clear-btn {
  padding: 10px 14px;
  background: #f5f5f5;
  color: #666;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}
.clear-btn:hover { background: #ebebeb; }

/* Animations */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(12px); }

@media (max-width: 480px) {
  .announcement-input-panel { width: 300px; }
}
</style>
