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
            maxPlayers: 20, // Reducido para menor consumo
            maxObjects: 100 // Límite de objetos para evitar sobrecarga
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
        
        // Iniciar loop del servidor optimizado
        this.startGameLoop();
        
        console.log('🎮 GameServer iniciado (modo optimizado)');
    }
    
    setupAutoCleanup() {
        // Limpiar objetos antiguos cada 5 minutos
        setInterval(() => {
            this.cleanupOldObjects();
        }, 5 * 60 * 1000);
        
        // Limpiar estadísticas cada hora
        setInterval(() => {
            this.cleanupStats();
        }, 60 * 60 * 1000);
    }
    
    cleanupOldObjects() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutos
        
        for (const [objectId, object] of this.objects) {
            if (now - object.createdAt > maxAge) {
                this.objects.delete(objectId);
                this.io.emit('object:deleted', { id: objectId });
            }
        }
    }
    
    cleanupStats() {
        // Resetear contadores para evitar desbordamiento
        this.stats.totalConnections = Math.min(this.stats.totalConnections, 1000000);
        this.stats.objectsCreated = Math.min(this.stats.objectsCreated, 1000000);
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
        
        console.log(`👤 Jugador conectado: ${player.name} (${this.players.size}/${this.worldConfig.maxPlayers})`);
        
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
        
        // Enviar estado completo a todos los jugadores
        this.broadcastWorldState();
    }
    
    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            this.players.delete(playerId);
            this.stats.currentConnections = this.players.size;
            
            this.io.emit('player:left', { id: playerId, name: player.name });
            console.log(`👤 Jugador desconectado: ${player.name} (${this.players.size}/${this.worldConfig.maxPlayers})`);
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
            
        } else {
            console.log('⚠️ Jugador no encontrado para actualizar posición:', socket.id);
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
            
    
        } else {
            console.log('⚠️ Jugador no encontrado para actualizar rotación:', socket.id);
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
        const object = this.objects.get(data.objectId);
        if (object) {
            this.objects.delete(data.objectId);
            
            // Broadcast a todos los jugadores
            this.io.emit('object:deleted', { id: data.objectId });
            
        }
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
    
    // Utilidades
    getPlayerCount() {
        return this.players.size;
    }
    
    getObjectCount() {
        return this.objects.size;
    }
    
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    
    getObject(objectId) {
        return this.objects.get(objectId);
    }
    
    // Loop del servidor
    startGameLoop() {
        setInterval(() => {
            this.update();
        }, 1000 / 10); // 10 FPS para el servidor (más eficiente)
    }
    
    update() {
        // Actualizar física de objetos (solo si hay objetos)
        if (this.objects.size > 0) {
            this.updatePhysics();
        }
        
        // Limpiar jugadores desconectados
        this.cleanupDisconnectedPlayers();
        
        // Enviar estado del mundo cada 15 segundos (menos frecuente)
        if (Date.now() % 15000 < 100) {
            this.broadcastWorldState();
        }
        
        // Log de estadísticas cada 2 minutos
        if (Date.now() % 120000 < 100) {
            console.log(`📊 Estadísticas: ${this.players.size} jugadores, ${this.objects.size} objetos`);
        }
    }
    
    updatePhysics() {
        // Simular física simple en el servidor (optimizado)
        const now = Date.now();
        for (const [objectId, object] of this.objects) {
            if (object.physics && object.position.y > 0) {
                // Aplicar gravedad solo si el objeto no se ha movido recientemente
                if (!object.lastMoved || now - object.lastMoved > 1000) {
                    object.position.y -= 0.1;
                    
                    // Colisión con el suelo
                    if (object.position.y <= 0) {
                        object.position.y = 0;
                    }
                }
            }
        }
    }
    
    cleanupDisconnectedPlayers() {
        const now = Date.now();
        const timeout = 120000; // 2 minutos (más permisivo)
        
        for (const [playerId, player] of this.players) {
            if (now - player.lastUpdate > timeout) {
                console.log(`⏰ Timeout de jugador: ${player.name} (${Math.round((now - player.lastUpdate) / 1000)}s)`);
                this.removePlayer(playerId);
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