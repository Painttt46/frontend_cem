<!-- App.vue -->
<template>
  <div id="app" :class="{ 'dark-mode': $store.state.darkMode }" style="height: 100vh; overflow: hidden;">
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
  </div>
</template>

<script>
import LayoutView from './components/LayoutView.vue';

export default {
  name: 'App',
  components: {
    LayoutView,
  },
  data() {
    return {
      tokenCheckInterval: null
    }
  },
  mounted() {
    // Initialize theme
    this.$store.dispatch('initTheme')
    
    // ตรวจสอบ token expiration ทุก 1 นาที
    this.tokenCheckInterval = setInterval(() => {
      this.checkTokenExpiration()
    }, 60000)
  },
  beforeUnmount() {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval)
    }
  },
  methods: {
    checkTokenExpiration() {
      const token = localStorage.getItem('soc_token')
      if (!token) return
      
      try {
        const parts = token.split('.')
        if (parts.length !== 3) return
        
        const payload = JSON.parse(atob(parts[1]))
        if (Date.now() >= payload.exp * 1000) {
          // Token หมดอายุ - logout
          localStorage.clear()
          sessionStorage.clear()
          document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
          })
          this.$router.push('/login')
        }
      } catch {
        // ignore parse errors
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
  --default-font-size: 0.8rem;
  font-size: var(--default-font-size);
  
  /* Light mode (default) */
  --bg-primary: #ffffff;
  --bg-secondary: #e5e7eb;
  --bg-card: #ffffff;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
}

[data-theme="dark"] {
  --bg-primary: #1f2937;
  --bg-secondary: #111827;
  --bg-card: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --border-color: #4b5563;
  --label-color: #9ca3af;
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

/* Dark Mode Styles */
[data-theme="dark"] body,
.dark-mode {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

[data-theme="dark"] .bg-light {
  background-color: var(--bg-primary) !important;
}

[data-theme="dark"] .p-card,
[data-theme="dark"] .p-dialog {
  background-color: var(--bg-card);
  color: var(--text-primary);
}

[data-theme="dark"] .p-datatable .p-datatable-thead > tr > th {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-datatable .p-datatable-tbody > tr {
  background-color: var(--bg-card);
  color: var(--text-primary);
}

[data-theme="dark"] .p-datatable .p-datatable-tbody > tr:nth-child(even) {
  background-color: var(--bg-primary);
}

[data-theme="dark"] .p-inputtext,
[data-theme="dark"] .p-dropdown,
[data-theme="dark"] .p-calendar,
[data-theme="dark"] .p-textarea {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

[data-theme="dark"] .sidebar-container {
  background-color: var(--bg-primary);
}

[data-theme="dark"] .main-content,
[data-theme="dark"] .content-padding {
  background-color: var(--bg-secondary);
}

[data-theme="dark"] .daily-work-container,
[data-theme="dark"] .leave-work-container,
[data-theme="dark"] .projects-container,
[data-theme="dark"] .car-booking-container {
  background-color: var(--bg-secondary);
}

[data-theme="dark"] ::-webkit-scrollbar-track {
  background: var(--bg-primary);
}

[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: var(--border-color);
}
</style>
