<template>
  <span>{{ display }}</span>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  value: { type: [Number, String], default: 0 },
  duration: { type: Number, default: 700 }
})

// แยกตัวเลขที่ animate ได้ออกจาก prefix/suffix (รองรับค่าแบบ "120 ชม." หรือ "5/8")
function parseNumeric(val) {
  const str = String(val)
  const match = str.match(/-?[\d,]+(\.\d+)?/)
  if (!match) return null
  const numStr = match[0]
  return {
    number: parseFloat(numStr.replace(/,/g, '')),
    decimals: numStr.includes('.') ? numStr.split('.')[1].length : 0,
    prefix: str.slice(0, match.index),
    suffix: str.slice(match.index + numStr.length)
  }
}

const display = ref(String(props.value))
let rafId = null
let fromNumber = 0

function animateTo(target) {
  const parsed = parseNumeric(target)
  if (!parsed) {
    display.value = String(target)
    return
  }
  if (rafId) cancelAnimationFrame(rafId)
  const { number, decimals, prefix, suffix } = parsed
  const startVal = fromNumber
  const diff = number - startVal
  const start = performance.now()

  const step = (now) => {
    const progress = Math.min((now - start) / props.duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
    const current = startVal + diff * eased
    display.value = `${prefix}${current.toFixed(decimals)}${suffix}`
    if (progress < 1) {
      rafId = requestAnimationFrame(step)
    } else {
      fromNumber = number
      rafId = null
    }
  }
  rafId = requestAnimationFrame(step)
}

onMounted(() => animateTo(props.value))
watch(() => props.value, (newVal) => animateTo(newVal))
onBeforeUnmount(() => { if (rafId) cancelAnimationFrame(rafId) })
</script>
