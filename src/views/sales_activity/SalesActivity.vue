<template>
  <div class="sales-page">

    <!-- Header -->
    <Card class="header-card">
      <template #header>
        <div class="main-header">
          <h1><i class="pi pi-briefcase"></i> เข้าพบลูกค้า</h1>
          <div class="header-actions">
            <span class="stat-item"><i class="pi pi-calendar"></i> {{ visits.length }} กิจกรรม</span>
          </div>
        </div>
      </template>
    </Card>

    <!-- KPI Summary -->
    <div class="kpi-row">
      <div class="kpi-card" v-for="kpi in kpiList" :key="kpi.key"
        :class="{ 'kpi-active': filterStatus === kpi.key }"
        @click="filterStatus = filterStatus === kpi.key ? null : kpi.key">
        <div class="kpi-icon" :class="kpi.colorClass"><i :class="kpi.icon"></i></div>
        <div class="kpi-info">
          <div class="kpi-value">{{ countByStatus(kpi.key) }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </div>
      </div>
    </div>

    <!-- Filters + Actions -->
    <div class="filter-panel">
      <div class="filter-row">
        <div class="filter-left">
          <div class="search-box">
            <i class="pi pi-search search-icon" />
            <InputText v-model="searchQuery" placeholder="ค้นหาลูกค้า, สถานที่, agenda..." />
            <i v-if="searchQuery" class="pi pi-times-circle search-clear" @click="searchQuery = ''" />
          </div>
          <Dropdown v-model="filterType" :options="visitTypeOptions" optionLabel="label" optionValue="value"
            placeholder="ประเภทกิจกรรม" :showClear="true" class="filter-dropdown" />
          <Calendar v-model="filterDateRange" selectionMode="range" dateFormat="dd/mm/yy"
            placeholder="กรองตามวันที่" :showIcon="true" class="filter-dropdown" />
          <Button v-if="filterDateRange && filterDateRange[0]" icon="pi pi-times" v-tooltip.top="'ล้างตัวกรองวันที่'" @click="filterDateRange = null" text size="small" class="filter-clear-btn" />
        </div>
        <div class="filter-right">
          <span class="result-count"><strong>{{ filteredVisits.length }}</strong> รายการ</span>
          <Button icon="pi pi-plus" label="สร้าง Visit" @click="openCreateDialog" class="add-btn" />
        </div>
      </div>
    </div>

    <!-- Visit List -->
    <div class="visits-list" v-if="!loading">
      <div v-if="filteredVisits.length === 0" class="empty-state">
        <i class="pi pi-briefcase"></i>
        <p>ยังไม่มีกิจกรรม</p>
        <Button icon="pi pi-plus" label="สร้าง Visit แรก" @click="openCreateDialog" class="add-btn" style="margin-top:1rem" />
      </div>

      <div v-for="visit in filteredVisits" :key="visit.id" class="visit-card" :class="{ 'visit-card-overdue': isVisitOverdue(visit) }" @click="openDetailDialog(visit)">
        <div class="visit-left">
          <div class="visit-type-badge" :class="'vtype-' + visit.visit_type">
            <i :class="getVisitTypeIcon(visit.visit_type)"></i>
          </div>
          <div class="visit-info">
            <div class="visit-title">
              {{ visit.company_name || 'ไม่ระบุลูกค้า' }}
              <span v-if="visit.created_by_name" class="visit-owner"><i class="pi pi-user"></i> {{ visit.created_by_name }}</span>
            </div>
            <div class="visit-meta">
              <span><i class="pi pi-calendar"></i> {{ formatVisitDate(visit.visit_date) }}<template v-if="visit.visit_end_date"> – {{ formatVisitTime(visit.visit_end_date) }}</template></span>
              <span v-if="visit.location"><i class="pi pi-map-marker"></i> {{ visit.location }}</span>
              <span v-if="visit.task_name" class="visit-project"><i class="pi pi-briefcase"></i> {{ visit.so_number ? `[${visit.so_number}]` : '' }} {{ visit.task_name }}</span>
            </div>
            <div v-if="visit.agenda" class="visit-agenda">{{ visit.agenda }}</div>
            <!-- Tags สรุปเพื่อการติดตามงาน: ใครไป / ลูกค้ากี่คน / action / สรุป / นัดถัดไป / พิกัด -->
            <div class="visit-tags">
              <span v-if="getTeamNames(visit)" class="visit-tag tag-team"><i class="pi pi-users"></i> {{ getTeamNames(visit) }}</span>
              <span v-if="visit.customer_attendees && visit.customer_attendees.length" class="visit-tag tag-customer"><i class="pi pi-building"></i> ฝั่งลูกค้า {{ visit.customer_attendees.length }} คน</span>
              <span v-if="visit.action_items && visit.action_items.length" class="visit-tag tag-action"><i class="pi pi-check-square"></i> Action {{ visit.action_items.length }}</span>
              <span v-if="visit.summary" class="visit-tag tag-summary"><i class="pi pi-align-left"></i> มีสรุป</span>
              <span v-if="visit.next_visit_date" class="visit-tag tag-next"><i class="pi pi-calendar-plus"></i> นัดถัดไป {{ formatDate(visit.next_visit_date) }}</span>
              <span v-if="visit.latitude && visit.longitude" class="visit-tag tag-gps"><i class="pi pi-map"></i> มีพิกัด GPS</span>
            </div>
          </div>
        </div>
        <div class="visit-right">
          <span class="visit-status-badge" :class="'vstatus-' + visit.status">{{ getStatusLabel(visit.status) }}</span>
          <span class="visit-type-label">{{ getVisitTypeLabel(visit.visit_type) }}</span>
          <div class="visit-actions" @click.stop>
            <Button icon="pi pi-pencil" v-tooltip.top="'แก้ไข'" @click="openEditDialog(visit)" text size="small" />
            <Button icon="pi pi-trash" v-tooltip.top="'ลบ'" @click="deleteVisit(visit)" text severity="danger" size="small" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="skeleton-list">
      <div v-for="n in 4" :key="n" class="skeleton-group">
        <div class="skeleton-header">
          <div class="skeleton-bar" style="width:50%;height:18px"></div>
          <div class="skeleton-bar" style="width:20%;height:14px;margin-top:8px"></div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="showFormDialog"
      :header="editingVisit ? 'แก้ไข Sales Visit' : 'สร้าง Sales Visit'"
      :style="{width: '780px', maxWidth: '95vw'}" modal :draggable="false" class="modern-dialog">
      <div class="dialog-body">
        <div class="form-grid">
          <!-- Left Column -->
          <div class="form-col">
            <div class="form-section-title"><i class="pi pi-calendar"></i> วันที่ & เวลา</div>
            <div class="field">
              <label>วันที่และเวลาเริ่ม <span class="required">*</span></label>
              <Calendar v-model="form.visit_date" showTime hourFormat="24" dateFormat="dd/mm/yy" showIcon class="w-full" />
            </div>
            <div class="field">
              <label>เวลาสิ้นสุด</label>
              <Calendar v-model="form.visit_end_date" showTime hourFormat="24" dateFormat="dd/mm/yy" showIcon class="w-full" />
            </div>

            <div class="form-section-title"><i class="pi pi-building"></i> ลูกค้า & โครงการ</div>
            <div class="field">
              <label>ลูกค้า / บริษัท</label>
              <div class="field-with-action">
                <Dropdown v-model="form.customer_id" :options="customers" optionLabel="company_name" optionValue="id"
                  placeholder="เลือกลูกค้า" class="flex-1" filter :showClear="true" />
                <Button icon="pi pi-plus" v-tooltip.top="'เพิ่มลูกค้าใหม่'" @click="showCustomerDialog = true" text size="small" class="field-action-btn" />
              </div>
            </div>
            <div class="field">
              <label>โครงการที่เกี่ยวข้อง</label>
              <Dropdown v-model="form.task_id" :options="tasks" optionLabel="display_name" optionValue="id"
                placeholder="เชื่อมโยงโครงการ" class="w-full" filter :showClear="true" />
            </div>

            <div class="form-section-title"><i class="pi pi-map-marker"></i> รูปแบบ & สถานที่</div>
            <div class="field">
              <label>ประเภทกิจกรรม</label>
              <Dropdown v-model="form.visit_type" :options="visitTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
            </div>
            <div class="field">
              <label>สถานที่</label>
              <div class="field-with-action">
                <InputText v-model="form.location" placeholder="สถานที่นัดหมาย" class="flex-1" />
                <Button icon="pi pi-map-marker" v-tooltip.top="'ใช้ตำแหน่งปัจจุบัน'" @click="getLocation" text size="small" class="field-action-btn" :loading="gettingLocation" />
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="form-col">
            <div class="form-section-title"><i class="pi pi-users"></i> ผู้เข้าร่วม</div>
            <div class="field">
              <label>ทีมภายใน</label>
              <MultiSelect v-model="form.internal_attendees" :options="users" optionLabel="name"
                placeholder="เลือกทีมงาน" display="chip" filter filterPlaceholder="ค้นหา..." class="w-full">
                <template #option="slotProps">
                  <div class="user-option">
                    <div class="user-name">{{ slotProps.option.name }}</div>
                    <div class="user-info" v-if="slotProps.option.position">{{ slotProps.option.position }}</div>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="field">
              <label>ผู้เข้าร่วมฝั่งลูกค้า</label>
              <div v-for="(ca, idx) in form.customer_attendees" :key="idx" class="customer-attendee-card">
                <div class="ca-row">
                  <InputText v-model="ca.name" placeholder="ชื่อ" class="ca-input" />
                  <InputText v-model="ca.position" placeholder="ตำแหน่ง" class="ca-input" />
                  <Button icon="pi pi-times" @click="form.customer_attendees.splice(idx,1)" text severity="danger" size="small" class="ca-remove" />
                </div>
                <div class="ca-row">
                  <InputText v-model="ca.email" placeholder="อีเมล" class="ca-input" />
                  <InputText v-model="ca.phone" placeholder="โทรศัพท์" class="ca-input" />
                </div>
              </div>
              <Button icon="pi pi-plus" label="เพิ่มผู้เข้าร่วม" @click="form.customer_attendees.push({name:'',position:'',email:'',phone:''})" text size="small" class="add-attendee-btn" />
            </div>

            <div class="form-section-title"><i class="pi pi-align-left"></i> รายละเอียด</div>
            <div class="field">
              <label>Agenda / จุดประสงค์</label>
              <Textarea v-model="form.agenda" rows="2" placeholder="จุดประสงค์การเข้าพบ..." class="w-full" />
            </div>
            <div class="field">
              <label>สรุปการประชุม</label>
              <Textarea v-model="form.summary" rows="3" placeholder="สรุปผลการประชุม..." class="w-full" />
            </div>
            <div class="field">
              <label>Action Items <span class="optional">(สิ่งที่ต้องทำต่อ)</span></label>
              <div v-for="(ai, idx) in form.action_items" :key="idx" class="customer-attendee-row">
                <InputText v-model="ai.text" placeholder="เช่น ส่งใบเสนอราคาภายใน 3 วัน..." class="ca-input" />
                <Button icon="pi pi-times" @click="form.action_items.splice(idx,1)" text severity="danger" size="small" class="ca-remove" />
              </div>
              <Button icon="pi pi-plus" label="เพิ่ม Action Item" @click="form.action_items.push({ text: '', done: false })" text size="small" class="add-attendee-btn" />
            </div>
            <div class="field-row">
              <div class="field flex-1">
                <label>สถานะ</label>
                <Dropdown v-model="form.status" :options="visitStatusOptions" optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div class="field flex-1">
                <label>นัดครั้งถัดไป</label>
                <Calendar v-model="form.next_visit_date" dateFormat="dd/mm/yy" showIcon class="w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" @click="showFormDialog = false" class="btn-cancel" text />
        <Button :label="editingVisit ? 'บันทึก' : 'สร้าง Visit'" icon="pi pi-check" @click="saveVisit" :disabled="!form.visit_date || saving" :loading="saving" class="btn-confirm" />
      </template>
    </Dialog>

    <!-- Quick Create Customer Dialog -->
    <Dialog v-model:visible="showCustomerDialog" header="เพิ่มลูกค้าใหม่" :style="{width:'480px'}" modal :draggable="false" class="modern-dialog">
      <div class="dialog-body item-form">
        <div class="field"><label>ชื่อบริษัท <span class="required">*</span></label><InputText v-model="newCustomer.company_name" class="w-full" /></div>
        <div class="field-group">
          <div class="field"><label>อุตสาหกรรม</label><InputText v-model="newCustomer.industry" class="w-full" /></div>
          <div class="field"><label>เบอร์ติดต่อ</label><InputText v-model="newCustomer.phone" class="w-full" /></div>
        </div>
        <div class="field-group">
          <div class="field"><label>ชื่อผู้ติดต่อ</label><InputText v-model="newCustomer.contact_name" class="w-full" /></div>
          <div class="field"><label>ตำแหน่ง</label><InputText v-model="newCustomer.contact_position" class="w-full" /></div>
        </div>
        <div class="field"><label>อีเมล</label><InputText v-model="newCustomer.email" class="w-full" /></div>
        <div class="field"><label>ที่อยู่</label><Textarea v-model="newCustomer.address" rows="2" class="w-full" /></div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" @click="showCustomerDialog = false" class="btn-cancel" text />
        <Button label="สร้างลูกค้า" icon="pi pi-check" @click="createCustomer" :disabled="!newCustomer.company_name" class="btn-confirm" />
      </template>
    </Dialog>

    <!-- Visit Detail Dialog -->
    <Dialog v-model:visible="showDetailDialog" :style="{width:'700px', maxWidth:'95vw'}" :showHeader="false" modal :draggable="false" class="modern-dialog">
      <button class="dialog-close" @click="showDetailDialog = false"><i class="pi pi-times"></i></button>
      <div v-if="selectedVisit" class="detail-body">
        <!-- Header -->
        <div class="detail-header">
          <div class="detail-type-icon" :class="'vtype-' + selectedVisit.visit_type">
            <i :class="getVisitTypeIcon(selectedVisit.visit_type)"></i>
          </div>
          <div class="detail-title-group">
            <h2>{{ selectedVisit.company_name || 'ไม่ระบุลูกค้า' }}</h2>
            <div class="detail-meta-row">
              <span class="visit-status-badge" :class="'vstatus-' + selectedVisit.status">{{ getStatusLabel(selectedVisit.status) }}</span>
              <span class="detail-meta-item"><i class="pi pi-calendar"></i> {{ formatVisitDate(selectedVisit.visit_date) }}</span>
              <span v-if="selectedVisit.visit_end_date" class="detail-meta-item">— {{ formatVisitTime(selectedVisit.visit_end_date) }}</span>
              <span class="detail-meta-item visit-type-label">{{ getVisitTypeLabel(selectedVisit.visit_type) }}</span>
            </div>
          </div>
          <Button icon="pi pi-pencil" label="แก้ไข" @click="openEditDialog(selectedVisit); showDetailDialog = false" text size="small" class="detail-edit-btn" />
        </div>

        <div class="detail-grid">
          <!-- Info -->
          <div v-if="selectedVisit.location" class="detail-item">
            <div class="detail-label"><i class="pi pi-map-marker"></i> สถานที่</div>
            <div class="detail-value">{{ selectedVisit.location }}</div>
            <a v-if="selectedVisit.latitude && selectedVisit.longitude"
              :href="`https://www.google.com/maps?q=${selectedVisit.latitude},${selectedVisit.longitude}`"
              target="_blank" rel="noopener" class="maps-link"><i class="pi pi-map"></i> เปิดใน Google Maps</a>
          </div>
          <div v-if="selectedVisit.task_name" class="detail-item">
            <div class="detail-label"><i class="pi pi-briefcase"></i> โครงการ</div>
            <div class="detail-value">
              <span v-if="selectedVisit.so_number" class="so-tag-sm">{{ selectedVisit.so_number }}</span>
              {{ selectedVisit.task_name }}
            </div>
          </div>
          <div v-if="selectedVisit.created_by_name" class="detail-item">
            <div class="detail-label"><i class="pi pi-user"></i> บันทึกโดย</div>
            <div class="detail-value">{{ selectedVisit.created_by_name }}</div>
          </div>
          <div v-if="selectedVisit.created_at" class="detail-item">
            <div class="detail-label"><i class="pi pi-clock"></i> บันทึกเมื่อ</div>
            <div class="detail-value">{{ formatVisitDate(selectedVisit.created_at) }}</div>
          </div>
          <div v-if="selectedVisit.next_visit_date" class="detail-item">
            <div class="detail-label"><i class="pi pi-calendar-plus"></i> นัดครั้งถัดไป</div>
            <div class="detail-value">{{ formatDate(selectedVisit.next_visit_date) }}</div>
          </div>
        </div>

        <!-- Attendees -->
        <div v-if="selectedVisit.internal_attendees && selectedVisit.internal_attendees.length" class="detail-section">
          <div class="detail-section-title"><i class="pi pi-users"></i> ทีมภายใน</div>
          <div class="attendees-chips">
            <span v-for="a in selectedVisit.internal_attendees" :key="a.id || a.name" class="attendee-chip internal">
              <i class="pi pi-user"></i> {{ a.name }}
            </span>
          </div>
        </div>

        <div v-if="selectedVisit.customer_attendees && selectedVisit.customer_attendees.length" class="detail-section">
          <div class="detail-section-title"><i class="pi pi-users"></i> ผู้เข้าร่วมฝั่งลูกค้า</div>
          <div class="customer-attendee-list">
            <div v-for="a in selectedVisit.customer_attendees" :key="a.name" class="ca-item">
              <strong>{{ a.name }}</strong>
              <span v-if="a.position" class="ca-pos">{{ a.position }}</span>
              <span v-if="a.email" class="ca-email">{{ a.email }}</span>
              <span v-if="a.phone" class="ca-pos"><i class="pi pi-phone"></i> {{ a.phone }}</span>
            </div>
          </div>
        </div>

        <div v-if="selectedVisit.agenda" class="detail-section">
          <div class="detail-section-title"><i class="pi pi-list"></i> Agenda / จุดประสงค์</div>
          <div class="detail-text">{{ selectedVisit.agenda }}</div>
        </div>

        <div v-if="selectedVisit.summary" class="detail-section">
          <div class="detail-section-title"><i class="pi pi-align-left"></i> สรุปการประชุม</div>
          <div class="detail-text">{{ selectedVisit.summary }}</div>
        </div>

        <div v-if="selectedVisit.action_items && selectedVisit.action_items.length" class="detail-section">
          <div class="detail-section-title"><i class="pi pi-check-square"></i> Action Items</div>
          <div v-for="(ai, idx) in selectedVisit.action_items" :key="idx" class="action-item" :class="{ 'ai-done': ai.done }">
            <i class="pi pi-chevron-right"></i> {{ ai.text || ai }}
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script>
import axios from '@/utils/axiosConfig'
import { useConfirm } from 'primevue/useconfirm'

export default {
  name: 'SalesActivity',
  setup() { return { $confirm: useConfirm() } },
  data() {
    return {
      visits: [], customers: [], tasks: [], users: [],
      loading: false, saving: false, gettingLocation: false,
      searchQuery: '', filterStatus: null, filterType: null, filterDateRange: null,
      showFormDialog: false, showCustomerDialog: false, showDetailDialog: false,
      editingVisit: null, selectedVisit: null,
      form: this.emptyForm(),
      newCustomer: { company_name: '', industry: '', phone: '', email: '', address: '', contact_name: '', contact_position: '' },
      visitTypeOptions: [
        { label: 'On-site', value: 'on_site' },
        { label: 'Online Meeting', value: 'online' },
        { label: 'Phone Call', value: 'phone' },
        { label: 'Site Survey', value: 'survey' },
        { label: 'POC / Demo', value: 'demo' }
      ],
      visitStatusOptions: [
        { label: 'กำหนดการ', value: 'scheduled' },
        { label: 'เสร็จสิ้น', value: 'done' },
        { label: 'ยกเลิก', value: 'cancelled' },
        { label: 'Follow-up', value: 'follow_up' }
      ],
      kpiList: [
        { key: 'scheduled', label: 'กำหนดการ', icon: 'pi pi-clock', colorClass: 'kpi-scheduled' },
        { key: 'done', label: 'เสร็จสิ้น', icon: 'pi pi-check-circle', colorClass: 'kpi-done' },
        { key: 'follow_up', label: 'Follow-up', icon: 'pi pi-refresh', colorClass: 'kpi-followup' },
        { key: 'cancelled', label: 'ยกเลิก', icon: 'pi pi-times-circle', colorClass: 'kpi-cancelled' }
      ]
    }
  },
  computed: {
    filteredVisits() {
      let result = [...this.visits]
      if (this.filterStatus) result = result.filter(v => v.status === this.filterStatus)
      if (this.filterType) result = result.filter(v => v.visit_type === this.filterType)
      if (this.filterDateRange && this.filterDateRange[0]) {
        // copy Date ใหม่ก่อน setHours กัน mutate ค่าใน v-model ของ Calendar
        const from = new Date(this.filterDateRange[0])
        from.setHours(0, 0, 0, 0)
        const to = new Date(this.filterDateRange[1] || this.filterDateRange[0])
        to.setHours(23, 59, 59, 999)
        result = result.filter(v => {
          const d = new Date(v.visit_date)
          return d >= from && d <= to
        })
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase()
        result = result.filter(v =>
          v.company_name?.toLowerCase().includes(q) ||
          v.location?.toLowerCase().includes(q) ||
          v.agenda?.toLowerCase().includes(q) ||
          v.summary?.toLowerCase().includes(q) ||
          v.task_name?.toLowerCase().includes(q)
        )
      }
      return result
    }
  },
  mounted() { this.loadAll() },
  methods: {
    emptyForm() {
      return {
        visit_date: null, visit_end_date: null, customer_id: null, task_id: null,
        visit_type: 'on_site', location: '', latitude: null, longitude: null,
        status: 'scheduled', agenda: '', summary: '',
        action_items: [], next_visit_date: null,
        internal_attendees: [], customer_attendees: []
      }
    },
    async loadAll() {
      this.loading = true
      try {
        const [visitsRes, customersRes, tasksRes, usersRes] = await Promise.all([
          axios.get('/api/sales-visits'),
          axios.get('/api/sales-visits/customers'),
          axios.get('/api/tasks'),
          axios.get('/api/users')
        ])
        this.visits = visitsRes.data
        this.customers = customersRes.data
        this.tasks = tasksRes.data.map(t => ({ ...t, display_name: `${t.so_number ? '[' + t.so_number + '] ' : ''}${t.task_name}` }))
        this.users = usersRes.data.map(u => ({ id: u.id, name: `${u.firstname} ${u.lastname}${u.nickname ? ` (${u.nickname})` : ''}`, position: u.position }))
      } catch (e) { console.error(e) } finally { this.loading = false }
    },
    countByStatus(status) { return this.visits.filter(v => v.status === status).length },
    openCreateDialog() {
      this.editingVisit = null
      this.form = this.emptyForm()
      this.showFormDialog = true
    },
    openEditDialog(visit) {
      this.editingVisit = visit
      this.form = {
        ...visit,
        visit_date: visit.visit_date ? new Date(visit.visit_date) : null,
        visit_end_date: visit.visit_end_date ? new Date(visit.visit_end_date) : null,
        next_visit_date: visit.next_visit_date ? new Date(visit.next_visit_date) : null,
        internal_attendees: visit.internal_attendees || [],
        customer_attendees: (visit.customer_attendees || []).map(a => ({
          name: a.name || '', position: a.position || '', email: a.email || '', phone: a.phone || ''
        })),
        // รองรับข้อมูลเก่าที่ action_items เป็น string แทน object
        action_items: (visit.action_items || []).map(a => typeof a === 'object'
          ? { text: a.text || '', done: !!a.done }
          : { text: String(a), done: false })
      }
      this.showFormDialog = true
    },
    openDetailDialog(visit) {
      this.selectedVisit = visit
      this.showDetailDialog = true
    },
    async saveVisit() {
      if (!this.form.visit_date) return
      // ตรวจเวลาสิ้นสุดต้องไม่ก่อนเวลาเริ่ม
      if (this.form.visit_end_date && new Date(this.form.visit_end_date) < new Date(this.form.visit_date)) {
        this.$toast.add({ severity: 'warn', summary: 'เวลาไม่ถูกต้อง', detail: 'เวลาสิ้นสุดต้องหลังจากเวลาเริ่มต้น', life: 3000 })
        return
      }
      this.saving = true
      try {
        const payload = {
          ...this.form,
          visit_date: this.form.visit_date instanceof Date ? this.form.visit_date.toISOString() : this.form.visit_date,
          visit_end_date: this.form.visit_end_date instanceof Date ? this.form.visit_end_date.toISOString() : this.form.visit_end_date,
          next_visit_date: this.form.next_visit_date instanceof Date ? this.fmtDate(this.form.next_visit_date) : this.form.next_visit_date,
          internal_attendees: (this.form.internal_attendees || []).map(u => typeof u === 'object' ? { id: u.id, name: u.name, position: u.position } : u),
          // ตัด action item ที่ไม่ได้กรอกข้อความออกก่อนบันทึก
          action_items: (this.form.action_items || []).filter(a => a && a.text && String(a.text).trim()).map(a => ({ text: String(a.text).trim(), done: !!a.done }))
        }
        if (this.editingVisit) {
          await axios.put(`/api/sales-visits/${this.editingVisit.id}`, payload)
          this.$toast.add({ severity: 'success', summary: 'บันทึกแล้ว', life: 2000 })
        } else {
          await axios.post('/api/sales-visits', payload)
          this.$toast.add({ severity: 'success', summary: 'สร้าง Visit แล้ว', life: 2000 })
        }
        this.showFormDialog = false
        await this.loadAll()
      } catch (e) {
        this.$toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: e.response?.data?.error || 'ไม่สามารถบันทึกได้', life: 3000 })
      } finally { this.saving = false }
    },
    async createCustomer() {
      try {
        const res = await axios.post('/api/sales-visits/customers', this.newCustomer)
        this.customers.push(res.data)
        this.form.customer_id = res.data.id
        this.showCustomerDialog = false
        this.newCustomer = { company_name: '', industry: '', phone: '', email: '', address: '', contact_name: '', contact_position: '' }
        this.$toast.add({ severity: 'success', summary: 'สร้างลูกค้าแล้ว', life: 2000 })
      } catch (e) { this.$toast.add({ severity: 'error', summary: 'ผิดพลาด', life: 3000 }) }
    },
    deleteVisit(visit) {
      this.$confirm.require({
        message: `ลบการเข้าพบ "${visit.company_name || 'ไม่ระบุลูกค้า'}" วันที่ ${this.formatDate(visit.visit_date)}?`,
        header: 'ยืนยันการลบ',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'ลบ', rejectLabel: 'ยกเลิก', acceptClass: 'p-button-danger',
        accept: async () => {
          try {
            await axios.delete(`/api/sales-visits/${visit.id}`)
            await this.loadAll()
            this.$toast.add({ severity: 'success', summary: 'ลบแล้ว', life: 2000 })
          } catch (e) {
            this.$toast.add({ severity: 'error', summary: 'ลบไม่สำเร็จ', detail: e.response?.data?.error || 'ไม่สามารถลบได้', life: 3000 })
          }
        }
      })
    },
    getLocation() {
      if (!navigator.geolocation) {
        this.$toast.add({ severity: 'warn', summary: 'ไม่รองรับ', detail: 'เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง', life: 3000 })
        return
      }
      this.gettingLocation = true
      navigator.geolocation.getCurrentPosition(pos => {
        this.form.latitude = pos.coords.latitude
        this.form.longitude = pos.coords.longitude
        this.gettingLocation = false
        if (!this.form.location) this.form.location = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
      }, (err) => {
        this.gettingLocation = false
        const detail = err.code === err.PERMISSION_DENIED ? 'ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง' : 'ไม่สามารถระบุตำแหน่งได้'
        this.$toast.add({ severity: 'warn', summary: 'ระบุตำแหน่งไม่สำเร็จ', detail, life: 3000 })
      }, { enableHighAccuracy: true, timeout: 10000 })
    },
    getVisitTypeLabel(t) {
      const map = { on_site: 'On-site', online: 'Online Meeting', phone: 'Phone Call', survey: 'Site Survey', demo: 'POC/Demo' }
      return map[t] || t
    },
    // ชื่อทีมที่ไปเข้าพบ (แสดงสูงสุด 3 คน เกินนั้น +N)
    getTeamNames(visit) {
      const list = visit.internal_attendees || []
      if (!list.length) return ''
      const names = list.map(u => u.name || u)
      return names.length <= 3 ? names.join(', ') : names.slice(0, 3).join(', ') + ` +${names.length - 3}`
    },
    // กำหนดการที่เลยเวลามาแล้วแต่ยังไม่เสร็จ/ไม่ถูกยกเลิก
    isVisitOverdue(visit) {
      if (!visit.visit_date || visit.status === 'done' || visit.status === 'cancelled') return false
      return new Date(visit.visit_date) < new Date()
    },
    getVisitTypeIcon(t) {
      const map = { on_site: 'pi pi-map-marker', online: 'pi pi-video', phone: 'pi pi-phone', survey: 'pi pi-compass', demo: 'pi pi-desktop' }
      return map[t] || 'pi pi-calendar'
    },
    getStatusLabel(s) {
      const map = { scheduled: 'กำหนดการ', done: 'เสร็จสิ้น', cancelled: 'ยกเลิก', follow_up: 'Follow-up' }
      return map[s] || s
    },
    formatVisitDate(d) {
      if (!d) return ''
      return new Date(d).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
    },
    formatVisitTime(d) {
      if (!d) return ''
      return new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    },
    formatDate(d) {
      if (!d) return ''
      return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
    },
    fmtDate(d) {
      if (!d) return null
      const x = new Date(d)
      return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`
    }
  }
}
</script>

<style scoped>
.sales-page { padding: 1rem; max-width: 100%; background: #f1f5f9; min-height: 100vh; font-family: 'Segoe UI', sans-serif; overflow: auto; }

/* Modern Dialog — จัดสไตล์ให้เหมือน dialog อื่นในระบบ + scroll ภายในจอ */
.modern-dialog :deep(.p-dialog) { border-radius: 18px; overflow: hidden; box-shadow: 0 20px 60px -12px rgba(16,24,40,0.28); border: none; }
.modern-dialog :deep(.p-dialog-header) { padding: 1.25rem 1.5rem; border-bottom: 1.5px solid #f1f5f9; background: #fff; }
.modern-dialog :deep(.p-dialog-title) { font-weight: 800; font-size: 1.05rem; color: #0f172a; letter-spacing: -0.02em; }
.modern-dialog :deep(.p-dialog-header-icon) { width: 32px; height: 32px; border-radius: 50%; color: #64748b; transition: all 0.2s; }
.modern-dialog :deep(.p-dialog-header-icon:hover) { background: #f1f5f9; color: #0f172a; }
.modern-dialog :deep(.p-dialog-content) { padding: 1.5rem 1.5rem 1rem; max-height: calc(100vh - 230px); overflow-y: auto; }
.modern-dialog :deep(.p-dialog-content::-webkit-scrollbar) { width: 6px; }
.modern-dialog :deep(.p-dialog-content::-webkit-scrollbar-thumb) { background: #e2e8f0; border-radius: 3px; }
.modern-dialog :deep(.p-dialog-footer) { padding: 1rem 1.5rem 1.25rem; border-top: 1.5px solid #f1f5f9; background: #fafbfc; display: flex; justify-content: flex-end; gap: 0.65rem; }

/* Header */
.header-card { margin-bottom: 1.25rem; box-shadow: none; border: none; background: transparent; }
.header-card :deep(.p-card-body), .header-card :deep(.p-card-content) { padding: 0; background: transparent; }
.main-header { display: flex; justify-content: space-between; align-items: center; padding: 1.75rem 2rem; background: linear-gradient(135deg, #4A90E2, #D73527); color: white; border-radius: 16px; box-shadow: 0 8px 32px rgba(74,144,226,0.25); }
.main-header h1 { margin: 0; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; gap: 0.75rem; }
.header-actions { display: flex; align-items: center; gap: 0.75rem; }
.stat-item { color: rgba(255,255,255,0.85); font-size: 0.88rem; background: rgba(255,255,255,0.15); padding: 0.4rem 1rem; border-radius: 20px; }

/* KPI */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.85rem; margin-bottom: 1.25rem; }
.kpi-card { background: #fff; border-radius: 14px; padding: 1rem; display: flex; align-items: center; gap: 0.85rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
.kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.kpi-card.kpi-active { border-color: #3b82f6; background: #f8fbff; }
.kpi-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
.kpi-scheduled { background: #eff6ff; color: #3b82f6; }
.kpi-done { background: #dcfce7; color: #16a34a; }
.kpi-followup { background: #fef3c7; color: #d97706; }
.kpi-cancelled { background: #fee2e2; color: #dc2626; }
.kpi-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; }
.kpi-label { font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

/* Filter Panel */
.filter-panel { background: #fff; border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; border: 1.5px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
.filter-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
.filter-left { display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center; }
.filter-right { display: flex; gap: 0.5rem; align-items: center; }
.search-box { position: relative; display: inline-flex; align-items: center; }
.search-box input { padding-left: 2.5rem; padding-right: 2.25rem; border-radius: 10px; border: 1.5px solid #e2e8f0; width: 260px; height: 38px; font-size: 0.85rem; background: #fafbfc; transition: all 0.2s; }
.search-box input:focus { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.search-icon { position: absolute; left: 0.85rem; color: #94a3b8; pointer-events: none; }
.search-clear { position: absolute; right: 0.75rem; color: #94a3b8; cursor: pointer; }
.filter-dropdown { border-radius: 10px; height: 38px; min-width: 160px; }
.result-count { font-size: 0.82rem; color: #64748b; }
.filter-clear-btn { color: #94a3b8; flex-shrink: 0; }
.filter-clear-btn:hover { color: #ef4444; }
.result-count strong { color: #0f172a; font-weight: 800; }
.add-btn { background: linear-gradient(135deg, #3b82f6, #2563eb) !important; border: none !important; font-weight: 700; border-radius: 10px; box-shadow: 0 3px 10px rgba(59,130,246,0.35); height: 38px; }

/* Visit Cards */
.visits-list { display: flex; flex-direction: column; gap: 0.85rem; padding-bottom: 2rem; }
.visit-card { background: #fff; border-radius: 14px; padding: 1.15rem 1.4rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1.5px solid #f1f5f9; cursor: pointer; transition: all 0.2s; }
.visit-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-color: #e2e8f0; transform: translateY(-1px); }
.visit-left { display: flex; align-items: flex-start; gap: 1rem; flex: 1; min-width: 0; }
.visit-type-badge { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
.vtype-on_site { background: #dbeafe; color: #2563eb; }
.vtype-online { background: #dcfce7; color: #16a34a; }
.vtype-phone { background: #fef3c7; color: #d97706; }
.vtype-survey { background: #ede9fe; color: #7c3aed; }
.vtype-demo { background: #fce7f3; color: #be185d; }
.visit-info { min-width: 0; }
.visit-title { font-weight: 700; color: #0f172a; font-size: 0.95rem; }
.visit-meta { display: flex; gap: 0.85rem; flex-wrap: wrap; margin-top: 0.3rem; font-size: 0.78rem; color: #64748b; }
.visit-meta span { display: inline-flex; align-items: center; gap: 0.25rem; }
.visit-project { color: #3b82f6; }
.visit-agenda { font-size: 0.78rem; color: #64748b; margin-top: 0.3rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 500px; }
.visit-right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; flex-wrap: wrap; }
.visit-status-badge { padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
.vstatus-scheduled { background: #eff6ff; color: #2563eb; }
.vstatus-done { background: #dcfce7; color: #166534; }
.vstatus-cancelled { background: #fee2e2; color: #b91c1c; }
.vstatus-follow_up { background: #fef3c7; color: #92400e; }
.visit-type-label { font-size: 0.72rem; color: #64748b; background: #f1f5f9; padding: 0.2rem 0.55rem; border-radius: 8px; }
.visit-attendees { font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 0.3rem; }
.visit-actions { display: flex; gap: 0.2rem; }

/* Form Dialog */
.dialog-body { max-height: 75vh; overflow-y: auto; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; padding: 0.25rem 0; }
.form-col { display: flex; flex-direction: column; gap: 0; }
.form-section-title { font-size: 0.78rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin: 1.15rem 0 0.75rem; display: flex; align-items: center; gap: 0.4rem; }
.form-section-title i { color: #3b82f6; font-size: 0.8rem; }
.form-section-title:first-child { margin-top: 0; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-weight: 600; font-size: 0.82rem; color: #334155; margin-bottom: 0.45rem; }
.field-with-action { display: flex; gap: 0.4rem; align-items: center; }
.flex-1 { flex: 1; min-width: 0; }
.field-action-btn { flex-shrink: 0; }
.field-row { display: flex; gap: 0.85rem; }
.customer-attendee-row { display: flex; gap: 0.4rem; align-items: center; margin-bottom: 0.5rem; }
.customer-attendee-card { background: #f8fafc; border: 1px solid #eef2f6; border-radius: 10px; padding: 0.5rem 0.6rem; margin-bottom: 0.5rem; }
.ca-row { display: flex; gap: 0.4rem; align-items: center; margin-bottom: 0.4rem; }
.ca-row:last-child { margin-bottom: 0; }
.ca-input { flex: 1; min-width: 0; }
.ca-remove { flex-shrink: 0; }
.add-attendee-btn { color: #3b82f6; }
.user-option { padding: 0.2rem 0; }
.user-name { font-weight: 500; font-size: 0.85rem; }
.user-info { font-size: 0.72rem; color: #64748b; }
.w-full { width: 100%; }
.required { color: #dc2626; }

/* Detail Dialog */
.dialog-close { position: absolute; top: 1rem; right: 1rem; width: 32px; height: 32px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: all 0.15s; }
.dialog-close:hover { background: #e2e8f0; transform: rotate(90deg); }
.detail-body { padding: 0.5rem 0; }
.detail-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; padding-right: 2rem; }
.detail-type-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
.detail-title-group { flex: 1; }
.detail-title-group h2 { margin: 0 0 0.4rem; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
.detail-meta-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.detail-meta-item { font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 0.3rem; }
.detail-edit-btn { margin-left: auto; flex-shrink: 0; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1.25rem; }
.detail-item { background: #f8fafc; padding: 0.75rem 1rem; border-radius: 10px; }
.detail-label { font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.3rem; display: flex; align-items: center; gap: 0.3rem; }
.detail-value { font-size: 0.88rem; color: #0f172a; font-weight: 500; }
.detail-section { margin-bottom: 1.15rem; }
.detail-section-title { font-size: 0.8rem; font-weight: 800; color: #334155; margin-bottom: 0.65rem; display: flex; align-items: center; gap: 0.4rem; }
.detail-text { font-size: 0.86rem; color: #334155; line-height: 1.6; background: #f8fafc; padding: 0.85rem 1rem; border-radius: 10px; }
.attendees-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.attendee-chip { display: inline-flex; align-items: center; gap: 0.3rem; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 0.3rem 0.7rem; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
.customer-attendee-list { display: flex; flex-direction: column; gap: 0.6rem; }
.ca-item { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; background: #f8fafc; padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.82rem; }
.ca-pos { color: #64748b; }
.ca-email { color: #3b82f6; }
.action-item { font-size: 0.85rem; color: #334155; padding: 0.4rem 0; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #f1f5f9; }
.action-item.ai-done { opacity: 0.55; text-decoration: line-through; }
.maps-link { display: inline-flex; align-items: center; gap: 0.3rem; margin-top: 0.35rem; font-size: 0.78rem; color: #3b82f6; font-weight: 600; text-decoration: none; }
.maps-link:hover { text-decoration: underline; }
.optional { color: #94a3b8; font-weight: 400; font-size: 0.72rem; }

/* ===== Visit Card: รายละเอียดครบเพื่อการติดตามงาน ===== */
.visit-title { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.visit-owner { font-size: 0.72rem; color: #64748b; background: #f8fafc; border: 1px solid #eef2f6; padding: 0.12rem 0.5rem; border-radius: 10px; display: inline-flex; align-items: center; gap: 0.25rem; font-weight: 500; }
.visit-owner i { font-size: 0.64rem; color: #94a3b8; }
.visit-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.45rem; }
.visit-tag { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.68rem; font-weight: 600; padding: 0.14rem 0.5rem; border-radius: 10px; white-space: nowrap; }
.visit-tag i { font-size: 0.62rem; }
.tag-team { color: #2563eb; background: #eff6ff; border: 1px solid #dbeafe; }
.tag-customer { color: #0891b2; background: #ecfeff; border: 1px solid #cffafe; }
.tag-action { color: #7c3aed; background: #f5f3ff; border: 1px solid #ede9fe; }
.tag-summary { color: #64748b; background: #f8fafc; border: 1px solid #f1f5f9; }
.tag-next { color: #c2410c; background: #fff7ed; border: 1px solid #fed7aa; }
.tag-gps { color: #16a34a; background: #f0fdf4; border: 1px solid #dcfce7; }
.visit-card-overdue { border: 1.5px solid #fecaca; background: linear-gradient(90deg, #fff5f5 0%, #fff 30%); }
.so-tag-sm { font-size: 0.68rem; color: #4f46e5; background: #eef2ff; padding: 0.1rem 0.4rem; border-radius: 5px; font-weight: 800; font-family: monospace; }

/* Skeleton */
.skeleton-list { display: flex; flex-direction: column; gap: 0.85rem; }
.skeleton-group { background: #fff; border-radius: 14px; padding: 1.15rem 1.4rem; }
.skeleton-header { }
.skeleton-bar { background: linear-gradient(90deg, #f1f5f9 25%, #e8ecf0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

/* Empty State */
.empty-state { text-align: center; padding: 4rem 2rem; color: #94a3b8; background: #fff; border-radius: 14px; }
.empty-state i { font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.4; }

/* Dialog Buttons */
.btn-cancel { color: #64748b !important; font-weight: 600; border-radius: 10px; }
.btn-cancel:hover { background: #f1f5f9 !important; }
.btn-confirm { background: linear-gradient(135deg, #3b82f6, #2563eb) !important; border: none !important; font-weight: 700; border-radius: 10px; box-shadow: 0 3px 10px rgba(59,130,246,0.35); }

/* Form Deep Styles */
.form-col :deep(.p-inputtext), .form-col :deep(.p-dropdown), .form-col :deep(.p-calendar .p-inputtext), .form-col :deep(.p-inputtextarea), .form-col :deep(.p-multiselect) { border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 0.86rem; background: #fafbfc; transition: all 0.2s; }
.form-col :deep(.p-inputtext:focus), .form-col :deep(.p-inputtextarea:focus), .form-col :deep(.p-dropdown:not(.p-disabled).p-focus), .form-col :deep(.p-multiselect:not(.p-disabled).p-focus) { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
.item-form :deep(.p-inputtext), .item-form :deep(.p-dropdown), .item-form :deep(.p-inputtextarea) { border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 0.86rem; background: #fafbfc; }
.item-form .field-group { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1rem; }
.item-form .field-group .field { margin-bottom: 0; }
.item-form .field { margin-bottom: 1rem; }
.item-form .field label { display: block; font-weight: 600; font-size: 0.82rem; color: #334155; margin-bottom: 0.45rem; }

/* Responsive */
@media (max-width: 768px) {
  .sales-page { padding: 0.75rem; }
  .main-header { padding: 1.25rem 1.5rem; border-radius: 12px; }
  .main-header h1 { font-size: 1.3rem; }
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
  .filter-row { flex-direction: column; align-items: stretch; }
  .filter-left { flex-direction: column; }
  .search-box input { width: 100%; }
  .filter-dropdown { width: 100%; }
  .form-grid { grid-template-columns: 1fr; }
  .detail-grid { grid-template-columns: 1fr; }
  .visit-card { flex-direction: column; align-items: flex-start; }
}
</style>
