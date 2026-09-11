// เพิ่ม ready_to_ship ที่เหลือทุกจุด (CRLF-safe)
const fs = require('fs');

function apply(f, rules) {
  let s = fs.readFileSync(f, 'utf8');
  for (const [re, rep] of rules) {
    if (re.test(s)) { s = s.replace(re, rep); console.log('OK: ' + rep.slice(0, 70)); }
    else console.log('SKIP: ' + rep.slice(0, 70));
  }
  fs.writeFileSync(f, s);
}

// ===== 1) Procurement.vue =====
apply('D:/frontend_cem/src/views/procurement/Procurement.vue', [
  [/(\{ label: 'รอใบเสนอราคา', value: 'pending' \},\r?\n)/,
   '$1        { label: \'ต่อรอง\', value: \'negotiating\' },\r\n'],
  [/(\{ label: 'รอชำระเงิน', value: 'awaiting_payment' \},\r?\n)/,
   '$1        { label: \'ของพร้อมส่ง\', value: \'ready_to_ship\' },\r\n'],
  [/const flow = \['pending', 'negotiating', 'approved', 'ordered', 'awaiting_payment', 'waiting', 'received', 'completed'\]/g,
   "const flow = ['pending', 'negotiating', 'approved', 'ordered', 'awaiting_payment', 'waiting', 'ready_to_ship', 'received', 'completed']"],
  [/v-if="!getVendorNote\(group, cluster\) && !item\.notes"/,
   'v-if="!getVendorNote(group, cluster)"']
]);

// ===== 2) Backend procurement.js (email labels) =====
apply('D:/backend_cem/routes/procurement.js', [
  [/(  ordered: 'สั่งซื้อแล้ว',\r?\n)(  waiting: 'รอของ',)/,
   '$1  ready_to_ship: \'ของพร้อมส่ง\',\r\n$2'],
]);

// ===== 3) ProjectProgress.vue (labels + progress + chip CSS) =====
apply('D:/frontend_cem/src/views/ProjectProgress.vue', [
  [/(        ordered: 'สั่งซื้อแล้ว',\r?\n)/,
   '$1        ready_to_ship: \'ของพร้อมส่ง\',\r\n'],
  [/const map = \{ pending: 0, negotiating: 10, approved: 20, ordered: 35, awaiting_payment: 50, waiting: 60, received: 80, completed: 100 \}/,
   'const map = { pending: 0, negotiating: 10, approved: 20, ordered: 35, awaiting_payment: 50, waiting: 60, ready_to_ship: 75, received: 85, completed: 100 }'],
  [/(\.pi-status-chip\.chip-completed \{ background: #dcfce7; color: #16a34a; \}\r?\n)/,
   '$1.pi-status-chip.chip-ready_to_ship { background: #cffafe; color: #0e7490; }\r\n']
]);
console.log('ALL DONE');
