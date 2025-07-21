import { ASSET_MAPPING } from '../config/AssetConfig.js';
import * as THREE from 'three';

export class SimpleTreasureGame {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.treasures = [];
        this.collectedTreasures = new Set();
        this.playerScores = new Map();
        this.gameUI = null;
        this.treasureCount = 5; // Generar 5 tesoros
        this.gameId = null; // ID único del juego para sincronización
        this.isHost = false; // Si este jugador es el host del juego
        
        // Escuchar eventos de red automáticamente
        this.setupNetworkListener();
    }

    start() {
        console.log('🎯 ¡SimpleTreasureGame iniciado!');
        this.isActive = true;
        this.collectedTreasures.clear();
        this.playerScores.clear();
        
        // Generar ID único del juego
        this.gameId = 'treasure_game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Determinar si este jugador es el host (el que inicia el juego)
        this.isHost = true;
        
        // Generar tesoros solo si es el host
        if (this.isHost) {
            this.generateTreasures();
        }
        
        // Crear UI del juego
        this.createGameUI();
        
        // Mostrar mensaje de inicio
        this.showGameMessage('🎯 ¡Caza del Tesoro Iniciada! Encuentra todos los objetos brillantes.');
        
        // Enviar evento de inicio a otros jugadores si estamos en multiplayer
        if (this.game.isMultiplayer && this.game.networkManager && this.game.networkManager.isConnected) {
            console.log('📡 Enviando evento treasure_game_start a otros jugadores...');
            console.log('📡 Datos del evento:', {
                type: 'treasure_game_start',
                gameId: this.gameId,
                isHost: true
            });
            
            this.game.networkManager.sendGameEvent({
                type: 'treasure_game_start',
                gameId: this.gameId,
                isHost: true
            });
            
            // También enviar información completa del juego
            setTimeout(() => {
                console.log('📡 Transmitiendo estado inicial del juego...');
                this.broadcastGameState();
            }, 2000); // Esperar 2 segundos para que los tesoros se generen
            
            // Enviar gameId inmediatamente para que los clientes puedan unirse
            setTimeout(() => {
                console.log('📡 Transmitiendo gameId para unión inmediata...');
                this.game.networkManager.sendGameEvent({
                    type: 'treasure_game_id',
                    gameId: this.gameId,
                    isHost: true
                });
            }, 500); // Enviar después de 500ms
            
            // Reenviar gameId varias veces para asegurar recepción
            const resendInterval = setInterval(() => {
                if (this.isActive && this.isHost) {
                    console.log('📡 Reenviando gameId para asegurar recepción...');
                    this.game.networkManager.sendGameEvent({
                        type: 'treasure_game_id',
                        gameId: this.gameId,
                        isHost: true
                    });
                } else {
                    clearInterval(resendInterval);
                }
            }, 3000); // Reenviar cada 3 segundos
            
            // Limpiar el intervalo después de 15 segundos
            setTimeout(() => {
                clearInterval(resendInterval);
            }, 15000);
        } else {
            console.log('⚠️ No se pudo enviar evento: multiplayer=', this.game.isMultiplayer, 'networkManager=', !!this.game.networkManager, 'connected=', this.game.networkManager?.isConnected);
        }
    }

    // Método para unirse a un juego existente
    joinGame(gameId) {
        console.log('🎯 Uniéndose al juego de tesoros:', gameId);
        this.isActive = true;
        this.gameId = gameId;
        this.isHost = false;
        this.collectedTreasures.clear();
        this.playerScores.clear();
        
        console.log('🎯 Creando UI del juego...');
        // Crear UI del juego
        this.createGameUI();
        
        // Mostrar mensaje de unión
        this.showGameMessage('🎯 ¡Te has unido a la Caza del Tesoro!');
        
        // Solicitar información del juego al host
        if (this.game.isMultiplayer && this.game.networkManager && this.game.networkManager.isConnected) {
            console.log('🎯 Solicitando información del juego al host...');
            this.game.networkManager.sendGameEvent({
                type: 'treasure_game_request_info',
                gameId: this.gameId
            });
        } else {
            console.log('⚠️ No se pudo solicitar información: multiplayer=', this.game.isMultiplayer, 'networkManager=', !!this.game.networkManager, 'connected=', this.game.networkManager?.isConnected);
        }
        
        // Si no somos host, también solicitar el estado completo
        if (!this.isHost) {
            setTimeout(() => {
                console.log('🎯 Solicitando estado completo del juego...');
                this.game.networkManager.sendGameEvent({
                    type: 'treasure_game_request_state',
                    gameId: this.gameId
                });
            }, 1000);
        }
    }

    stop() {
        console.log('⏹️ SimpleTreasureGame detenido');
        this.isActive = false;
        this.removeGameUI();
        this.removeTreasures();
        
        // Enviar evento de fin a otros jugadores
        if (this.game.isMultiplayer && this.game.networkManager && this.game.networkManager.isConnected) {
            this.game.networkManager.sendGameEvent({
                type: 'treasure_game_end',
                gameId: this.gameId
            });
        }
    }

    generateTreasures() {
        // Obtener lista de objetos disponibles
        const availableItems = Object.keys(ASSET_MAPPING);
        
        // Limpiar tesoros anteriores
        this.removeTreasures();
        this.treasures = [];
        
        // Generar posiciones aleatorias para los tesoros
        for (let i = 0; i < this.treasureCount; i++) {
            const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
            const position = this.getRandomPosition();
            
            // Crear el objeto usando el sistema del juego y capturar el ID
            const objectId = this.game.generateObject(randomItem, position);
            
            // Guardar referencia del tesoro con el objectId
            const treasureId = `treasure_${this.gameId}_${i}`;
            this.treasures.push({
                id: treasureId,
                item: randomItem,
                position: position,
                collected: false,
                objectId: objectId // Asignar el ID del objeto creado
            });
            
            // Agregar efecto visual especial al tesoro después de un delay
            setTimeout(() => {
                this.addTreasureEffect(randomItem);
            }, 1000); // Esperar 1 segundo para que el objeto se cree
        }
        
        // Enviar información de tesoros a otros jugadores
        if (this.game.isMultiplayer && this.game.networkManager && this.game.networkManager.isConnected) {
            this.game.networkManager.sendGameEvent({
                type: 'treasure_game_treasures',
                gameId: this.gameId,
                treasures: this.treasures
            });
        }
    }

    // Método para recibir tesoros del host
    receiveTreasures(treasures) {
        this.treasures = treasures;
        
        // Crear los objetos en la escena local
        for (const treasure of this.treasures) {
            // Crear el objeto y asignar el objectId
            const objectId = this.game.generateObject(treasure.item, treasure.position);
            treasure.objectId = objectId;
            
            // Agregar efecto visual especial al tesoro después de un delay
            setTimeout(() => {
                this.addTreasureEffect(treasure.item);
            }, 1000); // Esperar 1 segundo para que el objeto se cree
        }
    }
    
    // Método para enviar el estado completo del juego a todos los jugadores
    broadcastGameState() {
        if (!this.isHost || !this.isActive) return;
        
        if (this.game.isMultiplayer && this.game.networkManager && this.game.networkManager.isConnected) {
            this.game.networkManager.sendGameEvent({
                type: 'treasure_game_state',
                gameId: this.gameId,
                treasures: this.treasures,
                collectedTreasures: Array.from(this.collectedTreasures),
                playerScores: Object.fromEntries(this.playerScores),
                startTime: this.startTime
            });
        }
    }
    
    // Método para recibir información completa del juego del host
    receiveGameInfo(event) {
        
        // Actualizar tesoros
        this.treasures = event.treasures || [];
        
        // Actualizar tesoros recolectados
        this.collectedTreasures = new Set(event.collectedTreasures || []);
        
        // Actualizar puntuaciones
        this.playerScores = new Map(Object.entries(event.playerScores || {}));
        
        // Actualizar tiempo de inicio
        if (event.startTime) {
            this.startTime = event.startTime;
        }
        
        // Crear objetos de tesoros que aún no han sido recolectados
        for (const treasure of this.treasures) {
            if (!treasure.collected) {
                // Crear el objeto y asignar el objectId
                const objectId = this.game.generateObject(treasure.item, treasure.position);
                treasure.objectId = objectId;
                
                // Agregar efecto visual especial al tesoro después de un delay
                setTimeout(() => {
                    this.addTreasureEffect(treasure.item);
                }, 1000);
            }
        }
        
        // Actualizar UI
        this.updateGameUI();
        this.updatePlayerScores();
    }

    getRandomPosition() {
        // Generar posición aleatoria adaptada al ambiente urbano
        // Usar un área más pequeña para que los tesoros estén en las calles
        const x = (Math.random() - 0.5) * 30; // -15 a +15 (área urbana)
        const z = (Math.random() - 0.5) * 30; // -15 a +15 (área urbana)
        const y = 0.5; // Elevar un poco del suelo para evitar clipping
        
        return { x, y, z };
    }

    createGameUI() {
        // Remover UI anterior si existe
        this.removeGameUI();
        
        // Crear contenedor principal
        this.gameUI = document.createElement('div');
        this.gameUI.id = 'simpleTreasureGameUI';
        this.gameUI.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            z-index: 1000;
            min-width: 250px;
            border: 2px solid #ffd700;
        `;
        
        // Contenido de la UI
        this.gameUI.innerHTML = `
            <div style="margin-bottom: 10px;">
                <h3 style="margin: 0; color: #ffd700;">🎯 Caza del Tesoro</h3>
                <small style="color: #ccc;">${this.isHost ? 'Host' : 'Jugador'}</small>
            </div>
            <div style="margin-bottom: 10px;">
                <span>🎁 Tesoros encontrados: </span>
                <span id="treasureCount">0</span>
                <span>/ ${this.treasureCount}</span>
            </div>
            <div style="margin-bottom: 10px;">
                <span>⏱️ Tiempo: </span>
                <span id="gameTime">00:00</span>
            </div>
            <div id="playerScores" style="margin-bottom: 10px; font-size: 12px;">
                <!-- Puntuaciones de jugadores -->
            </div>
            <div style="font-size: 12px; color: #ccc;">
                💡 Acércate a los objetos brillantes para recolectarlos
            </div>
        `;
        
        document.body.appendChild(this.gameUI);
        
        // Iniciar timer
        this.startTime = Date.now();
        this.updateTimer();
        this.updatePlayerScores();
    }

    updateTimer() {
        if (!this.isActive || !this.gameUI) return;
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timeElement = this.gameUI.querySelector('#gameTime');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
        
        // Actualizar cada segundo
        setTimeout(() => this.updateTimer(), 1000);
    }

    updatePlayerScores() {
        if (!this.gameUI) return;
        
        const scoresElement = this.gameUI.querySelector('#playerScores');
        if (scoresElement) {
            let scoresHTML = '<div style="margin-bottom: 5px;"><strong>Puntuaciones:</strong></div>';
            
            for (const [playerId, score] of this.playerScores) {
                let playerName = playerId === 'local' ? 'Tú' : playerId;
                
                // Intentar obtener el nombre real del jugador desde el networkManager
                if (playerId !== 'local' && this.game.networkManager) {
                    const player = this.game.networkManager.getPlayer(playerId);
                    if (player && player.name) {
                        playerName = player.name;
                    }
                }
                
                scoresHTML += `<div>${playerName}: ${score} tesoros</div>`;
            }
            
            scoresElement.innerHTML = scoresHTML;
        }
    }
    
    // Método para mostrar notificación sutil en la UI pequeña
    showSubtleNotification(message) {
        if (!this.gameUI) return;
        
        // Crear notificación temporal en la UI del juego
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #ffd700;
            padding: 8px 12px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1002;
            border: 1px solid #ffd700;
            animation: fadeInOut 3s ease-in-out;
        `;
        notification.textContent = message;
        
        // Agregar animación CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(20px); }
                20% { opacity: 1; transform: translateX(0); }
                80% { opacity: 1; transform: translateX(0); }
                100% { opacity: 0; transform: translateX(20px); }
            }
        `;
        document.head.appendChild(style);
        
        this.gameUI.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    removeGameUI() {
        if (this.gameUI && this.gameUI.parentNode) {
            this.gameUI.parentNode.removeChild(this.gameUI);
            this.gameUI = null;
        }
    }

    removeTreasures() {
        // Remover objetos de tesoro de la escena usando el mismo sistema que la tecla C
        for (const treasure of this.treasures) {
            if (treasure.objectId) {
                // Buscar y remover el objeto de la escena
                const object = this.game.objects.get(treasure.objectId);
                if (object && object.mesh) {
                    // Usar el mismo sistema que clearAllObjects
                    this.game.scene.remove(object.mesh);
                    this.game.playerController.removeInteractableObject(object);
                    this.game.objects.delete(treasure.objectId);
                }
            }
        }
        
        // Limpiar la lista de tesoros
        this.treasures = [];
        
        // Enviar evento al servidor si estamos en multijugador
        if (this.game.isMultiplayer && this.game.networkManager && this.game.networkManager.isConnected) {
            this.game.networkManager.sendClearAllObjects();
        }
    }
    
    cleanupTreasureEffects() {
        // Limpiar efectos de tesoro de todos los objetos en la escena
        const objects = this.game.objects;
        
        for (const [id, object] of objects) {
            if (object.userData && object.userData.isTreasureEffect) {
                // Remover el efecto de tesoro
                delete object.userData.isTreasureEffect;
                
                // Restaurar material original si existe
                if (object.mesh && object.mesh.material) {
                    const material = object.mesh.material;
                    if (material.emissive) {
                        material.emissive.setHex(0x000000);
                        material.emissiveIntensity = 0;
                    }
                }
            }
        }
    }

    showGameMessage(message) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            font-size: 18px;
            z-index: 1001;
            border: 2px solid #ffd700;
            text-align: center;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Método para verificar si un jugador recolectó un tesoro
    checkTreasureCollection(playerId, playerPosition) {
        if (!this.isActive) return;
        
        for (const treasure of this.treasures) {
            if (treasure.collected) continue;
            
            const distance = Math.sqrt(
                Math.pow(playerPosition.x - treasure.position.x, 2) +
                Math.pow(playerPosition.z - treasure.position.z, 2)
            );
            
            if (distance < 2) { // Radio de recolección de 2 unidades
                this.collectTreasure(playerId, treasure);
            }
        }
    }

    collectTreasure(playerId, treasure) {
        treasure.collected = true;
        this.collectedTreasures.add(treasure.id);
        
        // Actualizar puntuación
        const currentScore = this.playerScores.get(playerId) || 0;
        this.playerScores.set(playerId, currentScore + 1);
        
        this.showGameMessage(`🎁 ¡Tesoro encontrado! ${treasure.item}`);
        
        // Hacer desaparecer el objeto
        this.removeTreasureObject(treasure);
        
        // Actualizar UI
        this.updateGameUI();
        this.updatePlayerScores();
        
        // Enviar evento de recolección a otros jugadores
        if (this.game.isMultiplayer && this.game.networkManager && this.game.networkManager.isConnected) {
            // Obtener el nombre del jugador
            let playerName = null;
            if (playerId === 'local') {
                // Obtener información del jugador local
                const localPlayer = this.game.networkManager.getPlayer(this.game.networkManager.playerId);
                playerName = localPlayer ? localPlayer.name : 'Tú';
            } else {
                // Obtener información de otros jugadores
                const player = this.game.networkManager.getPlayer(playerId);
                if (player && player.name) {
                    playerName = player.name;
                }
            }
            
            this.game.networkManager.sendGameEvent({
                type: 'treasure_collected',
                gameId: this.gameId,
                treasureId: treasure.id,
                playerId: playerId,
                playerName: playerName,
                item: treasure.item
            });
            
            // Si es el host, también transmitir el estado actualizado
            if (this.isHost) {
                setTimeout(() => {
                    this.broadcastGameState();
                }, 500);
            }
        }
        
        // Verificar si el juego terminó
        if (this.collectedTreasures.size >= this.treasureCount) {
            this.endGame();
        }
    }

    // Método para remover un objeto de tesoro específico
    removeTreasureObject(treasure) {
        // Si tenemos el objectId, usarlo directamente
        if (treasure.objectId) {
            const object = this.game.objects.get(treasure.objectId);
            if (object && object.mesh) {
                // Remover de la escena
                this.game.scene.remove(object.mesh);
                this.game.objects.delete(treasure.objectId);
            }
        } else {
            // Fallback: buscar el objeto en la escena por nombre y posición
            const objects = this.game.objects;
            for (const [objectId, object] of objects) {
                if (object.name === treasure.item) {
                    // Verificar si está cerca de la posición del tesoro
                    const distance = object.mesh.position.distanceTo(new THREE.Vector3(treasure.position.x, treasure.position.y, treasure.position.z));
                    if (distance < 1) {
                        // Remover de la escena
                        if (object.mesh) {
                            this.game.scene.remove(object.mesh);
                        }
                        this.game.objects.delete(objectId);
                        
                        // Marcar como recolectado
                        treasure.objectId = objectId;
                        break;
                    }
                }
            }
        }
    }

    // Método para recibir notificación de recolección de otro jugador
    receiveTreasureCollection(treasureId, playerId, item, playerName = null) {
        
        // Actualizar puntuación
        const currentScore = this.playerScores.get(playerId) || 0;
        this.playerScores.set(playerId, currentScore + 1);
        
        // Marcar tesoro como recolectado
        const treasure = this.treasures.find(t => t.id === treasureId);
        if (treasure) {
            treasure.collected = true;
            this.collectedTreasures.add(treasure.id);
            
            // Remover objeto de la escena
            this.removeTreasureObject(treasure);
        }
        
        // Actualizar UI
        this.updateGameUI();
        this.updatePlayerScores();
        
        // Solo mostrar notificación gigante si es el jugador local
        if (playerId === 'local') {
            const displayName = 'Tú';
            this.showGameMessage(`🎁 ${displayName} encontró: ${item}`);
        } else {
            // Para otros jugadores, mostrar notificación sutil en la UI pequeña
            // Usar playerName si está disponible, sino buscar en networkManager
            let displayName = playerName || playerId;
            if (!playerName && this.game.networkManager) {
                const player = this.game.networkManager.getPlayer(playerId);
                if (player && player.name) {
                    displayName = player.name;
                }
            }
            this.showSubtleNotification(`🎁 ${displayName} encontró: ${item}`);
        }
        
        // Verificar si el juego terminó
        if (this.collectedTreasures.size >= this.treasureCount) {
            this.endGame();
        }
    }

    updateGameUI() {
        if (!this.gameUI) return;
        
        const countElement = this.gameUI.querySelector('#treasureCount');
        if (countElement) {
            countElement.textContent = this.collectedTreasures.size;
        }
    }

    endGame() {
        this.isActive = false;
        
        // Determinar ganador
        let winner = null;
        let highestScore = 0;
        
        for (const [playerId, score] of this.playerScores) {
            if (score > highestScore) {
                highestScore = score;
                winner = playerId;
            }
        }
        
        let winnerMessage;
        if (winner) {
            let winnerName = winner === 'local' ? 'Tú' : winner;
            
            // Intentar obtener el nombre real del ganador desde el networkManager
            if (winner !== 'local' && this.game.networkManager) {
                const player = this.game.networkManager.getPlayer(winner);
                if (player && player.name) {
                    winnerName = player.name;
                }
            }
            
            winnerMessage = `🏆 ¡Ganador: ${winnerName}!`;
        } else {
            winnerMessage = '🤝 ¡Empate!';
        }
        
        this.showGameMessage(`🎯 ¡Juego terminado! ${winnerMessage}`);
        
        // Limpiar todos los objetos del tesoro de la escena usando el sistema de tecla C
        this.removeTreasures();
        
        // Limpiar efectos de tesoro de objetos existentes
        this.cleanupTreasureEffects();
        
        // Enviar evento de fin a otros jugadores
        if (this.game.isMultiplayer && this.game.networkManager && this.game.networkManager.isConnected) {
            this.game.networkManager.sendGameEvent({
                type: 'treasure_game_end',
                gameId: this.gameId,
                winner: winner,
                scores: Object.fromEntries(this.playerScores)
            });
        }
        
        // Remover UI después de 5 segundos
        setTimeout(() => {
            this.removeGameUI();
        }, 5000);
    }

    // Método para procesar comandos del chat
    processCommand(message, playerId) {
        if (!this.isActive) return false;
        
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage === 'fin juego' || lowerMessage === 'end game') {
            this.endGame();
            return true;
        }
        
        if (lowerMessage === 'estado' || lowerMessage === 'status') {
            const status = `🎯 Estado: ${this.collectedTreasures.size}/${this.treasureCount} tesoros recolectados`;
            this.showGameMessage(status);
            return true;
        }
        
        if (lowerMessage === 'limpiar tesoros' || lowerMessage === 'clean treasures') {
            console.log('🧹 Limpieza manual de tesoros...');
            this.removeTreasures();
            this.cleanupTreasureEffects();
            this.showGameMessage('🧹 Tesoros limpiados manualmente');
            return true;
        }
        
        if (lowerMessage === 'limpiar todo' || lowerMessage === 'clear all') {
            console.log('🧹 Limpieza completa usando sistema de tecla C...');
            this.game.clearAllObjects();
            this.cleanupTreasureEffects();
            this.showGameMessage('🧹 Todos los objetos limpiados');
            return true;
        }
        
        return false;
    }

    // Método para procesar eventos del network
    processNetworkEvent(event) {
        
        // Permitir eventos especiales sin verificación de gameId
        if (event.type === 'treasure_game_id' || event.type === 'test_client_event') {
            // Evento especial procesado
        } else if (!event.gameId || event.gameId !== this.gameId) {
            return false;
        }
        
        switch (event.type) {
            case 'treasure_game_start':
                if (!this.isActive) {
                    this.joinGame(event.gameId);
                } else if (this.gameId === event.gameId && !this.isHost) {
                    // Si ya estamos en el juego pero no somos host, solicitar información actualizada
                    this.game.networkManager.sendGameEvent({
                        type: 'treasure_game_request_info',
                        gameId: this.gameId
                    });
                }
                return true;
                
            case 'treasure_game_id':
                if (!this.isActive && !this.isHost) {
                    this.joinGame(event.gameId);
                }
                return true;
                
            case 'treasure_game_treasures':
                if (!this.isHost) {
                    this.receiveTreasures(event.treasures);
                }
                return true;
                
            case 'treasure_game_request_info':
                if (this.isHost && this.isActive) {
                    // Enviar información del juego al jugador que la solicita
                    this.game.networkManager.sendGameEvent({
                        type: 'treasure_game_info',
                        gameId: this.gameId,
                        treasures: this.treasures,
                        collectedTreasures: Array.from(this.collectedTreasures),
                        playerScores: Object.fromEntries(this.playerScores),
                        startTime: this.startTime
                    });
                }
                return true;
                
            case 'treasure_game_request_state':
                if (this.isHost && this.isActive) {
                    // Enviar estado completo del juego
                    this.game.networkManager.sendGameEvent({
                        type: 'treasure_game_state',
                        gameId: this.gameId,
                        treasures: this.treasures,
                        collectedTreasures: Array.from(this.collectedTreasures),
                        playerScores: Object.fromEntries(this.playerScores),
                        startTime: this.startTime
                    });
                }
                return true;
                
            case 'treasure_game_info':
                if (!this.isHost && this.isActive) {
                    // Recibir información del juego del host
                    this.receiveGameInfo(event);
                }
                return true;
                
            case 'treasure_game_state':
                if (!this.isHost && this.isActive) {
                    // Recibir estado completo del juego del host
                    this.receiveGameInfo(event);
                }
                return true;
                
            case 'treasure_collected':
                this.receiveTreasureCollection(event.treasureId, event.playerId, event.item, event.playerName);
                return true;
                
            case 'treasure_game_end':
                if (this.isActive) {
                    this.isActive = false;
                    this.showGameMessage(`🎯 ¡Juego terminado! Ganador: ${event.winner || 'Empate'}`);
                    
                    // Limpiar objetos del tesoro también en el cliente
                    console.log('🧹 Cliente limpiando objetos del tesoro...');
                    this.removeTreasures();
                    this.cleanupTreasureEffects();
                    
                    setTimeout(() => this.removeGameUI(), 5000);
                }
                return true;
                
            case 'test_client_event':
                this.showGameMessage('🧪 Evento de prueba recibido del host');
                return true;
        }
        
        return false;
    }
    
    setupNetworkListener() {
        // Verificar periódicamente si hay juegos activos para unirse
        setInterval(() => {
            if (!this.isActive && this.game.isMultiplayer && this.game.networkManager && this.game.networkManager.isConnected) {
                // Si no estamos en un juego activo, escuchar eventos de juego
            }
        }, 5000); // Verificar cada 5 segundos
    }
    
    addTreasureEffect(itemName) {
        // Buscar el objeto en la escena por nombre
        const objects = this.game.objects;
        for (const [id, object] of objects) {
            if (object.name === itemName) {
                // Verificar si ya tiene el efecto
                if (object.userData && object.userData.isTreasureEffect) {
                    break;
                }
                
                // Inicializar userData si no existe
                if (!object.userData) {
                    object.userData = {};
                }
                
                // Marcar como objeto de tesoro
                object.userData.isTreasureEffect = true;
                
                // Agregar brillo dorado
                if (object.mesh) {
                    // Crear material brillante
                    const originalMaterial = object.mesh.material;
                    if (originalMaterial) {
                        // Hacer el material más brillante
                        originalMaterial.emissive = new THREE.Color(0xffff00);
                        originalMaterial.emissiveIntensity = 0.3;
                        
                        // Agregar animación de brillo
                        this.animateTreasure(object.mesh);
                    }
                }
                break;
            }
        }
    }
    
    animateTreasure(mesh) {
        if (!this.isActive || !mesh) return;
        
        // Animación de brillo pulsante
        const time = Date.now() * 0.003;
        const intensity = 0.2 + Math.sin(time) * 0.1;
        
        if (mesh.material && mesh.material.emissiveIntensity !== undefined) {
            mesh.material.emissiveIntensity = intensity;
        }
        
        // Continuar animación
        requestAnimationFrame(() => this.animateTreasure(mesh));
    }
}

// Hacer la clase globalmente accesible
window.SimpleTreasureGame = SimpleTreasureGame; 