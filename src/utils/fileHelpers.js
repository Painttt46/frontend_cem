// helper กลางของไฟล์แนบ — เดิมเขียนซ้ำในหน้า DailyWorkList, TaskList, LeaveApproval, LeaveHistory

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']

const FILE_ICONS = {
  pdf: 'pi pi-file-pdf',
  doc: 'pi pi-file-word',
  docx: 'pi pi-file-word',
  xls: 'pi pi-file-excel',
  xlsx: 'pi pi-file-excel',
  jpg: 'pi pi-image',
  jpeg: 'pi pi-image',
  png: 'pi pi-image',
  gif: 'pi pi-image'
}

const FILE_TYPES = {
  pdf: 'PDF Document',
  doc: 'Word Document',
  docx: 'Word Document',
  xls: 'Excel Spreadsheet',
  xlsx: 'Excel Spreadsheet',
  jpg: 'JPEG Image',
  jpeg: 'JPEG Image',
  png: 'PNG Image',
  gif: 'GIF Image'
}

const extensionOf = (fileName) => String(fileName || '').split('.').pop()?.toLowerCase()

export const isImageFile = (fileName) => IMAGE_EXTENSIONS.includes(extensionOf(fileName))

export const getFileIcon = (fileName) => FILE_ICONS[extensionOf(fileName)] || 'pi pi-file'

export const getFileType = (fileName) => FILE_TYPES[extensionOf(fileName)] || 'Unknown File'

// ชื่อไฟล์ที่เก็บบน server คือ "<timestamp>-<random>-<ชื่อเดิม>" — ตัดสองส่วนแรกออกเพื่อแสดงชื่อเดิม
export const getOriginalFileName = (storedName) => {
  const name = String(storedName)
  return name.split('-').slice(2).join('-') || name
}

// URL ดาวน์โหลดแบบแนบ token ใน query (ใช้กับ <img src> ที่ส่ง header ไม่ได้)
export const fileUrlWithToken = (fileName) => {
  const token = localStorage.getItem('soc_token')
  return `/api/files/download/${fileName}?token=${token}`
}

// เติม token ต่อท้าย URL (ใช้เป็นทางสำรองเมื่อ cookie ไม่ถูกส่งไป เช่นเข้าเว็บผ่าน http ที่ cookie แบบ secure ไม่ถูกเก็บ)
const withToken = (url) => {
  const token = localStorage.getItem('soc_token')
  if (!token) return url
  return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
}

// ดาวน์โหลดไฟล์: ให้ "เบราว์เซอร์" ดึงไฟล์จาก URL เองแล้วสตรีมลงเครื่อง (มีแถบความคืบหน้าของเบราว์เซอร์ ไม่ต้องเก็บไฟล์ทั้งก้อนในหน่วยความจำ)
// เดิมดึงเป็น blob ด้วย axios แล้วสร้าง <a href=blob:> สั่งคลิกหลังรอ network + revokeObjectURL ทันที ทำให้
//  - เบราว์เซอร์มองว่าเป็นการดาวน์โหลดอัตโนมัติ (ไม่ได้เกิดจากการกดของผู้ใช้เมื่อรอนานเกิน ~5 วินาที) → ยอมให้ครั้งแรกหลังโหลดหน้า ครั้งถัดไปถูกบล็อก/ขึ้น "Failed - Network error"
//  - บล็อบถูกยกเลิก URL ก่อนเบราว์เซอร์เริ่มอ่านไฟล์ → ล้มเหลวเป็นพัก ๆ โดยเฉพาะไฟล์ใหญ่/มือถือ
// ขั้นตอน: ตรวจด้วย HEAD ก่อน (เร็ว) เพื่อให้รู้ว่าไฟล์หาย/หมดสิทธิ์ก่อนสั่งโหลด → คลิกลิงก์ตรง ๆ (cookie httpOnly ของ same-origin ถูกส่งไปเอง)
const FILE_DOWNLOAD_PREFIX = '/api/files/download/'

export async function downloadFromUrl(rawUrl, displayName) {
  // ชื่อไฟล์ที่เก็บไว้เป็นชื่อเดิมของผู้ใช้ (มีภาษาไทย/ช่องว่าง/อาจมี # ? %) — เข้ารหัสเป็นส่วนของ path ไม่งั้น # ? ตัดชื่อไฟล์กลางคัน
  const url = rawUrl.startsWith(FILE_DOWNLOAD_PREFIX)
    ? FILE_DOWNLOAD_PREFIX + encodeURIComponent(rawUrl.slice(FILE_DOWNLOAD_PREFIX.length))
    : rawUrl
  let target = url
  if (url.startsWith('/api/files/')) {
    const probe = await fetch(url, { method: 'HEAD', credentials: 'same-origin' })
    if (probe.status === 404) throw Object.assign(new Error('file not found'), { response: { status: 404 } })
    if (probe.status === 401) target = withToken(url) // cookie ไม่มี/หมดอายุ แต่ token ใน localStorage อาจยังใช้ได้
    else if (!probe.ok) throw Object.assign(new Error('download failed'), { response: { status: probe.status } })
  } else if (window.location.protocol !== 'https:') {
    target = withToken(url)
  }
  const link = document.createElement('a')
  link.href = target
  link.download = displayName || ''
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  setTimeout(() => link.remove(), 1000)
}

// ชื่อเดิม (คงไว้ให้หน้าที่เรียกอยู่แล้ว): พารามิเตอร์ http ไม่ใช้แล้ว เพราะไม่ดึงผ่าน axios อีก
export function downloadBlob(_http, url, displayName) {
  return downloadFromUrl(url, displayName)
}
