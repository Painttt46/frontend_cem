// เติม attribute เพื่อการเข้าถึง (screen reader) ให้ DOM ทั้งแอปโดยไม่ต้องแก้ทีละหน้า
// - ปุ่มที่มีแต่ไอคอน (แก้ไข/ลบ/ปิด ฯลฯ) → aria-label จาก title หรือจากชนิดไอคอน
// - ไอคอน PrimeIcons ที่ตกแต่งล้วน → aria-hidden
// - รูปที่ไม่มี alt → alt ตามบริบท
// ทำเฉพาะ element ที่ยังไม่มี attribute นั้น จึงไม่ทับสิ่งที่หน้าตั้งไว้เอง

const ICON_LABELS = {
  'pi-pencil': 'แก้ไข', 'pi-user-edit': 'แก้ไข', 'pi-file-edit': 'แก้ไข',
  'pi-trash': 'ลบ', 'pi-times': 'ปิด', 'pi-times-circle': 'ปิด',
  'pi-download': 'ดาวน์โหลด', 'pi-upload': 'อัปโหลด', 'pi-eye': 'ดูรายละเอียด',
  'pi-plus': 'เพิ่ม', 'pi-plus-circle': 'เพิ่ม', 'pi-refresh': 'รีเฟรช', 'pi-sync': 'ซิงก์',
  'pi-search': 'ค้นหา', 'pi-filter': 'กรองข้อมูล', 'pi-check': 'ยืนยัน', 'pi-check-circle': 'ยืนยัน',
  'pi-copy': 'คัดลอก', 'pi-print': 'พิมพ์', 'pi-paperclip': 'ไฟล์แนบ', 'pi-file-excel': 'ส่งออก Excel',
  'pi-chevron-left': 'ก่อนหน้า', 'pi-chevron-right': 'ถัดไป', 'pi-angle-left': 'ก่อนหน้า', 'pi-angle-right': 'ถัดไป',
  'pi-angle-double-left': 'หน้าแรก', 'pi-angle-double-right': 'หน้าสุดท้าย',
  'pi-ellipsis-v': 'ตัวเลือกเพิ่มเติม', 'pi-ellipsis-h': 'ตัวเลือกเพิ่มเติม', 'pi-info-circle': 'ข้อมูลเพิ่มเติม',
  'pi-star': 'ติดดาว', 'pi-star-fill': 'ติดดาว', 'pi-history': 'ประวัติ', 'pi-cog': 'ตั้งค่า', 'pi-send': 'ส่ง',
  'pi-comments': 'เปิดแชตผู้ช่วย', 'pi-bars': 'เมนู', 'pi-arrow-left': 'ย้อนกลับ', 'pi-arrow-right': 'ถัดไป', 'pi-chevron-down': 'ขยาย', 'pi-chevron-up': 'ย่อ', 'pi-calendar': 'เลือกวันที่', 'pi-external-link': 'เปิดในแท็บใหม่', 'pi-link': 'ลิงก์'
};

// ปุ่มของ PrimeVue ที่ใช้ไอคอน SVG (ไม่มีคลาส pi-) — จับคู่จากชื่อคลาสของปุ่มเอง
const CLASS_LABELS = {
  'p-paginator-first': 'หน้าแรก', 'p-paginator-prev': 'หน้าก่อนหน้า',
  'p-paginator-next': 'หน้าถัดไป', 'p-paginator-last': 'หน้าสุดท้าย',
  'p-row-toggler': 'ขยาย/ย่อรายละเอียดแถว', 'p-dialog-header-close': 'ปิดหน้าต่าง', 'p-datepicker-prev': 'เดือนก่อนหน้า', 'p-datepicker-next': 'เดือนถัดไป',
  'p-password-toggle': 'แสดง/ซ่อนรหัสผ่าน', 'p-toast-icon-close': 'ปิดการแจ้งเตือน', 'p-datepicker-trigger': 'เลือกวันที่'
};

const labelFromIcon = (el) => {
  for (const cls of el.classList) {
    if (CLASS_LABELS[cls]) return CLASS_LABELS[cls];
  }
  for (const icon of el.querySelectorAll('[class*="pi-"]')) {
    for (const cls of icon.classList) {
      if (ICON_LABELS[cls]) return ICON_LABELS[cls];
    }
  }
  return null;
};

function enhance(root) {
  if (!root || root.nodeType !== 1) return;
  const nodes = [root, ...root.querySelectorAll('button, [role="button"], a.p-button, img, .pi')];
  for (const el of nodes) {
    const tag = el.tagName;
    if (tag === 'IMG') {
      if (!el.hasAttribute('alt')) el.setAttribute('alt', el.closest('button, a') ? '' : 'รูปภาพ');
    } else if (el.classList && el.classList.contains('pi')) {
      if (!el.hasAttribute('aria-hidden')) el.setAttribute('aria-hidden', 'true');
    } else if (tag === 'BUTTON' || el.getAttribute('role') === 'button' || el.classList.contains('p-button')) {
      if (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) continue;
      if (el.textContent.trim()) continue; // มีข้อความอยู่แล้ว screen reader อ่านได้เอง
      const label = el.getAttribute('title') || labelFromIcon(el);
      if (label) el.setAttribute('aria-label', label);
    }
  }
}

export function startA11yEnhancer() {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;
  enhance(document.body);
  let queue = new Set();
  let scheduled = false;
  const flush = () => {
    scheduled = false;
    const batch = queue; queue = new Set();
    batch.forEach(enhance);
  };
  new MutationObserver((mutations) => {
    for (const m of mutations) m.addedNodes.forEach(n => { if (n.nodeType === 1) queue.add(n); });
    // ใช้ setTimeout แทน requestAnimationFrame: rAF ไม่ทำงานเมื่อแท็บอยู่เบื้องหลัง ทำให้ DOM ใหม่ไม่ถูกเติม attribute
    if (queue.size && !scheduled) { scheduled = true; setTimeout(flush, 60); }
  }).observe(document.body, { childList: true, subtree: true });
}
