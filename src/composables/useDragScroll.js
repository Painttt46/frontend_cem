import { onMounted, onUnmounted, ref } from 'vue'

export function useDragScroll(selector = '.p-datatable-wrapper') {
  const isDragging = ref(false)
  const startX = ref(0)
  const startY = ref(0)
  const scrollLeft = ref(0)
  const scrollTop = ref(0)
  const hasMoved = ref(false)
  let cleanupFunctions = []

  const handleMouseDown = (e) => {
    const target = e.target.closest(selector)
    if (!target) return

    // ถ้าคลิกที่ input, button, link ให้ทำงานปกติ
    if (e.target.closest('input, button, a, .p-checkbox, .p-dropdown, .p-calendar')) {
      return
    }

    // ถ้าคลิกที่ text node หรือ element ที่มี text ให้ select ได้
    if (e.target.nodeType === Node.TEXT_NODE || 
        e.target.closest('td, th, span, div, p, label')) {
      return
    }

    isDragging.value = true
    startX.value = e.pageX - target.offsetLeft
    startY.value = e.pageY - target.offsetTop
    scrollLeft.value = target.scrollLeft
    scrollTop.value = target.scrollTop
  }

  const handleMouseMove = (e) => {
    if (!isDragging.value) return
    
    const target = e.target.closest(selector)
    if (!target) return

    const moveX = Math.abs(e.pageX - (startX.value + target.offsetLeft))
    const moveY = Math.abs(e.pageY - (startY.value + target.offsetTop))
    
    // ถ้าเลื่อนมากกว่า 5px ถึงจะถือว่า drag
    if (moveX > 5 || moveY > 5) {
      e.preventDefault()
      hasMoved.value = true
      target.style.cursor = 'grabbing'
      target.style.userSelect = 'none'
      
      const x = e.pageX - target.offsetLeft
      const y = e.pageY - target.offsetTop
      const walkX = (x - startX.value) * 1.5
      const walkY = (y - startY.value) * 1.5
      target.scrollLeft = scrollLeft.value - walkX
      target.scrollTop = scrollTop.value - walkY
    }
  }

  const handleMouseUp = (e) => {
    if (!isDragging.value) return

    const target = e.target.closest(selector)
    if (target) {
      target.style.cursor = 'grab'
      target.style.userSelect = 'text'
    }

    isDragging.value = false
    hasMoved.value = false
  }

  const handleMouseLeave = () => {
    if (isDragging.value) {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => {
        el.style.cursor = 'grab'
        el.style.userSelect = 'text'
      })
      isDragging.value = false
      hasMoved.value = false
    }
  }

  const setup = () => {
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseLeave)

    // เพิ่ม cursor style
    const style = document.createElement('style')
    style.id = 'drag-scroll-style'
    if (!document.getElementById('drag-scroll-style')) {
      style.textContent = `
        ${selector} {
          cursor: grab;
          user-select: text;
        }
        ${selector}:active {
          cursor: grabbing;
        }
      `
      document.head.appendChild(style)
    }

    cleanupFunctions.push(() => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseLeave)
    })
  }

  const cleanup = () => {
    cleanupFunctions.forEach(fn => fn())
    cleanupFunctions = []
  }

  // สำหรับ Composition API
  onMounted(() => {
    setup()
  })

  onUnmounted(() => {
    cleanup()
  })

  // สำหรับ Options API - เรียกใช้ทันที
  if (typeof onMounted === 'undefined') {
    setup()
  }

  return { isDragging, cleanup }
}
