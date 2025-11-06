<template>
  <div class="table-controls">
    <div class="search-box">
      <IconField iconPosition="left">
        <InputIcon class="pi pi-search" />
        <InputText 
          :modelValue="searchQuery" 
          @update:modelValue="$emit('update:searchQuery', $event)"
          placeholder="ค้นหา..." 
          class="w-full" 
        />
      </IconField>
    </div>
    <div class="column-toggle">
      <Button icon="pi pi-cog" label="เลือกคอลัมน์" @click="toggleMenu" text severity="secondary" />
      <OverlayPanel ref="columnMenu">
        <div class="column-options">
          <div v-for="col in columns" :key="col.field" class="column-option">
            <Checkbox 
              :modelValue="col.visible" 
              @update:modelValue="toggleColumn(col.field, $event)"
              :inputId="col.field" 
              :binary="true" 
            />
            <label :for="col.field" class="ml-2">{{ col.header }}</label>
          </div>
        </div>
      </OverlayPanel>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref } from 'vue'

defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  columns: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:searchQuery', 'toggle-column'])

const columnMenu = ref(null)

const toggleMenu = (event) => {
  columnMenu.value.toggle(event)
}

const toggleColumn = (field, value) => {
  emit('toggle-column', field, value)
}
</script>

<style scoped>
.table-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
}

.column-toggle {
  display: flex;
  align-items: center;
}

.column-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem;
  min-width: 200px;
}

.column-option {
  display: flex;
  align-items: center;
}

.column-option label {
  cursor: pointer;
  user-select: none;
}

@media (max-width: 768px) {
  .table-controls {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }
}
</style>
