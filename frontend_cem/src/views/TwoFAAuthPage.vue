/* eslint-disable no-alert, no-console */
<template>
  <Toast />
  <!-- <div class="" style="margin-top: calc(20vh)">
    <div class="row justify-content-center">
      <div class="col-11 col-sm-8 col-md-6 col-xl-3 justify-content-center">
        <div class="card">
          <div class="card-header">
            <h3 class="text-center">ระบบยืนยันตัวตน 2 ขั้นตอน</h3>
          </div>
          <div class="card-body">
            <form @submit.prevent="handleLogin">
              <div class=" mt-3 pt-3">
                <FloatLabel>
                  <InputText type="text" class="form-control" id="username" v-model="username" :invalid="isUserValid" />
                  <label for="username">ชื่อผู้ใช้</label>
                </FloatLabel>
              </div>
              <div class=" mt-3 pt-3">
                <FloatLabel>
                  <Password v-model="password" :feedback="false" id="password" toggle-mask="" :invalid="isPasswordValid"
                    class=" w-100" />
                  <label for="password">รหัสผ่าน</label>
                </FloatLabel>
              </div>
              <div style="text-align: center;">
                <button type="submit" class="btn btn-primary btn-block mt-4 w-100">เข้าสู่ระบบ</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div> -->
  <div class="" style="margin-top: calc(5vh)">
    <div class="row justify-content-center">
      <div class="col-12 justify-content-center">
        <h2 class="text-center">ระบบยืนยันตัวตน 2 ขั้นตอน</h2>
        <h3 class="text-center">โปรดใช้แอพ Microsoft Authenticator หรือ Google Authenticator เพื่อยืนยันตัวตนกับบัญชีของคุณ</h3>
        <div v-if="twofa !== null && twofa == 0">
          <div class="row justify-content-center mt-5">
            <div class="col-4">
              <h4><b>ขั้นตอนที่ 1: เชื่อมต่อ Authenticator เข้ากับบัญชี</b></h4>
              <h5>ทางเลือกที่ 1: เปิดแอพ เลือกเพิ่มบัญชีด้วยการสแกน QR Code และสแกน QR Code ด้านล่างนี้</h5>
            </div>
          </div>

          <div class="row justify-content-center">
            <div class="col-2 justify-content-center" style="text-align: center">
              <img class="justify-content-center" :src=qrcode style="width: 70%; height: auto;" />
            </div>
          </div>

          <div class="row justify-content-center mt-5">
            <div class="col-4">
              <h5>ทางเลือกที่ 2: เปิดแอพ เลือกเพิ่มบัญชีด้วยการกรอก key และกรอก key ที่อยู่ด้านล่างนี้</h5>
              <h5>Key: {{secret}}</h5>
            </div>
          </div>
          <form @submit.prevent="handleLogin">
            <div class="row justify-content-center mt-5">
              <div class="col-4">
                <h4><b>ขั้นตอนที่ 2: กรอกหมายเลขที่ได้รับจาก Authenticator ใส่ลงในช่องด้านล่าง</b></h4>
                <!-- <FloatLabel> -->
                <InputText v-model="code" :feedback="false" id="password" toggle-mask="" placeholder="Authentication code"/>
                <div class="row">
                  <div class="col-4">
                    <button type="submit" class="btn btn-primary btn-block mt-3">ยืนยัน</button>
                  </div>
                </div>
                <!-- </FloatLabel> -->
              </div>
            </div>
          </form>
        </div>
        <div v-if="twofa !== null && twofa == 1">
          <form @submit.prevent="handleLogin">
            <div class="row justify-content-center mt-5">
              <div class="col-4 justify-content-center text-center">
                <img src="../assets/images/mobile.png" style=" height: 200px; margin-left: 50px;" />
                <h4 class="text-center mt-5" ><b>กรอกหมายเลขที่ได้รับจาก Authenticator ใส่ลงในช่องด้านล่าง</b></h4>
                <!-- <FloatLabel> -->
                <InputText v-model="code" :feedback="false" id="password" toggle-mask="" placeholder="Authentication code"/>
                <div class="row justify-content-center">
                  <div class="col-4 justify-content-center">
                    <button type="submit" class="btn btn-primary btn-block mt-3">ยืนยัน</button>
                  </div>
                </div>
                <!-- </FloatLabel> -->
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import router from '@/router';
/* eslint-disable */
import InputText from 'primevue/inputtext';
// import Password from 'primevue/password';

import { useToast } from 'primevue/usetoast';

const toast = useToast();
/* eslint-disable */
var isUserValid = false;
var isPasswordValid = false;
var qrcode = ref(localStorage.getItem('two-authentication'));
var code = ref("");
var twofa = ref(localStorage.getItem('twofa'));
var secret = ref(localStorage.getItem('secret'));

onMounted(() => {
  // if (localStorage.length > 0) {
  //   localStorage.clear();
  // 
  // qrcode = localStorage.getItem('two-authentication')
});
function handleLogin() {
  auth(code.value);
}

function auth(code) {
  localStorage.getItem('soc_user_id')
  var ip = "/auth/verifyotp";
  var data = {
    "totp": code,
    "userId": localStorage.getItem('soc_user_id')
  };

  axios.post(ip, data).then(function (response) {
    localStorage.removeItem("two-authentication");
    if (response.data.status == 200) {
      router.push("/dashboard");
    }else{
      toast.add({
        severity: 'error', summary: 'Fail', detail: 'code incorrect.', life: 3000
      });
    }
  }).catch(function (auth_error) {
    if (auth_error.message == "Network Error") {
      toast.add({
        severity: 'error', summary: 'Fail', detail: auth_error.message, life: 3000
      });
    } else if (auth_error.message.includes("timeout")) {
      toast.add({
        severity: 'error', summary: 'Fail', detail: 'Timeout', life: 3000
      });
    }
    else {
      toast.add({
        severity: 'error', summary: 'Fail', detail: 'code incorrect.', life: 3000
      });
    }
  });
}
</script>

<style>
body {
  width: 100%;
}
</style>

/* eslint-disable no-alert, no-console */
