import { ref, computed } from 'vue'

export function useTableFilter(records, columns) {
  const searchQuery = ref('')
  const columnVisibility = ref({})

  // Initialize column visibility
  const initColumns = (cols) => {
    cols.forEach(col => {
      columnVisibility.value[col.field] = col.visible !== false
    })
  }

  // Filter records based on search query
  const filteredRecords = computed(() => {
    if (!searchQuery.value) {
      return records.value || []
    }

    const query = searchQuery.value.toLowerCase()
    return (records.value || []).filter(record => {
      return Object.values(record).some(value => {
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(query)
      })
    })
  })

  // Toggle column visibility
  const toggleColumn = (field, value) => {
    columnVisibility.value[field] = value
  }

  // Check if column is visible
  const isColumnVisible = (field) => {
    return columnVisibility.value[field] !== false
  }

  // Get columns with visibility state
  const visibleColumns = computed(() => {
    return columns.value.map(col => ({
      ...col,
      visible: columnVisibility.value[col.field] !== false
    }))
  })

  return {
    searchQuery,
    filteredRecords,
    columnVisibility,
    visibleColumns,
    initColumns,
    toggleColumn,
    isColumnVisible
  }
}
