<template>
  <div class="projects-page">
    <Toast />
    
    <div class="page-header">
      <h1><i class="pi pi-briefcase"></i> โครงการ</h1>
    </div>

    <div class="page-content">
      <div class="action-bar">
        <Button @click="showTaskDialog = true" class="add-btn" icon="pi pi-plus-circle">
          <span>เพิ่มงาน</span>
        </Button>
      </div>
      <TaskList ref="taskList" />
    </div>

    <Dialog v-model:visible="showTaskDialog" modal header="เพิ่มงาน" 
      :style="{ width: '95vw', maxWidth: '1200px' }" :draggable="false">
      <AddTaskForm @task-added="handleTaskAdded" @close-form="showTaskDialog = false" />
    </Dialog>
  </div>
</template>

<script>
import AddTaskForm from '@/views/daily_work/AddTaskForm.vue'
import TaskList from '@/views/daily_work/TaskList.vue'

export default {
  name: 'ProjectsView',
  components: {
    AddTaskForm,
    TaskList
  },
  data() {
    return {
      showTaskDialog: false
    }
  },
  methods: {
    handleTaskAdded() {
      this.showTaskDialog = false
      if (this.$refs.taskList) {
        this.$refs.taskList.loadTasks()
      }
    }
  }
}
</script>

<style scoped>
.projects-page {
  width: 100%;
  min-height: 100%;
  background: #f8f9fa;
}

.page-header {
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-radius: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-header i {
  font-size: 1.25rem;
}

.page-content {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.action-bar {
  margin-bottom: 1rem;
}

.add-btn {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  border: none !important;
  color: white !important;
  padding: 0.75rem 1.5rem !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

@media (max-width: 768px) {
  .page-header {
    padding: 1rem;
    margin-bottom: 0.75rem;
  }
  
  .page-header h1 {
    font-size: 1.25rem;
  }
  
  .page-content {
    padding: 0.75rem;
  }
  
  .add-btn {
    width: 100%;
    justify-content: center !important;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 0.75rem;
    border-radius: 8px;
  }
  
  .page-header h1 {
    font-size: 1.1rem;
  }
  
  .page-content {
    padding: 0.5rem;
    border-radius: 8px;
  }
}
</style>
