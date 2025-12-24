<template>
  <div class="enhanced-datatable">
    <!-- Search and Column Controls -->
    <div class="table-controls mb-3">
      <div class="search-box">
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText v-model="localSearch" placeholder="ค้นหาทั่วไป..." class="w-full" />
        </IconField>
      </div>
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
    <DataTable 
      :value="filteredData" 
      v-bind="$attrs"
    >
      <slot />
    </DataTable>
  </div>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref, computed, useSlots } from 'vue'

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
  }
})

const slots = useSlots()

const localSearch = ref('')
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
const normalizeText = (text) => {
  if (!text) return ''
  return String(text).toLowerCase().trim()
}

// Deep search in nested objects and arrays
const deepSearch = (obj, query) => {
  if (obj === null || obj === undefined) return false
  
  // String or number - direct match
  if (typeof obj === 'string' || typeof obj === 'number') {
    return normalizeText(obj).includes(query)
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
  
  // Extract from slot children
  const defaultSlot = slots.default?.()
  if (defaultSlot) {
    return defaultSlot
      .filter(vnode => vnode.props?.field)
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
  const fieldValue = normalizeText(getNestedValue(item, filter.column))
  const searchValue = normalizeText(filter.value)

  switch (filter.operator) {
    case 'contains':
      return fieldValue.includes(searchValue)
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

// Filter data based on search mode
const filteredData = computed(() => {
  let result = tableData.value
  
  if (!result || !Array.isArray(result)) return []

  // Advanced mode: column-specific filters with AND/OR
  if (advancedMode.value) {
    const validFilters = filters.value.filter(f => f.column && f.value)
    
    if (validFilters.length > 0) {
      result = result.filter(item => {
        if (filterLogic.value === 'OR') {
          return validFilters.some(filter => applyFilter(item, filter))
        }
        return validFilters.every(filter => applyFilter(item, filter))
      })
    }
  } 
  // Simple mode: global search with deep search
  else if (localSearch.value) {
    const query = normalizeText(localSearch.value)
    result = result.filter(record => deepSearch(record, query))
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
