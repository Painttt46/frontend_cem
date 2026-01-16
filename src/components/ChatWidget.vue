<template>
  <div class="chat-widget">
    <!-- Toggle Button -->
    <button class="chat-toggle" @click="isOpen = !isOpen">
      <i :class="isOpen ? 'pi pi-times' : 'pi pi-comments'" />
    </button>

    <!-- Chat Panel -->
    <div v-show="isOpen" class="chat-panel">
      <div class="chat-header">
        <img src="/GENT.svg" alt="Gent" class="chat-avatar" />
        <span>Gent Assistant</span>
      </div>

      <div class="chat-messages" ref="messagesRef">
        <div v-for="(msg, i) in messages" :key="i" :class="['message', msg.role]">
          <div class="bubble" v-html="formatMessage(msg.text)"></div>
        </div>
        <div v-if="loading" class="message bot">
          <div class="bubble typing">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <input 
          v-model="input" 
          @keyup.enter="send" 
          placeholder="พิมพ์ข้อความ..." 
          :disabled="loading"
        />
        <button @click="send" :disabled="loading || !input.trim()">
          <i class="pi pi-send" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

// สร้าง axios instance แยกสำหรับ chat bot
const chatApi = axios.create({
  baseURL: process.env.VUE_APP_GENT_URL || 'http://localhost:3000/api/webhook',
  timeout: 120000,
  withCredentials: false
});

export default {
  name: 'ChatWidget',
  data() {
    return {
      isOpen: false,
      input: '',
      messages: [],
      loading: false
    };
  },
  methods: {
    async send() {
      if (!this.input.trim() || this.loading) return;
      
      const text = this.input.trim();
      this.input = '';
      this.messages.push({ role: 'user', text });
      this.loading = true;
      this.scrollToBottom();

      try {
        const { data } = await chatApi.post('', { text });
        this.messages.push({ role: 'bot', text: data.text || 'ไม่มีการตอบกลับ' });
      } catch (e) {
        const errText = e.response?.data?.text || '❌ เกิดข้อผิดพลาด กรุณาลองใหม่';
        this.messages.push({ role: 'bot', text: errText });
      }
      
      this.loading = false;
      this.scrollToBottom();
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
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chat-toggle:hover { 
  transform: scale(1.1); 
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.5);
}

.chat-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 360px;
  height: 480px;
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
  font-size: 15px;
}
.chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  padding: 4px;
  object-fit: contain;
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
  font-family: inherit;
}
.chat-input input:focus { 
  border-color: #4A90E2; 
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}
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
  transition: transform 0.2s;
}
.chat-input button:hover:not(:disabled) { transform: scale(1.05); }
.chat-input button:disabled { opacity: 0.5; cursor: not-allowed; }

/* Mobile responsive */
@media (max-width: 480px) {
  .chat-widget {
    bottom: 16px;
    right: 16px;
  }
  .chat-panel {
    width: calc(100vw - 32px);
    height: 60vh;
    right: 0;
  }
}
</style>
