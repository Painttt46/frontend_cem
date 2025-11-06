export default {
  data() {
    return {
      searchQuery: '',
      availableColumns: [],
    }
  },
  computed: {
    filteredRecords() {
      if (!this.searchQuery) {
        return this.getRecords()
      }
      
      const query = this.searchQuery.toLowerCase()
      return this.getRecords().filter(record => {
        return Object.values(record).some(value => {
          if (value === null || value === undefined) return false
          return String(value).toLowerCase().includes(query)
        })
      })
    }
  },
  methods: {
    toggleColumnMenu(event) {
      this.$refs.columnMenu.toggle(event)
    },
    getColumn(field) {
      return this.availableColumns.find(col => col.field === field) || { visible: true }
    },
    initializeColumns(columns) {
      this.availableColumns = columns.map(col => ({
        ...col,
        visible: col.visible !== undefined ? col.visible : true
      }))
    },
    getRecords() {
      // Override this method in component
      return []
    }
  }
}
