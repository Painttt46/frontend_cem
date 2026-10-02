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

// ดึงไฟล์เป็น blob แล้วสั่งบันทึกลงเครื่อง — throw เมื่อดึงไม่สำเร็จ (ให้หน้าเรียกแสดง toast เอง)
export async function downloadBlob(http, url, displayName) {
  const response = await http.get(url, { responseType: 'blob' })
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = displayName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}
