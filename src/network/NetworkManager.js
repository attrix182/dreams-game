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
        
        // Configuración de red
        this.updateInterval = 100; // ms
        this.lastUpdate = 0;
        
        // Usar configuración
        this.serverUrl = config.serverUrl;
    }
    
    connect() {
        try {
            this.socket = io(this.serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true
            });
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
            this.trigger('onConnect');
        });
        
        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.trigger('onDisconnect');
        });
        
        this.socket.on('connect_error', (error) => {
            this.isConnected = false;
            this.trigger('onConnectError', error);
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
            
            this.trigger('onGameInit', data);
        });
        
        // Eventos de jugadores
        this.socket.on('player:joined', (player) => {
            this.players.set(player.id, player);
            this.trigger('onPlayerJoined', player);
        });
        
        this.socket.on('player:left', (data) => {
            this.players.delete(data.id);
            this.trigger('onPlayerLeft', data);
        });
        
        this.socket.on('player:moved', (data) => {
            const player = this.players.get(data.id);
            if (player) {
                player.position = data.position;
                this.trigger('onPlayerMoved', data);
            }
        });
        
        this.socket.on('player:rotated', (data) => {
            const player = this.players.get(data.id);
            if (player) {
                player.rotation = data.rotation;
                this.trigger('onPlayerRotated', data);
            }
        });
        
        // Objetos
        this.socket.on('object:created', (object) => {
            this.objects.set(object.id, object);
            this.trigger('onObjectCreated', object);
        });
        
        this.socket.on('object:moved', (data) => {
            const object = this.objects.get(data.id);
            if (object) {
                object.position = data.position;
                object.rotation = data.rotation;
                this.trigger('onObjectMoved', data);
            }
        });
        
        this.socket.on('object:deleted', (data) => {
            this.objects.delete(data.id);
            this.trigger('onObjectDeleted', data);
        });
        
        this.socket.on('objects:cleared', () => {
            this.objects.clear();
            this.trigger('onObjectsCleared');
        });
        
        // Chat
        this.socket.on('chat:message', (message) => {
            this.trigger('onChatMessage', message);
        });
        
        // Eventos del juego (minijuegos)
        this.socket.on('game:event', (event) => {
            console.log('📡 Evento del juego recibido en NetworkManager:', event.type, 'gameId:', event.gameId);
            this.trigger('onGameEvent', event);
        });
        
        // Estado del mundo
        this.socket.on('world:state', (state) => {
            this.trigger('onWorldState', state);
        });
        
        // Errores
        this.socket.on('error', (error) => {
            this.trigger('onError', error);
        });
    }
    
    // Envío de datos con throttling
    sendPlayerMove(position) {
        if (this.isConnected && this.socket) {
            const now = Date.now();
            if (now - this.lastUpdate > this.updateInterval) {
                this.socket.emit('player:move', {
                    x: position.x,
                    y: position.y,
                    z: position.z
                });
                this.lastUpdate = now;
            }
        }
    }
    
    sendPlayerRotate(rotation) {
        if (this.isConnected && this.socket) {
            this.socket.emit('player:rotate', {
                x: rotation.x,
                y: rotation.y,
                z: rotation.z
            });
        }
    }
    
    sendObjectCreate(objectData) {
        if (this.isConnected && this.socket) {
            this.socket.emit('object:create', {
                type: objectData.type,
                name: objectData.name,
                position: {
                    x: objectData.position.x,
                    y: objectData.position.y,
                    z: objectData.position.z
                },
                rotation: {
                    x: objectData.rotation.x,
                    y: objectData.rotation.y,
                    z: objectData.rotation.z
                },
                scale: {
                    x: objectData.scale.x,
                    y: objectData.scale.y,
                    z: objectData.scale.z
                },
                material: objectData.material,
                color: objectData.color,
                physics: objectData.physics
            });
        }
    }
    
    sendObjectMove(objectId, position, rotation) {
        if (this.isConnected && this.socket) {
            this.socket.emit('object:move', {
                objectId,
                position: {
                    x: position.x,
                    y: position.y,
                    z: position.z
                },
                rotation: {
                    x: rotation.x,
                    y: rotation.y,
                    z: rotation.z
                }
            });
        }
    }
    
    sendObjectDelete(objectId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('object:delete', { id: objectId });
        }
    }
    
    sendClearAllObjects() {
        if (this.socket && this.isConnected) {
            this.socket.emit('objects:clear');
        }
    }
    
    sendChatMessage(message) {
        if (this.isConnected && this.socket) {
            this.socket.emit('chat:message', { message });
        }
    }
    
    sendGameEvent(eventData) {
        if (this.isConnected && this.socket) {
            console.log('📡 Enviando evento del juego:', eventData.type, 'gameId:', eventData.gameId);
            this.socket.emit('game:event', eventData);
        } else {
            console.log('❌ No se pudo enviar evento del juego: connected=', this.isConnected, 'socket=', !!this.socket);
        }
    }
    
    // Callbacks
    on(event, callback) {
        this.callbacks.set(event, callback);
    }
    
    off(event) {
        this.callbacks.delete(event);
    }
    
    // Método helper para disparar eventos
    trigger(event, data) {
        if (this.callbacks.has(event)) {
          //  console.log('📡 Disparando evento:', event, 'con datos:', data?.type || 'sin tipo');
            this.callbacks.get(event)(data);
        } else {
            //console.log('❌ No hay callback registrado para evento:', event);
        }
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