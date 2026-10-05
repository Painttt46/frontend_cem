<template>
  <Teleport to="body">
    <Transition name="cp-fade">
      <div v-if="open" class="cp-backdrop" @mousedown.self="close">
        <div class="cp-panel" role="dialog" aria-modal="true" aria-label="ค้นหาและไปยังหน้าต่าง ๆ">
          <div class="cp-search">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input
              ref="inputEl"
              v-model="query"
              type="text"
              class="cp-input"
              placeholder="ค้นหาหน้า หรือโครงการ (ชื่อ / เลข SO / ลูกค้า)…"
              role="combobox"
              aria-expanded="true"
              aria-controls="cp-list"
              :aria-activedescendant="activeId"
              autocomplete="off"
              @keydown="onKeydown"
            />
            <kbd class="cp-kbd">Esc</kbd>
          </div>

          <ul id="cp-list" class="cp-list" role="listbox">
            <template v-for="group in groups" :key="group.title">
              <li class="cp-group" role="presentation">{{ group.title }}</li>
              <li
                v-for="item in group.items"
                :id="'cp-opt-' + item.index"
                :key="item.key"
                class="cp-item"
                :class="{ active: item.index === activeIndex }"
                role="option"
                :aria-selected="item.index === activeIndex"
                @mousemove="activeIndex = item.index"
                @click="choose(item)"
              >
                <span class="cp-icon" aria-hidden="true"><i :class="item.icon"></i></span>
                <span class="cp-text">
                  <b>{{ item.label }}</b>
                  <small v-if="item.hint">{{ item.hint }}</small>
                </span>
                <i class="pi pi-arrow-right cp-go" aria-hidden="true"></i>
              </li>
            </template>
            <li v-if="flat.length === 0" class="cp-empty">
              <i class="pi pi-search" aria-hidden="true"></i>
              <span>{{ loadingTasks ? 'กำลังโหลดรายการโครงการ…' : 'ไม่พบผลลัพธ์ที่ตรงกับคำค้นหา' }}</span>
            </li>
          </ul>

          <div class="cp-foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> เลือก</span>
            <span><kbd>Enter</kbd> เปิด</span>
            <span><kbd>Esc</kbd> ปิด</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axiosConfig'
import { usePermissions } from '@/composables/usePermissions'

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const { hasAccess } = usePermissions()

const open = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
const query = ref('')
const activeIndex = ref(0)
const inputEl = ref(null)
const tasks = ref([])
const loadingTasks = ref(false)
let tasksLoadedAt = 0

// หน้าที่ค้นหาได้ — สิทธิ์ใช้ตัวเดียวกับเมนูด้านข้าง (หน้าโปรไฟล์ไม่ต้องมีสิทธิ์)
const PAGES = [
  { path: '/daily_work', label: 'ลงงานรายวัน', icon: 'pi pi-calendar', words: 'งาน ตารางงาน daily work' },
  { path: '/car_booking', label: 'แจ้งใช้รถ', icon: 'pi pi-car', words: 'จองรถ คืนรถ car booking' },
  { path: '/leave_work', label: 'ลางาน', icon: 'pi pi-sign-out', words: 'ลา ลาป่วย ลากิจ พักร้อน leave' },
  { path: '/projects', label: 'โครงการ', icon: 'pi pi-briefcase', words: 'project โปรเจกต์ so' },
  { path: '/project-progress', label: 'ขั้นตอนโครงการ', icon: 'pi pi-chart-line', words: 'progress ความคืบหน้า workflow' },
  { path: '/procurement', label: 'จัดซื้อ', icon: 'pi pi-shopping-cart', words: 'procurement vendor po สั่งซื้อ' },
  { path: '/sales-activity', label: 'Sale (เข้าพบลูกค้า)', icon: 'pi pi-briefcase', words: 'sale ขาย เข้าพบ ลูกค้า visit' },
  { path: '/management', label: 'จัดการระบบ', icon: 'pi pi-cog', words: 'management admin ตั้งค่า' },
  { path: '/management/users', label: 'จัดการผู้ใช้งาน', icon: 'pi pi-users', words: 'user ผู้ใช้ พนักงาน' },
  { path: '/management/leave', label: 'จัดการการลางาน', icon: 'pi pi-calendar-times', words: 'โควตา วันหยุด leave' },
  { path: '/management/dashboard', label: 'Dashboard', icon: 'pi pi-chart-bar', words: 'รายงาน สถิติ ภาพรวม' },
  { path: '/management/settings', label: 'ตั้งค่าระบบ', icon: 'pi pi-sliders-h', words: 'settings หมวดหมู่ สถานะ สิทธิ์' },
  { path: '/profile', label: 'โปรไฟล์ของฉัน', icon: 'pi pi-user', words: 'profile รหัสผ่าน บัญชี' }
]

const norm = (s) => String(s || '').toLowerCase()

const pageItems = computed(() => {
  const q = norm(query.value).trim()
  return PAGES
    .filter(p => p.path === '/profile' || hasAccess(p.path))
    .filter(p => !q || norm(p.label + ' ' + p.words + ' ' + p.path).includes(q))
    .map(p => ({ key: 'p:' + p.path, kind: 'page', label: p.label, hint: p.path, icon: p.icon, to: p.path }))
})

const taskItems = computed(() => {
  const q = norm(query.value).trim()
  if (!q) return [] // ยังไม่พิมพ์: ไม่แสดงรายการโครงการ (มีเป็นร้อย)
  return tasks.value
    .filter(t => norm([t.so_number, t.task_name, t.customer_info, t.contract_number].join(' ')).includes(q))
    .slice(0, 8)
    .map(t => ({
      key: 't:' + t.id, kind: 'task', label: t.task_name || '(ไม่มีชื่อ)',
      hint: [t.so_number, t.customer_info].filter(Boolean).join(' · '),
      icon: 'pi pi-folder-open', to: { path: '/projects', query: { q: t.so_number || t.task_name } }
    }))
})

// จัดกลุ่ม + ใส่ index ต่อเนื่องเพื่อใช้กับลูกศรขึ้นลง
const groups = computed(() => {
  let i = 0
  const out = []
  if (pageItems.value.length) out.push({ title: 'หน้าในระบบ', items: pageItems.value.map(x => ({ ...x, index: i++ })) })
  if (taskItems.value.length) out.push({ title: 'โครงการ', items: taskItems.value.map(x => ({ ...x, index: i++ })) })
  return out
})
const flat = computed(() => groups.value.flatMap(g => g.items))
const activeId = computed(() => (flat.value.length ? 'cp-opt-' + activeIndex.value : undefined))

watch(query, () => { activeIndex.value = 0 })

const close = () => { open.value = false }

const choose = (item) => {
  if (!item) return
  close()
  router.push(item.to)
}

const scrollActiveIntoView = () => nextTick(() => document.getElementById('cp-opt-' + activeIndex.value)?.scrollIntoView({ block: 'nearest' }))

const onKeydown = (e) => {
  const n = flat.value.length
  if (e.key === 'ArrowDown') { e.preventDefault(); if (n) { activeIndex.value = (activeIndex.value + 1) % n; scrollActiveIntoView() } }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) { activeIndex.value = (activeIndex.value - 1 + n) % n; scrollActiveIntoView() } }
  else if (e.key === 'Enter') { e.preventDefault(); choose(flat.value[activeIndex.value]) }
  else if (e.key === 'Escape') { e.preventDefault(); close() }
}

// โหลดรายการโครงการเมื่อเปิดครั้งแรก (แคช 2 นาที) — เงียบ ไม่แสดงแถบโหลด และพลาดได้ (ยังค้นหาหน้าได้ตามปกติ)
const loadTasks = async () => {
  if (Date.now() - tasksLoadedAt < 2 * 60 * 1000 && tasks.value.length) return
  loadingTasks.value = true
  try {
    const res = await axios.get('/api/tasks', { silent: true })
    tasks.value = Array.isArray(res.data) ? res.data : []
    tasksLoadedAt = Date.now()
  } catch { /* ค้นหาโครงการไม่ได้ แต่ค้นหาหน้าได้ */ }
  finally { loadingTasks.value = false }
}

watch(open, (v) => {
  if (v) {
    query.value = ''
    activeIndex.value = 0
    nextTick(() => inputEl.value?.focus())
    loadTasks()
  }
})

// Ctrl/Cmd+K เปิด-ปิด · "/" เปิด (เมื่อไม่ได้พิมพ์อยู่ในช่องกรอก)
const onGlobalKey = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
    return
  }
  if (e.key === '/' && !open.value) {
    const el = document.activeElement
    const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
    if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      open.value = true
    }
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKey))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKey))
</script>

<style scoped>
.cp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 12vh 1rem 1rem;
  background: rgba(15, 23, 42, 0.45);
}

.cp-panel {
  width: min(600px, 100%);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: none;
  overflow: hidden;
}

.cp-search {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1.1rem;
  border-bottom: 1px solid var(--line);
}

.cp-search > i {
  color: var(--brand-blue);
  font-size: 1.1rem;
}

.cp-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 1.05rem;
  color: var(--ink);
}

.cp-input::placeholder {
  color: #94a3b8;
}

.cp-kbd,
.cp-foot kbd {
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--muted);
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-bottom-width: 2px;
  border-radius: 6px;
  padding: 0.1rem 0.4rem;
}

.cp-list {
  list-style: none;
  margin: 0;
  padding: 0.4rem;
  overflow-y: auto;
  flex: 1;
}

.cp-group {
  padding: 0.55rem 0.7rem 0.25rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.cp-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.7rem;
  border-radius: 12px;
  cursor: pointer;
  color: var(--ink);
  transition: background-color 0.12s ease;
}

.cp-item.active {
  background: var(--brand-blue-soft);
}

.cp-icon {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  color: var(--brand-blue-700);
  background: #f1f6fd;
}

.cp-item.active .cp-icon {
  color: #fff;
  background: var(--brand-blue);
}

.cp-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.cp-text b {
  font-size: 0.92rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cp-text small {
  font-size: 0.74rem;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cp-go {
  color: var(--brand-blue);
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.12s ease;
}

.cp-item.active .cp-go {
  opacity: 1;
}

.cp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.cp-empty i {
  font-size: 1.6rem;
  color: #b7c6dc;
}

.cp-foot {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 0.6rem 1rem;
  border-top: 1px solid var(--line);
  background: #fafbfd;
  font-size: 0.74rem;
  color: var(--muted);
}

.cp-foot span {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.cp-fade-enter-active,
.cp-fade-leave-active {
  transition: opacity 0.15s ease;
}

.cp-fade-enter-active .cp-panel,
.cp-fade-leave-active .cp-panel {
  transition: transform 0.15s ease;
}

.cp-fade-enter-from,
.cp-fade-leave-to {
  opacity: 0;
}

.cp-fade-enter-from .cp-panel,
.cp-fade-leave-to .cp-panel {
  transform: translateY(-8px) scale(0.98);
}

@media (max-width: 768px) {
  .cp-backdrop {
    padding-top: 6vh;
  }
  .cp-foot {
    display: none;
  }
}
</style>
