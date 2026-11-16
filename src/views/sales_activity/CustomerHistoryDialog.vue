<template>
  <!-- ประวัติการเข้าพบของลูกค้าหนึ่งราย (ทุกช่วงเวลา เฉพาะรายการที่ผู้ใช้มีสิทธิ์เห็น) -->
  <Dialog :visible="visible" @update:visible="$emit('update:visible', $event)" modal :draggable="false"
    :header="`ประวัติการเข้าพบ · ${customer?.name || ''}`" :style="{ width: '720px', maxWidth: '95vw' }" class="ch-dialog">
    <div v-if="loading" class="ch-state"><i class="pi pi-spin pi-spinner"></i> กำลังโหลด...</div>
    <div v-else-if="error" class="ch-state ch-error" role="alert">
      {{ error }}
      <Button label="ลองใหม่" icon="pi pi-refresh" size="small" text @click="load" />
    </div>
    <div v-else-if="!visits.length" class="ch-state">ยังไม่มีการเข้าพบลูกค้ารายนี้</div>
    <template v-else>
      <p class="ch-summary">เข้าพบแล้ว <strong>{{ visitedCount }}</strong> ครั้ง<template v-if="groups.upcoming.length"> · นัดหมายรออยู่ {{ groups.upcoming.length }} ครั้ง</template></p>
      <section v-for="g in sections" :key="g.key" class="ch-section">
        <h4 class="ch-section-title">{{ g.label }} ({{ g.items.length }})</h4>
        <button v-for="v in g.items" :key="v.id" type="button" class="ch-item" @click="$emit('open-visit', v)">
          <div class="ch-item-top">
            <span class="ch-date"><i class="pi pi-calendar"></i> {{ formatVisitDate(v.visit_date) }}</span>
            <span class="ch-badge" :class="'chs-' + stateOf(v)">{{ stateLabel(v) }}</span>
            <span class="ch-type"><i :class="visitTypeIcon(v.visit_type)"></i> {{ visitTypeLabel(v.visit_type) }}</span>
          </div>
          <div class="ch-meta">
            <span v-if="v.created_by_name"><i class="pi pi-user"></i> {{ v.created_by_name }}</span>
            <span v-if="teamNames(v)"><i class="pi pi-users"></i> {{ teamNames(v) }}</span>
            <span v-if="v.task_name"><i class="pi pi-briefcase"></i> {{ v.so_number ? `[${v.so_number}] ` : '' }}{{ v.task_name }}</span>
          </div>
          <div v-if="v.agenda" class="ch-text">{{ v.agenda }}</div>
          <div v-if="v.summary" class="ch-text ch-summary-text"><i class="pi pi-align-left"></i> {{ v.summary }}</div>
        </button>
      </section>
    </template>
  </Dialog>
</template>

<script>
import axios from '@/utils/axiosConfig'
import { visitState, visitStateLabel, splitVisits, visitTypeLabel, visitTypeIcon, formatVisitDate, teamNames } from '@/utils/salesVisit'

export default {
  name: 'CustomerHistoryDialog',
  props: {
    visible: { type: Boolean, default: false },
    customer: { type: Object, default: null } // { id, name }
  },
  emits: ['update:visible', 'open-visit'],
  data() {
    return { visits: [], loading: false, error: '', requestId: 0 }
  },
  computed: {
    groups() { return splitVisits(this.visits) },
    sections() {
      return [
        { key: 'upcoming', label: 'นัดที่จะถึง', items: this.groups.upcoming },
        { key: 'past', label: 'ที่ผ่านมา', items: this.groups.past }
      ].filter(s => s.items.length)
    },
    visitedCount() { return this.visits.filter(v => visitState(v) === 'visited').length }
  },
  watch: {
    visible(open) { if (open) this.load() },
    'customer.id'() { if (this.visible) this.load() }
  },
  methods: {
    visitTypeLabel, visitTypeIcon, formatVisitDate, teamNames,
    stateOf(v) { return visitState(v) },
    stateLabel(v) { return visitStateLabel(v) },
    // ไม่ส่งช่วงวันที่ = ทุกช่วงเวลา (หน้ารายการโหลดเฉพาะช่วงที่เลือก) — คำตอบเก่าที่มาช้าไม่เอามาใช้
    async load() {
      if (!this.customer?.id) return
      const id = ++this.requestId
      this.loading = true
      this.error = ''
      try {
        const res = await axios.get('/api/sales-visits', { silent: true, params: { customer_id: this.customer.id } })
        if (id === this.requestId) this.visits = res.data || []
      } catch (e) {
        if (id === this.requestId) {
          this.visits = []
          this.error = e.response?.data?.error || 'โหลดประวัติไม่สำเร็จ'
        }
      } finally {
        if (id === this.requestId) this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.ch-state { padding: 1.5rem 0.5rem; color: #334155; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.ch-error { color: #b91c1c; }
.ch-summary { margin: 0 0 0.75rem; color: #334155; font-size: max(0.9rem, var(--min-fs)); }
.ch-section + .ch-section { margin-top: 1rem; }
.ch-section-title { margin: 0 0 0.5rem; font-size: max(0.85rem, var(--min-fs)); color: #334155; font-weight: 700; }
.ch-item { display: block; width: 100%; text-align: left; font: inherit; color: inherit; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.65rem 0.8rem; cursor: pointer; }
.ch-item + .ch-item { margin-top: 0.5rem; }
.ch-item:hover { border-color: #93c5fd; background: #f8fbff; }
.ch-item:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
.ch-item-top { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.ch-date { font-weight: 700; color: #0f172a; font-size: max(0.9rem, var(--min-fs)); }
.ch-type { color: #334155; font-size: max(0.8rem, var(--min-fs)); }
.ch-badge { padding: 1px 8px; border-radius: 10px; font-size: max(0.75rem, var(--min-fs)); font-weight: 700; }
.chs-upcoming { background: #eff6ff; color: #1d4ed8; }
.chs-visited { background: #dcfce7; color: #166534; }
.chs-cancelled { background: #fee2e2; color: #b91c1c; }
.ch-meta { display: flex; flex-wrap: wrap; gap: 0.25rem 0.9rem; margin-top: 0.3rem; color: #334155; font-size: max(0.8rem, var(--min-fs)); }
.ch-text { margin-top: 0.35rem; color: #1e293b; font-size: max(0.85rem, var(--min-fs)); white-space: pre-wrap; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.ch-summary-text { color: #334155; }
</style>
