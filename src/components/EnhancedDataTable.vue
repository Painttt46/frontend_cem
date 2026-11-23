<template>
  <div class="enhanced-datatable">
    <!-- Search and Column Controls -->
    <div class="table-controls mb-3">
      <div class="search-box">
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText v-model="localSearch" :placeholder="searchPlaceholder" :aria-label="searchPlaceholder" class="w-full" />
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
          aria-label="คอลัมน์ที่ต้องการกรอง"
          class="filter-column"
          @change="onColumnChange(filter)"
        />
        <!-- เงื่อนไขเปลี่ยนตามชนิดคอลัมน์: วันที่ / เวลา / ตัวเลข / ข้อความ -->
        <Dropdown
          v-model="filter.operator"
          :options="operatorsFor(filter)"
          optionLabel="label"
          optionValue="value"
          placeholder="เงื่อนไข"
          aria-label="เงื่อนไข"
          class="filter-operator"
          @change="onFilterShapeChange(filter)"
        />
        <!-- คอลัมน์วันที่เลือกจากปฏิทิน (พิมพ์เองก็ได้ ทั้ง ค.ศ./พ.ศ.) คอลัมน์วันเวลามีช่องเวลาให้ใส่เพิ่ม — "ระหว่าง" มี 2 ชุด -->
        <div class="filter-values">
          <div v-for="slot in valueSlots(filter)" :key="slot.value" class="value-group">
            <template v-if="inputKind(filter) === 'date'">
              <Calendar
                v-model="filter[slot.value]"
                dateFormat="dd/mm/yy"
                showIcon
                showButtonBar
                :placeholder="slot.dateLabel"
                :aria-label="slot.dateLabel"
                class="filter-value"
                @input="onDateTyping(filter, slot.value, $event.target.value)"
                @blur="onDateTyped(filter, slot.value, $event.value)"
              />
              <InputText
                v-if="columnType(filter) === 'datetime'"
                v-model="filter[slot.time]"
                placeholder="เวลา"
                :aria-label="`${slot.dateLabel} เวลา (ไม่บังคับ)`"
                title="เวลา (ไม่บังคับ) เช่น 08:30"
                class="filter-time"
              />
            </template>
            <InputText
              v-else
              v-model="filter[slot.value]"
              :placeholder="valuePlaceholder(filter, slot)"
              :aria-label="valuePlaceholder(filter, slot)"
              class="filter-value"
              :class="{ 'p-invalid': problemOf(filter) }"
            />
          </div>
        </div>
        <Button
          icon="pi pi-times"
          severity="danger"
          text
          aria-label="ลบเงื่อนไขนี้"
          @click="removeFilter(index)"
          :disabled="filters.length === 1"
        />
        <!-- พิมพ์ไม่ครบ/ผิดรูปแบบ: บอกวิธีกรอก และยังไม่เอาเงื่อนไขนี้ไปกรอง -->
        <small v-if="problemOf(filter)" class="filter-problem" role="status">
          <i class="pi pi-info-circle"></i> {{ problemOf(filter) }}
        </small>
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
import {
  normalizeText, isFilledValue, matchesFilter, filterProblem, joinDateTime, typedDate,
  makeRowSearcher, detectColumnType, OPERATORS, DEFAULT_OPERATOR
} from '@/utils/tableFilter'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  value: {
    type: Array,
    default: () => []
  },
  // คอลัมน์ของค้นหาขั้นสูง [{ field, header, type? }] — ไม่ส่งจะอ่านจาก <Column field=...> ในตาราง
  // type ('date' | 'datetime' | 'time' | 'duration' | 'number' | 'text') ไม่ส่งจะดูจากข้อมูลจริง
  // ที่ <Column> กำหนดเฉพาะค้นหาขั้นสูงได้: searchField (ฟิลด์ที่ใช้กรองแทน field), searchHeader (ชื่อในรายการ), searchType
  columns: {
    type: Array,
    default: () => []
  },
  // ช่องที่ค้นได้เพิ่มจากคอลัมน์ในตาราง [{ field, header, type?, after? }] — after = ต่อท้ายฟิลด์ไหนในรายการ
  extraColumns: {
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
  },
  // ชื่อฟิลด์ของรายการย่อยในแถว (แถวตรงเงื่อนไขถ้าแถวแม่หรือรายการย่อยตัวใดตรง)
  // เช่น โครงการลูกที่ใช้ SO เดียวกัน = children, งานหลายโครงการในวันเดียว = projects
  subRowsField: {
    type: String,
    default: 'children'
  }
})

const slots = useSlots()

const localSearch = ref(props.initialSearch)
watch(() => props.initialSearch, (v) => { localSearch.value = v })
const advancedMode = ref(false)
const filterLogic = ref('AND') // AND or OR
// type = ชนิดคอลัมน์ที่เลือกอยู่, kind = ชนิดช่องกรอกล่าสุด (date = ปฏิทิน, text = พิมพ์) — เปลี่ยนชนิดแล้วล้างค่าเดิม
// time/time2 = เวลาที่ใส่คู่กับวันที่ (เฉพาะคอลัมน์วันเวลา)
const newFilter = () => ({ column: '', operator: 'contains', value: null, value2: null, time: null, time2: null, type: 'text', kind: 'text' })
const filters = ref([newFilter()])

// Get actual data (support both data and value props)
const tableData = computed(() => {
  return props.data?.length ? props.data : (props.value || [])
})

// Get searchable columns from props or slots
const baseColumns = computed(() => {
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
        field: vnode.props.searchField || vnode.props.field,
        header: vnode.props.searchHeader || vnode.props.header || vnode.props.field,
        type: vnode.props.searchType
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

const searchableColumns = computed(() => {
  const list = [...baseColumns.value]
  props.extraColumns.forEach(col => {
    const at = list.findIndex(c => c.field === col.after)
    list.splice(at === -1 ? list.length : at + 1, 0, col)
  })
  return list
})

// Get nested value by path (e.g., "borrowRecord.name")
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

const subRowsOf = (row) => {
  const subs = row?.[props.subRowsField]
  return Array.isArray(subs) ? subs : []
}

// ===== ชนิดคอลัมน์: ดูจากค่าจริง (รวมรายการย่อย) เพื่อเลือกช่องกรอกและเงื่อนไขให้ถูก =====
const columnValues = (field, limit = 50) => {
  const out = []
  for (const row of tableData.value) {
    for (const item of [row, ...subRowsOf(row)]) {
      const v = getNestedValue(item, field)
      if (isFilledValue(v)) out.push(v)
    }
    if (out.length >= limit) break
  }
  return out
}

const columnTypes = computed(() => Object.fromEntries(
  searchableColumns.value.map(col => [col.field, col.type || detectColumnType(columnValues(col.field))])
))

// ตารางว่าง (เช่น สลับแท็บไปช่วงที่ไม่มีข้อมูล) ดูชนิดจากข้อมูลไม่ได้ — ใช้ชนิดตอนเลือกคอลัมน์ไว้ ปฏิทินจะได้ไม่กลายเป็นช่องข้อความ
const columnType = (filter) => (filter.column && (columnTypes.value[filter.column] || filter.type)) || 'text'
const operatorsFor = (filter) => OPERATORS[columnType(filter)] || OPERATORS.text
const isDateType = (type) => type === 'date' || type === 'datetime'
const inputKind = (filter) => (isDateType(columnType(filter)) && filter.operator !== 'contains' ? 'date' : 'text')

// ช่องค่า: 1 ชุด หรือ 2 ชุดเมื่อเลือก "ระหว่าง"
const ONE_SLOT = [{ value: 'value', time: 'time', dateLabel: 'เลือกวันที่' }]
const TWO_SLOTS = [
  { value: 'value', time: 'time', dateLabel: 'ตั้งแต่วันที่' },
  { value: 'value2', time: 'time2', dateLabel: 'ถึงวันที่' }
]
const valueSlots = (filter) => (filter.operator === 'between' ? TWO_SLOTS : ONE_SLOT)

// เปลี่ยนคอลัมน์/เงื่อนไข: เงื่อนไขที่คอลัมน์ใหม่ไม่มีให้กลับเป็นค่าเริ่มต้น และล้างค่าเมื่อช่องกรอกเปลี่ยนชนิด
// (เช่น วันที่จากปฏิทินไปโผล่ในช่องข้อความ)
const onFilterShapeChange = (filter) => {
  const type = columnType(filter)
  if (!operatorsFor(filter).some(op => op.value === filter.operator)) filter.operator = DEFAULT_OPERATOR[type] || 'contains'
  const kind = inputKind(filter)
  if (kind !== filter.kind) {
    filter.value = null
    filter.value2 = null
    filter.kind = kind
  }
  if (kind !== 'date' || type !== 'datetime') {
    filter.time = null
    filter.time2 = null
  }
  if (filter.operator !== 'between') {
    filter.value2 = null
    filter.time2 = null
  }
}

// พิมพ์วันที่ในช่องปฏิทินเอง: อ่านด้วยตัวอ่านวันที่ของเรา (รับ พ.ศ. / ปี 2 หลัก / ชื่อเดือนไทย) แล้วแปลงเป็น ค.ศ. ให้
const setTypedDate = (filter, key, text) => {
  const date = typedDate(text)
  if (!date) return
  const current = filter[key]
  if (current instanceof Date && current.toDateString() === date.toDateString()) return
  filter[key] = date
}
// ระหว่างพิมพ์: เฉพาะรูปแบบที่ปฏิทินอ่านได้ (ไม่งั้นปฏิทินจะเขียนทับข้อความที่ยังพิมพ์ไม่เสร็จ)
const onDateTyping = (filter, key, text) => {
  if (/^\s*\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})\s*$/.test(text || '')) setTypedDate(filter, key, text)
}
const onDateTyped = (filter, key, text) => setTypedDate(filter, key, text)

// เปลี่ยนไปคอลัมน์คนละชนิด (เช่น ข้อความ → วันที่) เริ่มที่เงื่อนไขหลักของชนิดนั้น
// (เดิมค้าง "มีคำว่า" ไว้ เลือกคอลัมน์วันที่แล้วไม่ขึ้นปฏิทิน)
const onColumnChange = (filter) => {
  const type = columnType(filter)
  if (type !== filter.type) {
    filter.type = type
    filter.operator = DEFAULT_OPERATOR[type] || 'contains'
  }
  onFilterShapeChange(filter)
}

const valuePlaceholder = (filter, slot) => {
  const type = columnType(filter)
  const between = filter.operator === 'between'
  const first = slot.value === 'value'
  if (type === 'time') return between ? (first ? 'ตั้งแต่ เช่น 08:00' : 'ถึง เช่น 12:00') : 'เวลา เช่น 08:30'
  if (type === 'duration') return between ? (first ? 'ตั้งแต่ เช่น 30 นาที' : 'ถึง เช่น 2 ชั่วโมง') : 'เช่น 2 ชั่วโมง, 30 นาที, 1:30'
  if (isDateType(type)) return 'เช่น พ.ย. 2569, 11/2026, 2569'
  if (between) return first ? 'ตั้งแต่' : 'ถึง'
  return 'ค่าที่ค้นหา'
}

// เงื่อนไขที่พร้อมใช้เทียบ: รวมวันที่กับเวลาเป็นคำค้นเดียว — ยังกรอกไม่ครบ/ผิดรูปแบบคืน null (ไม่เอาไปกรอง)
const typed = (f) => ({ ...f, type: columnType(f) })
const problemOf = (f) => (f.column ? filterProblem(typed(f)) : '')
const readyFilter = (f) => {
  if (!f.column || problemOf(f)) return null
  const ready = typed(f)
  if (inputKind(f) === 'date' && ready.type === 'datetime') {
    ready.value = joinDateTime(f.value, f.time)
    ready.value2 = joinDateTime(f.value2, f.time2)
  }
  return isFilledValue(ready.value) || (f.operator === 'between' && isFilledValue(ready.value2)) ? ready : null
}

// แถวที่มีรายการย่อย — ตรงเงื่อนไขถ้าแถวแม่หรือรายการย่อยตัวใดตรง
// รายการย่อยที่ไม่มีฟิลด์นั้นไม่นับ (ไม่งั้น "ไม่เท่ากับ" จะจริงเสมอ และกรองอะไรออกไม่ได้เลย)
const rowMatches = (item, filter) => {
  if (matchesFilter(getNestedValue(item, filter.column), filter)) return true
  return subRowsOf(item).some(sub => {
    const value = getNestedValue(sub, filter.column)
    return value !== undefined && matchesFilter(value, filter)
  })
}

// Filter data: ช่องค้นหาทั่วไปใช้เสมอ + ค้นหาขั้นสูงซ้อนอีกชั้นเมื่อเปิดอยู่
// การเทียบวันที่/เวลาอยู่ใน utils/tableFilter.js (แปลงเวลา UTC เป็นเวลาไทย, รับวันที่หลายรูปแบบ/ปี พ.ศ.)
const filteredData = computed(() => {
  let result = tableData.value

  if (!result || !Array.isArray(result)) return []

  if (normalizeText(localSearch.value)) {
    const matches = makeRowSearcher(localSearch.value)
    result = result.filter(matches)
  }

  if (advancedMode.value) {
    const validFilters = filters.value.map(readyFilter).filter(Boolean)
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
  filters.value.push(newFilter())
}

const removeFilter = (index) => {
  if (filters.value.length > 1) {
    filters.value.splice(index, 1)
  }
}

const resetFilters = () => {
  filters.value = [newFilter()]
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
  grid-template-columns: 2fr 1.5fr 3fr auto;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.filter-column,
.filter-operator,
.filter-value {
  width: 100%;
}

/* ช่องค่า: 1 ชุด หรือ 2 ชุดเมื่อเลือก "ระหว่าง" — จอแคบขึ้นบรรทัดใหม่แทนการบีบจนอ่านวันที่ไม่ออก */
.filter-values {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-width: 0;
}

.value-group {
  display: flex;
  flex: 1 1 11rem;
  gap: 0.5rem;
  min-width: 0;
}

.value-group .filter-value {
  flex: 1 1 8rem;
  width: auto;
  min-width: 0;
}

.filter-time {
  flex: 0 0 5rem;
  width: 5rem;
  min-width: 0;
}

.value-group :deep(.p-calendar .p-inputtext) {
  min-width: 0;
  width: 100%;
}

.filter-problem {
  grid-column: 1 / -1;
  color: #b91c1c;
  font-size: max(0.8rem, var(--min-fs));
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

  .value-group {
    flex-basis: 100%;
  }

  .filter-actions {
    flex-direction: column;
  }
}
</style>
