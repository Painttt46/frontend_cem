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
  </div>
</template>

<script>
import { ref, watch, computed, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import LayoutView from './components/LayoutView.vue';
import lottie from 'lottie-web';

export default {
  name: 'App',
  components: {
    LayoutView,
  },
  setup() {
    const store = useStore();
    const lottieContainer = ref(null);
    let animation = null;

    const isLoading = computed(() => store.state.loading);

    const createAnimation = () => {
      if (lottieContainer.value && !animation) {
        animation = lottie.loadAnimation({
          container: lottieContainer.value,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: '/assets/loading/loading.json'
        });
      }
    };

    const destroyAnimation = () => {
      if (animation) {
        animation.destroy();
        animation = null;
      }
    };

    watch(isLoading, (loading) => {
      if (loading) {
        setTimeout(createAnimation, 50);
      } else {
        destroyAnimation();
      }
    }, { immediate: true });

    onBeforeUnmount(() => {
      destroyAnimation();
    });

    return {
      lottieContainer
    };
  }
};
</script>

<style>
/* Add global styles if needed */
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

/* Global Responsive Styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* PrimeVue Dialog Responsive */
.p-dialog {
  width: 95vw;
  max-width: 1400px;
  max-height: 90vh;
  margin: 0 auto;
}

.p-dialog .p-dialog-content {
  max-height: calc(90vh - 100px);
  overflow-y: auto;
}

@media (max-width: 768px) {
  .p-dialog {
    width: 98vw;
    height: 95vh;
    max-height: 95vh;
  }
  
  .p-dialog .p-dialog-content {
    padding: 1rem;
    max-height: calc(95vh - 100px);
  }
  
  .p-dialog .p-dialog-header {
    padding: 1rem;
  }
}

/* PrimeVue DataTable Responsive */
@media (max-width: 768px) {
  .p-datatable .p-datatable-wrapper {
    overflow-x: auto;
  }
  
  .p-datatable .p-datatable-thead > tr > th {
    min-width: 120px;
    font-size: 0.85rem;
    padding: 0.75rem 0.5rem;
  }
  
  .p-datatable .p-datatable-tbody > tr > td {
    min-width: 120px;
    font-size: 0.85rem;
    padding: 0.75rem 0.5rem;
  }
}

@media (max-width: 480px) {
  .p-datatable .p-datatable-thead > tr > th {
    min-width: 100px;
    font-size: 0.75rem;
    padding: 0.5rem 0.25rem;
  }
  
  .p-datatable .p-datatable-tbody > tr > td {
    min-width: 100px;
    font-size: 0.75rem;
    padding: 0.5rem 0.25rem;
  }
}

/* PrimeVue Form Controls Responsive */
@media (max-width: 768px) {
  .p-inputtext, .p-dropdown, .p-calendar {
    width: 100% !important;
  }
  
  .p-button {
    width: 100% !important;
    margin-bottom: 0.5rem;
  }
}

/* PrimeVue Card Responsive */
@media (max-width: 768px) {
  .p-card {
    margin: 0.5rem !important;
  }
  
  .p-card .p-card-body {
    padding: 1rem !important;
  }
}

@media (max-width: 480px) {
  .p-card {
    margin: 0.25rem !important;
  }
  
  .p-card .p-card-body {
    padding: 0.75rem !important;
  }
}

/* Global Responsive Utilities */
.flex-wrap-mobile {
  flex-wrap: wrap;
}

/* PrimeVue TabView Responsive */
@media (max-width: 768px) {
  .p-tabview .p-tabview-nav {
    flex-wrap: wrap;
  }
  
  .p-tabview .p-tabview-nav-link {
    padding: 0.75rem 1rem !important;
    font-size: 0.9rem !important;
  }
  
  .p-tabview-panels {
    padding: 0.5rem !important;
  }
}

/* PrimeVue Dropdown Responsive */
@media (max-width: 768px) {
  .p-dropdown-panel {
    max-width: 90vw !important;
  }
  
  .p-dropdown-item {
    padding: 0.75rem !important;
    font-size: 0.9rem !important;
  }
}

/* PrimeVue Calendar Responsive */
@media (max-width: 768px) {
  .p-datepicker {
    width: 100% !important;
    max-width: 320px !important;
  }
  
  .p-datepicker table {
    font-size: 0.85rem !important;
  }
  
  .p-datepicker table td {
    padding: 0.25rem !important;
  }
}

/* PrimeVue Toast Responsive */
@media (max-width: 768px) {
  .p-toast {
    width: 90vw !important;
    max-width: 350px !important;
  }
  
  .p-toast-message-content {
    padding: 0.75rem !important;
  }
}

/* Form Layout Responsive */
@media (max-width: 768px) {
  .p-fluid .p-field,
  .p-fluid .p-inputgroup {
    margin-bottom: 1rem;
  }
  
  .p-float-label {
    margin-bottom: 1.5rem;
  }
  
  .p-inputgroup .p-inputtext {
    flex: 1;
    min-width: 0;
  }
}

/* Button Group Responsive */
@media (max-width: 768px) {
  .p-button-group,
  .button-group,
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .p-button-group .p-button,
  .button-group .p-button,
  .action-buttons .p-button {
    width: 100% !important;
    margin: 0.25rem 0 !important;
  }
}

/* Grid Responsive */
@media (max-width: 768px) {
  .grid > .col-6,
  .grid > .col-4,
  .grid > .col-3 {
    width: 100% !important;
    flex: 0 0 100% !important;
  }
}

/* Scrollbar Styling */
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
</style>
