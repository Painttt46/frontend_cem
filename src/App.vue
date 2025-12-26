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

/* Cards & Dialogs */
[data-theme="dark"] .p-card,
[data-theme="dark"] .p-dialog {
  background-color: var(--bg-card);
  color: var(--text-primary);
}

[data-theme="dark"] .p-card .p-card-title,
[data-theme="dark"] .p-card .p-card-subtitle,
[data-theme="dark"] .p-dialog .p-dialog-header {
  color: var(--text-primary);
}

[data-theme="dark"] .p-dialog .p-dialog-content {
  background-color: var(--bg-card);
  color: var(--text-primary);
}

[data-theme="dark"] .p-dialog .p-dialog-header {
  background-color: var(--bg-primary);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-dialog .p-dialog-footer {
  background-color: var(--bg-card);
  border-color: var(--border-color);
}

/* DataTable */
[data-theme="dark"] .p-datatable {
  background-color: var(--bg-card);
}

[data-theme="dark"] .p-datatable .p-datatable-thead > tr > th {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-datatable .p-datatable-tbody > tr {
  background-color: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-datatable .p-datatable-tbody > tr:nth-child(even) {
  background-color: var(--bg-primary);
}

[data-theme="dark"] .p-datatable .p-datatable-tbody > tr:hover {
  background-color: #4b5563 !important;
}

[data-theme="dark"] .p-datatable .p-datatable-tbody > tr > td {
  border-color: var(--border-color);
}

[data-theme="dark"] .p-paginator {
  background-color: var(--bg-card);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-paginator .p-paginator-element {
  color: var(--text-primary);
}

[data-theme="dark"] .p-paginator .p-paginator-element:hover {
  background-color: var(--bg-primary);
}

/* Form Inputs */
[data-theme="dark"] .p-inputtext,
[data-theme="dark"] .p-dropdown,
[data-theme="dark"] .p-calendar,
[data-theme="dark"] .p-textarea,
[data-theme="dark"] .p-inputnumber-input,
[data-theme="dark"] .p-multiselect,
[data-theme="dark"] .p-chips-input-token input {
  background-color: var(--bg-primary) !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
}

[data-theme="dark"] .p-inputtext:focus,
[data-theme="dark"] .p-dropdown:focus,
[data-theme="dark"] .p-textarea:focus {
  border-color: #4A90E2 !important;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.3) !important;
}

[data-theme="dark"] .p-inputtext::placeholder {
  color: var(--text-secondary) !important;
}

/* Dropdown Panel */
[data-theme="dark"] .p-dropdown-panel,
[data-theme="dark"] .p-multiselect-panel,
[data-theme="dark"] .p-autocomplete-panel {
  background-color: var(--bg-card);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-dropdown-items .p-dropdown-item,
[data-theme="dark"] .p-multiselect-items .p-multiselect-item {
  color: var(--text-primary);
}

[data-theme="dark"] .p-dropdown-items .p-dropdown-item:hover,
[data-theme="dark"] .p-multiselect-items .p-multiselect-item:hover {
  background-color: var(--bg-primary) !important;
}

[data-theme="dark"] .p-dropdown-items .p-dropdown-item.p-highlight,
[data-theme="dark"] .p-multiselect-items .p-multiselect-item.p-highlight {
  background-color: #4A90E2 !important;
  color: white !important;
}

/* Calendar */
[data-theme="dark"] .p-datepicker {
  background-color: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-datepicker .p-datepicker-header {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-datepicker table td > span {
  color: var(--text-primary);
}

[data-theme="dark"] .p-datepicker table td > span:hover {
  background-color: var(--bg-primary) !important;
}

[data-theme="dark"] .p-datepicker table td.p-datepicker-today > span {
  background-color: var(--border-color);
}

/* Buttons */
[data-theme="dark"] .p-button.p-button-secondary {
  background-color: var(--bg-primary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

[data-theme="dark"] .p-button.p-button-secondary:hover {
  background-color: var(--border-color) !important;
}

[data-theme="dark"] .p-button.p-button-text {
  color: var(--text-primary);
}

[data-theme="dark"] .p-button.p-button-text:hover {
  background-color: var(--bg-primary) !important;
}

/* Tabs */
[data-theme="dark"] .p-tabview .p-tabview-nav {
  background-color: var(--bg-card);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-tabview .p-tabview-nav li .p-tabview-nav-link {
  background-color: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-tabview .p-tabview-nav li .p-tabview-nav-link:hover {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

[data-theme="dark"] .p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
  background-color: var(--bg-primary);
  color: #4A90E2;
  border-color: #4A90E2;
}

[data-theme="dark"] .p-tabview .p-tabview-panels {
  background-color: var(--bg-card);
  color: var(--text-primary);
}

/* Sidebar & Navigation */
[data-theme="dark"] .sidebar-container {
  background-color: var(--bg-primary);
}

[data-theme="dark"] .nav-link,
[data-theme="dark"] .nav-link h5 {
  color: var(--text-primary) !important;
}

[data-theme="dark"] .nav-link:hover {
  background-color: var(--bg-card) !important;
  border-radius: 8px;
}

[data-theme="dark"] .nav-link.active,
[data-theme="dark"] .nav-link.active h5 {
  color: #4A90E2 !important;
  background-color: rgba(74, 144, 226, 0.1);
  border-radius: 8px;
}

/* Main Content Areas */
[data-theme="dark"] .main-content,
[data-theme="dark"] .content-padding {
  background-color: var(--bg-secondary);
}

[data-theme="dark"] .daily-work-container,
[data-theme="dark"] .leave-work-container,
[data-theme="dark"] .projects-container,
[data-theme="dark"] .car-booking-container,
[data-theme="dark"] .management-container {
  background-color: var(--bg-secondary);
}

/* Text Colors */
[data-theme="dark"] h1, [data-theme="dark"] h2, [data-theme="dark"] h3,
[data-theme="dark"] h4, [data-theme="dark"] h5, [data-theme="dark"] h6 {
  color: var(--text-primary);
}

[data-theme="dark"] p, [data-theme="dark"] span, [data-theme="dark"] div {
  color: inherit;
}

[data-theme="dark"] label {
  color: var(--label-color) !important;
}

[data-theme="dark"] .text-muted {
  color: var(--text-secondary) !important;
}

/* Badges & Tags */
[data-theme="dark"] .p-tag {
  color: white;
}

/* Tooltip */
[data-theme="dark"] .p-tooltip .p-tooltip-text {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* Panel & Accordion */
[data-theme="dark"] .p-panel,
[data-theme="dark"] .p-accordion {
  background-color: var(--bg-card);
}

[data-theme="dark"] .p-panel .p-panel-header,
[data-theme="dark"] .p-accordion .p-accordion-header a {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-panel .p-panel-content,
[data-theme="dark"] .p-accordion .p-accordion-content {
  background-color: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border-color);
}

/* Menu */
[data-theme="dark"] .p-menu {
  background-color: var(--bg-card);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-menu .p-menuitem-link {
  color: var(--text-primary);
}

[data-theme="dark"] .p-menu .p-menuitem-link:hover {
  background-color: var(--bg-primary) !important;
}

/* Toast */
[data-theme="dark"] .p-toast .p-toast-message {
  background-color: var(--bg-card);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-toast .p-toast-message-content {
  color: var(--text-primary);
}

/* Checkbox & Radio */
[data-theme="dark"] .p-checkbox .p-checkbox-box,
[data-theme="dark"] .p-radiobutton .p-radiobutton-box {
  background-color: var(--bg-primary);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-checkbox .p-checkbox-box:hover,
[data-theme="dark"] .p-radiobutton .p-radiobutton-box:hover {
  border-color: #4A90E2;
}

/* Scrollbar Dark */
[data-theme="dark"] ::-webkit-scrollbar-track {
  background: var(--bg-primary);
}

[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: var(--border-color);
}

[data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Fieldset */
[data-theme="dark"] .p-fieldset {
  background-color: var(--bg-card);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-fieldset .p-fieldset-legend {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

/* Divider */
[data-theme="dark"] .p-divider {
  border-color: var(--border-color);
}

[data-theme="dark"] .p-divider .p-divider-content {
  background-color: var(--bg-card);
  color: var(--text-secondary);
}

/* Chip */
[data-theme="dark"] .p-chip {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* Timeline */
[data-theme="dark"] .p-timeline .p-timeline-event-content {
  color: var(--text-primary);
}

/* FileUpload */
[data-theme="dark"] .p-fileupload {
  background-color: var(--bg-card);
  border-color: var(--border-color);
}

[data-theme="dark"] .p-fileupload .p-fileupload-content {
  background-color: var(--bg-primary);
  border-color: var(--border-color);
}
</style>
