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
      <span>session หมดอายุ! กรุณาทำการล็อกอินใหม่อีกครั้ง</span>
    </div>
    <template #footer>
      <Button label="OK" class="p-button-danger" @click="locationLogout" />
    </template>
  </Dialog>
  <!-- Dialog Session หมดอายุ -->

  <div class="flex flex-column card layout-shell" :class="{ 'sidebar-hidden': !sidebarVisible, 'rail-mode': railMode }" style="height: 100vh; height: 100dvh; width: 100%; overflow: hidden;">
    <div class="row layout-row" style="height: 100%; overflow: hidden;">
      <!-- Toggle Button - แสดงด้านซ้ายเสมอ -->
      <Button @click="toggleSidebar" class="sidebar-toggle-btn"
        :icon="sidebarOpenState ? 'pi pi-chevron-left' : 'pi pi-chevron-right'" severity="secondary" text
        v-tooltip="toggleLabel" :aria-label="toggleLabel" :aria-expanded="sidebarOpenState" />

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

      <div v-show="sidebarVisible" class="col-3 col-sm-3 col-md-2 col-lg-2 col-xl-2 bg-light p-0 sidebar-column" :class="{ 'is-collapsed': railMode }">
        <div class="p-4 sidebar-container" style="height: 100%; padding-top: 0px !important">
          <div class="logo-section">
            <img src="@/assets/images/NGENT.png" alt="GENT Logo" style="max-width: 150px; height: auto;" />
          </div>

          <div class="datetime-section">
            <div class="datetime-display">
              <i class="pi pi-calendar"></i>
              <span>{{ currentDateTime }}</span>
            </div>
          </div>

          <button type="button" class="palette-trigger" @click="paletteOpen = true" aria-label="ค้นหาหน้าและโครงการ (Ctrl+K)" title="ค้นหา (Ctrl+K)">
            <i class="pi pi-search" aria-hidden="true"></i>
            <span class="palette-label">ค้นหา…</span>
            <kbd>Ctrl K</kbd>
          </button>

          <ul class="nav-menu">
            <li class="nav-item ml-2 mt-2" v-if="hasAccess('/daily_work')">
              <router-link to="/daily_work" @click="closeSidebarOnMobile" class="nav-link" active-class="active" title="ลงงานรายวัน">
                <h5 class="mt-2">
                  <i class="pi pi-calendar px-2" style="font-size: 1.5rem"></i>ลงงานรายวัน
                </h5>
              </router-link>
            </li>
            <li class="nav-item ml-2 mt-2" v-if="hasAccess('/car_booking')">
              <router-link to="/car_booking" @click="closeSidebarOnMobile" class="nav-link" active-class="active" title="แจ้งใช้รถ">
                <h5 class="mt-2">
                  <i class="pi pi-car px-2" style="font-size: 1.5rem"></i>แจ้งใช้รถ
                </h5>
              </router-link>
            </li>
            <li class="nav-item ml-2 mt-2" v-if="hasAccess('/leave_work')">
              <router-link to="/leave_work" @click="closeSidebarOnMobile" class="nav-link" active-class="active" title="ลางาน">
                <h5 class="mt-2">
                  <i class="pi pi-sign-out px-2" style="font-size: 1.5rem"></i>ลางาน
                </h5>
              </router-link>
            </li>
            <li class="nav-item ml-2 mt-2" v-if="hasAccess('/projects')">
              <router-link to="/projects" @click="closeSidebarOnMobile" class="nav-link" active-class="active" title="โครงการ">
                <h5 class="mt-2">
                  <i class="pi pi-briefcase px-2" style="font-size: 1.5rem"></i>โครงการ
                </h5>
              </router-link>
            </li>
            <li class="nav-item ml-2 mt-2" v-if="hasAccess('/project-progress')">
              <router-link to="/project-progress" @click="closeSidebarOnMobile" class="nav-link" active-class="active" title="ขั้นตอนโครงการ">
                <h5 class="mt-2">
                  <i class="pi pi-chart-line px-2" style="font-size: 1.5rem"></i>ขั้นตอนโครงการ
                </h5>
              </router-link>
            </li>
            <li class="nav-item ml-2 mt-2" v-if="hasAccess('/procurement')">
              <router-link to="/procurement" @click="closeSidebarOnMobile" class="nav-link" active-class="active" title="จัดซื้อ">
                <h5 class="mt-2">
                  <i class="pi pi-shopping-cart px-2" style="font-size: 1.5rem"></i>จัดซื้อ
                </h5>
              </router-link>
            </li>
            <li class="nav-item ml-2 mt-2" v-if="hasAccess('/sales-activity')">
              <router-link to="/sales-activity" @click="closeSidebarOnMobile" class="nav-link" active-class="active" title="Sale">
                <h5 class="mt-2">
                  <i class="pi pi-briefcase px-2" style="font-size: 1.5rem"></i>Sale
                </h5>
              </router-link>
            </li>
            <!-- แสดงเมื่อมีสิทธิ์หน้าใดก็ได้ในส่วนจัดการระบบ (ไม่ต้องติ๊ก /management คู่) — ดู MANAGEMENT_SECTION_KEYS -->
            <li class="nav-item ml-2 mt-2" v-if="canAccessRoute('/management')">
              <router-link to="/management" @click="closeSidebarOnMobile" class="nav-link" active-class="active" title="จัดการระบบ">
                <h5 class="mt-2">
                  <i class="pi pi-cog px-2" style="font-size: 1.5rem"></i>จัดการระบบ
                </h5>
              </router-link>
            </li>
          </ul>
          <div class="sidebar-footer">
            <router-link to="/profile" class="user-card" @click="closeSidebarOnMobile" aria-label="ไปที่โปรไฟล์ของฉัน">
              <span class="user-avatar" aria-hidden="true">{{ userInitial }}</span>
              <span class="user-meta">
                <b>{{ userFullName }}</b>
                <small>{{ soc_role || '' }}</small>
              </span>
              <i class="pi pi-angle-right" aria-hidden="true"></i>
            </router-link>
            <Button @click="openPosition('bottom')" class="setting-button" icon="pi pi-cog" label="Setting" />
            <!-- <router-link to="/login" class="nav-link"><h5><i class="pi pi-sign-out px-2" style="font-size: 1.2rem;"></i>Logout</h5></router-link> -->
            <!-- <router-link to="/login" class="btn btn-danger" style="width: 100%;">ออกจากระบบ</router-link> -->
          </div>
        </div>
      </div>

      <div :class="[mainContentClass, 'main-column']" style="height: 100%; padding: 0; overflow: hidden;">
        <div class="pt-1 pb-3 container-fluid h-100 content-padding">
          <div class="main-content-wrapper">
            <!-- ความสูง = กรอบเนื้อหาพอดี (เดิม calc(100vh) สูงกว่ากรอบ: ล้นลงล่าง 15–20px และบนมือถือ 100vh รวมพื้นที่ใต้แถบเบราว์เซอร์ ทำให้ท้ายหน้าถูกบัง) -->
            <ScrollPanel style="
                width: 100%;
                height: 100%;
                padding-right: 0;
                padding-bottom: 0.5rem;
              ">
              <RouterView />
            </ScrollPanel>
          </div>
        </div>
        <!-- ฉากโหลดตอนเข้าหน้า: บังเนื้อหาจนข้อมูลมาครบ (กันเห็นหน้าว่าง/สถานะ "ไม่มีข้อมูล" แวบก่อนข้อมูลมา)
             วางไว้ใน .main-column (ไม่ใช่ใน .main-content-wrapper) เพื่อคลุมเต็มพื้นที่จนถึงขอบล่างสุด — เดิมกรอบ wrapper เหลื่อมจากขอบล่าง
             (padding ของ container) ~15px ทำให้เห็นเนื้อหาโผล่ที่ขอบล่างทั้งที่ยังหมุนโหลดอยู่ -->
        <div class="page-loading" :class="{ 'page-loading--done': !pageLoading }" role="status" aria-live="polite"
          :aria-busy="pageLoading" :aria-hidden="!pageLoading">
          <div class="page-loading-spinner" aria-hidden="true"></div>
          <div class="page-loading-text">กำลังโหลดข้อมูล…</div>
        </div>
      </div>
    </div>

    <CommandPalette v-model="paletteOpen" />

    <!-- มือถือ: แถบเมนูล่าง (เมนูที่ใช้บ่อย) — เมนูที่เหลืออยู่ใต้ปุ่ม "เมนู" -->
    <nav v-if="isMobile" class="mobile-tabbar" aria-label="เมนูหลัก">
      <router-link v-for="item in mobileNav" :key="item.to" :to="item.to" class="mobile-tab" active-class="active">
        <i :class="item.icon" aria-hidden="true"></i>
        <span>{{ item.label }}</span>
      </router-link>
      <button type="button" class="mobile-tab" :class="{ active: sidebarVisible }" @click="toggleSidebar" aria-label="เมนูทั้งหมด">
        <i class="pi pi-bars" aria-hidden="true"></i>
        <span>เมนู</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import ConfirmDialog from "primevue/confirmdialog";
import { usePermissions } from "@/composables/usePermissions";
import { usePageLoading } from "@/composables/usePageLoading";
import CommandPalette from "@/components/CommandPalette.vue";

const { loadPermissions, hasAccess, canAccessRoute } = usePermissions();

// ทุกหน้า: โชว์ฉากโหลดจนกว่าข้อมูลของหน้านั้นจะมาครบ (ดู composables/usePageLoading.js)
const { pageLoading, beginPageLoading } = usePageLoading();
const route = useRoute();
watch(() => route.path, beginPageLoading);
// มือถือ: เปลี่ยนหน้าแล้วปิดเมนูเต็มจอเสมอ (เดิมปิดเฉพาะตอนกดลิงก์ในเมนู — เปลี่ยนหน้าด้วยวิธีอื่น เช่น ค้นหา Ctrl+K / ปุ่มในหน้า / แถบล่าง เมนูค้างบังหน้าใหม่)
watch(() => route.fullPath, () => { if (window.innerWidth <= 768) sidebarVisible.value = false; });

const position = ref("center");
const visible = ref(false);
const sessionDialog = ref(false);
const isMobile = ref(window.innerWidth <= 768);
// มือถือ: เริ่มด้วยเมนูซ่อนอยู่ (เดิมเมนูเต็มจอปิดบังเนื้อหาทุกครั้งที่เปิดแอป) กดปุ่มขอบจอเพื่อเปิดได้
const sidebarVisible = ref(!isMobile.value);
const paletteOpen = ref(false);

// เดสก์ท็อป: เมนูย่อเป็นแถบไอคอนได้ (จำค่าไว้ในเครื่อง) — มือถือใช้ซ่อน/แสดงเต็มจอเหมือนเดิม
const readCollapsed = () => { try { return localStorage.getItem("ui_sidebar_collapsed") === "1"; } catch { return false; } };
const sidebarCollapsed = ref(readCollapsed());
const railMode = computed(() => !isMobile.value && sidebarCollapsed.value);
// ลูกศรของปุ่ม: ชี้ซ้าย = กดแล้วจะย่อ/ซ่อน
const sidebarOpenState = computed(() => (isMobile.value ? sidebarVisible.value : !sidebarCollapsed.value));
// ข้อความของปุ่มพับเมนู (ใช้ทั้ง tooltip และ aria-label — เดิมตัวช่วยเข้าถึงอ่านเป็น "ก่อนหน้า/ถัดไป" จากรูปลูกศร)
const toggleLabel = computed(() => (isMobile.value ? (sidebarVisible.value ? 'ซ่อนเมนู' : 'แสดงเมนู') : (sidebarCollapsed.value ? 'ขยายเมนู' : 'ย่อเมนู')));

const openPosition = (pos) => {
  position.value = pos;
  visible.value = true;
};

const toggleSidebar = () => {
  if (isMobile.value) {
    sidebarVisible.value = !sidebarVisible.value;
    return;
  }
  sidebarCollapsed.value = !sidebarCollapsed.value;
  try { localStorage.setItem("ui_sidebar_collapsed", sidebarCollapsed.value ? "1" : "0"); } catch { /* ใช้ไม่ได้ก็ไม่เป็นไร */ }
};

const closeSidebarOnMobile = () => {
  if (window.innerWidth <= 768) {
    sidebarVisible.value = false;
  }
};

const updateIsMobile = () => {
  const wasMobile = isMobile.value;
  isMobile.value = window.innerWidth <= 768;
  // เปลี่ยนโหมด (หมุนมือถือแนวนอน↔แนวตั้ง, ย่อ/ขยายหน้าต่าง): มือถือเริ่มด้วยเมนูปิด เดสก์ท็อปเริ่มด้วยแถบเมนูเปิด
  // เดิมค่า sidebarVisible ค้างจากโหมดก่อน → หมุนจอกลับเป็นแนวตั้งแล้วเมนูเต็มจอเปิดค้างบังเนื้อหาทั้งหน้า (หรือกลับเป็นเดสก์ท็อปแล้วไม่มีแถบเมนู)
  if (wasMobile !== isMobile.value) sidebarVisible.value = !isMobile.value;
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

const userFullName = computed(() => [soc_firstname.value, soc_lastname.value].filter(v => v && v !== "No data").join(" ") || "ผู้ใช้งาน");
const userInitial = computed(() => (userFullName.value.charAt(0) || "?").toUpperCase());

// เมนูล่างบนมือถือ: เอา 4 รายการแรกที่ผู้ใช้มีสิทธิ์ (+ ปุ่ม "เมนู" เปิดรายการทั้งหมด)
// เดิมมีแค่ 4 หน้าตายตัว → role ที่ไม่มีสิทธิ์หน้าพวกนี้ (เช่นฝ่ายขายที่เข้าได้แค่ "เข้าพบลูกค้า"/"จัดซื้อ") แถบล่างว่างเหลือแต่ปุ่ม "เมนู"
const MOBILE_NAV = [
  { to: "/daily_work", label: "งานรายวัน", icon: "pi pi-calendar" },
  { to: "/car_booking", label: "จองรถ", icon: "pi pi-car" },
  { to: "/leave_work", label: "ลางาน", icon: "pi pi-sign-out" },
  { to: "/projects", label: "โครงการ", icon: "pi pi-briefcase" },
  { to: "/project-progress", label: "ขั้นตอน", icon: "pi pi-chart-line" },
  { to: "/procurement", label: "จัดซื้อ", icon: "pi pi-shopping-cart" },
  { to: "/sales-activity", label: "Sale", icon: "pi pi-briefcase" },
  { to: "/management", label: "จัดการ", icon: "pi pi-cog" },
];
const mobileNav = computed(() => MOBILE_NAV.filter(item => canAccessRoute(item.to)).slice(0, 4));

const resetTimer = () => {
  timeout.value = 300; // รีเซ็ตเวลาเป็น 5 นาที
};
// การใช้งานที่นับว่า "ยังอยู่": เดิมนับแค่ mousemove/keydown → บนมือถือ/แท็บเล็ต (ใช้นิ้วเลื่อน/แตะ ไม่มีเมาส์) ผู้ใช้ที่กำลังอ่านหรือเลื่อนหน้าอยู่
// ถูกเด้ง "session หมดอายุ" ทุก 5 นาที — scroll ไม่ bubble จึงต้องฟังแบบ capture
const ACTIVITY_EVENTS = ["mousemove", "keydown", "pointerdown", "touchstart", "wheel", "scroll"];
const ACTIVITY_OPTIONS = { capture: true, passive: true };

onMounted(() => {
  beginPageLoading();
  loadPermissions();
  startCountdown();
  ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetTimer, ACTIVITY_OPTIONS));
  window.addEventListener("resize", updateIsMobile);
  
  soc_user_id.value = localStorage.getItem("soc_user_id");
  soc_user.value = localStorage.getItem("soc_user");
  soc_role.value = localStorage.getItem("soc_role");
  soc_firstname.value = localStorage.getItem("soc_firstname") || "No data";
  soc_lastname.value = localStorage.getItem("soc_lastname") || "No data";
  if (soc_user.value != null) {
    soc_user_firstLetter.value = soc_user.value.charAt(0).toUpperCase();
  }

  // Update time every second
  setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(countdownTimer);
  ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimer, ACTIVITY_OPTIONS));
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
  ['soc_token','soc_user_id','soc_role','soc_firstname','soc_lastname','soc_position','soc_department','soc_nickname','soc_email'].forEach(k => localStorage.removeItem(k));
  sessionStorage.clear();
  window.location.href = "/login";
};

const logout = async () => {
  try {
    // เรียก API logout เพื่อ clear cookie
    await axios.post('/api/auth/logout');
  } catch {
    // ignore
  } finally {
    // Clear localStorage และ sessionStorage
    ['soc_token','soc_user_id','soc_role','soc_firstname','soc_lastname','soc_position','soc_department','soc_nickname','soc_email'].forEach(k => localStorage.removeItem(k));
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
  }, 1000);
};
</script>

<style scoped>
.dialog-footer {
  margin-bottom: 1rem;
}

.p-menuitem-link span {
  color: black !important;
}

/* ===== Sidebar toggle (ปุ่มลอยกลางขอบ) ===== */
/* ความกว้างแถบเมนูตอนนี้ — ใช้วางปุ่มพับให้คร่อมเส้นขอบขวาของแถบ (ตัวเลขต้องตรงกับ .sidebar-column ด้านล่าง) */
.layout-shell {
  --sidebar-w: 248px;
}

@media (min-width: 769px) and (max-width: 1100px) {
  .layout-shell {
    --sidebar-w: 220px;
  }
}

.layout-shell.rail-mode {
  --sidebar-w: 80px;
}

.sidebar-toggle-btn {
  position: fixed;
  /* กึ่งกลางจอด้วย calc ไม่ใช้ transform — กันปุ่มกระโดดตอน hover/คลิก */
  top: calc(50% - 22px);
  transform: none !important;
  translate: none !important;
  right: var(--toggle-btn-right);
  left: var(--toggle-btn-left);
  z-index: 1001;
  background: #fff !important;
  color: var(--brand-blue-700) !important;
  border: 1px solid var(--line) !important;
  border-radius: 12px !important;
  box-shadow: none !important;
  width: 34px !important;
  height: 44px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0.55;
  transition: opacity 0.25s ease, background-color 0.18s ease, border-color 0.18s ease !important;
}

.sidebar-toggle-btn:hover {
  opacity: 1;
  box-shadow: none !important;
}

.sidebar-hidden .sidebar-toggle-btn {
  right: auto;
}

/* เดสก์ท็อป: วงกลมเล็กคร่อมเส้นขอบขวาของแถบเมนู (ครึ่งหนึ่งอยู่ในแถบ ครึ่งหนึ่งอยู่ฝั่งเนื้อหา) ขยับตามความกว้างแถบเอง
   เดิมลอยอยู่ชิดขอบซ้ายสุดของจอ ทับบริเวณไอคอนเมนู -11px = ให้ขอบซ้ายของปุ่มล้ำเข้าในแถบ ~2px เกินปลายกล่องเมนู */
@media (min-width: 769px) {
  .sidebar-toggle-btn {
    left: calc(var(--sidebar-w) - 11px);
    right: auto;
    top: calc(50% - 14px);
    width: 28px !important;
    height: 28px !important;
    border-radius: 50% !important;
    border-color: var(--line-strong) !important;
    opacity: 0.9;
  }

  .sidebar-toggle-btn:hover {
    background: var(--brand-blue-soft) !important;
    border-color: var(--brand-blue) !important;
  }

  .sidebar-toggle-btn :deep(.p-button-icon) {
    font-size: max(0.78rem, var(--min-fs));
  }
}

.main-content-wrapper {
  --page-pad-x: 1rem; /* ระยะเว้นซ้าย-ขวาของเนื้อหาทุกหน้า (มือถือใช้ 0.5rem ด้านล่าง) */
  position: relative; /* เป็นกรอบให้ฉากโหลด .page-loading */
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}

/* ฉากโหลดตอนเข้าหน้า — ทึบ (สีพื้นหน้า) เพื่อไม่ให้เห็นหน้าว่างข้างใต้ */
.page-loading {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  background: var(--page-bg, #f4f7fb);
  color: var(--muted, #64748b);
}
.page-loading-spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--line, #e2e8f0);
  border-top-color: var(--brand-blue-700, #2f66b3);
  border-radius: 50%;
  animation: page-loading-spin 0.8s linear infinite;
}
.page-loading-text {
  font-size: 0.9rem;
}
@keyframes page-loading-spin {
  to { transform: rotate(360deg); }
}
/* ปิดฉาก: จางหาย แล้วซ่อน (ใช้ CSS ล้วน ไม่พึ่ง JS animation — ขึ้นทันทีตอนเปลี่ยนหน้า, จางออกตอนข้อมูลมาครบ) */
.page-loading--done {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease, visibility 0s linear 0.15s;
}
.page-loading--done .page-loading-spinner {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .page-loading-spinner { animation-duration: 2.4s; }
  .page-loading--done { transition: none; }
}

/* ===== Sidebar ===== */
/* เดสก์ท็อป/แท็บเล็ต: ความกว้างคงที่ (เดิมเป็นเปอร์เซ็นต์ของ bootstrap grid → จอเล็กเมนูแคบจนตัวหนังสือตกบรรทัด จอใหญ่กว้างเกินไป) */
@media (min-width: 769px) {
  .sidebar-column {
    flex: 0 0 248px !important;
    width: 248px !important;
    max-width: 248px !important;
  }
  .main-column {
    flex: 1 1 0 !important;
    width: auto !important;
    max-width: none !important;
    min-width: 0;
  }
}

@media (min-width: 769px) and (max-width: 1100px) {
  .sidebar-column {
    flex-basis: 220px !important;
    width: 220px !important;
    max-width: 220px !important;
  }
}

.sidebar-column {
  /* ไม่ทำ transition ความกว้างบนเดสก์ท็อป: ทุกเฟรมที่ความกว้างเปลี่ยน เนื้อหาหลัก (ตาราง/ฟอร์ม) ต้องจัด layout ใหม่ทั้งหน้า → กระตุก
     ส่วนมือถือเลื่อนเมนูเข้า-ออกด้วย transform (กำหนดไว้ใน @media ด้านล่าง) */
  background: #fff !important;
  border-right: 1px solid var(--line);
  box-shadow: none;
}

/* กรอบเมนูทั้งแถบเลื่อนได้ และรายการเมนูแสดงเต็ม (ไม่เลื่อนซ้อนในกรอบเล็ก)
 * เดิม .sidebar-container สูงตายตัว 100% + .nav-menu เลื่อนเองข้างใน → จอเตี้ย (มือถือ ~560px / หน้าต่างย่อ) รายการเมนูเหลือโผล่แค่ 2 แถว
 * ที่เหลือถูกการ์ดผู้ใช้/ปุ่ม Setting กินที่ และเมนูที่เหลือต้องเลื่อนในกรอบเล็กที่หาไม่เจอ */
.sidebar-column {
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: auto !important;
  min-height: 100%;
}
.main-column {
  position: relative; /* เป็นกรอบให้ฉากโหลด .page-loading ครอบเต็มพื้นที่เนื้อหา */
}

.logo-section {
  text-align: center;
  padding: 1.4rem 0 1.1rem;
  margin-bottom: 0.9rem;
  border-bottom: 1px solid var(--line);
}

.datetime-section {
  margin-bottom: 1.1rem;
}

.datetime-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-size: max(0.78rem, var(--min-fs));
  font-weight: 500;
  white-space: nowrap;
  background: var(--brand-blue-soft);
  color: var(--brand-blue-700);
  border: 1px solid #d5e5fa;
  padding: 0.6rem 0.5rem;
  border-radius: 12px;
  margin: 0 0.15rem; /* ระยะเว้นขอบซ้าย-ขวาเท่ากับกล่องอื่นในแถบ (ปุ่มค้นหา, เมนู, การ์ดผู้ใช้) = 0.15rem */
}

.datetime-display i {
  color: var(--brand-blue);
}

.nav-menu {
  flex: 1 0 auto;
  overflow: visible;
  list-style: none;
  margin: 0;
  padding: 0 0.15rem;
}

.nav-menu .nav-item {
  margin: 0.2rem 0 !important;
  padding: 0;
}

.nav-menu .nav-link {
  display: block;
  border-radius: 12px;
  padding: 0;
  color: var(--ink-soft) !important;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.nav-menu .nav-link h5 {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 0 !important;
  padding: 0.62rem 0.8rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: inherit !important;
}

.nav-menu .nav-link h5 i {
  font-size: 1.1rem !important;
  width: 1.6rem;
  padding: 0 !important;
  text-align: center;
  color: var(--muted);
  transition: color 0.18s ease;
}

.nav-menu .nav-link:hover {
  background: #f1f6fd;
  color: var(--brand-blue-700) !important;
}

.nav-menu .nav-link:hover h5 i {
  color: var(--brand-blue);
}

.nav-menu .nav-link.active {
  background: var(--brand-blue-soft);
  color: var(--brand-blue-700) !important;
}

.nav-menu .nav-link.active h5 {
  font-weight: 600;
}

.nav-menu .nav-link.active h5 i {
  color: var(--brand-blue);
}

h1,
h2,
h3,
h4 {
  color: black !important;
}

/* ===== ปุ่มค้นหา (Ctrl+K) ===== */
.palette-trigger {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: calc(100% - 0.3rem);
  margin: 0 0.15rem 0.9rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fafcff;
  color: var(--muted);
  font-family: inherit;
  font-size: max(0.85rem, var(--min-fs));
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
}

.palette-trigger:hover {
  border-color: #cfe1f8;
  background: #f1f6fd;
  box-shadow: none;
}

.palette-trigger i {
  color: var(--brand-blue);
}

.palette-label {
  flex: 1;
  text-align: left;
}

.palette-trigger kbd {
  font-family: inherit;
  font-size: max(0.66rem, var(--min-fs));
  font-weight: 600;
  color: var(--muted);
  background: #fff;
  border: 1px solid #e2e8f0;
  border-bottom-width: 2px;
  border-radius: 6px;
  padding: 0.05rem 0.35rem;
}

/* ===== เมนูย่อเป็นแถบไอคอน (เดสก์ท็อป) ===== */
@media (min-width: 769px) {
  .sidebar-column.is-collapsed {
    flex-basis: 80px !important;
    width: 80px !important;
    max-width: 80px !important;
  }

  .is-collapsed .sidebar-container {
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }

  .is-collapsed .logo-section img {
    max-width: 52px !important;
  }

  .is-collapsed .datetime-section,
  .is-collapsed .palette-label,
  .is-collapsed .palette-trigger kbd,
  .is-collapsed .user-meta,
  .is-collapsed .user-card > i,
  .is-collapsed .setting-button :deep(.p-button-label) {
    display: none;
  }

  .is-collapsed .palette-trigger {
    justify-content: center;
    padding: 0.6rem 0;
  }

  /* ไอคอนค้นหาและ Setting ใหญ่เท่าไอคอนเมนู (เดิม 14px vs 17px) ให้ทั้งแถบดูเป็นระเบียบเดียวกัน */
  .is-collapsed .palette-trigger i {
    font-size: 1.25rem;
  }

  .is-collapsed .nav-menu .nav-link h5 {
    font-size: 0;
    gap: 0;
    justify-content: center;
    padding: 0.7rem 0;
  }

  .is-collapsed .nav-menu .nav-link h5 i {
    font-size: 1.25rem !important;
    width: auto;
  }

  .is-collapsed .nav-menu .nav-link:hover {
    transform: none;
  }

  .is-collapsed .user-card {
    justify-content: center;
    padding: 0.45rem 0;
  }

  .is-collapsed .setting-button {
    padding: 0.6rem 0;
  }

  .is-collapsed .setting-button :deep(.p-button-icon) {
    margin: 0;
    font-size: 1.25rem;
  }
}

.user-card {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.65rem;
  margin-bottom: 0.6rem;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #fafcff;
  color: var(--ink) !important;
  transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.user-card:hover {
  background: #f1f6fd;
  border-color: #cfe1f8;
  box-shadow: none;
}

.user-avatar {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  background: var(--brand-blue);
}

.user-meta {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.user-meta b {
  font-size: max(0.88rem, var(--min-fs));
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-meta small {
  font-size: max(0.74rem, var(--min-fs));
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-card > i {
  color: var(--muted);
  font-size: 0.9rem;
}

/* ===== แถบเมนูล่าง (มือถือ) ===== */
.mobile-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 998;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  padding: 0.35rem 0.4rem calc(0.35rem + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid var(--line);
  box-shadow: none;
}

.mobile-tab {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.4rem 0.2rem;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--muted) !important;
  font-family: inherit;
  font-size: max(0.7rem, var(--min-fs));
  font-weight: 500;
  cursor: pointer;
  transition: color 0.18s ease, background-color 0.18s ease;
}

.mobile-tab i {
  font-size: 1.25rem;
}

.mobile-tab span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.mobile-tab.active {
  color: var(--brand-blue-700) !important;
  background: var(--brand-blue-soft);
  font-weight: 600;
}

@media (max-width: 768px) {
  /* ปุ่มลอยกลางขอบจอมีไว้ปิดเมนูเต็มจอเท่านั้น — ตอนเมนูซ่อนใช้แถบเมนูล่างแทน */
  .sidebar-hidden .sidebar-toggle-btn {
    display: none !important;
  }

  /* เนื้อหาเลื่อนสุดแล้วต้องไม่ถูกแถบเมนูล่างทับ */
  .main-content-wrapper :deep(.p-scrollpanel-content) {
    padding-bottom: calc(76px + env(safe-area-inset-bottom)) !important;
    /* PrimeVue เว้นขวา 18px เพื่อซ่อนสกรอลล์บาร์ (เราซ่อนไว้แล้ว) — ถ้าไม่เอาออก ขอบขวาของทุกหน้าจะกว้างกว่าขอบซ้าย */
    padding-right: 0 !important;
  }
}

.sidebar-footer {
  padding: 0.9rem 0.15rem 1rem; /* เดิม 0.4rem ทำให้การ์ดผู้ใช้/ปุ่ม Setting แคบกว่ากล่องอื่น ~3px ต่อข้าง */
  border-top: 1px solid var(--line);
  margin-top: 0.5rem;
}

.setting-button {
  width: 100%;
  justify-content: center;
  background: #fff !important;
  color: var(--ink-soft) !important;
  border: 1px solid var(--line) !important;
  box-shadow: var(--shadow-xs) !important;
}

.setting-button:hover {
  background: #f1f6fd !important;
  color: var(--brand-blue-700) !important;
  border-color: #cfe1f8 !important;
  box-shadow: none !important;
}

.setting-button:active {
  transform: translateY(0) !important;
}

.content-padding {
  /* ขอบซ้าย-ขวาของพื้นที่เนื้อหา เท่ากัน (เดิมซ้าย 1rem แต่ขวา 0 แล้วไปชดเชยที่ ScrollPanel อีกที) */
  padding-right: 0.5rem;
  padding-left: 0.5rem;
}

/* bootstrap .row มี margin ซ้าย-ขวาติดลบ (-0.75rem) ทำให้ทั้งแถว (แถบเมนู + เนื้อหา) ล้นออกนอกจอข้างละ ~10px
   แถบเมนูจึงถูกตัดขอบซ้ายทิ้ง ส่วนที่เห็นจริงแคบกว่าที่ออกแบบ — ไอคอนถูกจัดกึ่งกลางของแถบเต็ม แต่ตาเห็นแค่ส่วนที่เหลือ
   เลยดูเยื้องซ้าย (ตอนย่อเมนู: ห่างขอบซ้าย ~22px แต่ห่างขอบขวา ~32px) → ตัด margin ติดลบออกทุกขนาดจอ */
.layout-row {
  margin-left: 0;
  margin-right: 0;
}

/* ScrollPanel ของ PrimeVue เว้นขวา 18px ไว้ซ่อน scrollbar ของตัวเอง (เราซ่อน scrollbar ไว้แล้ว และ layout.css ตั้ง width:100%)
   ถ้าไม่เอาออก ขอบขวาของทุกหน้าจะกว้างกว่าขอบซ้าย */
.main-content-wrapper :deep(.p-scrollpanel-content) {
  padding-right: 0 !important;
}

/* ทุกหน้า (root ของแต่ละ view) ตั้ง height:100% + overflow:auto ไว้เอง = เป็นกรอบเลื่อนของตัวเอง → scrollbar 8px กินที่ด้านขวาข้างเดียว
   เนื้อหาเลยเยื้องซ้าย และกว้างไม่เท่ากันระหว่างหน้าที่มี/ไม่มี scrollbar
   สำรองที่ของ scrollbar ไว้ "ทั้งสองข้าง" (stable both-edges) → ขอบซ้าย-ขวาเท่ากันทุกหน้า แม้เนื้อหายังสั้นจนไม่มี scrollbar
   overflow-y:auto กำกับด้วย เพราะ scrollbar-gutter ใช้ได้เฉพาะ element ที่เป็นกรอบเลื่อน (หน้าโปรไฟล์/วิเคราะห์ ฯลฯ ไม่ได้ตั้งไว้) */
.main-content-wrapper :deep(.p-scrollpanel-content) > * {
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
  /* ระยะเว้นซ้าย-ขวาของ root ทุกหน้าใช้ค่าเดียวกัน (แต่ละหน้าตั้งไว้ต่างกันตั้งแต่ 0.25rem ถึง 2rem + โปรไฟล์ตั้ง max-width 96%)
     เฉพาะแนวนอน — แนวตั้งยังเป็นของแต่ละหน้า (specificity สูงกว่ากฎของแต่ละหน้า จึงไม่ต้องใช้ !important) */
  padding-left: var(--page-pad-x);
  padding-right: var(--page-pad-x);
  /* ระยะบนสุดถึงแบนเนอร์หัวหน้าก็ใช้ค่าเดียวกันทุกหน้า (เดิม 0.5–1.5rem ต่างกัน ทำให้แบนเนอร์อยู่สูงต่ำไม่เท่ากัน) */
  padding-top: var(--page-pad-top, 1rem);
  /* ระยะล่างสุดเท่ากันทุกหน้า (เดิม 0–20px: บางหน้าการ์ดสุดท้ายชิดขอบล่างของจอ) */
  padding-bottom: var(--page-pad-bottom, 1.5rem);
  max-width: 100%;
}

/* ระยะใต้บล็อกสุดท้ายของหน้าให้เหลือแค่ระยะล่างสุดข้างบน (กัน margin-bottom ของแต่ละหน้าซ้อนทับจนล่างหนากว่าหน้าอื่น) */
.main-content-wrapper :deep(.p-scrollpanel-content) > * > :last-child {
  margin-bottom: 0;
}

/* utility ของ bootstrap (.mb-4 / .mt-4 ตายตัว 1.5rem + !important) ที่ใช้คั่นบล็อกระดับหน้า → ใช้ระยะมาตรฐานเดียวกับที่เหลือ
   (บนมือถือ token เป็น 1rem จึงไม่โตกว่าหน้าอื่น); บล็อกสุดท้ายไม่ต้องเว้นล่างซ้ำกับระยะล่างสุดของหน้า */
.main-content-wrapper :deep(.p-scrollpanel-content) > * > .mb-4 {
  margin-bottom: var(--section-gap) !important;
}
.main-content-wrapper :deep(.p-scrollpanel-content) > * > .mt-4 {
  margin-top: var(--section-gap) !important;
}
.main-content-wrapper :deep(.p-scrollpanel-content) > * > .mb-4:last-child {
  margin-bottom: 0 !important;
}

/* Responsive - ทุก device ที่หน้าจอเล็ก */
@media (max-width: 768px) {
  .content-padding {
    padding-right: 0.75rem;
    padding-left: 0.75rem;
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
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    height: 100% !important;
    width: 100% !important;
    z-index: 999;
    box-shadow: none;
    transform: translateX(0);
    transition: transform 0.3s ease;
    overflow-y: auto !important;
  }

  .sidebar-container {
    min-height: 100% !important;
    padding-bottom: 100px !important;
  }

  .main-content-wrapper {
    --page-pad-x: 0.5rem;
    padding: 0;
    margin-left: 0;
    margin-right: 0;
    width: 100%;
  }

  /* มือถือ/จอแคบ: ซ่อน scrollbar ของ root แต่ละหน้า (เครื่องจริงเป็น overlay อยู่แล้ว) — ไม่ต้องสำรองที่ว่างสองข้างให้เสียความกว้าง */
  .main-content-wrapper :deep(.p-scrollpanel-content) > * {
    scrollbar-width: none;
  }

  .main-content-wrapper :deep(.p-scrollpanel-content) > *::-webkit-scrollbar {
    display: none;
  }
}

/* ซ่อน sidebar เมื่อหน้าจอเล็ก */
@media (max-width: 768px) {
  .sidebar-hidden .sidebar-column {
    transform: translateX(-100%);
  }
}

/* ซ่อน scrollbar ของ ScrollPanel */
:deep(.p-scrollpanel-bar-y),
:deep(.p-scrollpanel-bar) {
  display: none !important;
  width: 0 !important;
  opacity: 0 !important;
}

:deep(.p-scrollpanel-content) {
  overflow: auto !important;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

:deep(.p-scrollpanel-content)::-webkit-scrollbar {
  display: none !important;
}
</style>
