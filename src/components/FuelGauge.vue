<template>
  <div class="fuel-gauge-container">
    <div class="fuel-gauge">
      <div class="fuel-icon">
        <i class="pi pi-bolt"></i>
      </div>
      <div class="gauge-body">
        <div class="gauge-fill" :style="{ width: modelValue + '%', backgroundColor: fuelColor }"></div>
        <div class="gauge-marks">
          <span class="mark major" v-for="n in 9" :key="'major'+n" :style="{ left: ((n-1) * 12.5) + '%' }"></span>
          <span class="mark minor" v-for="n in 17" :key="'minor'+n" :style="{ left: ((n-1) * 6.25) + '%' }"></span>
        </div>
      </div>
    </div>
    <div class="gauge-labels">
      <span>E</span>
      <span>1/4</span>
      <span>1/2</span>
      <span>3/4</span>
      <span>F</span>
    </div>
    <input 
      type="range" 
      :value="modelValue" 
      @input="$emit('update:modelValue', Number($event.target.value))"
      min="0" 
      max="100" 
      step="5"
      class="fuel-slider"
      :disabled="disabled"
    />
    <div class="fuel-value">{{ modelValue }}%</div>
  </div>
</template>

<script>
export default {
  name: 'FuelGauge',
  props: {
    modelValue: { type: Number, default: 50 },
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  computed: {
    fuelColor() {
      if (this.modelValue <= 25) return '#ef4444'
      if (this.modelValue <= 50) return '#f59e0b'
      return '#22c55e'
    }
  }
}
</script>

<style scoped>
.fuel-gauge-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  border: 2px solid #334155;
}

.fuel-gauge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.gauge-body {
  flex: 1;
  height: 32px;
  background: #0f172a;
  border-radius: 6px;
  border: 2px solid #475569;
  position: relative;
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: 4px;
}

.gauge-marks {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.mark {
  position: absolute;
  bottom: 0;
  background: rgba(255,255,255,0.5);
}

.mark.major {
  width: 2px;
  height: 100%;
}

.mark.minor {
  width: 1px;
  height: 50%;
}

.gauge-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 40px 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
}

.fuel-icon {
  width: 32px;
  height: 32px;
  background: #334155;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fbbf24;
  font-size: 1rem;
}

.fuel-slider {
  width: 100%;
  margin-top: 0.5rem;
  -webkit-appearance: none;
  height: 8px;
  background: #334155;
  border-radius: 4px;
  outline: none;
}

.fuel-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
}

.fuel-slider:disabled {
  opacity: 0.6;
}

.fuel-slider:disabled::-webkit-slider-thumb {
  cursor: not-allowed;
}

.fuel-value {
  color: #fff;
  font-size: 1.25rem;
  font-weight: 700;
}
</style>
