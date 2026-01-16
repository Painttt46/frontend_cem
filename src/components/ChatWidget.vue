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
        const { data } = await axios.post(process.env.VUE_APP_GENT_URL || 'http://localhost:3000/api/webhook', { text });
        this.messages.push({ role: 'bot', text: data.text || 'ไม่มีการตอบกลับ' });
      } catch (e) {
        this.messages.push({ role: 'bot', text: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่' });
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
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: inherit;
}

.chat-toggle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: transform 0.2s;
}
.chat-toggle:hover { transform: scale(1.1); }

.chat-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 350px;
  height: 450px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}
.chat-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message { display: flex; }
.message.user { justify-content: flex-end; }
.message.bot { justify-content: flex-start; }

.bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.4;
}
.user .bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}
.bot .bubble {
  background: #f0f0f0;
  color: #333;
  border-bottom-left-radius: 4px;
}

.typing span {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #999;
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
}
.chat-input input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
}
.chat-input input:focus { border-color: #667eea; }
.chat-input button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  cursor: pointer;
}
.chat-input button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
