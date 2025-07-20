export class ChatSystem {
    constructor(networkManager) {
        this.networkManager = networkManager;
        this.messages = [];
        this.maxMessages = 50;
        this.isVisible = false;
        this.isTyping = false;
        
        this.createChatUI();
        this.setupEventListeners();
    }
    
    createChatUI() {
        // Contenedor principal del chat
        this.chatContainer = document.createElement('div');
        this.chatContainer.id = 'chatContainer';
        this.chatContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 400px;
            height: 300px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #333;
            border-radius: 10px;
            z-index: 1000;
            display: none;
            flex-direction: column;
            font-family: Arial, sans-serif;
            color: white;
        `;
        
        // Header del chat
        this.chatHeader = document.createElement('div');
        this.chatHeader.style.cssText = `
            background: #444;
            padding: 10px;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        this.chatHeader.innerHTML = `
            <span style="font-weight: bold;">💬 Chat Multijugador</span>
            <button id="chatCloseBtn" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
        `;
        
        // Área de mensajes
        this.messagesArea = document.createElement('div');
        this.messagesArea.id = 'chatMessages';
        this.messagesArea.style.cssText = `
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 5px;
        `;
        
        // Área de entrada
        this.inputArea = document.createElement('div');
        this.inputArea.style.cssText = `
            padding: 10px;
            border-top: 1px solid #333;
            display: flex;
            gap: 5px;
        `;
        
        this.messageInput = document.createElement('input');
        this.messageInput.type = 'text';
        this.messageInput.placeholder = 'Escribe un mensaje...';
        this.messageInput.style.cssText = `
            flex: 1;
            padding: 8px;
            border: 1px solid #555;
            border-radius: 5px;
            background: #222;
            color: white;
            font-size: 14px;
        `;
        
        this.sendButton = document.createElement('button');
        this.sendButton.textContent = 'Enviar';
        this.sendButton.style.cssText = `
            padding: 8px 15px;
            background: #007bff;
            border: none;
            border-radius: 5px;
            color: white;
            cursor: pointer;
            font-size: 14px;
        `;
        
        // Botón para abrir/cerrar chat
        this.chatToggleBtn = document.createElement('button');
        this.chatToggleBtn.id = 'chatToggleBtn';
        this.chatToggleBtn.innerHTML = '💬';
        this.chatToggleBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 50px;
            height: 50px;
            background: #007bff;
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 20px;
            cursor: pointer;
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Ensamblar UI
        this.inputArea.appendChild(this.messageInput);
        this.inputArea.appendChild(this.sendButton);
        
        this.chatContainer.appendChild(this.chatHeader);
        this.chatContainer.appendChild(this.messagesArea);
        this.chatContainer.appendChild(this.inputArea);
        
        document.body.appendChild(this.chatContainer);
        document.body.appendChild(this.chatToggleBtn);
    }
    
    setupEventListeners() {
        // Toggle del chat
        this.chatToggleBtn.addEventListener('click', () => {
            this.toggleChat();
        });
        
        // Cerrar chat
        document.getElementById('chatCloseBtn').addEventListener('click', () => {
            this.hideChat();
        });
        
        // Enviar mensaje
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enter para enviar
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Focus/blur del input
        this.messageInput.addEventListener('focus', () => {
            this.isTyping = true;
        });
        
        this.messageInput.addEventListener('blur', () => {
            this.isTyping = false;
        });
        
        // Eventos de red
        this.networkManager.on('onChatMessage', (message) => {
            this.addMessage(message);
        });
        
        this.networkManager.on('onPlayerJoined', (player) => {
            this.addSystemMessage(`${player.name} se ha conectado`);
        });
        
        this.networkManager.on('onPlayerLeft', (data) => {
            this.addSystemMessage(`${data.name} se ha desconectado`);
        });
    }
    
    toggleChat() {
        if (this.isVisible) {
            this.hideChat();
        } else {
            this.showChat();
        }
    }
    
    showChat() {
        this.chatContainer.style.display = 'flex';
        this.chatToggleBtn.style.display = 'none';
        this.isVisible = true;
        this.messageInput.focus();
    }
    
    hideChat() {
        this.chatContainer.style.display = 'none';
        this.chatToggleBtn.style.display = 'flex';
        this.isVisible = false;
        this.messageInput.blur();
    }
    
    sendMessage() {
        const message = this.messageInput.value.trim();
        if (message && this.networkManager.isPlayerConnected()) {
            this.networkManager.sendChatMessage(message);
            this.messageInput.value = '';
        }
    }
    
    addMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.style.cssText = `
            padding: 5px 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            font-size: 14px;
            word-wrap: break-word;
        `;
        
        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        const isOwnMessage = message.playerId === this.networkManager.playerId;
        
        messageElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="font-weight: bold; color: ${isOwnMessage ? '#00ff00' : '#ffaa00'};">
                    ${message.playerName}
                </span>
                <span style="font-size: 12px; color: #888;">
                    ${timestamp}
                </span>
            </div>
            <div style="color: white;">
                ${this.escapeHtml(message.message)}
            </div>
        `;
        
        this.messagesArea.appendChild(messageElement);
        this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
        
        // Limitar número de mensajes
        this.messages.push(messageElement);
        if (this.messages.length > this.maxMessages) {
            const oldMessage = this.messages.shift();
            if (oldMessage.parentNode) {
                oldMessage.parentNode.removeChild(oldMessage);
            }
        }
    }
    
    addSystemMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.style.cssText = `
            padding: 5px 10px;
            background: rgba(0, 123, 255, 0.3);
            border-radius: 5px;
            font-size: 12px;
            color: #00aaff;
            text-align: center;
            font-style: italic;
        `;
        
        messageElement.textContent = text;
        
        this.messagesArea.appendChild(messageElement);
        this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
        
        // Limitar número de mensajes
        this.messages.push(messageElement);
        if (this.messages.length > this.maxMessages) {
            const oldMessage = this.messages.shift();
            if (oldMessage.parentNode) {
                oldMessage.parentNode.removeChild(oldMessage);
            }
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    isTyping() {
        return this.isTyping;
    }
    
    destroy() {
        if (this.chatContainer.parentNode) {
            this.chatContainer.parentNode.removeChild(this.chatContainer);
        }
        if (this.chatToggleBtn.parentNode) {
            this.chatToggleBtn.parentNode.removeChild(this.chatToggleBtn);
        }
    }
} 