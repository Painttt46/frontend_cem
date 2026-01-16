<template>
  <div class="chat-widget">
    <button class="chat-toggle" @click="isOpen = !isOpen">
      <i :class="isOpen ? 'pi pi-times' : 'pi pi-comments'" />
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
    </button>

    <div v-show="isOpen" class="chat-panel">
      <div class="chat-header">
        <img src="/GENT.svg" alt="Gent" class="chat-avatar" />
        <span>Gent Assistant</span>
        <button class="clear-btn" @click="clearChat" title="ล้างแชท">
          <i class="pi pi-trash" />
        </button>
      </div>

      <!-- Notifications -->
      <div v-if="notifications.length > 0" class="notifications">
        <div v-for="(n, i) in notifications" :key="i" class="notif-item" @click="handleNotification(n)">
          <span class="notif-icon">{{ n.icon }}</span>
          <span class="notif-text">{{ n.text }}</span>
          <button @click.stop="dismissNotification(i)" class="notif-close">×</button>
        </div>
      </div>

      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="welcome-msg">
          <p>👋 สวัสดีครับ! ผม Gent พร้อมช่วยเหลือคุณ</p>
          <div class="quick-actions">
            <button @click="quickSend('ดูตารางงานของฉันวันนี้')">📅 ตารางวันนี้</button>
            <button @click="quickSend('ใครลางานวันนี้')">🏖️ ใครลา</button>
            <button @click="quickSend('สรุปโครงการที่กำลังทำ')">📊 สรุปโครงการ</button>
            <button @click="quickSend('model')">🤖 ดู Models</button>
          </div>
        </div>
        <div v-for="(msg, i) in messages" :key="i" :class="['message', msg.role]">
          <div class="bubble" v-html="formatMessage(msg.text)"></div>
        </div>
        <div v-if="loading" class="message bot">
          <div class="bubble typing"><span></span><span></span><span></span></div>
        </div>
      </div>

      <div class="chat-input">
        <input ref="chatInput" v-model="input" @keyup.enter="send" placeholder="พิมพ์ข้อความ..." :disabled="loading" />
        <button @click="send" :disabled="loading || !input.trim()">
          <i class="pi pi-send" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const GENT_URL = process.env.VUE_APP_GENT_URL || 'http://localhost:3002/webhook';

// axios instance แยกสำหรับ chat - ไม่ผ่าน interceptor ของ app
const chatAxios = axios.create();

export default {
  name: 'ChatWidget',
  data() {
    return {
      isOpen: false,
      input: '',
      messages: [],
      loading: false,
      notifications: [],
      unreadCount: 0,
      checkInterval: null
    };
  },
  mounted() {
    const saved = localStorage.getItem('gent_chat_history');
    if (saved) this.messages = JSON.parse(saved).slice(-30);
    
    // เช็ค notifications ทุก 5 นาที
    this.checkNotifications();
    this.checkInterval = setInterval(() => this.checkNotifications(), 300000);
  },
  beforeUnmount() {
    if (this.checkInterval) clearInterval(this.checkInterval);
  },
  watch: {
    messages: {
      handler(val) {
        localStorage.setItem('gent_chat_history', JSON.stringify(val.slice(-30)));
      },
      deep: true
    },
    isOpen(val) {
      if (val) this.unreadCount = 0;
    }
  },
  methods: {
    async checkNotifications() {
      try {
        const token = localStorage.getItem('soc_token');
        if (!token) return;
        
        const role = localStorage.getItem('soc_role');
        const notifs = [];

        // เช็คลางานรออนุมัติ (สำหรับ admin/hr)
        if (role === 'admin' || role === 'hr') {
          const { data: leaves } = await chatAxios.get('/api/leave', {
            headers: { Authorization: `Bearer ${token}` },
            silent: true
          });
          const pending = leaves?.filter(l => l.status === 'pending') || [];
          if (pending.length > 0) {
            notifs.push({ icon: '📋', text: `มี ${pending.length} รายการลารออนุมัติ`, action: 'ดูรายการลารออนุมัติ' });
          }
        }

        // เช็คการจองรถรออนุมัติ
        if (role === 'admin') {
          const { data: bookings } = await chatAxios.get('/api/car-booking', {
            headers: { Authorization: `Bearer ${token}` },
            silent: true
          });
          const pending = bookings?.filter(b => b.status === 'pending') || [];
          if (pending.length > 0) {
            notifs.push({ icon: '🚗', text: `มี ${pending.length} การจองรถรออนุมัติ`, action: 'ดูการจองรถรออนุมัติ' });
          }
        }

        this.notifications = notifs;
        if (!this.isOpen && notifs.length > 0) {
          this.unreadCount = notifs.length;
        }
      } catch (e) {
        // ignore errors
      }
    },
    handleNotification(n) {
      this.quickSend(n.action);
      this.dismissNotification(this.notifications.indexOf(n));
    },
    dismissNotification(index) {
      this.notifications.splice(index, 1);
    },
    quickSend(text) {
      this.input = text;
      this.send();
    },
    async send() {
      if (!this.input.trim() || this.loading) return;
      
      const text = this.input.trim();
      this.input = '';
      this.messages.push({ role: 'user', text });
      this.loading = true;
      this.scrollToBottom();

      try {
        const { data } = await chatAxios.post(GENT_URL, { 
          text,
          from: {
            id: localStorage.getItem('soc_user_id') || 'anonymous',
            name: localStorage.getItem('soc_user') || 'User'
          }
        }, { timeout: 120000, withCredentials: false });
        // Handle both text and card format
        const botText = data.text || data.attachments?.[0]?.content?.body?.find(b => b.spacing === 'Medium')?.text || 'ไม่มีการตอบกลับ';
        this.messages.push({ role: 'bot', text: botText });
      } catch (e) {
        this.messages.push({ role: 'bot', text: e.response?.data?.text || '❌ เกิดข้อผิดพลาด' });
      }
      
      this.loading = false;
      this.scrollToBottom();
      this.$nextTick(() => this.$refs.chatInput?.focus());
    },
    clearChat() {
      this.messages = [];
      localStorage.removeItem('gent_chat_history');
    },
    formatMessage(text) {
      return text?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') || '';
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.messagesRef;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  }
};
</script>

<style scoped>
.chat-widget {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  font-family: "Prompt", sans-serif;
}

.chat-toggle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.4);
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.chat-toggle:hover { transform: scale(1.1); }
.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: white;
  font-size: 12px;
  font-weight: bold;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 380px;
  height: 520px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #4A90E2, #D73527);
  color: white;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}
.chat-header span { flex: 1; }
.chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  padding: 4px;
}
.clear-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.clear-btn:hover { background: rgba(255,255,255,0.3); }

.notifications {
  background: #fff3cd;
  border-bottom: 1px solid #ffc107;
  max-height: 120px;
  overflow-y: auto;
}
.notif-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  font-size: 13px;
}
.notif-item:hover { background: rgba(0,0,0,0.05); }
.notif-icon { font-size: 16px; }
.notif-text { flex: 1; color: #856404; }
.notif-close {
  background: none;
  border: none;
  color: #856404;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f9fa;
}

.welcome-msg {
  text-align: center;
  color: #666;
  padding: 20px 0;
}
.welcome-msg p { margin-bottom: 16px; }

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.quick-actions button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.quick-actions button:hover {
  background: #4A90E2;
  color: white;
  border-color: #4A90E2;
}

.message { display: flex; }
.message.user { justify-content: flex-end; }
.message.bot { justify-content: flex-start; }

.bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.user .bubble {
  background: linear-gradient(135deg, #4A90E2, #3a7bc8);
  color: white;
  border-bottom-right-radius: 4px;
}
.bot .bubble {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.typing span {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #4A90E2;
  border-radius: 50%;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out both;
}
.typing span:nth-child(1) { animation-delay: -0.32s; }
.typing span:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input {
  padding: 12px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 8px;
  background: white;
}
.chat-input input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  outline: none;
  font-size: 14px;
}
.chat-input input:focus { border-color: #4A90E2; }
.chat-input button {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4A90E2, #D73527);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chat-input button:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 480px) {
  .chat-widget { bottom: 16px; right: 16px; }
  .chat-panel { width: calc(100vw - 32px); height: 60vh; }
}
</style>
