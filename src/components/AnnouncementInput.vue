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
          <h3>เพิ่มข้อความใหม่</h3>
        </div>
        
        <div class="input-form">
          <div class="form-group">
            <label>ไอคอน:</label>
            <select v-model="newAnnouncement.icon" class="icon-select">
              <option value="📢">📢 ประกาศ</option>
              <option value="⚠️">⚠️ เตือน</option>
              <option value="✨">✨ ใหม่</option>
              <option value="🚀">🚀 อัปเดต</option>
              <option value="📅">📅 กำหนดการ</option>
              <option value="🎉">🎉 สำเร็จ</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>ข้อความ:</label>
            <textarea 
              v-model="newAnnouncement.text"
              placeholder="กรอกข้อความประกาศ..."
              class="message-textarea"
              rows="2"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>ประเภท:</label>
            <select v-model="newAnnouncement.type" class="type-select">
              <option value="">ปกติ</option>
              <option value="highlight">โดดเด่น</option>
              <option value="warning">เตือน</option>
              <option value="info">ข้อมูล</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button 
              @click="submitAnnouncement"
              class="submit-btn"
              :disabled="!newAnnouncement.text.trim() || isSubmitting"
            >
              <span v-if="isSubmitting">กำลังบันทึก...</span>
              <span v-else>บันทึกข้อความ</span>
            </button>
            <button @click="clearForm" class="clear-btn">ล้าง</button>
          </div>
        </div>
        
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isExpanded = ref(false)
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

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
  newAnnouncement.value = {
    icon: '📢',
    text: '',
    type: ''
  }
  successMessage.value = ''
  errorMessage.value = ''
}

const submitAnnouncement = async () => {
  if (!newAnnouncement.value.text.trim()) {
    errorMessage.value = 'กรุณากรอกข้อความประกาศ'
    return
  }
  
  isSubmitting.value = true
  errorMessage.value = ''
  
  try {
    // ส่งข้อมูลไปยัง API
    const response = await fetch('/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        icon: newAnnouncement.value.icon,
        text: newAnnouncement.value.text,
        type: newAnnouncement.value.type,
        tag: 'h4'
      })
    })
    
    if (response.ok) {
      successMessage.value = 'บันทึกข้อความเรียบร้อยแล้ว!'
      clearForm()
      
      // ปิดช่องพิมพ์หลังจากบันทึกสำเร็จ
      setTimeout(() => {
        isExpanded.value = false
        successMessage.value = ''
      }, 2000)
    } else {
      throw new Error('ไม่สามารถบันทึกข้อความได้')
    }
  } catch (error) {
    console.error('Error submitting announcement:', error)
    errorMessage.value = 'เกิดข้อผิดพลาด กรุณาลองใหม่'
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
  padding: 14px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 600;
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
  transition: transform 0.2s ease;
  width: 60px;
  height: 60px;
  line-height: 1;
  position: relative;
}

.announcement-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(74, 144, 226, 0.5);
}

.announcement-toggle-btn.active {
  background: linear-gradient(135deg, #D73527, #4A90E2);
  transform: scale(0.95);
}

.announcement-toggle-btn i {
  font-size: 20px;
  line-height: 1;
  display: block;
}

.announcement-input-panel {
  position: absolute;
  bottom: 75px;
  right: 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 15px 50px rgba(0,0,0,0.2);
  width: 380px;
  height: 520px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.input-header {
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  border-radius: 16px 16px 0 0;
  position: relative;
  overflow: hidden;
}

.input-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.input-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  flex: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.header-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #4A90E2;
}

.close-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.3s ease;
}

.close-btn:hover { 
  background: rgba(255,255,255,0.3);
  transform: rotate(90deg);
}

.input-form {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.icon-select,
.type-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
  outline: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
}

.icon-select:focus,
.type-select:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1), 0 4px 12px rgba(74, 144, 226, 0.15);
  background: white;
  transform: translateY(-1px);
}

.icon-select:hover,
.type-select:hover {
  border-color: #4A90E2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.message-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  resize: vertical;
  font-family: inherit;
  background: white;
  transition: all 0.3s ease;
  min-height: 100px;
  outline: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
}

.message-textarea:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1), 0 4px 12px rgba(74, 144, 226, 0.15);
  background: white;
  transform: translateY(-1px);
}

.message-textarea:hover {
  border-color: #4A90E2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.submit-btn {
  flex: 1.2;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.submit-btn:hover::before {
  left: 100%;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.clear-btn {
  flex: 1;
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.clear-btn:hover {
  background: #e9ecef;
  border-color: #4A90E2;
  color: #4A90E2;
  transform: translateY(-1px);
}

.success-message {
  margin: 12px 20px;
  padding: 12px 16px;
  background: #d4edda;
  color: #155724;
  border-radius: 10px;
  font-size: 15px;
  text-align: center;
  font-weight: 500;
  border: 1px solid #c3e6cb;
}

.error-message {
  margin: 12px 20px;
  padding: 12px 16px;
  background: #f8d7da;
  color: #721c24;
  border-radius: 10px;
  font-size: 15px;
  text-align: center;
  font-weight: 500;
  border: 1px solid #f5c6cb;
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .announcement-input-container {
    bottom: 80px;
    right: 10px;
  }
  
  .announcement-input-panel {
    width: 280px;
  }
}

@media (max-width: 480px) {
  .announcement-input-container {
    bottom: 80px;
    right: 16px;
  }
  
  .announcement-input-panel {
    width: 260px;
  }
  
  .announcement-toggle-btn {
    width: 60px;
    height: 60px;
    padding: 14px;
  }
  
  .announcement-toggle-btn i {
    font-size: 20px;
    line-height: 1;
    display: block;
  }
}
</style>
