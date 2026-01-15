<template>
  <div class="easypass-container">
    <div class="easypass-card">
      <div class="card-icon">
        <i class="pi pi-credit-card"></i>
      </div>
      <div class="card-body">
        <div class="card-fill" :style="{ width: percentage + '%', backgroundColor: cardColor }"></div>
        <div class="card-marks">
          <span class="mark major" v-for="n in 5" :key="n" :style="{ left: ((n-1) * 25) + '%' }"></span>
        </div>
      </div>
    </div>
    <div class="card-labels">
      <span>0</span>
      <span>{{ formatMoney(maxAmount / 4) }}</span>
      <span>{{ formatMoney(maxAmount / 2) }}</span>
      <span>{{ formatMoney(maxAmount * 3 / 4) }}</span>
      <span>{{ formatMoney(maxAmount) }}</span>
    </div>
    <input 
      type="range" 
      :value="modelValue" 
      @input="$emit('update:modelValue', Number($event.target.value))"
      min="0" 
      :max="maxAmount" 
      :step="step"
      class="card-slider"
      :disabled="disabled"
    />
    <div class="card-value">฿{{ formatMoney(modelValue) }}</div>
  </div>
</template>

<script>
export default {
  name: 'EasyPassCard',
  props: {
    modelValue: { type: Number, default: 500 },
    maxAmount: { type: Number, default: 2000 },
    step: { type: Number, default: 50 },
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  computed: {
    percentage() {
      return (this.modelValue / this.maxAmount) * 100
    },
    cardColor() {
      if (this.percentage <= 25) return '#ef4444'
      if (this.percentage <= 50) return '#f59e0b'
      return '#22c55e'
    }
  },
  methods: {
    formatMoney(val) {
      return val.toLocaleString()
    }
  }
}
</script>

<style scoped>
.easypass-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%);
  border-radius: 12px;
  border: 2px solid #2563eb;
}

.easypass-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.card-body {
  flex: 1;
  height: 32px;
  background: #0f172a;
  border-radius: 6px;
  border: 2px solid #3b82f6;
  position: relative;
  overflow: hidden;
}

.card-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: 4px;
}

.card-marks {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.card-marks .mark {
  position: absolute;
  bottom: 0;
  width: 2px;
  height: 100%;
  background: rgba(255,255,255,0.3);
}

.card-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 40px 0 0;
  font-size: 0.7rem;
  color: #93c5fd;
  font-weight: 600;
}

.card-icon {
  width: 32px;
  height: 32px;
  background: #1e40af;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #60a5fa;
  font-size: 1rem;
}

.card-slider {
  width: 100%;
  margin-top: 0.5rem;
  -webkit-appearance: none;
  height: 8px;
  background: #1e3a5f;
  border-radius: 4px;
  outline: none;
}

.card-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
}

.card-slider:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-slider:disabled::-webkit-slider-thumb {
  cursor: not-allowed;
}

.card-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #60a5fa;
  text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
}
</style>
