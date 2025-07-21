import { AssetManager } from './AssetManager.js';
import { ASSET_MAPPING } from '../config/AssetConfig.js';

export class TreasureHuntGame {
    constructor(game3D) {
        this.game3D = game3D;
        this.isActive = false;
        this.currentPhase = 'waiting'; // waiting, hunting, finished
        this.timeLimit = 300; // 5 minutos
        this.timeRemaining = this.timeLimit;
        this.players = new Map();
        this.treasures = new Map();
        this.collectedTreasures = new Map(); // playerId -> Set of treasureIds
        this.gameStartTime = null;
        
        // Configuración del juego
        this.config = {
            treasureCount: 10,
            huntTime: 300, // 5 minutos para encontrar todos
            spawnRadius: 20, // Radio donde aparecen los tesoros
            minDistance: 3, // Distancia mínima entre tesoros
            collectionDistance: 2 // Distancia para recolectar tesoro
        };
        
        // Lista de objetos disponibles para tesoros (basada en ASSET_MAPPING)
        this.treasureItems = this.generateTreasureItemsFromMapping();
        
        this.setupUI();
    }
    
    // Generar lista de tesoros desde ASSET_MAPPING
    generateTreasureItemsFromMapping() {
        const items = [];
        
        // Extraer palabras clave de ASSET_MAPPING
        for (const [keyword, config] of Object.entries(ASSET_MAPPING)) {
            // Agregar la palabra clave principal
            items.push(keyword);
            
            // Agregar variaciones en inglés si existen
            const englishVariations = {
                'escritorio': 'desk',
                'mesa': 'table',
                'silla': 'chair',
                'sofá': 'couch',
                'estante': 'shelf',
                'gabinete': 'cabinet',
                'computadora': 'computer',
                'monitor': 'monitor',
                'teclado': 'keyboard',
                'mouse': 'mouse',
                'teléfono': 'phone',
                'impresora': 'printer',
                'lámpara': 'lamp',
                'planta': 'plant',
                'arte': 'art',
                'trofeo': 'trophy',
                'pizarra': 'whiteboard',
                'alfombra': 'rug',
                'taza': 'cup',
                'café': 'coffee',
                'hamburguesa': 'hamburger',
                'pizza': 'pizza',
                'soda': 'soda',
                'taco': 'taco',
                'perro caliente': 'hot dog',
                'papas fritas': 'fries',
                'helado': 'ice cream',
                'pastel': 'cake',
                'reloj': 'clock',
                'jarrón': 'vase',
                'vela': 'candle',
                'caja': 'box',
                'canasta': 'basket',
                'contenedor': 'container',
                'herramienta': 'tool',
                'libro': 'book',
                'revista': 'magazine'
            };
            
            if (englishVariations[keyword]) {
                items.push(englishVariations[keyword]);
            }
        }
        
        // Agregar algunos objetos adicionales que no están en el mapeo
        const additionalItems = [
            'bed', 'bookshelf', 'nightstand', 'coffee table', 'sofa',
            'vase', 'candle', 'basket', 'bin', 'container', 'tool'
        ];
        
        items.push(...additionalItems);
        
        // Remover duplicados y retornar
        return [...new Set(items)];
    }
    
    // Inicializar el minijuego
    start() {
        console.log('🎯 Iniciando Cazador de Tesoros!');
        this.isActive = true;
        this.currentPhase = 'hunting';
        this.timeRemaining = this.config.huntTime;
        this.gameStartTime = Date.now();
        this.treasures.clear();
        this.collectedTreasures.clear();
        this.players.clear();
        
        // Generar tesoros aleatorios
        this.generateTreasures();
        
        this.showGameMessage('🎯 ¡Cazador de Tesoros iniciado! Encuentra los 10 tesoros escondidos');
        this.showGameMessage('💡 Acércate a los objetos para recolectarlos automáticamente');
        this.showGameMessage('🏆 ¡El primer jugador en recolectar todos los tesoros gana!');
        this.updateUI();
        this.startTimer();
    }
    
    // Detener el minijuego
    stop() {
        console.log('🎯 Finalizando Cazador de Tesoros');
        this.isActive = false;
        this.currentPhase = 'waiting';
        this.hideUI();
        this.stopTimer();
        
        // Limpiar tesoros del mundo
        this.clearTreasures();
    }
    
    // Generar tesoros aleatorios
    generateTreasures() {
        console.log('🎁 Generando tesoros aleatorios...');
        
        const usedPositions = [];
        const selectedItems = this.getRandomItems(this.config.treasureCount);
        
        for (let i = 0; i < this.config.treasureCount; i++) {
            const treasureId = `treasure_${Date.now()}_${i}`;
            const itemName = selectedItems[i];
            const position = this.findValidPosition(usedPositions);
            
            if (position) {
                usedPositions.push(position);
                
                // Crear el objeto en el mundo
                try {
                    this.game3D.generateObject(itemName);
                    
                    // Registrar el tesoro
                    this.treasures.set(treasureId, {
                        id: treasureId,
                        name: itemName,
                        position: position,
                        collected: false,
                        collectedBy: null,
                        collectedAt: null,
                        objectId: null // Se asignará cuando se cree el objeto
                    });
                    
                    console.log(`🎁 Tesoro ${i + 1}: ${itemName} en ${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`);
                } catch (error) {
                    console.error(`❌ Error creando tesoro ${itemName}:`, error);
                }
            }
        }
        
        this.showGameMessage(`🎁 ¡${this.treasures.size} tesoros generados! ¡A buscarlos!`);
    }
    
    // Obtener items aleatorios
    getRandomItems(count) {
        const shuffled = [...this.treasureItems].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    // Encontrar posición válida para tesoro
    findValidPosition(usedPositions, maxAttempts = 50) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Generar posición aleatoria dentro del radio
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.config.spawnRadius;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            const y = 1; // Altura fija
            
            const position = { x, y, z };
            
            // Verificar que esté suficientemente lejos de otros tesoros
            let valid = true;
            for (const usedPos of usedPositions) {
                const dist = Math.sqrt(
                    Math.pow(position.x - usedPos.x, 2) + 
                    Math.pow(position.z - usedPos.z, 2)
                );
                if (dist < this.config.minDistance) {
                    valid = false;
                    break;
                }
            }
            
            if (valid) {
                return position;
            }
        }
        
        // Si no se encuentra posición válida, usar una aleatoria
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.config.spawnRadius;
        return {
            x: Math.cos(angle) * distance,
            y: 1,
            z: Math.sin(angle) * distance
        };
    }
    
    // Verificar recolección de tesoros
    checkTreasureCollection(playerId, playerPosition) {
        if (!this.isActive || this.currentPhase !== 'hunting') return;
        
        for (const [treasureId, treasure] of this.treasures) {
            if (treasure.collected) continue;
            
            const distance = Math.sqrt(
                Math.pow(playerPosition.x - treasure.position.x, 2) + 
                Math.pow(playerPosition.z - treasure.position.z, 2)
            );
            
            if (distance <= this.config.collectionDistance) {
                this.collectTreasure(treasureId, playerId);
            }
        }
    }
    
    // Recolectar tesoro
    collectTreasure(treasureId, playerId) {
        const treasure = this.treasures.get(treasureId);
        if (!treasure || treasure.collected) return;
        
        treasure.collected = true;
        treasure.collectedBy = playerId;
        treasure.collectedAt = Date.now();
        
        // Inicializar colección del jugador si no existe
        if (!this.collectedTreasures.has(playerId)) {
            this.collectedTreasures.set(playerId, new Set());
        }
        
        this.collectedTreasures.get(playerId).add(treasureId);
        
        const playerName = this.getPlayerName(playerId);
        const collectedCount = this.collectedTreasures.get(playerId).size;
        
        this.showGameMessage(`🎁 ¡${playerName} recolectó ${treasure.name}! (${collectedCount}/${this.config.treasureCount})`);
        
        // Verificar si el jugador ganó
        if (collectedCount >= this.config.treasureCount) {
            this.endGame(playerId);
        }
        
        this.updateUI();
    }
    
    // Obtener nombre del jugador
    getPlayerName(playerId) {
        if (playerId === 'local') return 'Tú';
        return this.players.get(playerId)?.name || `Jugador ${playerId}`;
    }
    
    // Finalizar juego
    endGame(winnerId) {
        this.currentPhase = 'finished';
        const winnerName = this.getPlayerName(winnerId);
        const gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        
        this.showGameMessage('🏆 === ¡JUEGO TERMINADO! ===');
        this.showGameMessage(`🏆 ¡${winnerName} es el ganador!`);
        this.showGameMessage(`⏱️ Tiempo: ${gameTime} segundos`);
        this.showGameMessage(`🎁 Tesoros recolectados: ${this.config.treasureCount}/${this.config.treasureCount}`);
        
        // Mostrar estadísticas de todos los jugadores
        this.showPlayerStats();
        
        // Detener el juego después de 5 segundos
        setTimeout(() => {
            this.stop();
        }, 5000);
    }
    
    // Mostrar estadísticas de jugadores
    showPlayerStats() {
        this.showGameMessage('📊 === ESTADÍSTICAS FINALES ===');
        
        for (const [playerId, collectedSet] of this.collectedTreasures) {
            const playerName = this.getPlayerName(playerId);
            const count = collectedSet.size;
            this.showGameMessage(`👤 ${playerName}: ${count}/${this.config.treasureCount} tesoros`);
        }
    }
    
    // Limpiar tesoros del mundo
    clearTreasures() {
        this.game3D.clearAllObjects();
        this.treasures.clear();
        this.collectedTreasures.clear();
    }
    
    // Configurar interfaz del juego
    setupUI() {
        // Crear contenedor principal
        this.gameUI = document.createElement('div');
        this.gameUI.id = 'treasureHuntUI';
        this.gameUI.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: 'Arial', sans-serif;
            z-index: 1000;
            min-width: 280px;
            display: none;
        `;
        
        // Título del juego
        this.titleElement = document.createElement('h3');
        this.titleElement.textContent = '🎯 Cazador de Tesoros';
        this.titleElement.style.cssText = `
            margin: 0 0 10px 0;
            color: #ffd700;
            font-size: 16px;
        `;
        
        // Información de fase
        this.phaseElement = document.createElement('div');
        this.phaseElement.style.cssText = `
            margin: 5px 0;
            font-weight: bold;
            color: #00ff00;
        `;
        
        // Temporizador
        this.timerElement = document.createElement('div');
        this.timerElement.style.cssText = `
            margin: 5px 0;
            font-size: 18px;
            color: #ff6b6b;
        `;
        
        // Estadísticas
        this.statsElement = document.createElement('div');
        this.statsElement.style.cssText = `
            margin: 5px 0;
            font-size: 12px;
            color: #cccccc;
        `;
        
        // Progreso de tesoros
        this.progressElement = document.createElement('div');
        this.progressElement.style.cssText = `
            margin: 10px 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            padding: 10px;
        `;
        
        // Botones de control
        this.controlsElement = document.createElement('div');
        this.controlsElement.style.cssText = `
            margin: 10px 0 0 0;
            display: flex;
            gap: 10px;
        `;
        
        // Botón de inicio
        this.startButton = document.createElement('button');
        this.startButton.textContent = '🎯 Iniciar Caza';
        this.startButton.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        this.startButton.onclick = () => this.start();
        
        // Botón de parada
        this.stopButton = document.createElement('button');
        this.stopButton.textContent = '⏹️ Parar Juego';
        this.stopButton.style.cssText = `
            background: #f44336;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        this.stopButton.onclick = () => this.stop();
        
        // Botón de limpiar
        this.clearButton = document.createElement('button');
        this.clearButton.textContent = '🧹 Limpiar';
        this.clearButton.style.cssText = `
            background: #ff9800;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        this.clearButton.onclick = () => this.clearTreasures();
        
        // Ensamblar UI
        this.controlsElement.appendChild(this.startButton);
        this.controlsElement.appendChild(this.stopButton);
        this.controlsElement.appendChild(this.clearButton);
        
        this.gameUI.appendChild(this.titleElement);
        this.gameUI.appendChild(this.phaseElement);
        this.gameUI.appendChild(this.timerElement);
        this.gameUI.appendChild(this.statsElement);
        this.gameUI.appendChild(this.progressElement);
        this.gameUI.appendChild(this.controlsElement);
        
        document.body.appendChild(this.gameUI);
    }
    
    // Mostrar/ocultar UI
    showUI() {
        if (this.gameUI) {
            this.gameUI.style.display = 'block';
        }
    }
    
    hideUI() {
        if (this.gameUI) {
            this.gameUI.style.display = 'none';
        }
    }
    
    // Actualizar interfaz
    updateUI() {
        if (!this.isActive) return;
        
        // Actualizar fase
        const phaseNames = {
            'waiting': '⏳ Esperando',
            'hunting': '🎯 Cazando',
            'finished': '🏆 Terminado'
        };
        
        this.phaseElement.textContent = `Fase: ${phaseNames[this.currentPhase] || this.currentPhase}`;
        
        // Actualizar temporizador
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timerElement.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Actualizar estadísticas
        const treasureCount = this.treasures.size;
        const collectedCount = Array.from(this.treasures.values()).filter(t => t.collected).length;
        const playerCount = this.collectedTreasures.size;
        this.statsElement.textContent = `🎁 Tesoros: ${collectedCount}/${treasureCount} | 👥 Jugadores: ${playerCount}`;
        
        // Actualizar progreso
        this.updateProgress();
        
        // Cambiar color del temporizador según el tiempo restante
        if (this.timeRemaining <= 30) {
            this.timerElement.style.color = '#ff0000';
        } else if (this.timeRemaining <= 60) {
            this.timerElement.style.color = '#ffaa00';
        } else {
            this.timerElement.style.color = '#ff6b6b';
        }
    }
    
    // Actualizar barra de progreso
    updateProgress() {
        const collectedCount = Array.from(this.treasures.values()).filter(t => t.collected).length;
        const totalCount = this.treasures.size;
        const percentage = totalCount > 0 ? (collectedCount / totalCount) * 100 : 0;
        
        this.progressElement.innerHTML = `
            <div style="margin-bottom: 5px; font-weight: bold; color: #ffd700;">📊 Progreso Global</div>
            <div style="background: rgba(255, 255, 255, 0.2); border-radius: 3px; height: 20px; position: relative;">
                <div style="background: linear-gradient(90deg, #4CAF50, #8BC34A); height: 100%; width: ${percentage}%; border-radius: 3px; transition: width 0.3s;"></div>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 12px; font-weight: bold;">
                    ${collectedCount}/${totalCount}
                </div>
            </div>
        `;
    }
    
    // Temporizador del juego
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.isActive && this.timeRemaining > 0) {
                this.timeRemaining--;
                this.updateUI();
                
                // Terminar juego si se acaba el tiempo
                if (this.timeRemaining === 0) {
                    this.endGameTime();
                }
                
                // Advertencias de tiempo
                if (this.timeRemaining === 30) {
                    this.showGameMessage('⚠️ ¡30 segundos restantes!');
                } else if (this.timeRemaining === 10) {
                    this.showGameMessage('🚨 ¡10 segundos restantes!');
                }
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    // Terminar juego por tiempo
    endGameTime() {
        this.currentPhase = 'finished';
        
        this.showGameMessage('⏰ === ¡TIEMPO AGOTADO! ===');
        this.showGameMessage('⏰ Nadie recolectó todos los tesoros a tiempo');
        
        // Encontrar al jugador con más tesoros
        let winnerId = null;
        let maxCollected = 0;
        
        for (const [playerId, collectedSet] of this.collectedTreasures) {
            if (collectedSet.size > maxCollected) {
                maxCollected = collectedSet.size;
                winnerId = playerId;
            }
        }
        
        if (winnerId) {
            const winnerName = this.getPlayerName(winnerId);
            this.showGameMessage(`🏆 ${winnerName} recolectó más tesoros: ${maxCollected}/${this.config.treasureCount}`);
        } else {
            this.showGameMessage('😔 Nadie recolectó ningún tesoro');
        }
        
        this.showPlayerStats();
        
        // Detener el juego después de 5 segundos
        setTimeout(() => {
            this.stop();
        }, 5000);
    }
    
    // Registrar jugador
    registerPlayer(playerId, playerName) {
        this.players.set(playerId, {
            name: playerName,
            joinedAt: Date.now()
        });
    }
    
    // Mostrar mensaje del juego
    showGameMessage(message) {
        if (this.game3D && this.game3D.showChatMessage) {
            this.game3D.showChatMessage(`🎯 ${message}`);
        } else {
            console.log(`🎯 ${message}`);
        }
    }
    
    // Procesar comando del juego
    processCommand(command, playerId) {
        if (!this.isActive) return false;
        
        const lowerCommand = command.toLowerCase();
        
        // Comando de estado
        if (lowerCommand === 'estado' || lowerCommand === 'status') {
            this.showPlayerStatus(playerId);
            return true;
        }
        
        // Comando de ayuda
        if (lowerCommand === 'ayuda' || lowerCommand === 'help') {
            this.showHelp();
            return true;
        }
        
        return false; // No es un comando del juego
    }
    
    // Mostrar estado del jugador
    showPlayerStatus(playerId) {
        const collectedSet = this.collectedTreasures.get(playerId);
        const collectedCount = collectedSet ? collectedSet.size : 0;
        const playerName = this.getPlayerName(playerId);
        
        this.showGameMessage(`👤 ${playerName}: ${collectedCount}/${this.config.treasureCount} tesoros recolectados`);
    }
    
    // Mostrar ayuda
    showHelp() {
        this.showGameMessage('💡 === AYUDA ===');
        this.showGameMessage('🎯 Acércate a los objetos para recolectarlos automáticamente');
        this.showGameMessage('📊 Usa "estado" para ver tu progreso');
        this.showGameMessage('🏆 ¡El primer jugador en recolectar todos los tesoros gana!');
    }
    
    // Obtener estado del juego
    getGameState() {
        return {
            isActive: this.isActive,
            currentPhase: this.currentPhase,
            timeRemaining: this.timeRemaining,
            treasureCount: this.treasures.size,
            collectedCount: Array.from(this.treasures.values()).filter(t => t.collected).length,
            playerCount: this.collectedTreasures.size
        };
    }
}

// Hacer la clase globalmente accesible
window.TreasureHuntGame = TreasureHuntGame; 