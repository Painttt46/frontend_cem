<template>
  <div class="daily-work-management">
    <Card class="header-card mb-4">
      <template #content>
        <div class="header-content">
          <Button icon="pi pi-arrow-left" @click="$router.go(-1)" text class="back-btn" />
          <div class="header-title">
            <i class="pi pi-calendar header-icon"></i>
            <h1>งานรายวัน</h1>
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <div class="empty-state">
          <i class="pi pi-calendar-plus empty-icon"></i>
          <h3>หน้านี้อยู่ระหว่างการพัฒนา</h3>
          <p>กำลังเตรียมข้อมูลงานรายวันทั้งหมด</p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
</script>

<style scoped>
.daily-work-management {
  padding: 1.5rem;
}

.header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header-card :deep(.p-card-content) {
  padding: 1rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  color: white !important;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  font-size: 1.5rem;
}

.header-title h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
}

.empty-icon {
  font-size: 4rem;
  color: #dee2e6;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #495057;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6c757d;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .daily-work-management {
    padding: 1rem;
  }

  .header-title h1 {
    font-size: 1.25rem;
  }

  .empty-icon {
    font-size: 3rem;
  }
}
</style>
