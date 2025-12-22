<template>
  <Toast />
  <ConfirmDialog :draggable="false"></ConfirmDialog>
  <ConfirmPopup group="templating">
    <template #message="slotProps">
      <div class="flex flex-column align-items-center w-full gap-3 border-bottom-1 surface-border p-3 mb-3 pb-0">
        <i :class="slotProps.message.icon" class="text-6xl text-primary-500"></i>
        <p>{{ slotProps.message.message }}</p>
      </div>
    </template>
  </ConfirmPopup>

  <!-- Dialog Session หมดอายุ -->
  <Dialog v-model:visible="sessionDialog" header="Session หมดอายุ!" modal :closable="false" :closeOnEscape="false">
    <div class="flex align-items-center gap-2">
      <i class="pi pi-info-circle text-primary text-xl" />
      <span>session หมดอายุ! กรุณาทําการล็อกอินใหม่อีกครั้ง</span>
    </div>
    <template #footer>
      <Button label="OK" class="p-button-danger" @click="locationLogout" />
    </template>
  </Dialog>

  <Dialog v-model:visible="visible" header="Setting"
    :style="{ width: isMobile ? '90vw' : '400px', maxWidth: '90vw' }" 
    :position="position" :modal="true" :draggable="false">
    <div class="flex align-items-center gap-3 mb-3 mt-3">
      <router-link to="/profile" @click="visible = false" class="nav-link">
        <h5><i class="pi pi-megaphone px-2" style="font-size: 1.5rem"></i>Profile</h5>
      </router-link>
    </div>
    <div class="flex align-items-center gap-3 mb-3">
      <router-link to="/login" @click="logout" class="nav-link">
        <h5><i class="pi pi-sign-out px-2" style="font-size: 1.2rem"></i>Logout</h5>
      </router-link>
    </div>
    <div class="flex justify-content-end dialog-footer">
      <Button type="button" label="Cancel" severity="danger" @click="visible = false"></Button>
    </div>
  </Dialog>

  <div class="layout-wrapper" :class="{ 'sidebar-collapsed': !sidebarVisible }">
    <!-- Toggle Button -->
    <Button @click="toggleSidebar" class="sidebar-toggle-btn"
      :icon="sidebarVisible ? 'pi pi-chevron-left' : 'pi pi-chevron-right'" 
      severity="secondary" text />

    <!-- Sidebar -->
    <aside v-show="sidebarVisible" class="sidebar">
      <div class="sidebar-content">
        <div class="logo-section">
          <img src="@/assets/images/GENT.png" alt="GENT Logo" />
        </div>

        <div class="datetime-section">
          <div class="datetime-display">
            <i class="pi pi-calendar"></i>
            <span>{{ currentDateTime }}</span>
          </div>
        </div>

        <nav class="nav-menu">
          <router-link v-if="hasAccess('/daily_work')" to="/daily_work" 
            @click="closeSidebarOnMobile" class="nav-item" active-class="active">
            <i class="pi pi-calendar"></i><span>ลงงานรายวัน</span>
          </router-link>
          <router-link v-if="hasAccess('/car_booking')" to="/car_booking" 
            @click="closeSidebarOnMobile" class="nav-item" active-class="active">
            <i class="pi pi-car"></i><span>เเจ้งใช้รถ</span>
          </router-link>
          <router-link v-if="hasAccess('/leave_work')" to="/leave_work" 
            @click="closeSidebarOnMobile" class="nav-item" active-class="active">
            <i class="pi pi-sign-out"></i><span>ลางาน</span>
          </router-link>
          <router-link v-if="hasAccess('/projects')" to="/projects" 
            @click="closeSidebarOnMobile" class="nav-item" active-class="active">
            <i class="pi pi-briefcase"></i><span>โครงการ</span>
          </router-link>
          <router-link v-if="hasAccess('/management')" to="/management" 
            @click="closeSidebarOnMobile" class="nav-item" active-class="active">
            <i class="pi pi-cog"></i><span>จัดการระบบ</span>
          </router-link>
        </nav>

        <div class="sidebar-footer">
          <Button @click="openPosition('bottom')" class="setting-button">
            <i class="pi pi-cog"></i><span>Setting</span>
          </Button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <ScrollPanel class="content-scroll">
        <RouterView />
      </ScrollPanel>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
// import { upperCase } from "@/App.vue";
import axios from "axios";
import ConfirmDialog from "primevue/confirmdialog";
import { usePermissions } from "@/composables/usePermissions";

const { loadPermissions, hasAccess } = usePermissions();

const position = ref("center");
const visible = ref(false);
const sessionDialog = ref(false);
const sidebarVisible = ref(true);
const isMobile = ref(window.innerWidth <= 768);

const openPosition = (pos) => {
  position.value = pos;
  visible.value = true;
};

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};

const closeSidebarOnMobile = () => {
  if (window.innerWidth <= 768) {
    sidebarVisible.value = false;
  }
};

const updateIsMobile = () => {
  isMobile.value = window.innerWidth <= 768;
  if (window.innerWidth <= 768) {
    sidebarVisible.value = false;
  }
};

var currentTime = ref(new Date());

const currentDateTime = computed(() => {
  return currentTime.value.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
});

const resetTimer = () => {
  timeout.value = 300;
};

onMounted(() => {
  loadPermissions();
  startCountdown();
  window.addEventListener("mousemove", resetTimer);
  window.addEventListener("keydown", resetTimer);
  window.addEventListener("resize", updateIsMobile);
  updateIsMobile();

  setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(countdownTimer);
  window.removeEventListener("mousemove", resetTimer);
  window.removeEventListener("keydown", resetTimer);
  window.removeEventListener("resize", updateIsMobile);
});

const timeout = ref(300);
let countdownTimer = null;

const reloadTab = () => {
  sessionDialog.value = true;
};

const locationLogout = () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/login";
};

const logout = async () => {
  try {
    await axios.post('/api/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    });
    window.location.href = "/login";
  }
};

const startCountdown = () => {
  countdownTimer = setInterval(() => {
    timeout.value--;
    if (timeout.value <= 0) {
      clearInterval(countdownTimer);
      reloadTab();
    }
  }, 2000);
};
</script>

<style scoped>
.layout-wrapper {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 220px;
  min-width: 220px;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
}

.logo-section {
  text-align: center;
  padding: 1rem 0;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 1rem;
}

.logo-section img {
  max-width: 120px;
  height: auto;
}

.datetime-section {
  margin-bottom: 1rem;
}

.datetime-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  padding: 0.5rem;
  border-radius: 8px;
}

.nav-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #495057;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.nav-item:hover {
  background: #e9ecef;
}

.nav-item.active {
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white !important;
}

.nav-item i {
  font-size: 1.1rem;
  width: 24px;
}

.sidebar-footer {
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.setting-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #4A90E2, #D73527) !important;
  color: white !important;
  border: none !important;
  border-radius: 8px !important;
  font-size: 0.9rem;
  cursor: pointer;
}

/* Main Content */
.main-content {
  flex: 1;
  overflow: hidden;
  background: #f8f9fa;
}

.content-scroll {
  width: 100%;
  height: 100vh;
}

.content-scroll :deep(.p-scrollpanel-content) {
  padding: 0.5rem;
  width: 100%;
}

/* Toggle Button */
.sidebar-toggle-btn {
  position: fixed;
  top: 0.5rem;
  left: 225px;
  z-index: 1001;
  background: linear-gradient(135deg, #4A90E2, #D73527) !important;
  color: white !important;
  border: none !important;
  border-radius: 8px !important;
  width: 36px !important;
  height: 36px !important;
  transition: all 0.3s ease !important;
}

.sidebar-collapsed .sidebar-toggle-btn {
  left: 0.5rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .sidebar {
    width: 200px;
    min-width: 200px;
  }
  .sidebar-toggle-btn {
    left: 205px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 260px;
    z-index: 1000;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  }
  
  .sidebar-toggle-btn {
    left: 0.5rem;
    top: 0.5rem;
  }
  
  .layout-wrapper:not(.sidebar-collapsed) .sidebar-toggle-btn {
    left: 265px;
  }
  
  .main-content {
    width: 100%;
  }
  
  .content-scroll :deep(.p-scrollpanel-content) {
    padding: 0.5rem;
    padding-top: 3rem;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 100vw;
  }
  
  .layout-wrapper:not(.sidebar-collapsed) .sidebar-toggle-btn {
    left: calc(100vw - 50px);
  }
  
  .logo-section img {
    max-width: 100px;
  }
  
  .nav-item {
    padding: 0.6rem 0.75rem;
    font-size: 0.85rem;
  }
}
</style>
