<template>
  <div class="projects-container">
    <Toast />
    
    <Card class="header-card">
      <template #header>
        <div class="main-header">
          <h1><i class="pi pi-briefcase"></i> โครงการ</h1>
        </div>
      </template>
    </Card>

    <div class="main-content">
      <div class="tab-action-buttons">
        <Button @click="showTaskDialog = true" class="task-btn" icon="pi pi-plus-circle" raised>
          <span class="btn-text">เพิ่มโครงการ</span>
        </Button>
        <Button @click="syncERP" :loading="syncing" icon="pi pi-refresh" label="Sync ERP" class="sync-btn" raised />
        <Button @click="showHistory = true" icon="pi pi-history" label="ประวัติ Sync" class="history-btn" raised />
      </div>
      <TaskList ref="taskList" />
    </div>

    <!-- History Dialog -->
    <Dialog v-model:visible="showHistory" header="📋 ประวัติ Sync ERP" :style="{width:'800px'}" modal :draggable="false">
      <div v-if="syncHistory.length === 0" style="text-align:center;color:#94a3b8;padding:2rem">
        <i class="pi pi-inbox" style="font-size:3rem;margin-bottom:0.5rem"></i>
        <div>ยังไม่มีประวัติการ Sync</div>
      </div>
      <div v-else style="max-height:70vh;overflow-y:auto">
        <div v-for="(h, i) in syncHistory" :key="i"
          style="border:2px solid #e2e8f0;border-radius:12px;padding:1.25rem;margin-bottom:1rem;background:#ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
          
          <!-- Header -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:2px solid #f1f5f9">
            <div>
              <div style="font-weight:700;color:#1e293b;font-size:1rem;display:flex;align-items:center;gap:0.5rem">
                <i class="pi pi-calendar" style="color:#3b82f6"></i>
                {{ h.syncedAt }}
              </div>
              <div style="font-size:0.8rem;color:#64748b;margin-top:2px">
                Sync ครั้งที่ {{ syncHistory.length - i }}
              </div>
            </div>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
              <span style="background:#dcfce7;color:#16a34a;border:1px solid #86efac;border-radius:20px;padding:4px 12px;font-size:0.85rem;font-weight:700">
                <i class="pi pi-plus-circle" style="font-size:0.75rem"></i> {{ h.created }} ใหม่
              </span>
              <span style="background:#dbeafe;color:#2563eb;border:1px solid #93c5fd;border-radius:20px;padding:4px 12px;font-size:0.85rem;font-weight:700">
                <i class="pi pi-refresh" style="font-size:0.75rem"></i> {{ h.updated }} อัปเดต
              </span>
              <span style="background:#fef3c7;color:#ca8a04;border:1px solid #fde047;border-radius:20px;padding:4px 12px;font-size:0.85rem;font-weight:700">
                <i class="pi pi-database" style="font-size:0.75rem"></i> {{ h.total }} ทั้งหมด
              </span>
            </div>
          </div>
          
          <!-- Summary Stats -->
          <div style="background:#f8fafc;border-radius:8px;padding:0.75rem;margin-bottom:1rem">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;text-align:center">
              <div>
                <div style="font-size:0.75rem;color:#64748b;margin-bottom:2px">โครงการก่อน Sync</div>
                <div style="font-size:1.3rem;font-weight:700;color:#475569">{{ h.total - h.created }}</div>
              </div>
              <div>
                <div style="font-size:0.75rem;color:#64748b;margin-bottom:2px">เพิ่มใหม่</div>
                <div style="font-size:1.3rem;font-weight:700;color:#16a34a">+{{ h.created }}</div>
              </div>
              <div>
                <div style="font-size:0.75rem;color:#64748b;margin-bottom:2px">โครงการหลัง Sync</div>
                <div style="font-size:1.3rem;font-weight:700;color:#3b82f6">{{ h.total }}</div>
              </div>
            </div>
          </div>
          <!-- Created Projects -->
          <div v-if="h.createdList && h.createdList.length" style="margin-bottom:1rem">
            <div style="background:#dcfce7;border-left:4px solid #16a34a;padding:0.5rem 0.75rem;border-radius:6px;margin-bottom:0.5rem">
              <div style="font-size:0.85rem;color:#15803d;font-weight:700;display:flex;align-items:center;gap:0.5rem">
                <i class="pi pi-plus-circle"></i> 
                เพิ่มโครงการใหม่ {{ h.createdList.length }} โครงการ
                <span style="font-size:0.75rem;font-weight:400">(จาก {{ h.total - h.created }} → {{ h.total }} โครงการ)</span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto;padding:4px">
              <div v-for="item in h.createdList" :key="item.so || item"
                style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:8px 10px">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:4px">
                  <span style="background:#16a34a;color:white;border-radius:4px;padding:2px 6px;font-size:0.7rem;font-weight:700">NEW</span>
                  <span style="font-weight:700;color:#15803d;font-size:0.85rem">
                    <b>{{ item.so || item }}</b> — {{ item.name && item.name !== item.so ? item.name : '' }}
                  </span>
                </div>
                <div v-if="item.sales_person || item.customer" style="display:flex;gap:1rem;font-size:0.75rem;color:#166534;margin-top:4px;padding-left:8px">
                  <span v-if="item.sales_person"><i class="pi pi-user" style="font-size:0.65rem"></i> {{ item.sales_person }}</span>
                  <span v-if="item.customer"><i class="pi pi-building" style="font-size:0.65rem"></i> {{ item.customer }}</span>
                </div>
                <div v-if="item.files?.length" style="margin-top:6px;padding-left:8px">
                  <div style="color:#166534;font-weight:600;margin-bottom:3px;font-size:0.75rem">
                    <i class="pi pi-paperclip" style="font-size:0.65rem"></i> ไฟล์แนบ ({{ item.files.length }}):
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:3px;padding-left:12px">
                    <span v-for="f in item.files" :key="f" style="background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:4px;padding:2px 6px;font-size:0.7rem;font-weight:600">
                      📎 {{ f }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Updated Projects -->
          <div v-if="h.updatedList && h.updatedList.length">
            <div style="background:#dbeafe;border-left:4px solid #2563eb;padding:0.5rem 0.75rem;border-radius:6px;margin-bottom:0.5rem">
              <div style="font-size:0.85rem;color:#1d4ed8;font-weight:700;display:flex;align-items:center;gap:0.5rem">
                <i class="pi pi-refresh"></i> 
                อัปเดตโครงการ {{ h.updatedList.length }} โครงการ
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;padding:4px">
              <div v-for="item in h.updatedList" :key="item.so || item"
                style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px 12px">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:6px">
                  <span style="background:#2563eb;color:white;border-radius:4px;padding:2px 6px;font-size:0.7rem;font-weight:700">UPDATE</span>
                  <span style="font-weight:700;color:#1d4ed8;font-size:0.85rem">
                    <b>{{ item.so || item }}</b> — {{ item.name }}
                  </span>
                </div>
                <div v-if="item.changes" style="margin-top:6px;display:flex;flex-direction:column;gap:5px;padding-left:8px">
                  <template v-for="(label, key) in {task_name:'ชื่อโครงการ',sale_owner:'Sales Owner',customer_info:'ลูกค้า',status:'สถานะ'}" :key="key">
                    <div v-if="item.changes[key]" style="display:flex;align-items:center;gap:8px;font-size:0.78rem">
                      <span style="color:#475569;font-weight:600;min-width:80px">{{ label }}:</span>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;border-radius:4px;padding:2px 8px;text-decoration:line-through;font-size:0.75rem">
                          {{ item.changes[key].old || '(ไม่มี)' }}
                        </span>
                        <i class="pi pi-arrow-right" style="color:#94a3b8;font-size:0.7rem"></i>
                        <span style="background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:4px;padding:2px 8px;font-weight:700;font-size:0.75rem">
                          {{ item.changes[key].new || '(ไม่มี)' }}
                        </span>
                      </div>
                    </div>
                  </template>
                  <div v-if="item.changes.files" style="font-size:0.78rem;margin-top:4px">
                    <div v-if="item.changes.files.added?.length" style="margin-bottom:4px">
                      <div style="color:#475569;font-weight:600;margin-bottom:3px">
                        <i class="pi pi-plus" style="font-size:0.65rem;color:#16a34a"></i> ไฟล์ที่เพิ่ม ({{ item.changes.files.added.length }}):
                      </div>
                      <div style="display:flex;flex-wrap:wrap;gap:3px;padding-left:12px">
                        <span v-for="f in item.changes.files.added" :key="f" style="background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:4px;padding:2px 8px;font-weight:600;font-size:0.72rem">
                          + {{ f }}
                        </span>
                      </div>
                    </div>
                    <div v-if="item.changes.files.removed?.length">
                      <div style="color:#475569;font-weight:600;margin-bottom:3px">
                        <i class="pi pi-minus" style="font-size:0.65rem;color:#dc2626"></i> ไฟล์ที่ลบ ({{ item.changes.files.removed.length }}):
                      </div>
                      <div style="display:flex;flex-wrap:wrap;gap:3px;padding-left:12px">
                        <span v-for="f in item.changes.files.removed" :key="f" style="background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;border-radius:4px;padding:2px 8px;text-decoration:line-through;font-size:0.72rem">
                          - {{ f }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Preview Dialog -->
    <Dialog v-model:visible="showPreview" header="🔍 Preview การเปลี่ยนแปลง" :style="{width:'700px'}" modal :draggable="false">
      <div v-if="previewData" style="padding:0.5rem 0">
        <!-- Summary -->
        <div style="background:#fffbeb;border:2px solid #fbbf24;border-radius:10px;padding:1rem;margin-bottom:1.5rem">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
            <i class="pi pi-exclamation-triangle" style="color:#f59e0b;font-size:1.5rem"></i>
            <div>
              <div style="font-weight:700;color:#92400e;font-size:1.1rem">ยืนยันการ Sync ERP</div>
              <div style="color:#78350f;font-size:0.9rem;margin-top:2px">กรุณาตรวจสอบการเปลี่ยนแปลงก่อนยืนยัน</div>
            </div>
          </div>
          <div style="display:flex;gap:1rem;margin-top:1rem">
            <div style="flex:1;text-align:center">
              <div style="font-size:1.6rem;font-weight:700;color:#16a34a">{{ previewData.created }}</div>
              <div style="font-size:0.85rem;color:#15803d">โครงการใหม่</div>
            </div>
            <div style="flex:1;text-align:center">
              <div style="font-size:1.6rem;font-weight:700;color:#2563eb">{{ previewData.updated }}</div>
              <div style="font-size:0.85rem;color:#1d4ed8">อัปเดต</div>
            </div>
            <div style="flex:1;text-align:center">
              <div style="font-size:1.6rem;font-weight:700;color:#ca8a04">{{ previewData.total }}</div>
              <div style="font-size:0.85rem;color:#a16207">ทั้งหมด</div>
            </div>
          </div>
        </div>
        
        <!-- Created List -->
        <div v-if="previewData.createdList.length" style="margin-bottom:1rem">
          <div style="font-weight:600;color:#16a34a;margin-bottom:0.5rem;display:flex;align-items:center;gap:6px">
            <i class="pi pi-plus-circle"></i> โครงการใหม่ ({{ previewData.createdList.length }})
          </div>
          <div style="max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:4px">
            <div v-for="item in previewData.createdList" :key="item.so"
              style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:8px 12px;font-size:0.85rem">
              <div style="font-weight:600;color:#15803d;margin-bottom:4px">
                <i class="pi pi-briefcase" style="font-size:0.75rem;margin-right:4px"></i>
                <b>{{ item.so }}</b> — {{ item.name }}
              </div>
              <div v-if="item.sales_person || item.customer" style="display:flex;gap:1rem;font-size:0.8rem;color:#166534;margin-top:4px">
                <span v-if="item.sales_person"><i class="pi pi-user" style="font-size:0.7rem"></i> {{ item.sales_person }}</span>
                <span v-if="item.customer"><i class="pi pi-building" style="font-size:0.7rem"></i> {{ item.customer }}</span>
              </div>
              <div v-if="item.files?.length" style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">
                <span v-for="f in item.files" :key="f" style="background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:4px;padding:1px 6px;font-size:0.75rem">📎 {{ f }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Updated List -->
        <div v-if="previewData.updatedList.length">
          <div style="font-weight:600;color:#2563eb;margin-bottom:0.5rem;display:flex;align-items:center;gap:6px">
            <i class="pi pi-refresh"></i> อัปเดต ({{ previewData.updatedList.length }})
          </div>
          <div style="max-height:250px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:4px">
            <div v-for="item in previewData.updatedList" :key="item.so"
              style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 12px;font-size:0.82rem">
              <div style="font-weight:600;color:#1d4ed8;margin-bottom:4px">
                <b>{{ item.so }}</b> — {{ item.name }}
              </div>
              <div v-if="item.changes" style="margin-top:6px;display:flex;flex-direction:column;gap:4px">
                <template v-for="(label, key) in {task_name:'ชื่อ',sale_owner:'Sales',customer_info:'ลูกค้า',status:'สถานะ'}" :key="key">
                  <div v-if="item.changes[key]" style="display:flex;align-items:center;gap:6px;font-size:0.78rem">
                    <span style="color:#64748b;min-width:50px">{{ label }}:</span>
                    <span style="background:#fee2e2;color:#b91c1c;border-radius:4px;padding:1px 7px;text-decoration:line-through">{{ item.changes[key].old || '-' }}</span>
                    <i class="pi pi-arrow-right" style="color:#94a3b8;font-size:0.65rem"></i>
                    <span style="background:#dcfce7;color:#15803d;border-radius:4px;padding:1px 7px;font-weight:600">{{ item.changes[key].new || '-' }}</span>
                  </div>
                </template>
                <div v-if="item.changes.files" style="font-size:0.78rem;margin-top:2px">
                  <div v-if="item.changes.files.added?.length" style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:2px">
                    <span style="color:#64748b;min-width:50px">ไฟล์ใหม่:</span>
                    <span v-for="f in item.changes.files.added" :key="f" style="background:#dcfce7;color:#15803d;border-radius:4px;padding:1px 7px;font-weight:600">+ {{ f }}</span>
                  </div>
                  <div v-if="item.changes.files.removed?.length" style="display:flex;flex-wrap:wrap;gap:3px">
                    <span style="color:#64748b;min-width:50px">ลบออก:</span>
                    <span v-for="f in item.changes.files.removed" :key="f" style="background:#fee2e2;color:#b91c1c;border-radius:4px;padding:1px 7px;text-decoration:line-through">- {{ f }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- No Changes -->
        <div v-if="!previewData.createdList.length && !previewData.updatedList.length"
          style="text-align:center;padding:2rem;color:#64748b;background:#f8fafc;border-radius:8px">
          <i class="pi pi-check-circle" style="font-size:3rem;color:#10b981;margin-bottom:0.5rem"></i>
          <div style="font-weight:600;font-size:1.1rem">ไม่มีการเปลี่ยนแปลง</div>
          <div style="font-size:0.9rem;margin-top:4px">ข้อมูลในระบบตรงกับ ERP แล้ว</div>
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" @click="showPreview = false" severity="secondary" />
        <Button label="ยืนยัน Sync" icon="pi pi-check" @click="confirmSync" severity="success" 
          :disabled="!previewData || (!previewData.createdList.length && !previewData.updatedList.length)" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showSyncResult" header="ผลการ Sync ERP" :style="{width:'560px'}" modal :draggable="false">
      <div v-if="syncData" style="padding:0.5rem 0">
        <!-- Summary -->
        <div style="display:flex;gap:1rem;margin-bottom:1.25rem">
          <div style="flex:1;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:1rem;text-align:center">
            <div style="font-size:1.8rem;font-weight:700;color:#16a34a">{{ syncData.created }}</div>
            <div style="font-size:0.85rem;color:#15803d;margin-top:2px">โครงการใหม่</div>
          </div>
          <div style="flex:1;background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;padding:1rem;text-align:center">
            <div style="font-size:1.8rem;font-weight:700;color:#2563eb">{{ syncData.updated }}</div>
            <div style="font-size:0.85rem;color:#1d4ed8;margin-top:2px">อัปเดต</div>
          </div>
          <div style="flex:1;background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:1rem;text-align:center">
            <div style="font-size:1.8rem;font-weight:700;color:#ca8a04">{{ syncData.total }}</div>
            <div style="font-size:0.85rem;color:#a16207;margin-top:2px">ทั้งหมด</div>
          </div>
        </div>
        <!-- Created List -->
        <div v-if="syncData.createdList.length" style="margin-bottom:1rem">
          <div style="font-weight:600;color:#16a34a;margin-bottom:0.5rem;display:flex;align-items:center;gap:6px">
            <i class="pi pi-plus-circle"></i> โครงการใหม่ ({{ syncData.createdList.length }})
          </div>
          <div style="max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:4px">
            <div v-for="item in syncData.createdList" :key="item.so">
              <span style="background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:20px;padding:3px 10px;font-size:0.8rem">
                <b>{{ item.so }}</b> {{ item.name !== item.so ? '— ' + item.name : '' }}
              </span>
              <div v-if="item.files?.length" style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;padding-left:8px">
                <span v-for="f in item.files" :key="f" style="background:#f0fdf4;color:#15803d;border:1px solid #86efac;border-radius:4px;padding:1px 7px;font-size:0.75rem">📎 {{ f }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Updated List -->
        <div v-if="syncData.updatedList.length">
          <div style="font-weight:600;color:#2563eb;margin-bottom:0.5rem;display:flex;align-items:center;gap:6px">
            <i class="pi pi-refresh"></i> อัปเดต ({{ syncData.updatedList.length }})
          </div>
          <div style="max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:4px">
            <div v-for="item in syncData.updatedList" :key="item.so"
              style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:6px 10px;font-size:0.82rem">
              <div style="font-weight:600;color:#1d4ed8"><b>{{ item.so }}</b> — {{ item.name }}</div>
              <div v-if="item.changes" style="margin-top:6px;display:flex;flex-direction:column;gap:4px">
                <template v-for="(label, key) in {task_name:'ชื่อ',sale_owner:'Sales',customer_info:'ลูกค้า',status:'สถานะ'}" :key="key">
                  <div v-if="item.changes[key]" style="display:flex;align-items:center;gap:6px;font-size:0.78rem">
                    <span style="color:#64748b;min-width:50px">{{ label }}:</span>
                    <span style="background:#fee2e2;color:#b91c1c;border-radius:4px;padding:1px 7px;text-decoration:line-through">{{ item.changes[key].old || '-' }}</span>
                    <i class="pi pi-arrow-right" style="color:#94a3b8;font-size:0.65rem"></i>
                    <span style="background:#dcfce7;color:#15803d;border-radius:4px;padding:1px 7px;font-weight:600">{{ item.changes[key].new || '-' }}</span>
                  </div>
                </template>
                <div v-if="item.changes.files" style="font-size:0.78rem;margin-top:2px">
                  <div v-if="item.changes.files.added?.length" style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:2px">
                    <span style="color:#64748b;min-width:50px">ไฟล์ใหม่:</span>
                    <span v-for="f in item.changes.files.added" :key="f" style="background:#dcfce7;color:#15803d;border-radius:4px;padding:1px 7px;font-weight:600">+ {{ f }}</span>
                  </div>
                  <div v-if="item.changes.files.removed?.length" style="display:flex;flex-wrap:wrap;gap:3px">
                    <span style="color:#64748b;min-width:50px">ลบออก:</span>
                    <span v-for="f in item.changes.files.removed" :key="f" style="background:#fee2e2;color:#b91c1c;border-radius:4px;padding:1px 7px;text-decoration:line-through">- {{ f }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="showTaskDialog" modal header="เพิ่มโครงการ" :style="{ width: '90vw', height: '80vh' }" :draggable="false">
      <AddTaskForm @task-added="handleTaskAdded" @close-form="showTaskDialog = false" />
    </Dialog>
  </div>
</template>

<script>
import axios from '@/utils/axiosConfig'
import Dialog from 'primevue/dialog'
import AddTaskForm from '@/views/daily_work/AddTaskForm.vue'
import TaskList from '@/views/daily_work/TaskList.vue'

export default {
  name: 'ProjectsView',
  components: {
    Dialog,
    AddTaskForm,
    TaskList
  },
  async created() {
    await this.loadSyncHistory()
  },
  data() {
    return {
      showTaskDialog: false,
      syncing: false,
      syncData: null,
      showSyncResult: false,
      syncHistory: [],
      showHistory: false,
      previewData: null,
      showPreview: false,
      confirmingSyncData: null
    }
  },
  methods: {
    async loadSyncHistory() {
      try {
        const res = await axios.get('/api/erp-sync/history', { silent: true })
        this.syncHistory = res.data.map(h => ({
          ...h,
          createdList: h.created_list || [],
          updatedList: h.updated_list || [],
          syncedAt: new Date(h.synced_at).toLocaleString('th-TH')
        }))
      } catch (e) { console.error(e) }
    },
    async syncERP() {
      if (this.syncing) return
      this.syncing = true
      try {
        // Step 1: ดึง Preview ก่อน
        const res = await axios.get('/api/erp-sync/preview', { timeout: 300000, silent: true })
        console.log('[syncERP] preview:', res.data)
        
        this.previewData = res.data
        this.showPreview = true
        
      } catch (e) {
        console.error(e)
        this.$toast.add({
          severity: 'error',
          summary: 'ไม่สามารถดึงข้อมูล Preview ได้',
          detail: e.response?.data?.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อ ERP',
          life: 5000
        })
      } finally {
        this.syncing = false
      }
    },
    async confirmSync() {
      this.syncing = true
      this.showPreview = false
      try {
        // Step 2: Sync จริง
        const res = await axios.post('/api/erp-sync/projects', {}, { timeout: 300000, silent: true })
        console.log('[confirmSync] response:', res.data)
        this.syncData = { ...res.data, syncedAt: new Date().toLocaleString('th-TH') }
        this.showSyncResult = true
        await this.loadSyncHistory()
        
        // Force refresh task list
        if (this.$refs.taskList) {
          await this.$refs.taskList.loadTasks()
          window.dispatchEvent(new CustomEvent('taskUpdated'))
        }
        
        this.$toast.add({
          severity: 'success',
          summary: 'Sync สำเร็จ',
          detail: `สร้างใหม่ ${res.data.created} รายการ, อัปเดต ${res.data.updated} รายการ`,
          life: 5000
        })
      } catch (e) {
        console.error(e)
        this.$toast.add({
          severity: 'error',
          summary: 'Sync ล้มเหลว',
          detail: e.response?.data?.error || 'ไม่สามารถ sync ข้อมูลจาก ERP ได้',
          life: 5000
        })
      } finally {
        this.syncing = false
      }
    },
    handleTaskAdded() {
      this.showTaskDialog = false
      if (this.$refs.taskList) {
        this.$refs.taskList.loadTasks()
      }
    }
  }
}
</script>

<style scoped>
.projects-container {
  padding: 1rem;
  padding-bottom: 0;
  max-width: 100%;
  margin: 0 auto;
  
  background: #e5e7eb;
  height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: auto;
}

.header-card {
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
  background: transparent;
}

.header-card :deep(.p-card-body) {
  padding: 0;
  background: transparent;
}

.header-card :deep(.p-card-content) {
  padding: 0;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  border-radius: 15px 15px 0 0;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  overflow: hidden;
  min-height: 80px;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.main-header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.main-header i {
  font-size: 1.5rem;
}

.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.tab-action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  margin-top: 0rem;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.sync-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  border: none !important;
  color: white !important;
  padding: 0.75rem 1.5rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4) !important;
  transition: all 0.3s ease !important;
  margin-left: auto !important;
}

.sync-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.6) !important;
}

.history-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
  border: none !important;
  color: white !important;
  padding: 0.75rem 1.5rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4) !important;
  transition: all 0.3s ease !important;
}

.history-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.6) !important;
}

.task-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  border: none !important;
  color: white !important;
  padding: 1rem 2rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4) !important;
  transition: all 0.3s ease !important;
  position: relative !important;
  overflow: hidden !important;
  min-width: 180px !important;
  font-size: 1rem !important;
}

.task-btn:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6) !important;
}

.btn-text {
  margin-left: 0.5rem;
  font-size: 1rem;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .projects-container {
    padding: 1rem;
  }

  .main-header {
    padding: 1.5rem;
    min-height: 60px;
  }

  .main-header h1 {
    font-size: 1.5rem;
  }

  .main-header i {
    font-size: 1.25rem;
  }

  .main-content {
    padding: 1rem;
  }

  .tab-action-buttons {
    flex-direction: column;
    margin-bottom: 1rem;
  }

  .task-btn {
    width: 100%;
    min-width: auto !important;
    padding: 0.875rem 1.5rem !important;
  }

  .btn-text {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .projects-container {
    padding: 0.5rem;
  }

  .main-header {
    padding: 1rem;
    min-height: 50px;
  }

  .main-header h1 {
    font-size: 1.25rem;
    gap: 0.5rem;
  }

  .main-header i {
    font-size: 1rem;
  }

  .main-content {
    padding: 0.75rem;
  }

  .task-btn {
    padding: 0.75rem 1.25rem !important;
    font-size: 0.9rem !important;
  }

  .btn-text {
    font-size: 0.85rem;
  }
}

@media (max-width: 768px) and (orientation: landscape) {
  .main-header {
    padding: 1rem;
    min-height: 50px;
  }

  .main-header h1 {
    font-size: 1.25rem;
  }

  .main-content {
    padding: 1rem;
  }
}
</style>
