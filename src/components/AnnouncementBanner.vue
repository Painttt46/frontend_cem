<template>
  <transition name="banner-slide">
    <div v-if="isVisible" class="announcement-banner">
      <div class="banner-content">
        
        <div 
          ref="wrapperRef"
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
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import axios from 'axios'

const props = defineProps({
  title: { type: String, default: 'ประกาศ' },
  message: { type: String, default: 'ข้อความประกาศของคุณ' },
  autoHide: { type: Boolean, default: false },
  hideDelay: { type: Number, default: 5000 }
})

const isVisible = ref(true)
const announcementItems = ref([])

// 1 group เสมอ → แสดงข้อมูลชุดเดียว แต่ animation loop ต่อเนื่อง
const groupCount = computed(() => 1)

const wrapperRef = ref(null)
const measuredWidth = ref(0)

// วัดความกว้างจริงจาก DOM หลัง items โหลดเสร็จ
watch(announcementItems, async () => {
  await nextTick()
  if (wrapperRef.value) {
    measuredWidth.value = wrapperRef.value.scrollWidth
  }
})

// ความเร็วคงที่ 280px/s โดยใช้ความกว้างจริง (fallback ประมาณ 350px/item)
const animationDuration = computed(() => {
  const contentWidth = measuredWidth.value || announcementItems.value.length * 350 || 350
  const totalDistance = window.innerWidth + contentWidth
  return `${Math.round(totalDistance / 230)}s`
})

function showBanner() {
  isVisible.value = true
  localStorage.removeItem('announcementBannerClosed')
}

function closeBanner() {
  isVisible.value = false
  localStorage.setItem('announcementBannerClosed', 'true')
}

async function fetchBannerMessages() {
  try {
    // TODO: Replace with your actual token logic
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/banner', {
      headers: { Authorization: `Bearer ${token}` }
    })
    // Map DB fields to component fields
    announcementItems.value = response.data.map(item => ({
      icon: item.type === 'urgent' ? '⚠️' : item.type === 'info' ? 'ℹ️' : '📢',
      text: item.text || item.alt_text || '',
      tag: 'h4',
      type: item.type || 'info'
    }))
  } catch (err) {
    // fallback: show nothing or mock
    announcementItems.value = []
  }
}

onMounted(() => {
  fetchBannerMessages()
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
  from { transform: translateX(100vw); }
  to   { transform: translateX(-100%); }
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