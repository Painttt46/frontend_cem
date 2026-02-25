<template>
  <transition name="banner-slide">
    <div v-if="isVisible" class="announcement-banner">
      <div class="banner-content">
        
        <div 
          class="marquee-wrapper" 
          :style="{ 
            animationDuration: animationDuration, 
            '--group-count': groupCount 
          }"
        >
          
          <div 
            v-for="groupIndex in groupCount" 
            :key="'group-' + groupIndex"
            class="floating-items-group"
            :aria-hidden="groupIndex > 1"
          >
            <div 
              v-for="(item, index) in announcementItems" 
              :key="'item-' + index"
              :class="['floating-item', `item-${(index % 4) + 1}`]"
            >
              <span class="text-icon">{{ item.icon }}</span>
              <component :is="item.tag" :class="item.type">
                {{ item.text }}
              </component>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
/* global defineProps, defineExpose */
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  title: { type: String, default: 'ประกาศ' },
  message: { type: String, default: 'ข้อความประกาศของคุณ' },
  autoHide: { type: Boolean, default: false },
  hideDelay: { type: Number, default: 5000 }
})

const isVisible = ref(true)

// ข้อมูลจำลอง (จำลองว่า Database ส่งมาแค่ 1 หรือ 2 ข้อความ)
const announcementItems = ref([
  { icon: '📢', text: 'ประกาศด่วนจากระบบ!', tag: 'h4', type: 'highlight' },
  { icon: '⚠️', text: 'แจ้งเตือนระบบ!', tag: 'h4', type: 'warning' }
  // ลองลบข้อความให้เหลือแค่ 1 อันดูก็ได้ครับ โค้ดนี้จะยังทำงานได้เนียนกริบ
])

// 🌟 พระเอกของเรา: คำนวณจำนวนชุดอัตโนมัติ 
const groupCount = computed(() => {
  const currentItemsCount = announcementItems.value.length;
  if (currentItemsCount === 0) return 4; // กันพังกรณีไม่มีข้อมูล

  // เราต้องการให้มีกล่องข้อความบนจอ "อย่างน้อย 15 กล่อง" รวมกัน เพื่อให้ล้นจอเสมอ
  // สมมติมี 1 ข้อความ -> 15 / 1 = ทำซ้ำ 15 ชุด
  // สมมติมี 5 ข้อความ -> 15 / 5 = ทำซ้ำ 3 ชุด
  const requiredGroups = Math.ceil(15 / currentItemsCount);
  
  // แต่ขั้นต่ำต้องไม่น้อยกว่า 4 ชุดเพื่อให้ Animation ลูปได้เนียนตา
  return Math.max(requiredGroups, 4);
})

// คำนวณความเร็ว
const animationDuration = computed(() => {
  const timePerItem = 1; // 1 ข้อความใช้เวลา 4 วินาที
  const calculatedTime = announcementItems.value.length * timePerItem;
  
  // กำหนดเวลาขั้นต่ำไว้ 10 วินาที จะได้ไม่วิ่งเร็วจนอ่านไม่ทันถ้ามีแค่ 1 ข้อความ
  return `${Math.max(calculatedTime, 4)}s`; 
})

const closeBanner = () => {
  isVisible.value = false
  localStorage.setItem('announcementBannerClosed', 'true')
}

const showBanner = () => {
  isVisible.value = true
  localStorage.removeItem('announcementBannerClosed')
}

onMounted(() => {
  const wasClosed = localStorage.getItem('announcementBannerClosed')
  if (wasClosed === 'true') {
    isVisible.value = false
  }

  if (props.autoHide) {
    setTimeout(closeBanner, props.hideDelay)
  }
})

defineExpose({ showBanner, closeBanner })
</script>

<style scoped>
.announcement-banner {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.95) 0%, rgba(215, 53, 39, 0.95) 100%);
  color: white;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
  border-bottom: 2px solid rgba(255, 255, 255, 0.4);
  height: 80px;
  display: flex;
  align-items: center;
}

.banner-content {
  flex-grow: 1;
  height: 80px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.marquee-wrapper {
  display: flex;
  width: max-content;
  animation-name: scroll-left;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.marquee-wrapper:hover {
  animation-play-state: paused;
}

.floating-items-group {
  display: flex;
  align-items: center;
  gap: 2rem; 
  padding-right: 2rem; 
  white-space: nowrap;
}

.floating-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.5s ease;
}

.floating-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.close-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0 1.5rem;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.close-btn:hover { background-color: rgba(0, 0, 0, 0.2); }

.item-1 { animation: floatUpDown 3s ease-in-out infinite; }
.item-2 { animation: floatUpDown 3s ease-in-out infinite 0.5s; }
.item-3 { animation: floatUpDown 3s ease-in-out infinite 1s; }
.item-4 { animation: floatUpDown 3s ease-in-out infinite 1.5s; }

@keyframes scroll-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(-100% / var(--group-count))); } 
}

@keyframes floatUpDown {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

.text-icon { font-size: 1.8rem; }
.floating-item h4 { margin: 0; font-size: 1.3rem; font-weight: 700; color: white; }
.floating-item p { margin: 0; font-size: 1.1rem; color: rgba(255, 255, 255, 0.95); }
.highlight { font-size: 1.1rem; font-weight: 600; color: #ffeb3b; animation: highlightPulse 2s infinite; }
.info { font-size: 1rem; color: #81c784; }

@keyframes highlightPulse {
  0%, 100% { opacity: 0.9; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.banner-slide-enter-active, .banner-slide-leave-active { transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.banner-slide-enter-from, .banner-slide-leave-to { transform: translateY(-100%); opacity: 0; }

@media (max-width: 768px) {
  .floating-items-group { gap: 1.5rem; padding-right: 1.5rem; }
  .floating-item h4 { font-size: 1.1rem; }
  .floating-item p { font-size: 0.9rem; }
  .text-icon { font-size: 1.2rem; }
}

@media (max-width: 480px) {
  .floating-items-group { gap: 1rem; padding-right: 1rem; }
  .floating-item h4 { font-size: 1rem; }
  .floating-item p { font-size: 0.8rem; }
  .text-icon { font-size: 1rem; }
}
</style>