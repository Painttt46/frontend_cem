<template>
  <div class="enhanced-datatable">
    <!-- Search and Column Controls -->
    <div class="table-controls mb-3">
      <div class="search-box">
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText v-model="localSearch" :placeholder="searchPlaceholder" class="w-full" />
        </IconField>
      </div>
      <slot name="extraControls" />
      <div class="control-buttons">
        <Button 
          :icon="advancedMode ? 'pi pi-times' : 'pi pi-filter'" 
          :label="advancedMode ? 'ปิด' : 'ค้นหาขั้นสูง'" 
          @click="advancedMode = !advancedMode" 
          text 
          :severity="advancedMode ? 'danger' : 'info'" 
        />
      </div>
    </div>

    <!-- Advanced Search Filters -->
    <div v-if="advancedMode" class="advanced-search mb-3">
      <div v-for="(filter, index) in filters" :key="index" class="filter-row">
        <Dropdown 
          v-model="filter.column" 
          :options="searchableColumns" 
          optionLabel="header" 
          optionValue="field" 
          placeholder="เลือก Column" 
          class="filter-column" 
        />
        <Dropdown 
          v-model="filter.operator" 
          :options="operators" 
          optionLabel="label" 
          optionValue="value" 
          placeholder="เงื่อนไข" 
          class="filter-operator" 
        />
        <InputText 
          v-model="filter.value" 
          placeholder="ค่าที่ค้นหา" 
          class="filter-value" 
        />
        <Button 
          icon="pi pi-times" 
          severity="danger" 
          text 
          @click="removeFilter(index)" 
          :disabled="filters.length === 1" 
        />
      </div>
      <div class="filter-actions">
        <div class="logic-toggle">
          <Button :label="'AND'" :severity="filterLogic === 'AND' ? 'primary' : 'secondary'" 
            @click="filterLogic = 'AND'" size="small" />
          <Button :label="'OR'" :severity="filterLogic === 'OR' ? 'primary' : 'secondary'" 
            @click="filterLogic = 'OR'" size="small" />
        </div>
        <Button label="เพิ่มเงื่อนไข" icon="pi pi-plus" @click="addFilter" text size="small" />
        <Button label="ล้าง" icon="pi pi-refresh" @click="resetFilters" text size="small" severity="secondary" />
      </div>
    </div>

    <!-- Pass through DataTable with filtered data -->
    <!-- มือถือ (<768px): แถวตารางเปลี่ยนเป็นการ์ด แต่ละช่องมีชื่อคอลัมน์กำกับ (responsiveLayout=stack)
         ประกาศหลัง v-bind="$attrs" เพื่อทับ responsiveLayout="scroll" ที่แต่ละหน้าส่งมา — เดสก์ท็อปไม่เปลี่ยน
         ตารางแบบเมทริกซ์ (เช่น โควต้าการลา: คอลัมน์ล็อกซ้าย + ปุ่มบนหัวคอลัมน์) ส่ง mobileLayout="scroll" เพื่อเลื่อนแนวนอนแทน -->
    <DataTable
      :value="filteredData"
      v-bind="$attrs"
      :responsiveLayout="mobileLayout"
      breakpoint="768px"
    >
      <slot />
      <template v-if="$slots.expansion" #expansion="slotProps">
        <slot name="expansion" v-bind="slotProps" />
      </template>
    </DataTable>
  </div>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref, computed, useSlots, watch, Fragment } from 'vue'

defineOptions({ inheritAttrs: false })

// Init from attrs once available


const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  value: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  // ค่าเริ่มต้นของช่องค้นหา (เช่น มาจากลิงก์/ Ctrl+K) — เปลี่ยนค่านี้แล้วช่องค้นหาจะตามไปด้วย
  initialSearch: {
    type: String,
    default: ''
  },
  searchPlaceholder: {
    type: String,
    default: 'ค้นหาทั่วไป...'
  },
  // 'stack' = มือถือแสดงแถวเป็นการ์ด, 'scroll' = เลื่อนตารางแนวนอน
  mobileLayout: {
    type: String,
    default: 'stack'
  }
})

const slots = useSlots()

const localSearch = ref(props.initialSearch)
watch(() => props.initialSearch, (v) => { localSearch.value = v })
const advancedMode = ref(false)
const filterLogic = ref('AND') // AND or OR
const filters = ref([
  { column: '', operator: 'contains', value: '' }
])

const operators = [
  { label: 'มีคำว่า', value: 'contains' },
  { label: 'เท่ากับ', value: 'equals' },
  { label: 'ไม่เท่ากับ', value: 'notEquals' },
  { label: 'เริ่มต้นด้วย', value: 'startsWith' },
  { label: 'ลงท้ายด้วย', value: 'endsWith' },
  { label: 'มากกว่า', value: 'greaterThan' },
  { label: 'น้อยกว่า', value: 'lessThan' }
]

// Get actual data (support both data and value props)
const tableData = computed(() => {
  return props.data?.length ? props.data : (props.value || [])
})

// Normalize text for search
// 0 ต้องเป็น "0" (เดิม !text ทำให้ 0 กลายเป็นค่าว่าง — กรอง "คงเหลือ น้อยกว่า 1" / "เท่ากับ 0" ไม่เจอ)
const normalizeText = (text) => {
  if (text === null || text === undefined) return ''
  return String(text).toLowerCase().trim()
}

// ===== วันที่: ค้นด้วยรูปแบบที่เห็นบนจอได้ =====
// ข้อมูลเป็น 2026-03-02 หรือเวลา UTC (2026-03-02T01:30:00.000Z) แต่หน้าจอแสดง 02/03/2026, 2 มี.ค. 2569, 08:30
// จึงสร้างข้อความวันที่หลายรูปแบบ (ค.ศ./พ.ศ., ชื่อเดือนไทย, เวลาตามเครื่อง) ไว้เทียบกับคำค้น
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const THAI_MONTHS_LONG = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const pad2 = (n) => String(n).padStart(2, '0')

// คืน { iso, texts } ถ้าค่าเป็นวันที่ / วันเวลา — ไม่ใช่วันที่คืน null
const dateInfo = (value) => {
  if (typeof value !== 'string') return null
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/)
  if (!m) return null
  let y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]), time = ''
  if (m[4]) {
    // มีเวลา: แปลงเป็นเวลาตามเครื่อง (ค่าจาก API เป็น UTC — วันที่อาจเลื่อนถ้าตัดตัวอักษรตรง ๆ)
    const dt = new Date(value.replace(' ', 'T'))
    if (isNaN(dt.getTime())) return null
    y = dt.getFullYear(); mo = dt.getMonth() + 1; d = dt.getDate()
    time = `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`
  }
  const be = y + 543
  const iso = `${y}-${pad2(mo)}-${pad2(d)}`
  const texts = [
    iso,
    `${pad2(d)}/${pad2(mo)}/${y}`, `${d}/${mo}/${y}`,
    `${pad2(d)}/${pad2(mo)}/${be}`, `${d}/${mo}/${be}`,
    `${d} ${THAI_MONTHS_SHORT[mo - 1]} ${be}`, `${d} ${THAI_MONTHS_LONG[mo - 1]} ${be}`,
    `${d} ${THAI_MONTHS_SHORT[mo - 1]} ${String(be).slice(2)}`
  ]
  if (time) texts.push(time, ...texts.map(t => `${t} ${time}`))
  return { iso, texts }
}

// Check if query matches any date format
const matchesDateFormat = (value, query) => {
  const info = dateInfo(value)
  return !!info && info.texts.some(t => normalizeText(t).includes(query))
}

// แปลงข้อความวันที่ → ISO yyyy-mm-dd (รองรับ dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd และปี พ.ศ.)
const toIsoDate = (text) => {
  if (!text) return ''
  const info = dateInfo(String(text).trim())
  if (info) return info.iso
  const str = String(text).trim()
  const dmy = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (dmy) {
    const year = Number(dmy[3]) > 2400 ? Number(dmy[3]) - 543 : Number(dmy[3])
    return `${year}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  }
  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
  }
  return ''
}

// Deep search in nested objects and arrays
const deepSearch = (obj, query) => {
  if (obj === null || obj === undefined) return false
  
  // String or number - direct match or date format match
  if (typeof obj === 'string' || typeof obj === 'number') {
    if (normalizeText(obj).includes(query) || matchesDateFormat(obj, query)) return true
    // รองรับค้นด้วยรูปแบบวันที่ที่ต่างจากข้อมูล เช่น พิมพ์ 08/07/2026 เจอ 2026-07-08
    const objIso = toIsoDate(obj)
    const queryIso = toIsoDate(query)
    if (objIso && queryIso) return objIso === queryIso || objIso.startsWith(queryIso)
    return false
  }
  
  // Array - search each element
  if (Array.isArray(obj)) {
    return obj.some(item => deepSearch(item, query))
  }
  
  // Object - search all values
  if (typeof obj === 'object') {
    return Object.values(obj).some(value => deepSearch(value, query))
  }
  
  return false
}

// Get searchable columns from props or slots
const searchableColumns = computed(() => {
  if (props.columns && props.columns.length > 0) {
    return props.columns.filter(col => col.field)
  }
  
  // Extract from slot children — คอลัมน์ที่สร้างด้วย v-for อยู่ใน Fragment ต้องแตกออกก่อน (เดิมหาไม่เจอ)
  const flatten = (nodes) => (nodes || []).flatMap(vnode =>
    vnode.type === Fragment && Array.isArray(vnode.children) ? flatten(vnode.children) : [vnode])
  const defaultSlot = slots.default?.()
  if (defaultSlot) {
    return flatten(defaultSlot)
      .filter(vnode => typeof vnode.props?.field === 'string' && vnode.props.field)
      .map(vnode => ({
        field: vnode.props.field,
        header: vnode.props.header || vnode.props.field
      }))
  }
  
  // Auto-detect from first data item
  if (tableData.value.length > 0) {
    return Object.keys(tableData.value[0]).map(key => ({
      field: key,
      header: key
    }))
  }
  
  return []
})

// Get nested value by path (e.g., "borrowRecord.name")
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

// Apply single filter
const applyFilter = (item, filter) => {
  const rawValue = getNestedValue(item, filter.column)
  const fieldValue = normalizeText(rawValue)
  const searchValue = normalizeText(filter.value)

  // date-aware: ค่าในตารางเป็นวันที่ → เทียบแบบวันที่ (รับ input ได้ทั้ง dd/mm/yyyy และ yyyy-mm-dd)
  const fieldIso = toIsoDate(fieldValue)
  const searchIso = toIsoDate(searchValue)
  if (fieldIso !== '' && searchIso !== '') {
    switch (filter.operator) {
      case 'equals':
        return fieldIso === searchIso
      case 'notEquals':
        return fieldIso !== searchIso
      case 'greaterThan':
        return fieldIso > searchIso
      case 'lessThan':
        return fieldIso < searchIso
      default:
        return fieldIso.includes(searchIso)
    }
  }

  switch (filter.operator) {
    case 'contains':
      return fieldValue.includes(searchValue) || matchesDateFormat(rawValue, searchValue)
    case 'equals':
      return fieldValue === searchValue
    case 'notEquals':
      return fieldValue !== searchValue
    case 'startsWith':
      return fieldValue.startsWith(searchValue)
    case 'endsWith':
      return fieldValue.endsWith(searchValue)
    case 'greaterThan':
      return parseFloat(fieldValue) > parseFloat(searchValue)
    case 'lessThan':
      return parseFloat(fieldValue) < parseFloat(searchValue)
    default:
      return true
  }
}

// แถวที่มีรายการย่อย (เช่น โครงการลูกที่ใช้ SO เดียวกัน) — ตรงเงื่อนไขถ้าแถวแม่หรือรายการย่อยตรง
const rowMatches = (item, filter) =>
  applyFilter(item, filter) || (Array.isArray(item.children) && item.children.some(child => applyFilter(child, filter)))

// Filter data: ช่องค้นหาทั่วไปใช้เสมอ + ค้นหาขั้นสูงซ้อนอีกชั้นเมื่อเปิดอยู่
// (เดิมเปิดค้นหาขั้นสูงแล้วคำในช่องค้นหาทั่วไปถูกเมิน ทั้งที่ช่องยังแสดงอยู่)
const filteredData = computed(() => {
  let result = tableData.value

  if (!result || !Array.isArray(result)) return []

  if (localSearch.value) {
    const query = normalizeText(localSearch.value)
    result = result.filter(record => deepSearch(record, query))
  }

  if (advancedMode.value) {
    const validFilters = filters.value.filter(f => f.column && String(f.value ?? '').trim() !== '')
    if (validFilters.length > 0) {
      result = result.filter(item => {
        if (filterLogic.value === 'OR') {
          return validFilters.some(filter => rowMatches(item, filter))
        }
        return validFilters.every(filter => rowMatches(item, filter))
      })
    }
  }

  return result
})


const addFilter = () => {
  filters.value.push({ column: '', operator: 'contains', value: '' })
}

const removeFilter = (index) => {
  if (filters.value.length > 1) {
    filters.value.splice(index, 1)
  }
}

const resetFilters = () => {
  filters.value = [{ column: '', operator: 'contains', value: '' }]
}
</script>

<style scoped>
.table-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 250px;
}

.column-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem;
  min-width: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.column-option {
  display: flex;
  align-items: center;
}

.column-option label {
  cursor: pointer;
  user-select: none;
  font-size: 0.9rem;
}

.control-buttons {
  display: flex;
  gap: 0.5rem;
}

.advanced-search {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
}

.filter-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 2fr auto;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.filter-column,
.filter-operator,
.filter-value {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #dee2e6;
  align-items: center;
}

.logic-toggle {
  display: flex;
  gap: 0.25rem;
  margin-right: 1rem;
}

@media (max-width: 768px) {
  .table-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }
  
  .control-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .filter-row {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    flex-direction: column;
  }
}
</style>
