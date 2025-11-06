<template>
  <div class="enhanced-datatable">
    <!-- Search and Column Controls -->
    <div class="table-controls mb-3">
      <div class="search-box">
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText v-model="localSearch" placeholder="ค้นหา..." class="w-full" />
        </IconField>
      </div>
      <div class="column-toggle">
        <Button icon="pi pi-cog" label="เลือกคอลัมน์" @click="toggleMenu" text severity="secondary" />
        <OverlayPanel ref="columnMenu">
          <div class="column-options">
            <div v-for="col in columns" :key="col.field" class="column-option">
              <Checkbox 
                v-model="col.visible" 
                :inputId="col.field" 
                :binary="true" 
              />
              <label :for="col.field" class="ml-2">{{ col.header }}</label>
            </div>
          </div>
        </OverlayPanel>
      </div>
    </div>

    <!-- Pass through DataTable with filtered data -->
    <DataTable 
      :value="filteredData" 
      v-bind="$attrs"
    >
      <slot :columns="visibleColumns" :isVisible="isColumnVisible" />
    </DataTable>
  </div>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref, computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  columns: {
    type: Array,
    required: true
  }
})

const localSearch = ref('')
const columnMenu = ref(null)

// Filter data based on search
const filteredData = computed(() => {
  if (!localSearch.value) return props.data

  const query = localSearch.value.toLowerCase()
  return props.data.filter(record => {
    return Object.values(record).some(value => {
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(query)
    })
  })
})

// Get visible columns
const visibleColumns = computed(() => {
  return props.columns.filter(col => col.visible !== false)
})

// Check if column is visible
const isColumnVisible = (field) => {
  const col = props.columns.find(c => c.field === field)
  return col ? col.visible !== false : true
}

const toggleMenu = (event) => {
  columnMenu.value.toggle(event)
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

@media (max-width: 768px) {
  .table-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }
}
</style>
