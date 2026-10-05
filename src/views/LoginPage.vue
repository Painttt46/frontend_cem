<template>
  <Toast />
  <div class="">
    <!-- <div class="" style="margin-top: calc(20vh)"> -->
    <div class="row bg-card justify-content-center">
      <div class="col-11 col-sm-8 col-md-6 col-xl-3 justify-content-center login-col">
        <div class="card-body-1 ">
          <div class="text-center mb-3">
            <img src="/NGENT.png" alt="GENT Logo" style="max-width: 200px; height: auto;" />
          </div>
          <div class="">
            <h3 class="text-center text-white">GenT Excellency Management</h3>
          </div>
          <div class="card-body-2">
            <form @submit.prevent="handleLogin">
              <div class="mt-3 pt-3">
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-user"></i>
                  </InputGroupAddon>
                  <InputText type="text" class=" w-100" id="username" v-model="username" :invalid="isUserValid"
                    placeholder="Username" />
                </InputGroup>
              </div>
              <div class="mt-3 pt-3">
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-key"></i>
                  </InputGroupAddon>
                  <Password v-model="password" :feedback="false" id="password" toggle-mask="" :invalid="isPasswordValid"
                    placeholder="Password" class="w-100" />
                </InputGroup>
              </div>
              <div style="text-align: center">
                <Button type="submit" label="เข้าสู่ระบบ" :icon="loginIcon" :loading="isLoggingIn"
                  class="login-btn w-100 mt-4" :class="loginStatus" />
                <div class="mt-3">
                  <a href="#" @click.prevent="showForgotPassword" class="text-white text-decoration-none">
                    <i class="pi pi-question-circle me-1"></i>
                    ลืมรหัสผ่าน?
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Forgot Password Dialog -->
  <Dialog v-model:visible="showForgotDialog" header="" :style="{ width: '90vw', maxWidth: '400px' }" modal
    :draggable="false" position="center" class="forgot-password-dialog">
    <template #header>
      <div class="dialog-header">
        <div class="header-icon">
          <i class="pi pi-key"></i>
        </div>
        <h3>ลืมรหัสผ่าน</h3>
      </div>
    </template>

    <div class="dialog-body">
      <div class="input-wrapper">
        <div class="input-icon">
          <i class="pi pi-envelope"></i>
        </div>
        <InputText id="forgot-email" v-model="forgotEmail" placeholder="กรอกอีเมลของคุณ" class="w-full email-input"
          type="email" />
      </div>
      <div class="info-text">
        <i class="pi pi-info-circle"></i>
        <span>เราจะส่ง Username และ Password ใหม่ไปให้คุณ</span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button label="ยกเลิก" class="p-button-outlined p-button-secondary cancel-btn" @click="closeForgotDialog" />
        <Button label="ส่ง" icon="pi pi-send" class="send-btn" @click="sendPasswordReset" :loading="sendingEmail"
          :disabled="!forgotEmail" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios from '@/utils/axiosConfig';
import router from "@/router";
import { usePermissions } from '@/composables/usePermissions';

import InputText from "primevue/inputtext";
import Password from "primevue/password";
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';

import { useToast } from "primevue/usetoast";

const toast = useToast();

var isUserValid = false;
var isPasswordValid = false;
var username = ref("");
var password = ref("");
var showForgotDialog = ref(false);
var forgotEmail = ref("");
var sendingEmail = ref(false);
var isLoggingIn = ref(false);
var loginIcon = ref("");
var loginStatus = ref("");

onMounted(() => {
  // ถ้า back มาหน้า login (มี token อยู่) ให้ clear ข้อมูลทั้งหมด
  if (localStorage.getItem('soc_token')) {
    ['soc_token','soc_user_id','soc_role','soc_firstname','soc_lastname','soc_position','soc_department','soc_nickname','soc_email'].forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }
  // Replace history เพื่อไม่ให้กด back/forward ไปหน้าอื่นได้
  window.history.replaceState(null, '', '/login');
  window.history.pushState(null, '', '/login');
  window.addEventListener('popstate', handlePopState);
});

const handlePopState = () => {
  window.history.pushState(null, '', '/login');
};

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState);
});

const showForgotPassword = () => {
  showForgotDialog.value = true;
};

const closeForgotDialog = () => {
  showForgotDialog.value = false;
  forgotEmail.value = "";
  sendingEmail.value = false;
};

const sendPasswordReset = async () => {
  
  
  
  
  if (!forgotEmail.value) {
    toast.add({
      severity: 'warn',
      summary: 'ข้อผิดพลาด',
      detail: 'กรุณากรอกอีเมล',
      life: 3000
    });
    return;
  }

  sendingEmail.value = true;
  

  try {
    const response = await axios.post('/api/auth/forgot-password', {
      email: forgotEmail.value
    });
    
    

    if (response.data.success) {
      toast.add({
        severity: 'success',
        summary: 'ส่งอีเมลสำเร็จ',
        detail: 'ข้อมูลการเข้าสู่ระบบได้ถูกส่งไปยังอีเมลของคุณแล้ว',
        life: 5000
      });
    }

    closeForgotDialog();
  } catch (error) {
    
    let errorMessage = 'เกิดข้อผิดพลาด';

    if (error.response?.status === 404) {
      errorMessage = 'ไม่พบอีเมลในระบบ กรุณาตรวจสอบอีเมลหรือติดต่อผู้ดูแลระบบ';
    } else {
      errorMessage = error.response?.data?.error || 'ไม่สามารถส่งข้อมูลได้';
    }

    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: errorMessage,
      life: 5000
    });
  } finally {
    sendingEmail.value = false;
  }
};

function handleLogin() {
  auth(username.value, password.value);
}

async function auth(username, password) {
  isLoggingIn.value = true;
  loginIcon.value = "";
  loginStatus.value = "";

  // Clear old data before login attempt
  localStorage.removeItem("soc_token");
  localStorage.removeItem("soc_user");
  localStorage.removeItem("soc_role");
  localStorage.removeItem("soc_user_id");
  localStorage.removeItem("soc_firstname");
  localStorage.removeItem("soc_lastname");
  localStorage.removeItem("soc_position");

  var data = {
    username: username,
    password: password,
  };

  // ดึง public IP ก่อน login
  let clientIp = '';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    const ipResponse = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const ipData = await ipResponse.json();
    clientIp = ipData.ip;
  } catch (e) {
    // ไม่สามารถดึง public IP ได้ - ไม่ critical ข้ามไปได้
  }

  // Use proxy instead of direct localhost
  axios
    .post('/api/auth/login', data, {
      headers: clientIp ? { 'X-Client-IP': clientIp } : {}
    })
    .then(function (response) {
      // Show success icon
      loginIcon.value = "pi pi-check";
      loginStatus.value = "login-success";

      // Store new data
      localStorage.setItem("soc_user", response.data.username);
      localStorage.setItem("soc_token", response.data.access_token);
      localStorage.setItem("soc_role", response.data.role);
      localStorage.setItem("soc_position", response.data.position);
      localStorage.setItem("soc_firstname", response.data.firstname);
      localStorage.setItem("soc_lastname", response.data.lastname);
      localStorage.setItem("soc_user_id", response.data.user);

      // Navigate after showing success
      setTimeout(async () => {
        isLoggingIn.value = false;
        const { loadPermissions, getFirstAccessibleRoute } = usePermissions();
        await loadPermissions();
        const targetRoute = getFirstAccessibleRoute();
        router.push(targetRoute).catch(() => {
          isLoggingIn.value = false;
        });
      }, 800);
    })
    .catch(function (auth_error) {
      // Show error icon
      loginIcon.value = "pi pi-times";
      loginStatus.value = "login-error";

      setTimeout(() => {
        isLoggingIn.value = false;
        loginIcon.value = "";
        loginStatus.value = "";
      }, 1500);

      let errorDetail = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";

      if (auth_error.message == "Network Error") {
        errorDetail = "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
      } else if (auth_error.message.includes("timeout")) {
        errorDetail = "หมดเวลาการเชื่อมต่อ";
      } else if (auth_error.response?.data?.error === "Account is disabled") {
        errorDetail = "บัญชีถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ";
      }

      toast.add({
        severity: "error",
        summary: "เข้าสู่ระบบไม่สำเร็จ",
        detail: errorDetail,
        life: 3000,
      });
    });
}
</script>

<style>
body {
  width: 100%;
}

.bg-card {
  background: rgb(0, 212, 255);
  background: linear-gradient(45deg, rgba(0, 212, 255, 1) 0%, rgba(11, 3, 45, 1) 100%);

  background-image: url('../assets/images/LoginBG.jpg');
  background-size: cover;
  background-position: center;

  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  position: relative;
}

/* ฟิล์มสีกรมท่าไล่เฉดทับภาพพื้นหลัง ให้การ์ดและตัวหนังสืออ่านง่ายขึ้นและโทนเข้ากับแบรนด์ (น้ำเงิน → แดงจาง ๆ) */
.bg-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(160deg, rgba(8, 18, 38, 0.62) 0%, rgba(8, 18, 38, 0.28) 55%, rgba(120, 22, 22, 0.30) 100%);
}

.login-col {
  position: relative;
  z-index: 1;
  flex: 0 0 auto !important;
  width: min(440px, 92vw) !important;
  max-width: 440px !important;
}

/* การ์ดเดียว (เดิมเป็นกล่องซ้อนกล่อง) แบบกระจกฝ้า */
.card-body-1 {
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 24px;
  padding: 2rem 2rem 1.5rem;
  backdrop-filter: blur(22px) saturate(160%);
  -webkit-backdrop-filter: blur(22px) saturate(160%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.card-body-1 h3 {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-shadow: none;
  margin-bottom: 0.25rem;
}

.card-body-2 {
  background: transparent;
  padding: 0;
  border: none;
}

.card-body-1 .p-inputtext,
.card-body-1 .p-password input {
  height: 48px;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
}

.card-body-1 .p-inputgroup .p-inputtext,
.card-body-1 .p-inputgroup .p-password input {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.card-body-1 .p-inputgroup-addon {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-right: none;
  border-radius: 12px 0 0 12px;
  color: var(--brand-blue-700);
  min-width: 3rem;
}

.card-body-1 .p-inputtext:enabled:focus {
  /* ช่องกรอกบนการ์ดกระจก: ใช้ขอบขาวหนา + outline น้ำเงิน แทนวงแสง (ไม่มีเงา) */
  border-color: #fff;
  outline: 2px solid #4A90E2;
  outline-offset: 0;
  box-shadow: none;
}

.card-body-1 a {
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.card-body-1 a:hover {
  color: #fff !important;
}

/* Forgot Password Dialog Styles */
.forgot-password-dialog {
  width: 400px !important;
  min-width: 280px !important;
  max-width: 90vw !important;
}

.forgot-password-dialog :deep(.p-dialog) {
  border-radius: 16px !important;
  overflow: hidden !important;
}

.forgot-password-dialog :deep(.p-dialog-content) {
  border-radius: 0 0 16px 16px !important;
}

.forgot-password-dialog .p-dialog-header-close {
  right: 8px !important;
  top: 2px !important;
  width: 28px !important;
  height: 28px !important;
  background: white !important;
  border-radius: 50% !important;
  color: #333 !important;
  box-shadow: none !important;
}

.forgot-password-dialog .p-dialog-header-close:hover {
  background: #f8f9fa !important;
  color: #000 !important;
}

.forgot-password-dialog .p-dialog-content {
  width: 100% !important;
  max-width: 90vw !important;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .forgot-password-dialog {
    width: 90vw !important;
    margin: 0 5vw !important;
    max-height: 50vh !important;
  }

  .dialog-header {
    padding: 10px 15px 8px !important;
  }

  .header-icon {
    width: 25px !important;
    height: 25px !important;
    margin-right: 8px !important;
  }

  .header-icon i {
    font-size: 12px !important;
  }

  .dialog-header h3 {
    font-size: 14px !important;
  }

  .dialog-body {
    padding: 15px 0 !important;
  }

  .input-wrapper {
    margin-bottom: 12px !important;
  }

  .input-icon {
    left: 10px !important;
    font-size: 12px !important;
  }

  .email-input {
    padding: 10px 12px 10px 35px !important;
    font-size: 13px !important;
  }

  .info-text {
    padding: 10px 12px !important;
    font-size: 11px !important;
    gap: 6px !important;
  }

  .info-text i {
    font-size: 12px !important;
  }

  .dialog-footer {
    padding-top: 15px !important;
    gap: 8px !important;
  }

  .cancel-btn,
  .send-btn {
    padding: 10px 15px !important;
    font-size: 12px !important;
  }

  .forgot-password-dialog .p-dialog-header-close {
    width: 24px !important;
    height: 24px !important;
    right: 6px !important;
    top: 2px !important;
  }
}

.forgot-password-dialog .p-dialog-header {
  padding: 0 !important;
  border-bottom: none !important;
  width: 100% !important;
}

.dialog-header {
  display: flex;
  align-items: center;
  padding: 12px 20px 10px;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border-radius: 16px;
  margin: -1.5rem -1.5rem 0;
}

.header-icon {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.header-icon i {
  font-size: 14px;
  color: white;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.dialog-body {
  padding: 15px 0;
}

.input-wrapper {
  position: relative;
  margin-bottom: 12px;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #4A90E2;
  z-index: 1;
}

.email-input {
  border: 2px solid #e9ecef !important;
  border-radius: 8px !important;
  padding: 10px 15px 10px 40px !important;
  font-size: 14px !important;
  transition: all 0.3s ease !important;
  background: #f8f9fa !important;
}

.email-input:focus {
  border-color: #4A90E2 !important;
  box-shadow: none !important;
  background: white !important;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background-color: #ebecf9;
  border-radius: 8px;
  border-left: 4px solid #4A90E2;
  font-size: 12px;
  color: #555;
}

.info-text i {
  color: #4A90E2;
  font-size: 14px;
}

.email-input:focus {
  border-color: #4A90E2 !important;
  box-shadow: none !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.cancel-btn {
  padding: 8px 16px !important;
  border-radius: 8px !important;
  font-weight: 500 !important;
  font-size: 13px !important;
  border: 2px solid #e9ecef !important;
  color: #6c757d !important;
  transition: all 0.3s ease !important;
}

.cancel-btn:hover {
  border-color: #adb5bd !important;
  color: #495057 !important;
}

.login-btn {
  background: var(--brand-blue) !important;
  border: none !important;
  padding: 0 24px !important;
  height: 50px;
  font-size: 1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  border-radius: 14px !important;
  box-shadow: none !important;
  transition: all 0.3s ease !important;
}

.login-btn:hover {
  box-shadow: none !important;
  filter: brightness(1.05);
}

.login-success {
  background-color: #24b86e !important;
}

.login-error {
  background-color: #d22c3c !important;
}

.send-btn {
  background: #4A90E2 !important;
  border: none !important;
  padding: 8px 20px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  box-shadow: none !important;
  transition: all 0.3s ease !important;
}

.send-btn:hover:not(:disabled) {
  filter: brightness(0.93) !important;
}

.send-btn:disabled {
  opacity: 0.6 !important;
}
</style>
