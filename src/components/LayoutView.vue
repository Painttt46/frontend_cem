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
  <!-- Dialog Session หมดอายุ -->

  <div class="flex flex-column card" :class="{ 'sidebar-hidden': !sidebarVisible }" style="height: 100vh; width: 100%">
    <div class="row" style="height: 100%">
      <!-- Toggle Button - แสดงด้านซ้ายเสมอ -->
      <Button @click="toggleSidebar" class="sidebar-toggle-btn"
        :icon="sidebarVisible ? 'pi pi-chevron-left' : 'pi pi-chevron-right'" severity="secondary" text
        :v-tooltip="sidebarVisible ? 'ซ่อนเมนู' : 'แสดงเมนู'" />

      <Dialog v-model:visible="visible" header="Setting" 
        :style="{ width: isMobile ? '90vw' : '400px', maxWidth: '90vw', bottom: '20px' }" 
        :position="position" :modal="true" :draggable="false">
        <div class="flex align-items-center gap-3 mb-3 mt-3">
          <router-link to="/profile" @click="visible = false" class="nav-link">
            <h5>
              <i class="pi pi-megaphone px-2" style="font-size: 1.5rem"></i>Profile
            </h5>
          </router-link>
        </div>
        <div class="flex align-items-center gap-3 mb-3">
          <router-link to="/login" @click="logout" class="nav-link">
            <h5>
              <i class="pi pi-sign-out px-2" style="font-size: 1.2rem"></i>Logout
            </h5>
          </router-link>
        </div>
        <div class="flex justify-content-end dialog-footer">
          <Button type="button" label="Cancel" severity="danger" @click="visible = false"></Button>
        </div>
      </Dialog>

      <div v-show="sidebarVisible" class="col-3 col-sm-3 col-md-2 col-lg-2 col-xl-2 bg-light p-0 sidebar-column">
        <div class="p-4 sidebar-container" style="height: 100%; padding-top: 0px !important">
          <div class="logo-section">
            <img src="@/assets/images/GENT.png" alt="GENT Logo" style="max-width: 150px; height: auto;" />
          </div>

          <div class="datetime-section">
            <div class="datetime-display">
              <i class="pi pi-calendar"></i>
              <span>{{ currentDateTime }}</span>
            </div>
          </div>

          <ul class="nav-menu">
            <li class="nav-item ml-2 mt-2" v-if="hasAccess('/car_booking')">
              <router-link to="/car_booking" @click="closeSidebarOnMobile" class="nav-link" active-class="active">
                <h5 class="mt-2">
                  <i class="pi pi-car px-2" style="font-size: 1.5rem"></i>เเจ้งใช้รถ
                </h5>
              </router-link>
            </li>
            <li class="nav-item ml-2 mt-2" v-if="hasAccess('/leave_work')">
              <router-link to="/leave_work" @click="closeSidebarOnMobile" class="nav-link" active-class="active">
                <h5 class="mt-2">
                  <i class="pi pi-sign-out px-2" style="font-size: 1.5rem"></i>ลางาน
                </h5>
              </router-link>
            </li>
            <li class="nav-item ml-2 mt-2" v-if="hasAccess('/daily_work')">
              <router-link to="/daily_work" @click="closeSidebarOnMobile" class="nav-link" active-class="active">
                <h5 class="mt-2">
                  <i class="pi pi-calendar px-2" style="font-size: 1.5rem"></i>ลงงานรายวัน
                </h5>
              </router-link>
            </li>
            <li class="nav-item ml-2 mt-2" v-if="hasAccess('/projects')">
              <router-link to="/projects" @click="closeSidebarOnMobile" class="nav-link" active-class="active">
                <h5 class="mt-2">
                  <i class="pi pi-briefcase px-2" style="font-size: 1.5rem"></i>โครงการ
                </h5>
              </router-link>
            </li>
            <li class="nav-item ml-2 mt-2" v-if="hasAccess('/management')">
              <router-link to="/management" @click="closeSidebarOnMobile" class="nav-link" active-class="active">
                <h5 class="mt-2">
                  <i class="pi pi-cog px-2" style="font-size: 1.5rem"></i>จัดการระบบ
                </h5>
              </router-link>
            </li>
          </ul>
          <div class="nav-item ml-2"
            style="width: 100%; color: white; vertical-align: bottom; display: flex; justify-content: center;">
            <Button @click="openPosition('bottom')" style="
                width: 80%;
                min-width: 8rem;
                color: white;
                background: linear-gradient(135deg, #4A90E2, #D73527);
                border: none;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 8px 16px;
              " class="setting-button">
              <h5 style="margin: 0; display: flex; align-items: center; justify-content: center;">
                <i class="pi pi-cog px-2" style="font-size: 1.2rem"></i>Setting
              </h5>
            </Button>
            <!-- <router-link to="/login" class="nav-link"><h5><i class="pi pi-sign-out px-2" style="font-size: 1.2rem;"></i>Logout</h5></router-link> -->
            <!-- <router-link to="/login" class="btn btn-danger" style="width: 100%;">ออกจากระบบ</router-link> -->
          </div>
        </div>
      </div>

      <div :class="mainContentClass" style="height: 100%; padding: 0;">
        <div class="pt-1 pb-3 container-fluid h-100" style="padding-right: 0; padding-left: 0;">
          <div class="main-content-wrapper">
            <ScrollPanel style="
                width: 100%;
                height: calc(100vh);
                padding-right: 0;
                padding-bottom: 0.5rem;
              ">
              <RouterView />
            </ScrollPanel>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { upperCase } from "@/App.vue";
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
};

const mainContentClass = computed(() => {
  return sidebarVisible.value
    ? 'col-9 col-sm-9 col-md-10 col-lg-10 col-xl-10'
    : 'col-12';
});

var soc_user_id = ref();
var soc_user = ref();
var soc_user_firstLetter = ref();
var soc_role = ref();
var soc_firstname = ref();
var soc_lastname = ref();

var users = ref();
var currentTime = ref(new Date());

const currentDateTime = computed(() => {
  return currentTime.value.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
});

function fetchData() {
  axios.get('/user', {
  }).then(user_response => {
    users.value = user_response.data.data;
  });
}

const resetTimer = () => {
  timeout.value = 300; // รีเซ็ตเวลาเป็น 5 นาที
};

onMounted(() => {
  loadPermissions();
  startCountdown();
  window.addEventListener("mousemove", resetTimer);
  window.addEventListener("keydown", resetTimer);
  window.addEventListener("resize", updateIsMobile);
  
  soc_user_id.value = localStorage.getItem("soc_user_id");
  soc_user.value = localStorage.getItem("soc_user");
  soc_role.value = localStorage.getItem("soc_role");
  soc_firstname.value = localStorage.getItem("soc_firstname") || "No data";
  soc_lastname.value = localStorage.getItem("soc_lastname") || "No data";
  if (soc_user.value != null) {
    soc_user_firstLetter.value = upperCase(soc_user.value.charAt(0));
  }

  // Update time every second
  setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
  fetchData
});

onUnmounted(() => {
  clearInterval(countdownTimer);
  window.removeEventListener("mousemove", resetTimer);
  window.removeEventListener("keydown", resetTimer);
  window.removeEventListener("resize", updateIsMobile);
});

const showSessionDialog = () => {
  sessionDialog.value = true
};

const timeout = ref(300) // 5 นาที (300 วินาที)
let countdownTimer = null; // ✅ กำหนดตัวแปรให้อยู่ภายนอก

const reloadTab = () => {
  // Don't clear localStorage immediately, let user choose
  showSessionDialog.value = true;
};
const locationLogout = () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/login";
};

const logout = async () => {
  try {
    // เรียก API logout เพื่อ clear cookie
    await axios.post('/api/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear localStorage และ sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    });
    
    // Redirect
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
.dialog-footer {
  margin-bottom: 1rem;
}

.p-menuitem-link span {
  color: black !important;
}

.sidebar-toggle-btn {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  right: var(--toggle-btn-right);
  left: var(--toggle-btn-left);
  z-index: 1001;
  background: linear-gradient(135deg, #4A90E2, #D73527) !important;
  color: white !important;
  border: none !important;
  border-radius: 8px !important;
  box-shadow: -2px 2px 8px rgba(74, 144, 226, 0.3) !important;
  width: 40px !important;
  height: 40px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0.3;
  transition: opacity 0.3s ease, box-shadow 0.3s ease !important;
}

.sidebar-toggle-btn:hover {
  opacity: 1;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4) !important;
}


.sidebar-hidden .sidebar-toggle-btn {
  right: auto;
}

.main-content-wrapper {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}

.sidebar-column {
  transition: all 0.3s ease;
}

.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.logo-section {
  text-align: center;
  padding: 1.5rem 0;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 1rem;
}

.datetime-section {
  margin-bottom: 1.5rem;
}

.datetime-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  padding: 0.75rem;
  border-radius: 10px;
  margin: 0 0.5rem;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
}

.nav-menu {
  flex: 1;
  overflow-y: auto;
}

h1,
h2,
h3,
h4 {
  color: black !important;
}

.nav-link.active {
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white !important;
  border-radius: 8px;
  border-radius: 5px;
  padding: 2px;
  font-size: 20px;
}

.setting-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4) !important;
}

.setting-button:active {
  transform: translateY(0) !important;
}

/* Responsive - ทุก device ที่หน้าจอเล็ก */
@media (max-width: 768px) {
  .sidebar-toggle-btn {
    top: 50%;
    transform: translateY(-50%);
  }

  :root {
    --toggle-btn-right: 0.5rem;
    --toggle-btn-left: auto;
  }

  .sidebar-hidden {
    --toggle-btn-right: auto;
    --toggle-btn-left: 0.5rem;
  }

  .sidebar-column {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100%;
    z-index: 999;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    transform: translateX(0);
    transition: transform 0.3s ease;
  }

  .main-content-wrapper {
    padding: 0 0.5rem;
    margin-left: 0;
    margin-right: 0;
    width: calc(100% + 3.3rem);
  }
}

/* ซ่อน sidebar เมื่อหน้าจอเล็ก */
@media (max-width: 768px) {
  .sidebar-hidden .sidebar-column {
    transform: translateX(-100%);
  }
}

/* ซ่อน scrollbar ของ ScrollPanel */
:deep(.p-scrollpanel-bar-y) {
  display: none !important;
}
</style>
