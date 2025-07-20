import { io } from 'socket.io-client';
import { config } from '../config.js';

export class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.playerId = null;
        this.players = new Map();
        this.objects = new Map();
        this.callbacks = new Map();
        
        // Usar configuración
        this.serverUrl = config.serverUrl;
    }
    
    connect() {
        try {
            this.socket = io(this.serverUrl);
            this.setupEventListeners();
        } catch (error) {
            // Error silencioso
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.playerId = null;
    }
    
    setupEventListeners() {
        if (!this.socket) return;
        
        // Conexión
        this.socket.on('connect', () => {
            this.isConnected = true;
            
            if (this.callbacks.has('onConnect')) {
                this.callbacks.get('onConnect')();
            }
        });
        
        this.socket.on('disconnect', () => {
            this.isConnected = false;
            
            if (this.callbacks.has('onDisconnect')) {
                this.callbacks.get('onDisconnect')();
            }
        });
        
        // Inicialización del juego
        this.socket.on('game:init', (data) => {
            this.playerId = data.playerId;
            
            // Limpiar datos existentes
            this.players.clear();
            this.objects.clear();
            
            // Cargar jugadores existentes
            data.players.forEach(player => {
                if (player.id !== this.playerId) {
                    this.players.set(player.id, player);
                }
            });
            
            // Cargar objetos existentes
            data.objects.forEach(obj => {
                this.objects.set(obj.id, obj);
            });
            
            if (this.callbacks.has('onGameInit')) {
                this.callbacks.get('onGameInit')(data);
            }
        });
        
        // Jugadores
        this.socket.on('player:joined', (player) => {
            console.log('📥 Jugador se unió (NetworkManager):', player.name, 'ID:', player.id);
            this.players.set(player.id, player);
            
            if (this.callbacks.has('onPlayerJoined')) {
                this.callbacks.get('onPlayerJoined')(player);
            }
        });
        
        this.socket.on('player:left', (data) => {
            console.log('📥 Jugador se fue (NetworkManager):', data.name, 'ID:', data.id);
            this.players.delete(data.id);
            
            if (this.callbacks.has('onPlayerLeft')) {
                this.callbacks.get('onPlayerLeft')(data);
            }
        });
        
        this.socket.on('player:moved', (data) => {
            console.log('📥 Jugador movido (NetworkManager):', data.id, 'posición:', data.position);
            const player = this.players.get(data.id);
            if (player) {
                player.position = data.position;
                
                if (this.callbacks.has('onPlayerMoved')) {
                    this.callbacks.get('onPlayerMoved')(data);
                }
            }
        });
        
        this.socket.on('player:rotated', (data) => {
            const player = this.players.get(data.id);
            if (player) {
                player.rotation = data.rotation;
                
                if (this.callbacks.has('onPlayerRotated')) {
                    this.callbacks.get('onPlayerRotated')(data);
                }
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
    }
    
    // Envío de datos
    sendPlayerMove(position) {
        if (this.isConnected && this.socket) {
            console.log('📤 Enviando movimiento:', position);
            this.socket.emit('player:move', position);
        }
    }
    
    sendPlayerRotate(rotation) {
        if (this.isConnected && this.socket) {
            console.log('📤 Enviando rotación:', rotation);
            this.socket.emit('player:rotate', rotation);
        }
    }
    
    sendObjectCreate(objectData) {
        if (this.isConnected && this.socket) {
            this.socket.emit('object:create', objectData);
        }
    }
    
    sendObjectMove(objectId, position, rotation) {
        if (this.isConnected && this.socket) {
            this.socket.emit('object:move', { objectId, position, rotation });
        }
    }
    
    sendObjectDelete(objectId) {
        if (this.isConnected && this.socket) {
            this.socket.emit('object:delete', { objectId });
        }
    }
    
    sendChatMessage(message) {
        if (this.isConnected && this.socket) {
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