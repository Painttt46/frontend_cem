<template>
  <div class="easypass-wrapper">
    <div class="easypass-card" :class="{ disabled }">
      <div class="card-header">
        <div class="card-logo">
          <span class="logo-text">easy</span>
          <span class="logo-pass">PASS</span>
        </div>
        <div class="card-chip">
          <div class="chip-lines">
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
      </div>
      
      <div class="card-balance">
        <div class="balance-label">ยอดเงินคงเหลือ</div>
        <div class="balance-amount">
          <span class="currency">฿</span>
          <span class="amount">{{ formatMoney(modelValue) }}</span>
        </div>
      </div>
      
      <div class="card-bar">
        <div class="bar-fill" :style="{ width: percentage + '%', background: barGradient }"></div>
      </div>
      
      <div class="card-footer">
        <div class="card-number">**** **** **** 3706</div>
        <div class="card-type">EXPRESSWAY</div>
      </div>
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
    <div class="slider-labels">
      <span>฿0</span>
      <span>฿{{ formatMoney(maxAmount) }}</span>
    </div>
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
    barGradient() {
      if (this.percentage <= 25) return 'linear-gradient(90deg, #ef4444, #f87171)'
      if (this.percentage <= 50) return 'linear-gradient(90deg, #f59e0b, #fbbf24)'
      return 'linear-gradient(90deg, #22c55e, #4ade80)'
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
.easypass-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.easypass-card {
  background: linear-gradient(135deg, #1e3a5f 0%, #0c1929 50%, #1a365d 100%);
  border-radius: 16px;
  padding: 1.25rem;
  color: white;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset;
  position: relative;
  overflow: hidden;
  min-height: 180px;
}

.easypass-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
  pointer-events: none;
}

.easypass-card.disabled {
  opacity: 0.85;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-logo {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 300;
  color: #60a5fa;
  letter-spacing: -1px;
}

.logo-pass {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fbbf24;
  letter-spacing: 1px;
}

.card-chip {
  width: 45px;
  height: 35px;
  background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.chip-lines {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  width: 60%;
  height: 60%;
}

.chip-lines span {
  background: rgba(0,0,0,0.2);
  border-radius: 1px;
}

.card-balance {
  text-align: center;
  margin: 1.5rem 0;
}

.balance-label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 0.25rem;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.currency {
  font-size: 1.5rem;
  color: #60a5fa;
  font-weight: 300;
}

.amount {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(180deg, #fff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 10px rgba(255,255,255,0.2);
}

.card-bar {
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background 0.3s ease;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #64748b;
}

.card-number {
  letter-spacing: 2px;
  font-family: monospace;
}

.card-type {
  font-weight: 600;
  letter-spacing: 1px;
}

.card-slider {
  width: 100%;
  -webkit-appearance: none;
  height: 8px;
  background: linear-gradient(90deg, #1e3a5f, #0c1929);
  border-radius: 4px;
  outline: none;
  border: 1px solid #334155;
}

.card-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.card-slider:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-slider:disabled::-webkit-slider-thumb {
  cursor: not-allowed;
  background: #64748b;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748b;
}
</style>
