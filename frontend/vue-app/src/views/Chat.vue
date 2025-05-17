<template>
  <div class="chat-page">
    <div class="chat-container">
      <div class="sidebar">
        <div class="user-info">
          <div class="avatar">{{ getUserInitials() }}</div>
          <div class="user-name">{{ userName }}</div>
        </div>
        
        <div class="channels-section">
          <h3>Canales</h3>
          <div 
            v-for="channel in channels" 
            :key="channel.id"
            :class="['channel', { active: currentChannel === channel.id }]"
            @click="setCurrentChannel(channel.id)"
          >
            <span class="channel-name">{{ channel.name }}</span>
          </div>
        </div>
        
        <div class="logout-wrapper">
          <button class="logout-button" @click="logout">
            <i class="fas fa-sign-out-alt"></i> Cerrar sesión
          </button>
        </div>
      </div>
      
      <div class="chat-main">
        <div class="chat-header">
          <h2># {{ getCurrentChannelName() }}</h2>
        </div>
        
        <div class="messages" ref="messagesContainer">
          <div v-for="(message, index) in messages" :key="index" :class="['message', { 'own-message': message.userId === userId }]">
            <div class="message-avatar">{{ getMessageInitials(message) }}</div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-author">{{ message.author }}</span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="message-text">{{ message.text }}</div>
            </div>
          </div>
        </div>
        
        <div class="message-input">
          <input 
            type="text" 
            v-model="newMessage" 
            @keyup.enter="sendMessage"
            placeholder="Escribe un mensaje..." 
          />
          <button class="send-button" @click="sendMessage">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client'

export default {
  name: 'ChatView',
  data() {
    return {
      socket: null,
      user: null, // objeto con _id y name
      channels: [
        { id: 'general', name: 'General' },
        { id: 'soporte', name: 'Soporte' }
      ],
      currentChannel: 'general',
      messages: [],
      newMessage: ''
    }
  },
  mounted() {
    const storedUser = JSON.parse(localStorage.getItem('user'))

    if (!storedUser || !storedUser._id) {
      this.$router.push('/login')
      return
    }

    this.user = storedUser
    this.initializeSocketConnection()
    this.fetchMessages()
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect()
    }
  },
  methods: {
    initializeSocketConnection() {
      this.socket = io('http://localhost:3000')

      this.socket.on('connect', () => {
        console.log('Conectado al servidor')
        this.socket.emit('join_channel', this.currentChannel)
      })

      this.socket.on('new_message', (msg) => {
        if (msg.channel === this.currentChannel) {
          this.messages.push({
            userId: msg.user._id,
            author: msg.user.name,
            text: msg.text,
            timestamp: msg.timestamp
          })
          this.$nextTick(this.scrollToBottom)
        }
      })
    },

    fetchMessages() {
      const token = localStorage.getItem('token')

      fetch(`http://localhost:3000/api/messages/${this.currentChannel}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) {
            if (res.status === 401) {
              this.logout()
              return []
            }
            throw new Error('Error al obtener mensajes')
          }
          return res.json()
        })
        .then(data => {
          this.messages = data.map(msg => ({
            userId: msg.user._id,
            author: msg.user.name,
            text: msg.text,
            timestamp: msg.timestamp
          }))
          this.$nextTick(this.scrollToBottom)
        })
        .catch(err => console.error('Error al cargar mensajes:', err))
    },

    sendMessage() {
      if (!this.newMessage.trim()) return

      const messagePayload = {
        channel: this.currentChannel,
        text: this.newMessage.trim(),
        userId: this.user._id
      }

      this.socket.emit('send_message', messagePayload)

      this.newMessage = ''
    },

    setCurrentChannel(channelId) {
      if (this.currentChannel === channelId) return

      this.currentChannel = channelId
      this.messages = []

      this.socket.emit('join_channel', this.currentChannel)
      this.fetchMessages()
    },

    getCurrentChannelName() {
      const channel = this.channels.find(c => c.id === this.currentChannel)
      return channel ? channel.name : this.currentChannel
    },

    getUserInitials() {
      if (!this.user?.name) return '?'
      return this.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    },

    getMessageInitials(message) {
      if (!message.author) return '?'
      return message.author.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    },

    formatTime(timestamp) {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },

    scrollToBottom() {
      if (this.$refs.messagesContainer) {
        this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight
      }
    },

    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (this.socket) {
        this.socket.disconnect()
      }
      this.$router.push('/login')
    }
  }
}
</script>


<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  background-color: #f5f7fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.chat-container {
  display: flex;
  width: 100%;
  height: 100%;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

/* Sidebar styles */
.sidebar {
  width: 260px;
  background-color: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
}

.user-info {
  padding: 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 36px;
  height: 36px;
  background-color: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 10px;
}

.user-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channels-section {
  flex: 1;
  padding: 15px 0;
  overflow-y: auto;
}

.channels-section h3 {
  padding: 0 20px;
  margin-bottom: 10px;
  font-size: 14px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.channel {
  padding: 8px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  transition: background-color 0.2s;
}

.channel:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.channel.active {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.channel-name {
  font-weight: 500;
}

.logout-wrapper {
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-button {
  width: 100%;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
}

.logout-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Chat main area */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
}

.chat-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e1e4e8;
  display: flex;
  align-items: center;
}

.chat-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  display: flex;
  align-items: flex-start;
  max-width: 80%;
}

.own-message {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  background-color: #95a5a6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin: 0 10px;
  flex-shrink: 0;
}

.own-message .message-avatar {
  background-color: #3498db;
}

.message-content {
  background-color: #f1f3f5;
  padding: 10px 15px;
  border-radius: 12px;
  position: relative;
}

.own-message .message-content {
  background-color: #eaf4fd;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 13px;
}

.message-author {
  font-weight: 600;
  color: #2c3e50;
}

.message-time {
  color: #95a5a6;
}

.message-text {
  word-break: break-word;
}

.message-input {
  padding: 15px 20px;
  border-top: 1px solid #e1e4e8;
  display: flex;
  align-items: center;
}

.message-input input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #dddfe2;
  border-radius: 30px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.message-input input:focus {
  border-color: #3498db;
}

.send-button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin-left: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.send-button:hover {
  background-color: #2980b9;
}
</style>