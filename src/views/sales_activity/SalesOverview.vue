<template>
  <!-- ภาพรวมการเข้าพบลูกค้า (แท็บ "ภาพรวม" ในหน้า /sales-activity) — นับจากรายการที่ผู้ใช้มีสิทธิ์เห็น -->
  <div class="ov-grid">
    <section class="ov-card ov-wide">
      <header class="ov-head">
        <h3><i class="pi pi-users"></i> การเข้าพบต่อคนต่อเดือน</h3>
        <small>ตามตัวกรองด้านบน ({{ scopeLabel }}) · นับเฉพาะที่เข้าพบแล้ว ไม่รวมที่ยกเลิก</small>
      </header>
      <p v-if="!personRows.length" class="ov-empty">ยังไม่มีการเข้าพบในช่วงนี้</p>
      <div v-else class="ov-table-wrap">
        <table class="ov-table">
          <thead>
            <tr>
              <th class="ov-name-col">ผู้ลงนัด</th>
              <th v-for="m in months" :key="m" class="ov-num">{{ monthLabel(m) }}</th>
              <th class="ov-num ov-total">รวม</th>
              <th class="ov-num">นัดที่จะถึง</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in personRows" :key="row.name">
              <td class="ov-name-col">{{ row.name }}</td>
              <td v-for="m in months" :key="m" class="ov-num" :class="{ 'ov-zero': !row.byMonth[m] }">{{ row.byMonth[m] || 0 }}</td>
              <td class="ov-num ov-total">{{ row.total }}</td>
              <td class="ov-num">{{ row.upcoming }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="ov-card">
      <header class="ov-head">
        <h3><i class="pi pi-tags"></i> แยกตามประเภทกิจกรรม</h3>
        <small>ตามตัวกรองด้านบน · ไม่รวมที่ยกเลิก</small>
      </header>
      <p v-if="!typeRows.length" class="ov-empty">ยังไม่มีกิจกรรมในช่วงนี้</p>
      <ul v-else class="ov-type-list">
        <li v-for="row in typeRows" :key="row.type" class="ov-type-row">
          <div class="ov-type-top">
            <span class="ov-type-name"><i :class="row.icon"></i> {{ row.label }}</span>
            <span class="ov-type-count">เข้าพบแล้ว <strong>{{ row.visited }}</strong><template v-if="row.upcoming"> · นัดหมาย {{ row.upcoming }}</template></span>
          </div>
          <div class="ov-bar" role="presentation"><div class="ov-bar-fill" :style="{ width: row.share + '%' }"></div></div>
        </li>
      </ul>
    </section>

    <section class="ov-card">
      <header class="ov-head">
        <h3><i class="pi pi-building"></i> การเข้าพบต่อลูกค้า</h3>
        <small>ตามตัวกรองด้านบน · กดชื่อลูกค้าเพื่อดูประวัติทั้งหมด</small>
      </header>
      <p v-if="!customerRows.length" class="ov-empty">ยังไม่มีการเข้าพบในช่วงนี้</p>
      <div v-else class="ov-table-wrap ov-scroll">
        <table class="ov-table">
          <thead>
            <tr><th>ลูกค้า</th><th class="ov-num">เข้าพบ</th><th>ล่าสุด</th><th>นัดถัดไป</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in customerRows" :key="row.id">
              <td><button type="button" class="ov-link" @click="$emit('open-customer', { id: row.id, name: row.name })">{{ row.name }}</button></td>
              <td class="ov-num">{{ row.visited }}</td>
              <td>{{ row.last ? formatVisitDay(row.last) : '-' }}</td>
              <td>{{ row.next ? formatVisitDay(row.next) : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="ov-card ov-wide">
      <header class="ov-head">
        <h3><i class="pi pi-exclamation-circle"></i> ลูกค้าที่ไม่ได้ไปพบนานเกิน {{ staleDays }} วัน</h3>
        <small>นับจากทุกนัดที่คุณเห็นได้ ไม่ขึ้นกับตัวกรองด้านบน · ไม่รวมลูกค้าที่มีนัดหมายรออยู่</small>
      </header>
      <p v-if="!staleRows.length" class="ov-empty">ไม่มี — ลูกค้าทุกรายได้รับการเข้าพบภายใน {{ staleDays }} วัน หรือมีนัดหมายแล้ว</p>
      <div v-else class="ov-table-wrap ov-scroll">
        <table class="ov-table">
          <thead>
            <tr><th>ลูกค้า</th><th>เข้าพบล่าสุด</th><th class="ov-num">ผ่านมา</th><th class="ov-num">เข้าพบทั้งหมด</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in staleRows" :key="row.id">
              <td><button type="button" class="ov-link" @click="$emit('open-customer', { id: row.id, name: row.name })">{{ row.name }}</button></td>
              <td>{{ row.last ? formatVisitDay(row.last) : 'ยังไม่เคยเข้าพบ' }}</td>
              <td class="ov-num" :class="{ 'ov-alert': row.days !== null }">{{ row.days !== null ? `${row.days} วัน` : '-' }}</td>
              <td class="ov-num">{{ row.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script>
import { visitState, visitTypeLabel, visitTypeIcon, formatVisitDay, daysSince, VISIT_TYPE_LABELS } from '@/utils/salesVisit'

const monthKey = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`
}

export default {
  name: 'SalesOverview',
  props: {
    // รายการหลังตัวกรองของหน้า (ช่วงข้อมูล / พนักงาน / ประเภท / วันที่ / ค้นหา)
    visits: { type: Array, default: () => [] },
    // ลูกค้าพร้อม last_visit_at / next_visit_at / visit_count จาก /api/sales-visits/customers
    customers: { type: Array, default: () => [] },
    scopeLabel: { type: String, default: '' }
  },
  emits: ['open-customer'],
  data() {
    return { staleDays: 60 }
  },
  computed: {
    states() {
      const now = Date.now()
      return this.visits.map(v => ({ v, state: visitState(v, now) }))
    },
    visited() { return this.states.filter(x => x.state === 'visited').map(x => x.v) },
    upcoming() { return this.states.filter(x => x.state === 'upcoming').map(x => x.v) },
    // ทุกเดือนต่อเนื่องตั้งแต่เดือนแรกถึงเดือนล่าสุดที่มีการเข้าพบ — เดือนที่ไม่มีนัดแสดงเป็น 0 ไม่ข้ามคอลัมน์
    months() {
      const keys = this.visited.map(v => monthKey(v.visit_date)).sort()
      if (!keys.length) return []
      const [y0, m0] = keys[0].split('-').map(Number)
      const last = keys[keys.length - 1]
      const list = []
      for (const d = new Date(y0, m0 - 1, 1); monthKey(d) <= last; d.setMonth(d.getMonth() + 1)) list.push(monthKey(d))
      return list
    },
    personRows() {
      const rows = {}
      const row = (name) => (rows[name] = rows[name] || { name, byMonth: {}, total: 0, upcoming: 0 })
      for (const v of this.visited) {
        const r = row(v.created_by_name || 'ไม่ระบุ')
        const m = monthKey(v.visit_date)
        r.byMonth[m] = (r.byMonth[m] || 0) + 1
        r.total++
      }
      for (const v of this.upcoming) row(v.created_by_name || 'ไม่ระบุ').upcoming++
      return Object.values(rows).sort((a, b) => b.total - a.total || b.upcoming - a.upcoming || a.name.localeCompare(b.name, 'th'))
    },
    typeRows() {
      const rows = {}
      for (const { v, state } of this.states) {
        if (state === 'cancelled') continue
        const type = v.visit_type || 'other'
        rows[type] = rows[type] || { type, label: visitTypeLabel(type), icon: visitTypeIcon(type), visited: 0, upcoming: 0 }
        rows[type][state]++
      }
      const list = Object.values(rows)
      const max = Math.max(1, ...list.map(r => r.visited))
      const order = Object.keys(VISIT_TYPE_LABELS)
      return list
        .map(r => ({ ...r, share: Math.round(r.visited / max * 100) }))
        .sort((a, b) => b.visited - a.visited || order.indexOf(a.type) - order.indexOf(b.type))
    },
    customerRows() {
      const rows = {}
      for (const { v, state } of this.states) {
        if (state === 'cancelled' || !v.customer_id) continue
        const r = rows[v.customer_id] = rows[v.customer_id] || { id: v.customer_id, name: v.company_name || 'ไม่ระบุลูกค้า', visited: 0, last: null, next: null }
        if (state === 'visited') {
          r.visited++
          if (!r.last || new Date(v.visit_date) > new Date(r.last)) r.last = v.visit_date
        } else if (!r.next || new Date(v.visit_date) < new Date(r.next)) {
          r.next = v.visit_date
        }
      }
      return Object.values(rows).sort((a, b) => b.visited - a.visited || new Date(b.last || 0) - new Date(a.last || 0))
    },
    staleRows() {
      const now = new Date()
      return this.customers
        .filter(c => !c.next_visit_at)
        .map(c => ({ id: c.id, name: c.company_name, last: c.last_visit_at, days: daysSince(c.last_visit_at, now), count: c.visit_count || 0 }))
        .filter(r => r.days === null || r.days >= this.staleDays)
        // ไปพบนานที่สุดขึ้นก่อน — ลูกค้าที่ยังไม่เคยเข้าพบอยู่ท้ายรายการ
        .sort((a, b) => (a.days === null) - (b.days === null) || (b.days || 0) - (a.days || 0) || a.name.localeCompare(b.name, 'th'))
    }
  },
  methods: {
    formatVisitDay,
    monthLabel(m) {
      const [y, mo] = m.split('-').map(Number)
      return new Date(y, mo - 1, 1).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })
    }
  }
}
</script>

<style scoped>
.ov-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--grid-gap, 1rem); }
.ov-card { min-width: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: var(--radius-lg, 12px); padding: 1rem; }
.ov-wide { grid-column: 1 / -1; }
.ov-head { margin-bottom: 0.75rem; }
.ov-head h3 { margin: 0; display: flex; align-items: center; gap: 0.45rem; font-size: max(1rem, var(--min-fs)); color: #0f172a; }
.ov-head h3 i { color: #1d4ed8; }
.ov-head small { display: block; margin-top: 0.2rem; color: #526074; font-size: max(0.78rem, var(--min-fs)); }
.ov-empty { margin: 0; color: #526074; font-size: max(0.875rem, var(--min-fs)); }
.ov-table-wrap { overflow-x: auto; }
.ov-scroll { max-height: 360px; overflow-y: auto; }
.ov-table { width: 100%; border-collapse: collapse; font-size: max(0.85rem, var(--min-fs)); color: #1e293b; }
.ov-table th { position: sticky; top: 0; background: #f8fafc; color: #334155; font-weight: 700; text-align: left; padding: 0.45rem 0.6rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
.ov-table td { padding: 0.45rem 0.6rem; border-bottom: 1px solid #f1f5f9; }
.ov-num { text-align: right !important; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ov-total { font-weight: 700; }
.ov-zero { color: #526074; }
.ov-name-col { min-width: 160px; }
.ov-alert { color: #b91c1c; font-weight: 700; }
.ov-link { padding: 0; border: 0; background: none; font: inherit; color: #1d4ed8; text-align: left; cursor: pointer; }
.ov-link:hover { text-decoration: underline; }
.ov-link:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; border-radius: 3px; }
.ov-type-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.7rem; }
.ov-type-top { display: flex; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; font-size: max(0.85rem, var(--min-fs)); color: #1e293b; }
.ov-type-name { font-weight: 600; display: flex; align-items: center; gap: 0.35rem; }
.ov-type-name i { color: #1d4ed8; }
.ov-type-count { color: #334155; }
.ov-bar { height: 8px; margin-top: 0.3rem; border-radius: 4px; background: #e2e8f0; overflow: hidden; }
.ov-bar-fill { height: 100%; border-radius: 4px; background: #2563eb; }

@media (max-width: 900px) {
  .ov-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
