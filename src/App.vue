<!-- App.vue -->
<template>
  <div id="app" style="height: 100vh; overflow: hidden;">
    <!-- Global Loading Overlay with Lottie -->
    <div v-if="$store.state.loading" class="loading-overlay">
      <div ref="lottieContainer" style="width: 200px; height: 200px;"></div>
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
import { ref, watch, computed } from 'vue';
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

    watch(isLoading, (loading) => {
      if (loading && lottieContainer.value && !animation) {
        animation = lottie.loadAnimation({
          container: lottieContainer.value,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: '/assets/loading/loading.json'
        });
      } else if (!loading && animation) {
        animation.destroy();
        animation = null;
      }
    });

    return {
      lottieContainer
    };
  }
};

function addNumberToNumberArray(array, data) {
  if (!array.includes(data)) {
    var list = array;
    list.push(data);
    list = sortNumberArray(list);
    array = list;
  }
  return array;
}

function capitalize(strings) {
  var output = "";
  if (strings != null) {
    if (strings.includes(' ')) {
      var stringArray = strings.split(" ");
      for (var index in strings.split(" ")) {
        output += stringArray[index].charAt(0).toUpperCase() + stringArray[index].slice(1) + " ";
      }
    } else {
      output = strings.charAt(0).toUpperCase() + strings.slice(1);
    }
    return output.trim();
  } else {
    return null;
  }
}

/**
 * 
 * @param {Date} date 
 */
function getStringDate(date) {
  if (typeof date == Date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10) ? "0" + month : month;
    var day = (date.getDate() < 10) ? "0" + date.getDate() : date.getDate();
    return `${year}-${month}-${day}`;
  } else {
    return '';
  }
}

function getPrimeVueStringDate(date) {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  var newDate = null;
  if (date != null && date != 'undefined') {
    var dates = date.split(" ");
    newDate = new Date(parseInt(dates[3]), months.indexOf(lowerCase(dates[1])), parseInt(dates[2]));
  } else {
    newDate = new Date();
  }

  var year = newDate.getFullYear();
  var month = newDate.getMonth() + 1;
  month = (month < 10) ? "0" + month : month;
  var day = (newDate.getDate() < 10) ? "0" + newDate.getDate() : newDate.getDate();
  return `${year}-${month}-${day}`;
}

function getTimeFilter(startDate, endDate) {
  var start = '';
  var end = '';
  if (startDate != null && (typeof startDate != Date)) {
    start = `&start=${getPrimeVueStringDate(`${startDate}`)}`;
  } else {
    var startDateString = (startDate != null) ? `&start=${getStringDate(`${startDate}`)}` : '';
    start = (startDateString != '') ? startDateString : '';
  }

  if (endDate != null && (typeof endDate != Date)) {
    end = `&end=${getPrimeVueStringDate(`${endDate}`)}`;
  } else {
    var endDateString = (endDate != null) ? `&end=${getStringDate(`${endDate}`)}` : '';
    end = (endDateString != '') ? endDateString : '';
  }
  return `${start}${end}`;
}

function logout() {
  if (localStorage.length > 0) {
    localStorage.clear();
  }
}

function lowerCase(inputString) {
  var output = "";
  if (inputString != null) {
    output = inputString.toLowerCase();
    return output;
  } else {
    return null;
  }
}

function sortNumberArray(numberArray) {
  numberArray.sort(
    function (a, b) {
      return a - b;
    }
  );
  return numberArray;
}

function upperCase(inputString) {
  var output = "";
  if (inputString != null) {
    output = inputString.toUpperCase();
    return output;
  } else {
    return null;
  }
}

const renderComponent = ref(true);
async function useForceUpdate() {
  // Here, we'll remove MyComponent
  renderComponent.value = false;

  // Then, wait for the change to get flushed to the DOM
  await nextTick();

  // Add MyComponent back in
  renderComponent.value = true;
}
function formatDateTime(dateString) {
  var date = new Date(dateString);
  return `${convertTo2digit(date.getDay())}/${convertTo2digit(date.getMonth() + 1)}/${date.getFullYear()} ${convertTo2digit(date.getHours())}:${convertTo2digit(date.getMinutes())}:${convertTo2digit(date.getSeconds())}`;
}

function formatDate(dateString) {
  if (dateString == null || dateString == ''|| dateString == undefined) {
    return ''
  }
  var date = new Date(dateString);
  // return `${convertTo2digit(date.getDay())}/${convertTo2digit(date.getMonth() + 1)}/${date.getFullYear()}`;
  return `${date.getDate()}/${convertTo2digit(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function convertTo2digit(number) {
  if (number < 10) {
    return `0${number}`;
  } else {
    return `${number}`;
  }
}

export { addNumberToNumberArray, capitalize, getPrimeVueStringDate, getStringDate, getTimeFilter, logout, lowerCase, sortNumberArray, upperCase, useForceUpdate, formatDate, formatDateTime };

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