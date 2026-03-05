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
          @animationiteration="onAnimationIteration"
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
              :class="['floating-item', `item-${(index % 4) + 1}`, `type-${item.type}`]"
              @click="openDetail(item)"
              style="cursor: pointer;"
            >
              <img v-if="item.image" :src="item.image" :alt="item.text" class="item-image" />
              <div class="item-body">
                <span class="item-text">{{ item.text }}</span>
                <span v-if="item.sender" class="item-sender">— {{ item.sender }}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </transition>

  <!-- Detail Dialog -->
  <teleport to="body">
    <transition name="dialog-fade">
      <div v-if="dialogVisible" class="banner-dialog-overlay" @click.self="closeDetail">
        <div :class="['banner-dialog', `dialog-theme-${selectedItem?.type || 'info'}`]">
          <!-- Header bar with gradient -->
          <div class="dialog-header">
            <span :class="['dialog-type-badge', `badge-${selectedItem?.type}`]">
              {{ selectedItem?.type === 'urgent' ? '🔴 แดง' : selectedItem?.type === 'warning' ? '🟠 ส้ม' : selectedItem?.type === 'highlight' ? '🟡 เหลือง' : '🔵 น้ำเงิน' }}
            </span>
            <button class="dialog-close" @click="closeDetail">&times;</button>
          </div>

          <div v-if="selectedItem" class="dialog-body">
            <!-- Image section -->
            <div v-if="selectedItem.image" class="dialog-image-wrapper">
              <img :src="selectedItem.image" :alt="selectedItem.text" class="dialog-image" />
            </div>

            <!-- Content section -->
            <div class="dialog-info">
              <p class="dialog-text">{{ selectedItem.text }}</p>
              <div v-if="selectedItem.sender" class="dialog-sender-row">
                <div class="sender-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .7.5 1.2 1.2 1.2h16.8c.7 0 1.2-.5 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z"/>
                  </svg>
                </div>
                <span class="dialog-sender">{{ selectedItem.sender }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
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
const pendingItems = ref(null)

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

// ความเร็วคงที่โดยใช้ความกว้างจริง (ช้าลง)
const animationDuration = computed(() => {
  const contentWidth = measuredWidth.value || announcementItems.value.length * 350 || 350
  const totalDistance = window.innerWidth + contentWidth
  return `${Math.round(totalDistance / 200)}s`
})

// Dialog state
const dialogVisible = ref(false)
const selectedItem = ref(null)

function openDetail(item) {
  selectedItem.value = item
  dialogVisible.value = true
}

function closeDetail() {
  dialogVisible.value = false
  selectedItem.value = null
}

// ฟัง animationiteration — เมื่อ animation วนครบ 1 รอบ ค่อยสลับข้อมูลใหม่เข้า
function onAnimationIteration() {
  if (pendingItems.value) {
    announcementItems.value = pendingItems.value
    pendingItems.value = null
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

function showBanner() {
  isVisible.value = true
  localStorage.removeItem('announcementBannerClosed')
}

function closeBanner() {
  isVisible.value = false
  localStorage.setItem('announcementBannerClosed', 'true')
}

function mapItems(data) {
  return data.map(item => ({
    image: item.image_url || null,
    text: item.text || '',
    sender: item.sender_name || item.alt_text || '',
    type: item.type || 'info'
  }))
}

async function fetchBannerMessages() {
  try {
    const response = await axios.get('/api/banner')
    announcementItems.value = mapItems(response.data)
  } catch (err) {
    announcementItems.value = []
  }
}

async function refreshBanner() {
  try {
    const response = await axios.get('/api/banner')
    const newItems = mapItems(response.data)

    // ถ้ายังไม่มีข้อความเดิม → ใส่ตรงเลย
    if (announcementItems.value.length === 0) {
      announcementItems.value = newItems
    } else {
      // เก็บไว้ใน pending → รอ animation จบรอบค่อยสลับ
      pendingItems.value = newItems
    }
    isVisible.value = true
    localStorage.removeItem('announcementBannerClosed')
  } catch (err) {
    // ignore
  }
}

defineExpose({ showBanner, closeBanner, refreshBanner })
</script>

<style scoped>
.announcement-banner {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.95) 0%, rgba(215, 53, 39, 0.95) 100%);
  color: white;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: 72px;
  display: flex;
  align-items: center;
}

.banner-content {
  flex-grow: 1;
  height: 72px;
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
  gap: 1.5rem; 
  padding-right: 1.5rem; 
  white-space: nowrap;
}

.floating-item {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1.4rem;
  border-radius: 50px;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
  max-width: 500px;
  position: relative;
  overflow: hidden;
}

.floating-item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.3s;
}

.floating-item:hover {
  transform: translateY(-2px) scale(1.02) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  filter: brightness(0.97);
}

/* ── น้ำเงิน (Info): พื้นขาวอมฟ้า ── */
.floating-item.type-info {
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid #3b82f6;
  border-left: 4px solid #3b82f6;
}
.floating-item.type-info .item-text { color: #1e3a5f; }
.floating-item.type-info .item-sender { color: #6b7280; }
.floating-item.type-info::before {
  background: linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.08) 50%, transparent 100%);
  animation: shimmer 4s ease-in-out infinite;
}
.floating-item.type-info:hover::before { opacity: 1; }

/* ── เหลือง (Highlight): พื้นขาวอมเหลือง gold shine ── */
.floating-item.type-highlight {
  background: rgba(255, 251, 235, 0.95);
  border: 2px solid #eab308;
  border-left: 4px solid #eab308;
  box-shadow: 0 0 14px rgba(234, 179, 8, 0.25);
}
.floating-item.type-highlight .item-text {
  color: #92400e;
  background: linear-gradient(90deg, #92400e, #d97706, #92400e);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: goldShine 3s linear infinite;
}
.floating-item.type-highlight .item-sender { color: #a16207; }

/* ── ส้ม (Warning): พื้นขาวอมส้ม glow เลื่อน ── */
.floating-item.type-warning {
  background: rgba(255, 247, 237, 0.95);
  border: 2px solid #f97316;
  border-left: 4px solid #f97316;
}
.floating-item.type-warning .item-text { color: #9a3412; }
.floating-item.type-warning .item-sender { color: #c2410c; }
.floating-item.type-warning::before {
  background: linear-gradient(90deg, rgba(249, 115, 22, 0.12), transparent 60%);
  animation: slideGlow 3s ease-in-out infinite alternate;
}
.floating-item.type-warning::before { opacity: 1; }

/* ── แดง (Urgent): พื้นขาวอมแดง pulse กระพริบ ── */
.floating-item.type-urgent {
  background: rgba(254, 242, 242, 0.95);
  border: 2px solid #dc2626;
  border-left: 4px solid #dc2626;
  animation: urgentPulse 1.8s ease-in-out infinite, floatUpDown 4s ease-in-out infinite;
}
.floating-item.type-urgent .item-text {
  color: #991b1b;
  font-weight: 700;
}
.floating-item.type-urgent .item-sender { color: #b91c1c; }

@keyframes shimmer {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

@keyframes goldShine {
  to { background-position: 200% center; }
}

@keyframes slideGlow {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

@keyframes urgentPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  50% { box-shadow: 0 0 18px 3px rgba(239, 68, 68, 0.35); }
}


.item-image {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.item-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.item-text {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.2px;
}

.item-sender {
  font-size: 0.75rem;
  font-weight: 400;
  font-style: italic;
}

.item-1 { animation: floatUpDown 4s ease-in-out infinite; }
.item-2 { animation: floatUpDown 4s ease-in-out infinite 0.7s; }
.item-3 { animation: floatUpDown 4s ease-in-out infinite 1.4s; }
.item-4 { animation: floatUpDown 4s ease-in-out infinite 2.1s; }

@keyframes scroll-left {
  from { transform: translateX(100vw); }
  to   { transform: translateX(-100%); }
}

@keyframes floatUpDown {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}

.banner-slide-enter-active, .banner-slide-leave-active { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.banner-slide-enter-from, .banner-slide-leave-to { transform: translateY(-100%); opacity: 0; }

@media (max-width: 768px) {
  .announcement-banner { height: 64px; }
  .banner-content { height: 64px; }
  .floating-items-group { gap: 1rem; padding-right: 1rem; }
  .item-text { font-size: 0.9rem; }
  .item-sender { font-size: 0.7rem; }
}

@media (max-width: 480px) {
  .announcement-banner { height: 56px; }
  .banner-content { height: 56px; }
  .floating-items-group { gap: 0.75rem; padding-right: 0.75rem; }
  .floating-item { padding: 0.4rem 1rem; }
  .item-text { font-size: 0.85rem; }
}

/* Detail Dialog */
.banner-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.banner-dialog {
  background: #fff;
  border-radius: 20px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  animation: dialog-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes dialog-pop {
  from { transform: scale(0.88) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

/* Theme-specific top accent */
.dialog-theme-info { border-top: 4px solid #3b82f6; }
.dialog-theme-highlight { border-top: 4px solid #f59e0b; }
.dialog-theme-warning { border-top: 4px solid #f97316; }
.dialog-theme-urgent { border-top: 4px solid #ef4444; }

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem 0.75rem;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.6rem;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.dialog-close:hover { background: #f3f4f6; color: #374151; }

.dialog-body {
  display: flex;
  flex-direction: column;
}

.dialog-image-wrapper {
  margin: 0 1.25rem;
  border-radius: 14px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.dialog-info {
  padding: 1.25rem 1.5rem 1.75rem;
}

.dialog-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.85rem;
  border-radius: 8px;
  letter-spacing: 0.3px;
}
.badge-info { background: #dbeafe; color: #1d4ed8; }
.badge-highlight { background: #fef9c3; color: #a16207; }
.badge-warning { background: #ffedd5; color: #c2410c; }
.badge-urgent { background: #fee2e2; color: #b91c1c; }

.dialog-text {
  font-size: 1.1rem;
  color: #1f2937;
  line-height: 1.7;
  margin: 0 0 1rem;
  word-break: break-word;
  font-weight: 500;
}

.dialog-sender-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

.sender-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a90e2, #d73527);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dialog-sender {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

/* Dialog transitions */
.dialog-fade-enter-active { transition: opacity 0.25s ease; }
.dialog-fade-leave-active { transition: opacity 0.15s ease; }
.dialog-fade-enter-from, .dialog-fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .banner-dialog { max-width: 95%; border-radius: 16px; }
  .dialog-image-wrapper { margin: 0 0.75rem; border-radius: 10px; width: auto; height: 200px; }
  .dialog-info { padding: 1rem 1.25rem 1.5rem; }
  .dialog-text { font-size: 1rem; }
  .dialog-header { padding: 0.75rem 1rem 0.5rem; }
}
</style>