export class GameServer {
    constructor(io) {
        this.io = io;
        this.players = new Map();
        this.objects = new Map();
        this.nextObjectId = 1;
        
        // Configuración del mundo
        this.worldConfig = {
            size: 1000,
            gravity: -9.8,
            maxPlayers: 20,
            maxObjects: 100
        };
        
        // Estadísticas
        this.stats = {
            totalConnections: 0,
            currentConnections: 0,
            objectsCreated: 0,
            lastCleanup: Date.now()
        };
        
        // Configurar limpieza automática
        this.setupAutoCleanup();
        
        // Iniciar loop del servidor
        this.startGameLoop();
    }
    
    setupAutoCleanup() {
        // Limpiar cada 30 segundos
        setInterval(() => {
            this.cleanupOldObjects();
            this.cleanupDisconnectedPlayers();
        }, 30000);
    }
    
    startGameLoop() {
        // Loop del servidor a 60 FPS
        setInterval(() => {
            this.update();
        }, 1000 / 60);
    }
    
    cleanupOldObjects() {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutos
        
        for (const [id, object] of this.objects) {
            if (now - object.createdAt > maxAge) {
                this.objects.delete(id);
                this.io.emit('object:deleted', { id });
            }
        }
    }
    
    cleanupDisconnectedPlayers() {
        const now = Date.now();
        const timeout = 10 * 1000; // 10 segundos
        
        for (const [id, player] of this.players) {
            if (now - player.lastUpdate > timeout) {
                this.removePlayer(id);
            }
        }
    }
    
    // Gestión de jugadores
    addPlayer(socket) {
        // Verificar límite de jugadores
        if (this.players.size >= this.worldConfig.maxPlayers) {
            socket.emit('error', { message: 'Servidor lleno' });
            socket.disconnect();
            return;
        }
        
        const player = {
            id: socket.id,
            name: `Jugador_${socket.id.slice(0, 6)}`,
            position: { x: 0, y: 2, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            health: 100,
            energy: 100,
            connectedAt: Date.now(),
            lastUpdate: Date.now()
        };
        
        this.players.set(socket.id, player);
        this.stats.totalConnections++;
        this.stats.currentConnections = this.players.size;
        
        // Enviar estado inicial al jugador
        const gameData = {
            playerId: socket.id,
            players: Array.from(this.players.values()),
            objects: Array.from(this.objects.values()),
            worldConfig: this.worldConfig
        };
        
        socket.emit('game:init', gameData);
        
        // Notificar a otros jugadores
        socket.broadcast.emit('player:joined', player);
    }
    
    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            this.players.delete(playerId);
            this.stats.currentConnections = this.players.size;
            
            this.io.emit('player:left', { id: playerId, name: player.name });
        }
    }
    
    updatePlayerPosition(socket, data) {
        const player = this.players.get(socket.id);
        if (player) {
            player.position = data;
            player.lastUpdate = Date.now();
            
            // Broadcast a otros jugadores (excluyendo al emisor)
            socket.broadcast.emit('player:moved', {
                id: socket.id,
                position: player.position
            });
        }
    }
    
    updatePlayerRotation(socket, data) {
        const player = this.players.get(socket.id);
        if (player) {
            player.rotation = data;
            player.lastUpdate = Date.now();
            
            // Broadcast a otros jugadores (excluyendo al emisor)
            socket.broadcast.emit('player:rotated', {
                id: socket.id,
                rotation: player.rotation
            });
        }
    }
    
    // Gestión de objetos
    createObject(socket, data) {
        // Verificar límite de objetos
        if (this.objects.size >= this.worldConfig.maxObjects) {
            socket.emit('error', { message: 'Límite de objetos alcanzado' });
            return;
        }

        const objectId = `obj_${this.nextObjectId++}`;
        const object = {
            id: objectId,
            creatorId: socket.id,
            type: data.type,
            name: data.name,
            specificAsset: data.specificAsset, // Agregar asset específico
            position: data.position || { x: 0, y: 0, z: 0 },
            rotation: data.rotation || { x: 0, y: 0, z: 0 },
            scale: data.scale || { x: 1, y: 1, z: 1 },
            material: data.material,
            color: data.color,
            physics: data.physics || true,
            createdAt: Date.now()
        };
        
        this.objects.set(objectId, object);
        this.stats.objectsCreated++;
        
        // Broadcast a todos los jugadores (incluyendo al creador)
        this.io.emit('object:created', object);
    }
    
    moveObject(socket, data) {
        const object = this.objects.get(data.objectId);
        if (object) {
            object.position = data.position;
            object.rotation = data.rotation;
            object.lastMoved = Date.now();
            
            // Broadcast a otros jugadores
            socket.broadcast.emit('object:moved', {
                id: data.objectId,
                position: object.position,
                rotation: object.rotation
            });
        }
    }
    
    deleteObject(socket, data) {
        const objectId = data.id;
        
        if (this.objects.has(objectId)) {
            this.objects.delete(objectId);
            this.io.emit('object:deleted', { id: objectId });
        }
    }
    
    clearAllObjects(socket) {
        // Limpiar todos los objetos
        this.objects.clear();
        
        // Notificar a todos los clientes
        this.io.emit('objects:cleared');
        
        console.log(`🧹 Todos los objetos limpiados por ${socket.id}`);
    }
    
    // Chat
    broadcastChat(playerId, data) {
        const player = this.players.get(playerId);
        if (player) {
            const message = {
                id: Date.now(),
                playerId: playerId,
                playerName: player.name,
                message: data.message,
                timestamp: Date.now()
            };
            
            this.io.emit('chat:message', message);
        }
    }
    
    // Métodos de utilidad
    getPlayerCount() {
        return this.players.size;
    }
    
    getObjectCount() {
        return this.objects.size;
    }
    
    getStats() {
        return {
            ...this.stats,
            players: this.players.size,
            objects: this.objects.size,
            uptime: process.uptime()
        };
    }
    
    update() {
        // Actualizar física de objetos (solo si hay objetos)
        if (this.objects.size > 0) {
            this.updatePhysics();
        }
        
        // Limpiar jugadores desconectados
        this.cleanupDisconnectedPlayers();
        
        // Enviar estado del mundo cada 15 segundos
        if (Date.now() % 15000 < 100) {
            this.broadcastWorldState();
        }
    }
    
    updatePhysics() {
        // Física simple para objetos
        for (const [id, object] of this.objects) {
            if (object.physics && object.position) {
                // Aplicar gravedad
                if (object.position.y > 0) {
                    object.position.y += this.worldConfig.gravity * 0.016; // 60 FPS
                    
                    // Colisión con el suelo
                    if (object.position.y <= 0) {
                        object.position.y = 0;
                    }
                }
            }
        }
    }
    
    broadcastWorldState() {
        const worldState = {
            players: Array.from(this.players.values()),
            objects: Array.from(this.objects.values()),
            timestamp: Date.now()
        };
        
        this.io.emit('world:state', worldState);
    }
} 