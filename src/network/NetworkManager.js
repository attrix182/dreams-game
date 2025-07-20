import { io } from 'socket.io-client';

export class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.playerId = null;
        this.players = new Map();
        this.objects = new Map();
        this.callbacks = new Map();
        
        // Configuración
        this.serverUrl = 'http://localhost:3001';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000;
        
        // Estadísticas
        this.stats = {
            messagesSent: 0,
            messagesReceived: 0,
            lastPing: 0
        };
    }
    
    // Conexión
    connect() {
        try {
            console.log('🌐 Conectando al servidor:', this.serverUrl);
            
            this.socket = io(this.serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 30000,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay,
                reconnectionDelayMax: 5000
            });
            
            this.setupEventListeners();
            
        } catch (error) {
            console.error('❌ Error al conectar:', error);
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
            console.log('🔌 Desconectado del servidor');
        }
    }
    
    setupEventListeners() {
        // Conexión
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.stats.lastPing = Date.now();
            console.log('✅ Conectado al servidor:', this.socket.id);
            
            if (this.callbacks.has('onConnect')) {
                this.callbacks.get('onConnect')();
            }
        });
        
        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            console.log('🔌 Desconectado del servidor:', reason);
            
            if (this.callbacks.has('onDisconnect')) {
                this.callbacks.get('onDisconnect')();
            }
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('❌ Error de conexión:', error);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('❌ Máximo de intentos de reconexión alcanzado');
            }
        });
        
        this.socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Reconectado después de', attemptNumber, 'intentos');
        });
        
        this.socket.on('reconnect_error', (error) => {
            console.error('❌ Error de reconexión:', error);
        });
        
        this.socket.on('reconnect_failed', () => {
            console.error('❌ Falló la reconexión después de', this.maxReconnectAttempts, 'intentos');
        });
        
        // Inicialización del juego
        this.socket.on('game:init', (data) => {
            this.playerId = data.playerId;
            
            // Limpiar y cargar jugadores existentes
            this.players.clear();
            data.players.forEach(player => {
                if (player.id !== this.playerId) {
                    this.players.set(player.id, player);
                }
            });
            
            // Limpiar y cargar objetos existentes
            this.objects.clear();
            data.objects.forEach(obj => {
                this.objects.set(obj.id, obj);
            });
            
            if (this.callbacks.has('onGameInit')) {
                this.callbacks.get('onGameInit')(data);
            }
        });
        
        // Jugadores
        this.socket.on('player:joined', (player) => {
            this.players.set(player.id, player);
            
            if (this.callbacks.has('onPlayerJoined')) {
                this.callbacks.get('onPlayerJoined')(player);
            }
        });
        
        this.socket.on('player:left', (data) => {
            const player = this.players.get(data.id);
            this.players.delete(data.id);
            
            if (this.callbacks.has('onPlayerLeft')) {
                this.callbacks.get('onPlayerLeft')(data);
            }
        });
        
        this.socket.on('player:moved', (data) => {
            console.log('📥 Evento player:moved recibido:', data);
            const player = this.players.get(data.id);
            if (player) {
                player.position = data.position;
                
                if (this.callbacks.has('onPlayerMoved')) {
                    this.callbacks.get('onPlayerMoved')(data);
                }
            } else {
                console.log('⚠️ Jugador no encontrado en player:moved:', data.id);
            }
        });
        
        this.socket.on('player:rotated', (data) => {
            console.log('📥 Evento player:rotated recibido:', data);
            const player = this.players.get(data.id);
            if (player) {
                player.rotation = data.rotation;
                
                if (this.callbacks.has('onPlayerRotated')) {
                    this.callbacks.get('onPlayerRotated')(data);
                }
            } else {
                console.log('⚠️ Jugador no encontrado en player:rotated:', data.id);
            }
        });
        
        // Objetos
        this.socket.on('object:created', (object) => {
            this.objects.set(object.id, object);
            
            if (this.callbacks.has('onObjectCreated')) {
                this.callbacks.get('onObjectCreated')(object);
            }
        });
        
        this.socket.on('object:moved', (data) => {
            const object = this.objects.get(data.id);
            if (object) {
                object.position = data.position;
                object.rotation = data.rotation;
                
                if (this.callbacks.has('onObjectMoved')) {
                    this.callbacks.get('onObjectMoved')(data);
                }
            }
        });
        
        this.socket.on('object:deleted', (data) => {
            const object = this.objects.get(data.id);
            this.objects.delete(data.id);
            
            if (this.callbacks.has('onObjectDeleted')) {
                this.callbacks.get('onObjectDeleted')(data);
            }
        });
        
        // Chat
        this.socket.on('chat:message', (message) => {
            if (this.callbacks.has('onChatMessage')) {
                this.callbacks.get('onChatMessage')(message);
            }
        });
        
        // Estado del mundo
        this.socket.on('world:state', (state) => {
            // Solo agregar jugadores que no existen localmente (para evitar duplicaciones)
            state.players.forEach(player => {
                if (player.id !== this.playerId && !this.players.has(player.id)) {
                    this.players.set(player.id, player);
                }
            });
            
            // Solo agregar objetos que no existen localmente (para evitar duplicaciones)
            state.objects.forEach(obj => {
                if (!this.objects.has(obj.id)) {
                    this.objects.set(obj.id, obj);
                }
            });
            
            if (this.callbacks.has('onWorldState')) {
                this.callbacks.get('onWorldState')(state);
            }
        });
    }
    
    // Envío de datos
    sendPlayerMove(position) {
        if (this.isConnected) {
            console.log('📤 Enviando movimiento:', position);
            this.socket.emit('player:move', position);
        } else {
            console.log('⚠️ No conectado, no se puede enviar movimiento');
        }
    }
    
    sendPlayerRotate(rotation) {
        if (this.isConnected) {
            console.log('📤 Enviando rotación:', rotation);
            this.socket.emit('player:rotate', rotation);
        } else {
            console.log('⚠️ No conectado, no se puede enviar rotación');
        }
    }
    
    sendObjectCreate(objectData) {
        if (this.isConnected) {
            this.socket.emit('object:create', objectData);
        }
    }
    
    sendObjectMove(objectId, position, rotation) {
        if (this.isConnected) {
            this.socket.emit('object:move', { objectId, position, rotation });
        }
    }
    
    sendObjectDelete(objectId) {
        if (this.isConnected) {
            this.socket.emit('object:delete', { objectId });
        }
    }
    
    sendChatMessage(message) {
        if (this.isConnected) {
            this.socket.emit('chat:message', { message });
        }
    }
    
    // Callbacks
    on(event, callback) {
        this.callbacks.set(event, callback);
    }
    
    off(event) {
        this.callbacks.delete(event);
    }
    
    // Utilidades
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    
    getObject(objectId) {
        return this.objects.get(objectId);
    }
    
    getAllPlayers() {
        return Array.from(this.players.values());
    }
    
    getAllObjects() {
        return Array.from(this.objects.values());
    }
    
    getPlayerCount() {
        return this.players.size;
    }
    
    getObjectCount() {
        return this.objects.size;
    }
    
    isPlayerConnected() {
        return this.isConnected && this.playerId !== null;
    }
} 