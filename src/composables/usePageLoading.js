import { ref, readonly } from 'vue'
import { activity } from '@/utils/axiosConfig'

// ฉากโหลดตอนเข้าหน้า: เปิดทันทีที่เปลี่ยนหน้า แล้วปิดเมื่อ "คำขออ่านข้อมูลทั้งหมดของหน้านั้นเสร็จ"
// เพื่อไม่ให้ผู้ใช้เห็นหน้าว่าง/"ยังไม่มีข้อมูล" แวบหนึ่งก่อนข้อมูลมา
const MIN_MS = 300      // แสดงอย่างน้อยเท่านี้ — กันกะพริบในหน้าที่โหลดเร็วมาก
const SETTLE_MS = 300   // ต้องไม่มีคำขอใหม่/เพิ่งจบมานานเท่านี้ (หน้าส่วนใหญ่ยิงคำขอต่อกันเป็นทอด: สิทธิ์ → รายการ → รายละเอียด)
const MAX_MS = 20000    // เพดานสูงสุด — คำขอค้าง/ช้าเกินไม่ทำให้หน้าถูกบังตลอด
const TICK_MS = 80

const loading = ref(false)
let startedAt = 0
let timer = null

function finish() {
  if (timer) clearInterval(timer)
  timer = null
  loading.value = false
}

function tick() {
  const now = Date.now()
  const elapsed = now - startedAt
  if (elapsed >= MAX_MS) return finish()
  const idleSince = Math.max(startedAt, activity.lastChange)
  const idle = activity.reads === 0 && now - idleSince >= SETTLE_MS
  if (elapsed >= MIN_MS && idle) finish()
}

// เรียกตอนเข้าแอป/เปลี่ยนหน้า (เรียกซ้ำระหว่างโหลดอยู่ = เริ่มนับใหม่ ไม่ซ้อนกัน)
export function beginPageLoading() {
  startedAt = Date.now()
  loading.value = true
  if (!timer) timer = setInterval(tick, TICK_MS)
}

export function usePageLoading() {
  return { pageLoading: readonly(loading), beginPageLoading }
}
