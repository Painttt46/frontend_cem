<template>
  <!-- เอกสารแนบ + ดูรูปเต็ม — ใช้ร่วมกันในหน้าประวัติการลาและหน้าอนุมัติการลา (เดิมคัดลอกซ้ำทั้งเทมเพลตและ CSS) -->
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="เอกสารแนบ"
    :style="{ width: '90vw', maxWidth: '900px' }" :draggable="false">
    <div class="attachments-content">
      <!-- โซนอัปโหลด: เฉพาะเมื่อผู้ใช้มีสิทธิ์เพิ่มเอกสาร (เจ้าของใบลาในช่วงเวลาที่อนุญาต) -->
      <div v-if="canEdit" class="upload-zone">
        <label class="upload-label">
          <i class="pi pi-upload"></i>
          <span>{{ uploading ? 'กำลังอัปโหลด...' : 'คลิกเพื่อเพิ่มเอกสาร' }}</span>
          <input type="file" multiple :disabled="uploading" @change="emit('upload', $event)" class="upload-input" />
        </label>
        <small class="upload-hint">สามารถเพิ่มได้ถึง {{ deadlineText }}</small>
      </div>

      <div v-if="files.length === 0" class="no-attachments">
        <i class="pi pi-file" style="font-size: 3rem; color: #55657a;"></i>
        <p>ไม่มีเอกสารแนบ</p>
      </div>
      <div v-else class="attachments-list">
        <div v-for="(file, index) in files" :key="index" class="attachment-item">
          <div class="file-info">
            <img v-if="isImageFile(file)" :src="fileUrlWithToken(file)" class="file-preview" @click="viewFullImage(file)" />
            <i v-else :class="getFileIcon(file)" class="file-icon"></i>
            <div class="file-details">
              <span class="file-name">{{ file }}</span>
              <small class="file-type">{{ getFileType(file) }}</small>
            </div>
          </div>
          <div class="file-actions">
            <Button icon="pi pi-download" size="small" severity="success" outlined @click="emit('download', file)"
              v-tooltip="'ดาวน์โหลด'" />
            <Button v-if="canEdit" icon="pi pi-trash" size="small" severity="danger" outlined
              @click="emit('delete', file)" v-tooltip="'ลบเอกสาร'" />
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <Button label="ปิด" icon="pi pi-times" @click="emit('update:visible', false)" />
    </template>
  </Dialog>

  <Dialog v-model:visible="fullImageDialog" modal header="รูปภาพ" :style="{ width: '90vw', maxWidth: '900px' }"
    :draggable="false">
    <img :src="fullImageUrl" class="full-image" />
  </Dialog>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref } from 'vue'
import { isImageFile, fileUrlWithToken, getFileIcon, getFileType } from '@/utils/fileHelpers'

defineProps({
  visible: { type: Boolean, default: false },
  files: { type: Array, default: () => [] },
  canEdit: { type: Boolean, default: false },
  uploading: { type: Boolean, default: false },
  deadlineText: { type: String, default: '' }
})
const emit = defineEmits(['update:visible', 'download', 'delete', 'upload'])

const fullImageDialog = ref(false)
const fullImageUrl = ref('')
const viewFullImage = (file) => {
  fullImageUrl.value = fileUrlWithToken(file)
  fullImageDialog.value = true
}
</script>

<style scoped>
.attachments-content {
  padding: 1rem;
}

.upload-zone {
  border: 2px dashed #0ea5e9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f0f9ff;
  text-align: center;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  color: #0369a1;
  font-weight: 500;
}

.upload-input {
  display: none;
}

.upload-hint {
  color: #525f70;
  font-size: max(0.8rem, var(--min-fs));
  margin-top: 0.25rem;
  display: block;
}

.no-attachments {
  text-align: center;
  padding: 2rem;
  color: #525f70;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-preview {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  cursor: pointer;
}

.file-preview:hover {
  opacity: 0.8;
}

.full-image {
  width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.file-icon {
  font-size: 2rem;
  color: #525f70;
}

.file-details {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 600;
  color: #495057;
}

.file-type {
  color: #525f70;
  font-size: max(0.85rem, var(--min-fs));
}

.file-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
