<!-- App.vue -->
<template>
  <div id="app" style="height: 100vh; overflow: hidden;">
    <!-- แถบโหลดบางด้านบน: คำขออ่านข้อมูลทั่วไป ไม่บังหน้าจอ -->
    <div v-if="$store.state.loading" class="top-loader" role="progressbar" aria-label="กำลังโหลด" aria-busy="true">
      <div class="top-loader-bar"></div>
    </div>

    <!-- ฉากกันกดซ้ำ + สปินเนอร์: เฉพาะตอนบันทึก/แก้ไข/ลบ หรืออัปโหลดไฟล์
         (ฉากค่อย ๆ ปรากฏหลังหน่วง 0.3 วินาที — งานที่เสร็จเร็วจึงไม่มีหน้าจอมืดแฟลช แต่ยังกันกดซ้ำได้ตั้งแต่แรก) -->
    <div v-if="$store.state.loading && (loadingState.writes > 0 || uploadState.count > 0)" class="loading-overlay" role="alert" aria-busy="true">
      <div class="spinner"></div>
      <div v-if="uploadState.count > 0" class="upload-note">
        กำลังอัปโหลดไฟล์ {{ uploadState.percent }}% — กรุณาอย่าปิดหรือรีเฟรชหน้านี้
      </div>
    </div>
    
    <!-- Show only router-view for login page -->
    <div v-if="$router.currentRoute.value.fullPath == '/login'">
      <router-view />
    </div>
    <!-- Show LayoutView with sidebar for other pages -->
    <div v-else>
      <LayoutView />
    </div>

    <!-- Chat Widget - show when logged in -->
    <ChatWidget v-if="$router.currentRoute.value.fullPath !== '/login'" />
  </div>
</template>

<script>
import LayoutView from './components/LayoutView.vue';
import ChatWidget from './components/ChatWidget.vue';
import { resetLoading, uploadState, loadingState } from './utils/axiosConfig';

export default {
  name: 'App',
  components: {
    LayoutView,
    ChatWidget,
  },
  data() {
    return {
      loadingTimeout: null,
      uploadState,
      loadingState
    }
  },
  watch: {
    // Auto reset loading if stuck for more than 15 seconds
    '$store.state.loading'(isLoading) {
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout)
        this.loadingTimeout = null
      }
      if (isLoading) {
        const check = () => {
          // กำลังอัปโหลดไฟล์ใหญ่อยู่ (อาจใช้เวลาหลายนาที) — ห้ามรีเซ็ต ไม่งั้น spinner หายทั้งที่ไฟล์ยังส่งไม่เสร็จ
          if (uploadState.count > 0) {
            this.loadingTimeout = setTimeout(check, 15000)
            return
          }
          console.warn('Loading stuck - auto reset')
          resetLoading()
        }
        this.loadingTimeout = setTimeout(check, 15000)
      }
    }
  },
  mounted() {
    // Enable drag scroll for tables
    this.initDragScroll()
  },
  beforeUnmount() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout)
    }
  },
  methods: {
    initDragScroll() {
      // Universal drag-scroll ทุกหน้า (สไตล์เดียวกับ .vendor-list ในหน้าจัดซื้อ):
      // กดค้างบนพื้นที่ว่างของ scroll container ใดก็ได้ แล้วลากเพื่อเลื่อนทั้งแนวนอน/แนวตั้ง
      let state = null // { el, startX, startY, scrollLeft, scrollTop }

      const INTERACTIVE = 'input, textarea, select, button, a, label, .p-button, .p-dropdown, .p-multiselect, .p-calendar, .p-checkbox, .p-radiobutton, .p-selectbutton, .p-slider, .p-rating'

      // หา scroll container ที่ใกล้ที่สุดรอบจุดที่กด (overflow auto/scroll และมีเนื้อหาล้นจริง)
      const findScrollable = (node) => {
        while (node && node !== document.body) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const style = getComputedStyle(node)
            const canX = /(auto|scroll|overlay)/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 1
            const canY = /(auto|scroll|overlay)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1
            if (canX || canY) return node
          }
          node = node.parentNode
        }
        return null
      }

      // เช็คว่า element ที่กดมีข้อความตรง ๆ อยู่ไหม (มี = ให้เลือกข้อความ ไม่ drag)
      const hasDirectText = (el) => Array.from(el.childNodes || []).some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
      )

      document.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return
        // ไม่รบกวนการคลิก/พิมพ์/ลากใน element ที่มี interaction ของตัวเอง
        if (e.target.closest(INTERACTIVE)) return
        // กดลงบนข้อความโดยตรง → ให้ highlight/เลือกข้อความได้ (ไม่เริ่ม drag)
        if (hasDirectText(e.target)) return
        const el = findScrollable(e.target)
        if (!el) return
        state = { el, startX: e.pageX, startY: e.pageY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
        e.preventDefault()
      })

      document.addEventListener('mousemove', (e) => {
        if (!state) return
        const dx = e.pageX - state.startX
        const dy = e.pageY - state.startY
        // เริ่ม drag จริงเมื่อลากเกิน ~4px กันสั่นตอนคลิกปกติ
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          state.el.style.cursor = 'grabbing'
          state.el.style.userSelect = 'none'
          if (state.el.scrollWidth > state.el.clientWidth) state.el.scrollLeft = state.scrollLeft - dx
          if (state.el.scrollHeight > state.el.clientHeight) state.el.scrollTop = state.scrollTop - dy
        }
      })

      const end = () => {
        if (!state) return
        state.el.style.cursor = ''
        state.el.style.userSelect = ''
        state = null
      }
      document.addEventListener('mouseup', end)
      document.addEventListener('mouseleave', end)

      // มือถือ/แท็บเล็ต: กดค้างในตารางไม่ให้เด้ง context menu มาบังการเลื่อน
      if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
        document.addEventListener('contextmenu', (e) => {
          if (e.target.closest('.p-datatable-wrapper, .p-datatable-table-container, .p-datatable-scrollable-body, .works-table-wrapper, .history-table-wrapper, [class*="table-wrapper"], .import-preview-table, .vendor-list')) {
            e.preventDefault()
          }
        })
      }
    }
  }
};
</script>

<style>
@import '/src/assets/styles/main.css';

:root {
  --label-color: #64748b;
  --status-closed-red: #A90F0A;
  --table-font-size: 1rem;
  --default-font-size: 0.85rem;
  font-size: var(--default-font-size);
}

/* มือถือ: ขนาดฐานใหญ่ขึ้น ~12% — ฐาน 13.6px ทำให้ตัวหนังสือที่กำหนดเป็น rem เล็ก (0.6–0.75rem = 8–10px) อ่านบนจอมือถือไม่ออก
   ทุกขนาดที่เป็น rem (ฟอนต์ ระยะ ขนาดปุ่ม) ขยายตามกัน จึงไม่ต้องไล่แก้ทีละหน้า */
@media (max-width: 768px) {
  :root {
    --default-font-size: 0.95rem;
  }
}

label {
  margin-bottom: 2px;
  color: var(--label-color);
  font-size: 0.875rem;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: var(--font-thai, 'Leelawadee UI', 'Segoe UI', Tahoma, sans-serif);
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 1rem;
  z-index: 9999;
  /* ซ่อนไว้ก่อน 0.3 วินาทีแล้วค่อยปรากฏ (ยังรับการคลิกอยู่ จึงกันกดซ้ำได้) */
  opacity: 0;
  animation: overlay-in 0.25s ease 0.3s forwards;
}

@keyframes overlay-in {
  to { opacity: 1; }
}

/* แถบโหลดบางด้านบนจอ */
.top-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 10000;
  overflow: hidden;
  pointer-events: none;
  background: rgba(74, 144, 226, 0.12);
}

.top-loader-bar {
  height: 100%;
  width: 38%;
  border-radius: 999px;
  background: var(--brand-gradient);
  box-shadow: none;
  animation: top-loader-slide 1.15s ease-in-out infinite;
}

@keyframes top-loader-slide {
  0% { transform: translateX(-110%); }
  100% { transform: translateX(300%); }
}

.upload-note {
  color: #fff;
  font-size: 1rem;
  text-align: center;
  padding: 0 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

</style>
