<template>
  <div class="projects-container">
    <Toast />
    
    <Card class="header-card">
      <template #header>
        <div class="main-header">
          <h1><i class="pi pi-briefcase"></i> โครงการ</h1>
        </div>
      </template>
    </Card>

    <div class="main-content">
      <div class="tab-action-buttons">
        <Button @click="showTaskDialog = true" class="task-btn" icon="pi pi-plus-circle" raised>
          <span class="btn-text">เพิ่มงาน</span>
        </Button>
      </div>
      <TaskList ref="taskList" />
    </div>

    <Dialog v-model:visible="showTaskDialog" modal header="เพิ่มงาน" :style="{ width: '90vw', height: '80vh' }" :draggable="false">
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
.projects-container {
  padding: 1rem 1.5rem;
  max-width: 100%;
  margin: 0;
  background: #f8f9fa;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header-card {
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.header-card :deep(.p-card-body) {
  padding: 0;
}

.header-card :deep(.p-card-content) {
  padding: 0;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border-radius: 15px 15px 0 0;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  overflow: hidden;
  min-height: 80px;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.main-header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.main-header i {
  font-size: 1.5rem;
}

.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.tab-action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  margin-top: 0rem;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.task-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  border: none !important;
  color: white !important;
  padding: 1rem 2rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4) !important;
  transition: all 0.3s ease !important;
  position: relative !important;
  overflow: hidden !important;
  min-width: 180px !important;
  font-size: 1rem !important;
}

.task-btn:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6) !important;
}

.btn-text {
  margin-left: 0.5rem;
  font-size: 1rem;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .projects-container {
    padding: 1rem;
  }

  .main-header {
    padding: 1.5rem;
    min-height: 60px;
  }

  .main-header h1 {
    font-size: 1.5rem;
  }

  .main-header i {
    font-size: 1.25rem;
  }

  .main-content {
    padding: 1rem;
  }

  .tab-action-buttons {
    flex-direction: column;
    margin-bottom: 1rem;
  }

  .task-btn {
    width: 100%;
    min-width: auto !important;
    padding: 0.875rem 1.5rem !important;
  }

  .btn-text {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .projects-container {
    padding: 0.5rem;
  }

  .main-header {
    padding: 1rem;
    min-height: 50px;
  }

  .main-header h1 {
    font-size: 1.25rem;
    gap: 0.5rem;
  }

  .main-header i {
    font-size: 1rem;
  }

  .main-content {
    padding: 0.75rem;
  }

  .task-btn {
    padding: 0.75rem 1.25rem !important;
    font-size: 0.9rem !important;
  }

  .btn-text {
    font-size: 0.85rem;
  }
}

@media (max-width: 768px) and (orientation: landscape) {
  .main-header {
    padding: 1rem;
    min-height: 50px;
  }

  .main-header h1 {
    font-size: 1.25rem;
  }

  .main-content {
    padding: 1rem;
  }
}
</style>
