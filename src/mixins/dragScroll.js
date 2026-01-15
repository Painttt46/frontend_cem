export default {
  mounted() {
    this.setupDragScroll()
  },
  methods: {
    setupDragScroll() {
      let isDragging = false
      let startX = 0, startY = 0, scrollLeft = 0, scrollTop = 0

      const handleMouseDown = (e) => {
        const target = e.target.closest('.p-datatable-wrapper')
        if (!target || e.target.closest('input, button, a, .p-checkbox, .p-dropdown, .p-calendar, .p-button')) return
        
        // ถ้าคลิกที่ Badge หรือ icon ให้ drag ได้
        if (e.target.closest('.p-badge, i')) {
          isDragging = true
          startX = e.pageX - target.offsetLeft
          startY = e.pageY - target.offsetTop
          scrollLeft = target.scrollLeft
          scrollTop = target.scrollTop
          return
        }
        
        // ถ้าคลิกที่ span หรือ div ที่มี text โดยตรง ให้ select ได้
        if (e.target.tagName === 'SPAN' || e.target.tagName === 'DIV') {
          const hasDirectText = Array.from(e.target.childNodes).some(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
          )
          if (hasDirectText) return
        }
        
        isDragging = true
        startX = e.pageX - target.offsetLeft
        startY = e.pageY - target.offsetTop
        scrollLeft = target.scrollLeft
        scrollTop = target.scrollTop
      }

      const handleMouseMove = (e) => {
        if (!isDragging) return
        const target = e.target.closest('.p-datatable-wrapper')
        if (!target) return
        
        const moveX = Math.abs(e.pageX - (startX + target.offsetLeft))
        const moveY = Math.abs(e.pageY - (startY + target.offsetTop))
        
        if (moveX > 5 || moveY > 5) {
          e.preventDefault()
          target.style.cursor = 'grabbing'
          target.style.userSelect = 'none'
          
          const x = e.pageX - target.offsetLeft
          const y = e.pageY - target.offsetTop
          target.scrollLeft = scrollLeft - (x - startX) * 1.5
          target.scrollTop = scrollTop - (y - startY) * 1.5
        }
      }

      const handleMouseUp = () => {
        if (!isDragging) return
        const target = document.querySelector('.p-datatable-wrapper')
        if (target) {
          target.style.cursor = 'grab'
          target.style.userSelect = 'text'
        }
        isDragging = false
      }

      document.addEventListener('mousedown', handleMouseDown)
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      if (!document.getElementById('drag-scroll-style-mixin')) {
        const style = document.createElement('style')
        style.id = 'drag-scroll-style-mixin'
        style.textContent = `
          .p-datatable-wrapper * {
            cursor: default !important;
          }
        `
        document.head.appendChild(style)
      }
    }
  }
}
