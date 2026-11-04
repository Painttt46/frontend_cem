<template>
  <Card class="team-today mb-4">
    <template #content>
      <div class="tt-head">
        <div class="tt-title">
          <h3><i class="pi pi-users"></i> {{ isToday ? 'วันนี้ใครทำอะไร ที่ไหน' : 'ใครทำอะไร ที่ไหน' }}</h3>
          <small>{{ dateLabel }}<template v-if="!isWorkday"> · วันหยุด</template></small>
        </div>
        <div class="tt-date">
          <Button icon="pi pi-chevron-left" text rounded aria-label="วันก่อนหน้า" @click="shiftDay(-1)" />
          <Calendar v-model="selectedDate" dateFormat="dd/mm/yy" :manualInput="false" showIcon class="tt-calendar" />
          <Button icon="pi pi-chevron-right" text rounded aria-label="วันถัดไป" @click="shiftDay(1)" />
          <Button v-if="!isToday" label="วันนี้" size="small" outlined @click="goToday" />
        </div>
      </div>

      <div class="tt-chips" role="group" aria-label="กรองตามสถานะ">
        <button v-for="c in statusChips" :key="c.key" type="button" class="tt-chip" :class="[c.cls, { active: statusFilter === c.key }]"
          :aria-pressed="statusFilter === c.key" @click="statusFilter = c.key">
          {{ c.label }} <b>{{ c.count }}</b>
        </button>
      </div>

      <div v-if="placeChips.length" class="tt-chips tt-places" role="group" aria-label="กรองตามสถานที่">
        <span class="tt-chips-label"><i class="pi pi-map-marker"></i> สถานที่</span>
        <button v-for="p in visiblePlaces" :key="p.key" type="button" class="tt-chip tt-chip-place" :class="{ active: placeFilter === p.key }"
          :aria-pressed="placeFilter === p.key" @click="placeFilter = placeFilter === p.key ? null : p.key">
          {{ p.name }} <b>{{ p.count }}</b>
        </button>
        <button v-if="placeChips.length > MAX_PLACES" type="button" class="tt-more" @click="showAllPlaces = !showAllPlaces">
          {{ showAllPlaces ? 'แสดงน้อยลง' : `+${placeChips.length - MAX_PLACES} แห่ง` }}
        </button>
      </div>

      <div class="tt-filters">
        <InputText v-model="search" class="tt-search" placeholder="ค้นหา ชื่อ / โครงการ / SO / ลูกค้า / สถานที่ / รายละเอียด..." aria-label="ค้นหา" />
        <Dropdown v-model="deptFilter" :options="deptOptions" placeholder="ทุกแผนก" :showClear="true" class="tt-dept" aria-label="กรองตามแผนก" />
      </div>

      <p v-if="!canSeeAllVisits" class="tt-note">
        <i class="pi pi-info-circle"></i> บัญชีนี้ยังไม่มีสิทธิ์ "ดูกิจกรรมเข้าพบลูกค้าของทุกคน" จึงอาจไม่เห็นนัดเข้าพบของคนอื่น
      </p>

      <div v-if="loadError" class="tt-state tt-error" role="alert">
        <span><i class="pi pi-exclamation-triangle"></i> โหลดข้อมูลการลงงานไม่สำเร็จ</span>
        <Button label="ลองใหม่" size="small" outlined @click="load" />
      </div>
      <div v-else-if="fetching && !rows.length" class="tt-state">กำลังโหลดข้อมูล...</div>
      <div v-else-if="visibleRows.length === 0" class="tt-state">ไม่พบข้อมูลตามตัวกรองที่เลือก</div>

      <div v-else class="tt-grid" :class="{ 'tt-stale': fetching }">
        <article v-for="row in visibleRows" :key="row.id" class="tt-card" :class="`tt-card-${row.state}`">
          <header class="tt-card-head">
            <span class="tt-avatar" aria-hidden="true">{{ row.initial }}</span>
            <div class="tt-person">
              <button type="button" class="tt-name" @click="$emit('select-user', row.id)">{{ row.name }}</button>
              <small>{{ row.subtitle }}</small>
            </div>
            <span class="tt-badge" :class="`tt-badge-${row.badge.cls}`">{{ row.badge.text }}</span>
          </header>

          <div v-if="row.leaves.length" class="tt-leave">
            <i class="pi pi-calendar-times"></i>
            <span v-for="l in row.leaves" :key="l.id">{{ l.label }} · {{ l.time }}</span>
          </div>

          <ul v-if="row.items.length" class="tt-items">
            <li v-for="item in row.items" :key="item.key" class="tt-item" :class="{ 'tt-item-now': item.now }">
              <div class="tt-item-time">
                <i :class="item.kind === 'visit' ? 'pi pi-briefcase' : 'pi pi-clock'"></i>
                {{ item.timeText }}
                <span v-if="item.now" class="tt-now">กำลังทำ</span>
                <span v-else-if="item.statusText" class="tt-item-status">{{ item.statusText }}</span>
              </div>
              <div class="tt-item-title">
                <span v-if="item.so" class="tt-so">{{ item.so }}</span>{{ item.title }}
              </div>
              <div v-if="item.step" class="tt-item-step">ขั้นตอน: {{ item.step }}</div>
              <div v-if="item.location || item.customer" class="tt-item-meta">
                <span v-if="item.location"><i class="pi pi-map-marker"></i> {{ item.location }}</span>
                <span v-if="item.customer"><i class="pi pi-building"></i> {{ item.customer }}</span>
              </div>
              <template v-if="item.description">
                <p class="tt-item-desc" :class="{ open: openDesc[item.key] }">{{ item.description }}</p>
                <button v-if="item.description.length > 90" type="button" class="tt-more" @click="openDesc[item.key] = !openDesc[item.key]">
                  {{ openDesc[item.key] ? 'ย่อ' : 'ดูเพิ่ม' }}
                </button>
              </template>
            </li>
          </ul>
          <p v-else-if="row.state === 'missing'" class="tt-empty tt-empty-missing">ยังไม่มีการลงงาน{{ isToday ? 'วันนี้' : 'ในวันนี้' }}</p>
          <p v-else-if="row.state === 'none'" class="tt-empty">{{ isFuture ? 'ยังไม่มีแผนงาน' : 'ไม่มีรายการ' }}</p>

          <footer v-if="row.workload.length" class="tt-workload">
            <button type="button" class="tt-workload-toggle" :aria-expanded="!!openWorkload[row.id]" @click="openWorkload[row.id] = !openWorkload[row.id]">
              <span>งานที่ถืออยู่ <b>{{ row.summary.projects }}</b> โครงการ · <b>{{ row.summary.openSteps }}</b> ขั้นตอน</span>
              <span v-if="row.summary.overdue" class="tt-overdue">เกินกำหนด {{ row.summary.overdue }}</span>
              <i :class="openWorkload[row.id] ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
            </button>
            <ul v-if="openWorkload[row.id]" class="tt-projects">
              <li v-for="proj in row.workload" :key="proj.taskId">
                <div class="tt-project-name">
                  <span v-if="proj.soNumber" class="tt-so">{{ proj.soNumber }}</span>{{ proj.taskName }}
                  <small>คืบหน้า {{ proj.progress }}% ({{ proj.completedSteps }}/{{ proj.totalSteps }})</small>
                </div>
                <template v-for="step in proj.steps" :key="step.stepId">
                  <button v-if="step.stepStatus !== 'completed'" type="button" class="tt-step" @click="$emit('open-step', step.taskId, step.stepId)">
                    <span class="tt-dot" :class="`tt-dot-${step.stepStatus}`"></span>
                    <span class="tt-step-name">{{ step.stepName }}</span>
                    <span class="tt-step-state" :class="`tt-state-${step.stepStatus}`">{{ STEP_LABELS[step.stepStatus] }}</span>
                  </button>
                </template>
              </li>
            </ul>
          </footer>
        </article>
      </div>
    </template>
  </Card>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref, computed, watch, onMounted } from 'vue'
import axios from '@/utils/axiosConfig'
import { toDateKey } from '@/utils/dateUtils'
import { isRequiredToLog, workloadSummary } from '@/utils/workload'
import { usePermissions } from '@/composables/usePermissions'

// บอร์ด "วันนี้ใครทำอะไร ที่ไหน": รวมการลงงาน นัดเข้าพบลูกค้า การลา และงานที่ถืออยู่ของแต่ละคนไว้ที่เดียว
const props = defineProps({
  users: { type: Array, default: () => [] },
  workloadByUser: { type: Object, default: () => ({}) },
  leaves: { type: Array, default: () => [] },
  holidays: { type: Object, default: () => new Set() },
  leaveTypeLabels: { type: Object, default: () => ({}) },
  refreshKey: { type: [Object, Number, String], default: null }
})
defineEmits(['select-user', 'open-step'])

const { hasAccess } = usePermissions()
const canSeeAllVisits = computed(() => hasAccess('/sales-activity#view-all') || hasAccess('/sales-activity#manage-all'))

const STEP_LABELS = { working: 'กำลังทำ', overdue: 'เกินกำหนด', pending: 'ยังไม่เริ่ม' }
const VISIT_TITLES = { on_site: 'เข้าพบ', online: 'ประชุมออนไลน์กับ', phone: 'โทรคุยกับ', survey: 'สำรวจหน้างาน', demo: 'Demo ให้' }
const VISIT_STATUS = { scheduled: 'นัดหมาย', done: 'เสร็จสิ้น', follow_up: 'ติดตามผล' }

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
const selectedDate = ref(startOfToday())
const records = ref([])
const visits = ref([])
const fetching = ref(false)
const loadError = ref(false)
const search = ref('')
const statusFilter = ref('all')
const placeFilter = ref(null)
const deptFilter = ref(null)
const openDesc = ref({})
const openWorkload = ref({})
const showAllPlaces = ref(false)
const MAX_PLACES = 6 // สถานที่พิมพ์เองได้จึงอาจมีหลายแบบ — แสดงเฉพาะที่มีคนมากสุดก่อน

const dayKey = computed(() => toDateKey(selectedDate.value || startOfToday()))
const todayKey = () => toDateKey(new Date())
const isToday = computed(() => dayKey.value === todayKey())
const isFuture = computed(() => dayKey.value > todayKey())
const isWorkday = computed(() => {
  const dow = (selectedDate.value || startOfToday()).getDay()
  return dow !== 0 && dow !== 6 && !props.holidays.has(dayKey.value)
})
const dateLabel = computed(() => (selectedDate.value || startOfToday())
  .toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))

const shiftDay = (delta) => {
  const d = new Date(selectedDate.value || startOfToday())
  d.setDate(d.getDate() + delta)
  selectedDate.value = d
}
const goToday = () => { selectedDate.value = startOfToday() }

let requestId = 0
const load = async () => {
  const id = ++requestId
  const date = dayKey.value
  fetching.value = true
  loadError.value = false
  try {
    const [workRes, visitRes] = await Promise.all([
      axios.get('/api/daily-work', { params: { date }, silent: true }),
      // role ที่ไม่มีสิทธิ์หน้าเข้าพบลูกค้าจะได้ 403 — บอร์ดยังใช้งานได้โดยไม่มีนัด
      axios.get('/api/sales-visits', { params: { from_date: date, to_date: date }, silent: true }).catch(() => ({ data: [] }))
    ])
    if (id !== requestId) return
    records.value = workRes.data || []
    visits.value = visitRes.data || []
  } catch (error) {
    if (id !== requestId) return
    console.error('[TeamToday] load failed:', error)
    records.value = []
    visits.value = []
    loadError.value = true
  } finally {
    if (id === requestId) fetching.value = false
  }
}

onMounted(load)
watch(dayKey, load)
watch(() => props.refreshKey, load)

const hhmm = (t) => (t ? String(t).slice(0, 5) : '')
const localHHMM = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
const minutesOf = (t) => { const [h, m] = String(t || '').split(':').map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null }

// กำลังทำอยู่ตอนนี้ไหม (รองรับงานข้ามเที่ยงคืนของวันนั้น)
const isNow = (start, end) => {
  if (!isToday.value) return false
  const s = minutesOf(start)
  let e = minutesOf(end)
  if (s === null || e === null) return false
  if (e <= s) e += 24 * 60
  const now = new Date()
  const n = now.getHours() * 60 + now.getMinutes()
  return n >= s && n < e
}

const workItem = (w) => {
  const start = hhmm(w.start_time)
  const end = hhmm(w.end_time)
  const steps = Array.isArray(w.steps_data) ? w.steps_data.map(s => s.step_name).filter(Boolean) : []
  return {
    key: `w${w.id}`, kind: 'work', sort: start || '99:99',
    timeText: start && end ? `${start}–${end} น.` : 'ไม่ระบุเวลา',
    now: isNow(start, end),
    so: w.so_number || null,
    title: w.task_name || 'ไม่ระบุโครงการ',
    step: steps.join(', ') || w.step_name || '',
    location: (w.location || '').trim(),
    customer: (w.customer_info || '').trim(),
    description: (w.work_description || '').trim()
  }
}

const visitItem = (v) => {
  const s = new Date(v.visit_date)
  const e = v.visit_end_date ? new Date(v.visit_end_date) : null
  const start = localHHMM(s)
  const end = e && toDateKey(e) === toDateKey(s) ? localHHMM(e) : ''
  return {
    key: `v${v.id}`, kind: 'visit', sort: start,
    timeText: end ? `${start}–${end} น.` : `${start} น.`,
    now: end ? isNow(start, end) : false,
    statusText: VISIT_STATUS[v.status] || '',
    so: v.so_number || null,
    title: `${VISIT_TITLES[v.visit_type] || 'เข้าพบ'} ${v.company_name || 'ลูกค้า (ไม่ระบุ)'}`,
    step: v.task_name ? `โครงการ ${v.task_name}` : '',
    location: (v.location || '').trim(),
    customer: '',
    description: (v.summary || v.agenda || '').trim()
  }
}

const leaveTimeText = (l, day) => {
  const s = new Date(l.start_datetime)
  const e = new Date(l.end_datetime)
  const startsToday = toDateKey(s) === day
  const endsToday = toDateKey(e) === day
  if (startsToday && endsToday) return `${localHHMM(s)}–${localHHMM(e)} น.`
  if (startsToday) return `ตั้งแต่ ${localHHMM(s)} น.`
  if (endsToday) return `ถึง ${localHHMM(e)} น.`
  return 'ทั้งวัน'
}

const rows = computed(() => {
  const day = dayKey.value
  const workByUser = {}
  records.value.forEach(w => {
    if (w.work_status === 'cancelled' || !w.user_id) return
    ;(workByUser[w.user_id] = workByUser[w.user_id] || []).push(w)
  })
  const visitsByUser = {}
  visits.value.forEach(v => {
    if (v.status === 'cancelled') return
    // เจ้าของรายการและทีมที่ไปด้วยเห็นนัดเดียวกันบนการ์ดของตัวเอง
    const ids = new Set([v.created_by, ...(v.internal_attendees || []).map(a => (a && typeof a === 'object' ? a.id : a))])
    ids.forEach(id => { if (id) (visitsByUser[id] = visitsByUser[id] || []).push(v) })
  })
  const leavesByUser = {}
  props.leaves.forEach(l => {
    if (l.status !== 'approved' || !l.user_id || !l.start_datetime || !l.end_datetime) return
    if (toDateKey(l.start_datetime) > day || toDateKey(l.end_datetime) < day) return
    ;(leavesByUser[l.user_id] = leavesByUser[l.user_id] || []).push(l)
  })

  return props.users.map(u => {
    const hasWork = (workByUser[u.id] || []).length > 0
    const items = [...(workByUser[u.id] || []).map(workItem), ...(visitsByUser[u.id] || []).map(visitItem)]
      .sort((a, b) => a.sort.localeCompare(b.sort))
    const leaves = (leavesByUser[u.id] || []).map(l => ({
      id: l.id,
      label: props.leaveTypeLabels[l.leave_type] || l.leave_type || 'ลา',
      time: leaveTimeText(l, day)
    }))
    const joined = !u.created_at || toDateKey(u.created_at) <= day
    // นัดเข้าพบไม่นับเป็นการลงงาน: engineer ที่มีแต่นัดยัง "ยังไม่ลงงาน" (ตรงกับการ์ดและการแจ้งเตือน Teams)
    let state = 'none'
    if (hasWork) state = 'working'
    else if (leaves.length && !items.length) state = 'leave'
    else if (isRequiredToLog(u) && !leaves.length && isWorkday.value && !isFuture.value && joined) state = 'missing'
    else if (items.length) state = 'working'

    const workingNow = items.some(i => i.now)
    let badge = { cls: 'none', text: isFuture.value ? 'ไม่มีแผนงาน' : isRequiredToLog(u) ? 'ไม่ต้องลงงาน' : 'ไม่บังคับลงงาน' }
    if (state === 'working') {
      if (workingNow) badge = { cls: 'now', text: 'กำลังทำงาน' }
      else if (!hasWork) badge = { cls: 'working', text: 'มีนัดเข้าพบ' }
      else badge = { cls: 'working', text: isFuture.value ? 'มีแผนงาน' : 'ลงงานแล้ว' }
    }
    else if (state === 'leave') badge = { cls: 'leave', text: 'ลา' }
    else if (state === 'missing') badge = { cls: 'missing', text: 'ยังไม่ลงงาน' }

    const places = new Map()
    items.forEach(i => { if (i.location) places.set(i.location.toLowerCase(), i.location) })
    const workload = props.workloadByUser[u.id] || []
    const name = `${u.firstname || ''} ${u.lastname || ''}`.trim()
    const blob = [name, u.nickname, u.department, u.position,
      ...items.flatMap(i => [i.title, i.so, i.step, i.location, i.customer, i.description])
    ].filter(Boolean).join(' ').toLowerCase()

    return {
      id: u.id,
      name: u.nickname ? `${name} (${u.nickname})` : name,
      initial: (u.nickname || u.firstname || '?').trim().charAt(0),
      department: u.department || '',
      subtitle: [u.position, u.department].filter(Boolean).join(' · ') || u.role || '',
      state, badge, workingNow, items, leaves, places, workload,
      summary: workloadSummary(workload),
      blob
    }
  })
})

const deptOptions = computed(() => [...new Set(props.users.map(u => u.department).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'th')))
const deptRows = computed(() => (deptFilter.value ? rows.value.filter(r => r.department === deptFilter.value) : rows.value))

const matchesStatus = (r, key) => {
  if (key === 'all') return r.state !== 'none'
  if (key === 'now') return r.workingNow
  if (key === 'leave') return r.leaves.length > 0
  return r.state === key
}

const statusChips = computed(() => {
  const count = (key) => deptRows.value.filter(r => matchesStatus(r, key)).length
  const chips = [{ key: 'all', label: 'ทั้งหมด', cls: '', count: count('all') }]
  if (isToday.value) chips.push({ key: 'now', label: 'กำลังทำงานตอนนี้', cls: 'tt-chip-now', count: count('now') })
  chips.push({ key: 'working', label: isFuture.value ? 'มีแผนงาน' : 'ลงงาน/มีนัด', cls: 'tt-chip-working', count: count('working') })
  if (!isFuture.value) chips.push({ key: 'missing', label: 'ยังไม่ลงงาน', cls: 'tt-chip-missing', count: count('missing') })
  chips.push({ key: 'leave', label: 'ลา', cls: 'tt-chip-leave', count: count('leave') })
  chips.push({ key: 'none', label: 'อื่น ๆ', cls: '', count: count('none') })
  return chips
})

const placeChips = computed(() => {
  const map = new Map()
  deptRows.value.forEach(r => r.places.forEach((name, key) => {
    if (!map.has(key)) map.set(key, { key, name, count: 0 })
    map.get(key).count++
  }))
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'th'))
})

const visiblePlaces = computed(() => {
  if (showAllPlaces.value) return placeChips.value
  const top = placeChips.value.slice(0, MAX_PLACES)
  // สถานที่ที่กรองอยู่ต้องมองเห็นเสมอ เพื่อให้กดยกเลิกได้
  const active = placeChips.value.find(p => p.key === placeFilter.value)
  return active && !top.includes(active) ? [...top, active] : top
})

// เปลี่ยนวันแล้วสถานที่เดิมอาจไม่มี / ตัวกรอง "กำลังทำงานตอนนี้" ใช้ได้เฉพาะวันนี้
watch(dayKey, () => {
  placeFilter.value = null
  openDesc.value = {}
  if (!isToday.value && statusFilter.value === 'now') statusFilter.value = 'all'
  if (isFuture.value && statusFilter.value === 'missing') statusFilter.value = 'all'
})

const STATE_ORDER = { working: 0, missing: 1, leave: 2, none: 3 }
const visibleRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return deptRows.value
    .filter(r => matchesStatus(r, statusFilter.value))
    .filter(r => !placeFilter.value || r.places.has(placeFilter.value))
    .filter(r => !q || r.blob.includes(q))
    .sort((a, b) => (Number(b.workingNow) - Number(a.workingNow))
      || (STATE_ORDER[a.state] - STATE_ORDER[b.state])
      || a.name.localeCompare(b.name, 'th'))
})
</script>

<style scoped>
.tt-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem 1rem; margin-bottom: 0.75rem; }
.tt-title { min-width: 0; }
.tt-title h3 { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.2rem; color: #1e293b; }
.tt-title h3 i { color: #1d4ed8; }
.tt-title small { color: #526074; font-size: max(0.85rem, var(--min-fs)); }
.tt-date { display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap; }
.tt-calendar { width: 11rem; }

.tt-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; margin-bottom: 0.6rem; }
.tt-chips-label { display: inline-flex; align-items: center; gap: 0.25rem; color: #526074; font-size: max(0.8rem, var(--min-fs)); font-weight: 600; }
.tt-chip { display: inline-flex; align-items: center; gap: 0.35rem; max-width: 100%; padding: 0.25rem 0.7rem; border: 1px solid #cbd5e1; border-radius: 999px; background: #ffffff; color: #334155; font-size: max(0.85rem, var(--min-fs)); cursor: pointer; overflow-wrap: anywhere; text-align: left; }
.tt-chip b { font-weight: 800; }
.tt-chip:hover { background: #f1f5f9; }
.tt-chip.active { background: #1d4ed8; border-color: #1d4ed8; color: #ffffff; }
.tt-chip-now { border-color: #059669; color: #047857; }
.tt-chip-working { border-color: #2563eb; color: #1d4ed8; }
.tt-chip-missing { border-color: #dc2626; color: #b91c1c; }
.tt-chip-leave { border-color: #d97706; color: #92400e; }
.tt-chip-now.active { background: #047857; border-color: #047857; color: #ffffff; }
.tt-chip-missing.active { background: #b91c1c; border-color: #b91c1c; color: #ffffff; }
.tt-chip-leave.active { background: #92400e; border-color: #92400e; color: #ffffff; }
.tt-chip-place { font-size: max(0.8rem, var(--min-fs)); }

.tt-filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
.tt-search { flex: 1 1 16rem; min-width: 0; }
.tt-dept { flex: 0 1 13rem; min-width: 0; }
.tt-note { display: flex; gap: 0.35rem; align-items: flex-start; margin: 0 0 0.75rem; color: #526074; font-size: max(0.8rem, var(--min-fs)); }
.tt-state { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.75rem; padding: 1.5rem; border: 1px dashed #cbd5e1; border-radius: 10px; color: #526074; text-align: center; }
.tt-error { color: #b91c1c; border-color: #fca5a5; }

.tt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr)); gap: 0.75rem; align-items: start; }
.tt-stale { opacity: 0.6; }
.tt-card { display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; padding: 0.75rem; border: 1px solid #e2e8f0; border-left: 4px solid #94a3b8; border-radius: 10px; background: #ffffff; }
.tt-card-working { border-left-color: #2563eb; }
.tt-card-missing { border-left-color: #dc2626; background: #fef2f2; }
.tt-card-leave { border-left-color: #d97706; background: #fffbeb; }

.tt-card-head { display: flex; align-items: center; gap: 0.6rem; min-width: 0; }
.tt-avatar { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: #1d4ed8; color: #ffffff; font-weight: 700; }
.tt-person { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; }
.tt-person small { color: #526074; font-size: max(0.78rem, var(--min-fs)); overflow-wrap: anywhere; }
.tt-name { padding: 0; border: 0; background: none; color: #1d4ed8; font-weight: 700; font-size: max(0.95rem, var(--min-fs)); text-align: left; cursor: pointer; overflow-wrap: anywhere; }
.tt-name:hover { text-decoration: underline; }
.tt-badge { flex: 0 0 auto; padding: 0.1rem 0.55rem; border-radius: 999px; font-size: max(0.75rem, var(--min-fs)); font-weight: 700; white-space: nowrap; }
.tt-badge-now { background: #047857; color: #ffffff; }
.tt-badge-working { background: #dbeafe; color: #1e40af; }
.tt-badge-missing { background: #b91c1c; color: #ffffff; }
.tt-badge-leave { background: #92400e; color: #ffffff; }
.tt-badge-none { background: #e2e8f0; color: #334155; }

.tt-leave { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.5rem; padding: 0.35rem 0.5rem; border-radius: 8px; background: #fef3c7; color: #92400e; font-size: max(0.85rem, var(--min-fs)); font-weight: 600; }

.tt-items { display: flex; flex-direction: column; gap: 0.5rem; margin: 0; padding: 0; list-style: none; }
.tt-item { min-width: 0; padding: 0.5rem 0.6rem; border-radius: 8px; background: #f8fafc; }
.tt-item-now { background: #ecfdf5; outline: 1.5px solid #059669; }
.tt-item-time { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; color: #334155; font-size: max(0.82rem, var(--min-fs)); font-weight: 700; }
.tt-now { padding: 0 0.45rem; border-radius: 999px; background: #047857; color: #ffffff; font-size: max(0.72rem, var(--min-fs)); }
.tt-item-status { padding: 0 0.45rem; border-radius: 999px; background: #e2e8f0; color: #334155; font-size: max(0.72rem, var(--min-fs)); font-weight: 600; }
.tt-item-title { margin-top: 0.2rem; color: #0f172a; font-weight: 600; font-size: max(0.9rem, var(--min-fs)); overflow-wrap: anywhere; }
.tt-so { display: inline-block; margin-right: 0.35rem; padding: 0 0.35rem; border-radius: 5px; background: #e0e7ff; color: #3730a3; font-family: monospace; font-size: max(0.75rem, var(--min-fs)); font-weight: 700; }
.tt-item-step { color: #475569; font-size: max(0.8rem, var(--min-fs)); overflow-wrap: anywhere; }
.tt-item-meta { display: flex; flex-wrap: wrap; gap: 0.15rem 0.75rem; margin-top: 0.15rem; color: #475569; font-size: max(0.8rem, var(--min-fs)); overflow-wrap: anywhere; }
.tt-item-desc { margin: 0.25rem 0 0; color: #334155; font-size: max(0.82rem, var(--min-fs)); line-height: 1.45; white-space: pre-line; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.tt-item-desc.open { display: block; }
.tt-more { padding: 0; border: 0; background: none; color: #1d4ed8; font-size: max(0.78rem, var(--min-fs)); font-weight: 600; cursor: pointer; }
.tt-empty { margin: 0; color: #526074; font-size: max(0.85rem, var(--min-fs)); }
.tt-empty-missing { color: #b91c1c; font-weight: 600; }

.tt-workload { border-top: 1px solid #e2e8f0; padding-top: 0.4rem; }
.tt-workload-toggle { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.5rem; width: 100%; padding: 0.15rem 0; border: 0; background: none; color: #334155; font-size: max(0.82rem, var(--min-fs)); text-align: left; cursor: pointer; }
.tt-workload-toggle i { margin-left: auto; color: #526074; font-size: max(0.72rem, var(--min-fs)); }
.tt-overdue { padding: 0 0.45rem; border-radius: 999px; background: #b91c1c; color: #ffffff; font-size: max(0.75rem, var(--min-fs)); font-weight: 700; }
.tt-projects { display: flex; flex-direction: column; gap: 0.5rem; margin: 0.4rem 0 0; padding: 0; list-style: none; }
.tt-project-name { color: #0f172a; font-size: max(0.85rem, var(--min-fs)); font-weight: 600; overflow-wrap: anywhere; }
.tt-project-name small { display: block; color: #526074; font-weight: 500; font-size: max(0.75rem, var(--min-fs)); }
.tt-step { display: flex; align-items: center; gap: 0.4rem; width: 100%; padding: 0.2rem 0.35rem; border: 0; border-radius: 6px; background: none; color: #334155; font-size: max(0.8rem, var(--min-fs)); text-align: left; cursor: pointer; }
.tt-step:hover { background: #f1f5f9; }
.tt-step-name { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.tt-dot { flex: 0 0 auto; width: 8px; height: 8px; border-radius: 50%; background: #64748b; }
.tt-dot-working { background: #059669; }
.tt-dot-overdue { background: #dc2626; }
.tt-step-state { flex: 0 0 auto; color: #526074; font-size: max(0.75rem, var(--min-fs)); }
.tt-state-working { color: #047857; font-weight: 600; }
.tt-state-overdue { color: #b91c1c; font-weight: 700; }

@media (max-width: 480px) {
  .tt-dept { flex: 1 1 100%; }
}
</style>
