<template>
  <!-- เลือก Workflow Step ของโครงการ (ใช้ทั้งตอนลงงานใหม่และแก้ไขรายการงาน) — step ที่เสร็จสิ้นแล้วเลือกเพิ่มไม่ได้ -->
  <MultiSelect :modelValue="modelValue" @update:modelValue="value => $emit('update:modelValue', value || [])"
    :options="steps" optionLabel="step_name" optionValue="id" :optionDisabled="isCompleted"
    class="w-full" :placeholder="placeholder"
    filter filterPlaceholder="ค้นหา step..." scrollHeight="300px" appendTo="body">
    <template #value="{ value }">
      <div v-if="value && value.length" class="chips-wrap">
        <div v-for="sid in value" :key="sid" class="step-chip" :style="{ borderColor: statusColor(stepById(sid)) }">
          <span class="chip-num" :style="{ background: statusColor(stepById(sid)) }">{{ stepNumber(sid) || '?' }}</span>
          <span class="chip-name">{{ stepById(sid)?.step_name || `ขั้นตอน #${sid} (ไม่อยู่ใน workflow แล้ว)` }}</span>
          <i class="pi pi-times chip-x" role="button" :aria-label="`เอา ${stepById(sid)?.step_name || 'ขั้นตอนนี้'} ออก`" @click.stop="remove(sid)"></i>
        </div>
      </div>
      <span v-else class="ph">{{ placeholder }}</span>
    </template>
    <template #option="{ option, index }">
      <div class="step-opt" :style="{ borderLeftColor: statusColor(option) }">
        <span class="step-num-badge" :style="{ background: statusColor(option) }">{{ index + 1 }}</span>
        <div class="step-opt-body">
          <div class="step-opt-top">
            <span class="step-opt-name">{{ option.step_name }}</span>
            <span class="step-status-tag" :style="{ color: statusColor(option), borderColor: statusColor(option) + '40', background: statusColor(option) + '15' }">
              <i class="pi pi-circle-fill" style="font-size:max(0.45rem, var(--min-fs))"></i> {{ statusLabel(option) }}
            </span>
          </div>
          <div v-if="option.start_date || option.end_date" class="step-opt-dates">
            <i class="pi pi-calendar"></i>
            <span v-if="option.start_date">{{ formatDate(option.start_date) }}</span>
            <span v-if="option.start_date && option.end_date"> – </span>
            <span v-if="option.end_date">{{ formatDate(option.end_date) }}</span>
          </div>
          <div v-if="option.description" class="step-opt-desc">{{ option.description }}</div>
        </div>
      </div>
    </template>
  </MultiSelect>
</template>

<script>
import { accessibleBg } from '@/utils/color'

const isOverdue = (step) => {
  if (!step?.end_date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today > new Date(step.end_date).setHours(0, 0, 0, 0)
}

export default {
  name: 'WorkflowStepSelect',
  props: {
    modelValue: { type: Array, default: () => [] },
    steps: { type: Array, default: () => [] },
    placeholder: { type: String, default: 'เลือก step (ถ้ามี)' }
  },
  emits: ['update:modelValue'],
  methods: {
    stepById(id) { return this.steps.find(s => s.id === id) },
    stepNumber(id) { return this.steps.findIndex(s => s.id === id) + 1 },
    isCompleted(step) { return step?.status === 'completed' },
    remove(id) { this.$emit('update:modelValue', (this.modelValue || []).filter(i => i !== id)) },
    formatDate(d) { return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) },
    statusColor(step) {
      if (!step) return accessibleBg('#9ca3af')
      if (step.status === 'completed') return accessibleBg('#10b981')
      if (isOverdue(step)) return accessibleBg('#ef4444')
      if (step.has_work_logged) return accessibleBg('#f59e0b')
      return accessibleBg('#9ca3af')
    },
    statusLabel(step) {
      if (!step) return 'รอดำเนินการ'
      if (step.status === 'completed') return 'เสร็จสิ้น'
      if (isOverdue(step)) return 'เกินกำหนด'
      if (step.has_work_logged) return 'กำลังดำเนินการ'
      return 'รอดำเนินการ'
    }
  }
}
</script>

<style scoped>
.ph { color: #55657a; }

/* ── Step chips ── */
.chips-wrap { display: flex; flex-direction: column; gap: 4px; width: 100%; }
.step-chip { display: flex; align-items: center; gap: 6px; border-left: 3px solid; border-radius: 4px; padding: 4px 8px; background: #f8fafc; }
.chip-num { width: 20px; height: 20px; border-radius: 50%; color: #fff; font-size: max(0.65rem, var(--min-fs)); font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.chip-name { flex: 1; font-size: max(0.82rem, var(--min-fs)); color: #334155; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chip-x { cursor: pointer; color: #55657a; font-size: max(0.7rem, var(--min-fs)); }
.chip-x:hover { color: #dc2626; }

/* ── Step option ── */
.step-opt { display: flex; align-items: flex-start; gap: 8px; border-left: 3px solid; padding: 6px 8px; border-radius: 0 6px 6px 0; background: #f8fafc; }
.step-num-badge { width: 24px; height: 24px; border-radius: 50%; color: #fff; font-size: max(0.7rem, var(--min-fs)); font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.step-opt-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.step-opt-top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.step-opt-name { flex: 1; font-weight: 600; font-size: max(0.875rem, var(--min-fs)); color: #1e293b; }
.step-status-tag { font-size: max(0.7rem, var(--min-fs)); font-weight: 600; white-space: nowrap; padding: 1px 7px; border-radius: 10px; border: 1px solid; display: flex; align-items: center; gap: 3px; }
.step-opt-dates { display: flex; align-items: center; gap: 4px; font-size: max(0.75rem, var(--min-fs)); color: #526074; }
.step-opt-dates i { font-size: max(0.7rem, var(--min-fs)); }
.step-opt-desc { font-size: max(0.75rem, var(--min-fs)); color: #55657a; line-height: 1.4; white-space: pre-wrap; word-break: break-word; }
</style>
