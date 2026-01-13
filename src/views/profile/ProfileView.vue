<template>
  <div class="profile-container">
    <Toast />
    <transition-group name="p-message" tag="div">
        <Message v-for="msg of messages" :key="msg.id" :severity="msg.severity">{{ msg.content }}</Message>
    </transition-group>

    <Card class="profile-card">
      <template #title>
        <div class="card-header">
          <i class="pi pi-user"></i>
          <span>ข้อมูลส่วนตัว</span>
        </div>
      </template>
      <template #content>
        <form @submit.prevent="updateUser">
          <div class="form-grid">
            <div class="form-field">
              <label for="username">ชื่อผู้ใช้</label>
              <InputText id="username" v-model="username" />
            </div>
            <div class="form-field">
              <label for="firstName">ชื่อ <span class="required">*</span></label>
              <InputText id="firstName" v-model="firstName" required />
            </div>
            <div class="form-field">
              <label for="lastName">นามสกุล <span class="required">*</span></label>
              <InputText id="lastName" v-model="lastName" required />
            </div>
            <div class="form-field">
              <label for="email">Email <span class="required">*</span></label>
              <InputText id="email" v-model="email" type="email" required />
            </div>
            <div class="form-field">
              <label for="phone">เบอร์โทร</label>
              <InputText id="phone" v-model="phone" placeholder="0xx-xxx-xxxx" />
            </div>
            <div class="form-field">
              <label for="employeeId">รหัสพนักงาน</label>
              <InputText id="employeeId" v-model="employeeId" disabled />
            </div>
            <div class="form-field">
              <label for="position">ตำแหน่ง</label>
              <InputText id="position" v-model="position" disabled />
            </div>
            <div class="form-field">
              <label for="department">แผนก</label>
              <InputText id="department" v-model="department" disabled />
            </div>
          </div>
          <div class="form-actions">
            <Button type="submit" label="บันทึก" icon="pi pi-check" />
          </div>
        </form>
      </template>
    </Card>

    <Card class="profile-card mt-4">
      <template #title>
        <div class="card-header">
          <i class="pi pi-lock"></i>
          <span>เปลี่ยนรหัสผ่าน</span>
        </div>
      </template>
      <template #content>
        <form>
          <div class="form-grid">
            <div class="form-field">
              <label for="currentPassword">รหัสผ่านปัจจุบัน</label>
              <Password id="currentPassword" v-model="currentPassword" 
                       toggle-mask :feedback="false" placeholder="กรอกรหัสผ่านปัจจุบัน" />
            </div>
            <div class="form-field">
              <label for="newPassword">รหัสผ่านใหม่</label>
              <Password id="newPassword" v-model="newPassword" 
                       toggle-mask :feedback="true" placeholder="กรอกรหัสผ่านใหม่" />
            </div>
            <div class="form-field">
              <label for="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
              <Password id="confirmPassword" v-model="confirmPassword" 
                       toggle-mask :feedback="false" placeholder="ยืนยันรหัสผ่านใหม่" />
            </div>
          </div>
          <div class="form-actions">
            <Button type="button" @click="confirmChangePassword" 
                    :disabled="!canChangePassword" 
                    label="เปลี่ยนรหัสผ่าน" 
                    icon="pi pi-key" 
                    severity="danger" />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Message from 'primevue/message';
import Toast from "primevue/toast";
import { useConfirm } from "primevue/useconfirm";

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// Loading state
const loading = ref(false);

// Computed properties
const canChangePassword = computed(() => {
  return currentPassword.value && 
         newPassword.value && 
         confirmPassword.value && 
         newPassword.value === confirmPassword.value &&
         newPassword.value.length >= 6;
});

onMounted(() => {
  fetchData();
});

// top message 
const messages = ref([]);

// data
var id = ref();
var username = ref();
var email = ref();
var phone = ref();
var firstName = ref();
var lastName = ref();
var employeeId = ref();
var role = ref();
var currentPassword = ref('');
var newPassword = ref();
var confirmPassword = ref('');
var position = ref();
var department = ref();
function fetchData() {
  const currentUserId = localStorage.getItem('soc_user_id');
  
  if (!currentUserId) {
    toast.add({
      severity: 'error',
      summary: 'ข้อผิดพลาด',
      detail: 'ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่',
      life: 3000
    });
    router.push('/login');
    return;
  }
  
  loading.value = true;
  
  // Use axios
  window.axios.get('/api/users')
    .then(response => {
      const users = response.data;
      const userData = users.find(user => user.id == currentUserId);
      
      if (!userData) {
        toast.add({
          severity: 'error',
          summary: 'ข้อผิดพลาด',
          detail: 'ไม่พบข้อมูลผู้ใช้',
          life: 3000
        });
        loading.value = false;
        return;
      }
      
      username.value = userData.username;
      email.value = userData.email;
      phone.value = userData.phone;
      firstName.value = userData.firstname;
      lastName.value = userData.lastname;
      employeeId.value = userData.employee_id;
      role.value = { name: userData.role };
      position.value = userData.position;
      department.value = userData.department;
      id.value = userData.id;
      loading.value = false;
    })
    .catch(() => {
      toast.add({
        severity: 'error',
        summary: 'ข้อผิดพลาด',
        detail: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้',
        life: 3000
      });
      loading.value = false;
    });
}

function updateUser() {
  const data = {
    username: username.value,
    firstname: firstName.value,
    lastname: lastName.value,
    email: email.value,
    phone: phone.value || null,
    employee_id: employeeId.value || null,
    position: position.value || null,
    department: department.value || null,
    role: role.value?.name || 'user'
  };

  window.axios.put(`/api/users/${id.value}`, data, {
    headers: {
    }
  }).then(() => {
    toast.add({
      severity: 'success',
      summary: 'สำเร็จ',
      detail: 'อัพเดทข้อมูลเรียบร้อยแล้ว',
      life: 3000
    });
    
    localStorage.setItem('soc_firstname', firstName.value);
    localStorage.setItem('soc_lastname', lastName.value);
    localStorage.setItem('soc_position', position.value);
    localStorage.setItem('soc_department', department.value);
  }).catch(error => {
    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: error.response?.data?.error || 'ไม่สามารถอัพเดทข้อมูลได้',
      life: 3000
    });
  });
}
function confirmChangePassword() {
  confirm.require({
      message: 'คุณต้องการเปลี่ยนรหัสผ่านหรือไม่?',
      header: 'ยืนยันการเปลี่ยนรหัสผ่าน',
      icon: 'pi pi-exclamation-triangle',
      rejectClass: 'p-button-secondary p-button-outlined',
      rejectLabel: 'ยกเลิก',
      acceptLabel: 'ยืนยัน',
      accept: () => {
          changePassword();
      }
  });
}

function changePassword() {
  // Validation
  if (!currentPassword.value) {
    toast.add({ severity: 'error', summary: 'ข้อผิดพลาด', detail: 'กรุณากรอกรหัสผ่านปัจจุบัน', life: 3000 });
    return;
  }
  
  if (!newPassword.value || newPassword.value.length < 6) {
    toast.add({ severity: 'error', summary: 'ข้อผิดพลาด', detail: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร', life: 3000 });
    return;
  }
  
  if (newPassword.value !== confirmPassword.value) {
    toast.add({ severity: 'error', summary: 'ข้อผิดพลาด', detail: 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน', life: 3000 });
    return;
  }
  
  var data = { 
    currentPassword: currentPassword.value,
    password: newPassword.value 
  };
  
  window.axios.put(`/api/users/${id.value}/password`, data, {
      headers: {
      }
  })
      // eslint-disable-next-line
      .then(changePass_res => {
          currentPassword.value = "";
          newPassword.value = "";
          confirmPassword.value = "";
          toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', life: 3000 });
      }).catch(changePass_err => {
          const errorMessage = changePass_err.response?.data?.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้';
          toast.add({ severity: 'error', summary: 'เกิดข้อผิดพลาด', detail: errorMessage, life: 3000 });
      });
}

</script>
<style scoped>
.profile-container {
  padding: 1.5rem 0.5rem;
  max-width: 96%;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.profile-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.card-header i {
  font-size: 1.5rem;
  color: #3b82f6;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem 3rem;
  margin-bottom: 2rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 500;
  color: #374151;
  font-size: 0.95rem;
}

.required {
  color: #ef4444;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .profile-container {
    padding: 1rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .card-header {
    font-size: 1.1rem;
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-actions button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .profile-container {
    padding: 0.75rem;
  }

  .form-field label {
    font-size: 0.9rem;
  }
}
</style>