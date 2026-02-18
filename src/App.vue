<!-- App.vue -->
<template>
  <div id="app" style="height: 100vh; overflow: hidden;">
    <!-- Global Loading Overlay -->
    <div v-if="$store.state.loading" class="loading-overlay">
      <div class="spinner"></div>
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
import { resetLoading } from './utils/axiosConfig';

export default {
  name: 'App',
  components: {
    LayoutView,
    ChatWidget,
  },
  data() {
    return {
      loadingTimeout: null
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
        this.loadingTimeout = setTimeout(() => {
          console.warn('Loading stuck - auto reset')
          resetLoading()
        }, 15000)
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
      let startX, scrollLeft, wrapper = null

      document.addEventListener('mousedown', (e) => {
        const el = e.target.closest('.p-datatable-wrapper, .p-datatable-table-container')
        if (!el) return
        
        wrapper = el
        if (wrapper.scrollWidth <= wrapper.clientWidth) {
          wrapper = null
          return
        }
        
        const tag = e.target.tagName.toLowerCase()
        
        // td, th, tr, div ให้ drag ได้ ยกเว้นมี text โดยตรงที่ไม่ใช่ whitespace
        if (['td', 'th', 'tr', 'div', 'table', 'tbody', 'thead'].includes(tag)) {
          // เช็คว่าคลิกโดน text จริงไหม
          const range = document.caretRangeFromPoint(e.clientX, e.clientY)
          if (range && range.startContainer.nodeType === Node.TEXT_NODE && range.startContainer.textContent.trim()) {
            wrapper = null
            return
          }
        } else if (['span', 'a', 'button', 'input', 'textarea', 'label', 'i', 'p'].includes(tag)) {
          wrapper = null
          return
        }
        
        startX = e.pageX
        scrollLeft = wrapper.scrollLeft
        e.preventDefault()
      })

      document.addEventListener('mousemove', (e) => {
        if (!wrapper || startX === undefined) return
        wrapper.style.cursor = 'grabbing'
        const walk = (e.pageX - startX) * 1.5
        wrapper.scrollLeft = scrollLeft - walk
      })

      document.addEventListener('mouseup', () => {
        if (wrapper) wrapper.style.cursor = ''
        wrapper = null
        startX = undefined
      })
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
  --default-font-size: 0.8rem;
  font-size: var(--default-font-size);
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
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
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

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
