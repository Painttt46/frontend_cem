<template>
  <div class="procurement-page">
    <Toast />

    <Card class="header-card">
      <template #header>
        <div class="main-header">
          <h1><i class="pi pi-shopping-cart"></i> จัดซื้อ</h1>
          <span class="stat-item">
            <i class="pi pi-list"></i> {{ allItems.length }} รายการ
          </span>
        </div>
      </template>
    </Card>

    <!-- KPI Summary Cards -->
    <div class="kpi-row">
      <div class="kpi-card" :class="{ 'kpi-active': !filterStatus }" @click="filterStatus = null">
        <div class="kpi-icon kpi-total"><i class="pi pi-shopping-cart"></i></div>
        <div class="kpi-info">
          <div class="kpi-value">{{ allItems.length }}</div>
          <div class="kpi-label">ทั้งหมด</div>
        </div>
      </div>
      <div class="kpi-card" :class="{ 'kpi-active': filterStatus === 'pending' }" @click="filterStatus = filterStatus === 'pending' ? null : 'pending'">
        <div class="kpi-icon kpi-pending"><i class="pi pi-clock"></i></div>
        <div class="kpi-info">
          <div class="kpi-value">{{ countByStatus('pending') }}</div>
          <div class="kpi-label">รอใบเสนอราคา</div>
        </div>
      </div>
      <div class="kpi-card" :class="{ 'kpi-active': filterStatus === 'approved' }" @click="filterStatus = filterStatus === 'approved' ? null : 'approved'">
        <div class="kpi-icon kpi-approved"><i class="pi pi-check-square"></i></div>
        <div class="kpi-info">
          <div class="kpi-value">{{ countByStatus('approved') }}</div>
          <div class="kpi-label">อนุมัติแล้ว</div>
        </div>
      </div>
      <div class="kpi-card" :class="{ 'kpi-active': filterStatus === 'ordered' }" @click="filterStatus = filterStatus === 'ordered' ? null : 'ordered'">
        <div class="kpi-icon kpi-ordered"><i class="pi pi-send"></i></div>
        <div class="kpi-info">
          <div class="kpi-value">{{ countByStatus('ordered') }}</div>
          <div class="kpi-label">สั่งซื้อแล้ว</div>
        </div>
      </div>
      <div class="kpi-card" :class="{ 'kpi-active': filterStatus === 'waiting' }" @click="filterStatus = filterStatus === 'waiting' ? null : 'waiting'">
        <div class="kpi-icon kpi-waiting"><i class="pi pi-truck"></i></div>
        <div class="kpi-info">
          <div class="kpi-value">{{ countByStatus('waiting') }}</div>
          <div class="kpi-label">รอของ</div>
        </div>
      </div>
      <div class="kpi-card" :class="{ 'kpi-active': filterStatus === 'received' }" @click="filterStatus = filterStatus === 'received' ? null : 'received'">
        <div class="kpi-icon kpi-received"><i class="pi pi-box"></i></div>
        <div class="kpi-info">
          <div class="kpi-value">{{ countByStatus('received') }}</div>
          <div class="kpi-label">ของมาแล้ว</div>
        </div>
      </div>
      <div class="kpi-card" :class="{ 'kpi-active': filterStatus === 'completed' }" @click="filterStatus = filterStatus === 'completed' ? null : 'completed'">
        <div class="kpi-icon kpi-done"><i class="pi pi-check-circle"></i></div>
        <div class="kpi-info">
          <div class="kpi-value">{{ countByStatus('completed') }}</div>
          <div class="kpi-label">เสร็จสิ้น</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-panel">
      <div class="filter-row">
        <div class="filter-left">
          <div class="search-box">
            <i class="pi pi-search search-icon" />
            <InputText v-model="searchQuery" placeholder="ค้นหา Vendor, โครงการ, PO..." />
            <i v-if="searchQuery" class="pi pi-times-circle search-clear" @click="searchQuery = ''" />
          </div>
          <div class="filter-divider"></div>
          <Dropdown v-model="filterProject" :options="projectOptions" optionLabel="label" optionValue="value"
            placeholder="ทุกโครงการ" :showClear="true" class="filter-dropdown" filter>
            <template #option="slotProps">
              <div class="project-option">
                <span v-if="slotProps.option.so" class="project-option-so">{{ slotProps.option.so }}</span>
                <span class="project-option-name">{{ slotProps.option.label }}</span>
              </div>
            </template>
            <template #value="slotProps">
              <span v-if="slotProps.value" class="dd-value"><i class="pi pi-folder"></i> {{ getProjectLabel(slotProps.value) }}</span>
              <span v-else class="dd-placeholder"><i class="pi pi-folder"></i> ทุกโครงการ</span>
            </template>
          </Dropdown>
          <button v-if="hasActiveFilter" class="clear-all-btn" @click="clearFilters" v-tooltip.top="'ล้างตัวกรองทั้งหมด'">
            <i class="pi pi-filter-slash"></i>
          </button>
        </div>
        <div class="filter-right">
          <span class="result-count"><strong>{{ filteredItems.length }}</strong> รายการ</span>
          <input ref="importFileInput" type="file" accept=".xlsx,.xls" style="display:none" @change="onImportFileChange" />
          <Button icon="pi pi-upload" label="Import Excel" @click="$refs.importFileInput.click()" class="import-btn" outlined />
          <Button icon="pi pi-plus" label="เพิ่ม Vendor" @click="stepSearchQuery = ''; showSelectStepDialog = true" class="add-btn" />
        </div>
      </div>

      <!-- Active Filter Chips -->
      <div v-if="hasActiveFilter" class="active-filters">
        <span class="active-filter-label"><i class="pi pi-filter"></i> ตัวกรอง</span>
        <span v-if="filterStatus" class="active-chip">
          <span class="chip-dot" :class="'dot-' + filterStatus"></span>
          {{ getItemStatusLabel(filterStatus) }}
          <i class="pi pi-times" @click="filterStatus = null"></i>
        </span>
        <span v-if="filterProject" class="active-chip">
          <i class="pi pi-folder chip-icon"></i>
          {{ getProjectLabel(filterProject) }}
          <i class="pi pi-times" @click="filterProject = null"></i>
        </span>
        <span v-if="searchQuery" class="active-chip">
          <i class="pi pi-search chip-icon"></i>
          {{ searchQuery }}
          <i class="pi pi-times" @click="searchQuery = ''"></i>
        </span>
      </div>
    </div>

    <!-- Projects with Vendors (Grouped View) -->
    <div class="section-block">
      <div class="section-head">
        <h2 class="section-title"><i class="pi pi-folder-open"></i> รายการจัดซื้อตามโครงการ</h2>
        <div class="section-actions">
          <button class="expand-toggle" @click="toggleAllGroups">
            <i :class="allExpanded ? 'pi pi-minus' : 'pi pi-plus'"></i>
            {{ allExpanded ? 'ย่อทั้งหมด' : 'ขยายทั้งหมด' }}
          </button>
          <span class="section-count">{{ groupedByStep.length }} โครงการ</span>
        </div>
      </div>

      <div class="projects-list">
        <!-- Loading Skeleton -->
        <div v-if="loading" class="skeleton-list">
          <div v-for="n in 3" :key="'sk-'+n" class="skeleton-group">
            <div class="skeleton-header">
              <div class="skeleton-bar" style="width: 60%; height: 18px;"></div>
              <div class="skeleton-bar" style="width: 25%; height: 14px; margin-top: 8px;"></div>
            </div>
            <div class="skeleton-rows">
              <div v-for="m in 2" :key="'sr-'+m" class="skeleton-row">
                <div class="skeleton-bar" style="width: 40%; height: 14px;"></div>
                <div class="skeleton-bar" style="width: 20%; height: 14px;"></div>
                <div class="skeleton-bar" style="width: 15%; height: 24px; border-radius: 12px;"></div>
              </div>
            </div>
          </div>
        </div>

        <template v-else>        <div v-for="group in groupedByStep" :key="group.step_id" class="project-group" :class="{ 'group-expanded': expandedGroups[group.step_id] }">
          <!-- Project/Step Header -->
          <div class="group-header" @click="toggleGroup(group.step_id)">
            <div class="group-left">
              <i :class="expandedGroups[group.step_id] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="group-chevron"></i>
              <div class="group-info">
                <div class="group-title">
                  <span v-if="group.so_number" class="so-tag">{{ group.so_number }}</span>
                  <span class="group-name">{{ group.task_name }}</span>
                  <span class="group-step-badge"><i class="pi pi-shopping-cart"></i> {{ group.step_name }}</span>
                </div>
                <div class="group-meta">
                  <span class="group-vendor-count"><i class="pi pi-users"></i> {{ getVendorClusters(group).length }} Vendor</span>
                  <span v-if="sumAmount(group.items) !== null" class="group-amount"><i class="pi pi-wallet"></i> ฿{{ formatMoney(sumAmount(group.items)) }}</span>
                  <span v-if="group.project_manager" class="group-pm"><i class="pi pi-briefcase"></i> {{ group.project_manager }}</span>
                  <span class="group-link" @click.stop="goToProject(group.items[0])"><i class="pi pi-external-link"></i> ดูโครงการ</span>
                </div>
              </div>
            </div>
            <div class="group-right">
              <div class="group-progress">
                <div class="progress-wrap">
                  <ProgressBar :value="getGroupProgress(group)" :showValue="false" style="height: 7px; width: 110px;" />
                </div>
                <span class="progress-text">{{ getGroupProgress(group) }}%</span>
              </div>
              <div class="group-status-summary">
                <span v-if="getGroupOverdue(group) > 0" class="group-badge badge-overdue">
                  <i class="pi pi-exclamation-triangle"></i> {{ getGroupOverdue(group) }}
                </span>
                <span class="group-badge badge-done">
                  <i class="pi pi-check"></i> {{ group.items.filter(i => i.status === 'completed').length }}/{{ group.items.length }}
                </span>
              </div>
              <Button icon="pi pi-plus" v-tooltip.left="'เพิ่ม Vendor'" @click.stop="openAddItem(group)" text size="small" class="group-add-btn" />
            </div>
          </div>

          <!-- Vendor List (Expanded) -->
          <transition name="expand">
            <div v-if="expandedGroups[group.step_id]" class="vendor-list">
              <div class="vendor-row vendor-row-header">
                <div class="vh-vendor">Vendor</div>
                <div class="vh-po">PO</div>
                <div class="vh-order">วันที่สั่ง</div>
                <div class="vh-delivery">กำหนดส่ง</div>
                <div class="vh-amount">ยอดเงิน</div>
                <div class="vh-leadtime">Leadtime</div>
                <div class="vh-notes">หมายเหตุ</div>
                <div class="vh-assignee">ผู้รับผิดชอบ</div>
                <div class="vh-status">สถานะ</div>
                <div class="vh-actions"></div>
              </div>
              <template v-for="cluster in getVendorClusters(group)" :key="vendorKey(group, cluster)">
                <!-- vendor ชื่อซ้ำหลายรายการ: รวมเป็นแถวเดียว กดขยายดูรายการย่อย -->
                <div v-if="cluster.repeated" class="vendor-row vendor-cluster-row" @click="toggleVendorGroup(vendorKey(group, cluster))">
                  <div class="vendor-main-info">
                    <i :class="isVendorExpanded(vendorKey(group, cluster)) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="cluster-chevron"></i>
                    <span class="vendor-name">{{ cluster.vendor_name }}</span>
                    <span class="cluster-count"><i class="pi pi-list"></i> {{ cluster.items.length }} รายการ</span>
                  </div>
                  <div class="vendor-col vendor-col-po"><span class="col-empty">—</span></div>
                  <div class="vendor-col vendor-col-order"><span class="col-empty">—</span></div>
                  <div class="vendor-col vendor-col-delivery"><span class="col-empty">—</span></div>
                  <div class="vendor-col vendor-col-amount">
                    <span v-if="sumAmount(cluster.items) !== null" class="tag-amount"><i class="pi pi-wallet"></i> ฿{{ formatMoney(sumAmount(cluster.items)) }}</span>
                    <span v-else class="col-empty">—</span>
                  </div>
                  <div class="vendor-col vendor-col-leadtime">
                    <span v-if="getClusterLeadtimes(cluster.items)" class="tag-leadtime"><i class="pi pi-clock"></i> {{ getClusterLeadtimes(cluster.items) }}</span>
                    <span v-else class="col-empty">—</span>
                  </div>
                  <div class="vendor-col vendor-col-notes"><span class="col-empty">—</span></div>
                  <div class="vendor-col vendor-col-assignee"><span class="col-empty">—</span></div>
                  <div class="vendor-status-area">
                    <div class="cluster-status-grid">
                      <span v-for="s in getClusterStatusCounts(cluster.items)" :key="s.status" class="status-chip chip-mini" :class="'chip-' + s.status" v-tooltip.top="getItemStatusLabel(s.status)">{{ s.count }}× {{ getItemStatusLabel(s.status) }}</span>
                    </div>
                  </div>
                  <div class="vendor-actions">
                    <Button :icon="isVendorExpanded(vendorKey(group, cluster)) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" :label="isVendorExpanded(vendorKey(group, cluster)) ? 'ย่อ' : 'ดูรายการ'" @click.stop="toggleVendorGroup(vendorKey(group, cluster))" text size="small" class="cluster-toggle" />
                  </div>
                </div>
                <!-- รายการของ vendor (ชื่อซ้ำ = dropdown ย่อย / รายการเดียว = แถวปกติ) -->
                <transition name="expand">
                  <div v-if="!cluster.repeated || isVendorExpanded(vendorKey(group, cluster))" class="vendor-sublist" :class="{ 'is-nested': cluster.repeated }">
                    <div v-for="item in cluster.items" :key="item.id" class="vendor-row" :class="{ 'vendor-overdue': isOverdue(item), 'vendor-done': item.status === 'completed', 'vendor-sub-row': cluster.repeated }">
                      <div class="vendor-main-info">
                        <span v-if="!cluster.repeated" class="vendor-name">{{ item.vendor_name }}</span>
                        <span v-if="item.item_description" class="vendor-desc">{{ item.item_description }}</span>
                      </div>
                      <div class="vendor-col vendor-col-po">
                        <span v-if="item.po_number" class="tag-po"><i class="pi pi-file"></i> {{ item.po_number }}</span>
                        <span v-else class="col-empty">—</span>
                      </div>
                      <div class="vendor-col vendor-col-order">
                        <span v-if="item.order_date" class="tag-order"><i class="pi pi-shopping-bag"></i> {{ formatDate(item.order_date) }}</span>
                        <span v-else class="col-empty">—</span>
                      </div>
                      <div class="vendor-col vendor-col-delivery">
                        <span v-if="item.delivery_date" class="tag-delivery" :class="{ 'tag-overdue': isOverdue(item) }"><i class="pi pi-calendar"></i> {{ formatDate(item.delivery_date) }}</span>
                        <span v-else class="col-empty">—</span>
                      </div>
                      <div class="vendor-col vendor-col-amount">
                        <span v-if="item.amount !== null && item.amount !== undefined && item.amount !== ''" class="tag-amount"><i class="pi pi-wallet"></i> ฿{{ formatMoney(item.amount) }}</span>
                        <span v-else class="col-empty">—</span>
                      </div>
                      <div class="vendor-col vendor-col-leadtime">
                        <span v-if="getLeadtimeFromNotes(item.notes)" class="tag-leadtime" v-tooltip.top="'Leadtime จากหมายเหตุ'"><i class="pi pi-clock"></i> {{ getLeadtimeFromNotes(item.notes) }}</span>
                        <span v-else class="col-empty">—</span>
                      </div>
                      <div class="vendor-col vendor-col-notes">
                        <span v-if="item.notes" class="tag-notes" v-tooltip.top="item.notes"><i class="pi pi-comment"></i> {{ item.notes }}</span>
                        <span v-else class="col-empty">—</span>
                      </div>
                      <div class="vendor-col vendor-col-assignee">
                        <span v-if="item.assigned_user_name" class="tag-assignee"><i class="pi pi-user"></i> {{ item.assigned_user_name }}</span>
                        <span v-else class="col-empty">—</span>
                      </div>
                      <div class="vendor-status-area">
                        <span class="status-chip" :class="'chip-' + item.status">{{ getItemStatusLabel(item.status) }}</span>
                        <span v-if="item.status_history && item.status_history.length" class="history-count-badge" @click="openHistory(item)" v-tooltip.top="'ดูประวัติ'">
                          <i class="pi pi-history"></i> {{ item.status_history.length }}
                        </span>
                      </div>
                      <div class="vendor-actions">
                        <Button v-if="getNextStatus(item.status)"
                          :label="getNextActionLabel(item.status)"
                          :class="'action-btn btn-' + getNextStatus(item.status)"
                          @click="advanceStatus(item)" size="small" />
                        <Button icon="pi pi-history" v-tooltip.top="'ประวัติ'" @click="openHistory(item)" text size="small" class="icon-btn" />
                        <Button icon="pi pi-pencil" v-tooltip.top="'แก้ไข'" @click="openEditItem(item)" text size="small" class="icon-btn" />
                        <Button icon="pi pi-trash" v-tooltip.top="'ลบ'" @click="deleteItem(item)" text severity="danger" size="small" class="icon-btn" />
                      </div>
                    </div>
                  </div>
                </transition>
              </template>
            </div>
          </transition>
        </div>

        <div v-if="groupedByStep.length === 0 && !loading" class="empty-state">
          <i class="pi pi-shopping-cart"></i>
          <p>ไม่พบรายการจัดซื้อ</p>
          <Button icon="pi pi-plus" label="เพิ่ม Vendor แรก" @click="stepSearchQuery = ''; showSelectStepDialog = true" class="add-btn" style="margin-top:1rem" />
        </div>
        </template>
      </div>
    </div>

    <!-- Calendar Section -->
    <div class="calendar-section">
      <div class="calendar-events">
        <div class="cal-head">
          <h3 class="cal-title"><i class="pi pi-calendar"></i> ไทม์ไลน์ & กิจกรรม</h3>
          <span class="cal-head-badge">{{ overdueItems.length + todayItems.length + upcomingDeliveryItems.length }} รายการ</span>
        </div>
        <div v-if="overdueItems.length > 0" class="cal-overdue">
          <div class="cal-date-label cal-overdue-label"><i class="pi pi-exclamation-triangle"></i> เลยกำหนด ({{ overdueItems.length }})</div>
          <div v-for="item in overdueItems" :key="item.id" class="cal-event cal-event-overdue">
            <span class="cal-dot dot-overdue"></span>
            <div class="cal-event-info">
              <span class="cal-event-name">{{ item.vendor_name }}<span v-if="item.amount !== null && item.amount !== undefined && item.amount !== ''" class="cal-amount-chip">฿{{ formatMoney(item.amount) }}</span></span>
              <span class="cal-event-project"><span v-if="item.so_number" class="cal-so">[{{ item.so_number }}]</span> {{ item.task_name }}<span v-if="item.step_name"> • {{ item.step_name }}</span> • กำหนด {{ formatDate(item.delivery_date) }}</span>
              <span v-if="getItemDetailLine(item)" class="cal-event-desc"><i class="pi pi-box"></i> {{ getItemDetailLine(item) }}</span>
            </div>
            <span class="cal-event-badge badge-overdue">เลย {{ getOverdueDays(item) }} วัน</span>
            <span class="cal-event-time">{{ formatDateTime(item.updated_at || item.created_at) }}</span>
          </div>
        </div>

        <div class="cal-today">
          <div class="cal-date-label">Today {{ formatFullDate(new Date()) }}</div>
          <div v-for="item in todayItems" :key="'today-'+item.id" class="cal-event">
            <span class="cal-dot" :class="'dot-' + item.status"></span>
            <div class="cal-event-info">
              <span class="cal-event-name">{{ item.vendor_name }}<span v-if="item.amount !== null && item.amount !== undefined && item.amount !== ''" class="cal-amount-chip">฿{{ formatMoney(item.amount) }}</span></span>
              <span class="cal-event-project"><span v-if="item.so_number" class="cal-so">[{{ item.so_number }}]</span> {{ item.task_name }}<span v-if="item.step_name"> • {{ item.step_name }}</span> • กำหนดส่งวันนี้</span>
              <span v-if="getItemDetailLine(item)" class="cal-event-desc"><i class="pi pi-box"></i> {{ getItemDetailLine(item) }}</span>
            </div>
            <span class="cal-event-badge" :class="'badge-' + item.status">{{ getItemStatusLabel(item.status) }}</span>
            <span class="cal-event-time">{{ formatDateTime(item.updated_at || item.created_at) }}</span>
          </div>
          <!-- Today's history events -->
          <div v-for="evt in todayHistoryEvents" :key="'hist-'+evt.key" class="cal-event" :class="getHistoryEventClass(evt)">
            <span class="cal-dot" :class="'dot-' + getHistoryDotColor(evt)"></span>
            <div class="cal-event-info">
              <span class="cal-event-name">{{ evt.vendor_name }}<span v-if="evt.amount !== null && evt.amount !== undefined && evt.amount !== ''" class="cal-amount-chip">฿{{ formatMoney(evt.amount) }}</span></span>
              <span class="cal-event-project"><span v-if="evt.so_number" class="cal-so">[{{ evt.so_number }}]</span> {{ evt.task_name }}<span v-if="evt.step_name"> • {{ evt.step_name }}</span> • {{ evt.description }}</span>
              <span v-if="getItemDetailLine(evt)" class="cal-event-desc"><i class="pi pi-box"></i> {{ getItemDetailLine(evt) }}<span v-if="evt.changed_by" class="cal-desc-by"> • โดย {{ evt.changed_by }}</span></span>
              <span v-if="evt.remark" class="cal-event-remark"><i class="pi pi-comment"></i> {{ evt.remark }}</span>
            </div>
            <span class="cal-event-badge" :class="getHistoryBadgeClass(evt)">{{ evt.badge }}</span>
            <span class="cal-event-time">{{ evt.time }}</span>
          </div>
          <div v-if="todayItems.length === 0 && todayHistoryEvents.length === 0" class="cal-empty">ไม่มีกิจกรรมวันนี้</div>
        </div>

        <div class="cal-week">
          <div class="cal-date-label">This Week</div>
          <div v-for="item in thisWeekItems" :key="'week-'+item.id" class="cal-event">
            <span class="cal-dot" :class="'dot-' + item.status"></span>
            <div class="cal-event-info">
              <span class="cal-event-name">{{ item.vendor_name }}<span v-if="item.amount !== null && item.amount !== undefined && item.amount !== ''" class="cal-amount-chip">฿{{ formatMoney(item.amount) }}</span></span>
              <span class="cal-event-project"><span v-if="item.so_number" class="cal-so">[{{ item.so_number }}]</span> {{ item.task_name }}<span v-if="item.step_name"> • {{ item.step_name }}</span> • {{ formatDate(item.delivery_date) }}</span>
              <span v-if="getItemDetailLine(item)" class="cal-event-desc"><i class="pi pi-box"></i> {{ getItemDetailLine(item) }}</span>
            </div>
            <span class="cal-event-badge" :class="'badge-' + item.status">{{ getDeliveryLabel(item) }}</span>
            <span class="cal-event-time">{{ formatDate(item.delivery_date) }}</span>
          </div>
          <div v-if="thisWeekItems.length === 0" class="cal-empty">ไม่มีกำหนดส่งสัปดาห์นี้</div>
        </div>

        <div class="cal-week">
          <div class="cal-date-label">Next Week</div>
          <div v-for="item in nextWeekItems" :key="'next-'+item.id" class="cal-event">
            <span class="cal-dot" :class="'dot-' + item.status"></span>
            <div class="cal-event-info">
              <span class="cal-event-name">{{ item.vendor_name }}<span v-if="item.amount !== null && item.amount !== undefined && item.amount !== ''" class="cal-amount-chip">฿{{ formatMoney(item.amount) }}</span></span>
              <span class="cal-event-project"><span v-if="item.so_number" class="cal-so">[{{ item.so_number }}]</span> {{ item.task_name }}<span v-if="item.step_name"> • {{ item.step_name }}</span> • {{ formatDate(item.delivery_date) }}</span>
              <span v-if="getItemDetailLine(item)" class="cal-event-desc"><i class="pi pi-box"></i> {{ getItemDetailLine(item) }}</span>
            </div>
            <span class="cal-event-badge badge-upcoming">{{ formatDate(item.delivery_date) }}</span>
            <span class="cal-event-time">{{ formatDate(item.delivery_date) }}</span>
          </div>
          <div v-if="nextWeekItems.length === 0" class="cal-empty">ไม่มีกำหนดส่งสัปดาห์หน้า</div>
        </div>

        <!-- Upcoming Delivery -->
        <div v-if="upcomingDeliveryItems.length > 0" class="cal-week">
          <div class="cal-date-label cal-delivery-label"><i class="pi pi-calendar-plus"></i> กำหนดส่งที่จะถึง</div>
          <div v-for="item in upcomingDeliveryItems" :key="'upcoming-'+item.id" class="cal-event cal-event-delivery">
            <span class="cal-dot dot-delivery"></span>
            <div class="cal-event-info">
              <span class="cal-event-name">{{ item.vendor_name }}<span v-if="item.amount !== null && item.amount !== undefined && item.amount !== ''" class="cal-amount-chip">฿{{ formatMoney(item.amount) }}</span></span>
              <span class="cal-event-project"><span v-if="item.so_number" class="cal-so">[{{ item.so_number }}]</span> {{ item.task_name }}<span v-if="item.step_name"> • {{ item.step_name }}</span> • {{ formatDate(item.delivery_date) }}</span>
              <span v-if="getItemDetailLine(item)" class="cal-event-desc"><i class="pi pi-box"></i> {{ getItemDetailLine(item) }}</span>
            </div>
            <span class="cal-event-badge badge-delivery">{{ getDeliveryLabel(item) }}</span>
            <span class="cal-event-time">{{ formatDate(item.delivery_date) }}</span>
          </div>
        </div>

        <!-- Completed Recently -->
        <div v-if="completedItems.length > 0" class="cal-week">
          <div class="cal-date-label cal-completed-label"><i class="pi pi-check-circle"></i> เสร็จสิ้นแล้ว ({{ completedItems.length }})</div>
          <div v-for="item in completedItems" :key="'done-'+item.id" class="cal-event cal-event-completed">
            <span class="cal-dot dot-completed"></span>
            <div class="cal-event-info">
              <span class="cal-event-name">{{ item.vendor_name }}<span v-if="item.amount !== null && item.amount !== undefined && item.amount !== ''" class="cal-amount-chip">฿{{ formatMoney(item.amount) }}</span></span>
              <span class="cal-event-project"><span v-if="item.so_number" class="cal-so">[{{ item.so_number }}]</span> {{ item.task_name }}<span v-if="item.step_name"> • {{ item.step_name }}</span></span>
              <span v-if="getItemDetailLine(item)" class="cal-event-desc"><i class="pi pi-box"></i> {{ getItemDetailLine(item) }}</span>
            </div>
            <span class="cal-event-badge badge-completed">เสร็จสิ้น</span>
            <span class="cal-event-time">{{ formatDateTime(item.updated_at) }}</span>
          </div>
        </div>
      </div>

      <div class="calendar-mini">
        <div class="mini-cal-head">
          <h4 class="mini-cal-title"><i class="pi pi-calendar-plus"></i> ปฏิทินกำหนดส่ง</h4>
        </div>
        <Calendar v-model="calendarDate" inline :manualInput="false" @date-select="onDateSelect">
          <template #date="slotProps">
            <span :class="{ 'cal-has-event': hasDeliveryOnDate(slotProps.date) }">
              {{ slotProps.date.day }}
              <span v-if="hasDeliveryOnDate(slotProps.date)" class="cal-date-dot"></span>
            </span>
          </template>
        </Calendar>
        <div class="mini-cal-legend">
          <span class="legend-item"><span class="legend-dot legend-delivery"></span> มีกำหนดส่ง</span>
        </div>
        <div v-if="selectedDateEvents.length > 0 || selectedDateDeliveryItems.length > 0" class="cal-selected-events">
          <div class="cal-selected-title"><i class="pi pi-info-circle"></i> {{ formatFullDate(calendarDate) }}</div>
          <!-- รายการที่มีกำหนดส่งในวันนี้ -->
          <div v-for="item in selectedDateDeliveryItems" :key="'ditem-'+item.id" class="cal-event cal-event-sm cal-event-delivery">
            <span class="cal-dot" :class="'dot-' + item.status"></span>
            <div class="cal-event-info">
              <span class="cal-event-name">{{ item.vendor_name }}<span v-if="item.amount !== null && item.amount !== undefined && item.amount !== ''" class="cal-amount-chip">฿{{ formatMoney(item.amount) }}</span></span>
              <span class="cal-event-project"><span v-if="item.so_number" class="cal-so">[{{ item.so_number }}]</span> {{ item.task_name }}<span v-if="item.step_name"> • {{ item.step_name }}</span> • กำหนดส่ง</span>
              <span v-if="getItemDetailLine(item)" class="cal-event-desc"><i class="pi pi-box"></i> {{ getItemDetailLine(item) }}</span>
            </div>
            <span class="cal-event-badge" :class="'badge-' + item.status">{{ getItemStatusLabel(item.status) }}</span>
            <span class="cal-event-time">{{ formatDate(item.delivery_date) }}</span>
          </div>
          <div v-for="(evt, idx) in selectedDateEvents" :key="'sel-'+idx" class="cal-event cal-event-sm">
            <span class="cal-dot" :class="'dot-' + (evt.dotColor || evt.status)"></span>
            <div class="cal-event-info">
              <span class="cal-event-name">{{ evt.vendor_name }}<span v-if="evt.amount !== null && evt.amount !== undefined && evt.amount !== ''" class="cal-amount-chip">฿{{ formatMoney(evt.amount) }}</span></span>
              <span class="cal-event-project"><span v-if="evt.so_number" class="cal-so">[{{ evt.so_number }}]</span> {{ evt.task_name }}<span v-if="evt.step_name"> • {{ evt.step_name }}</span> • {{ evt.description }}</span>
              <span v-if="getItemDetailLine(evt)" class="cal-event-desc"><i class="pi pi-box"></i> {{ getItemDetailLine(evt) }}<span v-if="evt.changed_by" class="cal-desc-by"> • โดย {{ evt.changed_by }}</span></span>
              <span v-if="evt.remark" class="cal-event-remark"><i class="pi pi-comment"></i> {{ evt.remark }}</span>
            </div>
            <span class="cal-event-time">{{ evt.time }}</span>
          </div>
        </div>
        <div v-else class="cal-selected-empty">
          <i class="pi pi-calendar-times"></i>
          <span>เลือกวันที่เพื่อดูรายละเอียด</span>
        </div>
      </div>
    </div>

    <!-- Import Excel Preview Dialog -->
    <Dialog v-model:visible="showImportDialog" header="Import Excel - ตรวจสอบข้อมูล" :style="{width: '1150px', maxWidth: '95vw'}" modal :draggable="false" class="modern-dialog">
      <div class="dialog-body">
        <!-- Format Badge -->
        <div class="import-format-row">
          <span class="import-format-badge" :class="'fmt-' + importFormat">
            <i :class="importFormat === 'CostSheet' ? 'pi pi-file-excel' : 'pi pi-table'"></i>
            {{ importFormat === 'CostSheet' ? 'Cost Sheet Format' : 'BOQ Draft Format' }}
          </span>
          <span class="import-count">{{ importPreview.length }} vendor ที่พบ</span>
        </div>

        <!-- Warnings จาก parser (ไฟล์จริงอาจคลาดเคลื่อนจาก format ตัวอย่าง) -->
        <div v-if="importWarnings && importWarnings.length" class="import-warnings">
          <i class="pi pi-exclamation-triangle"></i>
          <ul>
            <li v-for="(w, i) in importWarnings" :key="i">{{ w }}</li>
          </ul>
        </div>

        <!-- Step Selection -->
        <div class="import-step-select">
          <label><i class="pi pi-shopping-cart"></i> เลือก Step จัดซื้อที่จะนำเข้า <span class="required">*</span></label>
          <Dropdown v-model="importTargetStep" :options="filteredProcurementStepsForImport" 
            optionLabel="displayLabel" placeholder="เลือก Step จัดซื้อ" 
            class="w-full" filter>
            <template #option="slotProps">
              <div class="project-option">
                <span v-if="slotProps.option.so_number" class="project-option-so">{{ slotProps.option.so_number }}</span>
                <span class="project-option-name">{{ slotProps.option.task_name }} — {{ slotProps.option.step_name }}</span>
              </div>
            </template>
          </Dropdown>
        </div>

        <!-- Preview Table -->
        <div class="import-preview-table">
          <table>
            <thead>
              <tr>
                <th style="width:30px">#</th>
                <th>Vendor</th>
                <th>รายละเอียด</th>
                <th>PO Number</th>
                <th>วันที่สั่ง</th>
                <th>กำหนดส่ง</th>
                <th>ยอดเงิน (฿)</th>
                <th>Leadtime</th>
                <th>หมายเหตุ</th>
                <th>สถานะ</th>
                <th style="width:30px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(v, idx) in importPreview" :key="idx" :class="{ 'import-row-skip': v._skip }">
                <td class="import-idx">{{ idx + 1 }}</td>
                <td class="import-vendor-cell">
                  <InputText v-model="v.vendor_name" class="import-input" :class="{ 'input-error': !v.vendor_name }" />
                </td>
                <td>
                  <InputText v-model="v.item_description" class="import-input import-input-long" placeholder="(ว่าง)" />
                </td>
                <td>
                  <InputText v-model="v.po_number" class="import-input import-input-sm" placeholder="-" />
                </td>
                <td>
                  <InputText v-model="v.order_date" class="import-input import-input-date" placeholder="yyyy-mm-dd" v-tooltip.top="'ดึงจาก PO Date หรือ note สั่งของ'" />
                </td>
                <td>
                  <InputText v-model="v.delivery_date" class="import-input import-input-date" placeholder="yyyy-mm-dd" v-tooltip.top="'ดึงจาก Date of Deliver หรือ note นัดส่ง'" />
                </td>
                <td>
                  <InputText v-model="v.amount" class="import-input import-input-date" placeholder="-" v-tooltip.top="'ราคาซื้อรวม VAT'" />
                </td>
                <td class="import-leadtime">
                  <span v-if="v.leadtime" class="import-leadtime-badge"><i class="pi pi-clock"></i> {{ v.leadtime }}</span>
                  <span v-else class="import-dash">-</span>
                </td>
                <td>
                  <InputText v-model="v.notes" class="import-input import-input-notes" placeholder="หมายเหตุสินค้า" v-tooltip.top="'จากไฟล์ / แก้ไขได้'" />
                </td>
                <td>
                  <Dropdown v-model="v.status" :options="itemStatusOptions" optionLabel="label" optionValue="value" class="import-status-dd" />
                </td>
                <td>
                  <button class="import-remove-btn" @click="importPreview.splice(idx, 1)" v-tooltip.top="'ลบแถวนี้'"><i class="pi pi-times"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="importPreview.length === 0" class="import-empty">ไม่พบข้อมูล vendor ในไฟล์นี้</div>
        </div>

        <!-- Notes preview (expandable) -->
        <div v-if="importPreview.some(v => v.notes)" class="import-notes-hint">
          <i class="pi pi-info-circle"></i> ระบบอ่านข้อมูลจาก column ของไฟล์ BOQ โดยตรง (ชื่อ column คล้ายกันก็อ่านได้ เช่น Distributor/Vendor/ผู้ขาย) — ตรวจและแก้ค่าในตารางได้ทุกช่องก่อนกด Import
        </div>
      </div>

      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" @click="showImportDialog = false" class="btn-cancel" text />
        <Button 
          :label="`Import ${importPreview.filter(v => v.vendor_name).length} Vendor`" 
          icon="pi pi-check" 
          @click="confirmImport" 
          :disabled="!importTargetStep || importPreview.filter(v => v.vendor_name).length === 0 || importLoading"
          :loading="importLoading"
          class="btn-confirm" />
      </template>
    </Dialog>

    <!-- Status Change Remark Dialog -->
    <Dialog v-model:visible="showRemarkDialog" header="เปลี่ยนสถานะ" :style="{width: '440px'}" modal :draggable="false" class="modern-dialog">
      <div class="dialog-body">
        <div v-if="remarkItem" class="remark-target">
          <span class="remark-target-vendor"><i class="pi pi-truck"></i> {{ remarkItem.vendor_name }}</span>
          <span v-if="remarkItem.item_description" class="remark-target-desc"><i class="pi pi-box"></i> {{ remarkItem.item_description }}</span>
          <span v-if="remarkItem.po_number" class="remark-target-po"><i class="pi pi-file"></i> {{ remarkItem.po_number }}</span>
        </div>
        <div class="remark-info">
          <span class="status-chip" :class="'chip-' + remarkFromStatus">{{ getItemStatusLabel(remarkFromStatus) }}</span>
          <i class="pi pi-arrow-right remark-arrow"></i>
          <span class="status-chip" :class="'chip-' + remarkToStatus">{{ getItemStatusLabel(remarkToStatus) }}</span>
        </div>
        <div class="item-form" style="margin-top:1.25rem;">
          <div class="field">
            <label>หมายเหตุ <span class="optional">(ไม่บังคับ)</span></label>
            <Textarea v-model="remarkText" rows="3" placeholder="ระบุหมายเหตุ เช่น เลข Invoice, วันที่ส่งของ..." class="w-full" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" @click="cancelStatusChange" class="btn-cancel" text />
        <Button label="ยืนยัน" icon="pi pi-check" @click="confirmStatusChange" class="btn-confirm" />
      </template>
    </Dialog>

    <!-- Status History Dialog -->
    <Dialog v-model:visible="showHistoryDialog" header="ประวัติการเปลี่ยนสถานะ" :style="{width: '580px'}" modal :draggable="false" class="modern-dialog">
      <div class="dialog-body">
        <div v-if="historyItem" class="history-vendor-info">
          <strong>{{ historyItem.vendor_name }}</strong>
          <span v-if="historyItem.so_number" class="so-tag-sm">{{ historyItem.so_number }}</span>
          <span class="text-muted">{{ historyItem.task_name }}</span>
        </div>
        <!-- รายละเอียดสินค้า: แยกประวัติของ vendor ที่มีหลายรายการ -->
        <div v-if="historyItem && (historyItem.item_description || historyItem.po_number || (historyItem.amount !== null && historyItem.amount !== undefined && historyItem.amount !== ''))" class="history-item-info">
          <span v-if="historyItem.item_description" class="history-item-desc"><i class="pi pi-box"></i> {{ historyItem.item_description }}</span>
          <span v-if="historyItem.po_number" class="history-item-po"><i class="pi pi-file"></i> {{ historyItem.po_number }}</span>
          <span v-if="historyItem.amount !== null && historyItem.amount !== undefined && historyItem.amount !== ''" class="history-item-amount"><i class="pi pi-wallet"></i> ฿{{ formatMoney(historyItem.amount) }}</span>
        </div>
        <div v-if="historyItem && (historyItem.status_history || []).length > 0" class="history-timeline">
          <div v-for="(h, idx) in historyItem.status_history" :key="idx" class="history-item">
            <div class="history-dot" :class="'dot-' + h.to"></div>
            <div class="history-content">
              <div class="history-status-row">
                <span class="status-chip" :class="'chip-' + h.from" style="font-size:0.67rem;padding:0.12rem 0.45rem;">{{ getItemStatusLabel(h.from) }}</span>
                <i class="pi pi-arrow-right" style="font-size:0.68rem;color:#cbd5e1;"></i>
                <span class="status-chip" :class="'chip-' + h.to" style="font-size:0.67rem;padding:0.12rem 0.45rem;">{{ getItemStatusLabel(h.to) }}</span>
              </div>
              <div v-if="h.remark" class="history-remark"><i class="pi pi-comment"></i> {{ h.remark }}</div>
              <div class="history-meta">
                <span><i class="pi pi-user"></i> {{ h.changed_by }}</span>
                <span><i class="pi pi-clock"></i> {{ formatDateTime(h.changed_at) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state" style="padding:2rem;"><i class="pi pi-inbox"></i><p>ยังไม่มีประวัติ</p></div>
      </div>
    </Dialog>

    <!-- Select Step Dialog -->
    <Dialog v-model:visible="showSelectStepDialog" header="เลือก Step จัดซื้อ" :style="{width: '520px', maxWidth: '95vw'}" modal :draggable="false" position="center" class="modern-dialog">
      <div class="dialog-body">
        <p class="dialog-desc">เลือกโครงการ/step ที่ต้องการเพิ่ม Vendor</p>
        <div class="step-search-box">
          <div class="search-box" style="width:100%;">
            <i class="pi pi-search search-icon" />
            <InputText v-model="stepSearchQuery" placeholder="ค้นหา Step, SO, โครงการ..." style="width:100%;" />
            <i v-if="stepSearchQuery" class="pi pi-times-circle search-clear" @click="stepSearchQuery = ''" />
          </div>
        </div>
        <div v-if="filteredProcurementSteps.length > 0" class="step-select-list">
          <div v-for="step in filteredProcurementSteps" :key="step.id" class="step-select-item" @click="openAddItem(step)">
            <div class="step-select-info">
              <span class="step-select-name">{{ step.step_name }}</span>
              <span class="step-select-project"><span v-if="step.so_number" class="so-tag-sm">{{ step.so_number }}</span> {{ step.task_name }}</span>
              <span v-if="step.description" class="step-select-desc">{{ step.description }}</span>
            </div>
            <i class="pi pi-chevron-right step-arrow"></i>
          </div>
        </div>
        <div v-else class="empty-state-sm"><i class="pi pi-inbox"></i><p>ไม่พบ Step จัดซื้อ</p></div>
      </div>
    </Dialog>

    <!-- Add/Edit Item Dialog -->
    <Dialog v-model:visible="showItemDialog" :header="editingItem ? 'แก้ไข Vendor' : 'เพิ่ม Vendor ใหม่'" :style="{width: '700px', maxWidth: '95vw'}" modal :draggable="false" class="modern-dialog">
      <div class="dialog-body">
        <div class="item-form">
          <div class="field">
            <label>ชื่อ Vendor / ผู้ขาย <span class="required">*</span></label>
            <AutoComplete v-model="currentItem.vendor_name" :suggestions="vendorSuggestions" @complete="searchVendor" 
              placeholder="เช่น บริษัท ABC จำกัด" class="w-full" :dropdown="true" />
          </div>
          <div class="field">
            <label>รายการสินค้า / รายละเอียด</label>
            <Textarea v-model="currentItem.item_description" rows="2" placeholder="รายละเอียดสิ่งที่จัดซื้อ" class="w-full" />
          </div>
          <div class="field">
            <label>เลข PO</label>
            <InputText v-model="currentItem.po_number" placeholder="PO-XXXX" class="w-full" />
          </div>
          <div class="field">
            <label>ยอดเงิน (฿)</label>
            <InputText v-model="currentItem.amount" placeholder="เช่น 100000.00" class="w-full" />
          </div>
          <div class="form-divider"></div>
          <div class="field-group">
            <div class="field">
              <label>วันสั่งซื้อ</label>
              <Calendar v-model="currentItem.order_date" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
            <div class="field">
              <label>วันกำหนดส่ง</label>
              <Calendar v-model="currentItem.delivery_date" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
          </div>
          <div class="field-group">
            <div class="field">
              <label>สถานะ</label>
              <Dropdown v-model="currentItem.status" :options="itemStatusOptions" optionLabel="label" optionValue="value" class="w-full" />
            </div>
            <div class="field">
              <label>ผู้รับผิดชอบ</label>
              <Dropdown v-model="currentItem.assigned_user_id" :options="users" optionLabel="name" optionValue="id"
                placeholder="เลือกผู้รับผิดชอบ" class="w-full" filter :showClear="true" @change="onAssignedUserChange" />
            </div>
          </div>
          <div class="form-divider"></div>
          <div class="field">
            <label>หมายเหตุ / Comment สินค้า</label>
            <Textarea v-model="currentItem.notes" rows="2" placeholder="หมายเหตุเพิ่มเติม เช่น เลข Invoice, leadtime, ติดต่อซัพพลายเออร์" class="w-full" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" @click="showItemDialog = false" class="btn-cancel" text />
        <Button :label="editingItem ? 'บันทึก' : 'เพิ่ม Vendor'" :icon="editingItem ? 'pi pi-check' : 'pi pi-plus'" @click="saveItem" :disabled="!currentItem.vendor_name" class="btn-confirm" />
      </template>
    </Dialog>
  </div>
</template>

<script>
import axios from '@/utils/axiosConfig'
import { useConfirm } from 'primevue/useconfirm'
import { useDragScroll } from '@/composables/useDragScroll'

export default {
  name: 'ProcurementView',
  setup() {
    // ตาราง preview import: กดค้างแล้วลากเพื่อเลื่อนซ้าย-ขวาได้เลย (ไม่ต้องใช้ scroll bar)
    useDragScroll('.import-preview-table')
    return { $confirm: useConfirm() }
  },
  data() {
    return {
      procurementSteps: [],
      allItems: [],
      users: [],
      vendorList: [],
      vendorSuggestions: [],
      loading: false,
      searchQuery: '',
      filterProject: null,
      filterStatus: null,
      expandedGroups: {},
      showItemDialog: false,
      showSelectStepDialog: false,
      stepSearchQuery: '',
      editingItem: null,
      currentStep: null,
      currentItem: {
        vendor_name: '', item_description: '', po_number: '', amount: '',
        order_date: null, delivery_date: null, status: 'pending', notes: '',
        assigned_user_id: null, assigned_user_name: ''
      },
      itemStatusOptions: [
        { label: 'รอใบเสนอราคา', value: 'pending' },
        { label: 'อนุมัติแล้ว', value: 'approved' },
        { label: 'สั่งซื้อแล้ว', value: 'ordered' },
        { label: 'รอของ', value: 'waiting' },
        { label: 'ของมาแล้ว', value: 'received' },
        { label: 'เสร็จสิ้น', value: 'completed' }
      ],
      calendarDate: new Date(),
      showRemarkDialog: false,
      remarkItem: null,
      remarkFromStatus: '',
      remarkToStatus: '',
      remarkText: '',
      showHistoryDialog: false,
      historyItem: null,
      // Import Excel state
      showImportDialog: false,
      importFormat: 'BOQ',
      importPreview: [],
      importTargetStep: null,
      importLoading: false,
      importWarnings: [],
      // vendor ซ้ำในกลุ่มโครงการ: state ขยาย/ย่อ dropdown ย่อย
      expandedVendors: {}
    }
  },
  computed: {
    projectOptions() {
      const seen = new Set()
      return this.allItems.filter(i => { if (seen.has(i.task_id)) return false; seen.add(i.task_id); return true })
        .map(i => ({ label: i.task_name, value: i.task_id, so: i.so_number || '' }))
        .sort((a, b) => a.label.localeCompare(b.label, 'th'))
    },
    filteredItems() {
      let result = [...this.allItems]
      if (this.filterProject) result = result.filter(i => i.task_id === this.filterProject)
      if (this.filterStatus) result = result.filter(i => i.status === this.filterStatus)
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase()
        result = result.filter(i =>
          i.vendor_name?.toLowerCase().includes(q) ||
          i.task_name?.toLowerCase().includes(q) ||
          i.item_description?.toLowerCase().includes(q) ||
          i.po_number?.toLowerCase().includes(q)
        )
      }
      return result
    },
    filteredProcurementSteps() {
      if (!this.stepSearchQuery) return this.procurementSteps
      const q = this.stepSearchQuery.toLowerCase()
      return this.procurementSteps.filter(s =>
        s.step_name?.toLowerCase().includes(q) ||
        s.task_name?.toLowerCase().includes(q) ||
        s.so_number?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      )
    },
    filteredProcurementStepsForImport() {
      return this.procurementSteps
        .filter(s => (s.id ?? s.step_id) && s.task_id)
        .map(s => ({ ...s, id: s.id ?? s.step_id, displayLabel: s.so_number ? `[${s.so_number}] ${s.task_name} — ${s.step_name}` : `${s.task_name} — ${s.step_name}` }))
        .sort((a, b) => (a.task_name || '').localeCompare(b.task_name || '', 'th'))
    },
    groupedByStep() {
      const groups = {}
      for (const item of this.filteredItems) {
        const key = item.step_id
        if (!groups[key]) {
          groups[key] = {
            step_id: item.step_id,
            task_id: item.task_id,
            task_name: item.task_name,
            step_name: item.step_name,
            so_number: item.so_number,
            project_manager: item.project_manager,
            items: []
          }
        }
        groups[key].items.push(item)
      }
      return Object.values(groups).sort((a, b) => a.task_name?.localeCompare(b.task_name, 'th'))
    },
    allExpanded() {
      if (!this.groupedByStep.length) return false
      return this.groupedByStep.every(g => this.expandedGroups[g.step_id])
    },
    hasActiveFilter() {
      return !!(this.searchQuery || this.filterProject || this.filterStatus)
    },
    todayItems() {
      const today = this.getLocalDateStr(new Date())
      return this.allItems.filter(i => {
        if (!i.delivery_date || i.status === 'completed') return false
        const dStr = i.delivery_date.split('T')[0]
        return dStr === today
      })
    },
    overdueItems() {
      const today = this.getLocalDateStr(new Date())
      return this.allItems.filter(i => {
        if (!i.delivery_date || i.status === 'completed' || i.status === 'received') return false
        const dStr = i.delivery_date.split('T')[0]
        return dStr < today
      }).sort((a, b) => a.delivery_date.localeCompare(b.delivery_date))
    },
    thisWeekItems() {
      const today = new Date()
      const todayStr = this.getLocalDateStr(today)
      const endOfWeek = new Date(today)
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
      const endStr = this.getLocalDateStr(endOfWeek)
      return this.allItems.filter(i => {
        if (!i.delivery_date || i.status === 'completed') return false
        const dStr = i.delivery_date.split('T')[0]
        return dStr > todayStr && dStr <= endStr
      }).sort((a, b) => a.delivery_date.localeCompare(b.delivery_date))
    },
    nextWeekItems() {
      const today = new Date()
      const startNext = new Date(today)
      startNext.setDate(today.getDate() + (7 - today.getDay()) + 1)
      const endNext = new Date(startNext)
      endNext.setDate(startNext.getDate() + 6)
      const startStr = this.getLocalDateStr(startNext)
      const endStr = this.getLocalDateStr(endNext)
      return this.allItems.filter(i => {
        if (!i.delivery_date || i.status === 'completed') return false
        const dStr = i.delivery_date.split('T')[0]
        return dStr >= startStr && dStr <= endStr
      }).sort((a, b) => a.delivery_date.localeCompare(b.delivery_date))
    },
    upcomingDeliveryItems() {
      const todayStr = this.getLocalDateStr(new Date())
      return this.allItems.filter(i => {
        if (!i.delivery_date || i.status === 'completed' || i.status === 'received') return false
        const dStr = i.delivery_date.split('T')[0]
        return dStr > todayStr
      }).sort((a, b) => a.delivery_date.localeCompare(b.delivery_date))
    },
    completedItems() {
      return this.allItems.filter(i => i.status === 'completed' || i.status === 'received')
    },
    allHistoryEvents() {
      const events = []
      for (const item of this.allItems) {
        // ข้อมูลร่วมของทุก event เพื่อให้ไทม์ไลน์แสดงรายละเอียดครบ
        const common = {
          vendor_name: item.vendor_name,
          task_name: item.task_name,
          so_number: item.so_number,
          step_name: item.step_name,
          item_description: item.item_description,
          po_number: item.po_number,
          amount: item.amount
        }
        // Event: เพิ่ม vendor
        if (item.created_at) {
          events.push({
            ...common,
            key: `created-${item.id}`,
            type: 'created',
            description: `เพิ่มรายการจัดซื้อ`,
            remark: '',
            changed_by: item.created_by_name || '',
            date: item.created_at.split('T')[0],
            datetime: item.created_at,
            time: this.formatDateTime(item.created_at),
            badge: 'เพิ่มใหม่',
            to: 'pending',
            dotColor: 'approved'
          })
        }
        // Events: ประวัติเปลี่ยนสถานะ
        if (item.status_history && item.status_history.length > 0) {
          for (const h of item.status_history) {
            events.push({
              ...common,
              key: `hist-${item.id}-${h.changed_at}`,
              type: 'status_change',
              description: `${this.getItemStatusLabel(h.from)} → ${this.getItemStatusLabel(h.to)}`,
              remark: h.remark || '',
              changed_by: h.changed_by || '',
              date: h.changed_at ? h.changed_at.split('T')[0] : '',
              datetime: h.changed_at,
              time: this.formatDateTime(h.changed_at),
              badge: this.getItemStatusLabel(h.to),
              from: h.from,
              to: h.to,
              dotColor: h.to
            })
          }
        }
        // Event: กำหนดส่ง (upcoming) - เฉพาะที่ยังไม่เสร็จ
        if (item.delivery_date && item.status !== 'completed' && item.status !== 'received') {
          const dStr = item.delivery_date.split('T')[0]
          events.push({
            ...common,
            key: `delivery-${item.id}`,
            type: 'delivery',
            description: `กำหนดส่ง`,
            remark: '',
            changed_by: '',
            date: dStr,
            datetime: item.delivery_date,
            time: this.formatDate(item.delivery_date),
            badge: 'กำหนดส่ง',
            to: item.status,
            dotColor: 'delivery'
          })
        }
      }
      return events.sort((a, b) => (b.datetime || '').localeCompare(a.datetime || ''))
    },
    todayHistoryEvents() {
      const today = this.getLocalDateStr(new Date())
      return this.allHistoryEvents.filter(e => e.date === today && e.type !== 'delivery')
    },
    selectedDateEvents() {
      if (!this.calendarDate) return []
      const selStr = this.getLocalDateStr(this.calendarDate)
      return this.allHistoryEvents.filter(e => e.date === selStr)
    },
    // รายการจัดซื้อที่มีกำหนดส่งในวันที่เลือกในปฏิทิน
    selectedDateDeliveryItems() {
      if (!this.calendarDate) return []
      const selStr = this.getLocalDateStr(this.calendarDate)
      return this.allItems.filter(i => i.delivery_date && i.delivery_date.split('T')[0] === selStr)
    }
  },
  mounted() { this.loadData() },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const [stepsRes, itemsRes, usersRes, vendorsRes] = await Promise.all([
          axios.get('/api/task-steps/procurement'),
          axios.get('/api/procurement'),
          axios.get('/api/users'),
          axios.get('/api/procurement/vendors')
        ])
        this.procurementSteps = stepsRes.data
        this.allItems = itemsRes.data
        this.users = usersRes.data.map(u => ({ id: u.id, name: `${u.firstname} ${u.lastname}${u.nickname ? ` (${u.nickname})` : ''}` }))
        this.vendorList = vendorsRes.data || []
        // Auto expand all groups on first load
        if (Object.keys(this.expandedGroups).length === 0) {
          for (const g of this.groupedByStep) { this.expandedGroups[g.step_id] = true }
        }
      } catch (e) { console.error(e) } finally { this.loading = false }
    },
    toggleGroup(stepId) {
      this.expandedGroups[stepId] = !this.expandedGroups[stepId]
    },
    // จัดกลุ่ม item ในโครงการเดียวกันตามชื่อ vendor (ชื่อซ้ำ = รวมเป็น cluster เดียว)
    getVendorClusters(group) {
      const map = {}, order = []
      for (const item of group.items) {
        const name = item.vendor_name || '(ไม่ระบุชื่อ)'
        if (!map[name]) { map[name] = { vendor_name: name, items: [] }; order.push(map[name]) }
        map[name].items.push(item)
      }
      return order.map(c => ({ ...c, repeated: c.items.length > 1 }))
    },
    vendorKey(group, cluster) {
      return group.step_id + '::' + cluster.vendor_name
    },
    isVendorExpanded(key) {
      return !!this.expandedVendors[key]
    },
    toggleVendorGroup(key) {
      this.expandedVendors[key] = !this.expandedVendors[key]
    },
    // สรุปสถานะของ vendor cluster: นับจำนวนแยกตามสถานะ (แสดงเป็น 2 คอลัมน์ย่อย)
    getClusterStatusCounts(items) {
      const counts = {}
      for (const i of items) counts[i.status] = (counts[i.status] || 0) + 1
      // เรียงตามลำดับ flow เพื่อให้ chip เรียงจากต้นไปจนถึงปลาย
      const flow = ['pending', 'approved', 'ordered', 'waiting', 'received', 'completed']
      return flow.filter(st => counts[st]).map(st => ({ status: st, count: counts[st] }))
    },
    // บรรทัดรายละเอียดของ item สำหรับไทม์ไลน์: รายละเอียดสินค้า + PO + ผู้รับผิดชอบ
    getItemDetailLine(item) {
      const parts = []
      if (item.item_description) parts.push(item.item_description)
      if (item.po_number) parts.push('PO: ' + item.po_number)
      if (item.assigned_user_name) parts.push('ผู้รับผิดชอบ: ' + item.assigned_user_name)
      return parts.join(' • ')
    },
    // จัดรูปยอดเงินเป็นทศนิยม 2 ตำแหน่ง เช่น 100,000.00 (คืน null ถ้าไม่มี/ไม่ใช่ตัวเลข)
    formatMoney(v) {
      if (v === null || v === undefined || v === '') return null
      const n = Number(v)
      if (isNaN(n)) return null
      return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    // ผลรวมยอดเงินของรายการชุดหนึ่ง (คืน null ถ้าไม่มีรายการใดมียอดเงินเลย)
    sumAmount(items) {
      let sum = 0, has = false
      for (const i of items) {
        if (i.amount === null || i.amount === undefined || i.amount === '') continue
        const n = Number(i.amount)
        if (!isNaN(n)) { sum += n; has = true }
      }
      return has ? Math.round(sum * 100) / 100 : null
    },
    // ดึง leadtime จากหมายเหตุ เช่น "** leadtime 20 วัน" → "20 วัน"
    getLeadtimeFromNotes(notes) {
      if (!notes) return null
      const m = String(notes).match(/leadtime\s*:?\s*(\d+(?:\s*-\s*\d+)?)\s*วัน/i)
      return m ? m[1].replace(/\s+/g, '') + ' วัน' : null
    },
    // leadtime ที่ไม่ซ้ำกันของ vendor cluster (สำหรับแถวรวม)
    getClusterLeadtimes(items) {
      const seen = new Set()
      for (const i of items) {
        const lt = this.getLeadtimeFromNotes(i.notes)
        if (lt) seen.add(lt)
      }
      return [...seen].join(', ') || null
    },
    toggleAllGroups() {
      const target = !this.allExpanded
      for (const g of this.groupedByStep) { this.expandedGroups[g.step_id] = target }
    },
    clearFilters() {
      this.searchQuery = ''
      this.filterProject = null
      this.filterStatus = null
    },
    getGroupProgress(group) {
      if (!group.items.length) return 0
      const total = group.items.reduce((sum, i) => sum + this.getProgressPercent(i.status), 0)
      return Math.round(total / group.items.length)
    },
    getGroupOverdue(group) {
      return group.items.filter(i => this.isOverdue(i)).length
    },
    countByStatus(status) { return this.allItems.filter(i => i.status === status).length },
    getProjectLabel(taskId) {
      const opt = this.projectOptions.find(p => p.value === taskId)
      if (!opt) return ''
      return opt.so ? `[${opt.so}] ${opt.label}` : opt.label
    },
    hasDeliveryOnDate(dateObj) {
      const d = `${dateObj.year}-${String(dateObj.month + 1).padStart(2,'0')}-${String(dateObj.day).padStart(2,'0')}`
      return this.allItems.some(i => i.delivery_date && i.delivery_date.split('T')[0] === d && i.status !== 'completed' && i.status !== 'received')
    },
    isOverdue(item) {
      if (!item.delivery_date || item.status === 'completed' || item.status === 'received') return false
      const todayStr = this.getLocalDateStr(new Date())
      const dStr = item.delivery_date.split('T')[0]
      return dStr < todayStr
    },
    onDateSelect() {
      // Calendar date selected - selectedDateItems computed จะ update อัตโนมัติ
    },
    getLocalDateStr(date) {
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    },
    getProgressPercent(status) {
      const map = { pending: 0, approved: 20, ordered: 40, waiting: 60, received: 80, completed: 100 }
      return map[status] || 0
    },
    getItemStatusLabel(status) {
      const found = this.itemStatusOptions.find(s => s.value === status)
      return found ? found.label : status
    },
    getNextStatus(status) {
      const flow = ['pending', 'approved', 'ordered', 'waiting', 'received', 'completed']
      const idx = flow.indexOf(status)
      return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null
    },
    getNextActionLabel(status) {
      const map = { pending: 'อนุมัติ', approved: 'สั่งซื้อ', ordered: 'รอของ', waiting: 'ของมาแล้ว', received: 'เสร็จสิ้น' }
      return map[status] || ''
    },
    async advanceStatus(item) {
      const next = this.getNextStatus(item.status)
      if (!next) return
      this.remarkItem = item
      this.remarkFromStatus = item.status
      this.remarkToStatus = next
      this.remarkText = ''
      this.showRemarkDialog = true
    },
    cancelStatusChange() {
      this.showRemarkDialog = false
      this.remarkItem = null
    },
    async confirmStatusChange() {
      if (!this.remarkItem) return
      try {
        await axios.put(`/api/procurement/${this.remarkItem.id}`, { 
          status: this.remarkToStatus, 
          status_remark: this.remarkText 
        })
        this.showRemarkDialog = false
        await this.loadData()
        this.$toast.add({ severity: 'success', summary: 'สำเร็จ', detail: `เปลี่ยนสถานะเป็น "${this.getItemStatusLabel(this.remarkToStatus)}"`, life: 3000 })
      } catch (e) { 
        console.error(e)
        this.$toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'ไม่สามารถเปลี่ยนสถานะได้', life: 3000 })
      }
    },
    openHistory(item) {
      this.historyItem = item
      this.showHistoryDialog = true
    },
    formatDateTime(dt) {
      if (!dt) return ''
      const d = new Date(dt)
      return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    },
    getHistoryDotColor(evt) {
      if (evt.type === 'created') return 'new'
      if (evt.to === 'completed') return 'completed'
      return evt.to || 'pending'
    },
    getHistoryEventClass(evt) {
      if (evt.type === 'created') return 'cal-event-created'
      if (evt.to === 'completed') return 'cal-event-completed'
      return 'cal-event-history'
    },
    getHistoryBadgeClass(evt) {
      if (evt.type === 'created') return 'badge-new'
      if (evt.to === 'completed') return 'badge-completed'
      return 'badge-' + evt.to
    },
    openAddItem(step) {
      // รองรับทั้ง step object จาก procurementSteps (มี id) และ group object จาก groupedByStep (มี step_id)
      this.currentStep = { id: step.id || step.step_id, task_id: step.task_id }
      this.editingItem = null
      this.showSelectStepDialog = false
      this.currentItem = { vendor_name: '', item_description: '', po_number: '', order_date: null, delivery_date: null, status: 'pending', notes: '', assigned_user_id: null, assigned_user_name: '' }
      this.showItemDialog = true
    },
    openEditItem(item) {
      this.currentStep = { id: item.step_id, task_id: item.task_id }
      this.editingItem = item
      this.currentItem = { ...item, order_date: item.order_date ? new Date(item.order_date) : null, delivery_date: item.delivery_date ? new Date(item.delivery_date) : null }
      this.showItemDialog = true
    },
    onAssignedUserChange() {
      const user = this.users.find(u => u.id === this.currentItem.assigned_user_id)
      this.currentItem.assigned_user_name = user ? user.name : ''
    },
    searchVendor(event) {
      const q = event.query.toLowerCase()
      this.vendorSuggestions = q ? this.vendorList.filter(v => v.toLowerCase().includes(q)) : [...this.vendorList]
    },
    async onImportFileChange(e) {
      const file = e.target.files && e.target.files[0]
      e.target.value = '' // reset เพื่อให้เลือกไฟล์เดิมซ้ำได้
      if (!file) return
      if (!/\.(xlsx|xls)$/i.test(file.name)) {
        this.$toast.add({ severity: 'warn', summary: 'ไฟล์ไม่ถูกต้อง', detail: 'รองรับเฉพาะไฟล์ .xlsx / .xls', life: 3000 })
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        this.$toast.add({ severity: 'warn', summary: 'ไฟล์ใหญ่เกินไป', detail: 'ขนาดไฟล์ต้องไม่เกิน 20MB', life: 3000 })
        return
      }
      this.importLoading = true
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await axios.post('/api/procurement/import/preview', fd)
        this.importFormat = res.data.format || 'BOQ'
        this.importPreview = (res.data.vendors || []).map(v => ({ ...v, status: v.status || 'pending' }))
        this.importWarnings = res.data.warnings || []
        this.showImportDialog = true
        if (this.importPreview.length === 0) {
          this.$toast.add({ severity: 'info', summary: 'ไม่พบข้อมูล', detail: 'ไม่พบรายการ vendor ในไฟล์นี้ — ตรวจสอบว่ากรอกข้อมูลครบ (Distributor/รายละเอียด หรือชื่อ tab vendor)', life: 5000 })
        }
      } catch (err) {
        console.error(err)
        this.$toast.add({ severity: 'error', summary: 'อ่านไฟล์ไม่สำเร็จ', detail: err.response?.data?.error || err.userMessage || 'ไม่สามารถอ่านไฟล์ Excel ได้', life: 4000 })
      } finally {
        this.importLoading = false
      }
    },
    async confirmImport() {
      if (!this.importTargetStep) return
      const vendors = this.importPreview.filter(v => v.vendor_name && String(v.vendor_name).trim())
      if (vendors.length === 0) return
      this.importLoading = true
      try {
        const payload = {
          step_id: this.importTargetStep.id,
          task_id: this.importTargetStep.task_id,
          vendors: vendors.map(v => {
            const clean = { ...v }
            delete clean._sheet // ตัด field ชั่วคราวจาก parser ออกก่อนส่ง
            delete clean._skip
            delete clean.leadtime // leadtime ไม่มีคอลัมน์ใน DB (อยู่ใน notes แล้ว)
            return clean
          })
        }
        const res = await axios.post('/api/procurement/import/confirm', payload)
        this.showImportDialog = false
        this.importPreview = []
        this.importWarnings = []
        this.importTargetStep = null
        this.$toast.add({ severity: 'success', summary: 'นำเข้าสำเร็จ', detail: `เพิ่ม ${res.data.created} รายการเรียบร้อย`, life: 3000 })
        await this.loadData()
      } catch (err) {
        console.error(err)
        this.$toast.add({ severity: 'error', summary: 'นำเข้าไม่สำเร็จ', detail: err.response?.data?.error || err.userMessage || 'ไม่สามารถนำเข้าข้อมูลได้', life: 4000 })
      } finally {
        this.importLoading = false
      }
    },
    async saveItem() {
      const data = { ...this.currentItem, step_id: this.currentStep.id, task_id: this.currentStep.task_id, order_date: this.currentItem.order_date ? this.fmtDate(this.currentItem.order_date) : null, delivery_date: this.currentItem.delivery_date ? this.fmtDate(this.currentItem.delivery_date) : null }
      try {
        if (this.editingItem) { await axios.put(`/api/procurement/${this.editingItem.id}`, data) }
        else { await axios.post('/api/procurement', data) }
        this.showItemDialog = false
        this.$toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'บันทึกเรียบร้อย', life: 3000 })
        await this.loadData()
      } catch (e) { this.$toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: 'ไม่สามารถบันทึกได้', life: 3000 }) }
    },
    deleteItem(item) {
      this.$confirm.require({
        message: `ลบ "${item.vendor_name}"?`,
        header: 'ยืนยันการลบ',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'ลบ',
        rejectLabel: 'ยกเลิก',
        acceptIcon: 'pi pi-trash',
        rejectIcon: 'pi pi-times',
        acceptClass: 'p-button-danger',
        accept: async () => { await axios.delete(`/api/procurement/${item.id}`); await this.loadData(); this.$toast.add({ severity: 'success', summary: 'ลบแล้ว', life: 2000 }) }
      })
    },
    goToProject(item) { this.$router.push({ path: '/project-progress', query: { taskId: item.task_id, stepId: item.step_id } }) },
    formatDate(d) { 
      if (!d) return ''
      // ใช้ split เพื่อหลีกเลี่ยง timezone issue
      const parts = d.split('T')[0].split('-')
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) 
    },
    formatFullDate(d) { 
      const date = new Date(d)
      return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) 
    },
    getDeliveryLabel(item) {
      if (!item.delivery_date) return ''
      const today = new Date(); today.setHours(0,0,0,0)
      const del = new Date(item.delivery_date); del.setHours(0,0,0,0)
      const diff = Math.ceil((del - today) / (1000*60*60*24))
      if (diff === 0) return 'วันนี้'
      if (diff === 1) return 'พรุ่งนี้'
      if (diff < 0) return 'เลยกำหนด'
      return `อีก ${diff} วัน`
    },
    getOverdueDays(item) {
      if (!item.delivery_date) return 0
      const todayStr = this.getLocalDateStr(new Date())
      const dStr = item.delivery_date.split('T')[0]
      const today = new Date(todayStr + 'T00:00:00')
      const del = new Date(dStr + 'T00:00:00')
      return Math.abs(Math.floor((today - del) / (1000*60*60*24)))
    },
    fmtDate(d) { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}` }
  }
}
</script>


<style scoped>
/* ===== Base Layout ===== */
.procurement-page {
  padding: 1.5rem 2rem;
  max-width: 100%;
  margin: 0 auto;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 100vh;
  font-family: 'Inter', 'Segoe UI', -apple-system, sans-serif;
  overflow: auto;
}

/* ===== Header ===== */
.header-card { width: 100%; margin-bottom: 1.75rem; box-shadow: none; border: none; background: transparent; }
.header-card :deep(.p-card-body) { padding: 0; background: transparent; }
.header-card :deep(.p-card-content) { padding: 0; }
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 2.25rem;
  background: linear-gradient(135deg, #4A90E2 0%, #5B7FE8 40%, #D73527 100%);
  color: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px -10px rgba(74, 144, 226, 0.5), 0 4px 16px rgba(215, 53, 39, 0.15);
  position: relative;
  overflow: hidden;
}
.main-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
  pointer-events: none;
}
.main-header h1 { margin: 0; font-size: 1.75rem; font-weight: 800; display: flex; align-items: center; gap: 0.85rem; letter-spacing: -0.03em; position: relative; z-index: 1; }
.main-header h1 i { font-size: 1.5rem; opacity: 0.95; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
.main-header .stat-item {
  color: #fff;
  font-size: 0.88rem;
  font-weight: 600;
  background: rgba(255,255,255,0.2);
  padding: 0.5rem 1.15rem;
  border-radius: 24px;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.25);
  position: relative;
  z-index: 1;
}

/* ===== KPI Cards ===== */
.kpi-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.9rem; margin-bottom: 1.75rem; }
.kpi-card {
  background: #fff;
  border-radius: 16px;
  padding: 1.15rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  box-shadow: 0 1px 2px rgba(16,24,40,0.05), 0 4px 16px -4px rgba(16,24,40,0.06);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1.5px solid #f1f5f9;
  position: relative;
  overflow: hidden;
}
.kpi-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(59,130,246,0.03) 100%);
  opacity: 0;
  transition: opacity 0.25s;
}
.kpi-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  transition: all 0.25s;
}
.kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px -6px rgba(16,24,40,0.15); border-color: #e2e8f0; }
.kpi-card:hover::before { opacity: 1; }
.kpi-card:active { transform: translateY(-1px) scale(0.98); }
.kpi-card.kpi-active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.12), 0 6px 24px -6px rgba(59,130,246,0.35);
  background: linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%);
  transform: translateY(-2px);
}
.kpi-card.kpi-active::after { background: linear-gradient(90deg, #3b82f6, #60a5fa); height: 4px; }
.kpi-card.kpi-active .kpi-value { color: #1d4ed8; }
.kpi-card.kpi-active .kpi-label { color: #3b82f6; }
.kpi-card.kpi-active .kpi-icon { transform: scale(1.05); box-shadow: 0 4px 12px -2px rgba(0,0,0,0.15); }
.kpi-icon { width: 42px; height: 42px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; flex-shrink: 0; box-shadow: 0 2px 8px -2px rgba(0,0,0,0.1); }
.kpi-total { background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #2563eb; }
.kpi-pending { background: linear-gradient(135deg, #f1f5f9, #e2e8f0); color: #64748b; }
.kpi-approved { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #d97706; }
.kpi-ordered { background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #2563eb; }
.kpi-waiting { background: linear-gradient(135deg, #ede9fe, #ddd6fe); color: #7c3aed; }
.kpi-received { background: linear-gradient(135deg, #cffafe, #a5f3fc); color: #0891b2; }
.kpi-done { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #16a34a; }
.kpi-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; line-height: 1.1; }
.kpi-label { font-size: 0.68rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

/* ===== Filters ===== */
.filter-panel {
  background: #fff;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  border: 1.5px solid #f1f5f9;
  box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 4px 12px -6px rgba(16,24,40,0.05);
}
.filter-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.85rem; }
.filter-left { display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center; }
.filter-right { display: flex; gap: 0.85rem; align-items: center; }
.filter-divider { width: 1.5px; height: 26px; background: #e8ecf0; margin: 0 0.15rem; }
.result-count { font-size: 0.82rem; color: #64748b; white-space: nowrap; }
.result-count strong { color: #0f172a; font-weight: 800; font-size: 0.92rem; }

.search-box { position: relative; display: inline-flex; align-items: center; }
.search-box input {
  padding-left: 2.6rem;
  padding-right: 2.35rem;
  border-radius: 11px;
  border: 1.5px solid #e8ecf0;
  width: 300px;
  height: 40px;
  font-size: 0.86rem;
  background: #fafbfc;
  transition: all 0.2s;
}
.search-box input:hover { background: #fff; border-color: #cbd5e1; }
.search-box input:focus { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 3.5px rgba(59,130,246,0.1); }
.search-icon { position: absolute; left: 0.9rem; color: #94a3b8; font-size: 0.88rem; pointer-events: none; transition: color 0.2s; }
.search-box input:focus ~ .search-icon { color: #3b82f6; }
.search-clear { position: absolute; right: 0.8rem; color: #cbd5e1; font-size: 0.95rem; cursor: pointer; transition: all 0.15s; }
.search-clear:hover { color: #64748b; transform: scale(1.15); }

.filter-dropdown { border-radius: 11px; height: 40px; min-width: 210px; font-size: 0.86rem; }
.filter-dropdown :deep(.p-dropdown) { border-radius: 11px; border: 1.5px solid #e8ecf0; background: #fafbfc; transition: all 0.2s; }
.filter-dropdown :deep(.p-dropdown:hover) { background: #fff; border-color: #cbd5e1; }
.filter-dropdown :deep(.p-dropdown:not(.p-disabled).p-focus) { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 3.5px rgba(59,130,246,0.1); }
.filter-dropdown :deep(.p-dropdown-label) { padding: 0.55rem 0.75rem; }
.dd-value, .dd-placeholder { display: inline-flex; align-items: center; gap: 0.4rem; }
.dd-value i, .dd-placeholder i { font-size: 0.78rem; color: #94a3b8; }
.dd-placeholder { color: #94a3b8; }

.clear-all-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  border: 1.5px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.clear-all-btn:hover { background: #fee2e2; border-color: #f87171; transform: scale(1.05); }

.add-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  border: none !important;
  font-weight: 700;
  border-radius: 11px;
  padding: 0.6rem 1.35rem;
  box-shadow: 0 4px 14px -3px rgba(59,130,246,0.45);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.86rem;
  height: 40px;
}
.add-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px -4px rgba(59,130,246,0.55); }
.add-btn:active { transform: translateY(0); }

/* Active Filter Chips */
.active-filters { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.85rem; padding-top: 0.85rem; border-top: 1.5px solid #f8fafc; flex-wrap: wrap; }
.active-filter-label { font-size: 0.75rem; color: #94a3b8; font-weight: 700; display: inline-flex; align-items: center; gap: 0.3rem; text-transform: uppercase; letter-spacing: 0.04em; }
.active-filter-label i { font-size: 0.68rem; }
.active-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.45rem 0.3rem 0.7rem;
  border-radius: 20px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.76rem;
  font-weight: 600;
  border: 1.5px solid #bfdbfe;
  max-width: 260px;
}
.chip-icon { font-size: 0.68rem; opacity: 0.7; }
.chip-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.chip-dot.dot-pending { background: #94a3b8; }
.chip-dot.dot-approved { background: #f59e0b; }
.chip-dot.dot-ordered { background: #3b82f6; }
.chip-dot.dot-waiting { background: #8b5cf6; }
.chip-dot.dot-received { background: #06b6d4; }
.chip-dot.dot-completed { background: #16a34a; }
.active-chip > i.pi-times { cursor: pointer; font-size: 0.62rem; opacity: 0.55; transition: all 0.15s; padding: 0.22rem; border-radius: 50%; }
.active-chip > i.pi-times:hover { opacity: 1; background: rgba(29,78,216,0.12); }

/* Dialog Buttons */
.btn-cancel { color: #64748b !important; font-weight: 600; border-radius: 10px; padding: 0.55rem 1.15rem; }
.btn-cancel:hover { background: #f1f5f9 !important; }
.btn-confirm {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  border: none !important;
  font-weight: 700;
  border-radius: 10px;
  padding: 0.6rem 1.5rem;
  box-shadow: 0 3px 12px -2px rgba(59,130,246,0.4);
  transition: all 0.2s;
}
.btn-confirm:hover:not(:disabled) { transform: translateY(-1.5px); box-shadow: 0 6px 18px -3px rgba(59,130,246,0.5); }
.btn-confirm:disabled { opacity: 0.5; box-shadow: none; }

/* ===== Section Block ===== */
.section-block { margin-bottom: 1.75rem; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; }
.section-title { margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; display: flex; align-items: center; gap: 0.55rem; }
.section-title i { color: #3b82f6; font-size: 0.95rem; }
.section-actions { display: flex; align-items: center; gap: 0.75rem; }
.expand-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.expand-toggle:hover { border-color: #3b82f6; color: #3b82f6; background: #f8fbff; }
.section-count { font-size: 0.78rem; color: #64748b; font-weight: 600; background: #f1f5f9; padding: 0.35rem 0.75rem; border-radius: 10px; }

/* ===== Grouped Projects View ===== */
.projects-list { display: flex; flex-direction: column; gap: 1.1rem; }
.project-group {
  background: #fff;
  border-radius: 18px;
  border: 1.5px solid #f1f5f9;
  box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 4px 16px -6px rgba(16,24,40,0.06);
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.project-group:hover { box-shadow: 0 6px 28px -8px rgba(16,24,40,0.14); border-color: #e2e8f0; }
.project-group.group-expanded { border-color: #dbeafe; box-shadow: 0 4px 20px -6px rgba(59,130,246,0.12); }

.group-step-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: #7c3aed;
  background: linear-gradient(135deg, #f5f3ff, #ede9fe);
  padding: 0.2rem 0.55rem;
  border-radius: 8px;
  font-weight: 700;
  border: 1px solid #ddd6fe;
}
.group-step-badge i { font-size: 0.65rem; }
.group-link { font-size: 0.76rem; color: #3b82f6; display: inline-flex; align-items: center; gap: 0.3rem; cursor: pointer; background: #eff6ff; padding: 0.15rem 0.5rem; border-radius: 6px; transition: all 0.15s; font-weight: 600; }
.group-link:hover { background: #dbeafe; }
.progress-wrap { position: relative; }
.progress-wrap :deep(.p-progressbar) { border-radius: 6px; background: #e2e8f0; overflow: hidden; }
.progress-wrap :deep(.p-progressbar-value) { background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 6px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.group-badge i { font-size: 0.62rem; }
.icon-btn { width: 30px; height: 30px; border-radius: 8px !important; transition: all 0.15s; }
.icon-btn:hover { background: #f1f5f9 !important; }

/* Expand transition */
.expand-enter-active, .expand-leave-active { transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; }
.expand-enter-to, .expand-leave-from { max-height: 2000px; opacity: 1; }

/* Calendar Head */
.cal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.4rem; }
.cal-head-badge { font-size: 0.75rem; color: #64748b; font-weight: 700; background: #f1f5f9; padding: 0.3rem 0.7rem; border-radius: 10px; }

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.15rem 1.4rem;
  cursor: pointer;
  transition: background 0.2s;
  gap: 1rem;
  position: relative;
}
.group-header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #3b82f6, #60a5fa);
  opacity: 0;
  transition: opacity 0.2s;
}
.group-header:hover { background: linear-gradient(90deg, #fafbff 0%, #fff 100%); }
.group-header:hover::before { opacity: 1; }
.group-left { display: flex; align-items: center; gap: 0.9rem; flex: 1; min-width: 0; }
.group-chevron { color: #94a3b8; font-size: 0.8rem; transition: all 0.25s; flex-shrink: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 8px; }
.group-header:hover .group-chevron { background: #eff6ff; color: #3b82f6; }
.group-info { min-width: 0; }
.group-title { display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap; }
.group-name { font-weight: 700; color: #0f172a; font-size: 0.98rem; letter-spacing: -0.01em; }
.group-step-name { font-size: 0.82rem; color: #64748b; font-weight: 500; }
.group-meta { display: flex; gap: 0.85rem; margin-top: 0.4rem; flex-wrap: wrap; }
.group-vendor-count { font-size: 0.76rem; color: #64748b; display: inline-flex; align-items: center; gap: 0.3rem; background: #f8fafc; padding: 0.15rem 0.5rem; border-radius: 6px; }
.group-pm { font-size: 0.76rem; color: #059669; display: inline-flex; align-items: center; gap: 0.3rem; background: #f0fdf4; padding: 0.15rem 0.5rem; border-radius: 6px; }
.group-right { display: flex; align-items: center; gap: 1.15rem; flex-shrink: 0; }
.group-progress { display: flex; align-items: center; gap: 0.6rem; }
.group-progress :deep(.p-progressbar) { border-radius: 6px; background: #e2e8f0; overflow: hidden; }
.group-progress :deep(.p-progressbar-value) { background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 6px; }
.group-status-summary { display: flex; gap: 0.45rem; }
.group-badge { font-size: 0.7rem; padding: 0.28rem 0.65rem; border-radius: 14px; font-weight: 700; letter-spacing: 0.01em; }
.group-badge.badge-overdue { background: linear-gradient(135deg, #fee2e2, #fecaca); color: #b91c1c; }
.group-badge.badge-done { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #15803d; }
.group-add-btn { color: #3b82f6 !important; background: #eff6ff !important; border-radius: 10px !important; width: 34px; height: 34px; transition: all 0.2s; }
.group-add-btn:hover { background: #dbeafe !important; transform: scale(1.08); }

/* Vendor List (inside group) */
.vendor-list { border-top: 1.5px solid #f1f5f9; background: #fdfdfe; overflow-x: auto; }
.vendor-row-header, .vendor-row { min-width: 1280px; }

.vendor-row-header {
  display: grid;
  grid-template-columns: 1.35fr 0.7fr 0.8fr 0.8fr 0.8fr 0.7fr 1.15fr 0.8fr 0.9fr auto;
  gap: 0.85rem;
  padding: 0.6rem 1.4rem 0.6rem 3.15rem;
  background: #f8fafc;
  border-bottom: 1.5px solid #e8ecf0;
  font-size: 0.68rem;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.vendor-row-header > div { display: flex; align-items: center; }
.vh-actions { min-width: 210px; }

.vendor-row {
  display: grid;
  grid-template-columns: 1.35fr 0.7fr 0.8fr 0.8fr 0.8fr 0.7fr 1.15fr 0.8fr 0.9fr auto;
  align-items: center;
  gap: 0.85rem;
  padding: 0.8rem 1.4rem 0.8rem 3.15rem;
  border-bottom: 1px solid #f8fafc;
  transition: all 0.18s;
  position: relative;
}
.vendor-row::before {
  content: '';
  position: absolute;
  left: 1.85rem;
  top: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cbd5e1;
  transform: translateY(-50%);
  transition: all 0.2s;
}
.vendor-row:last-child { border-bottom: none; }
.vendor-row:hover { background: #fff; box-shadow: inset 3px 0 0 #3b82f6; }
.vendor-row:hover::before { background: #3b82f6; transform: translateY(-50%) scale(1.3); }
.vendor-row.vendor-overdue { background: linear-gradient(90deg, #fef2f2 0%, #fff 60%); }
.vendor-row.vendor-overdue::before { background: #dc2626; }
.vendor-row.vendor-done { opacity: 0.65; }
.vendor-row.vendor-done::before { background: #16a34a; }

/* ===== Vendor Cluster: รวม vendor ชื่อซ้ำเป็น dropdown ย่อย ===== */
.vendor-cluster-row { cursor: pointer; background: linear-gradient(90deg, #f8fafc 0%, #fff 100%); }
.vendor-cluster-row:hover { background: #eef4fb; box-shadow: inset 3px 0 0 #4f46e5; }
.vendor-cluster-row:hover::before { background: #4f46e5; transform: translateY(-50%) scale(1.3); }
.vendor-cluster-row .vendor-main-info { display: flex; align-items: center; gap: 0.6rem; }
.vendor-cluster-row .vendor-name { display: inline; }
.cluster-chevron { color: #94a3b8; font-size: 0.75rem; flex-shrink: 0; }
.cluster-count { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.7rem; font-weight: 700; color: #4f46e5; background: #eef2ff; border: 1px solid #c7d2fe; padding: 0.18rem 0.6rem; border-radius: 12px; white-space: nowrap; }
.cluster-count i { font-size: 0.65rem; }
.cluster-toggle { font-size: 0.72rem !important; }
.vendor-sublist.is-nested { background: #f8fafc; border-bottom: 1px solid #f1f5f9; padding: 0.3rem 0; }
.vendor-sublist.is-nested .vendor-row { background: #fbfdff; }
.vendor-sublist.is-nested .vendor-row:last-child { border-bottom: 1px solid #f8fafc; }
.cluster-status-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.22rem 0.4rem; width: 100%; align-items: center; }
.status-chip.chip-mini { font-size: 0.62rem; padding: 0.16rem 0.45rem; white-space: nowrap; overflow: hidden; max-width: 100%; }

.vendor-main-info { min-width: 0; }
.vendor-name { font-weight: 650; color: #0f172a; font-size: 0.88rem; display: block; letter-spacing: -0.005em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vendor-desc { font-size: 0.74rem; color: #64748b; display: block; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.vendor-col { display: flex; align-items: center; min-width: 0; }
.col-empty { color: #cbd5e1; font-size: 0.8rem; }

.history-count-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.66rem;
  color: #d97706;
  background: #fffbeb;
  border: 1px solid #fde68a;
  padding: 0.15rem 0.45rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  margin-left: 0.4rem;
}
.history-count-badge:hover { background: #fef3c7; }

.vendor-status-area { display: flex; align-items: center; }

.detail-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.71rem;
  color: #475569;
  background: #fff;
  padding: 0.22rem 0.55rem;
  border-radius: 7px;
  border: 1px solid #e8ecf0;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(16,24,40,0.03);
}
.detail-tag i { font-size: 0.68rem; opacity: 0.7; }
.detail-tag.tag-overdue { color: #b91c1c; background: #fef2f2; border-color: #fecaca; font-weight: 600; }

/* Colored column tags - ไม่ซ้ำกับสี status chip */
.tag-po, .tag-order, .tag-delivery, .tag-amount, .tag-assignee {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.71rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 8px;
  white-space: nowrap;
}
.tag-po { color: #0f766e; background: #f0fdfa; border: 1px solid #99f6e4; }
.tag-po i { font-size: 0.66rem; opacity: 0.8; }
.tag-delivery { color: #c2410c; background: #fff7ed; border: 1px solid #fed7aa; }
.tag-delivery i { font-size: 0.66rem; opacity: 0.8; }
.tag-delivery.tag-overdue { color: #be123c; background: #fff1f2; border-color: #fecdd3; }
.tag-order { color: #4338ca; background: #eef2ff; border: 1px solid #c7d2fe; }
.tag-order i { font-size: 0.66rem; opacity: 0.8; }
.tag-amount { color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; font-weight: 700; }
.tag-amount i { font-size: 0.66rem; opacity: 0.8; }
.tag-leadtime { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.7rem; font-weight: 700; color: #c2410c; background: #fff7ed; border: 1px solid #fed7aa; padding: 0.2rem 0.5rem; border-radius: 8px; white-space: nowrap; }
.tag-leadtime i { font-size: 0.64rem; }
.tag-notes { display: block; font-size: 0.7rem; color: #64748b; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: default; }
.tag-notes i { font-size: 0.62rem; color: #94a3b8; margin-right: 0.25rem; }
.group-amount { font-size: 0.72rem; font-weight: 700; color: #047857; display: inline-flex; align-items: center; gap: 0.3rem; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.2rem 0.6rem; border-radius: 12px; }
.tag-assignee { color: #4338ca; background: #eef2ff; border: 1px solid #c7d2fe; }
.tag-assignee i { font-size: 0.66rem; opacity: 0.8; }

.vendor-status-area { }
.vendor-actions { display: flex; align-items: center; gap: 0.25rem; min-width: 210px; justify-content: flex-end; }

/* Shared tags */
.so-tag { font-size: 0.7rem; color: #4f46e5; background: linear-gradient(135deg, #eef2ff, #e0e7ff); padding: 0.2rem 0.5rem; border-radius: 7px; font-weight: 800; font-family: 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.02em; border: 1px solid #c7d2fe; }
.so-tag-sm { font-size: 0.64rem; color: #4f46e5; background: #eef2ff; padding: 0.12rem 0.38rem; border-radius: 5px; font-weight: 800; font-family: 'JetBrains Mono', ui-monospace, monospace; border: 1px solid #ddd6fe; }
.progress-text { font-size: 0.76rem; color: #334155; font-weight: 800; min-width: 34px; }
.text-muted { color: #cbd5e1; }

/* Status Chips */
.status-chip { display: inline-flex; align-items: center; padding: 0.3rem 0.7rem; border-radius: 20px; font-size: 0.71rem; font-weight: 700; letter-spacing: 0.015em; border: 1px solid transparent; }
.status-chip.chip-pending { background: #f8fafc; color: #64748b; border-color: #e2e8f0; }
.status-chip.chip-approved { background: #fffbeb; color: #b45309; border-color: #fde68a; }
.status-chip.chip-ordered { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.status-chip.chip-waiting { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
.status-chip.chip-received { background: #ecfeff; color: #0e7490; border-color: #a5f3fc; }
.status-chip.chip-completed { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }

/* Action Buttons */
.action-cell { display: flex; align-items: center; gap: 0.3rem; }
.action-btn {
  border-radius: 9px;
  font-size: 0.73rem;
  font-weight: 700;
  padding: 0.42rem 0.9rem;
  border: none;
  letter-spacing: 0.015em;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px -2px rgba(0,0,0,0.18);
}
.action-btn:hover { transform: translateY(-1.5px); box-shadow: 0 5px 14px -3px rgba(0,0,0,0.25); }
.action-btn.btn-approved { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }
.action-btn.btn-ordered { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
.action-btn.btn-waiting { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff; }
.action-btn.btn-received { background: linear-gradient(135deg, #06b6d4, #0891b2); color: #fff; }
.action-btn.btn-completed { background: linear-gradient(135deg, #16a34a, #15803d); color: #fff; }

/* ===== Calendar Section ===== */
.calendar-section { display: grid; grid-template-columns: 1fr 380px; gap: 1.5rem; margin-top: 1.75rem; padding-bottom: 2.5rem; }
.calendar-events {
  background: #fff;
  border-radius: 18px;
  padding: 1.65rem;
  box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 4px 16px -6px rgba(16,24,40,0.06);
  border: 1.5px solid #f1f5f9;
}
.cal-title { margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; display: flex; align-items: center; gap: 0.5rem; }
.cal-title i { color: #3b82f6; font-size: 0.95rem; }
.cal-date-label { font-size: 0.78rem; font-weight: 800; color: #475569; margin-bottom: 0.7rem; margin-top: 1.5rem; text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 0.4rem; }
.cal-today .cal-date-label { margin-top: 0; }
.cal-event {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem 0.95rem;
  border-radius: 12px;
  margin-bottom: 0.45rem;
  background: #fafbfc;
  border: 1px solid #f1f5f9;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.cal-event:hover { background: #fff; border-color: #e2e8f0; transform: translateX(3px); box-shadow: 0 3px 12px -3px rgba(16,24,40,0.1); }
.cal-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 3px rgba(0,0,0,0.04); }
.cal-dot.dot-pending { background: #94a3b8; }
.cal-dot.dot-approved { background: #f59e0b; }
.cal-dot.dot-ordered { background: #3b82f6; }
.cal-dot.dot-waiting { background: #8b5cf6; }
.cal-dot.dot-received { background: #06b6d4; }
.cal-dot.dot-completed { background: #16a34a; }
.cal-dot.dot-new { background: #3b82f6; }
.cal-dot.dot-overdue { background: #dc2626; }
.cal-dot.dot-delivery { background: #dc2626; }
.cal-event-info { flex: 1; min-width: 0; }
.cal-event-name { font-weight: 650; font-size: 0.85rem; color: #0f172a; display: block; }
.cal-event-project { font-size: 0.73rem; color: #64748b; display: block; margin-top: 2px; }
.cal-event-badge { font-size: 0.66rem; padding: 0.24rem 0.55rem; border-radius: 12px; font-weight: 700; white-space: nowrap; }
.cal-event-badge.badge-pending { background: #f1f5f9; color: #64748b; }
.cal-event-badge.badge-approved { background: #fef3c7; color: #92400e; }
.cal-event-badge.badge-ordered { background: #dbeafe; color: #1e40af; }
.cal-event-badge.badge-waiting { background: #ede9fe; color: #5b21b6; }
.cal-event-badge.badge-received { background: #cffafe; color: #155e75; }
.cal-event-badge.badge-upcoming { background: #eff6ff; color: #2563eb; }
.cal-event-badge.badge-overdue { background: linear-gradient(135deg, #fee2e2, #fecaca); color: #b91c1c; }
.cal-event-badge.badge-new { background: #dbeafe; color: #1e40af; }
.cal-event-badge.badge-completed { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #15803d; }
.cal-event-badge.badge-delivery { background: linear-gradient(135deg, #fee2e2, #fecaca); color: #b91c1c; }
.cal-event-time { font-size: 0.67rem; color: #94a3b8; white-space: nowrap; font-weight: 500; }
.cal-event-remark { display: block; font-size: 0.7rem; color: #64748b; font-style: italic; margin-top: 3px; }
.cal-event-desc { display: flex; align-items: center; gap: 0.3rem; font-size: 0.7rem; color: #94a3b8; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.cal-event-desc i { font-size: 0.62rem; flex-shrink: 0; }
.cal-desc-po, .cal-desc-by { color: #64748b; }
.cal-amount-chip { display: inline-flex; align-items: center; font-size: 0.64rem; font-weight: 700; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 0.05rem 0.4rem; margin-left: 0.45rem; white-space: nowrap; vertical-align: middle; }
.cal-so { color: #4f46e5; font-weight: 800; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.69rem; }
.cal-empty { font-size: 0.82rem; color: #94a3b8; padding: 0.8rem 0.95rem; text-align: center; background: #fafbfc; border-radius: 10px; border: 1px dashed #e2e8f0; }

.cal-overdue-label { color: #dc2626 !important; }
.cal-event-overdue { background: linear-gradient(90deg, #fef2f2, #fff) !important; border-color: #fecaca !important; }
.cal-delivery-label { color: #dc2626 !important; }
.cal-event-delivery { background: linear-gradient(90deg, #fef2f2, #fff) !important; border-color: #fecaca !important; }
.cal-completed-label { color: #16a34a !important; }
.cal-event-completed { background: linear-gradient(90deg, #f0fdf4, #fff) !important; border-color: #bbf7d0 !important; }
.cal-event-history { background: linear-gradient(90deg, #fffbeb, #fff) !important; border-color: #fde68a !important; }
.cal-event-created { background: linear-gradient(90deg, #eff6ff, #fff) !important; border-color: #bfdbfe !important; }
.cal-date-dot { position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%); width: 5px; height: 5px; border-radius: 50%; background: #dc2626; box-shadow: 0 0 0 2px rgba(220,38,38,0.15); }
.cal-has-event { position: relative; font-weight: 800; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }

/* Mini Calendar */
.calendar-mini {
  background: #fff;
  border-radius: 18px;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 4px 16px -6px rgba(16,24,40,0.06);
  border: 1.5px solid #f1f5f9;
  height: fit-content;
  display: flex;
  flex-direction: column;
}
.mini-cal-head { margin-bottom: 1rem; padding-bottom: 0.85rem; border-bottom: 1.5px solid #f1f5f9; }
.mini-cal-title { margin: 0; font-size: 0.92rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.45rem; letter-spacing: -0.01em; }
.mini-cal-title i { color: #dc2626; font-size: 0.85rem; }
.mini-cal-legend { display: flex; gap: 0.85rem; margin-top: 0.85rem; padding-top: 0.85rem; border-top: 1px solid #f8fafc; }
.legend-item { font-size: 0.7rem; color: #64748b; display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 500; }
.legend-dot { width: 7px; height: 7px; border-radius: 50%; }
.legend-dot.legend-delivery { background: #dc2626; box-shadow: 0 0 0 2px rgba(220,38,38,0.15); }
.cal-selected-empty { margin-top: 1rem; padding: 1.25rem; text-align: center; color: #cbd5e1; background: #fafbfc; border-radius: 12px; border: 1px dashed #e2e8f0; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.cal-selected-empty i { font-size: 1.5rem; opacity: 0.6; }
.cal-selected-empty span { font-size: 0.76rem; font-weight: 500; }
.calendar-mini :deep(.p-datepicker) { border: none; width: 100%; padding: 0; background: transparent; }
.calendar-mini :deep(.p-datepicker-group-container) { width: 100%; }
.calendar-mini :deep(.p-datepicker-group) { width: 100%; padding: 0; }
.calendar-mini :deep(.p-datepicker-header) { border: none; padding: 0.35rem 0 1rem; background: transparent; }
.calendar-mini :deep(.p-datepicker-title) { font-weight: 800; font-size: 0.95rem; }
.calendar-mini :deep(.p-datepicker-prev), .calendar-mini :deep(.p-datepicker-next) { width: 32px; height: 32px; border-radius: 10px; transition: all 0.2s; }
.calendar-mini :deep(.p-datepicker-prev:hover), .calendar-mini :deep(.p-datepicker-next:hover) { background: #eff6ff; color: #3b82f6; }
.calendar-mini :deep(.p-datepicker table) { width: 100%; font-size: 0.85rem; margin: 0; table-layout: fixed; }
.calendar-mini :deep(.p-datepicker table th) { padding: 0.5rem 0; font-size: 0.7rem; color: #94a3b8; font-weight: 800; text-align: center; text-transform: uppercase; letter-spacing: 0.04em; }
.calendar-mini :deep(.p-datepicker table td) { padding: 0.15rem; text-align: center; }
.calendar-mini :deep(.p-datepicker table td > span) {
  border-radius: 10px;
  width: 100%;
  height: 42px;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-weight: 600;
  position: relative;
}
.calendar-mini :deep(.p-datepicker table td > span:hover) { background: #f1f5f9; transform: scale(1.05); }
.calendar-mini :deep(.p-datepicker table td.p-datepicker-today > span) { background: #f8fafc; border: 1.5px solid #cbd5e1; font-weight: 800; }
.calendar-mini :deep(.p-datepicker table td > span.p-highlight) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  box-shadow: 0 4px 12px -2px rgba(59,130,246,0.5);
  transform: scale(1.05);
  border: none;
}
.cal-selected-events { margin-top: 1.15rem; padding-top: 1.15rem; border-top: 1.5px solid #f1f5f9; }
.cal-selected-title { font-size: 0.8rem; font-weight: 800; color: #0f172a; margin-bottom: 0.7rem; display: flex; align-items: center; gap: 0.35rem; }
.cal-selected-title i { color: #3b82f6; font-size: 0.75rem; }
.cal-event-sm { padding: 0.5rem 0.7rem; }
.cal-event-sm .cal-event-name { font-size: 0.79rem; }
.cal-event-sm .cal-event-project { font-size: 0.67rem; }


/* ===== Modern Dialogs ===== */
.modern-dialog :deep(.p-dialog) { border-radius: 18px; overflow: hidden; box-shadow: 0 20px 60px -12px rgba(16,24,40,0.28); border: none; }
.modern-dialog :deep(.p-dialog-header) { padding: 1.25rem 1.5rem; border-bottom: 1.5px solid #f1f5f9; background: #fff; }
.modern-dialog :deep(.p-dialog-title) { font-weight: 800; font-size: 1.05rem; color: #0f172a; letter-spacing: -0.02em; }
.modern-dialog :deep(.p-dialog-header-icon) { width: 32px; height: 32px; border-radius: 50%; color: #64748b; transition: all 0.2s; }
.modern-dialog :deep(.p-dialog-header-icon:hover) { background: #f1f5f9; color: #0f172a; }
.modern-dialog :deep(.p-dialog-content) { padding: 1.5rem 1.5rem 1rem; max-height: calc(100vh - 230px); overflow-y: auto; }
.modern-dialog :deep(.p-dialog-content::-webkit-scrollbar) { width: 6px; }
.modern-dialog :deep(.p-dialog-content::-webkit-scrollbar-track) { background: transparent; }
.modern-dialog :deep(.p-dialog-content::-webkit-scrollbar-thumb) { background: #e2e8f0; border-radius: 3px; }
.modern-dialog :deep(.p-dialog-content::-webkit-scrollbar-thumb:hover) { background: #cbd5e1; }
.modern-dialog :deep(.p-dialog-footer) { padding: 1rem 1.5rem 1.25rem; border-top: 1.5px solid #f1f5f9; background: #fafbfc; display: flex; justify-content: flex-end; gap: 0.65rem; }
.dialog-desc { margin: 0 0 1rem; font-size: 0.84rem; color: #64748b; }
.history-vendor-info { margin-bottom: 1rem; padding-bottom: 0.85rem; border-bottom: 1.5px solid #f1f5f9; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.history-vendor-info strong { color: #0f172a; }
.history-item-info { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin: -0.6rem 0 1rem; }
.history-item-desc { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.76rem; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.22rem 0.6rem; border-radius: 8px; max-width: 100%; }
.history-item-desc i { font-size: 0.66rem; color: #94a3b8; flex-shrink: 0; }
.history-item-po { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; color: #0f766e; background: #f0fdfa; border: 1px solid #99f6e4; padding: 0.22rem 0.55rem; border-radius: 8px; white-space: nowrap; }
.history-item-po i { font-size: 0.64rem; opacity: 0.8; }
.history-item-amount { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; font-weight: 700; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.22rem 0.55rem; border-radius: 8px; white-space: nowrap; }
.history-item-amount i { font-size: 0.64rem; opacity: 0.8; }

.remark-info { display: flex; align-items: center; gap: 1rem; justify-content: center; padding: 1.15rem 1.5rem; background: #f8fafc; border-radius: 12px; border: 1.5px solid #e8ecf0; }
.remark-target { display: flex; align-items: center; justify-content: center; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.85rem; font-size: 0.8rem; color: #334155; }
.remark-target-vendor { display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; color: #0f172a; }
.remark-target-vendor i { color: #7c3aed; font-size: 0.72rem; }
.remark-target-desc, .remark-target-po { display: inline-flex; align-items: center; gap: 0.28rem; background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.16rem 0.5rem; border-radius: 8px; font-size: 0.72rem; color: #64748b; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.remark-target-desc i, .remark-target-po i { color: #94a3b8; font-size: 0.66rem; }
.remark-arrow { color: #cbd5e1; font-size: 0.85rem; }

.history-timeline { display: flex; flex-direction: column; max-height: 400px; overflow-y: auto; padding-right: 0.3rem; }
.history-timeline::-webkit-scrollbar { width: 5px; }
.history-timeline::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
.history-item { display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid #f8fafc; position: relative; }
.history-item:last-child { border-bottom: none; }
.history-item::after { content: ''; position: absolute; left: 5px; top: 30px; bottom: -10px; width: 1.5px; background: #e8ecf0; }
.history-item:last-child::after { display: none; }
.history-dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; z-index: 1; box-shadow: 0 0 0 3px #fff, 0 0 0 5px rgba(0,0,0,0.04); }
.history-dot.dot-pending { background: #94a3b8; }
.history-dot.dot-approved { background: #f59e0b; }
.history-dot.dot-ordered { background: #3b82f6; }
.history-dot.dot-waiting { background: #8b5cf6; }
.history-dot.dot-received { background: #06b6d4; }
.history-dot.dot-completed { background: #16a34a; }
.history-content { flex: 1; }
.history-status-row { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.4rem; }
.history-remark { font-size: 0.82rem; color: #334155; margin-bottom: 0.4rem; background: #f8fafc; padding: 0.55rem 0.75rem; border-radius: 10px; border: 1px solid #f1f5f9; line-height: 1.45; }
.history-meta { font-size: 0.73rem; color: #94a3b8; display: flex; gap: 1.15rem; flex-wrap: wrap; }
.history-meta span { display: inline-flex; align-items: center; gap: 0.3rem; }

.step-search-box { margin-bottom: 1rem; }
.step-select-list { display: flex; flex-direction: column; gap: 0.55rem; max-height: 380px; overflow-y: auto; padding-right: 0.3rem; }
.step-select-list::-webkit-scrollbar { width: 5px; }
.step-select-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
.step-select-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.15rem; border: 1.5px solid #e8ecf0; border-radius: 14px; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); background: #fff; gap: 1rem; }
.step-select-item:hover { background: #f8fbff; border-color: #3b82f6; box-shadow: 0 4px 16px -4px rgba(59,130,246,0.2); transform: translateX(4px); }
.step-arrow { color: #cbd5e1; transition: all 0.2s; flex-shrink: 0; }
.step-select-item:hover .step-arrow { color: #3b82f6; transform: translateX(4px); }
.step-select-info { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.step-select-name { font-weight: 700; color: #0f172a; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.step-select-project { font-size: 0.79rem; color: #64748b; display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; }
.step-select-desc { font-size: 0.73rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.project-option { display: flex; align-items: center; gap: 0.55rem; width: 100%; }
.project-option-name { font-weight: 500; }
.project-option-so { font-size: 0.72rem; color: #4f46e5; background: #eef2ff; padding: 0.18rem 0.48rem; border-radius: 6px; font-family: 'JetBrains Mono', ui-monospace, monospace; font-weight: 800; border: 1px solid #ddd6fe; }

.form-section { margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1.5px solid #f8fafc; }
.form-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.form-section-title { font-size: 0.78rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.45rem; }
.form-section-title i { color: #3b82f6; font-size: 0.82rem; }
.empty-state-sm { text-align: center; padding: 2.5rem 1.5rem; color: #94a3b8; }
.empty-state-sm i { font-size: 2.5rem; margin-bottom: 0.75rem; display: block; opacity: 0.4; }
.empty-state-sm p { font-size: 0.85rem; margin: 0; }

.item-form .field { margin-bottom: 1.1rem; }
.item-form .field:last-child { margin-bottom: 0; }
.item-form .field label { display: block; font-weight: 600; font-size: 0.83rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.3; }
.item-form .field .required { color: #dc2626; font-size: 0.75rem; }
.item-form .field .optional { color: #94a3b8; font-weight: 400; font-size: 0.75rem; }
.item-form .field-group { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1rem; }
.item-form .field-group .field { margin-bottom: 0; }
.form-divider { height: 1px; background: #f1f5f9; margin: 0.5rem 0 1rem; }
.item-form .field > .w-full,
.item-form .field > span.w-full,
.w-full { width: 100% !important; }
.item-form :deep(textarea.p-inputtextarea) { width: 100% !important; box-sizing: border-box; }
.item-form :deep(input.p-inputtext) { width: 100% !important; box-sizing: border-box; }
.item-form :deep(.p-inputtext), .item-form :deep(.p-dropdown), .item-form :deep(.p-calendar .p-inputtext), .item-form :deep(.p-inputtextarea) { border-radius: 10px; border: 1.5px solid #e2e8f0; transition: all 0.2s; font-size: 0.85rem; background: #fafbfc; }
.item-form :deep(.p-inputtext) { height: 38px; padding: 0 0.75rem; }
.item-form :deep(.p-inputtextarea) { padding: 0.5rem 0.75rem; min-height: 38px; height: auto; }
.item-form :deep(.p-dropdown) { height: 38px; display: flex; align-items: center; position: relative; }
.item-form :deep(.p-dropdown .p-dropdown-label) { padding: 0 0.75rem; font-size: 0.85rem; line-height: 35px; background: transparent; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; display: flex; align-items: center; }
.item-form :deep(.p-dropdown .p-dropdown-trigger) { width: 2.4rem; height: 100%; background: #eff6ff; color: #3b82f6; border-radius: 0 10px 10px 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.item-form :deep(.p-dropdown:hover .p-dropdown-trigger) { background: #dbeafe; }
.item-form :deep(.p-dropdown-clear-icon) {
  position: absolute;
  top: 50%;
  right: 2.6rem;
  transform: translateY(-50%);
  margin: 0;
  color: #94a3b8;
  font-size: 0.75rem;
  transition: color 0.15s;
}
.item-form :deep(.p-dropdown-clear-icon:hover) { color: #ef4444; }
.item-form :deep(.p-calendar) { width: 100%; }
.item-form :deep(.p-calendar .p-inputtext) { border-radius: 10px 0 0 10px; height: 38px; padding: 0 0.75rem; border-right: none; }
.item-form :deep(.p-calendar .p-datepicker-trigger) { width: 2.4rem; height: 38px; border-radius: 0 10px 10px 0; background: #eff6ff; color: #3b82f6; border: 1.5px solid #e2e8f0; border-left: none; }
.item-form :deep(.p-calendar .p-datepicker-trigger:hover) { background: #dbeafe; color: #2563eb; }
.item-form :deep(.p-inputtext:hover), .item-form :deep(.p-inputtextarea:hover), .item-form :deep(.p-dropdown:hover) { background: #fff; border-color: #cbd5e1; }
.item-form :deep(.p-dropdown:hover .p-dropdown-label) { background: transparent; }
.item-form :deep(.p-inputtext:focus), .item-form :deep(.p-inputtextarea:focus), .item-form :deep(.p-dropdown:not(.p-disabled).p-focus) { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }

.btn-cancel { color: #64748b !important; font-weight: 600; border-radius: 10px; padding: 0.5rem 1rem; transition: all 0.2s; font-size: 0.84rem; }
.btn-cancel:hover { background: #f1f5f9 !important; }
.btn-confirm { background: linear-gradient(135deg, #3b82f6, #2563eb) !important; border: none !important; font-weight: 700; border-radius: 10px; padding: 0.5rem 1.25rem; box-shadow: 0 3px 10px -2px rgba(59,130,246,0.35); transition: all 0.2s; font-size: 0.84rem; }
.btn-confirm:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 16px -3px rgba(59,130,246,0.45); }
.btn-confirm:disabled { opacity: 0.45; box-shadow: none; transform: none; }

.item-form :deep(.p-autocomplete) { width: 100%; display: flex; }
.item-form :deep(.p-autocomplete-input) { width: 100%; border-radius: 10px 0 0 10px; border: 1.5px solid #e2e8f0; border-right: none; background: #fafbfc; height: 38px; padding: 0 0.75rem; font-size: 0.85rem; }
.item-form :deep(.p-autocomplete-input:hover) { background: #fff; border-color: #cbd5e1; }
.item-form :deep(.p-autocomplete-input:focus) { background: #fff; border-color: #3b82f6; box-shadow: none; }
.item-form :deep(.p-autocomplete-dropdown) {
  background: #3b82f6;
  border: 1.5px solid #3b82f6;
  border-radius: 0 10px 10px 0;
  color: #fff;
  width: 2.4rem;
  height: 38px;
  transition: all 0.2s;
}
.item-form :deep(.p-autocomplete-dropdown:hover) { background: #2563eb; border-color: #2563eb; }
.item-form :deep(.p-autocomplete-dropdown:enabled:hover) { background: #2563eb; border-color: #2563eb; }
.item-form :deep(.p-autocomplete-panel) { border-radius: 12px; box-shadow: 0 8px 28px -4px rgba(16,24,40,0.18); border: 1.5px solid #e8ecf0; overflow: hidden; margin-top: 4px; }
.item-form :deep(.p-autocomplete-item) { padding: 0.6rem 0.9rem; font-size: 0.85rem; transition: background 0.15s; }
.item-form :deep(.p-autocomplete-item:hover) { background: #f8fbff; }

/* ===== Responsive ===== */
@media (max-width: 1280px) {
  .kpi-row { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 1024px) {
  .procurement-page { padding: 1.25rem 1.5rem; }
  .kpi-row { grid-template-columns: repeat(4, 1fr); }
  .calendar-section { grid-template-columns: 1fr; }
  .calendar-mini { order: -1; }
}

@media (max-width: 768px) {
  .procurement-page { padding: 1rem; }
  .main-header { padding: 1.4rem 1.6rem; border-radius: 16px; }
  .main-header h1 { font-size: 1.35rem; }
  .main-header .stat-item { font-size: 0.78rem; padding: 0.4rem 0.9rem; }
  .kpi-row { grid-template-columns: repeat(4, 1fr); gap: 0.55rem; }
  .kpi-card { padding: 0.8rem 0.7rem; border-radius: 12px; gap: 0.6rem; }
  .kpi-icon { width: 36px; height: 36px; font-size: 0.95rem; border-radius: 10px; }
  .kpi-value { font-size: 1.2rem; }
  .kpi-label { font-size: 0.6rem; }
  .filter-panel { padding: 0.85rem 1rem; border-radius: 12px; }
  .filter-row { flex-direction: column; align-items: stretch; }
  .filter-left { flex-direction: column; }
  .filter-divider { display: none; }
  .filter-right { justify-content: space-between; }
  .search-box input { width: 100%; }
  .search-box { width: 100%; }
  .filter-dropdown { width: 100%; }
  .clear-all-btn { width: 100%; }
  .add-btn { flex: 1; justify-content: center; }
  .active-filters { gap: 0.4rem; }
  .active-chip { font-size: 0.7rem; max-width: 100%; }
  .item-form .field-group { grid-template-columns: 1fr; }
  .group-header { flex-direction: column; align-items: flex-start; gap: 0.85rem; padding: 1rem 1.15rem; }
  .group-right { width: 100%; justify-content: space-between; flex-wrap: wrap; gap: 0.6rem; }
  .section-head { flex-direction: column; align-items: stretch; }
  .section-actions { justify-content: space-between; }
  .group-meta { gap: 0.5rem; }
  .vendor-row-header { display: none; }
  .vendor-row { grid-template-columns: 1fr; gap: 0.5rem; padding: 0.85rem 1.15rem 0.85rem 2.5rem; }
  .vendor-col { flex-wrap: wrap; }
  .vendor-row::before { left: 1.15rem; top: 1.35rem; }
  .vendor-actions { justify-content: flex-start; flex-wrap: wrap; }
  .action-btn { font-size: 0.68rem; padding: 0.35rem 0.7rem; }
  .cal-event { flex-wrap: wrap; }
  .calendar-events { padding: 1.25rem; }
}

@media (max-width: 480px) {
  .procurement-page { padding: 0.7rem; }
  .main-header { padding: 1.15rem 1.25rem; border-radius: 14px; }
  .main-header h1 { font-size: 1.15rem; gap: 0.6rem; }
  .main-header h1 i { font-size: 1.1rem; }
  .kpi-row { grid-template-columns: repeat(3, 1fr); gap: 0.45rem; }
  .kpi-card { padding: 0.6rem 0.5rem; gap: 0.45rem; border-radius: 10px; }
  .kpi-icon { width: 30px; height: 30px; font-size: 0.82rem; border-radius: 8px; }
  .kpi-value { font-size: 1rem; }
  .kpi-label { font-size: 0.55rem; }
  .calendar-events { padding: 1.1rem; border-radius: 14px; }
  .calendar-mini { padding: 1rem; border-radius: 14px; }
  .step-select-item { padding: 0.8rem 0.95rem; }
  .group-name { font-size: 0.9rem; }
  .vendor-row { padding: 0.75rem 1rem 0.75rem 2.2rem; }
  .vendor-row::before { left: 1rem; }
}

/* ===== Import Excel ===== */
.import-btn { font-weight: 600; border-radius: 10px; }
.import-format-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
.import-format-badge { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.78rem; font-weight: 700; padding: 0.35rem 0.9rem; border-radius: 20px; }
.import-format-badge.fmt-CostSheet { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.import-format-badge.fmt-BOQ { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.import-count { font-size: 0.82rem; color: #64748b; font-weight: 600; }
.import-warnings { display: flex; gap: 0.6rem; align-items: flex-start; background: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid #f97316; color: #9a3412; border-radius: 10px; padding: 0.65rem 0.9rem; margin-bottom: 1rem; font-size: 0.78rem; }
.import-warnings i { margin-top: 2px; color: #f97316; }
.import-warnings ul { margin: 0; padding-left: 1.1rem; display: flex; flex-direction: column; gap: 0.2rem; }
.import-step-select { margin-bottom: 1rem; }
.import-step-select label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.45rem; }
.import-step-select .required { color: #ef4444; }
.import-preview-table { border: 1.5px solid #e2e8f0; border-radius: 12px; overflow: auto; max-height: 340px; background: #fff; cursor: grab; }
.import-preview-table table { width: 100%; min-width: 1430px; border-collapse: collapse; font-size: 0.8rem; }
.import-vendor-cell { min-width: 210px; }
.import-input-notes { width: 170px; }
.import-preview-table th { position: sticky; top: 0; background: #f8fafc; color: #475569; font-weight: 700; text-align: left; padding: 0.55rem 0.7rem; border-bottom: 1.5px solid #e2e8f0; z-index: 1; }
.import-preview-table td { padding: 0.4rem 0.7rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; color: #334155; }
.import-preview-table tr.import-row-skip td { opacity: 0.5; }
.import-idx { color: #94a3b8; font-size: 0.75rem; }
.import-input { width: 100%; padding: 0.4rem 0.6rem; font-size: 0.8rem; border: 1.5px solid #e2e8f0; border-radius: 8px; }
.import-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
.import-input.input-error { border-color: #ef4444; }
.import-input-long { min-width: 260px; }
.import-input-sm { width: 130px; }
.import-input-date { width: 115px; font-variant-numeric: tabular-nums; }
.import-leadtime { white-space: nowrap; }
.import-leadtime-badge { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 700; color: #7c2d12; background: #ffedd5; border: 1px solid #fed7aa; padding: 0.25rem 0.65rem; border-radius: 16px; }
.import-leadtime-badge i { font-size: 0.7rem; }
.import-dash { color: #cbd5e1; }
.import-status-dd { width: 150px; font-size: 0.8rem; }
.import-remove-btn { width: 26px; height: 26px; border: none; border-radius: 8px; background: #fee2e2; color: #dc2626; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background 0.15s; }
.import-remove-btn:hover { background: #fecaca; }
.import-remove-btn i { font-size: 0.7rem; }
.import-empty { padding: 2rem 1rem; text-align: center; color: #94a3b8; font-size: 0.85rem; }
.import-notes-hint { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.85rem; font-size: 0.78rem; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 0.55rem 0.85rem; }
</style>
